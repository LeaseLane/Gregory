import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { destination } from '@/lib/acces';
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
