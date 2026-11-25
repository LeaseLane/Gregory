import { tServeur } from '@/lib/i18n/serveur';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_STUDIO, SOUS_STUDIO } from '../../onglets';
import { SousSite } from '../Commun';
import { DemandesSite, type DonneesDemandes } from './DemandesSite';

/* Studio › Site web › Demandes : les formulaires du site (contact, mandat, visite). L'accueil les comptait sans écran pour les lire (20 nov. 2026). */
export default async function Page() {
  const { t } = await tServeur();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_demandes_site');
  return (
    <CadreEspace icone="globe" nom="Studio" sous={SOUS_STUDIO} actif={0} onglets={ONGLETS_STUDIO}>
      <SousSite actif="/studio/site/demandes" comptes={{ '/studio/site/demandes': (data as DonneesDemandes | null)?.comptes?.new ?? 0 }} t={t} />
      <DemandesSite donnees={(data as DonneesDemandes | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les demandes n’ont pas pu être lues.')) : null} />
    </CadreEspace>
  );
}
