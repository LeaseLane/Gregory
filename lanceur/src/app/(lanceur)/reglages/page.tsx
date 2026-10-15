import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from './onglets';
import { TableauDeBord, type DonneesTdb, type DonneesPipeline } from './TableauDeBord';

/* Rapports et réglages · Tableau de bord (l20) : chiffres de l'entreprise, conversion par étape et temps moyen par étape. */
export default async function Page({ searchParams }: { searchParams: Promise<{ pipeline?: string; jours?: string }> }) {
  const sp = await searchParams, sb = await supabaseServeur();
  const [{ data, error }, { data: pipe }] = await Promise.all([sb.rpc('lanceur_tableau_de_bord'), sb.rpc('lanceur_rapport_pipeline', { p: { pipeline: sp.pipeline ?? 'mandats', jours: sp.jours ?? '365' } })]);
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={0} onglets={ONGLETS_REG}>
      <TableauDeBord donnees={(data as DonneesTdb | null) ?? null} pipeline={(pipe as DonneesPipeline | null) ?? null} filtres={sp} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Le tableau de bord n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
