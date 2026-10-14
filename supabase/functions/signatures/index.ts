import { corsHeadersFor } from "../_shared/auth.ts";
// signatures (T6a) : envoi des enveloppes eZsign et simulateur de signature.
//   envoyer  { id }                     brouillon → envoyé (droit et 2FA vérifiés en base avec le jeton), puis dossier chez le fournisseur :
//                                       simulateur hors production; en production, refusé (retour au brouillon) tant qu'eZsign n'est pas branché.
//   simuler  { id, ord, type, event_id? } hors production seulement : un signataire ouvre, signe ou refuse. Même chemin que le webhook
//                                       (service_evenement_signature, idempotent : rejouer un event_id ne fait rien).
// ponytail: webhook eZsign réel (vérification de signature, format des événements) à écrire avec le compte bac à sable.

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const PROD = url.includes("kdmwfbcziokygfcmjxeq");
const EZSIGN = Deno.env.get("EZSIGN_API_KEY") ?? "";

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
    if (PROD || EZSIGN) {
      // ponytail: appel eZsign (création du dossier, signataires, ordre) à brancher avec le compte; d'ici là, rien ne part.
      await rpc("service_dossier_signature", { p: { id, erreur: "eZsign non branché" } });
      return json({ error: "eZsign n’est pas encore branché : l’enveloppe reste en brouillon." }, 503);
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
  return json({ error: "Action inconnue." }, 400);
});
