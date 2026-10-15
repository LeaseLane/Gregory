import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Releves31, type DonneesRL31 } from './Releves31';

/* Finances · Relevés 31 (x15) : occupants au 31 décembre, production, numéros de logement manquants, corrections, export de contrôle. */
export default async function Page({ searchParams }: { searchParams: Promise<{ a?: string }> }) {
  const { a } = await searchParams, auj = new Date();
  const annee = /^\d{4}$/.test(a ?? '') ? Number(a) : auj.getMonth() <= 1 ? auj.getFullYear() - 1 : auj.getFullYear();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_rl31', { p_annee: annee });
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={7} onglets={ONGLETS_FIN}>
      <Releves31 maintenant={new Date().toISOString()} donnees={(data as DonneesRL31 | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les Relevés 31 n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
