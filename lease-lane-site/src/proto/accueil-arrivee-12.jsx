/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-arrivee-12.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { ACC_H } from '@/proto/accueil-options-1';
import { PARC_H } from '@/proto/accueil-options-3';
import { ACC_ETAPES } from '@/proto/sections-accueil';
import { useEtatClient, __ssr } from '@/lib/hydratation';
const ED = () => ACC_ETAPES,
  d = ms => ({
    '--d': ms + 'ms'
  });
const TITRE = "Se lancer avec nous, c'est comme faire un trou d'un coup.";
const CAPS = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase'
};
const P = {
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.65,
  color: 'var(--bleu-100)'
};
const H3S = {
  margin: 0,
  fontSize: 'clamp(18px,1.5vw,20px)',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  lineHeight: 1.3,
  color: '#fff',
  textWrap: 'balance'
};
const EZ = 'cubic-bezier(.22,1,.36,1)';
const CSS = '.a12-in{opacity:0;transform:translateY(12px);transition:opacity 520ms ' + EZ + ' var(--d,0ms),transform 640ms ' + EZ + ' var(--d,0ms)}.a12-vu .a12-in{opacity:1;transform:none}' + '.a12-seg{transform:scaleX(0);transform-origin:0 50%;transition:transform 720ms cubic-bezier(.65,0,.35,1) var(--d,0ms)}.a12-vu .a12-seg{transform:none}' + '.a12-trait{transform:scaleX(0);transform-origin:0 50%;transition:transform 900ms ' + EZ + ' var(--d,0ms)}.a12-vu .a12-trait{transform:none}' + '.a12-glisse{opacity:0;transform:translateX(-16px);transition:opacity 480ms ease var(--d,0ms),transform 640ms ' + EZ + ' var(--d,0ms)}.a12-vu .a12-glisse{opacity:1;transform:none}' + '.a12-lien{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 900ms cubic-bezier(.65,0,.35,1) var(--d,0ms)}.a12-vu .a12-lien{stroke-dashoffset:0}.a12-pt{opacity:0;transition:opacity 400ms ease var(--d,0ms)}.a12-vu .a12-pt{opacity:1}.a12-tick{opacity:0;transition:opacity 360ms ease var(--d,0ms)}.a12-vu .a12-tick{opacity:1}' + '.a12-pan-c::before{content:"";position:absolute;top:-7px;left:var(--cx,36px);width:12px;height:12px;background:#14304F;border-left:1px solid rgba(181,212,247,.16);border-top:1px solid rgba(181,212,247,.16);transform:rotate(45deg)}' + '@media (max-width:960px){.a12-2c,.a12-g2{grid-template-columns:minmax(0,1fr)!important}.a12-g4{grid-template-columns:repeat(2,minmax(0,1fr))!important;row-gap:32px!important}.a12-chv{clip-path:none!important;border-radius:14px;padding:0 20px!important}.a12-fin{justify-self:start!important}}' + '@media (max-width:620px){.a12-g4{grid-template-columns:minmax(0,1fr)!important}}' + '@media (prefers-reduced-motion:reduce){.a12-lien{stroke-dashoffset:0!important}.a12-pt,.a12-tick{opacity:1!important}.a12-in,.a12-seg,.a12-trait,.a12-glisse,.a12-lien,.a12-pt{transition:none!important;opacity:1!important;transform:none!important}}';

