import { corsHeadersFor } from "../_shared/auth.ts";
// juridique (T8a) : envoi d'une mise en demeure APPROUVÉE par une personne (droit, 2FA et approbation vérifiés en base avec son jeton).
//   La lettre est le courriel LOC-07 lui-même, signé du nom de la personne qui l'a approuvée (signer_name) : une mise en demeure n'exige
//   pas de signature électronique (2026-11-09, décision d'Octa : eZsign abandonné). LOC-07 part par la file : la fenêtre du gabarit
//   (jour ouvrable, 9 h–17 h) la planifie si on est hors heures. Hors production, l'envoi reste marqué « simulé ».

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const PROD = url.includes("kdmwfbcziokygfcmjxeq");

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { action, id } = await req.json().catch(() => ({}));
  if (action !== "envoyer" || !id) return json({ error: "Action inconnue." }, 400);

  const porte = await fetch(`${url}/rest/v1/rpc/lanceur_peut_envoyer_mise_en_demeure`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: JSON.stringify({ p_id: id }) });
  if (!porte.ok) { const e = await porte.json().catch(() => null); return json({ error: e?.message ?? "Envoi refusé." }, porte.status === 400 ? 422 : porte.status); }

  const r = await fetch(`${url}/rest/v1/rpc/service_envoyer_mise_en_demeure`, { method: "POST", headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p: { id, simulated: !PROD } }) });
  const d = await r.json().catch(() => null);
  return r.ok ? json({ ...d, simule: !PROD }) : json({ error: d?.message ?? "Envoi refusé." }, r.status === 400 ? 422 : r.status);
});
