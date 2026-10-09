/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/seo.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { LL_ROUTES } from '@/proto/routes';
import { __ssr } from '@/lib/hydratation';

/* Moteur du site : une adresse par page (#/chemin), balises <head> et JSON-LD par page,
   fiche SEO intégrée (onglet « SEO » à gauche) et bandeau de témoins conforme à la Loi 25. */

function routeDe(path) {
  const p = (path || '/').split('#')[0].replace(/\/+$/, '') || '/';
  return LL_ROUTES.find(r => r.path === p) || LL_ROUTES[0];
}
/* Version anglaise (langue.js) : #/en/<slug> se lit comme la page française jumelle; la langue est gardée dans LL_LANGUE. */

const ouvrirCleo = texte => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.dispatchEvent(new CustomEvent('ll-cleo', {
  detail: {
    texte
  }
})) : undefined;

/* ——— JSON-LD ——— */

/* SEO local : bureau à Lévis, territoire desservi = Québec et Lévis, avec chaque quartier qui a sa page (/quartiers/…). */

/* E-E-A-T : l'équipe nommée (page À propos). */

/* Adresse publique d'un chemin français, dans la langue de la page. */

/* Textes de la page dans la langue courante (titre, description, libellés du fil). */

/* ——— Fiche SEO intégrée ——— */

/* ——— Revue (prototype seulement, retirée en production) : notes internes masquées par défaut, compteur de gabarits ——— */

/* ——— Bandeau de témoins (Loi 25 : refus aussi simple que l'acceptation, aucun témoin non essentiel par défaut) ——— */

export { routeDe, ouvrirCleo };
