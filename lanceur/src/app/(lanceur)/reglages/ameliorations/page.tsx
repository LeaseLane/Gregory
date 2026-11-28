import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../onglets';
import { tServeur } from '@/lib/i18n/serveur';
import { Ameliorations, type Amelioration } from './Ameliorations';

/* Rapports · Améliorations (maquette e75) : les demandes de l'équipe, des propriétaires et des locataires, leur nombre et leur statut;
   le cadrage de la demande choisie avant de planifier le développement. */
export default async function Page() {
  const { t } = await tServeur();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_ameliorations');
  const d = data as { liste: Amelioration[]; peut_ecrire: boolean } | null;
  return (
    <CadreEspace icone="chart" nom="Réglages" sous={SOUS_REG} actif={7} onglets={ONGLETS_REG}>
      {d ? <Ameliorations liste={d.liste} peutEcrire={d.peut_ecrire} /> : <div className="bandeau erreur" role="alert">{error?.message ?? t('Les demandes n’ont pas pu être lues.')}</div>}
    </CadreEspace>
  );
}
