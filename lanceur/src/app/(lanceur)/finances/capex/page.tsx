import { supabaseServeur } from '@/lib/supabase/serveur';
import { MarcheNav } from '../MarcheNav';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Capex } from './Capex';

/* Finances · Marché · CapEx (phase 2 du plan du 13 nov. 2026) : dépenses en capital par immeuble sur 20 ans, avec inflation et alerte de liquidités. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_immeubles', { p: {} });
  const immeubles = ((data as { immeubles?: { id: string; adresse: string }[] } | null)?.immeubles ?? []).map((i) => ({ id: i.id, adresse: i.adresse }));
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={12} onglets={ONGLETS_FIN}>
      <MarcheNav actif="capex" />
      <Capex immeubles={immeubles} erreurLecture={error ? 'Les immeubles n’ont pas pu être lus.' : null} />
    </CadreEspace>
  );
}
