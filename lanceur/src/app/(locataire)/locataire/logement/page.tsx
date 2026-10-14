import { supabaseServeur } from '@/lib/supabase/serveur';
import { Logement, type LogementLoc } from './Logement';

export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('portail_locataire_logement');
  return <Logement donnees={(data as LogementLoc | null) ?? null} erreur={error?.message ?? null} />;
}
