// Outils MCP générés depuis le registre d'opérations (spec T1 § 6, T10) — logique pure, testable sans réseau.
// Lecture : list-proposals, get-proposal (propositions de l'agent), et chaque opération « api » en lecture (clé d'API seulement).
// Écriture : propose-<opération> pour chaque opération « agents: proposition » → une proposition, jamais une écriture directe.
// Jamais exposés : approve-proposal, reject-proposal, ni aucune écriture directe.
import { REGISTRE, type Operation } from "../_shared/operations/registre.ts";

export type Outil = { name: string; description: string; inputSchema: Record<string, unknown> };
export type Rpc = (fonction: string, args: Record<string, unknown>) => Promise<{ ok: boolean; status: number; data: unknown }>;
// Agent authentifié : par une clé d'API (T10, la base vérifie portée, droits et journal) ou par un secret d'environnement (provisoire).
export type Agent = { nom: string; secret?: string };

const SOURCE = ["courriel", "sms", "conversation", "appel", "document", "systeme"];
const api = (o: Operation) => (o as { api?: boolean }).api === true;

export function outils(avecCle = false): Outil[] {
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
  // Lectures du catalogue : seulement avec une clé d'API (la portée de la clé décide en base).
  const lectures = avecCle ? REGISTRE.filter((o: Operation) => o.mcp && api(o) && !o.ecriture).map((o: Operation) => ({
    name: o.nom, description: `${o.description} Lecture seulement; portée « ${o.permission} » requise sur la clé.`,
    inputSchema: { type: "object", additionalProperties: true, description: "Filtres facultatifs, tels que décrits." },
  })) : [];
  return [
    { name: "list-proposals", description: "Vos propositions, les plus récentes d'abord (filtre de statut facultatif).", inputSchema: { type: "object", additionalProperties: false, properties: { status: { type: "string", enum: ["pending", "applied", "rejected", "expired"] } } } },
    { name: "get-proposal", description: "État d'une de vos propositions : appliquée, rejetée (motif), expirée, ou en attente.", inputSchema: { type: "object", additionalProperties: false, required: ["id"], properties: { id: { type: "string", format: "uuid" } } } },
    ...lectures,
    ...propose,
  ];
}

const texte = (v: unknown, erreur = false) => ({ content: [{ type: "text", text: typeof v === "string" ? v : JSON.stringify(v) }], ...(erreur ? { isError: true } : {}) });

// Exécute un outil pour un agent authentifié. L'agent vient TOUJOURS de la clé, jamais de l'entrée.
export async function appeler(nom: string, args: Record<string, unknown>, agent: string | Agent, rpc: Rpc) {
  const a: Agent = typeof agent === "string" ? { nom: agent } : agent;
  if (nom === "list-proposals") {
    const r = await rpc("lanceur_agent_propositions", { p_agent: a.nom, p_statut: (args.status as string) ?? null });
    return r.ok ? texte(r.data) : texte("Lecture refusée.", true);
  }
  if (nom === "get-proposal") {
    const r = await rpc("lanceur_agent_propositions", { p_agent: a.nom, p_id: args.id });
    const un = Array.isArray(r.data) ? r.data[0] : null;
    return r.ok && un ? texte(un) : texte("Proposition introuvable parmi les vôtres.", true);
  }
  // Lecture du catalogue (clé d'API) : la base vérifie la portée, les droits de l'auteur de la clé et journalise (canal mcp).
  const lecture = REGISTRE.find((o: Operation) => o.nom === nom && o.mcp && api(o) && !o.ecriture);
  if (lecture) {
    if (!a.secret) return texte("Cette lecture demande une clé d'API.", true);
    const r = await rpc("service_api_appeler", { p: { secret: a.secret, operation: lecture.nom, args, canal: "mcp" } });
    const d = r.data as { erreur?: string; message?: string } | null;
    return r.ok && !d?.erreur ? texte(r.data) : texte(d?.erreur ?? d?.message ?? "Lecture refusée.", true);
  }
  const op = nom.startsWith("propose-") ? REGISTRE.find((o: Operation) => `propose-${o.nom}` === nom && o.agents === "proposition" && o.mcp) : null;
  if (!op) return texte(`Outil inconnu ou non permis : ${nom}.`, true);
  const after = (args.after ?? {}) as Record<string, unknown>;
  const horsChamps = Object.keys(after).filter((k) => !op.champs?.[k]);
  if (horsChamps.length || !Object.keys(after).length) return texte(`Champs non proposables : ${horsChamps.join(", ") || "(aucun champ)"}.`, true);
  const corps = { target_id: args.target_id, after, reason: args.reason, source_type: args.source_type, source_ref: args.source_ref ?? null,
    source_excerpt: args.source_excerpt ?? null, confidence: args.confidence ?? null };
  const r = a.secret
    ? await rpc("service_api_appeler", { p: { secret: a.secret, operation: op.nom, canal: "mcp", args: { ...corps, idempotency_key: String(args.idempotency_key) } } })
    : await rpc("lanceur_proposer", { p: { agent: a.nom, operation: op.nom, ...corps, idempotency_key: `${a.nom}:${String(args.idempotency_key)}`, channel: "mcp" } });
  const d = r.data as { id?: string; status?: string; expires_at?: string; erreur?: string; message?: string } | null;
  if (!r.ok || d?.erreur) return texte(d?.erreur ?? d?.message ?? "Proposition refusée.", true);
  return texte({ id: d!.id, status: d!.status, expires_at: d!.expires_at, message: "Proposition créée : elle attend une approbation humaine." });
}
