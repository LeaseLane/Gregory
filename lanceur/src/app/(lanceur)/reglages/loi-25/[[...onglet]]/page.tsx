import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_REG, SOUS_REG } from '../../onglets';
import { Loi25, type DonneesLoi25 } from './Loi25';

/* Réglages · Loi 25 (e60, x05 à x08; prototype CF-01 à CF-19) : vue d'ensemble, demandes, consentements, conservation, documents, incidents. */
export default async function Page({ params, searchParams }: { params: Promise<{ onglet?: string[] }>; searchParams: Promise<{ d?: string }> }) {
  const [{ onglet }, { d }] = await Promise.all([params, searchParams]);
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_loi25');
  return (
    <CadreEspace icone="chart" nom="Rapports et réglages" sous={SOUS_REG} actif={3} onglets={ONGLETS_REG}>
      <Loi25 onglet={onglet?.[0] ?? 'vue'} choisie={d} donnees={(data as DonneesLoi25 | null) ?? null} maintenant={new Date().toISOString()}
        erreurLecture={error ? (error.code === 'PT403' ? error.message : 'La conformité n’a pas pu être lue.') : null} />
    </CadreEspace>
  );
}
