import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../../../onglets';
import { Incident, type DonneesIncident } from './Incident';

/* Rapports · Détail d'un incident (maquette e68) : la preuve (temps de réponse mesuré), la chronologie, ce qui attend, et les actions;
   l'incident ne se ferme qu'après trois vérifications réussies de suite. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_incident', { p_id: id });
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={6} onglets={ONGLETS_REG}>
      <Incident donnees={(data as DonneesIncident | null) ?? null} erreurLecture={error ? (error.code === 'PT404' ? 'Incident introuvable.' : error.message) : null} />
    </CadreEspace>
  );
}
