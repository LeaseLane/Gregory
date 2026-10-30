import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { AAppeler, type DonneesAppels } from './AAppeler';

/* Ventes · À appeler : la file d'appels de l'équipe de vente (propriétaires du rôle d'évaluation avec un téléphone publié), un à la fois. */
export default async function Page({ searchParams }: { searchParams: Promise<{ ville?: string }> }) {
  const sp = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_appels_file', { p: { ville: sp.ville ?? '' } });
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={7} onglets={ongletsVentes()}>
      <AAppeler ville={sp.ville ?? ''} donnees={(data as DonneesAppels | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'La file d’appels n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
