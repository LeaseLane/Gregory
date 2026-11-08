import type { Onglet } from '@/composants/CadreEspace';
/* Clients (maquette B.SP.clients) : un seul endroit pour les onglets de l'espace.
   Solvabilité retirée du menu le 2026-11-09 : Ozeille ne sera pas branché (Grégory); l'écran revient si l'API Proprio Enquête de la CORPIQ est obtenue. */
export const ONGLETS_CLI: Onglet[] = [{ libelle: 'Propriétaires', href: '/clients/proprietaires' }, { libelle: 'Locataires', href: '/clients/locataires' }, { libelle: 'Processus', href: '/clients/processus' },
  { libelle: 'Cessions et sous-locations', href: '/clients/cessions' }, { libelle: 'Documents et signatures', href: '/clients/documents' }];
export const SOUS_CLI = 'Propriétaires et locataires, leurs processus, leurs documents et leurs signatures';
