'use client';
/* Studio › Site web › Vue d'ensemble — activité du site (GS-01, GS-02 de l'inventaire du prototype espace-admin) :
   4 indicateurs qui choisissent la série du graphique, période 7 / 30 / 90 jours, graphique par jour (courbe, barres
   ou cumul) avec la période précédente en pointillé, survol, clavier (flèches, Début, Fin) et résumé pour lecteurs d'écran.
   Source réelle aujourd'hui : les demandes des formulaires du site; visites, clics et conversion attendent Google Analytics 4. */
import { useEffect, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { BarChart, LineChart, ProgressBar, Sparkline } from '@/composants/dataviz';
import { useT } from '@/composants/Langue';
import type { DonneesSite } from './Commun';
import { qc } from '@/lib/format';

type Point = { d: string; v: number };
export type Activite = { jours: number; courant: Point[]; precedent: Point[]; visites_logements?: { id: string; n: number; p: number }[]; ia?: { etape: string; appels: number; ti: number; to: number }[] };
type Metrique = 'visites' | 'demandes' | 'clics' | 'conversion';

const METRIQUES: { id: Metrique; nom: string; serie: string; icone: string; ga4: boolean }[] = [
  { id: 'visites', nom: 'Visites', serie: 'Visites', icone: 'users', ga4: true },
  { id: 'demandes', nom: 'Demandes de contact', serie: 'Demandes', icone: 'send', ga4: false },
  { id: 'clics', nom: 'Clics sur les boutons', serie: 'Clics', icone: 'clip', ga4: true },
  { id: 'conversion', nom: 'Taux de conversion', serie: 'Conversion', icone: 'trend', ga4: true },
];
const jfL = (d: string, locale: string) => new Date(d + 'T12:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' });
const nbL = (v: number, locale: string) => v.toLocaleString(locale, { maximumFractionDigits: 1 });
const PC = (locale: string) => (locale.startsWith('en') ? '%' : ' %');
const cumul = (L: Point[]) => { let s = 0; return L.map((p) => ({ d: p.d, v: (s += p.v) })); };

/* Graphique par jour du kit dataviz : courbe (ou aire sans période précédente), barres ou cumul; période précédente en gris de contexte;
   repère, infobulle, flèches du clavier, légende et tableau viennent du kit. */
function Graphique({ points, prec, titre, type, unite, hauteur = 300 }: { points: Point[]; prec: Point[]; titre: string; type: 'ligne' | 'barres' | 'cumul'; unite: string; hauteur?: number }) {
  const { t, locale } = useT();
  const nb = (v: number) => nbL(v, locale) + unite, jf = (d: string) => jfL(d, locale);
  const P = type === 'cumul' ? cumul(points) : points, Q = type === 'cumul' ? cumul(prec) : prec, avecPrec = Q.length === P.length;
  const labels = P.map((p) => jf(p.d)), n = P.length;
  if (type === 'barres') return <BarChart labels={labels} series={[{ id: 'cur', name: titre, values: P.map((p) => p.v) }]} height={hauteur} format={nb} valueLabels="max" label={t('{titre}, {n} jours', { titre, n })} tableColumn={t('Jour')} />;
  return <LineChart labels={labels} height={hauteur} format={nb} kind={avecPrec ? 'line' : 'area'} label={t('{titre}, {n} jours', { titre, n })} tableColumn={t('Jour')}
    series={[{ id: 'cur', name: t('{n} derniers jours', { n }), values: P.map((p) => p.v), slot: 0 }, ...(avecPrec ? [{ id: 'prec', name: t('{n} jours précédents', { n }), values: Q.map((p) => p.v), color: 'var(--dv-ctx)' }] : [])]} />;
}

/* demo.leaselane.ca seulement : séries d'exemple pour les indicateurs GA4, stables d'un affichage à l'autre (tirées de la date).
   Les conversions réelles (demandes ÷ visites) suivent les demandes fictives de la préproduction. */
const alea = (d: string, sel: number) => { let h = sel; for (const c of d) h = Math.imul(h ^ c.charCodeAt(0), 2654435761); h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32; };
export const visites = (d: string) => Math.round((new Date(d + 'T12:00').getDay() % 6 ? 160 : 105) * (0.75 + 0.5 * alea(d, 7)));
function exemple(m: Metrique, L: Point[]): Point[] {
  return L.map((p) => {
    const v = visites(p.d);
    return { d: p.d, v: m === 'visites' ? v : m === 'clics' ? Math.round(v * (0.05 + 0.05 * alea(p.d, 13))) : Math.round((p.v / v) * 1000) / 10 };
  });
}

