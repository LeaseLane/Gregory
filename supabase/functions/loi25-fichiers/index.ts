import { corsHeadersFor } from "../_shared/auth.ts";
// loi25-fichiers (L25) : efface du stockage les fichiers d'une personne après une demande d'effacement. Le droit est vérifié EN BASE avec le jeton de la personne
// (lanceur_loi25 → peut_gerer, responsable de la protection des renseignements); la liste des fichiers vient de la base (service_loi25_fichiers), jamais du client.

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { request_id } = await req.json().catch(() => ({}));
  if (!request_id || !/^[0-9a-f-]{36}$/.test(String(request_id))) return json({ error: "Requête invalide." }, 400);
  const droit = await fetch(`${url}/rest/v1/rpc/lanceur_loi25`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: "{}" });
  const d = await droit.json().catch(() => null);
  if (!droit.ok || d?.peut_gerer !== true) return json({ error: d?.message ?? "Réservé au responsable de la protection des renseignements." }, 403);
  const S = { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" };
  const l = await fetch(`${url}/rest/v1/rpc/service_loi25_fichiers`, { method: "POST", headers: S, body: JSON.stringify({ p_request: request_id }) });
  const fichiers: { bucket: string; chemin: string }[] = await l.json().catch(() => []);
  let n = 0;
  for (const bucket of [...new Set(fichiers.map((f) => f.bucket))]) {
    const prefixes = fichiers.filter((f) => f.bucket === bucket).map((f) => f.chemin);
    const r = await fetch(`${url}/storage/v1/object/${bucket}`, { method: "DELETE", headers: S, body: JSON.stringify({ prefixes }) });
    if (r.ok) n += prefixes.length;
  }
  return json({ ok: true, supprimes: n, total: fichiers.length });
});
