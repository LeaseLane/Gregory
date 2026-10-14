// Outils MCP générés depuis le registre d'opérations (spec T1 § 6) — logique pure, testable sans réseau.
// Lecture : list-proposals, get-proposal (propositions de l'agent seulement).
// Écriture : propose-<opération> pour chaque opération « agents: proposition » → crm.create_proposal.
// Jamais exposés : approve-proposal, reject-proposal, ni aucune écriture directe.
import { REGISTRE, type Operation } from "../_shared/operations/registre.ts";

export type Outil = { name: string; description: string; inputSchema: Record<string, unknown> };
export type Rpc = (fonction: string, args: Record<string, unknown>) => Promise<{ ok: boolean; status: number; data: unknown }>;

const SOURCE = ["courriel", "sms", "conversation", "appel", "document", "systeme"];

export function outils(): Outil[] {
  const propose = REGISTRE.filter((o: Operation) => o.mcp && o.agents === "proposition" && o.champs).map((o: Operation) => ({
    name: `propose-${o.nom}`,
    description: `Propose (sans l'appliquer) : ${o.description} Une personne approuve dans « À approuver ». Citez la source.`,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["target_id", "after", "reason", "source_type", "idempotency_key"],
      properties: {
        target_id: { type: "string", format: "uuid", description: "Identifiant de la fiche visée" },
        after: { type: "object", additionalProperties: false, minProperties: 1, properties: o.champs },
        reason: { type: "string", minLength: 10, maxLength: 1000, description: "Pourquoi, en une ou deux phrases" },
        source_type: { type: "string", enum: SOURCE },
        source_ref: { type: "string", description: "Ex. : Courriel reçu à 9 h 12" },
        source_excerpt: { type: "string", maxLength: 2000, description: "Extrait exact qui justifie la proposition" },
        confidence: { type: "number", minimum: 0, maximum: 100 },
        idempotency_key: { type: "string", minLength: 3, description: "Même clé = même proposition (aucun doublon)" },
      },
    },
  }));
  return [
    { name: "list-proposals", description: "Vos propositions, les plus récentes d'abord (filtre de statut facultatif).", inputSchema: { type: "object", additionalProperties: false, properties: { status: { type: "string", enum: ["pending", "applied", "rejected", "expired"] } } } },
    { name: "get-proposal", description: "État d'une de vos propositions : appliquée, rejetée (motif), expirée, ou en attente.", inputSchema: { type: "object", additionalProperties: false, required: ["id"], properties: { id: { type: "string", format: "uuid" } } } },
    ...propose,
  ];
}

const texte = (v: unknown, erreur = false) => ({ content: [{ type: "text", text: typeof v === "string" ? v : JSON.stringify(v) }], ...(erreur ? { isError: true } : {}) });

// Exécute un outil pour un agent authentifié. L'agent vient TOUJOURS de la clé, jamais de l'entrée.
export async function appeler(nom: string, args: Record<string, unknown>, agent: string, rpc: Rpc) {
  if (nom === "list-proposals") {
    const r = await rpc("lanceur_agent_propositions", { p_agent: agent, p_statut: (args.status as string) ?? null });
    return r.ok ? texte(r.data) : texte("Lecture refusée.", true);
  }
  if (nom === "get-proposal") {
    const r = await rpc("lanceur_agent_propositions", { p_agent: agent, p_id: args.id });
    const un = Array.isArray(r.data) ? r.data[0] : null;
    return r.ok && un ? texte(un) : texte("Proposition introuvable parmi les vôtres.", true);
  }
  const op = nom.startsWith("propose-") ? REGISTRE.find((o: Operation) => `propose-${o.nom}` === nom && o.agents === "proposition" && o.mcp) : null;
  if (!op) return texte(`Outil inconnu ou non permis : ${nom}.`, true);
  const after = (args.after ?? {}) as Record<string, unknown>;
  const horsChamps = Object.keys(after).filter((k) => !op.champs?.[k]);
  if (horsChamps.length || !Object.keys(after).length) return texte(`Champs non proposables : ${horsChamps.join(", ") || "(aucun champ)"}.`, true);
  const r = await rpc("lanceur_proposer", { p: {
    agent, operation: op.nom, target_id: args.target_id, after, reason: args.reason, source_type: args.source_type,
    source_ref: args.source_ref ?? null, source_excerpt: args.source_excerpt ?? null, confidence: args.confidence ?? null,
    idempotency_key: `${agent}:${String(args.idempotency_key)}`, channel: "mcp",
  } });
  if (!r.ok) return texte((r.data as { message?: string })?.message ?? "Proposition refusée.", true);
  const p = r.data as { id: string; status: string; expires_at: string };
  return texte({ id: p.id, status: p.status, expires_at: p.expires_at, message: "Proposition créée : elle attend une approbation humaine." });
}
