/* Plan du site (sitemap.xml), généré depuis routes.js et langue.js : pages indexables (les formulaires sont en noindex),
   en français et en anglais, chacune avec ses jumelles hreflang (fr-CA, en-CA, x-default = français), elle-même comprise. */
import type { MetadataRoute } from 'next';
import { LL_ROUTES, LL_SITE } from '@/proto/routes';
import { versEN } from '@/lib/i18n/adresses';

const PRIORITE: Record<string, number> = { accueil: 1, gestion: 0.9, location: 0.8, expertise: 0.8, changer: 0.8, logements: 0.8, fiche: 0.7, locataires: 0.8, cleo: 0.7 };

export default function sitemap(): MetadataRoute.Sitemap {
  const D = LL_SITE.domaine;
  // Page faite main hors de LL_ROUTES : Inscrire mon entreprise et sa jumelle anglaise.
  const ie = { languages: { 'fr-CA': D + '/inscrire-mon-entreprise', 'en-CA': D + '/en/list-your-business', 'x-default': D + '/inscrire-mon-entreprise' } };
  const inscription = [{ url: D + '/inscrire-mon-entreprise', lastModified: '2026-10-20', priority: 0.7, alternates: ie }, { url: D + '/en/list-your-business', lastModified: '2026-10-20', priority: 0.6, alternates: ie }];
  // Article et calculateur de la hausse 2027 (page faite main).
  const h27 = { languages: { 'fr-CA': D + '/blogue/hausse-de-loyer-2027', 'en-CA': D + '/en/blog/rent-increase-2027', 'x-default': D + '/blogue/hausse-de-loyer-2027' } };
  inscription.push({ url: D + '/blogue/hausse-de-loyer-2027', lastModified: '2026-10-21', priority: 0.8, alternates: h27 }, { url: D + '/en/blog/rent-increase-2027', lastModified: '2026-10-21', priority: 0.7, alternates: h27 });
  return [...inscription, ...LL_ROUTES.filter((r: { index?: boolean }) => r.index !== false).flatMap((r: { path: string; page: string }) => {
    const fr = D + (r.path === '/' ? '/' : r.path), en = D + versEN(r.path);
    const alternates = { languages: { 'fr-CA': fr, 'en-CA': en, 'x-default': fr } };
    const p = PRIORITE[r.page] ?? 0.6;
    return [
      { url: fr, lastModified: '2026-10-12', priority: p, alternates },
      { url: en, lastModified: '2026-10-12', priority: Math.round(p * 0.9 * 10) / 10, alternates },
    ];
  })];
}
