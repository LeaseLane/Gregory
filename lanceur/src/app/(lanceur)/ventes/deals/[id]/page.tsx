import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { FicheDeal, type DonneesDeal } from './FicheDeal';

/* Ventes · Fiche deal (maquette l06) : étapes et temps passé, fil, contacts et rôles, tâches; Convertir (e15), Perdu (e14). */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_deal', { p_id: id });
  const d = data as DonneesDeal | null;
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={d?.pipeline.code === 'location' ? 1 : 0} onglets={ongletsVentes()}>
      <FicheDeal donnees={d} erreurLecture={error ? (error.code === 'PT403' || error.code === 'PT404' ? error.message : 'Le deal n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
