import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

export async function POST(request: NextRequest) {
  const supabase = await supabaseServeur();
  await supabase.auth.signOut();
  const p = request.nextUrl.searchParams.get('p');   // portails : retour à leur connexion
  // Adresse relative : derrière Coolify, request.url est l'adresse interne du conteneur (0.0.0.0:3000).
  return new NextResponse(null, { status: 303, headers: { Location: p === 'proprietaire' || p === 'locataire' ? `/espace/connexion?p=${p}` : '/connexion' } });
}
