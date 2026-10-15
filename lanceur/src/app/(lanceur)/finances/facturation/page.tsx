import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Facturation, type DonneesFacturation } from './Facturation';

/* Finances · Facturation et PAD (e40) : prochain prélèvement, mandats, factures d'honoraires et échecs. Optimal Paiement à brancher (T6). */
export default async function Page({ searchParams }: { searchParams: Promise<{ lot?: string }> }) {
  const { lot } = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_facturation', { p: lot ? { lot } : {} });
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={1} onglets={ONGLETS_FIN}>
      <Facturation donnees={(data as DonneesFacturation | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'La facturation n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
