import { supabaseServeur } from '@/lib/supabase/serveur';
import { Demandes, type ListeDemandes, type Detail } from './Demandes';

export default async function Page({ searchParams }: { searchParams: Promise<{ d?: string; f?: string }> }) {
  const { d, f } = await searchParams;
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_demandes');
  const liste = (data as ListeDemandes | null) ?? null;
  const choisie = d ?? liste?.demandes.find((x) => x.etat === 'attente_vous')?.id ?? liste?.demandes[0]?.id;
  const detail = choisie ? await supabase.rpc('portail_demande', { p_id: choisie }) : null;
  return <Demandes liste={liste} detail={(detail?.data as Detail | null) ?? null} filtre={f ?? 'toutes'} erreur={error?.message ?? detail?.error?.message ?? null} />;
}
