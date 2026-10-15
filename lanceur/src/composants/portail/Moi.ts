import { redirect } from 'next/navigation';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Qui est connecté dans un portail; redirige si ce n'est pas le bon public, ou si la 2FA obligatoire du propriétaire manque. */
export type MoiPortail = { role: 'proprietaire' | 'locataire' | 'equipe' | null; acces?: 'proprietaire' | 'coproprietaire' | 'comptable' | null; pour?: string | null; nom: string; prenom: string; initiales: string; menu: 'gauche' | 'droite' | 'haut' | 'bas'; facteur: boolean; portes: number; immeubles: number };
export async function moiPortail(attendu: 'proprietaire' | 'locataire'): Promise<MoiPortail> {
  const supabase = await supabaseServeur();
  const { data } = await supabase.rpc('portail_moi');
  const m = data as MoiPortail | null;
  if (!m || m.role !== attendu) redirect('/espace');
  if (attendu === 'proprietaire' && !m.facteur) redirect('/espace/2fa?p=proprietaire');
  return m;
}
