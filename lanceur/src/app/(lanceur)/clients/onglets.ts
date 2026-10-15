import type { Onglet } from '@/composants/CadreEspace';
/* Clients (maquette B.SP.clients) : un seul endroit pour les onglets de l'espace. */
export const ONGLETS_CLI: Onglet[] = [{ libelle: 'Propriétaires', href: '/clients/proprietaires' }, { libelle: 'Locataires', href: '/clients/locataires' }, { libelle: 'Processus', href: '/clients/processus' },
  { libelle: 'Cessions et sous-locations', href: '/clients/cessions' }, { libelle: 'Solvabilité', href: '/clients/solvabilite' }, { libelle: 'Documents et signatures', href: '/clients/documents' }];
export const SOUS_CLI = 'Propriétaires et locataires, leurs processus, leurs documents et leurs signatures';
