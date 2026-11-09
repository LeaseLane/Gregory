import { corsHeadersFor } from "../_shared/auth.ts";
import { docuseal, docusealActif, synchroniserSoumission } from "../_shared/docuseal.ts";
// signatures (T6a; DocuSeal le 2026-11-09) : envoi des enveloppes et simulateur de signature.
//   envoyer  { id }                     brouillon → envoyé (droit et 2FA vérifiés en base avec le jeton), puis soumission DocuSeal à partir du
//                                       modèle nommé « [<type>] … » (bail, mandat, avenant_cession, avis_renouvellement, autre), sans courriel
//                                       de DocuSeal; LOC-11 part à chaque signataire avec le lien Lease Lane. Sans DocuSeal : simulateur hors
//                                       production, refus en production (retour au brouillon).
//   actualiser { id }                   relit les statuts dans DocuSeal (même chemin que le webhook signatures-webhook).
//   simuler  { id, ord, type, event_id? } hors production seulement : un signataire ouvre, signe ou refuse. Même chemin que le webhook
//                                       (service_evenement_signature, idempotent : rejouer un event_id ne fait rien).
// ponytail: webhook eZsign réel (vérification de signature, format des événements) à écrire avec le compte bac à sable.

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const PROD = url.includes("kdmwfbcziokygfcmjxeq");
const PORTAIL = PROD ? "https://app.leaselane.ca" : "https://demo.leaselane.ca";   // page /signer/<slug> du Lanceur
const TYPES: Record<string, string> = { mandat: "mandat", bail: "bail", avenant_cession: "avenant_cession", avis_renouvellement: "avis_renouvellement", autre: "autre" };

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const rpc = async (nom: string, args: unknown, personne = false) => {
    const r = await fetch(`${url}/rest/v1/rpc/${nom}`, { method: "POST", headers: { apikey: personne ? anon : cle, Authorization: `Bearer ${personne ? jeton : cle}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
    const d = await r.json().catch(() => null);
    return { ok: r.ok, status: r.status, d };
  };
  const { action, id, ord, type, event_id } = await req.json().catch(() => ({}));

  if (action === "envoyer") {
    const e = await rpc("lanceur_envoyer_signature", { p_id: id }, true);
    if (!e.ok) return json({ error: e.d?.message ?? "Envoi refusé." }, e.status === 400 ? 422 : e.status);
    if (docusealActif()) {
      const env = e.d as { kind: string; signataires: { ord: number; nom: string; courriel: string }[] };
      try {
        const type = TYPES[env.kind] ?? "autre";
        const modeles = await docuseal<{ data: { id: number; name: string; submitters?: { name: string }[] }[] }>(`/templates?q=${encodeURIComponent(`[${type}]`)}&limit=50`);
        const modele = modeles.data.find((t) => t.name.trim().toLowerCase().startsWith(`[${type}]`));
        if (!modele) throw new Error(`Aucun modèle DocuSeal nommé « [${type}] … ». Créez-le dans DocuSeal (PDF et champs de signature), puis renvoyez.`);
        const roles = (modele.submitters ?? []).map((x) => x.name);
        if (env.signataires.length > roles.length) throw new Error(`Le modèle « ${modele.name} » prévoit ${roles.length} signataire(s); l’enveloppe en a ${env.signataires.length}.`);
        const faits = await docuseal<{ id: number; submission_id: number; slug: string; external_id: string }[]>("/submissions", {
          template_id: modele.id, send_email: false, order: "random",
          submitters: env.signataires.map((s, i) => ({ role: roles[i], email: s.courriel, name: s.nom, external_id: `${id}:${s.ord}` })),
        });
        await rpc("service_dossier_signature", { p: { id, provider: "docuseal", folder_id: String(faits[0].submission_id) } });
        const inv = await rpc("service_inviter_signataires", { p: { id, signataires: faits.map((x) => ({ ord: Number(String(x.external_id).split(":")[1]), lien: `${PORTAIL}/signer/${x.slug}`, submitter_id: String(x.id) })) } });
        if (!inv.ok) throw new Error(inv.d?.message ?? "Invitations non envoyées.");
        return json({ ok: true, simule: false, modele: modele.name });
      } catch (err) {
        await rpc("service_dossier_signature", { p: { id, erreur: (err as Error).message } });
        return json({ error: (err as Error).message }, 409);
      }
    }
    if (PROD) {
      await rpc("service_dossier_signature", { p: { id, erreur: "Signature électronique non configurée" } });
      return json({ error: "La signature électronique n’est pas configurée : l’enveloppe reste en brouillon." }, 503);
    }
    await rpc("service_dossier_signature", { p: { id, provider: "simulateur", simulated: true, folder_id: `sim-${crypto.randomUUID()}` } });
    return json({ ok: true, simule: true });
  }

  if (action === "simuler") {
    if (PROD) return json({ error: "Simulation interdite en production." }, 403);
    const droit = await rpc("lanceur_documents", {}, true);            // la personne doit au moins lire les documents
    if (!droit.ok) return json({ error: droit.d?.message ?? "Accès refusé." }, 403);
    const env = (droit.d?.enveloppes ?? []).find((x: { id: string }) => x.id === id);
    if (!env?.simule) return json({ error: "Enveloppe introuvable ou pas simulée." }, 404);
    const r = await rpc("service_evenement_signature", { p: { id, event_id: event_id ?? crypto.randomUUID(), ord, type: type ?? "signed", simulated: true } });
    return r.ok ? json(r.d) : json({ error: r.d?.message ?? "Événement refusé." }, r.status === 400 ? 422 : r.status);
  }
  if (action === "actualiser") {
    const droit = await rpc("lanceur_documents", {}, true);
    if (!droit.ok) return json({ error: droit.d?.message ?? "Accès refusé." }, 403);
    const dossier = (await rpc("service_signature_dossier", { p_id: id })).d as string | null;
    if (!dossier) return json({ error: "Enveloppe introuvable ou pas encore chez DocuSeal." }, 404);
    try {
      const faits = await synchroniserSoumission(dossier, async (p) => { const r = await rpc("service_evenement_signature", { p }); if (!r.ok) throw new Error(r.d?.message ?? "Événement refusé."); });
      return json({ ok: true, faits });
    } catch (err) { return json({ error: (err as Error).message }, 502); }
  }
  return json({ error: "Action inconnue." }, 400);
});
