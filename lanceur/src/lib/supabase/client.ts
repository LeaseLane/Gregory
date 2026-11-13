'use client';
import { createBrowserClient } from '@supabase/ssr';
import { TEMOIN_MEMOIRE, optionsTemoins } from '@/lib/memoire';
import { TEMOIN_PORTEE, EN_TETE_PORTEE, porteePour } from '@/lib/portee';

const lireMemoire = () => document.cookie.match(new RegExp(`(?:^|; )${TEMOIN_MEMOIRE}=([^;]*)`))?.[1];

const lirePortee = () => { const v = document.cookie.match(new RegExp(`(?:^|; )${TEMOIN_PORTEE}=([^;]*)`))?.[1]; return v ? decodeURIComponent(v) : null; };

export function choisirMemoire(rester: boolean) {
  document.cookie = `${TEMOIN_MEMOIRE}=${rester ? '1' : '0'}; path=/; samesite=lax; max-age=${400 * 24 * 3600}`;
}

export function supabaseNavigateur() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    // Le client du navigateur est unique : la portée est relue à chaque appel à la base, pour suivre le sélecteur sans recharger la page.
    global: { fetch: (url, init) => {
      const portee = String(url).includes('/rest/v1/') ? porteePour(location.pathname, lirePortee()) : null;
      if (!portee) return fetch(url, init);
      const entetes = new Headers(init?.headers); entetes.set(EN_TETE_PORTEE, portee);
      return fetch(url, { ...init, headers: entetes });
    } },
    cookieOptions: optionsTemoins(lireMemoire()),
  });
}
