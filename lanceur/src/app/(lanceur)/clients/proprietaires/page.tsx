import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_CLI, SOUS_CLI } from '../onglets';
import { NouveauClient } from '../NouveauClient';
import { Proprietaires, type DonneesProprios } from './Proprietaires';
import { lireMoi } from '@/lib/moi';

/* Clients · Propriétaires (e19) : parc, loyers payés chez eux ce mois-ci, portail, décisions attendues d'abord; approbations; relevés du mois. */
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; quartier?: string; portail?: string }> }) {
  const sp = await searchParams;
  const moi = await lireMoi();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_proprietaires', { p: Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) });
  return (
    <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={0} onglets={ONGLETS_CLI} actions={<NouveauClient />}>
      <Proprietaires peutSupprimer={moi?.role === 'admin'} donnees={(data as DonneesProprios | null) ?? null} filtres={sp} maintenant={new Date().toISOString()} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les propriétaires n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
