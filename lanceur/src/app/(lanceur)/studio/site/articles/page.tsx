import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_STUDIO, SOUS_STUDIO } from '../../onglets';
import { SousSite, type DonneesSite } from '../Commun';
import { Articles } from './Articles';

/* Studio › Site web › Articles (AR-01, AR-02) : rédiger avec Cléo, chiffres par statut, articles, « À faire SEO ». */
export default async function Page({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_site');
  return (
    <CadreEspace icone="globe" nom="Studio" sous={SOUS_STUDIO} actif={0} onglets={ONGLETS_STUDIO}>
      <SousSite actif="/studio/site/articles" />
      <Articles donnees={(data as DonneesSite | null) ?? null} statut={statut ?? 'tous'} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les articles n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
