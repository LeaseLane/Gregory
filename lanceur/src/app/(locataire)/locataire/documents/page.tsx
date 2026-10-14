import { supabaseServeur } from '@/lib/supabase/serveur';
import { Documents, type DocumentsLoc } from './Documents';

export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('portail_locataire_documents');
  return <Documents donnees={(data as DocumentsLoc | null) ?? null} erreur={error?.message ?? null} />;
}
