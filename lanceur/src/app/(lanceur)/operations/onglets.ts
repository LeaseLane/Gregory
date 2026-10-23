import type { Onglet } from '@/composants/CadreEspace';

/* Onglets de l'espace Opérations (blk.js B.SP.ops); les pastilles viennent de lanceur_pastilles. */
export const ONGLETS_OPERATIONS: Onglet[] = [
  { libelle: 'À traiter', href: '/operations' },
  { libelle: 'À approuver', href: '/operations/a-approuver' },
  { libelle: 'Mes tâches', href: '/operations/taches' },
  { libelle: 'Inbox', href: '/operations/inbox' },
  { libelle: 'Agenda', href: '/operations/agenda' },
  { libelle: 'Appels', href: '/operations/appels' },
];
export const SOUS_OPERATIONS = 'Le quotidien de l’équipe : ce qui demande une action, vos tâches et vos messages';
