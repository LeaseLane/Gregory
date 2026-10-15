import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsImm, SOUS_IMM } from './onglets';
import { Immeubles, type DonneesParc } from './Immeubles';
import { AjouterImmeuble } from './AjouterImmeuble';

/* Immeubles · Immeubles (e26) : indicateurs du parc, immeubles triés par demandes ouvertes (l'urgence en rouge), occupation par quartier. */
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_immeubles', { p: sp.q ? { q: sp.q } : {} });
  const d = (data as DonneesParc | null) ?? null;
  return (
    <CadreEspace icone="building" nom="Immeubles" sous={SOUS_IMM} actif={0} onglets={ongletsImm()} actions={d && <AjouterImmeuble proprietaires={d.proprietaires} quartiers={d.quartiers_connus} adresses={d.immeubles.map((i) => i.adresse)} />}>
      <Immeubles donnees={d} q={sp.q ?? ''} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Le parc n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
