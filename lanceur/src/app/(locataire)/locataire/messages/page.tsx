import { supabaseServeur } from '@/lib/supabase/serveur';
import { Messages, type Ligne, type Fil } from './Messages';

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string; v?: string; nouveau?: string; sujet?: string; d?: string }> }) {
  const { m, v, nouveau, sujet, d } = await searchParams;
  const sb = await supabaseServeur();
  const { data, error } = await sb.rpc('portail_locataire_messages');
  const liste = (data as Ligne[] | null) ?? [];
  const id = nouveau ? null : m ?? liste.find((x) => !x.archive)?.id ?? null;
  const fil = id ? await sb.rpc('portail_locataire_message', { p_id: id }) : null;
  return <Messages liste={liste} fil={(fil?.data as Fil | null) ?? null} nouveau={!!nouveau || !id} sujetInitial={sujet ?? ''} demande={d ?? null} vue={v ?? 'recus'} erreur={(error ?? fil?.error)?.message ?? null} />;
}
