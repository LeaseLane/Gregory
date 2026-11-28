import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../../onglets';
import { SousOnglets } from '../SousOnglets';
import { tServeur } from '@/lib/i18n/serveur';
import { Roles } from './Roles';
import type { DonneesComptes } from '../Comptes';

/* Réglages · Équipe et permissions · Rôles et permissions (UA-10, UA-11). */
export default async function Page() {
  const { t } = await tServeur();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_comptes');
  return (
    <CadreEspace icone="chart" nom="Réglages" sous={SOUS_REG} actif={2} onglets={ONGLETS_REG}>
      <SousOnglets actif="/reglages/equipe/roles" />
      <Roles donnees={(data as DonneesComptes | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Les rôles n’ont pas pu être lus.')) : null} />
    </CadreEspace>
  );
}
