import { supabaseServeur } from '@/lib/supabase/serveur';
import { Demandes, type DemandeLigne, type DemandeDetail } from './Demandes';

export default async function Page({ searchParams }: { searchParams: Promise<{ d?: string; autre?: string; f?: string }> }) {
  const { d, autre, f } = await searchParams;
  const sb = await supabaseServeur();
  const { data: liste, error } = await sb.rpc('portail_locataire_demandes');
  const lignes = (liste as DemandeLigne[] | null) ?? [];
  const id = d ?? lignes.find((x) => x.a_confirmer)?.id ?? lignes.find((x) => x.etat !== 'fermee')?.id ?? lignes[0]?.id;
  const { data: detail, error: e2 } = id ? await sb.rpc('portail_locataire_demande', { p_id: id }) : { data: null, error: null };
  return <Demandes lignes={lignes} detail={(detail as DemandeDetail | null) ?? null} filtre={f ?? 'toutes'} autre={!!autre} maintenant={new Date().toISOString()} erreur={(error ?? e2)?.message ?? null} />;
}
