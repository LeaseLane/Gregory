import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsMaint, SOUS_MAINT } from '../onglets';
import { Recrutement, type DonneesRecrutement } from './Recrutement';

/* Maintenance · Recrutement (maquette e36) : l'agent trouve et vérifie (licence RBQ), une personne approuve chaque invitation. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_recrutement');
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={3} onglets={ongletsMaint()}>
      <Recrutement donnees={(data as DonneesRecrutement | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Le recrutement n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
