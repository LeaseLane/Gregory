import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Comptabilite, type DonneesCompta } from './Comptabilite';

/* Finances · Comptabilité (e41) : synchronisation QuickBooks (non branchée, affichée telle quelle), écritures du mois, clôture en liste de contrôle, correspondance des comptes. */
export default async function Page({ searchParams }: { searchParams: Promise<{ mois?: string; type?: string }> }) {
  const sp = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_comptabilite', { p: { mois: /^\d{4}-\d{2}$/.test(sp.mois ?? '') ? `${sp.mois}-01` : null, type: sp.type ?? 'toutes' } });
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={2} onglets={ONGLETS_FIN}>
      <Comptabilite donnees={(data as DonneesCompta | null) ?? null} filtres={sp} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'La comptabilité n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
