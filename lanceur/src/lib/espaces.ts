/* Les dix espaces de l'admin : un seul endroit pour la barre du bas (téléphone) et, au besoin, l'accueil et la palette.
   `racine` sert à reconnaître l'espace courant; `droit` filtre selon le rôle (même définition que les tuiles de l'accueil). */
export type EspaceAdmin = { nom: string; icone: string; href: string; racine: string; droit: string };

export const ESPACES_ADMIN: EspaceAdmin[] = [
  { nom: 'Opérations', icone: 'inbox', href: '/operations', racine: '/operations', droit: 'operations.lire' },
  { nom: 'Ventes', icone: 'trend', href: '/ventes/mandats', racine: '/ventes', droit: 'ventes.lire' },
  { nom: 'Finances', icone: 'dollar', href: '/finances/paiements', racine: '/finances', droit: 'finances.lire' },
  { nom: 'Clients', icone: 'users', href: '/clients/proprietaires', racine: '/clients', droit: 'clients.lire' },
  { nom: 'Immeubles', icone: 'building', href: '/immeubles', racine: '/immeubles', droit: 'immeubles.lire' },
  { nom: 'Maintenance', icone: 'wrench', href: '/maintenance/bons', racine: '/maintenance', droit: 'maintenance.lire' },
  { nom: 'Juridique', icone: 'scale', href: '/juridique', racine: '/juridique', droit: 'juridique.lire' },
  { nom: 'Studio', icone: 'globe', href: '/studio/site', racine: '/studio', droit: 'studio.lire' },
  { nom: 'Cléo et IA', icone: 'spark', href: '/cleo-ia', racine: '/cleo-ia', droit: 'ia.lire' },
  { nom: 'Rapports et réglages', icone: 'chart', href: '/reglages', racine: '/reglages', droit: 'rapports.lire' },
];
