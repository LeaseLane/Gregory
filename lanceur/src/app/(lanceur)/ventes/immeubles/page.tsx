import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { Immeubles, type DonneesImmeubles } from './Immeubles';

/* Ventes · Immeubles (rôle) : les immeubles locatifs du rôle d'évaluation en format ouvert; l'équipe inscrit le propriétaire, les immeubles se
   regroupent et un propriétaire de 100 à 200 logements part en suggestion vers Prospection IA (révision humaine avant tout contact). */
export default async function Page({ searchParams }: { searchParams: Promise<{ vue?: string; ville?: string; min?: string; q?: string }> }) {
  const sp = await searchParams;
  const filtres = { vue: sp.vue ?? 'a_identifier', ville: sp.ville ?? '', min: sp.min ?? '12', q: sp.q ?? '' };
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_role_immeubles', { p: filtres });
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={6} onglets={ongletsVentes()}>
      <Immeubles filtres={filtres} donnees={(data as DonneesImmeubles | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les immeubles n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
