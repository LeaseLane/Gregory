import { supabaseServeur } from '@/lib/supabase/serveur';
import { Locataires, type DonneesLocataires } from './Locataires';

export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_proprietaire_locataires');
  return <Locataires donnees={(data as DonneesLocataires | null) ?? null} erreur={error?.message ?? null} />;
}
