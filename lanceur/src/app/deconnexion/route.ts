import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

export async function POST(request: NextRequest) {
  const supabase = await supabaseServeur();
  await supabase.auth.signOut();
  const p = request.nextUrl.searchParams.get('p');   // portails : retour à leur connexion
  return NextResponse.redirect(new URL(p === 'proprietaire' || p === 'locataire' ? `/espace/connexion?p=${p}` : '/connexion', request.url), { status: 303 });
}
