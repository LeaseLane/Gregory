import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_STUDIO, SOUS_STUDIO } from '../../onglets';
import { SousSite, type DonneesSite } from '../Commun';
import { LogementsSite } from './LogementsSite';

/* Studio › Site web › Logements (GP-01 à GP-10) : à compléter → chiffres → inventaire; tiroir Annonce / Aperçu; seules les fiches « Publié » sortent sur le site. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_site');
  return (
    <CadreEspace icone="globe" nom="Studio" sous={SOUS_STUDIO} actif={0} onglets={ONGLETS_STUDIO}>
      <SousSite actif="/studio/site/logements" />
      <LogementsSite donnees={(data as DonneesSite | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les logements n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
