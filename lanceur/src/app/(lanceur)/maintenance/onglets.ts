import type { Onglet } from '@/composants/CadreEspace';
import { CATALOGUE_SERVICES } from '@/lib/drapeaux';
import { argentL } from '@/lib/format';
import type { T } from '@/lib/i18n/langue';
/* Maintenance (maquette B.SP.maint). Les libellés restent en français : CadreEspace les traduit à l'affichage. */
export const ongletsMaint = (fournisseurs?: Onglet['compte']): Onglet[] => [{ libelle: 'Bons de travail', href: '/maintenance/bons' }, { libelle: 'Soumissions', href: '/maintenance/soumissions' },
  { libelle: 'Fournisseurs', href: '/maintenance/fournisseurs', compte: fournisseurs, rouge: fournisseurs ? true : undefined }, { libelle: 'Recrutement', href: '/maintenance/recrutement' }, { libelle: 'Catalogue', href: '/maintenance/catalogue', cache: !CATALOGUE_SERVICES }, { libelle: 'Projets', href: '/maintenance/projets' }];
export const SOUS_MAINT = 'Bons de travail, projets, soumissions et banque de fournisseurs';
export const ETAPES: Record<string, string> = { a_planifier: 'À planifier', planifie: 'Planifiés', en_cours: 'En cours', a_verifier: 'À vérifier', termine: 'Terminé', annule: 'Annulé' };
const en = (locale: string) => locale.startsWith('en');
// Décimale selon la langue : « 1,5 » en français, « 1.5 » en anglais.
export const dec = (n: number | string, locale: string) => (en(locale) ? String(n) : String(n).replace('.', ','));
export const heure = (iso: string, locale = 'fr-CA') => { const s = new Date(iso).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  return en(locale) ? s : s.replace(':', ' h ').replace(' h 00', ' h'); };
// Puce des cartes (maquette e32) : « mer. 9 h » dans la semaine, sinon « 14 oct. »
export const heureCourte = (iso: string, locale = 'fr-CA') => { const d = new Date(iso), z = { timeZone: 'America/Toronto' } as const;
  if (Math.abs(d.getTime() - Date.now()) >= 6 * 864e5) return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', ...z });
  const h = d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', ...z });
  return `${d.toLocaleDateString(locale, { weekday: 'short', ...z })} ${en(locale) ? h : h.replace(/\s?h\s?00$/, ' h').replace(/\s?h\s?/, ' h ').trim()}`; };
// Projets (e74) : 5 étapes, dates de chacune
export const ETAPES_PROJET: [string, string][] = [['cadrage', 'Cadrage'], ['approbation', 'Approbation'], ['soumissions', 'Soumissions'], ['travaux', 'Travaux'], ['termine', 'Terminé']];
export const jourMois = (iso: string | null, locale = 'fr-CA') => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : '');
export const dollars = (n: number | null, locale = 'fr-CA') => (n === null ? '—' : argentL(Math.round(Number(n)), locale));
// « 5 000 à 8 000 $ » / « $5,000 to $8,000 »
export const plage = (min: number, max: number, locale: string, t: T) =>
  t('{a} à {b}', { a: en(locale) ? dollars(min, locale) : dollars(min, locale).replace(/[\s  ]*\$$/, ''), b: dollars(max, locale) });
// Motif de non-conformité d'un fournisseur (texte de la base, ensemble fixe + « Assurance expire le JJ/MM »).
export const conf = (t: T, s: string | null) => !s ? '' : s.startsWith('Assurance expire le ') ? t('Assurance expire le {d}', { d: s.slice(20) }) : t(s);
// Métier d'un fournisseur (texte de la base, mis en majuscule initiale) traduit à l'affichage.
export const spec = (t: T, s: string) => t(s.charAt(0).toUpperCase() + s.slice(1));
