import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { FicheProspecteur, type DonneesProspecteur } from './FicheProspecteur';

/* Ventes · Fiche prospecteur (Grégory, 2026-11-11) : ce qu'il voit dans son portail, assigner ou retirer des prospects, accès au nouvel espace. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_prospecteur', { p_id: id });
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={5} onglets={ongletsVentes()}>
      <FicheProspecteur donnees={(data as DonneesProspecteur | null) ?? null}
        erreurLecture={error ? (['PT403', 'PT404'].includes(error.code ?? '') ? error.message : 'La fiche du prospecteur n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
