import { supabaseServeur } from '@/lib/supabase/serveur';
import { Proposer, type DonneesPropositions } from './Proposer';

export default async function Page({ searchParams }: { searchParams: Promise<{ p?: string; u?: string }> }) {
  const { p, u } = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('portail_propositions');
  return <Proposer donnees={(data as DonneesPropositions | null) ?? null} choisie={p ?? null} logement={u ?? null} erreur={error?.message ?? null} />;
}
