'use client';
/* Studio › Site web › Vue d'ensemble — activité du site (GS-01, GS-02 de l'inventaire du prototype espace-admin) :
   4 indicateurs qui choisissent la série du graphique, période 7 / 30 / 90 jours, graphique par jour (courbe, barres
   ou cumul) avec la période précédente en pointillé, survol, clavier (flèches, Début, Fin) et résumé pour lecteurs d'écran.
   Source réelle aujourd'hui : les demandes des formulaires du site; visites, clics et conversion attendent Google Analytics 4. */
import { useEffect, useRef, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';

type Point = { d: string; v: number };
export type Activite = { jours: number; courant: Point[]; precedent: Point[] };
type Metrique = 'visites' | 'demandes' | 'clics' | 'conversion';

const METRIQUES: { id: Metrique; nom: string; serie: string; icone: string; ga4: boolean }[] = [
  { id: 'visites', nom: 'Visites', serie: 'Visites', icone: 'users', ga4: true },
  { id: 'demandes', nom: 'Demandes de contact', serie: 'Demandes', icone: 'send', ga4: false },
  { id: 'clics', nom: 'Clics sur les boutons', serie: 'Clics', icone: 'clip', ga4: true },
  { id: 'conversion', nom: 'Taux de conversion', serie: 'Conversion', icone: 'trend', ga4: true },
];
const jf = (d: string) => new Date(d + 'T12:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
const nb = (v: number) => v.toLocaleString('fr-CA', { maximumFractionDigits: 1 });
/* Graduations rondes (1, 2, 2,5, 5, 10 × 10ⁿ), comme le prototype. */
const pas = (x: number) => { if (!(x > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(x))), n = x / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
const cumul = (L: Point[]) => { let s = 0; return L.map((p) => ({ d: p.d, v: (s += p.v) })); };

function useLargeur(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const o = new ResizeObserver(([e]) => setW(e.contentRect.width));
    o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return [ref, w];
}

function Sparkline({ points }: { points: Point[] }) {
  if (points.length < 2) return null;
  const mx = Math.max(1, ...points.map((p) => p.v));
  const d = points.map((p, k) => `${k ? 'L' : 'M'}${(k / (points.length - 1)) * 100},${30 - (p.v / mx) * 26}`).join(' ');
  return <svg className="ga-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><path d={d} vectorEffect="non-scaling-stroke" /></svg>;
}

function Graphique({ points, prec, titre, type, hauteur = 300 }: { points: Point[]; prec: Point[]; titre: string; type: 'ligne' | 'barres' | 'cumul'; hauteur?: number }) {
  const bar = type === 'barres';
  const P = type === 'cumul' ? cumul(points) : points, Q = type === 'cumul' ? cumul(prec) : prec;
  const [i, setI] = useState<number | null>(null);
  const [ref, w] = useLargeur();
  const n = P.length;
  const hi = Math.max(0, ...P.map((p) => p.v), ...Q.map((p) => p.v)), st = pas((hi || 1) * 1.06 / 4), mx = st * 4, T = [0, 1, 2, 3, 4].map((k) => k * st);
  const X = (k: number) => (bar ? ((k + 0.5) / n) * 1000 : n > 1 ? (k / (n - 1)) * 1000 : 500), bw = Math.max(2, (1000 / n) * 0.62), Y = (v: number) => 1000 - (v / mx) * 1000;
  const chemin = (L: Point[]) => L.map((p, k) => (k ? 'L' : 'M') + X(k) + ',' + Y(p.v)).join(' ');
  const lc = chemin(P), lp = Q.length === n ? chemin(Q) : null;
  const nbx = Math.max(2, Math.min(n, Math.floor((w || 640) / 104))), xs = [...new Set(Array.from({ length: nbx }, (_, k) => Math.round((k * (n - 1)) / (nbx - 1))))];
  const pos = (e: React.PointerEvent<HTMLDivElement>) => { const r = e.currentTarget.getBoundingClientRect(), f = (e.clientX - r.left) / r.width; setI(Math.max(0, Math.min(n - 1, bar ? Math.floor(f * n) : Math.round(f * (n - 1))))); };
  const touche = (e: React.KeyboardEvent) => {
    const m: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (e.key in m) { e.preventDefault(); setI((x) => Math.max(0, Math.min(n - 1, (x == null ? n - 1 : x) + m[e.key]))); }
    else if (e.key === 'Home') { e.preventDefault(); setI(0); }
    else if (e.key === 'End') { e.preventDefault(); setI(n - 1); }
    else if (e.key === 'Escape') setI(null);
  };
  const p = i != null ? P[i] : null, q = p && lp ? Q[i!] : null, pk = P.reduce((a, b) => (b.v > a.v ? b : a), P[0]);
  const resume = `${titre}, ${n} jours, ${pk.v ? `sommet ${nb(pk.v)} le ${jf(pk.d)}` : 'aucune donnée'}; flèches gauche et droite pour parcourir les jours.`;
  const yw = Math.max(28, Math.ceil(Math.max(...T.map((t) => nb(t).length)) * 7.4));
  return (
    <div className="ga" style={{ '--ga-h': hauteur + 'px', '--ga-yw': yw + 'px' } as React.CSSProperties}>
      <div className="ga-y" aria-hidden="true">{T.map((t) => <span key={t} style={{ top: Y(t) / 10 + '%' }}>{nb(t)}</span>)}</div>
      <div ref={ref} className="ga-z" tabIndex={0} role="group" aria-roledescription="graphique" aria-label={resume}
        onPointerMove={pos} onPointerDown={pos} onPointerLeave={() => setI(null)} onKeyDown={touche} onBlur={() => setI(null)}>
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
          {T.map((t) => <line key={t} x1="0" x2="1000" y1={Y(t)} y2={Y(t)} className={t ? 'ga-gl' : 'ga-gl0'} vectorEffect="non-scaling-stroke" />)}
          {bar ? P.map((r, k) => <rect key={k} className={k === i ? 'ga-b ga-b-on' : 'ga-b'} x={X(k) - bw / 2} y={Y(r.v)} width={bw} height={Math.max(0, 1000 - Y(r.v))} />)
            : <path className="ga-a" d={'M0,1000 ' + lc.replace(/^M/, 'L') + ' L1000,1000 Z'} />}
          {lp && <path className="ga-p" d={lp} vectorEffect="non-scaling-stroke" />}
          {!bar && <path className="ga-l" d={lc} vectorEffect="non-scaling-stroke" />}
          {p && <line className="ga-h" x1={X(i!)} x2={X(i!)} y1="0" y2="1000" vectorEffect="non-scaling-stroke" />}
        </svg>
        {q && <span className="ga-pt" data-p="1" style={{ left: X(i!) / 10 + '%', top: Y(q.v) / 10 + '%' }} />}
        {p && <span className="ga-pt" style={{ left: X(i!) / 10 + '%', top: Y(p.v) / 10 + '%' }} />}
        {p && <div className="ga-tip" data-d={i! > n / 2 ? 1 : 0} style={{ left: X(i!) / 10 + '%' }} aria-hidden="true">
          <strong>{jf(p.d)}</strong><span><i className="ga-k" />{nb(p.v)} {titre.toLowerCase()}</span>
          {q && <span><i className="ga-k" data-p="1" />{nb(q.v)} · période précédente ({jf(q.d)})</span>}</div>}
      </div>
      <div className="ga-x" aria-hidden="true">{xs.map((k) => <span key={k} style={{ left: X(k) / 10 + '%' }} data-b={k === 0 ? 'd' : k === n - 1 ? 'f' : ''}>{jf(P[k].d)}</span>)}</div>
      <p className="sr" aria-live="polite">{p ? `${jf(p.d)} : ${nb(p.v)}${q ? `. Période précédente : ${nb(q.v)}.` : ''}` : ''}</p>
    </div>
  );
}

/* demo.leaselane.ca seulement : séries d'exemple pour les indicateurs GA4, stables d'un affichage à l'autre (tirées de la date).
   Les conversions réelles (demandes ÷ visites) suivent les demandes fictives de la préproduction. */
const alea = (d: string, sel: number) => { let h = sel; for (const c of d) h = Math.imul(h ^ c.charCodeAt(0), 2654435761); h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 2 ** 32; };
const visites = (d: string) => Math.round((new Date(d + 'T12:00').getDay() % 6 ? 160 : 105) * (0.75 + 0.5 * alea(d, 7)));
function exemple(m: Metrique, L: Point[]): Point[] {
  return L.map((p) => {
    const v = visites(p.d);
    return { d: p.d, v: m === 'visites' ? v : m === 'clics' ? Math.round(v * (0.05 + 0.05 * alea(p.d, 13))) : Math.round((p.v / v) * 1000) / 10 };
  });
}

export function ActiviteSite({ initial, demo = false }: { initial: Activite | null; demo?: boolean }) {
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
  const unite = (m: Metrique) => (m === 'conversion' ? ' %' : '');
  const M = METRIQUES.find((m) => m.id === metrique)!, SM = serie(M);
  const moy = SM ? (M.id === 'conversion' ? valeur('conversion', SM.courant, A.courant) : total(SM.courant) / SM.jours) : 0, pk = SM?.courant.reduce((a, b) => (b.v > a.v ? b : a), SM.courant[0]);
  return (
    <section className="carte-l18 ga-carte" aria-labelledby="ga-titre">
      <div className="ga-tete">
        <div><h2 className="titre-carte" id="ga-titre" style={{ margin: 0 }}>Activité du site</h2><span className="gris texte-13">{jours} derniers jours</span></div>
        <div className="ga-periode" role="group" aria-label="Période">{[7, 30, 90].map((j) => <button key={j} type="button" aria-pressed={jours === j} onClick={() => setJours(j)}>{j} jours</button>)}</div>
      </div>
      {demo && <div className="ga-demo" role="note"><b>Démo</b> Visites, clics et conversion sont des données d’exemple; les demandes de contact viennent de la base de démonstration.</div>}
      {erreur && <div className="bandeau erreur" role="alert">{erreur}</div>}
      <div className="ga-cartes" role="group" aria-label="Indicateur affiché dans le graphique">
        {METRIQUES.map((m) => {
          const S = serie(m), tc = S ? valeur(m.id, S.courant, A.courant) : 0, tp = S ? valeur(m.id, S.precedent, A.precedent) : 0, delta = tp ? ((tc - tp) / tp) * 100 : null;
          return (
            <button key={m.id} type="button" className="ga-kpi" aria-pressed={metrique === m.id} onClick={() => setMetrique(m.id)}>
              <span className="ga-kpi-tete"><span>{m.nom}</span><span className="ga-kpi-ic"><Icone nom={m.icone} taille={16} couleur="#2E5788" /></span></span>
              <b>{S ? nb(tc) + unite(m.id) : !A && !m.ga4 ? '…' : '—'}</b>
              <span className="ga-kpi-pied">
                <span>{S ? (delta == null ? (tc > 0 ? <span className="ga-hausse">nouveau</span> : `0 les ${jours} jours précédents`) : <><span className={delta >= 0 ? 'ga-hausse' : 'ga-baisse'}>{(delta >= 0 ? '+' : '') + nb(delta)} %</span> vs {jours} jours précédents</>) : m.ga4 ? 'Google Analytics 4 à brancher' : ''}</span>
                {S && <Sparkline points={S.courant} />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="ga-graph">
        <div className="ga-graph-tete">
          <div><h3 className="ga-graph-titre">{M.serie} par jour</h3>
            <span className="gris texte-13">{!SM ? (M.ga4 && A ? 'Données disponibles quand Google Analytics 4 sera branché.' : 'Chargement…') : pk && pk.v ? `${M.id === 'conversion' ? 'Sur la période' : 'Moyenne'} ${nb(moy)}${unite(M.id)}${M.id === 'conversion' ? '' : ' par jour'} · Sommet ${nb(pk.v)}${unite(M.id)} le ${jf(pk.d)}` : `Aucune donnée sur les ${jours} derniers jours`}</span></div>
          <div className="ga-legende" aria-hidden="true"><span><i className="ga-k-l" />{jours} derniers jours</span><span><i className="ga-k-p" />{jours} jours précédents</span></div>
          <div className="ga-periode" role="group" aria-label="Type de graphique">{([['ligne', 'Courbe'], ['barres', 'Barres'], ['cumul', 'Cumul']] as const).map(([t, l]) => <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}>{l}</button>)}</div>
        </div>
        {SM ? <Graphique points={SM.courant} prec={SM.precedent} titre={M.serie} type={type} />
          : M.ga4 && A ? <div className="ga-vide"><Icone nom="chart" taille={22} couleur="#2E5788" /><p><b>{M.nom} : pas encore de données.</b><br />Cet indicateur se remplira dès que Google Analytics 4 sera branché au site (avec le consentement « Mesure d’audience » des visiteurs).</p></div>
          : <p className="gris texte-13">Chargement…</p>}
      </div>
    </section>
  );
}
