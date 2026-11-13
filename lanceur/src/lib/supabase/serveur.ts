import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { TEMOIN_MEMOIRE, optionsTemoins } from '@/lib/memoire';
import { TEMOIN_PORTEE, EN_TETE_PORTEE, porteeValide } from '@/lib/portee';

/* Client serveur avec le jeton de l'usager (jamais la clé de service dans Lanceur). */
export async function supabaseServeur() {
  const pot = await cookies();
  const portee = porteeValide(pot.get(TEMOIN_PORTEE)?.value);
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: portee ? { [EN_TETE_PORTEE]: portee } : {} },
    cookieOptions: optionsTemoins(pot.get(TEMOIN_MEMOIRE)?.value),
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
