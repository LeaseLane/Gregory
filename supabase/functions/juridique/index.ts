import { corsHeadersFor } from "../_shared/auth.ts";
// juridique (T8a) : envoi d'une mise en demeure APPROUVÉE par une personne (droit, 2FA et approbation vérifiés en base avec son jeton).
//   La lettre est signée (simulateur hors production; en production, refusé tant qu'eZsign n'est pas branché), puis LOC-07 part
//   par la file : la fenêtre du gabarit (jour ouvrable, 9 h–17 h) la planifie si on est hors heures.
// ponytail: signature eZsign réelle de la lettre (PDF) à brancher avec le compte, comme pour les enveloppes (fonction « signatures »).

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const PROD = url.includes("kdmwfbcziokygfcmjxeq");
const EZSIGN = Deno.env.get("EZSIGN_API_KEY") ?? "";

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { action, id } = await req.json().catch(() => ({}));
  if (action !== "envoyer" || !id) return json({ error: "Action inconnue." }, 400);

  const porte = await fetch(`${url}/rest/v1/rpc/lanceur_peut_envoyer_mise_en_demeure`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: JSON.stringify({ p_id: id }) });
  if (!porte.ok) { const e = await porte.json().catch(() => null); return json({ error: e?.message ?? "Envoi refusé." }, porte.status === 400 ? 422 : porte.status); }
  if (PROD || EZSIGN) return json({ error: "eZsign n’est pas encore branché : la mise en demeure approuvée attend sa signature." }, 503);

  const r = await fetch(`${url}/rest/v1/rpc/service_envoyer_mise_en_demeure`, { method: "POST", headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p: { id, simulated: true } }) });
  const d = await r.json().catch(() => null);
  return r.ok ? json({ ...d, simule: true }) : json({ error: d?.message ?? "Envoi refusé." }, r.status === 400 ? 422 : r.status);
});
