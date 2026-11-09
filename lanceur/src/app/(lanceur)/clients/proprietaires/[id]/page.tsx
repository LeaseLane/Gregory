import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_CLI, SOUS_CLI } from '../../onglets';
import { FicheProprietaire, type DonneesProprio, type Candidat } from './FicheProprietaire';

/* Clients · Fiche propriétaire (e20). */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServeur();
  const [{ data, error }, { data: props }] = await Promise.all([sb.rpc('lanceur_proprietaire', { p_id: id }), sb.rpc('lanceur_propositions_locataires', { p_owner: id })]);
  return (
    <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={0} onglets={ONGLETS_CLI}>
      <FicheProprietaire donnees={(data as DonneesProprio | null) ?? null} propositions={(props as Candidat[] | null) ?? []} erreurLecture={error ? (['PT403', 'PT404'].includes(error.code ?? '') ? error.message : 'La fiche n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
