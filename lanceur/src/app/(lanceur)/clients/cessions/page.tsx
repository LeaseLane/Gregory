import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_CLI, SOUS_CLI } from '../onglets';
import { Cessions, type DonneesCessions } from './Cessions';

/* Clients · Cessions et sous-locations (maquette l10) : demande, fiche, solvabilité, accord du propriétaire dans le délai légal. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_cessions');
  return (
    <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={3}
      onglets={ONGLETS_CLI}>
      <Cessions donnees={(data as DonneesCessions | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les demandes n’ont pas pu être lues.') : null} />
    </CadreEspace>
  );
}
