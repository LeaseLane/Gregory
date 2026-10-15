import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../onglets';
import { ApiMcp, type DonneesApi } from './ApiMcp';

/* Rapports et réglages · API et MCP (e62) : clés (affichées une seule fois), opérations et niveau, appels récents. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_cles_api');
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={5} onglets={ONGLETS_REG}>
      <ApiMcp donnees={(data as DonneesApi | null) ?? null} base={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les clés n’ont pas pu être lues.') : null} />
    </CadreEspace>
  );
}
