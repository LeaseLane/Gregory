import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_IA } from '../onglets';
import { Decisions, type DonneesDecisions } from './Decisions';

/* Cléo et IA · Décisions automatisées (maquette e57) : ce que les agents décident seuls, leur exactitude mesurée sur un échantillon
   vérifié par une personne, et la file des décisions à réviser (sous 80 % de confiance, rien n'est appliqué avant votre décision). */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_decisions_ia');
  return (
    <CadreEspace icone="spark" nom="Cléo et IA" sous="Cléo, automatisations, décisions automatisées et routeur IA" actif={2} onglets={ONGLETS_IA}>
      <Decisions donnees={(data as DonneesDecisions | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les décisions n’ont pas pu être lues.') : null} />
    </CadreEspace>
  );
}
