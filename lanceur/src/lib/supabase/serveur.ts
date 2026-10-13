import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/* Client serveur avec le jeton de l'usager (jamais la clé de service dans Lanceur). */
export async function supabaseServeur() {
  const pot = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => pot.getAll(),
      setAll: (liste) => {
        try {
          liste.forEach(({ name, value, options }) => pot.set(name, value, options));
        } catch {
          /* Appel depuis un composant serveur : le proxy rafraîchit déjà la session. */
        }
      },
    },
  });
}
