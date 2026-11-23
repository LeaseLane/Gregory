import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Taux, type Taux as T } from './Taux';

/* Finances · Marché · Taux (phase 2 du plan du 13 nov. 2026) : taux directeur et hypothécaires (Banque du Canada), calcul de refinancement. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_taux');
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={13} onglets={ONGLETS_FIN}>
      <Taux taux={(data as T[] | null) ?? []} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les taux n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
