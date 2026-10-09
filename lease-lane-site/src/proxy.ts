/* Adresses des segments dynamiques (quartiers, articles, logements) : seules les adresses connues de routes.js existent.
   Une adresse inconnue répond un vrai 404 (page introuvable commune), au lieu d'une coquille pré-rendue servie en 200. */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LL_ROUTES } from '@/proto/routes';
import { versEN } from '@/lib/i18n/adresses';

const CONNUES = new Set<string>();
for (const r of LL_ROUTES as { path: string }[]) { CONNUES.add(r.path); CONNUES.add(versEN(r.path)); }

export function proxy(request: NextRequest) {
  const chemin = decodeURIComponent(request.nextUrl.pathname).replace(/\/+$/, '') || '/';
  if (CONNUES.has(chemin)) return NextResponse.next();
  return NextResponse.rewrite(new URL('/__page-introuvable', request.url));
}

export const config = {
  matcher: ['/quartiers/:slug+', '/blogue/:slug+', '/logements-a-louer/:slug+', '/en/neighbourhoods/:slug+', '/en/blog/:slug+', '/en/apartments-for-rent/:slug+'],
};
