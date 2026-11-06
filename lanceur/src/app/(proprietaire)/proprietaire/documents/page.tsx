import { supabaseServeur } from '@/lib/supabase/serveur';
import { Documents, type DonneesDocs } from './Documents';
import { moiPortail } from '@/composants/portail/Moi';

export default async function Page() {
  const moi = await moiPortail('proprietaire');
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_documents');
  return <Documents donnees={(data as DonneesDocs | null) ?? null} erreur={error?.message ?? null} lectureSeule={moi.acces === 'comptable'} />;
}
