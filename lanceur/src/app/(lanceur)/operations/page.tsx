import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import type { Proposition } from '@/lib/propositions';
import type { DonneesTaches } from './taches/Taches';
import { ATraiter, type DonneesATraiter } from './ATraiter';
import { ONGLETS_OPERATIONS, SOUS_OPERATIONS } from './onglets';

/* Opérations · À traiter (maquettes l01, e64, e07, e08) : la file de toutes les sections, ce que les agents proposent, mes tâches du jour. */
export default async function Page({ searchParams }: { searchParams: Promise<{ nouveau?: string }> }) {
  const sp = await searchParams;
  const supabase = await supabaseServeur();
  const [{ data, error }, { data: props }, { data: taches }] = await Promise.all([
    supabase.rpc('lanceur_a_traiter'), supabase.rpc('lanceur_propositions', { p_statut: 'pending' }), supabase.rpc('lanceur_taches'),
  ]);
  return (
    <CadreEspace icone="inbox" nom="Opérations" sous={SOUS_OPERATIONS} actif={0} onglets={ONGLETS_OPERATIONS}>
      <ATraiter donnees={(data as DonneesATraiter | null) ?? null} propositions={(props as Proposition[] | null) ?? []} taches={(taches as DonneesTaches | null) ?? null}
        ouvrir={sp.nouveau === '1'} erreurLecture={error ? 'La file n’a pas pu être lue.' : null} />
    </CadreEspace>
  );
}
