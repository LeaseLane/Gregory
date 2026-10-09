import type { NextConfig } from 'next';

/* Adresse de connexion du portail locataire (à confirmer, SEO.md : « Redirections vers le portail locataire »).
   Les anciennes adresses des services réservés au portail y redirigent. */
const APP = 'https://app.leaselane.ca';
const PORTAIL = process.env.LL_PORTAIL_URL || APP + '/app';
const ANCIENNES_ADRESSES_PORTAIL = [
  '/locataires/demande-de-travaux', '/locataires/suivi', '/locataires/ajout-au-bail', '/locataires/endossement',
  '/locataires/cession-de-bail', '/locataires/paiement', '/locataires/documents', '/locataires/avis-de-depart',
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  /* Image Docker autonome pour Coolify (OVH) : voir Dockerfile. */
  output: 'standalone',
  /* Les composants du prototype ne sont pas écrits pour le double montage des effets du mode strict (développement seulement). */
  reactStrictMode: false,
  /* Deux gabarits racines (français, anglais) : page 404 commune (app/global-not-found.tsx). */
  experimental: { globalNotFound: true },
  /* Les portails et les pages à lien (courriels déjà envoyés : confirmer une visite, signer un bail, logo des
     courriels…) vivaient sur leaselane.ca jusqu'au 2026-10-09; ils sont maintenant sur app.leaselane.ca.
     Temporaires (302) : rien d'éternel à mettre en cache chez les navigateurs. */
  async redirects() {
    return [
      ...ANCIENNES_ADRESSES_PORTAIL.map(source => ({ source, destination: PORTAIL, permanent: true })),
      { source: '/connexion', destination: PORTAIL, permanent: false },
      { source: '/en/connexion', destination: PORTAIL, permanent: false },
      { source: '/app', destination: APP + '/app', permanent: false },
      { source: '/pro', destination: APP + '/pro', permanent: false },
      { source: '/:page([^/]+\\.html)', destination: APP + '/:page', permanent: false },
      { source: '/assets/courriel/:fichier*', destination: APP + '/assets/courriel/:fichier*', permanent: false },
    ];
  },
  /* En-têtes de base. La politique CSP complète (liste blanche : domaine Lease Lane + projet Supabase, B14/SB1)
     sera ajoutée avec la connexion à Supabase et aux tuiles de carte (SB5). */
  async headers() {
    return [{
      /* Aperçu du portail (iframe des pages Gestion) : jamais indexé. */
      source: '/:dossier(espace-proprietaire|portail-commun|tokens)/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    }, {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
      ],
    }];
  },
};

export default nextConfig;
