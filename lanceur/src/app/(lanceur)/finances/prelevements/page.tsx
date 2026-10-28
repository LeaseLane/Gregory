import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Prelevements, type DonneesPrelevements } from './Prelevements';

/* Finances · Prélèvements : débits préautorisés des loyers par BMO (accords signés dans le portail locataire). Échéance par défaut : le 1er qui vient. */
export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const sp = await searchParams;
  const d = new Date(), premier = new Date(d.getFullYear(), d.getMonth() + (d.getDate() === 1 ? 0 : 1), 1);
  const echeance = /^\d{4}-\d{2}-\d{2}$/.test(sp.e ?? '') ? sp.e! : premier.toLocaleDateString('en-CA');
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_prelevements', { p_echeance: echeance });
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={9} onglets={ONGLETS_FIN}>
      <Prelevements echeance={echeance} donnees={(data as DonneesPrelevements | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les prélèvements n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
