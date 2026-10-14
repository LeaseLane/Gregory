// Registre d'opérations Lanceur (ARCHITECTURE.md § 6) : une opération, écrite une fois, exposée à
// l'interface, aux agents et au MCP. TS sans import, lu tel quel par Deno (Edge) et Next.js (@ops/*).
// La base fait foi : chaque fonction SQL revérifie 2FA, droit, version et règles (erreurs PT403/404/409/422).

export type Espace = "operations" | "ventes" | "clients" | "immeubles" | "maintenance" | "finances" | "juridique" | "studio" | "ia" | "rapports" | "reglages" | "compte";

export type Operation = {
  nom: string;              // list-*, get-*, create-*, un seul update-*, puis verbes métier
  espace: Espace;
  type: "sql" | "edge" | "herite";
  cible: string;            // fonction SQL (rpc), Edge Function, ou fonction héritée (+ action)
  permission: string | null;// null = tout membre de l'équipe
  ecriture: boolean;
  idempotente: boolean;
  agents: "direct" | "proposition" | "interdit";
  mcp: boolean;
  journal?: { action: string; lectureSensible?: boolean };
  description: string;
  // Champs qu'un agent peut proposer (outils MCP « propose-<nom> »), en schéma JSON.
  champs?: Record<string, { type: "string"; description: string; enum?: readonly string[]; format?: "date" }>;
};

const defineOperation = (o: Operation) => o;

export const REGISTRE = [
  defineOperation({
    nom: "get-me", espace: "compte", type: "sql", cible: "lanceur_moi", permission: null, ecriture: false, idempotente: true,
    agents: "interdit", mcp: false, description: "Rôle, nom, initiales et droits de la personne connectée.",
  }),
  defineOperation({
    nom: "record-sign-in", espace: "compte", type: "sql", cible: "lanceur_journal_connexion", permission: null, ecriture: true, idempotente: false,
    agents: "interdit", mcp: false, journal: { action: "auth.sign_in" }, description: "Inscrit au journal une connexion validée par le code 2FA.",
  }),
  defineOperation({
    nom: "list-team-members", espace: "reglages", type: "sql", cible: "lanceur_equipe", permission: null, ecriture: false, idempotente: true,
    agents: "direct", mcp: true, description: "Membres de l'équipe, rôle et état (écran l21).",
  }),
  defineOperation({
    nom: "update-team-member", espace: "reglages", type: "sql", cible: "lanceur_maj_membre", permission: "reglages.equipe", ecriture: true, idempotente: true,
    agents: "interdit", mcp: false, journal: { action: "team_member.updated" },
    description: "Change le nom, les initiales, le rôle ou l'état d'un membre. Refuse si la fiche a changé (409) ou s'il ne reste plus d'administrateur (422).",
  }),
  defineOperation({
    nom: "list-proposals", espace: "operations", type: "sql", cible: "lanceur_propositions", permission: null, ecriture: false, idempotente: true,
    agents: "direct", mcp: true, description: "Propositions visibles selon le rôle (À approuver, l02); filtre de statut (pending par défaut).",
  }),
  defineOperation({
    nom: "count-pending-proposals", espace: "operations", type: "sql", cible: "lanceur_nb_a_approuver", permission: null, ecriture: false, idempotente: true,
    agents: "interdit", mcp: false, description: "Nombre de propositions en attente pour les pastilles.",
  }),
  defineOperation({
    nom: "list-rejection-reasons", espace: "operations", type: "sql", cible: "lanceur_motifs_rejet", permission: null, ecriture: false, idempotente: true,
    agents: "interdit", mcp: false, description: "Motifs de rejet actifs (e10).",
  }),
  defineOperation({
    nom: "approve-proposal", espace: "operations", type: "sql", cible: "lanceur_approuver", permission: null, ecriture: true, idempotente: true,
    agents: "interdit", mcp: false, journal: { action: "proposal.approved" },
    description: "Approuve (ou modifie puis approuve) : applique par la même opération qu'un humain; 409 si déjà décidée; « proposition-perimee » si la fiche a changé.",
  }),
  defineOperation({
    nom: "reject-proposal", espace: "operations", type: "sql", cible: "lanceur_rejeter", permission: null, ecriture: true, idempotente: true,
    agents: "interdit", mcp: false, journal: { action: "proposal.rejected" }, description: "Rejette avec un motif obligatoire (« autre » exige une précision).",
  }),
  defineOperation({
    nom: "move-prospect-stage", espace: "ventes", type: "sql", cible: "crm.move_prospect_stage", permission: "ventes.mandats.ecrire", ecriture: true, idempotente: true,
    agents: "proposition", mcp: true, journal: { action: "prospect.stage_change" }, description: "Change l'étape d'un prospect; « perdu » exige une raison; 409 si l'étape a changé.",
    champs: {
      stage: { type: "string", description: "Nouvelle étape", enum: ["new", "contacted", "interested", "proposal_sent", "signed", "lost"] },
      loss_reason: { type: "string", description: "Raison de la perte (obligatoire si stage = lost)" },
    },
  }),
  defineOperation({
    nom: "update-prospect-followup", espace: "ventes", type: "sql", cible: "crm.update_prospect_followup", permission: "ventes.mandats.ecrire", ecriture: true, idempotente: true,
    agents: "proposition", mcp: true, journal: { action: "prospect.followup_updated" }, description: "Intérêt, prochain suivi (jamais dans le passé) et prochaine action d'un prospect.",
    champs: {
      interest_level: { type: "string", description: "Intérêt du prospect", enum: ["chaud", "tiede", "froid"] },
      next_followup_date: { type: "string", description: "Prochain suivi (AAAA-MM-JJ, aujourd'hui ou après)", format: "date" },
      next_action: { type: "string", description: "Prochaine action, une phrase" },
    },
  }),
  defineOperation({
    nom: "get-proposal", espace: "operations", type: "sql", cible: "lanceur_agent_propositions", permission: null, ecriture: false, idempotente: true,
    agents: "direct", mcp: true, description: "État d'une proposition de l'agent (en attente, appliquée, rejetée avec motif, expirée).",
  }),
  defineOperation({
    nom: "get-overview", espace: "operations", type: "herite", cible: "admin-api", permission: "operations.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, description: "Vue d'ensemble héritée : chiffres, « À traiter », anomalies (admin-api, sans action).",
  }),
] as const satisfies readonly Operation[];

export type NomOperation = (typeof REGISTRE)[number]["nom"];
export const operation = (nom: NomOperation): Operation => REGISTRE.find((o) => o.nom === nom)!;
