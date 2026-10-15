import Link from 'next/link';
import { supabaseServeur } from '@/lib/supabase/serveur';
import { CadreEspace } from '@/composants/CadreEspace';
import { Icone } from '@/composants/Icones';
import { ONGLETS_STUDIO, SOUS_STUDIO } from '../onglets';
import { SousSite, type DonneesSite } from './Commun';

/* Studio › Site web › Vue d'ensemble (GS-01 à GS-05) : activité (demandes réelles; GA4 et Search Console à brancher), contenus, référencement, IA. */
export default async function Page() {
  const { data, error } = await (await supabaseServeur()).rpc('lanceur_site');
  const D = data as DonneesSite | null;
  const pub = D?.articles.filter((a) => a.statut === 'publie') ?? [], moy = pub.length ? Math.round(pub.reduce((s, a) => s + a.score, 0) / pub.length) : null;
  return (
    <CadreEspace icone="globe" nom="Studio" sous={SOUS_STUDIO} actif={0} onglets={ONGLETS_STUDIO}>
      <SousSite actif="/studio/site" />
      {!D ? <div className="bandeau erreur" role="alert">{error?.code === 'PT403' ? error.message : 'Le site n’a pas pu être lu.'}</div> : <>
        <div className="kpis" style={{ marginBottom: 24 }}>
          <div className="kpi"><span>Visites</span><b>—</b><span>Google Analytics 4 {D.branchements.ga4}</span></div>
          <div className="kpi"><span>Demandes de contact · 30 jours</span><b>{D.activite.demandes_30}</b><span>{Object.entries(D.activite.par_type).map(([k, n]) => `${n} ${k}`).join(' · ') || 'Aucune'}</span></div>
          <div className="kpi"><span>Clics sur les boutons</span><b>—</b><span>Mesure à brancher (GA4)</span></div>
          <div className="kpi"><span>Taux de conversion</span><b>—</b><span>Visites requises (GA4)</span></div>
        </div>
        <div className="grille-2-1">
          <section className="carte-l18"><h2 className="titre-carte">Contenus</h2>
            <ul className="lo-docs">
              <li><span className="a-faire-ic"><Icone nom="file" taille={18} couleur="#0C2147" /></span><div><Link className="fort" href="/studio/site/articles">Articles</Link><span className="gris texte-13">{pub.length} publiés · {D.articles.filter((a) => a.statut === 'revision').length} à réviser · {D.articles.filter((a) => a.statut === 'brouillon').length} brouillons</span></div></li>
              <li><span className="a-faire-ic"><Icone nom="building" taille={18} couleur="#0C2147" /></span><div><Link className="fort" href="/studio/site/logements">Logements</Link><span className="gris texte-13">{D.logements.filter((l) => l.sur_le_site).length} sur le site · {D.logements.filter((l) => l.site_statut === 'brouillon' && l.etat !== 'loue').length} à compléter</span></div></li></ul></section>
          <div className="po-colonne">
            <section className="carte-l18"><h2 className="titre-carte">Référencement et IA</h2>
              <p className="texte-13">Score SEO moyen des articles publiés : <b>{moy ?? '—'}</b> sur 100</p>
              <p className="gris texte-13">Search Console {D.branchements.search_console} · audit technique : {D.branchements.audit_seo}</p></section>
            <section className="carte-l18"><h2 className="titre-carte">IA et crédits · 30 jours</h2>
              <p className="texte-13"><b>{D.activite.ia_appels_30}</b> appel{D.activite.ia_appels_30 > 1 ? 's' : ''} à Cléo pour la rédaction · {D.activite.ia_jetons_30.toLocaleString('fr-CA')} jetons</p></section>
          </div></div></>}
    </CadreEspace>
  );
}
