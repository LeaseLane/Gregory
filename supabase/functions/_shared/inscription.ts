// « Inscrire mon entreprise » : vérifications du formulaire public et avis à l'équipe.
//
// Les messages sont ceux de la livraison design (LISEZMOI §4), mot pour mot : la page
// les affiche tels quels sous le champ renvoyé. Le type du fichier se lit dans ses
// premiers octets, jamais dans son nom ni dans le type annoncé par le navigateur.
import { EXPEDITEUR, SITE_BASE_URL } from "./branding.ts";
import { avecHtml, POURQUOI } from "./courriel.ts";

export const TAILLE_MAX = 10 * 1024 * 1024;
// Onglet privé du portail admin (connexion + deuxième facteur), jamais un lien signé.
export const LIEN_ADMIN = `${SITE_BASE_URL}/portail-admin`;

export const MESSAGES = {
  document_manquant: "Joignez votre preuve d’assurance (PDF, JPG ou PNG, 10 Mo maximum).",
  document_format: "Ce format n’est pas accepté. Choisissez un PDF, un JPG ou un PNG.",
  document_taille: "Ce fichier dépasse 10 Mo. Choisissez un PDF, un JPG ou un PNG de 10 Mo ou moins.",
  telephone_vide: "Entrez votre numéro de téléphone.",
  telephone_invalide: "Entrez un numéro à 10 chiffres, par exemple 418 555-0142.",
  poste: "Chiffres seulement.",
  courriel_vide: "Entrez votre adresse courriel.",
  courriel_invalide: "Ce courriel semble incomplet. Exemple : vous@entreprise.ca",
} as const;

// Pas de < > " \ ni de ponctuation d'adresse citée : le courriel est réaffiché dans le portail admin
// (attributs HTML, aperçu du document), où un guillemet suffirait à injecter du code.
const COURRIEL_RE = /^[^\s@<>"\\,;:()[\]]+@[^\s@<>"'\\,;:()[\]]+\.[^\s@<>"'\\,;:()[\]]{2,}$/;

export const courrielValide = (s: string) => s.length <= 200 && COURRIEL_RE.test(s);

// 10 chiffres, ou 11 commençant par 1; espaces, parenthèses, tirets, points et « + » tolérés.
export function chiffresTelephone(s: string): string | null {
  if (!/^[\d\s().+-]+$/.test(s)) return null;
  const d = s.replace(/\D/g, "");
  if (d.length === 10) return d;
  if (d.length === 11 && d[0] === "1") return d.slice(1);
  return null;
}

export const telephoneFormate = (d: string) => `${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}`;

export const posteValide = (s: string) => /^\d{1,6}$/.test(s);

const SIGNATURES = [
  { octets: [0x25, 0x50, 0x44, 0x46], ext: "pdf", mime: "application/pdf" }, // %PDF
  { octets: [0xff, 0xd8, 0xff], ext: "jpg", mime: "image/jpeg" },
  { octets: [0x89, 0x50, 0x4e, 0x47], ext: "png", mime: "image/png" },
];

export function typeFichier(debut: Uint8Array): { ext: string; mime: string } | null {
  const s = SIGNATURES.find((s) => s.octets.every((o, i) => debut[i] === o));
  return s ? { ext: s.ext, mime: s.mime } : null;
}

export type Champ = "courriel" | "telephone" | "poste" | "document";
export type Demande = { courriel: string; telephone: string; poste: string | null; octets: Uint8Array<ArrayBuffer>; type: { ext: string; mime: string } };

// Premier champ en erreur, dans l'ordre du formulaire (document, téléphone, poste, courriel).
export function validerInscription(f: { courriel?: unknown; telephone?: unknown; poste?: unknown; octets?: Uint8Array<ArrayBuffer> | null }):
  { ok: true; demande: Demande } | { ok: false; champ: Champ; error: string } {
  const courriel = String(f.courriel ?? "").trim().toLowerCase();
  const tel = String(f.telephone ?? "").trim();
  const poste = String(f.poste ?? "").trim();
  const octets = f.octets;
  if (!octets || !octets.length) return { ok: false, champ: "document", error: MESSAGES.document_manquant };
  if (octets.length > TAILLE_MAX) return { ok: false, champ: "document", error: MESSAGES.document_taille };
  const type = typeFichier(octets);
  if (!type) return { ok: false, champ: "document", error: MESSAGES.document_format };
  if (!tel) return { ok: false, champ: "telephone", error: MESSAGES.telephone_vide };
  const telephone = chiffresTelephone(tel);
  if (!telephone) return { ok: false, champ: "telephone", error: MESSAGES.telephone_invalide };
  if (poste && !posteValide(poste)) return { ok: false, champ: "poste", error: MESSAGES.poste };
  if (!courriel) return { ok: false, champ: "courriel", error: MESSAGES.courriel_vide };
  if (!courrielValide(courriel)) return { ok: false, champ: "courriel", error: MESSAGES.courriel_invalide };
  return { ok: true, demande: { courriel, telephone, poste: poste || null, octets, type } };
}

export type Inscription = { id: string; courriel: string; telephone: string; poste: string | null; created_at: string };

export function texteAvisEquipe(i: Inscription): string {
  const recue = new Date(i.created_at).toLocaleString("fr-CA", { timeZone: "America/Toronto", dateStyle: "long", timeStyle: "short" });
  return `Une entreprise demande son inscription sur Lease Lane.\n\n` +
    `Téléphone : ${telephoneFormate(i.telephone)}\n` + (i.poste ? `Poste : ${i.poste}\n` : "") +
    `Courriel : ${i.courriel}\nReçue le : ${recue}\n\n` +
    `La preuve d’assurance est dans l’onglet « Inscriptions d’entreprises » du portail admin (connexion et deuxième facteur requis). Elle n’est pas encore vérifiée.\n\n${LIEN_ADMIN}`;
}

// Avis à l'équipe (tous les admins, comme les autres formulaires). Ne lève jamais :
// la demande est déjà enregistrée, l'échec est consigné sur la ligne pour le renvoi.
export async function notifierEquipe(supabaseUrl: string, adminHeaders: Record<string, string>, resendKey: string | undefined, i: Inscription):
  Promise<{ notifie_le: string | null; notification_erreur: string | null }> {
  let erreur: string | null = null;
  try {
    const admins = await fetch(`${supabaseUrl}/rest/v1/users?is_admin=eq.true&select=email`, { headers: adminHeaders }).then((r) => r.json()).catch(() => []);
    const to = Array.isArray(admins) ? admins.map((a: { email?: string }) => a.email).filter(Boolean) : [];
    if (!resendKey) erreur = "RESEND_API_KEY absent";
    else if (!to.length) erreur = "Aucun administrateur à prévenir";
    else {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(avecHtml({ from: EXPEDITEUR, to, subject: `Nouvelle inscription d’entreprise — ${i.courriel}`, text: texteAvisEquipe(i) },
          { pied: POURQUOI.admin, bouton: { libelle: "Ouvrir les inscriptions", url: LIEN_ADMIN } })),
      });
      if (!res.ok) erreur = `Resend ${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}`.trim();
    }
  } catch (e) {
    erreur = String(e).slice(0, 300);
  }
  // Un renvoi raté n'efface pas la date d'un avis déjà parti.
  const notifie_le = erreur ? null : new Date().toISOString();
  const patch = erreur ? { notification_erreur: erreur } : { notifie_le, notification_erreur: null };
  await fetch(`${supabaseUrl}/rest/v1/inscriptions_entreprises?id=eq.${i.id}`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify(patch) }).catch(() => {});
  return { notifie_le, notification_erreur: erreur };
}
