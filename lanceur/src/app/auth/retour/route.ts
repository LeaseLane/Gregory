import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Retour des liens courriel (connexion par lien, mot de passe oublié) : échange le code contre une session,
   puis le proxy impose l'étape due (code 2FA ou inscription du facteur). */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const suite = request.nextUrl.searchParams.get('suite');
  const apres = suite === '/mot-de-passe' ? '?suite=/mot-de-passe' : '';
  if (code) {
    const supabase = await supabaseServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/connexion/code' + apres, request.url));
  }
  return NextResponse.redirect(new URL('/connexion?lien=expire', request.url));
}
