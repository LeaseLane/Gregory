import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_IA } from '../onglets';
import { Routeur, type DonneesRouteur } from './Routeur';

/* Cléo et IA · Routeur IA (maquette l19, réservé aux admins; e65 pour les autres) : quel modèle pour quel agent, coûts du mois,
   budget et projection. Le modèle choisi ici est celui que les fonctions utilisent (modelePour, _shared/ia.ts). */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_routeur_ia');
  return (
    <CadreEspace icone="spark" nom="Cléo et IA" sous="Cléo, automatisations, décisions automatisées et routeur IA" actif={3} onglets={ONGLETS_IA}>
      <Routeur donnees={(data as DonneesRouteur | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Le routeur n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
