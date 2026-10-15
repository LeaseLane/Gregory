import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_CLI, SOUS_CLI } from '../onglets';
import { NouveauClient } from '../NouveauClient';
import { Locataires, type DonneesLocataires } from './Locataires';

/* Clients · Locataires (e21) : retards et prélèvements refusés d'abord; loyers du mois; fins de bail à venir. */
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; filtre?: string }> }) {
  const sp = await searchParams;
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_locataires', { p: Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) });
  return (
    <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={1} onglets={ONGLETS_CLI} actions={<NouveauClient type="locataire" />}>
      <Locataires donnees={(data as DonneesLocataires | null) ?? null} filtres={sp} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les locataires n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
