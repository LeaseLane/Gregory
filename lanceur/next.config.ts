import type { NextConfig } from 'next';

/* Garde-fou d'environnement (ARCHITECTURE.md § 9) : hors production, Lanceur refuse
   de démarrer s'il pointe la base de production. Aucune donnée réelle hors production. */
const REF_PRODUCTION = 'kdmwfbcziokygfcmjxeq';
const env = process.env.LL_ENV;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
if (!env) throw new Error('LL_ENV manquant : local, demo, preproduction ou production (voir .env.example).');
if (env !== 'production' && url.includes(REF_PRODUCTION)) {
  throw new Error(`LL_ENV=${env} pointe la base de production : refusé. Utiliser la préproduction ou le local.`);
}

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
};

export default nextConfig;
