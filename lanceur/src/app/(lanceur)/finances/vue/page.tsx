import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Vue, type DonneesVue } from './Vue';

/* Finances · Vue d'ensemble (phase 1 du plan du 12 nov. 2026) : par client puis par immeuble, revenus perçus, dépenses et net du mois,
   avec les alertes (flux de trésorerie négatif, loyers perçus sous le seuil, dépense inhabituelle). Suit le sélecteur client → immeuble. */
export default async function Page({ searchParams }: { searchParams: Promise<{ mois?: string }> }) {
  const { mois } = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_finance_vue', { p: /^\d{4}-\d{2}$/.test(mois ?? '') ? { mois: `${mois}-01` } : {} });
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={0} onglets={ONGLETS_FIN}>
      <Vue donnees={(data as DonneesVue | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'La vue d’ensemble n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
