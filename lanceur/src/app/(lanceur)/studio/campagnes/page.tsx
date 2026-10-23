import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_STUDIO, SOUS_STUDIO } from '../onglets';
import { Campagnes, type DonneesCampagnes } from './Campagnes';

/* Studio · Campagnes (maquette l17) : indicateurs du mois, leads par semaine de chaque campagne (même échelle), pages d'arrivée,
   proposition de Cléo décidée par une personne. Dépenses saisies par l'équipe : aucune régie publicitaire n'est branchée. */
export default async function Page({ searchParams }: { searchParams: Promise<{ nouvelle?: string }> }) {
  const [{ data, error }, q] = await Promise.all([(await supabaseServeur()).rpc('lanceur_campagnes'), searchParams]);
  return (
    <CadreEspace icone="globe" nom="Studio" sous={SOUS_STUDIO} actif={1} onglets={ONGLETS_STUDIO}>
      {data ? <Campagnes donnees={data as DonneesCampagnes} nouvelle={q.nouvelle === '1'} demo={process.env.LL_ENV === 'demo'} />
        : <div className="bandeau erreur" role="alert">{error?.code === 'PT403' ? error.message : 'Les campagnes n’ont pas pu être lues.'}</div>}
    </CadreEspace>
  );
}
