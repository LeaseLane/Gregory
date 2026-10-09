'use client';
/* Navigation du site (remplace le routeur #/chemin du prototype, seo.jsx).
   - naviguer(cible) : chemin français (« /locataires ») ou alias du prototype (« fiche », « accueil »);
     sur une page anglaise, la page jumelle anglaise est ouverte.
   - useRoute() : chemin courant (toujours en français, comme dans le prototype) et fiche de la page (LL_ROUTES).
   - useTete() : sans effet; les balises <head> et le JSON-LD sont rendus côté serveur (metadata de chaque page).
   - <PontRouteur/> (gabarit) : relie le routeur Next.js et transforme les clics sur les liens internes en navigation client. */
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LL_ALIAS } from '@/proto/routes';
import { routeDe } from '@/lib/routes-site';
import { versEN, versFR, estEN } from '@/lib/i18n/adresses';

let routeur = null;
let langue = 'fr';

export function naviguer(x) {
  if (!x) return;
  const fr = x.startsWith('/') ? versFR(x) : (LL_ALIAS[x] || '/');
  const cible = langue === 'en' ? versEN(fr) : fr;
  if (routeur) routeur.push(cible);
  else window.location.assign(cible);
}

export function useRoute() {
  const chemin = usePathname() || '/';
  const path = estEN(chemin) ? versFR(chemin) : chemin;
  return { path, ancre: null, route: routeDe(path) };
}

export function useTete() {}

/* Liens internes : <a href="/…"> sans gestionnaire propre → navigation client (Cléo et l'état du gabarit restent ouverts).
   Un lien vers l'autre langue (autre gabarit racine) recharge la page. */
function clicInterne(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || a.target && a.target !== '_self' || a.hasAttribute('download')) return;
  const href = a.getAttribute('href');
  if (!href || !href.startsWith('/') || href.startsWith('//')) return;
  if (/\.(pdf|png|jpe?g|webp|svg|txt|xml|zip)$/i.test(href.split('#')[0])) return;
  if (estEN(href) !== (langue === 'en')) return;
  e.preventDefault();
  routeur && routeur.push(href);
}

export function PontRouteur({ lang = 'fr' }) {
  const r = useRouter();
  routeur = r;
  useEffect(() => { langue = lang; }, [lang]);
  useEffect(() => {
    document.addEventListener('click', clicInterne);
    return () => document.removeEventListener('click', clicInterne);
  }, []);
  return null;
}
