import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { tServeur } from '@/lib/i18n/serveur';
import { CadreEspace, LARGEURS } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { ongletsMaint, SOUS_MAINT } from '../../onglets';
import { Projet, type DonneesProjet } from './Projet';

/* Maintenance · Fiche projet (maquette e74) : 5 étapes datées, soumissions comparées sur la portée approuvée, cadrage. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await tServeur();
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_projet', { p_id: id });
  const D = data as DonneesProjet | null;
  const actions = D?.peut_ecrire ? <Link href="/maintenance/projets?nouveau=1" className="bouton bouton-principal" style={{ minWidth: LARGEURS['Nouveau projet'] }}><Icone nom="plus" taille={20} couleur="#fff" />{t('Nouveau projet')}</Link> : null;
  return (
    <CadreEspace icone="wrench" nom="Maintenance" sous={SOUS_MAINT} actif={5} onglets={ongletsMaint()} actions={actions}>
      {D ? <Projet d={D} /> : <div className="bandeau erreur" role="alert">{error?.code === 'PT403' || error?.code === 'PT404' ? error.message : t('Le projet n’a pas pu être lu.')}</div>}
    </CadreEspace>
  );
}
