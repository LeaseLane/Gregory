import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../onglets';
import { RapportEquipe, type DonneesEquipe, type Semaines } from './RapportEquipe';

/* Rapports et réglages · Rapports d'équipe (e59) : rythme par personne et charge. */
export default async function Page({ searchParams }: { searchParams: Promise<{ jours?: string }> }) {
  const { jours } = await searchParams;
  const supabase = await supabaseServeur();
  const [{ data, error }, { data: sem }] = await Promise.all([supabase.rpc('lanceur_rapport_equipe', { p: { jours: jours ?? '30' } }), supabase.rpc('lanceur_rapport_equipe_semaines')]);
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={1} onglets={ONGLETS_REG}>
      <RapportEquipe donnees={(data as DonneesEquipe | null) ?? null} semaines={(sem as Semaines | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Le rapport n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
