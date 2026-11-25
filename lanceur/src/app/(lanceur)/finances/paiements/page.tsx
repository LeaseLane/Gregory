import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { tServeur } from '@/lib/i18n/serveur';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Paiements, type DonneesPaiements } from './Paiements';

/* Finances · Paiements (l15) : loyers payés aux propriétaires (suivis par Lease Lane), rythme du mois contre le mois précédent, modes de paiement, relances. */
export default async function Page({ searchParams }: { searchParams: Promise<{ periode?: string; immeuble?: string }> }) {
  const { t } = await tServeur();
  const sp = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_paiements', { p: Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) });
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={1} onglets={ONGLETS_FIN}>
      <Paiements donnees={(data as DonneesPaiements | null) ?? null} filtres={sp} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les paiements n’ont pas pu être lus.')) : null} />
    </CadreEspace>
  );
}
