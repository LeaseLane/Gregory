import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../onglets';
import { Ameliorations, type Amelioration } from './Ameliorations';

/* Rapports · Améliorations (maquette e75) : les demandes de l'équipe, des propriétaires et des locataires, leur nombre et leur statut;
   le cadrage de la demande choisie avant de planifier le développement. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_ameliorations');
  const d = data as { liste: Amelioration[]; peut_ecrire: boolean } | null;
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={7} onglets={ONGLETS_REG}>
      {d ? <Ameliorations liste={d.liste} peutEcrire={d.peut_ecrire} /> : <div className="bandeau erreur" role="alert">{error?.message ?? 'Les demandes n’ont pas pu être lues.'}</div>}
    </CadreEspace>
  );
}
