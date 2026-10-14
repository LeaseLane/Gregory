import { supabaseServeur } from '@/lib/supabase/serveur';
import { moiPortail } from '@/composants/portail/Moi';
import { TableauDeBord, type Accueil } from './TableauDeBord';

export default async function Page() {
  const moi = await moiPortail('proprietaire');
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_proprietaire_accueil');
  return <TableauDeBord prenom={moi.prenom} portes={moi.portes} immeubles={moi.immeubles} donnees={(data as Accueil | null) ?? null} erreur={error ? error.message : null} />;
}