export function ActiviteSite({ initial, demo = false, site }: { initial: Activite | null; demo?: boolean; site: DonneesSite }) {
  const { t, locale } = useT();
  const nb = (v: number) => nbL(v, locale), jf = (d: string) => jfL(d, locale), pcs = PC(locale);
  const [jours, setJours] = useState(initial?.jours ?? 30);
  const [donnees, setDonnees] = useState<Record<number, Activite>>(initial ? { [initial.jours]: initial } : {});
  const [erreur, setErreur] = useState('');
  const [metrique, setMetrique] = useState<Metrique>('demandes');
  const [type, setType] = useState<'ligne' | 'barres' | 'cumul'>('ligne');
  useEffect(() => {
    if (donnees[jours]) return;
    supabaseNavigateur().rpc('lanceur_site_activite', { p_jours: jours }).then(({ data, error }) => {
      if (error) setErreur(error.message); else setDonnees((x) => ({ ...x, [jours]: data as Activite }));
    });
  }, [jours, donnees]);
  const A = donnees[jours];
  const total = (L: Point[] = []) => L.reduce((s, p) => s + p.v, 0);
  /* Série d'un indicateur : réelle pour les demandes; exemple sur la démo pour GA4; sinon rien (à brancher). */
  const serie = (m: (typeof METRIQUES)[number]) => !A ? null : !m.ga4 ? A : demo ? { jours: A.jours, courant: exemple(m.id, A.courant), precedent: exemple(m.id, A.precedent) } : null;
  /* Valeur de la période : somme, sauf le taux de conversion (demandes ÷ visites de toute la période). */
  const valeur = (m: Metrique, L: Point[], R: Point[]) => m === 'conversion' ? (total(R) / Math.max(1, total(exemple('visites', R)))) * 100 : total(L);
  const unite = (m: Metrique) => (m === 'conversion' ? pcs : '');
  const M = METRIQUES.find((m) => m.id === metrique)!, SM = serie(M);
  const moy = SM ? (M.id === 'conversion' ? valeur('conversion', SM.courant, A.courant) : total(SM.courant) / SM.jours) : 0, pk = SM?.courant.reduce((a, b) => (b.v > a.v ? b : a), SM.courant[0]);
  return (<>
    <section className="carte-l18 ga-carte" aria-labelledby="ga-titre">
      <div className="ga-tete">
        <div><h2 className="titre-carte" id="ga-titre" style={{ margin: 0 }}>{t('Activité du site')}</h2><span className="gris texte-13">{t('{n} derniers jours', { n: jours })}</span></div>
        <div className="ga-periode" role="group" aria-label={t('Période')}>{[7, 30, 90].map((j) => <button key={j} type="button" aria-pressed={jours === j} onClick={() => setJours(j)}>{t('{n} jours', { n: j })}</button>)}</div>
      </div>
      {demo && <div className="ga-demo" role="note"><b>{t('Démo')}</b> {t('Visites, clics et conversion sont des données d’exemple; les demandes de contact viennent de la base de démonstration.')}</div>}
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="ga-cartes" role="group" aria-label={t('Indicateur affiché dans le graphique')}>
        {METRIQUES.map((m) => {
          const S = serie(m), tc = S ? valeur(m.id, S.courant, A.courant) : 0, tp = S ? valeur(m.id, S.precedent, A.precedent) : 0, delta = tp ? ((tc - tp) / tp) * 100 : null;
          return (
            <button key={m.id} type="button" className="ga-kpi" aria-pressed={metrique === m.id} onClick={() => setMetrique(m.id)}>
              <span className="ga-kpi-tete"><span>{t(m.nom)}</span><span className="ga-kpi-ic"><Icone nom={m.icone} taille={16} couleur="#2E5788" /></span></span>
              <b>{S ? nb(tc) + unite(m.id) : !A && !m.ga4 ? '…' : '—'}</b>
              <span className="ga-kpi-pied">
                <span>{S ? (delta == null ? (tc > 0 ? <span className="ga-hausse">{t('nouveau')}</span> : t('0 les {n} jours précédents', { n: jours })) : <><span className={delta >= 0 ? 'ga-hausse' : 'ga-baisse'}>{(delta >= 0 ? '+' : '') + nb(delta)}{pcs}</span> {t('vs {n} jours précédents', { n: jours })}</>) : m.ga4 ? t('Google Analytics 4 à brancher') : ''}</span>
                {S && <Sparkline values={S.courant.map((p) => p.v)} width={72} height={28} label={t('Tendance')} />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="ga-graph">
        <div className="ga-graph-tete">
          <div><h3 className="ga-graph-titre">{t('{serie} par jour', { serie: t(M.serie) })}</h3>
            <span className="gris texte-13">{!SM ? (M.ga4 && A ? t('Données disponibles quand Google Analytics 4 sera branché.') : t('Chargement…')) : pk && pk.v ? (M.id === 'conversion' ? t('Sur la période {moy}{u} · Sommet {pk}{u} le {date}', { moy: nb(moy), u: unite(M.id), pk: nb(pk.v), date: jf(pk.d) }) : t('Moyenne {moy}{u} par jour · Sommet {pk}{u} le {date}', { moy: nb(moy), u: unite(M.id), pk: nb(pk.v), date: jf(pk.d) })) : t('Aucune donnée sur les {n} derniers jours', { n: jours })}</span></div>
                    <div className="ga-periode" role="group" aria-label={t('Type de graphique')}>{([['ligne', 'Courbe'], ['barres', 'Barres'], ['cumul', 'Cumul']] as const).map(([tp, l]) => <button key={tp} type="button" aria-pressed={type === tp} onClick={() => setType(tp)}>{t(l)}</button>)}</div>
        </div>
        {SM ? <Graphique points={SM.courant} prec={SM.precedent} titre={t(M.serie)} type={type} unite={unite(M.id)} />
          : M.ga4 && A ? <div className="ga-vide"><Icone nom="chart" taille={22} couleur="#2E5788" /><p><b>{t('{nom} : pas encore de données.', { nom: t(M.nom) })}</b><br />{t('Cet indicateur se remplira dès que Google Analytics 4 sera branché au site (avec le consentement « Mesure d’audience » des visiteurs).')}</p></div>
          : <p className="gris texte-13">{t('Chargement…')}</p>}
      </div>
    </section>
    {A && <Blocs A={A} site={site} demo={demo} />}
  </>);
}

/* Blocs Contenus (Articles, Propriétés) et Référencement et IA (SEO et GEO, IA et crédits) du prototype vue-ensemble.jsx :
   chiffres clés à gauche, palmarès ou répartition à droite, données réelles au pied (pastille « Réel »).
   Réel : inventaire, scores SEO, demandes de visite par logement, appels à Cléo (ai_run_log). Vues, clics, Search Console et
   citations IA : exemples sur la démo, « à brancher » ailleurs. */
const nfL = (n: number, locale: string) => Math.round(n).toLocaleString(locale);
const usdL = (x: number, locale: string) => x.toLocaleString(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TARIF = { i: 3 / 1e6, o: 15 / 1e6 }, BUDGET = 20;
const ETAPES: [string, string][] = [['idees', 'Idées et stratégie'], ['redaction', 'Rédaction optimisée'], ['audit', 'Audit SEO / GEO'], ['ton', 'Ton naturel'], ['metadonnees', 'Métadonnées']];
const GA4 = 'GA4 à brancher';
type Mesure = [string, string, number | null, boolean?];

function Delta({ v, inv }: { v: number; inv?: boolean }) {
  const { t, locale } = useT();
  const bon = inv ? v < 0 : v >= 0;
  return <span className={bon ? 'ga-hausse' : 'ga-baisse'}>{(v >= 0 ? '+' : '−') + nbL(Math.abs(Math.round(v * 1000) / 10), locale)}{PC(locale)}<span className="sr"> {t('par rapport à la période précédente')}</span></span>;
}
function Mesures({ items, cols = 2 }: { items: Mesure[]; cols?: number }) {
  return <dl className="vd-ms" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{items.map(([lib, v, d, inv]) => <div key={lib}><dt>{lib}</dt><dd><b>{v}</b>{d != null && <Delta v={d} inv={inv} />}</dd></div>)}</dl>;
}
function Palmares({ cap, cols, rows }: { cap: string; cols: [string, (r: Rang) => string][]; rows: Rang[] }) {
  const { t } = useT();
  /* Sur mobile, la colonne du milieu (clics) est masquée, comme le prototype (vd-hm). */
  const hm = (i: number) => (cols.length === 3 && i === 1 ? 'vd-n vd-hm' : 'vd-n');
  return (
    <table className="vd-t"><caption className="sr">{t('{cap}, 5 premiers', { cap })}</caption>
      <thead><tr><th scope="col" className="vd-rg"><span aria-hidden="true">#</span><span className="sr">{t('Rang')}</span></th><th scope="col">{cap}</th>{cols.map(([lib], i) => <th key={lib} scope="col" className={hm(i)}>{lib}</th>)}</tr></thead>
      <tbody>{rows.length ? rows.slice(0, 5).map((r, i) => <tr key={r.id}><td className="vd-rg">{i + 1}</td><td className="vd-tn" title={r.n}>{r.n}</td>{cols.map(([lib, f], i) => <td key={lib} className={hm(i)}>{f(r)}</td>)}</tr>)
        : <tr><td colSpan={cols.length + 2} className="gris">{t('Aucune donnée pour cette période.')}</td></tr>}</tbody></table>
  );
}
function Barres({ lab, rows, fmt }: { lab: string; rows: { n: string; v: number }[]; fmt: (r: { n: string; v: number }) => string }) {
  const m = Math.max(1e-9, ...rows.map((r) => r.v));
  return <ul className="vd-bl" aria-label={lab}>{rows.map((r) => <li key={r.n}><span className="vd-bl-n">{r.n}</span><span className="vd-bl-b" aria-hidden="true"><i style={{ width: (r.v / m) * 100 + '%' }} /></span><span className="vd-bl-v">{fmt(r)}</span></li>)}</ul>;
}
function Bloc({ ic, id, t: titre, href, lib, gauche, droite, pied }: { ic: string; id: string; t: string; href: string; lib: string; gauche: React.ReactNode; droite: React.ReactNode; pied: React.ReactNode }) {
  const { t } = useT();
  return (
    <section className="carte-l18 vd-blk" aria-labelledby={id}>
      <div className="vd-bt"><span className="vd-h"><span className="ga-kpi-ic"><Icone nom={ic} taille={18} couleur="#0C2147" /></span><h3 id={id}>{titre}</h3></span>
        <Link className="bouton bouton-contour" href={href}><Icone nom="arrow" taille={16} couleur="#0C2147" />{lib}</Link></div>
      <div className="vd-dom"><div>{gauche}</div><div>{droite}</div></div>
      <p className="vd-foot"><span className="vd-reel">{t('Réel')}</span>{pied}</p>
    </section>
  );
}
type Rang = { id: string; n: string; v: number; k: number; c: number; tm?: number; score?: number };

function Blocs({ A, site, demo }: { A: Activite; site: DonneesSite; demo: boolean }) {
  const { t, locale } = useT();
  const nb = (v: number) => nbL(v, locale), jf = (d: string) => jfL(d, locale), nf = (n: number) => nfL(n, locale), usd = (x: number) => usdL(x, locale);
  const pc = (x: number) => nb(Math.round(x * 1000) / 10) + PC(locale);
  const duree = (s: number) => t('{m} min {s} s', { m: Math.floor(s / 60), s: String(Math.round(s % 60)).padStart(2, '0') });
  const P = A.jours, somme = <T,>(L: T[], f: (x: T) => number) => L.reduce((s, x) => s + f(x), 0);
  const sv = somme(A.courant, (p) => visites(p.d)), dl = (k: string) => alea(k, P) * 0.26 - 0.08;
  const pub = site.articles.filter((a) => a.statut === 'publie'), enl = site.logements.filter((l) => l.sur_le_site);
  const moy = pub.length ? Math.round(somme(pub, (a) => a.score) / pub.length) : 0;
  /* Articles : vues, lecture, clics et contacts par article (exemple sur la démo); hors démo, palmarès par score SEO. */
  const arts: Rang[] = pub.map((a) => { const q = (s: number) => alea(a.id, P + s), v = Math.round((sv * 0.6 * (0.4 + q(1))) / Math.max(1, pub.length));
    return { id: a.id, n: a.titre || t('Sans titre'), v, tm: 90 + q(2) * 150, k: Math.round(v * (0.03 + q(3) * 0.05)), c: Math.round(v * (0.006 + q(4) * 0.01)), score: a.score }; })
    .sort((x, y) => (demo ? y.v - x.v : (y.score ?? 0) - (x.score ?? 0)));
  const tv = somme(arts, (x) => x.v), tm = tv ? somme(arts, (x) => (x.tm ?? 0) * x.v) / tv : 0;
  /* Propriétés : demandes de visite réelles par logement; vues et clics « Contacter » en exemple sur la démo. */
  const vl = new Map((A.visites_logements ?? []).map((x) => [x.id, x]));
  const props: Rang[] = enl.map((l) => { const q = (s: number) => alea(l.id, P * 3 + s), v = Math.round((sv * 0.7 * (0.4 + q(1))) / Math.max(1, enl.length));
    return { id: l.id, n: l.libelle, v, k: Math.round(v * (0.04 + q(2) * 0.05)), c: vl.get(l.id)?.n ?? 0 }; }).sort((x, y) => (demo ? y.v - x.v : y.c - x.c));
  const pv = somme(props, (x) => x.v), pd = somme(props, (x) => x.c), pdPrec = somme(enl, (l) => vl.get(l.id)?.p ?? 0);
  /* SEO et GEO (Search Console et citations IA) : exemple sur la démo seulement. */
  const imp = Math.round(sv * (9 + alea('imp', P) * 3)), clic = Math.round(sv * 0.52);
  const reqs = [...new Set([...pub.map((a) => a.mot_cle).filter(Boolean), 'logement à louer québec', '4 ½ à louer québec', 'gestion immobilière québec'])].slice(0, 7)
    .map((q) => { const z = (s: number) => alea(q, P + s), i = Math.round(imp * (0.04 + z(1) * 0.12)); return { id: q, n: q, v: i, k: Math.round(i * (0.02 + z(2) * 0.06)), c: 3 + z(3) * 14 }; })
    .sort((x, y) => y.k - x.k);
  const geo = ([['ChatGPT', 0.42], ['Aperçus IA de Google', 0.31], ['Perplexity', 0.17], ['Copilot', 0.1]] as const).map(([n, f]) => ({ n: t(n), v: Math.max(1, Math.round(P * 0.9 * f * (0.8 + alea(n, P) * 0.4))) }));
  /* IA et crédits : réel (ai_run_log, fonctions studio). Coût estimé au tarif public; budget du mois au prorata. */
  const ia = ETAPES.map(([k, n]) => { const e = (A.ia ?? []).find((x) => x.etape === k); return { n: t(n), v: e ? e.ti * TARIF.i + e.to * TARIF.o : 0, c: e?.appels ?? 0 }; });
  const autres = (A.ia ?? []).filter((x) => !ETAPES.some(([k]) => k === x.etape));
  const cout = somme(A.ia ?? [], (e) => e.ti * TARIF.i + e.to * TARIF.o), appels = somme(A.ia ?? [], (e) => e.appels), jet = somme(A.ia ?? [], (e) => e.ti + e.to);
  const mois = (cout / P) * qc(new Date()).jour, bud = Math.min(1, mois / BUDGET);
  const pl = (n: number, a: string, b: string) => t(n > 1 ? b : a, { n: nf(n) });
  return (<>
    <div className="vd-sec"><h2 className="sr">{t('Contenus')}</h2>
      <Bloc ic="file" id="vd-a" t={t('Articles')} href="/studio/site/articles" lib={t('Articles')}
        gauche={<Mesures items={demo ? [[t('Vues'), nf(tv), dl('a0')], [t('Lecture moyenne'), duree(tm), dl('a1')], [t('Clics sur les boutons'), nf(somme(arts, (x) => x.k)), dl('a2')], [t('Contacts générés'), nf(somme(arts, (x) => x.c)), dl('a3')]]
          : [[t('Vues'), '—', null], [t('Lecture moyenne'), '—', null], [t('Clics sur les boutons'), '—', null], [t('Contacts générés'), '—', null]]} />}
        droite={<Palmares cap={t('Article')} rows={arts} cols={demo ? [[t('Vues'), (r) => nf(r.v)], [t('Clics'), (r) => nf(r.k)], [t('Contacts'), (r) => nf(r.c)]] : [[t('Score SEO'), (r) => `${r.score} / 100`]]} />}
        pied={<><span><b>{pub.length}</b> {t('publiés sur {total}', { total: site.articles.length })}</span><span>{t('Score SEO moyen')} <b>{moy}</b> / 100</span>{!demo && <span className="gris">{t('Vues et clics :')} {t(GA4)}</span>}</>} />
      <Bloc ic="building" id="vd-p" t={t('Propriétés')} href="/studio/site/logements" lib={t('Logements')}
        gauche={<Mesures items={[[t('Vues des fiches'), demo ? nf(pv) : '—', demo ? dl('p0') : null], [t('Clics « Contacter »'), demo ? nf(somme(props, (x) => x.k)) : '—', demo ? dl('p1') : null],
          [t('Demandes de visite'), nf(pd), pdPrec ? pd / pdPrec - 1 : null], [t('Taux de demande'), demo ? pc(pv ? pd / pv : 0) : '—', demo ? dl('p3') : null]]} />}
        droite={<Palmares cap={t('Logement')} rows={props} cols={demo ? [[t('Vues'), (r) => nf(r.v)], [t('Clics'), (r) => nf(r.k)], [t('Demandes'), (r) => nf(r.c)]] : [[t('Demandes de visite'), (r) => nf(r.c)]]} />}
        pied={<><span><b>{enl.length}</b> {t('en ligne')}</span><span><b>{enl.filter((l) => l.etat === 'vacant').length}</b> {t('libres maintenant')}</span><span><b>{site.logements.filter((l) => l.etat === 'loue').length}</b> {t('loués')}</span>{!demo && <span className="gris">{t('Vues et clics :')} {t(GA4)}</span>}</>} />
    </div>
    <div className="vd-sec"><div className="vd-sec-t"><h2>{t('Référencement et IA')}</h2><span className="gris texte-13">{t('{n} derniers jours', { n: P })}</span></div>
      <Bloc ic="search" id="vd-s" t={t('SEO et GEO')} href="/studio/site/seo" lib={t('SEO et mots-clés')}
        gauche={demo ? <><Mesures items={[[t('Impressions Google'), nf(imp), dl('s0')], [t('Clics organiques'), nf(clic), dl('s1')], [t('Taux de clic'), pc(clic / imp), dl('s2')], [t('Position moyenne'), nb(Math.round((8 + alea('pos', P) * 6) * 10) / 10), -alea('dp', P) * 0.12, true]]} />
            <div className="vd-sub"><h4>{t('Citations par les moteurs IA')}</h4><Barres lab={t('Citations par les moteurs IA')} rows={geo} fmt={(r) => pl(r.v, '{n} citation', '{n} citations')} /></div></>
          : <div className="ga-vide"><Icone nom="search" taille={22} couleur="#2E5788" /><p><b>{t('Search Console : {etat}.', { etat: t(site.branchements.search_console) })}</b><br />{t('Impressions, clics organiques, position moyenne et citations par les moteurs IA s’afficheront ici une fois Search Console branché.')}</p></div>}
        droite={demo ? <Palmares cap={t('Requête')} rows={reqs} cols={[[t('Impressions'), (r) => nf(r.v)], [t('Clics'), (r) => nf(r.k)], [t('Position'), (r) => nb(Math.round(r.c * 10) / 10)]]} /> : null}
        pied={<><span>{t('Audit technique : {etat}', { etat: t(site.branchements.audit_seo) })}</span><span>{t('Score SEO moyen')} <b>{moy}</b> / 100</span></>} />
      <Bloc ic="spark" id="vd-i" t={t('IA et crédits')} href="/studio/site/articles" lib={t('Rédiger avec Cléo')}
        gauche={<><div className="vd-cout"><div className="vd-cout-v"><span>{t('Coût estimé, {n} jours', { n: P })}</span><b>{usd(cout)}</b></div>
            <div className="vd-bud"><span className="vd-bud-h"><span>{t('Budget du mois')}</span><span><b>{usd(mois)}</b> {t('sur {montant}', { montant: usd(BUDGET) })}</span></span>
              <ProgressBar size="md" tone={bud > 0.8 ? 'warn' : 'accent'} value={bud * 100} label={t('Budget du mois utilisé')} valueText={`${Math.round(bud * 100)} %`} /></div></div>
          <Mesures cols={3} items={[[t('Appels à Cléo'), nf(appels), null], [t('Jetons'), nf(jet / 1000) + ' k', null], [t('Coût par appel'), usd(appels ? cout / appels : 0), null]]} /></>}
        droite={<div className="vd-sub"><h4>{t('Coût par étape du parcours')}</h4><Barres lab={t('Coût par étape du parcours')} rows={ia} fmt={(r) => usd(r.v) + ' · ' + pl(ia.find((x) => x.n === r.n)!.c, '{n} appel', '{n} appels')} /></div>}
        pied={<><span>{t('{appels} sur {n} jours', { appels: pl(appels, '{n} appel', '{n} appels'), n: P })}{autres.length ? t(' (dont {n} hors parcours)', { n: nf(somme(autres, (x) => x.appels)) }) : ''}</span><span className="gris">{t('Tarif estimé : 3 $ US par million de jetons en entrée, 15 $ US en sortie.')}</span></>} />
    </div>
  </>);
}
