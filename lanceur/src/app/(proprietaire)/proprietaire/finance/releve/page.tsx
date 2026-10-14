import { supabaseServeur } from '@/lib/supabase/serveur';
import { Releve, type DonneesReleve } from './Releve';

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const mois = m ?? new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15).toISOString().slice(0, 7);
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_releve', { p_mois: `${mois}-01` });
  return <Releve donnees={(data as DonneesReleve | null) ?? null} erreur={error?.message ?? null} />;
}
