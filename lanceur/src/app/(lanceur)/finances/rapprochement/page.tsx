import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Rapprochement, type DonneesRapprochement } from './Rapprochement';

/* Finances · Rapprochement (e42) : opérations sans correspondance avec la proposition de Cléo; une personne rapproche ou ignore. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_rapprochement');
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={3} onglets={ONGLETS_FIN}>
      <Rapprochement donnees={(data as DonneesRapprochement | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Le rapprochement n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
