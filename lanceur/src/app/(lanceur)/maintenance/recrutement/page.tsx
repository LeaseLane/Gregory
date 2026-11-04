import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsMaint, SOUS_MAINT } from '../onglets';
import { Recrutement, type DonneesRecrutement } from './Recrutement';
import { Inscriptions, type Inscription } from './Inscriptions';

/* Maintenance · Recrutement (maquette e36) : l'agent trouve et vérifie (licence RBQ), une personne approuve chaque invitation. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const [{ data, error }, ins] = await Promise.all([supabase.rpc('lanceur_recrutement'), supabase.rpc('lanceur_inscriptions')]);
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={3} onglets={ongletsMaint()}>
      <Recrutement donnees={(data as DonneesRecrutement | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Le recrutement n’a pas pu être lu.') : null} />
      <Inscriptions liste={(ins.data as Inscription[] | null) ?? []} erreurLecture={ins.error ? 'Les inscriptions du site n’ont pas pu être lues.' : null} />
    </CadreEspace>
  );
}
