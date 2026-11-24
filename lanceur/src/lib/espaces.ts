/* Les dix espaces de l'admin : un seul endroit pour la barre du bas (téléphone) et, au besoin, l'accueil et la palette.
   `racine` sert à reconnaître l'espace courant; `droit` filtre selon le rôle (même définition que les tuiles de l'accueil). */
export type EspaceAdmin = { nom: string; icone: string; href: string; racine: string; droit: string };

export const ESPACES_ADMIN: EspaceAdmin[] = [
  { nom: 'Opérations', icone: 'inbox', href: '/operations', racine: '/operations', droit: 'operations.lire' },
  { nom: 'Ventes', icone: 'trend', href: '/ventes/mandats', racine: '/ventes', droit: 'ventes.lire' },
  { nom: 'Finances', icone: 'dollar', href: '/finances/vue', racine: '/finances', droit: 'finances.lire' },
  { nom: 'Clients', icone: 'users', href: '/clients/proprietaires', racine: '/clients', droit: 'clients.lire' },
  { nom: 'Immeubles', icone: 'building', href: '/immeubles', racine: '/immeubles', droit: 'immeubles.lire' },
  { nom: 'Maintenance', icone: 'wrench', href: '/maintenance/bons', racine: '/maintenance', droit: 'maintenance.lire' },
  { nom: 'Juridique', icone: 'scale', href: '/juridique', racine: '/juridique', droit: 'juridique.lire' },
  { nom: 'Studio', icone: 'globe', href: '/studio/site', racine: '/studio', droit: 'studio.lire' },
  { nom: 'Cléo et IA', icone: 'spark', href: '/cleo-ia', racine: '/cleo-ia', droit: 'ia.lire' },
  { nom: 'Rapports et réglages', icone: 'chart', href: '/reglages', racine: '/reglages', droit: 'rapports.lire' },
];

/* Ce qu'un rôle voit (2026-11-24) : un onglet, un bouton ou un lien de la palette n'apparaît que si la base l'accepterait (crm.can,
   crm.role_permissions). Avant, un rôle voyait tous les onglets et la page répondait « Votre rôle ne donne pas accès ».
   Droit d'une page : le préfixe le plus long gagne. « fiducie » n'est donné à aucun rôle : seul l'administrateur ('*') voit le
   fidéicommis (ops-api revérifie le rôle administrateur). */
export type Droits = { role: string; permissions: string[] };
export const peutFaire = (m: Droits, permission: string) => m.role === 'admin' || m.permissions.includes('*') || m.permissions.includes(permission);

const PROSPECTION = ['/ventes/prospection', '/ventes/immeubles', '/ventes/a-appeler', '/ventes/prospecteurs', '/ventes/mes-prospects', '/ventes/a-rappeler'];
const DROITS_PAGES: [string, string][] = [
  ...ESPACES_ADMIN.map((e): [string, string] => [e.racine, e.droit]),
  ['/finances/fideicommis', 'fiducie'],
  ['/ventes/mandats', 'ventes.mandats.lire'], ['/ventes/location', 'ventes.location.lire'],
  ...PROSPECTION.map((r): [string, string] => [r, 'ventes.prospection.lire']),
];

export function droitPage(href: string): string | undefined {
  const chemin = href.split(/[?#]/)[0];
  let meilleur: [string, string] | undefined;
  for (const d of DROITS_PAGES) if ((chemin === d[0] || chemin.startsWith(d[0] + '/')) && (!meilleur || d[0].length > meilleur[0].length)) meilleur = d;
  return meilleur?.[1];
}
export const voitPage = (m: Droits, href: string | undefined) => { const d = href ? droitPage(href) : undefined; return !d || peutFaire(m, d); };

/* Entrée d'un espace : sa première page permise (un rôle Location arrive sur Ventes › Location, pas sur les mandats). */
const ENTREES: Record<string, string[]> = { '/ventes': ['/ventes/mandats', '/ventes/location', '/ventes/leads'] };
export const entreeEspace = (m: Droits, e: Pick<EspaceAdmin, 'racine' | 'href'>) => (ENTREES[e.racine] ?? [e.href]).find((h) => voitPage(m, h)) ?? e.href;
