import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Releves, type DonneesReleves } from './Releves';

/* Finances · Relevés : relevés et factures d'honoraires du mois (émis le 5), aperçu de ceux à émettre, paramètres d'honoraires en vigueur. */
export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_releves', { p_mois: /^\d{4}-\d{2}$/.test(m ?? '') ? `${m}-01` : null });
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={6} onglets={ONGLETS_FIN}>
      <Releves maintenant={new Date().toISOString()} donnees={(data as DonneesReleves | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les relevés n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
