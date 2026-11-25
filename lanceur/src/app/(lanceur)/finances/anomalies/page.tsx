import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { tServeur } from '@/lib/i18n/serveur';
import { Anomalies, type DonneesAnomalies } from './Anomalies';

/* Finances · Anomalies (e43) : l'anomalie mise en avant, l'historique sur 12 mois, les règles de détection. */
export default async function Page() {
  const { t } = await tServeur();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_anomalies');
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={8} onglets={ONGLETS_FIN}>
      <Anomalies donnees={(data as DonneesAnomalies | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les anomalies n’ont pas pu être lues.')) : null} />
    </CadreEspace>
  );
}
