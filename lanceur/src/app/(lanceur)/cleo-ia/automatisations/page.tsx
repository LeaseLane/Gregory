import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Automatisations, type Etat } from './Automatisations';

/* Cléo et IA · Automatisations (maquette l18) et coupe-circuit « Suspendre tous les envois » (e70).
   Seules les règles qui existent vraiment sont listées (T2 : la relance de loyer); les autres arrivent avec leurs tranches. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_envois_etat');
  return (
    <CadreEspace
      icone="spark"
      nom="Cléo et IA"
      sous="Cléo, automatisations, décisions automatisées et routeur IA"
      actif={1}
      onglets={[{ libelle: 'Cléo' }, { libelle: 'Automatisations', href: '/cleo-ia/automatisations' }, { libelle: 'Décisions automatisées' }, { libelle: 'Routeur IA' }]}
    >
      <Automatisations etat={(data as Etat | null) ?? null} erreurLecture={error ? 'L’état des envois n’a pas pu être lu.' : null} />
    </CadreEspace>
  );
}
