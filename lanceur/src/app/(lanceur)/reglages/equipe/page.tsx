import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../onglets';
import { SousOnglets } from './SousOnglets';
import { Comptes, type DonneesComptes } from './Comptes';

/* Réglages · Équipe et permissions · Comptes (UA-01 à UA-09). */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_comptes');
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={2} onglets={ONGLETS_REG}>
      <SousOnglets actif="/reglages/equipe" />
      <Comptes donnees={(data as DonneesComptes | null) ?? null} erreurLecture={error ? (error.code === 'PT403' ? error.message : 'Les comptes n’ont pas pu être lus.') : null} />
    </CadreEspace>
  );
}
