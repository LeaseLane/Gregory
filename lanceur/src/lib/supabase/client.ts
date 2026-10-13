'use client';
import { createBrowserClient } from '@supabase/ssr';
import { TEMOIN_MEMOIRE, optionsTemoins } from '@/lib/memoire';

const lireMemoire = () => document.cookie.match(new RegExp(`(?:^|; )${TEMOIN_MEMOIRE}=([^;]*)`))?.[1];

export function choisirMemoire(rester: boolean) {
  document.cookie = `${TEMOIN_MEMOIRE}=${rester ? '1' : '0'}; path=/; samesite=lax; max-age=${400 * 24 * 3600}`;
}

export function supabaseNavigateur() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: optionsTemoins(lireMemoire()),
  });
}
