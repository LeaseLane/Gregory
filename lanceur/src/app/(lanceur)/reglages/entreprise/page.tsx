import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../onglets';
import { tServeur } from '@/lib/i18n/serveur';
import { Entreprise, type DonneesEntreprise } from './Entreprise';

/* Réglages · Entreprise (x13) : fiche de l'entreprise (taxes, numéros), honoraires datés, catalogue de services. */
export default async function Page() {
  const { t } = await tServeur();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_entreprise');
  return (
    <CadreEspace icone="chart" nom="Réglages" sous={SOUS_REG} actif={8} onglets={ONGLETS_REG}>
      <Entreprise donnees={(data as DonneesEntreprise | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les réglages n’ont pas pu être lus.')) : null} />
    </CadreEspace>
  );
}
