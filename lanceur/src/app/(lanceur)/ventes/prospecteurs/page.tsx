import { supabaseServeur } from '@/lib/supabase/serveur';
import { tServeur } from '@/lib/i18n/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { lireMoi, peut } from '@/lib/moi';
import { Prospecteurs, type Prospecteur } from './Prospecteurs';
import { VENTES, ongletsVentes } from '@/lib/ventes';

/* Ventes · Prospecteurs et classement (x18) : repris du prototype React « Appelants » (onglets Appelants / Classement).
   Données réelles : cold_callers, prospects, comms.calls et les anciens appels saisis à la main. */
export default async function Page() {
  const { t } = await tServeur();
  const supabase = await supabaseServeur();
  const [{ data, error }, moi] = await Promise.all([supabase.rpc('lanceur_prospecteurs'), lireMoi()]);
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={5} onglets={ongletsVentes()}>
      <Prospecteurs peutInviter={!!moi && peut(moi, 'reglages.equipe')} liste={(data as Prospecteur[] | null) ?? []} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les prospecteurs n’ont pas pu être lus.')) : null} />
    </CadreEspace>
  );
}
