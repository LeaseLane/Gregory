import { tServeur } from '@/lib/i18n/serveur';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_STUDIO, SOUS_STUDIO } from '../onglets';
import { Sources, type DonneesSources } from './Sources';

/* Studio · Sources (maquette e53) : d'où viennent les leads et lesquels deviennent des mandats, à quel coût (90 jours);
   conversion par source; lien de suivi (UTM) et code QR. */
export default async function Page() {
  const { t } = await tServeur();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_sources');
  return (
    <CadreEspace icone="globe" nom="Studio" sous={SOUS_STUDIO} actif={2} onglets={ONGLETS_STUDIO}>
      {data ? <Sources donnees={data as DonneesSources} /> : <div className="bandeau erreur" role="alert">{error?.code === 'PT403' ? error.message : t('Les sources n’ont pas pu être lues.')}</div>}
    </CadreEspace>
  );
}
