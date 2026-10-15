import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Debours, type DonneesDebours } from './Debours';

/* Finances · Débours (x14) : TAL, huissier, avocat; refacturés au propriétaire au coût réel, hors honoraires (brief TWIM V1). */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_debours');
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={8} onglets={ONGLETS_FIN}>
      <Debours donnees={(data as DonneesDebours | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les débours n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
