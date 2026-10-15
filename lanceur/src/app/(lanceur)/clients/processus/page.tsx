import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_CLI, SOUS_CLI } from '../onglets';
import { Processus, type DonneesProcessus } from './Processus';

/* Clients · Processus (maquette l09) : fins de bail par mois, processus en cours, modèles, délais légaux suivis. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_processus');
  return (
    <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={2}
      onglets={ONGLETS_CLI}>
      <Processus donnees={(data as DonneesProcessus | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les processus n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
