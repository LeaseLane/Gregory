// API publique Lease Lane (T10). POST /functions/v1/api/<operation> (ou { "operation": … }) avec « Authorization: Bearer ll_… » et un objet JSON d'arguments.
// Tout est vérifié en base par service_api_appeler : clé (empreinte), portée, droits de l'auteur de la clé; les écritures deviennent des propositions;
// chaque appel est journalisé (canal « api »). GET /functions/v1/api renvoie le catalogue des opérations de la clé.
const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const H = { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" };
const CODES: Record<string, number> = { PT401: 401, PT403: 403, PT404: 404, PT409: 409, PT422: 422 };
const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async (req) => {
  const secret = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret.startsWith("ll_")) return json({ erreur: "Clé d'API requise (Authorization: Bearer ll_…)." }, 401);
  if (req.method === "GET") {
    const v = await fetch(`${url}/rest/v1/rpc/service_cle_api_verifier`, { method: "POST", headers: H, body: JSON.stringify({ p_secret: secret }) });
    const d = await v.json().catch(() => null);
    return v.ok ? json({ agent: d.agent, portees: d.portees }) : json({ erreur: d?.message ?? "Clé invalide." }, 401);
  }
  if (req.method !== "POST") return json({ erreur: "GET ou POST seulement." }, 405);
  const corps = await req.json().catch(() => ({}));
  const operation = new URL(req.url).pathname.split("/").filter(Boolean).pop();
  const op = operation && operation !== "api" ? operation : corps.operation;
  if (!op || !/^[a-z-]{3,60}$/.test(op)) return json({ erreur: "Opération manquante." }, 400);
  const args = corps.operation ? (corps.args ?? {}) : corps;
  const r = await fetch(`${url}/rest/v1/rpc/service_api_appeler`, { method: "POST", headers: H, body: JSON.stringify({ p: { secret, operation: op, args, canal: "api" } }) });
  const d = await r.json().catch(() => null);
  if (!r.ok) return json({ erreur: d?.message ?? "Erreur." }, CODES[d?.code] ?? 500);
  if (d?.erreur) return json({ erreur: d.erreur }, d.code ?? 403);
  return json({ donnees: d });
});
