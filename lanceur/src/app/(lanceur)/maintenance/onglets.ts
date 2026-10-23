import type { Onglet } from '@/composants/CadreEspace';
/* Maintenance (maquette B.SP.maint). Projets arrive avec sa tranche. */
export const ongletsMaint = (fournisseurs?: Onglet['compte']): Onglet[] => [{ libelle: 'Bons de travail', href: '/maintenance/bons' }, { libelle: 'Soumissions', href: '/maintenance/soumissions' },
  { libelle: 'Fournisseurs', href: '/maintenance/fournisseurs', compte: fournisseurs, rouge: fournisseurs ? true : undefined }, { libelle: 'Recrutement', href: '/maintenance/recrutement' }, { libelle: 'Catalogue', href: '/maintenance/catalogue' }, { libelle: 'Projets' }];
export const SOUS_MAINT = 'Bons de travail, projets, soumissions et banque de fournisseurs';
export const ETAPES: Record<string, string> = { a_planifier: 'À planifier', planifie: 'Planifiés', en_cours: 'En cours', a_verifier: 'À vérifier', termine: 'Terminé', annule: 'Annulé' };
export const heure = (iso: string) => new Date(iso).toLocaleString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).replace(':', ' h ').replace(' h 00', ' h');
