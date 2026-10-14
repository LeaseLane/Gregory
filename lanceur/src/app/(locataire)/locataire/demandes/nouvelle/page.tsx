import { supabaseServeur } from '@/lib/supabase/serveur';
import { Nouvelle } from './Nouvelle';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams;
  const { data } = await (await supabaseServeur()).rpc('portail_locataire_logement');
  const l = data as { adresse?: string; logement?: string } | null;
  return <Nouvelle logement={l?.adresse ? `${l.adresse.replace(/^(\d+),? (?:avenue |rue |boulevard |chemin )?/i, '$1 ').replace(/, Québec$/, '')} — ${l.logement}` : ''} initial={p} aujourdhui={new Date().toISOString().slice(0, 10)} />;
}
