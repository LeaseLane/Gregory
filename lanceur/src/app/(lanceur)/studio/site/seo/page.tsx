import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_STUDIO, SOUS_STUDIO } from '../../onglets';
import { SousSite, type DonneesSite } from '../Commun';
import { MotsCles } from './MotsCles';

/* Studio › Site web › SEO et mots-clés (SE-01 à SE-04) : idées avec intention; « Rédiger » ouvre le parcours de Cléo prérempli; audit d'un article existant. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_site');
  return (
    <CadreEspace icone="globe" nom="Studio" sous={SOUS_STUDIO} actif={0} onglets={ONGLETS_STUDIO}>
      <SousSite actif="/studio/site/seo" />
      <MotsCles donnees={(data as DonneesSite | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les mots-clés n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
