import { supabaseServeur } from '@/lib/supabase/serveur';
import { Loi25, type DonneesLoi25 } from './Loi25';

export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_loi25');
  return <Loi25 donnees={(data as DonneesLoi25 | null) ?? null} erreur={error?.message ?? null} />;
}
