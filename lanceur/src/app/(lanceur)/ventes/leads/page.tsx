import { supabaseServeur } from '@/lib/supabase/serveur';
import { tServeur } from '@/lib/i18n/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { Leads, type DonneesLeads } from './Leads';

/* Ventes · Leads entrants (maquette l07) : leads à traiter, routage, doublon possible (fusion e18), sources du mois;
   « Nouveau lead » ouvre le tiroir e16. */
export default async function Page() {
  const { t } = await tServeur();
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_leads');
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={2} onglets={ongletsVentes()}>
      <Leads donnees={(data as DonneesLeads | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les leads n’ont pas pu être lus.')) : null} />
    </CadreEspace>
  );
}
