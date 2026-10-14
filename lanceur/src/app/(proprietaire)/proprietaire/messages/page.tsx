import { supabaseServeur } from '@/lib/supabase/serveur';
import { Messages, type Fil, type Ligne } from './Messages';

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string; nouveau?: string; d?: string; v?: string }> }) {
  const s = await searchParams;
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_messages');
  const liste = (data as Ligne[] | null) ?? [];
  const id = s.nouveau ? null : s.m ?? liste.find((x) => !x.archive)?.id;
  const fil = id ? await supabase.rpc('portail_message', { p_id: id }) : null;
  return <Messages liste={liste} fil={(fil?.data as Fil | null) ?? null} nouveau={!!s.nouveau} demande={s.d ?? null} vue={s.v ?? 'recus'} erreur={error?.message ?? null} />;
}
