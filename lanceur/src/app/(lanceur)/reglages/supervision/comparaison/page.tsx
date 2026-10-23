import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../../onglets';
import { Comparaison, type DonneesComparaison } from './Comparaison';

/* Rapports · Comparaison visuelle (maquette e69) : les captures d'une version contre la référence, l'écart montré, la décision. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_comparaison');
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={6} onglets={ONGLETS_REG}>
      <Comparaison donnees={(data as DonneesComparaison | null) ?? null} erreurLecture={error?.message ?? null} />
    </CadreEspace>
  );
}
