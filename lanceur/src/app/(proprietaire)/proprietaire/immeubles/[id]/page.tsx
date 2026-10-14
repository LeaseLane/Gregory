import { supabaseServeur } from '@/lib/supabase/serveur';
import { FicheImmeuble, type Fiche } from './FicheImmeuble';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_proprietaire_immeuble', { p_id: id });
  return <FicheImmeuble donnees={(data as Fiche | null) ?? null} erreur={error?.message ?? null} />;
}
