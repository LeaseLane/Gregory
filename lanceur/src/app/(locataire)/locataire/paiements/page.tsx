import { supabaseServeur } from '@/lib/supabase/serveur';
import { Paiements, type PaiementsLoc, type Recu } from './Paiements';

export default async function Page({ searchParams }: { searchParams: Promise<{ r?: string; mode?: string }> }) {
  const { r, mode } = await searchParams;
  const sb = await supabaseServeur();
  const { data, error } = await sb.rpc('portail_locataire_paiements');
  const recu = r ? await sb.rpc('portail_locataire_recu', { p_id: r }) : null;
  return <Paiements donnees={(data as PaiementsLoc | null) ?? null} recu={(recu?.data as Recu | null) ?? null} erreurRecu={recu?.error?.message ?? null} mode={!!mode} maintenant={new Date().toISOString()} erreur={error?.message ?? null} />;
}
