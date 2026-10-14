import { supabaseServeur } from '@/lib/supabase/serveur';
import { Finance, type DonneesFinance } from './Finance';

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_finance', m ? { p_mois: `${m}-01` } : {});
  return <Finance donnees={(data as DonneesFinance | null) ?? null} erreur={error?.message ?? null} />;
}
