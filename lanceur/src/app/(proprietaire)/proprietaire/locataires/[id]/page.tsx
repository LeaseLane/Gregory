import { supabaseServeur } from '@/lib/supabase/serveur';
import { FicheLocataire, type FicheLoc } from './FicheLocataire';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_proprietaire_locataire', { p_id: id });
  return <FicheLocataire donnees={(data as FicheLoc | null) ?? null} erreur={error?.message ?? null} />;
}
