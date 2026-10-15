import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { destination, destinationPortail, PORTAIL } from '@/lib/acces';
import { TEMOIN_MEMOIRE, optionsTemoins } from '@/lib/memoire';

/* Rafraîchit la session et applique la 2FA avant toute page de Lanceur.
   La base revérifie (RLS, require_aal2) : l'interface n'est jamais la seule barrière. */
export async function proxy(request: NextRequest) {
  let reponse = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: optionsTemoins(request.cookies.get(TEMOIN_MEMOIRE)?.value),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (liste) => {
        liste.forEach(({ name, value }) => request.cookies.set(name, value));
        reponse = NextResponse.next({ request });
        liste.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options));
      },
    },
  });

  const chemin = request.nextUrl.pathname;
  // Retour d'un lien courriel (connexion, mot de passe) : la page échange le code avant toute vérification.
  if (chemin.startsWith('/auth/')) return reponse;
  // A2 : l'inscription par code se fait sans session (code et courriel vérifiés en base par « portail-inscription »).
  if (chemin === '/api/portail/inscription') return reponse;
  // Relais des portails et de Cléo : chacun exige une session et la base vérifie le niveau (2FA); un locataire sans 2FA ne doit pas
  // être renvoyé vers l'inscription 2FA de l'équipe (réponse HTML au lieu de JSON).
  if (chemin === '/api/cleo' || chemin.startsWith('/api/portail/')) return reponse;
  let niveau = { utilisateur: false, actuel: null as string | null, suivant: null as string | null };
  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      niveau = { utilisateur: true, actuel: aal?.currentLevel ?? null, suivant: aal?.nextLevel ?? null };
    }
  } catch {
    /* Supabase injoignable : traité comme non connecté. */
  }

  // Portails : leurs propres règles (connexion et code communs aux deux publics).
  if (PORTAIL.test(chemin)) {
    const c = destinationPortail(niveau, chemin);
    const p = request.nextUrl.searchParams.get('p');
    return c ? NextResponse.redirect(new URL(c + (p ? `?p=${p}` : chemin.startsWith('/proprietaire') ? '?p=proprietaire' : chemin.startsWith('/locataire') ? '?p=locataire' : ''), request.url)) : reponse;
  }
  // Réglages › Sécurité : connexions depuis le Canada seulement (pays donné par l'hébergeur; exception d'une personne journalisée en base).
  const pays = request.headers.get('x-vercel-ip-country') ?? request.headers.get('cf-ipcountry');
  if (pays && pays !== 'CA' && niveau.utilisateur && !chemin.startsWith('/connexion')) {
    const { data: pol } = await supabase.rpc('lanceur_politique');
    const p = pol as { canada_seulement?: boolean; exception?: boolean } | null;
    if (p?.canada_seulement && !p.exception) {
      await supabase.rpc('journal_acces_refuse', { p: { raison: 'pays', pays } }).then(() => null, () => null);
      await supabase.auth.signOut();
      return new NextResponse('<!doctype html><meta charset="utf-8"><title>Accès refusé</title><p style="font-family:sans-serif;padding:40px">Connexion refusée : l’admin de Lease Lane n’est accessible que depuis le Canada. Une exception se demande à l’administrateur.</p>',
        { status: 403, headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
  }
  const cible = destination(niveau);
  const surConnexion = chemin.startsWith('/connexion');
  // Pages de connexion : seule l'étape due est accessible; session complète → accueil.
  if (surConnexion) {
    if (cible === null) return NextResponse.redirect(new URL('/', request.url));
    if (chemin !== cible) return NextResponse.redirect(new URL(cible + request.nextUrl.search, request.url));
    return reponse;
  }
  if (cible) return NextResponse.redirect(new URL(cible, request.url));
  return reponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|img/|icon.svg|favicon.ico).*)'],
};
