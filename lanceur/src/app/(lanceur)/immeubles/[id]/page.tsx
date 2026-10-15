import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsImm, SOUS_IMM } from '../onglets';
import { FicheImmeuble, type DonneesImmeuble } from './FicheImmeuble';

/* Immeubles · Fiche immeuble (e27). */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_immeuble', { p_id: id });
  return (
    <CadreEspace icone="building" nom="Immeubles" sous={SOUS_IMM} actif={0} onglets={ongletsImm()}>
      <FicheImmeuble donnees={(data as DonneesImmeuble | null) ?? null} erreurLecture={error ? (['PT403', 'PT404'].includes(error.code ?? '') ? error.message : 'La fiche n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
