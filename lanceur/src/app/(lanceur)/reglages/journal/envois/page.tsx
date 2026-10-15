import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../../onglets';
import { Envois, type Envoi } from './Envois';

/* Rapports et réglages · Journal › Envois (x12) : courriels et SMS envoyés (file comms.outbox) et SMS historiques (sms_log), en lecture seule. */
export default async function Page({ searchParams }: { searchParams: Promise<{ canal?: string; statut?: string }> }) {
  const { canal, statut } = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_journal_envois', { p: { ...(canal ? { canal } : {}), ...(statut ? { statut } : {}) } });
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={4} onglets={ONGLETS_REG}>
      <Envois liste={(data as Envoi[] | null) ?? []} canal={canal ?? ''} statut={statut ?? ''} erreur={error ? (error.code === 'PT403' ? error.message : 'Le journal n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
