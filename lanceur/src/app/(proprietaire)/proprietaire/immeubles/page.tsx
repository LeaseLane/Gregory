import { supabaseServeur } from '@/lib/supabase/serveur';
import { Immeubles, type DonneesImmeubles } from './Immeubles';

export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_proprietaire_immeubles');
  return <Immeubles donnees={(data as DonneesImmeubles | null) ?? null} erreur={error?.message ?? null} />;
}
