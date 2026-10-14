import { supabaseServeur } from '@/lib/supabase/serveur';
import { Acces, type DonneesAcces } from './Acces';

export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_acces');
  return <Acces donnees={(data as DonneesAcces | null) ?? null} erreur={error?.message ?? null} />;
}
