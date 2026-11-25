import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { tServeur } from '@/lib/i18n/serveur';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { FacturesFournisseurs, type DonneesFF } from './FacturesFournisseurs';

/* Finances · Factures fournisseurs (e44) : chaque facture liée à son bon de travail, approuvée puis payée à l'échéance; échéancier de la semaine; vérification à trois. */
export default async function Page({ searchParams }: { searchParams: Promise<{ statut?: string; f?: string }> }) {
  const { t } = await tServeur();
  const sp = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_factures_fournisseurs', { p: { statut: sp.statut ?? 'toutes' } });
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={4} onglets={ONGLETS_FIN}>
      <FacturesFournisseurs donnees={(data as DonneesFF | null) ?? null} statut={sp.statut ?? 'toutes'} choisie={sp.f} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les factures n’ont pas pu être lues.')) : null} />
    </CadreEspace>
  );
}
