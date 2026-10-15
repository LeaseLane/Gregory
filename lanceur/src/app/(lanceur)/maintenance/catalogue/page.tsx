import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsMaint, SOUS_MAINT } from '../onglets';
import { Catalogue, type DonneesCatalogue } from './Catalogue';

/* Maintenance · Catalogue (e37) : travaux types, prix de référence, fourchette observée, délai, fournisseur privilégié; Cléo compare chaque soumission à ces prix. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_catalogue');
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={4} onglets={ongletsMaint()}>
      <Catalogue donnees={(data as DonneesCatalogue | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Le catalogue n’a pas pu être lu.') : null} />
    </CadreEspace>
  );
}
