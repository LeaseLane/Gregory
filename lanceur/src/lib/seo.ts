import { fabriqueT, type T } from '@/lib/i18n/langue';
/* Score SEO d'un article : miroir exact de site.criteres (base) et de la grille du prototype (articles-store.js) — 9 critères, 100 points. */
export type Article = { titre: string; meta: string; mot_cle: string; slug: string | null; corps: string; updated_at?: string };
export type Critere = { id: string; champ: string | null; p: number; ok: boolean; t: string; d?: string };
export const sansAccents = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
export const slugifier = (s: string) => sansAccents(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export function criteres(a: Article, maintenant = Date.now(), t: T = fabriqueT(null)): Critere[] {
  const ti = (a.titre ?? '').trim(), m = (a.meta ?? '').trim(), k = sansAccents(a.mot_cle), c = (a.corps ?? '').trim();
  const w = c ? c.split(/\s+/).length : 0, li = (c.match(/\]\((\/[^)\s]*)\)/g) ?? []).length;
  const d = a.updated_at ? new Date(a.updated_at) : new Date(maintenant), n = new Date(maintenant), mo = (n.getFullYear() - d.getFullYear()) * 12 + n.getMonth() - d.getMonth() - (n.getDate() < d.getDate() ? 1 : 0);
  return [
    { id: 'titre', champ: 'titre', p: 15, ok: ti.length >= 30 && ti.length <= 60, t: t('Titre de 30 à 60 caractères'), d: t('{n} caractères', { n: ti.length }) },
    { id: 'meta', champ: 'meta', p: 20, ok: m.length >= 120 && m.length <= 160, t: m ? t('Méta-description de 120 à 160 caractères') : t('Méta-description manquante'), d: m ? t('{n} caractères', { n: m.length }) : t('Aucune') },
    { id: 'kw', champ: 'mot_cle', p: 10, ok: !!k, t: t('Mot-clé principal défini') },
    { id: 'kwt', champ: 'titre', p: 10, ok: !!k && sansAccents(ti).includes(k), t: t('Mot-clé dans le titre') },
    { id: 'kwm', champ: 'meta', p: 10, ok: !!k && sansAccents(m).includes(k), t: t('Mot-clé dans la méta-description') },
    { id: 'slug', champ: 'slug', p: 10, ok: !!a.slug && !!k && a.slug.includes(slugifier(a.mot_cle)), t: t('Mot-clé dans l’adresse de la page') },
    { id: 'liens', champ: 'corps', p: 10, ok: li >= 2, t: t('Au moins 2 liens internes'), d: li > 1 ? t('{n} liens', { n: li }) : t('{n} lien', { n: li }) },
    { id: 'mots', champ: 'corps', p: 10, ok: w >= 300, t: t('Au moins 300 mots'), d: t('{n} mots', { n: w }) },
    { id: 'maj', champ: null, p: 5, ok: mo < 12, t: t('Mis à jour depuis moins de 12 mois') },
  ];
}
export const score = (a: Article, maintenant?: number) => criteres(a, maintenant).reduce((s, c) => s + (c.ok ? c.p : 0), 0);
