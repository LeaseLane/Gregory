/* Plan du site (sitemap.xml), généré depuis routes.js et langue.js : pages indexables (les formulaires sont en noindex),
   en français et en anglais, chacune avec ses jumelles hreflang (fr-CA, en-CA, x-default = français), elle-même comprise. */
import type { MetadataRoute } from 'next';
import { LL_ROUTES, LL_SITE } from '@/proto/routes';
import { versEN } from '@/lib/i18n/adresses';

const PRIORITE: Record<string, number> = { accueil: 1, gestion: 0.9, location: 0.8, expertise: 0.8, changer: 0.8, logements: 0.8, fiche: 0.7, locataires: 0.8, cleo: 0.7 };

export default function sitemap(): MetadataRoute.Sitemap {
  const D = LL_SITE.domaine;
  return LL_ROUTES.filter((r: { index?: boolean }) => r.index !== false).flatMap((r: { path: string; page: string }) => {
    const fr = D + (r.path === '/' ? '/' : r.path), en = D + versEN(r.path);
    const alternates = { languages: { 'fr-CA': fr, 'en-CA': en, 'x-default': fr } };
    const p = PRIORITE[r.page] ?? 0.6;
    return [
      { url: fr, lastModified: '2026-10-09', priority: p, alternates },
      { url: en, lastModified: '2026-10-09', priority: Math.round(p * 0.9 * 10) / 10, alternates },
    ];
  });
}
