import { supabaseServeur } from '@/lib/supabase/serveur';
import { Finance, type DonneesFinance, type DonneesRL31 } from './Finance';

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string; a?: string }> }) {
  const { m, a } = await searchParams;
  const supabase = await supabaseServeur();
  const auj = new Date(), annee = /^\d{4}$/.test(a ?? '') ? Number(a) : auj.getMonth() <= 1 ? auj.getFullYear() - 1 : auj.getFullYear();
  const [{ data, error }, rl31] = await Promise.all([supabase.rpc('portail_finance', m ? { p_mois: `${m}-01` } : {}), supabase.rpc('portail_rl31', { p_annee: annee })]);
  return <Finance donnees={(data as DonneesFinance | null) ?? null} rl31={(rl31.data as DonneesRL31 | null) ?? null} erreur={error?.message ?? null} />;
}
