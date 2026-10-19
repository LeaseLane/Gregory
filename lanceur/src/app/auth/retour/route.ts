import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Retour des liens courriel (connexion par lien, mot de passe oublié) : échange le code contre une session,
   puis le proxy impose l'étape due (code 2FA ou inscription du facteur). */
// Adresse relative : derrière Coolify, request.url est l'adresse interne du conteneur (0.0.0.0:3000).
const vers = (chemin: string) => new NextResponse(null, { status: 307, headers: { Location: chemin } });

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const suite = request.nextUrl.searchParams.get('suite');
  const apres = suite === '/mot-de-passe' ? '?suite=/mot-de-passe' : '';
  const portail = suite === '/espace' || suite === '/espace/mot-de-passe';
  if (code) {
    const supabase = await supabaseServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return vers(portail ? suite! : '/connexion/code' + apres);
  }
  return vers(portail ? '/espace/connexion?lien=expire' : '/connexion?lien=expire');
}
