// Formulaire public « Inscrire mon entreprise » (site leaselane.ca) : preuve d'assurance, téléphone, courriel.
//
// Même ordre que handle-public-inquiry : CORS du site, champ piège, Turnstile, limite par IP,
// puis vérifications. La ligne est écrite AVANT le fichier (clé d'idempotence du navigateur :
// un double clic ne crée qu'une demande); si le fichier n'est pas enregistré, la ligne est
// retirée et la page redemande le document. La confirmation n'est donc jamais affichée à tort.
// L'avis à l'équipe ne fait jamais échouer la demande : l'échec est consigné pour le renvoi.
import { EXPEDITEUR } from "../_shared/branding.ts";
import { avecHtml, POURQUOI } from "../_shared/courriel.ts";
import { corsHeadersFor, ORIGINES_SITE_PUBLIC } from "../_shared/auth.ts";
import { refuserSiRobot } from "../_shared/turnstile.ts";
import { MESSAGES, notifierEquipe, TAILLE_MAX, validerInscription } from "../_shared/inscription.ts";

const RATE_LIMIT_PER_HOUR = 5;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ERREUR_TRANSMISSION = "L’envoi n’a pas fonctionné. Vos coordonnées sont conservées : joignez de nouveau votre preuve d’assurance et réessayez.";

