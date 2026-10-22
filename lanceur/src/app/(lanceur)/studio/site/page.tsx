import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { ONGLETS_STUDIO, SOUS_STUDIO } from '../onglets';
import { SousSite, type DonneesSite } from './Commun';
import { ActiviteSite, type Activite } from './ActiviteSite';

/* Studio › Site web › Vue d'ensemble (GS-01 à GS-05) : activité (demandes réelles; GA4 et Search Console à brancher), contenus, référencement, IA. */
export default async function Page() {
  const sb = await supabaseServeur();
  const [{ data, error }, { data: A }] = await Promise.all([sb.rpc('lanceur_site'), sb.rpc('lanceur_site_activite', { p_jours: 30 })]);
  const D = data as DonneesSite | null;
  const pub = D?.articles.filter((a) => a.statut === 'publie') ?? [], moy = pub.length ? Math.round(pub.reduce((s, a) => s + a.score, 0) / pub.length) : null;
  return (
    <CadreEspace icone="globe" nom="Studio" sous={SOUS_STUDIO} actif={0} onglets={ONGLETS_STUDIO}>
      <SousSite actif="/studio/site" />
      {!D ? <div className="bandeau erreur" role="alert">{error?.code === 'PT403' ? error.message : 'Le site n’a pas pu être lu.'}</div> : <>
        <ActiviteSite initial={A as Activite | null} demo={process.env.LL_ENV === 'demo'} site={D} />

</>}
    </CadreEspace>
  );
}
