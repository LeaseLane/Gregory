import type { Onglet } from '@/composants/CadreEspace';
/* Rapports et réglages (maquette B.SP.pil) + Entreprise (x13); Journal porte le journal des envois (x12). */
export const ONGLETS_REG: Onglet[] = [{ libelle: 'Tableau de bord', href: '/reglages' }, { libelle: 'Rapports d’équipe', href: '/reglages/rapports-equipe' }, { libelle: 'Équipe et permissions', href: '/reglages/equipe' }, { libelle: 'Loi 25', href: '/reglages/loi-25' },
  { libelle: 'Journal', href: '/reglages/journal/envois' }, { libelle: 'API et MCP', href: '/reglages/api-mcp' }, { libelle: 'Supervision' }, { libelle: 'Améliorations' }, { libelle: 'Entreprise', href: '/reglages/entreprise' }];
export const SOUS_REG = 'Tableaux de bord, supervision, équipe, Loi 25 et intégrations';
export const SOUS_ONGLETS_EQUIPE: [string, string][] = [['/reglages/equipe', 'Comptes'], ['/reglages/equipe/roles', 'Rôles et permissions'], ['/reglages/equipe/journal', 'Journal d’accès'], ['/reglages/equipe/securite', 'Sécurité']];