Deno.serve(async (req) => {
  const corsHeaders = { ...corsHeadersFor(req.headers.get("origin"), ORIGINES_SITE_PUBLIC), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  const rep = (status: number, corps: Record<string, unknown>) => new Response(JSON.stringify(corps), { status, headers: corsHeaders });
  const champ = (c: string, error: string) => rep(400, { ok: false, code: "champ", champ: c, error });
  try {
    if (req.method !== "POST") return rep(405, { ok: false, code: "transmission", error: "Méthode non permise" });
    // Refus avant de lire le corps : un envoi de 200 Mo ne doit pas être mis en mémoire.
    if (Number(req.headers.get("content-length") || 0) > TAILLE_MAX + 256 * 1024) {
      return champ("document", MESSAGES.document_taille);
    }
    const form = await req.formData().catch(() => null);
    if (!form) return rep(400, { ok: false, code: "transmission", error: ERREUR_TRANSMISSION });

    // Champ piège : un robot le remplit, un humain ne le voit jamais.
    if (form.get("website")) return rep(200, { ok: true });

    const ipEntete = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const refusRobot = await refuserSiRobot(form.get("cf-turnstile-response"), ipEntete, corsHeaders);
    if (refusRobot) return refusRobot;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminHeaders = { apikey: serviceRoleKey ?? "", Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" };

    const ip = ipEntete || "unknown";
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await fetch(`${supabaseUrl}/rest/v1/public_submission_log?ip_address=eq.${encodeURIComponent(ip)}&created_at=gte.${oneHourAgo}&select=id`, { headers: adminHeaders })
      .then((r) => r.json()).catch(() => []);
    if (Array.isArray(recent) && recent.length >= RATE_LIMIT_PER_HOUR) {
      return rep(429, { ok: false, code: "limite", error: "Trop de demandes envoyées récemment. Réessayez dans une heure." });
    }
    await fetch(`${supabaseUrl}/rest/v1/public_submission_log`, { method: "POST", headers: adminHeaders, body: JSON.stringify({ ip_address: ip }) });

    const fichier = form.get("document");
    const v = validerInscription({
      courriel: form.get("courriel"), telephone: form.get("telephone"), poste: form.get("poste"),
      octets: fichier instanceof File ? new Uint8Array(await fichier.arrayBuffer()) : null,
    });
    if (!v.ok) return champ(v.champ, v.error);
    const d = v.demande;
    const cle = String(form.get("idempotency_key") || "");
    if (!UUID_RE.test(cle)) return rep(400, { ok: false, code: "transmission", error: ERREUR_TRANSMISSION });

    // Courriel déjà lié à un compte : la page propose de se connecter, aucun doublon.
    const comptes = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(d.courriel)}&select=id`, { headers: adminHeaders }).then((r) => r.json()).catch(() => null);
    if (!Array.isArray(comptes)) return rep(500, { ok: false, code: "transmission", error: ERREUR_TRANSMISSION });
    if (comptes.length) {
      return rep(409, { ok: false, code: "compte_existant", error: "Ce courriel est déjà associé à un compte Lease Lane. Connectez-vous ou récupérez votre accès." });
    }

    // Même envoi (double clic, nouvel essai) ou demande déjà ouverte pour ce courriel : succès, sans doublon.
    const existante = async () => {
      for (const filtre of [`idempotency_key=eq.${cle}`, `courriel=eq.${encodeURIComponent(d.courriel)}&statut=neq.ecartee`]) {
        const r = await fetch(`${supabaseUrl}/rest/v1/inscriptions_entreprises?${filtre}&select=id&limit=1`, { headers: adminHeaders }).then((r) => r.json()).catch(() => null);
        if (Array.isArray(r) && r[0]?.id) return String(r[0].id);
      }
      return null;
    };
    const deja = await existante();
    if (deja) return rep(200, { ok: true, id: deja });

    const id = crypto.randomUUID();
    const chemin = `inscriptions/${id}/${crypto.randomUUID()}.${d.type.ext}`;
    const nom = fichier instanceof File ? fichier.name.slice(0, 200) : null;
    const ins = await fetch(`${supabaseUrl}/rest/v1/inscriptions_entreprises`, {
      method: "POST", headers: { ...adminHeaders, Prefer: "return=representation" },
      body: JSON.stringify({
        id, idempotency_key: cle, courriel: d.courriel, telephone: d.telephone, poste: d.poste,
        fichier_chemin: chemin, fichier_type: d.type.mime, fichier_taille: d.octets.length, fichier_nom: nom, ip,
        consent_purpose: "Traiter la demande d’inscription de l’entreprise et la contacter à ce sujet", consented_at: new Date().toISOString(),
      }),
    });
    if (ins.status === 409) {
      // Course entre deux envois simultanés : l'autre a gagné, c'est la même demande.
      const gagnante = await existante();
      if (gagnante) return rep(200, { ok: true, id: gagnante });
    }
    const [ligne] = await ins.json().catch(() => [null]);
    if (!ins.ok || !ligne?.id) {
      console.error("inscription-entreprise : ligne non créée", ins.status, JSON.stringify(ligne).slice(0, 300));
      return rep(500, { ok: false, code: "transmission", error: ERREUR_TRANSMISSION });
    }

    const up = await fetch(`${supabaseUrl}/storage/v1/object/documents/${chemin}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey ?? "", "Content-Type": d.type.mime },
      body: d.octets,
    });
    if (!up.ok) {
      console.error("inscription-entreprise : fichier refusé", up.status, (await up.text().catch(() => "")).slice(0, 300));
      await fetch(`${supabaseUrl}/rest/v1/inscriptions_entreprises?id=eq.${id}`, { method: "DELETE", headers: adminHeaders });
      return rep(500, { ok: false, code: "transmission", error: ERREUR_TRANSMISSION });
    }

    await notifierEquipe(supabaseUrl!, adminHeaders, resendKey, ligne);

    try {
      const conf = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(avecHtml({
          from: EXPEDITEUR, to: [d.courriel],
          subject: "Votre demande d’inscription a bien été reçue",
          text: `Bonjour,\n\nMerci de votre intérêt pour Lease Lane. Nous avons reçu vos coordonnées et votre preuve d’assurance. Vous recevrez par courriel les prochaines étapes pour accéder à la plateforme et compléter votre profil.\n\nLa suite : notre équipe traite votre demande, puis vous envoie à cette adresse un lien personnel et temporaire pour activer votre accès et choisir vous-même votre mot de passe. Aucun mot de passe ne vous sera envoyé par courriel. Votre téléphone, votre courriel et votre preuve d’assurance seront déjà dans votre dossier : vous n’aurez pas à les transmettre de nouveau.\n\nVotre preuve d’assurance ne sera pas affichée publiquement. La recevoir ne veut pas dire qu’elle est vérifiée : notre équipe la vérifiera séparément.\n\nL’équipe Lease Lane`,
        }, { pied: POURQUOI.prospect, titre: "Demande d’inscription reçue" })),
      });
      if (!conf.ok) console.error("inscription-entreprise : confirmation non envoyée", conf.status, (await conf.text().catch(() => "")).slice(0, 200));
    } catch (e) {
      console.error("inscription-entreprise : confirmation non envoyée", e);
    }

    await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
      method: "POST", headers: adminHeaders,
      body: JSON.stringify({ actor_type: "system", action: "inscription_entreprise.recue", entity_type: "inscriptions_entreprises", entity_id: id, details: { fichier_type: d.type.mime, fichier_taille: d.octets.length } }),
    }).catch(() => {});

    return rep(200, { ok: true, id });
  } catch (err) {
    console.error("inscription-entreprise", err);
    return rep(500, { ok: false, code: "transmission", error: ERREUR_TRANSMISSION });
  }
});
