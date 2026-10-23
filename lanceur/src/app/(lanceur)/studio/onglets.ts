import type { Onglet } from '@/composants/CadreEspace';
/* Studio (maquette B.SP.studio) : Site web (TS) et Gabarits (T2). Campagnes (l17) et Sources (e53). */
export const ONGLETS_STUDIO: Onglet[] = [{ libelle: 'Site web', href: '/studio/site' }, { libelle: 'Campagnes', href: '/studio/campagnes' }, { libelle: 'Sources', href: '/studio/sources' }, { libelle: 'Gabarits', href: '/studio/gabarits' }];
export const SOUS_STUDIO = 'Site web, campagnes, sources et gabarits des envois';
export const SOUS_SITE: [string, string][] = [['/studio/site', 'Vue d’ensemble'], ['/studio/site/logements', 'Logements'], ['/studio/site/articles', 'Articles'], ['/studio/site/seo', 'SEO et mots-clés']];
