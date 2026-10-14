import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { Prospection, type DonneesProspection } from './Prospection';

/* Ventes · Prospection IA (maquette l08) : l'agent trouve, une personne révise avant tout contact, séquences encadrées. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_prospection');
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={4} onglets={ongletsVentes()}>
      <Prospection donnees={(data as DonneesProspection | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'La prospection n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
