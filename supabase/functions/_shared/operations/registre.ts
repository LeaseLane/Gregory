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
    nom: "get-overview", espace: "operations", type: "herite", cible: "admin-api", permission: "operations.lire", ecriture: false, idempotente: true,
    agents: "direct", mcp: true, description: "Vue d'ensemble héritée : chiffres, « À traiter », anomalies (admin-api, sans action).",
  }),
] as const satisfies readonly Operation[];

export type NomOperation = (typeof REGISTRE)[number]["nom"];
export const operation = (nom: NomOperation): Operation => REGISTRE.find((o) => o.nom === nom)!;
