import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsImm, SOUS_IMM } from '../onglets';
import { Annonces, type DonneesAnnonces } from './Annonces';

/* Immeubles · Annonces (e29) : annonces en ligne contre l'objectif de 21 jours, demandes par canal, proposition de Cléo pour l'annonce qui traîne. */
export default async function Page() {
  const sb = await supabaseServeur();
  const [{ data, error }, { data: motifs }] = await Promise.all([sb.rpc('lanceur_annonces'), sb.rpc('lanceur_motifs_rejet')]);
  return (
    <CadreEspace icone="building" nom="Immeubles" sous={SOUS_IMM} actif={3} onglets={ongletsImm()}>
      <Annonces donnees={(data as DonneesAnnonces | null) ?? null} motifs={(motifs as { code: string; label: string }[] | null) ?? []} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les annonces n’ont pas pu être lues.') : null} />
    </CadreEspace>
  );
}
