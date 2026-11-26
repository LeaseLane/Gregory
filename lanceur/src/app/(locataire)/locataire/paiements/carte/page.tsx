import { supabaseServeur } from '@/lib/supabase/serveur';
import { tServeur } from '@/lib/i18n/serveur';
import { BandeauLocataire } from '@/composants/portail/CoquilleLocataire';
import { argentL } from '@/lib/format';
import { dateCourteL, moisAnneeL } from '../../fmt';
import { PageCarte } from '../PayerCarte';
import type { PaiementsLoc } from '../Paiements';

/* Locataire · Payer par carte (page à part, 26 nov. 2026). Le montant affiché vient de la base; celui qui est prélevé aussi (carte_preparer). */
export default async function Page() {
  const sb = await supabaseServeur(), { t, locale } = await tServeur();
  const { data } = await sb.rpc('portail_locataire_paiements');
  const D = data as PaiementsLoc | null, P = D?.prochain;
  const ok = !!D?.carte_offerte && !!P && P.payable_carte !== false && P.montant > 0;
  return <>
    <BandeauLocataire titre={t('Payer par carte')} retour={['/locataire/paiements', t('Paiements')]} />
    <PageCarte montant={ok ? argentL(P!.montant, locale, true) : null} interac={D?.interac ?? null}
      quoi={P ? t('Loyer de {mois} · échéance {date}', { mois: locale.startsWith('fr') ? moisAnneeL(P.echeance, locale).toLowerCase() : moisAnneeL(P.echeance, locale), date: dateCourteL(P.echeance, locale) }) : ''} />
  </>;
}
