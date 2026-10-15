import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsMaint, SOUS_MAINT } from '../../onglets';
import { FicheBon, type DonneesBon } from './FicheBon';

/* Maintenance · Fiche bon de travail (e33). */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_bon', { p_id: id });
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={0} onglets={ongletsMaint()}>
      <FicheBon donnees={(data as DonneesBon | null) ?? null} maintenant={new Date().toISOString()} erreurLecture={error ? (['PT403', 'PT404'].includes(error.code ?? '') ? error.message : 'Le bon de travail n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
