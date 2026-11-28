import { tServeur } from '@/lib/i18n/serveur';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace, LARGEURS } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { Juridique, type DonneesJur, type Vue } from './Juridique';
import { ONGLETS_JUR as ONGLETS, SOUS_JUR } from './onglets';

/* Espace Juridique (maquettes l16, e46–e51) : une lecture (lanceur_juridique), cinq vues. */
export async function PageJuridique({ vue, id, ouvrir }: { vue: Vue; id?: string; ouvrir?: boolean }) {
  const { t } = await tServeur();
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_juridique');
  const d = (data as DonneesJur | null) ?? null;
  const comptes: Record<Vue, number> = { dossiers: d?.dossiers.filter((x) => ['ouvert', 'mise_en_demeure', 'tal'].includes(x.etape)).length ?? 0, rappels: d?.retards.length ?? 0,
    mises: d?.dossiers.filter((x) => x.mise_en_demeure?.statut === 'draft').length ?? 0, tal: d?.dossiers.filter((x) => x.etape === 'tal').length ?? 0, modeles: 0 };
  const ici = ONGLETS.find(([v]) => v === vue)![2];
  return (
    <CadreEspace icone="scale" nom="Juridique" sous={SOUS_JUR} actif={ONGLETS.findIndex(([v]) => v === vue)}
      onglets={ONGLETS.map(([v, l, href]) => ({ libelle: l, href, compte: comptes[v] || undefined, rouge: v === 'mises' && comptes.mises > 0 }))}
      actions={d?.peut_ecrire ? <a className="bouton bouton-principal" href={`${ici}?ouvrir=1`} style={{ width: LARGEURS['Ouvrir un dossier'] }}><Icone nom="plus" taille={20} couleur="#fff" />{t('Ouvrir un dossier')}</a> : null}>
      <Juridique vue={vue} id={id} ouvrir={ouvrir} donnees={d} erreurLecture={error ? (error.code === 'PT403' ? error.message : t('Le juridique n’a pas pu être lu.')) : null} />
    </CadreEspace>
  );
}
