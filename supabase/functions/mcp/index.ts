// Serveur MCP des agents Lease Lane (spec T1 § 6) : transport HTTP « streamable », réponses JSON.
// Authentification (T10) : une clé d'API « ll_… » (Réglages › API et MCP; agent, portées et journal vérifiés en base), ou, provisoirement,
// un secret par agent dans MCP_CLES (« cleo:<secret> »). L'agent est déduit du secret, jamais de la requête.
import { appeler, outils, type Agent, type Rpc } from "./outils.ts";

const PROTOCOLE = "2025-06-18";

function egal(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

async function agentDe(req: Request): Promise<Agent | null> {
  const jeton = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jeton) return null;
  if (jeton.startsWith("ll_")) {
    const r = await rpc("service_cle_api_verifier", { p_secret: jeton });
    return r.ok ? { nom: (r.data as { agent: string }).agent, secret: jeton } : null;
  }
  for (const paire of (Deno.env.get("MCP_CLES") || "").split(",")) {
    const i = paire.indexOf(":");
    if (i > 0 && egal(jeton, paire.slice(i + 1).trim())) return { nom: paire.slice(0, i).trim() };
  }
  return null;
}

const rpc: Rpc = async (fonction, args) => {
  const cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/${fonction}`, {
    method: "POST",
    headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) };
};

type Requete = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };
const repondre = (id: Requete["id"], result: unknown) => ({ jsonrpc: "2.0", id, result });
const erreur = (id: Requete["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

async function traiter(m: Requete, agent: Agent) {
  switch (m.method) {
    case "initialize":
      return repondre(m.id, { protocolVersion: PROTOCOLE, capabilities: { tools: { listChanged: false } }, serverInfo: { name: "lease-lane", version: "1.0.0" },
        instructions: "Vous proposez, une personne approuve. Citez toujours la source exacte. Une même clé d'idempotence ne crée jamais de doublon." });
    case "ping":
      return repondre(m.id, {});
    case "tools/list":
      return repondre(m.id, { tools: outils(!!agent.secret) });
    case "tools/call": {
      const p = m.params ?? {};
      return repondre(m.id, await appeler(String(p.name ?? ""), (p.arguments ?? {}) as Record<string, unknown>, agent, rpc));
    }
    default:
      return m.id === undefined ? null : erreur(m.id, -32601, `Méthode inconnue : ${m.method}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response(JSON.stringify(erreur(null, -32600, "POST seulement")), { status: 405, headers: { "Content-Type": "application/json", Allow: "POST" } });
  const agent = await agentDe(req);
  if (!agent) return new Response(JSON.stringify(erreur(null, -32001, "Agent non authentifié")), { status: 401, headers: { "Content-Type": "application/json" } });
  const corps = await req.json().catch(() => null);
  if (!corps) return new Response(JSON.stringify(erreur(null, -32700, "JSON invalide")), { status: 400, headers: { "Content-Type": "application/json" } });
  const lot = Array.isArray(corps) ? corps : [corps];
  const reponses = (await Promise.all(lot.map((m: Requete) => traiter(m, agent)))).filter(Boolean);
  if (!reponses.length) return new Response(null, { status: 202 }); // notifications seulement
  return new Response(JSON.stringify(Array.isArray(corps) ? reponses : reponses[0]), { status: 200, headers: { "Content-Type": "application/json", "Mcp-Protocol-Version": PROTOCOLE } });
});
