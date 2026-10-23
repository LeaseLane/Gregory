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
  api?: boolean;            // T10 : exposée par l'API publique et le MCP (miroir de crm.api_operations; la base vérifie la portée de la clé)
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
      potential_monthly_revenue: { type: "string", description: "Valeur mensuelle du mandat en dollars (nombre), facultatif" },
      next_action: { type: "string", description: "Prochaine tâche, une phrase, facultatif" },
      next_followup_date: { type: "string", description: "Échéance de la prochaine tâche (AAAA-MM-JJ, aujourd'hui ou après), facultatif", format: "date" },
      num_doors: { type: "string", description: "Nombre de portes (nombre entier), facultatif" },
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
  defineOperation({
    nom: "list-deals", espace: "ventes", type: "sql", cible: "lanceur_pipeline", permission: "ventes.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, api: true, description: "Deals d'un pipeline (mandats ou location) par étape; argument pipeline.",
  }),
  defineOperation({
    nom: "list-leads", espace: "ventes", type: "sql", cible: "lanceur_leads", permission: "ventes.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, api: true, description: "Leads à qualifier.",
  }),
  defineOperation({
    nom: "list-owners", espace: "clients", type: "sql", cible: "lanceur_proprietaires", permission: "clients.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, api: true, description: "Propriétaires, parc et approbations; filtres q, quartier, portail.",
  }),
  defineOperation({
    nom: "list-tenants", espace: "clients", type: "sql", cible: "lanceur_locataires", permission: "clients.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, api: true, description: "Locataires et paiements (sans la fiche détaillée); filtre retard, fin, sans_portail.",
  }),
  defineOperation({
    nom: "list-buildings", espace: "immeubles", type: "sql", cible: "lanceur_immeubles", permission: "immeubles.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, api: true, description: "Immeubles et occupation; filtre q.",
  }),
  defineOperation({
    nom: "list-units", espace: "immeubles", type: "sql", cible: "lanceur_logements", permission: "immeubles.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, api: true, description: "Logements, loyer et médiane du quartier; filtres statut, immeuble, type.",
  }),
  defineOperation({
    nom: "list-work-orders", espace: "maintenance", type: "sql", cible: "lanceur_bons", permission: "maintenance.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, api: true, description: "Bons de travail par étape; filtres immeuble, q.",
  }),
  defineOperation({
    nom: "list-suppliers", espace: "maintenance", type: "sql", cible: "lanceur_fournisseurs", permission: "maintenance.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, api: true, description: "Fournisseurs, assurance et délai de réponse; filtre q.",
  }),
  defineOperation({
    nom: "list-payments", espace: "finances", type: "sql", cible: "lanceur_paiements", permission: "finances.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, api: true, description: "Loyers suivis du mois, retards et relances; filtres periode, immeuble.",
  }),
  defineOperation({
    nom: "list-tasks", espace: "operations", type: "sql", cible: "lanceur_taches", permission: "operations.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, api: true, description: "Tâches de la personne qui a créé la clé.",
  }),
  defineOperation({
    nom: "report-pipeline", espace: "rapports", type: "sql", cible: "lanceur_rapport_pipeline", permission: "rapports.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, api: true, description: "Conversion d'une étape à la suivante et temps moyen par étape; arguments pipeline, jours.",
  }),
  defineOperation({
    nom: "move-deal-stage", espace: "ventes", type: "sql", cible: "crm.move_deal_stage", permission: "ventes.lire", ecriture: true, idempotente: true,
    agents: "proposition", mcp: true, api: true, journal: { action: "deal.stage_moved" },
    description: "Change l'étape d'un deal; « perdu » exige une raison; la conversion se fait par « Convertir ».",
    champs: {
      stage_id: { type: "string", description: "Identifiant de la nouvelle étape (voir list-deals)" },
      loss_reason_code: { type: "string", description: "Raison de la perte (obligatoire si l'étape est « perdu »)" },
      loss_note: { type: "string", description: "Précision de la raison « autre »" },
    },
  }),
] as const satisfies readonly Operation[];

export type NomOperation = (typeof REGISTRE)[number]["nom"];
export const operation = (nom: NomOperation): Operation => REGISTRE.find((o) => o.nom === nom)!;
