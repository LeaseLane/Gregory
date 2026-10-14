import { supabaseServeur } from '@/lib/supabase/serveur';
import { Calendrier, type Evt } from './Calendrier';

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string; j?: string }> }) {
  const { m, j } = await searchParams;
  const auj = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
  const mois = /^\d{4}-\d{2}$/.test(m ?? '') ? m! : (j ?? auj).slice(0, 7);
  const { data, error } = await (await supabaseServeur()).rpc('portail_locataire_calendrier', { p_mois: `${mois}-01` });
  return <Calendrier mois={mois} jour={j ?? (auj.startsWith(mois) ? auj : `${mois}-01`)} aujourdhui={auj} evts={(data as Evt[] | null) ?? []} erreur={error?.message ?? null} />;
}
