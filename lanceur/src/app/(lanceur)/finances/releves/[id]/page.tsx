import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../../onglets';
import { Releve, type DonneesReleve } from './Releve';

/* Finances · Relevé mensuel (e45, adapté : la facture d'honoraires remplace le « versement »). */
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ m?: string }> }) {
  const [{ id }, { m }] = await Promise.all([params, searchParams]);
  const mois = /^\d{4}-\d{2}$/.test(m ?? '') ? `${m}-01` : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15).toISOString().slice(0, 7) + '-01';
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_releve', { p_owner: id, p_mois: mois });
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={6} onglets={ONGLETS_FIN}>
      <Releve donnees={(data as DonneesReleve | null) ?? null} erreurLecture={error ? (['PT403', 'PT404'].includes(error.code ?? '') ? error.message : 'Le relevé n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
