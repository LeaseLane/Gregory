import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsMaint, SOUS_MAINT } from '../onglets';
import { Soumissions, type DonneesSoumissions } from './Soumissions';

/* Maintenance · Soumissions (maquette l14) : comparer sur la même portée, recommandation, accord du propriétaire au-delà du plafond. */
export default async function Page({ searchParams }: { searchParams: Promise<{ bt?: string }> }) {
  const { bt } = await searchParams;
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_soumissions');
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={1} onglets={ongletsMaint()}>
      <Soumissions bt={bt} donnees={(data as DonneesSoumissions | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les soumissions n’ont pas pu être lues.') : null} />
    </CadreEspace>
  );
}
