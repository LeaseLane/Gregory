import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ongletsImm, SOUS_IMM } from '../onglets';
import { AValider, type DonneesSoumis } from './AValider';

/* Immeubles · À valider (x09) : immeubles soumis par un propriétaire dans son portail (écran 04); promesse de 2 jours ouvrables. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_immeubles_soumis');
  const d = (data as DonneesSoumis | null) ?? null;
  return (
    <CadreEspace icone="building" nom="Immeubles" sous={SOUS_IMM} actif={4} onglets={ongletsImm(d?.a_valider.length ?? 0)}>
      <AValider donnees={d} maintenant={new Date().toISOString()} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les immeubles soumis n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
