import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsImm, SOUS_IMM } from '../onglets';
import { Logements, type DonneesLogements } from './Logements';

/* Immeubles · Logements (e28) : tous les logements, chaque loyer contre la médiane du quartier pour le même type; sous le marché; vacants. */
export default async function Page({ searchParams }: { searchParams: Promise<{ statut?: string; immeuble?: string; type?: string }> }) {
  const sp = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_logements', { p: Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) });
  return (
    <CadreEspace icone="building" nom="Immeubles" sous={SOUS_IMM} actif={1} onglets={ongletsImm()}>
      <Logements donnees={(data as DonneesLogements | null) ?? null} filtres={sp} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les logements n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
