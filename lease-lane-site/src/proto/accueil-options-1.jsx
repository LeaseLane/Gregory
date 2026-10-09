/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-options-1.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon, Button, Badge, Overline } from '@/components/ds';
import { Fleche } from '@/proto/blocs';
import { __ssr } from '@/lib/hydratation';
const aller = to => {
  window.location.hash = to;
};
const sansMvt = () => !!(((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : undefined));
const BOITE = {
  maxWidth: 'var(--web-conteneur)',
  margin: '0 auto',
  padding: 'var(--web-section) var(--web-gouttiere)'
};
const MAR = 'var(--marine-900)',
  BL = '#4581CB',
  CL = '#B5D4F7',
  FIN = '1px solid var(--bordure-fine)',
  FIN_M = '1px solid rgba(200,218,240,.16)';
const SUR = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase'
};
const P_M = {
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.7,
  color: 'var(--bleu-100)',
  maxWidth: '58ch'
};
const HAUT = 'calc(var(--web-entete,108px) + 1px)';
const fmt = (n, d) => d ? n.toFixed(d).replace('.', ',') : String(Math.round(n));
const Ex = () => <Badge ton="alerte" taille="s">Exemple</Badge>;
const Fl = ({
  to,
  clair,
  children
}) => <Fleche to={to} clair={clair}>{children}</Fleche>;
const surl = (t, c) => String(t).split(/[{}]/).map((s, i) => i % 2 ? <span key={i} style={{
  color: c
}}>{s}</span> : s);
function useVu(ref, seuil) {
  const [v, setV] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (sansMvt() || !('IntersectionObserver' in window)) {
      setV(true);
      return;
    }
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) {
        setV(true);
        io.disconnect();
      }
    }, {
      threshold: seuil == null ? .3 : seuil
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return v;
}
function useCompte(cible, actif, duree, tour) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!actif) return;
    if (sansMvt()) {
      setN(cible);
      return;
    }
    let raf,
      t0 = null;
    const d = duree || 1400;
    const f = t => {
      if (t0 === null) t0 = t;
      const p = Math.min(1, (t - t0) / d);
      setN(cible * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;
    };
    setN(0);
    raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? cancelAnimationFrame(raf) : undefined;
  }, [actif, cible, tour]);
  return n;
}
const vue = () => {
  const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;
  if (sc) {
    const r = sc.getBoundingClientRect();
    return {
      sc,
      top: r.top,
      h: r.height
    };
  }
  return {
    sc: window,
    top: 0,
    h: (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.innerHeight : undefined
  };
};
/* Défilement : « collant » = progression dans un bloc haut dont l'enfant reste fixé; sinon progression pendant le passage du bloc. */
function useDefil(ref, mode) {
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    const {
      sc
    } = vue();
    let raf = 0;
    const f = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const {
          top,
          h
        } = vue(),
        r = el.getBoundingClientRect();
      const v = mode === 'collant' ? (top - r.top) / Math.max(1, r.height - h) : (top + h * .8 - r.top) / Math.max(1, r.height);
      setP(Math.max(0, Math.min(1, v)));
    };
    const g = () => {
      if (!raf) raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;
    };
    f();
    sc.addEventListener('scroll', g, {
      passive: true
    });
    window.addEventListener('resize', g);
    return () => {
      sc.removeEventListener('scroll', g);
      window.removeEventListener('resize', g);
      cancelAnimationFrame(raf);
    };
  }, [mode]);
  return p;
}
/* Compte le premier nombre d'un texte (« 17 jours », « le 15 », « 98,6 ») sans toucher au reste. */
function Compte({
  s,
  actif,
  duree
}) {
  const m = String(s).match(/\d+(?:,\d+)?/);
  const c = m ? parseFloat(m[0].replace(',', '.')) : 0,
    d = m && m[0].indexOf(',') >= 0 ? 1 : 0;
  const n = useCompte(c, actif, duree);
  if (!m) return s;
  return <React.Fragment>{s.slice(0, m.index)}<span style={{
      fontVariantNumeric: 'tabular-nums'
    }}>{fmt(n, d)}</span>{s.slice(m.index + m[0].length)}</React.Fragment>;
}

/* Barre de revue au-dessus de chaque section : Actuelle, A, B, C (mémorisé). */
function useChoix(k, d = '1') {
  const c = 'll-acc-' + k;
  const [o, setO] = React.useState(() => {
    try {
      return null || d;
    } catch (e) {
      return d;
    }
  });
  return [o, v => {
    try {
      void 0;
    } catch (e) {}
    setO(v);
  }];
}
function Revue({
  k,
  n,
  noms,
  actuel,
  options,
  lettres,
  defaut
}) {
  const [o, set] = useChoix(k, defaut);
  const l = [['0', 'Actuelle'], ...noms.map((x, i) => [String(i + 1), (lettres ? lettres[i] : 'ABCDEFGHIJKL'[i]) + ' · ' + x])];
  return <div data-revue={k}>
    <div style={{
      background: 'var(--bleu-025)',
      borderTop: FIN,
      borderBottom: FIN
    }}><div style={{
        maxWidth: 'var(--web-conteneur)',
        margin: '0 auto',
        padding: '10px var(--web-gouttiere)',
        display: 'flex'
      }}>
      <div role="group" aria-label={'Options de design, ' + n} style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 4px 4px 14px',
          borderRadius: '999px',
          border: '1px dashed var(--bleu-300)',
          background: '#fff'
        }}>
        <span style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--bleu-700)',
            marginRight: '6px'
          }}>{'Revue · ' + n}</span>
        {l.map(([v, t]) => <button key={v} type="button" aria-pressed={o === v} onClick={() => set(v)} style={{
            height: '34px',
            padding: '0 14px',
            border: 0,
            borderRadius: 'var(--rayon-bouton)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '13px',
            fontWeight: 600,
            background: o === v ? MAR : 'transparent',
            color: o === v ? '#fff' : MAR
          }}>{t}</button>)}</div></div></div>
    <div key={o}>{o === '0' ? actuel : options[+o - 1]}</div></div>;
}

/* ——— Nos chiffres ——— */

/* Cadran 24 h : graduations qui s'allument, aiguille à l'heure de Québec, Cléo au centre. */

/* A · Visualisés : chaque chiffre a sa figure (cadran 24 h, 30 jours, 100 logements); les compteurs partent à l'arrivée, le survol rejoue. */

/* ——— Cléo en action ——— */

/* A · Console : les quatre tâches en onglets; défilement automatique toutes les 5 s, en pause au survol. */

/* B · Orbite : Cléo au centre, anneau qui tourne; les quatre tâches autour, reliées au portrait au survol. */

/* C · Veille de nuit : au défilement, le ciel s'assombrit, les étoiles paraissent, l'horloge avance de 18 h à 6 h et les tâches s'allument une à une. */

let ACC_H = {
  Icon,
  Button,
  Badge,
  Overline,
  aller,
  sansMvt,
  BOITE,
  MAR,
  BL,
  CL,
  FIN,
  FIN_M,
  SUR,
  P_M,
  HAUT,
  fmt,
  Ex,
  Fl,
  surl,
  useVu,
  useCompte,
  useDefil,
  Compte,
  Revue,
  vue
};
export { ACC_H };
