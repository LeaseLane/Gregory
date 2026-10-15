import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_CLI, SOUS_CLI } from '../onglets';
import { Solvabilite, type DonneesSolva } from './Solvabilite';

/* Clients · Solvabilité (maquettes l11, e25) : enquêtes en deux temps, rapport, approbation, budget, conservation. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_solvabilite');
  return (
    <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={4}
      onglets={ONGLETS_CLI}>
      <Solvabilite donnees={(data as DonneesSolva | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les enquêtes n’ont pas pu être lues.') : null} />
    </CadreEspace>
  );
}
