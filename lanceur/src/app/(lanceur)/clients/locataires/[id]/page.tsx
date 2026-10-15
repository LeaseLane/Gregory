import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_CLI, SOUS_CLI } from '../../onglets';
import { FicheLocataire, type DonneesLocataire } from './FicheLocataire';

/* Clients · Fiche locataire (e22) : lecture sensible, inscrite au journal à chaque ouverture. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_locataire', { p_id: id });
  return (
    <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={1} onglets={ONGLETS_CLI}>
      <FicheLocataire donnees={(data as DonneesLocataire | null) ?? null} erreurLecture={error ? (['PT403', 'PT404'].includes(error.code ?? '') ? error.message : 'La fiche n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
