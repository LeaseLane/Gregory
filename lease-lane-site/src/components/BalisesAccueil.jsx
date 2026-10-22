'use client';
/* Plan SEO, lot 3 : l'URL canonique de l'accueil est https://leaselane.ca/ (avec la barre oblique, comme le sitemap).
   Next.js retire toujours cette barre des balises qu'il génère (metadataBase) : pour l'accueil (/ et /en), pages.js ne
   déclare donc ni canonical, ni hreflang, ni og:url, et ce composant les écrit; React 19 les place dans le <head>. */
import { usePathname } from 'next/navigation';
import { LL_SITE } from '@/proto/routes';

export default function BalisesAccueil() {
  const p = usePathname();
  if (p !== '/' && p !== '/en') return null;
  const fr = LL_SITE.domaine + '/', en = LL_SITE.domaine + '/en';
  return <>
    <link rel="canonical" href={p === '/' ? fr : en} />
    <link rel="alternate" hrefLang="fr-CA" href={fr} />
    <link rel="alternate" hrefLang="en-CA" href={en} />
    <link rel="alternate" hrefLang="x-default" href={fr} />
    <meta property="og:url" content={p === '/' ? fr : en} />
  </>;
}
