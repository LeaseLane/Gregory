import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Prospecteurs, type Prospecteur } from './Prospecteurs';
import { VENTES, ongletsVentes } from '@/lib/ventes';

/* Ventes · Prospecteurs et classement (x18) : repris du prototype React « Appelants » (onglets Appelants / Classement).
   Données réelles : cold_callers, prospects, comms.calls et les anciens appels saisis à la main. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_prospecteurs');
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={5} onglets={ongletsVentes()}>
      <Prospecteurs liste={(data as Prospecteur[] | null) ?? []} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les prospecteurs n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
