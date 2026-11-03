/* Plan du site (sitemap.xml), généré depuis routes.js et langue.js : pages indexables (les formulaires sont en noindex),
   en français et en anglais, chacune avec ses jumelles hreflang (fr-CA, en-CA, x-default = français), elle-même comprise.
   Plan SEO, lot 3 : lastmod seulement quand la date est réelle (articles : leur date de mise à jour; pages faites main :
   leur mise en ligne), sinon aucune; pas de priority (ignorée par Google); pages en noindex retirées (pages.js NOINDEX). */
import type { MetadataRoute } from 'next';
import { LL_ROUTES, LL_SITE } from '@/proto/routes';
import { LL_ARTICLES } from '@/proto/articles-blogue';
import { versEN } from '@/lib/i18n/adresses';
import { NOINDEX } from '@/lib/pages';
import REFONTE from '@/lib/refonte-routes.json';

type Route = { path: string; index?: boolean; maj?: string; date?: string };
const MAJ: Record<string, string> = Object.fromEntries((LL_ARTICLES as { slug: string; m?: string; d?: string }[]).map((a) => ['/blogue/' + a.slug, a.m || a.d || '']));

export default function sitemap(): MetadataRoute.Sitemap {
  const D = LL_SITE.domaine;
  const paire = (fr: string, en: string, lastModified?: string) => {
    const alternates = { languages: { 'fr-CA': D + fr, 'en-CA': D + en, 'x-default': D + fr } };
    const d = lastModified ? { lastModified } : {};
    return [{ url: D + fr, ...d, alternates }, { url: D + en, ...d, alternates }];
  };
  // Pages faites main hors de LL_ROUTES : Inscrire mon entreprise; article et calculateur de la hausse 2027.
  const faitesMain = [...paire('/inscrire-mon-entreprise', '/en/list-your-business', '2026-10-20'), ...paire('/blogue/hausse-de-loyer-2027', '/en/blog/rent-increase-2027', '2026-10-21')];
  const routes = (LL_ROUTES as Route[]).filter((r) => r.index !== false && !NOINDEX.has(r.path));
  // Refonte de Steven : ses pages sans jumelle dans routes.js (secteurs ajoutés, nouveaux articles), en français seulement.
  const connues = new Set([...routes.map((r) => r.path), ...(LL_ROUTES as Route[]).map((r) => r.path), '/inscrire-mon-entreprise', '/blogue/hausse-de-loyer-2027']);
  const refonte = Object.keys(REFONTE).filter((p) => !connues.has(p)).map((p) => ({ url: D + p }));
  return [...faitesMain, ...routes.flatMap((r) => paire(r.path === '/' ? '/' : r.path, versEN(r.path), r.maj || r.date || MAJ[r.path] || undefined)), ...refonte];
}
