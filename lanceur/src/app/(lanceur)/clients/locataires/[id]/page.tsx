import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { lireMoi } from '@/lib/moi';
import { ONGLETS_CLI, SOUS_CLI } from '../../onglets';
import { FicheLocataire, type Colocataire, type DonneesLocataire, type LoyersDus } from './FicheLocataire';

/* Clients · Fiche locataire (e22) : lecture sensible, inscrite au journal à chaque ouverture. */
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ payer?: string }> }) {
  const { id } = await params;
  const { payer } = await searchParams;   // Opérations › À traiter : « Marquer payé » ouvre la fenêtre sur ce loyer
  const moi = await lireMoi();
  const sb = await supabaseServeur();
  const { data, error } = await sb.rpc('lanceur_locataire', { p_id: id });
  // Colocataires du bail actif (principal en tête) : lease_tenants, 2026-11-04.
  const bail = (data as DonneesLocataire | null)?.bail?.id;
  const loyers = (await sb.rpc('lanceur_locataire_loyers_dus', { p_tenant: id })).data as LoyersDus | null;
  const colocataires = bail ? ((await sb.rpc('lanceur_bail_colocataires', { p_lease: bail })).data as Colocataire[] | null) ?? [] : [];
  return (
    <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={1} onglets={ONGLETS_CLI}>
      <FicheLocataire admin={moi?.role === 'admin'} payerLoyer={payer ?? null} loyers={loyers} donnees={(data as DonneesLocataire | null) ?? null} colocataires={colocataires} erreurLecture={error ? (['PT403', 'PT404'].includes(error.code ?? '') ? error.message : 'La fiche n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
