import { supabaseServeur } from '@/lib/supabase/serveur';
import { Documents, type DonneesDocs } from './Documents';

export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_documents');
  return <Documents donnees={(data as DonneesDocs | null) ?? null} erreur={error?.message ?? null} />;
}
