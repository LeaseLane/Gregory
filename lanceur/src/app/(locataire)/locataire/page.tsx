import { supabaseServeur } from '@/lib/supabase/serveur';
import { moiPortail } from '@/composants/portail/Moi';
import { Accueil, type AccueilLoc } from './Accueil';

export default async function Page() {
  const moi = await moiPortail('locataire');
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_locataire_accueil');
  return <Accueil prenom={moi.prenom} maintenant={new Date().toISOString()} donnees={(data as AccueilLoc | null) ?? null} erreur={error ? error.message : null} />;
}
