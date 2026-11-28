import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../../onglets';
import { SousOnglets } from '../SousOnglets';
import { tServeur } from '@/lib/i18n/serveur';
import { Securite, type DonneesSecurite, type DonneesRevue } from './Securite';

/* Réglages · Équipe et permissions · Sécurité (UA-13 à UA-15) : connexion et sessions, revue trimestrielle, responsable de la protection des renseignements. */
export default async function Page() {
  const { t } = await tServeur();
  const sb = await supabaseServeur();
  const [{ data, error }, { data: revue }] = await Promise.all([sb.rpc('lanceur_securite'), sb.rpc('lanceur_revue_acces')]);
  return (
    <CadreEspace icone="chart" nom="Réglages" sous={SOUS_REG} actif={2} onglets={ONGLETS_REG}>
      <SousOnglets actif="/reglages/equipe/securite" />
      <Securite donnees={(data as DonneesSecurite | null) ?? null} revue={(revue as DonneesRevue | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les réglages n’ont pas pu être lus.')) : null} />
    </CadreEspace>
  );
}
