import { supabaseServeur } from '@/lib/supabase/serveur';
import { Calendrier, type Evenement } from './Calendrier';

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string; j?: string }> }) {
  const s = await searchParams, auj = new Date().toISOString().slice(0, 10);
  const mois = s.m ?? auj.slice(0, 7);
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('portail_calendrier', { p_mois: `${mois}-01` });
  return <Calendrier mois={mois} jour={s.j ?? (auj.startsWith(mois) ? auj : `${mois}-01`)} aujourdhui={auj} evenements={(data as Evenement[] | null) ?? []} erreur={error?.message ?? null} />;
}
