import { supabaseServeur } from '@/lib/supabase/serveur';
import { Prospecteur, type Ligne } from './Prospecteur';

/* Ses prospects seulement : assignés à lui ou créés par lui (même règle que la RLS et caller-api; filtre explicite pour un appelant qui est aussi de l'équipe). */
export default async function Page() {
  const sb = await supabaseServeur();
  const { data: { user } } = await sb.auth.getUser();
  const { data: moi } = await sb.from('cold_callers').select('id').eq('user_id', user!.id).maybeSingle();
  const { data, error } = await sb.from('prospects').select('id,full_name,company_name,phone,email,num_doors,stage,next_followup_date,created_by_caller_id,created_at')
    .or(`assigned_caller_id.eq.${moi!.id},created_by_caller_id.eq.${moi!.id}`).is('archived_at', null).order('created_at', { ascending: false }).limit(500);
  return <Prospecteur lignes={(data as Ligne[] | null) ?? []} moi={moi!.id} erreur={error ? 'Vos prospects n’ont pas pu être lus.' : null} />;
}
