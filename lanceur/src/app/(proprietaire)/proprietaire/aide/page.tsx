import { supabaseServeur } from '@/lib/supabase/serveur';
import { Aide } from './Aide';

export default async function Page() {
  const supabase = await supabaseServeur();
  const { data } = await supabase.rpc('portail_gestionnaire');
  return <Aide gestionnaire={(data as { nom: string; initiales: string; courriel: string } | null) ?? null} />;
}
