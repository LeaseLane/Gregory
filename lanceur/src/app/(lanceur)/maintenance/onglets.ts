import type { Onglet } from '@/composants/CadreEspace';
/* Maintenance (maquette B.SP.maint). */
export const ongletsMaint = (fournisseurs?: Onglet['compte']): Onglet[] => [{ libelle: 'Bons de travail', href: '/maintenance/bons' }, { libelle: 'Soumissions', href: '/maintenance/soumissions' },
  { libelle: 'Fournisseurs', href: '/maintenance/fournisseurs', compte: fournisseurs, rouge: fournisseurs ? true : undefined }, { libelle: 'Recrutement', href: '/maintenance/recrutement' }, { libelle: 'Catalogue', href: '/maintenance/catalogue' }, { libelle: 'Projets', href: '/maintenance/projets' }];
export const SOUS_MAINT = 'Bons de travail, projets, soumissions et banque de fournisseurs';
export const ETAPES: Record<string, string> = { a_planifier: 'À planifier', planifie: 'Planifiés', en_cours: 'En cours', a_verifier: 'À vérifier', termine: 'Terminé', annule: 'Annulé' };
export const heure = (iso: string) => new Date(iso).toLocaleString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).replace(':', ' h ').replace(' h 00', ' h');
// Puce des cartes (maquette e32) : « mer. 9 h » dans la semaine, sinon « 14 oct. »
export const heureCourte = (iso: string) => { const d = new Date(iso), z = { timeZone: 'America/Toronto' } as const;
  return Math.abs(d.getTime() - Date.now()) < 6 * 864e5
    ? `${d.toLocaleDateString('fr-CA', { weekday: 'short', ...z })} ${d.toLocaleTimeString('fr-CA', { hour: 'numeric', minute: '2-digit', ...z }).replace(/\s?h\s?00$/, ' h').replace(/\s?h\s?/, ' h ').trim()}`
    : d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', ...z }); };
// Projets (e74) : 5 étapes, dates de chacune
export const ETAPES_PROJET: [string, string][] = [['cadrage', 'Cadrage'], ['approbation', 'Approbation'], ['soumissions', 'Soumissions'], ['travaux', 'Travaux'], ['termine', 'Terminé']];
export const jourMois = (iso: string | null) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) : '');
export const dollars = (n: number | null) => (n === null ? '—' : `${Math.round(Number(n)).toLocaleString('fr-CA').replace(/[\u202f\u00a0]/g, ' ')} $`);