/* Entrée dans l'écran : une seule fois; visible d'emblée si le mouvement est réduit ou sans observateur. */
function useEntree() {
  const r = React.useRef(null),
    [v, setV] = useEtatClient(() => ACC_H.sansMvt() || (__ssr() ? "undefined" : typeof IntersectionObserver) === 'undefined');
  React.useEffect(() => {
    if (v) return;
    const el = r.current;
    if (!el) return;
    const io = new IntersectionObserver(([x]) => {
      if (x.isIntersecting) {
        setV(true);
        io.disconnect();
      }
    }, {
      threshold: .18
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [r, v];
}
const Section = ({
  id,
  r,
  vu,
  fond,
  deco,
  children
}) => <section ref={r} aria-labelledby={id} className={'ll-sombre' + (vu ? ' a12-vu' : '')} style={{
  position: 'relative',
  isolation: 'isolate',
  overflow: 'hidden',
  background: fond || 'var(--degrade-marine)'
}}><style>{CSS}</style>{deco}<div style={{
    ...ACC_H.BOITE,
    position: 'relative'
  }}>{children}</div></section>;
/* Sol quadrillé en perspective (même principe que la page de connexion) : lignes de fuite vers un point central, rangées qui se resserrent vers l'horizon, fondu vers le haut. Très faible opacité. */
/* Trois fois plus de cases : vraie perspective (point de fuite au centre), cases carrées au premier plan. */
const SOL_HZ = -40,
  SOL_S = 30,
  SOL_D = .0491,
  SOL_ZM = 12,
  SOL_V = Array.from({
    length: 227
  }, (_, k) => (k - 113) * SOL_S),
  SOL_H = (() => {
    const o = [];
    for (let z = 1; z <= SOL_ZM; z += SOL_D * z) o.push(SOL_HZ + (600 - SOL_HZ) / z);
    return o;
  })();
const SolGrille = () => <div aria-hidden="true" style={{
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '72%',
  zIndex: -1,
  pointerEvents: 'none',
  WebkitMaskImage: 'linear-gradient(to top,#000 0%,rgba(0,0,0,.6) 40%,transparent 100%)',
  maskImage: 'linear-gradient(to top,#000 0%,rgba(0,0,0,.6) 40%,transparent 100%)'
}}>
  <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" width="100%" height="100%" style={{
    display: 'block'
  }}><g stroke="rgba(181,212,247,.1)" strokeWidth="1" fill="none">
    {SOL_V.map(dx => <line key={'v' + dx} x1={500 + dx / SOL_ZM} y1={SOL_HZ + (600 - SOL_HZ) / SOL_ZM} x2={500 + dx} y2="600" vectorEffect="non-scaling-stroke" />)}
    {SOL_H.map((y, i) => <line key={'h' + i} x1="-2000" y1={y} x2="3000" y2={y} vectorEffect="non-scaling-stroke" />)}</g></svg></div>;
const Tete = ({
  id,
  centre,
  sansSur
}) => <div className="a12-in" style={{
  display: 'grid',
  gap: '14px',
  justifyItems: centre ? 'center' : 'start',
  textAlign: centre ? 'center' : 'left'
}}>{!sansSur && <ACC_H.Overline ton="marine">Votre arrivée chez Lease Lane</ACC_H.Overline>}<h2 id={id} style={{
    margin: 0,
    fontSize: 'var(--titre-l)',
    lineHeight: 1.31,
    letterSpacing: '-0.03em',
    fontWeight: 700,
    color: '#fff',
    maxWidth: centre ? '28ch' : '32ch',
    textWrap: 'balance'
  }}>{TITRE}</h2></div>;

/* A · Échéancier : la durée réelle de chaque étape sur une règle d'un mois (un trait par jour, un plus long par semaine).
   Chaque carte reprend la règle en miniature et n'allume que son propre segment : on voit d'un coup d'œil où l'étape se place dans le mois, sans ligne de liaison. */
const DUREE = [1, 4, 16, 9],
  TONS = ['#E3EEFB', '#B5D4F7', '#6194D3', '#4581CB'],
  JOURS = DUREE.reduce((a, b) => a + b, 0);
const PAN = {
  position: 'relative',
  display: 'grid',
  gridTemplateRows: 'auto auto 1fr',
  gap: '18px',
  alignContent: 'start',
  padding: '24px',
  boxSizing: 'border-box',
  borderRadius: '20px',
  background: 'linear-gradient(180deg,#14304F 0%,#0F2541 100%)',
  border: '1px solid rgba(181,212,247,.16)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.07),0 34px 60px -40px rgba(2,8,18,.95)'
};
/* Étiquette d'étape : « Étape » en capitales espacées, numéro dans une case pleine de la couleur du segment. */

const IcoB = ({
  ic
}) => <span aria-hidden="true" style={{
  width: '38.64px',
  height: '38.64px',
  flex: 'none',
  borderRadius: '11px',
  display: 'grid',
  placeItems: 'center',
  boxSizing: 'border-box',
  background: 'transparent',
  border: '.5px solid rgba(255,255,255,.3675)'
}}><ACC_H.Icon name={ic} size={22} color="#fff" /></span>;
const Mini = ({
  i,
  del
}) => <span aria-hidden="true" style={{
  display: 'flex',
  gap: '2px',
  height: '4px'
}}>{DUREE.map((x, j) => <span key={j} style={{
    flex: x + ' 1 0',
    minWidth: '4px',
    borderRadius: '1px',
    background: 'rgba(181,212,247,.14)',
    overflow: 'hidden'
  }}>{j === i && <span className="a12-seg" style={{
      display: 'block',
      height: '100%',
      background: TONS[i],
      ...d(del)
    }}></span>}</span>)}</span>;
/* Règle du mois : un trait par jour, un trait long par semaine, les bornes d'étape plus longues dans la couleur de leur segment; libellés de semaine centrés. Les traits apparaissent de gauche à droite. */
const BORNES = (() => {
  const o = {};
  let c = 0;
  DUREE.forEach((x, i) => {
    o[c] = i;
    c += x;
  });
  o[c] = DUREE.length - 1;
  return o;
})();
const Regle = () => <div style={{
  position: 'relative',
  height: '20px',
  marginTop: '2.5px'
}}>
  <svg width="100%" height="16" style={{
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'visible'
  }}>
    <line x1="0" x2="100%" y1="0.5" y2="0.5" stroke="rgba(181,212,247,.18)" />
    {Array.from({
      length: JOURS + 1
    }, (_, k) => {
      const x = k / JOURS * 100 + '%',
        b = BORNES[k],
        sem = k % 7 === 0;
      return <line key={k} className="a12-tick" x1={x} x2={x} y1="0" y2={b != null ? 16 : sem ? 11 : 5} stroke={b != null ? TONS[b] : sem ? 'rgba(181,212,247,.55)' : 'rgba(181,212,247,.25)'} strokeWidth={b != null ? 1.5 : 1} style={d(1100 + k * 22)} />;
    })}
    {Object.keys(BORNES).map(k => <circle key={k} className="a12-tick" cx={k / JOURS * 100 + '%'} cy="16" r="2.5" fill={TONS[BORNES[k]]} style={d(1100 + k * 22)} />)}</svg>
</div>;
function A12() {
  const E = ED(),
    [r, vu] = useEntree();
  return <Section id="a12-a" r={r} vu={vu} fond="#0C2147" deco={<SolGrille />}>
    <div className="a12-2c" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) auto',
      gap: '28px 56px',
      alignItems: 'end'
    }}><Tete id="a12-a" sansSur /><div className="a12-in a12-fin" style={{
        justifySelf: 'end',
        ...d(160)
      }}><PARC_H.ActP /></div></div>
    <div aria-hidden="true" style={{
      marginTop: 'clamp(48px,6vw,80px)',
      display: 'grid',
      gap: '10px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        ...CAPS,
        fontSize: '11px',
        color: 'var(--bleu-200)'
      }}><span>{E[0] && E[0][3]}</span><span>{E[E.length - 1] && E[E.length - 1][3]}</span></div>
      <div style={{
        display: 'flex',
        gap: '4px',
        height: '8px'
      }}>{DUREE.map((x, i) => <span key={i} className="a12-seg" style={{
          flex: x + ' 1 0',
          minWidth: '12px',
          borderRadius: '1.5px',
          background: TONS[i],
          ...d(260 + i * 240)
        }}></span>)}</div>
      <Regle /></div>
    <ol className="a12-g4" style={{
      listStyle: 'none',
      margin: 'clamp(32px,4vw,48px) 0 0',
      padding: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: '16px'
    }}>{E.map(([ic, t, dd, qd], i) => <li key={t} className="a12-in" style={{
        ...PAN,
        gridRow: 'span 4',
        gridTemplateRows: 'subgrid',
        rowGap: '20px',
        alignContent: 'stretch',
        background: 'linear-gradient(180deg,#17325F 0%,#11284F 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.07),0 34px 60px -40px rgba(2,8,18,.7125)',
        ...d(420 + i * 160)
      }}>
      <Mini i={i} del={900 + i * 160} />
      <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}><IcoB ic={ic} /></div>
      <div style={{
          display: 'grid',
          gap: '8px',
          alignContent: 'start'
        }}><span style={{
            ...CAPS,
            fontSize: '11.5px',
            color: ACC_H.CL
          }}>{qd}</span><h3 style={H3S}>{t}</h3></div>
      <p style={{
          ...P,
          paddingTop: '20px',
          borderTop: '1px solid rgba(181,212,247,.12)'
        }}>{dd}</p></li>)}</ol></Section>;
}

/* B · Index : titre et appel à gauche; à droite, une rangée par étape, menée par un grand numéro au trait. Les filets se tracent à l'entrée. */

/* C · Chevrons : les quatre étapes sur une bande de chevrons du logo, du marine vers le bleu. Sous chaque chevron, un panneau accroché par une pointe : icône, intitulé, détail et jauge d'avancement alignée au bas. */

/* D · Cartes : le délai d'abord, en grand; quatre cartes en 2 × 2 qui apparaissent en cascade. */

/* Revue : « Actuelle » = B « L'immeuble s'allume » (série 11), puis les quatre options. */
/* « Votre arrivée » figée : A « Échéancier » retenue, barre de revue retirée. */
let AccParcours = () => <A12 />;
export { AccParcours, A12 as A12Arr };
