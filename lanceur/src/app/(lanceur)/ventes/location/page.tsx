import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Pipeline, type DonneesPipeline } from '@/composants/ventes/Pipeline';
import { VENTES, ongletsVentes } from '@/lib/ventes';

/* Ventes · Pipeline « Location (maquette e12) ». */
export default async function Page() {
  const supabase = await supabaseServeur();
  const [{ data, error }, { data: raisons }] = await Promise.all([
    supabase.rpc('lanceur_pipeline', { p_code: 'location' }),
    supabase.rpc('lanceur_raisons_perte'),
  ]);
  const d = data as DonneesPipeline | null;
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={1} onglets={ongletsVentes()}>
      <Pipeline donnees={d} raisons={(raisons as { code: string; label: string }[] | null) ?? []} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Le pipeline n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
