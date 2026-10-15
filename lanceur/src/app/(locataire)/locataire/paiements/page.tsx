import { supabaseServeur } from '@/lib/supabase/serveur';
import { Paiements, type PaiementsLoc, type Recu, type RL31 } from './Paiements';

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string; mode?: string; rl31?: string }> }) {
  const { r, mode, rl31 } = await searchParams;
  const sb = await supabaseServeur();
  const { data, error } = await sb.rpc('portail_locataire_paiements');
  const recu = r ? await sb.rpc('portail_locataire_recu', { p_id: r }) : null;
  const releve31 = rl31 ? await sb.rpc('portail_locataire_rl31', { p_id: rl31 }) : null;
  return <Paiements donnees={(data as PaiementsLoc | null) ?? null} recu={(recu?.data as Recu | null) ?? null} erreurRecu={(recu?.error ?? releve31?.error)?.message ?? null} rl31={(releve31?.data as RL31 | null) ?? null} mode={!!mode} maintenant={new Date().toISOString()} erreur={error?.message ?? null} />;
}
