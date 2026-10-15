import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsMaint, SOUS_MAINT } from '../../onglets';
import { FicheFournisseur, type DonneesFournisseur } from './FicheFournisseur';

/* Maintenance · Fiche fournisseur (e35). */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_fournisseur', { p_id: id });
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={2} onglets={ongletsMaint()}>
      <FicheFournisseur donnees={(data as DonneesFournisseur | null) ?? null} erreurLecture={error ? (['PT403', 'PT404'].includes(error.code ?? '') ? error.message : 'La fiche n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
