import { supabaseServeur } from '@/lib/supabase/serveur';
import { MarcheNav } from '../MarcheNav';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Vacance, type DonneesVacance } from './Vacance';

/* Finances · Marché · Vacance (phase 2 du plan du 13 nov. 2026) : taux de vacance SCHL par zone, pour cibler la publicité. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_vacance');
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={12} onglets={ONGLETS_FIN}>
      <MarcheNav actif="vacance" />
      <Vacance donnees={(data as DonneesVacance | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les taux de vacance n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
