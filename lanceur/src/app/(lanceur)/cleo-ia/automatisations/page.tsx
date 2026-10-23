import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Automatisations, type Etat, type DonneesAuto } from './Automatisations';
import { ONGLETS_IA } from '../onglets';

/* Cléo et IA · Automatisations (maquette l18) et coupe-circuit « Suspendre tous les envois » (e70).
   Seules les règles qui existent vraiment sont listées (T2 : la relance de loyer); les autres arrivent avec leurs tranches. */
export default async function Page() {
  const supabase = await supabaseServeur();
  const [{ data, error }, { data: auto }] = await Promise.all([supabase.rpc('lanceur_envois_etat'), supabase.rpc('lanceur_automatisations')]);
  return (
    <CadreEspace
      icone="spark"
      nom="Cléo et IA"
      sous="Cléo, automatisations, décisions automatisées et routeur IA"
      actif={1}
      onglets={ONGLETS_IA.map((o) => o.libelle === 'Automatisations' ? { ...o, compte: ((auto as DonneesAuto | null)?.regles ?? []).filter((r) => r.existe).length || undefined } : o)}
    >
      <Automatisations etat={(data as Etat | null) ?? null} auto={(auto as DonneesAuto | null) ?? null} erreurLecture={error ? 'L’état des envois n’a pas pu être lu.' : null} />
    </CadreEspace>
  );
}
