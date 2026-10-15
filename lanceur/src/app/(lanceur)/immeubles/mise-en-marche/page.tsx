import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsImm, SOUS_IMM } from '../onglets';
import { MiseEnMarche, type DonneesMarche } from './MiseEnMarche';

/* Immeubles · Mise en marché (l13) + Publier l'annonce (e30). */
export default async function Page({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u } = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_mise_en_marche', { p_unit: u ?? null });
  return (
    <CadreEspace icone="building" nom="Immeubles" sous={SOUS_IMM} actif={2} onglets={ongletsImm()}>
      <MiseEnMarche donnees={(data as DonneesMarche | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'La mise en marché n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
