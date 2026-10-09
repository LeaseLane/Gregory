/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-chiffres-serie7.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { ACC_H } from '@/proto/accueil-options-1';
import { ACC_PREUVES } from '@/proto/blocs';
import { __ssr } from '@/lib/hydratation';
const NAV = 'var(--marine-400)',
  MAR = 'var(--marine-900)',
  BL6 = 'var(--bleu-600)',
  EZ = 'cubic-bezier(.22,1,.36,1)';
const T_TITRE = 'clamp(20.4px,1.87vw,26.35px)',
  T_NB = 'clamp(34px,2.975vw,44.2px)';
const PV = () => ACC_PREUVES;
const SR = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0
};
const VERS = '/changer-de-gestionnaire';
const go = e => {
  e.preventDefault();
  ACC_H.aller(VERS);
};
const ap = (on, ms = 0, dx = 0, dy = 10) => ({
  opacity: on ? 1 : 0,
  transform: on ? 'none' : 'translate(' + dx + 'px,' + dy + 'px)',
  transition: 'opacity 600ms ' + EZ + ' ' + ms + 'ms,transform 800ms ' + EZ + ' ' + ms + 'ms'
});
/* ——— Pièces communes ——— */
const Titre = ({
  id,
  max = '20ch',
  a = 'left'
}) => <h2 id={id} style={{
  margin: 0,
  fontSize: T_TITRE,
  lineHeight: 1.25,
  letterSpacing: '-0.03em',
  fontWeight: 700,
  color: NAV,
  maxWidth: max,
  textAlign: a,
  textWrap: 'balance'
}}>Chiffres <span style={{
    color: ACC_H.BL
  }}>impressionnants</span>... ça fait <span style={{
    color: ACC_H.BL
  }}>réfléchir</span> au changement.</h2>;
const Lib = ({
  x,
  max = '20ch',
  a = 'left',
  c = NAV,
  fs = '15px'
}) => <span style={{
  display: 'block',
  fontSize: fs,
  fontWeight: 700,
  lineHeight: 1.4,
  color: c,
  maxWidth: max,
  textAlign: a,
  textWrap: 'balance',
  marginLeft: a === 'right' ? 'auto' : 0
}}>{x.l}</span>;
const DIX = Array.from({
  length: 20
}, (_, i) => i);
const Tambour = ({
  d,
  on,
  ms,
  delai
}) => <span className="c7-tam" style={{
  display: 'block',
  height: '1em',
  overflow: 'hidden'
}}><span style={{
    display: 'block',
    transform: 'translateY(-' + (on ? 10 + d : 0) + 'em)',
    transition: 'transform ' + ms + 'ms cubic-bezier(.16,.84,.24,1) ' + delai + 'ms'
  }}>{DIX.map(n => <span key={n} style={{
      display: 'block',
      height: '1em',
      lineHeight: '1em',
      textAlign: 'center'
    }}>{n % 10}</span>)}</span></span>;
function Chiffre({
  x,
  on,
  k = 0,
  d0 = 0,
  c = NAV,
  t = T_NB
}) {
  const s = String(x.v);
  let j = 0;
  return <span style={{
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'flex-end',
    gap: '.22em',
    fontWeight: 700,
    fontSize: t,
    letterSpacing: '-0.04em',
    lineHeight: 1,
    color: c,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap'
  }}>
    <span style={SR}>{x.v + ' ' + x.u}</span>
    <span aria-hidden="true" style={{
      display: 'inline-flex'
    }}>{s.split('').map((ch, i) => /\d/.test(ch) ? <Tambour key={i} d={+ch} on={on} ms={1100 + j++ * 260} delai={d0 + k * 140} /> : <span key={i} style={{
        display: 'block',
        height: '1em',
        lineHeight: '1em'
      }}>{ch}</span>)}</span>
    <span aria-hidden="true" style={{
      display: 'block',
      height: '1em',
      lineHeight: '1em',
      letterSpacing: '-0.03em',
      color: ACC_H.BL
    }}>{x.u}</span></span>;
}
const FlecheC = ({
  s = 18
}) => <svg viewBox="0 0 24 24" width={s} height={s} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{
  display: 'block'
}}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>;
const LG = i => 'M' + i * 71.6 + ' 0 L' + (59.65 + i * 71.6) + ' 76.49 L' + i * 71.6 + ' 152.98';
const Chevrons = ({
  h = 16
}) => <svg className="c7-chv" viewBox="-10 -10 366 173" height={h} width={Math.round(h * 366 / 173)} aria-hidden="true" focusable="false" fill="none" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" style={{
  display: 'block',
  flex: 'none',
  overflow: 'visible'
}}>{['#6F86A0', ACC_H.BL, '#B5D4F7'].map((c, i) => <path key={i} d={LG(i)} stroke={c} style={{
    transitionDelay: i * 60 + 'ms'
  }} />)}</svg>;
const CTA_A = 'Cliquez ici pour changer votre vie';
const LabelB = ({
  c = ACC_H.BL
}) => <React.Fragment><Icon name="file-text" size={18} color="currentColor" /><span>Votre <span style={{
      color: c
    }}>soumission</span> <span style={{
      color: c
    }}>gratuite</span> ici</span></React.Fragment>;
const Roule = ({
  c
}) => <span style={{
  display: 'inline-grid',
  overflow: 'hidden',
  padding: '.14em 0',
  margin: '-.14em 0'
}}>
  <span className="c7-ra" style={{
    gridArea: '1 / 1',
    display: 'inline-flex',
    alignItems: 'center'
  }}>{CTA_A}</span>
  <span className="c7-rb" aria-hidden="true" style={{
    gridArea: '1 / 1',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px'
  }}><LabelB c={c} /></span></span>;
const SRb = <span style={SR}> : votre soumission gratuite</span>;
const Legende = () => <span className="c7-cap" style={{
  alignItems: 'center',
  gap: '8px',
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: 1.4,
  color: NAV
}}><Icon name="file-text" size={15} color={ACC_H.BL} /><span>Votre <span style={{
      color: BL6
    }}>soumission</span> <span style={{
      color: BL6
    }}>gratuite</span> ici</span></span>;
/* Bouton retenu : 4 · Chevrons du logo (revue du bouton retirée). */
const ctaLire = () => '4';
const useCta = () => {
  const [m, setM] = React.useState(ctaLire);
  React.useEffect(() => {
    const f = () => setM(ctaLire());
    window.addEventListener('ll-cta7', f);
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.removeEventListener('ll-cta7', f) : undefined;
  }, []);
  return m;
};
const LIEN = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '18px',
  minHeight: '56px',
  padding: '8px 0 12px',
  textDecoration: 'none',
  color: MAR,
  fontSize: '17px',
  fontWeight: 600,
  lineHeight: 1.3
};
const Regle = ({
  pos = 'bottom',
  c = 'var(--bleu-100)',
  h = '1px'
}) => <span aria-hidden="true" style={{
  position: 'absolute',
  left: 0,
  right: 0,
  [pos]: 0,
  height: h,
  background: c
}}></span>;
const Trait = ({
  pos = 'bottom',
  o = '0 50%',
  c = ACC_H.BL,
  dep = '.2',
  h = '2px'
}) => <span aria-hidden="true" className="c7-trait" style={{
  position: 'absolute',
  left: 0,
  right: 0,
  [pos]: 0,
  height: h,
  background: c,
  transform: 'scaleX(' + dep + ')',
  transformOrigin: o
}}></span>;
function Bouton({
  m,
  clair
}) {
  const h = VERS;
  if (m === '1') return <a href={h} onClick={go} className="c7-cta c7-l1" style={LIEN}><Roule />{SRb}<span aria-hidden="true" className="c7-l1-r" style={{
      display: 'grid',
      placeItems: 'center',
      width: '40px',
      height: '40px',
      flex: 'none',
      borderRadius: '50%',
      background: MAR,
      color: '#fff'
    }}><FlecheC s={17} /></span><Regle /><Trait /></a>;
  if (m === '2') return <a href={h} onClick={go} className="c7-cta c7-l2" style={{
    ...LIEN,
    gap: '14px',
    padding: '16px 2px 18px'
  }}><span aria-hidden="true" className="c7-l2-f" style={{
      display: 'flex',
      color: ACC_H.BL
    }}><FlecheC s={20} /></span><Roule />{SRb}<Regle pos="top" /><Trait pos="top" o="100% 50%" c={MAR} /><Regle /><Trait /></a>;
  if (m === '3') return <a href={h} onClick={go} className="c7-cta c7-l3" style={LIEN}><Roule />{SRb}<span aria-hidden="true" style={{
      display: 'flex',
      alignItems: 'center',
      color: ACC_H.BL
    }}><span className="c7-l3-l" style={{
        display: 'block',
        width: '40px',
        height: '1.5px',
        background: 'currentColor'
      }}></span><span style={{
        display: 'block',
        width: '9px',
        height: '9px',
        borderTop: '1.5px solid currentColor',
        borderRight: '1.5px solid currentColor',
        transform: 'rotate(45deg)',
        marginLeft: '-8px'
      }}></span></span><Regle /><Trait /></a>;
  if (m === '4') return <a href={h} onClick={go} className="c7-cta c7-l4" style={{
    ...LIEN,
    fontSize: '15.3px',
    color: clair ? '#fff' : MAR
  }}><span>Soumission <span style={{
        color: ACC_H.BL
      }}>gratuite</span></span><span aria-hidden="true" className="c7-l4-c" style={{
      display: 'flex',
      paddingRight: '4px'
    }}><Chevrons h={15} /></span><Regle h="2.5px" c={clair ? 'rgba(255,255,255,.5)' : MAR} /><Trait h="3.5px" c={clair ? '#B5D4F7' : ACC_H.BL} /></a>;
  if (m === '5') return <a href={h} onClick={go} className="c7-cta c7-l5" style={LIEN}><Roule />{SRb}<span aria-hidden="true" className="c7-l5-r" style={{
      display: 'grid',
      placeItems: 'center',
      width: '40px',
      height: '40px',
      flex: 'none',
      borderRadius: '50%',
      border: '1.5px solid ' + ACC_H.BL,
      color: ACC_H.BL
    }}><FlecheC s={17} /></span><Regle c={ACC_H.BL} /><Trait c={MAR} dep="0" /></a>;
  return null;
}
function CtaLien({
  on,
  ms = 0,
  regle = true,
  style,
  clair
}) {
  const m = useCta();
  if (m !== '0') return <span style={{
    display: 'inline-grid',
    gap: '10px',
    justifyItems: 'start',
    ...ap(on, ms),
    ...style
  }}><Bouton m={m} clair={clair} />{!clair && m !== '4' && <Legende />}</span>;
  return <span style={{
    display: 'inline-grid',
    gap: '10px',
    justifyItems: 'start',
    ...ap(on, ms),
    ...style
  }}>
    <a href={VERS} onClick={go} className="c7-cta c7-lien" style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '18px',
      minHeight: '56px',
      padding: '8px 0 12px',
      textDecoration: 'none',
      color: MAR,
      fontSize: '17px',
      fontWeight: 600,
      lineHeight: 1.3
    }}>
      <Roule />{SRb}
      <span aria-hidden="true" className="c7-fl" style={{
        display: 'grid',
        placeItems: 'center',
        width: '40px',
        height: '40px',
        flex: 'none',
        borderRadius: '50%',
        border: '1px solid var(--bleu-100)',
        color: MAR
      }}><FlecheC s={17} /></span>
      {regle && <span aria-hidden="true" style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '1px',
        background: 'var(--bleu-100)'
      }}></span>}
      <span aria-hidden="true" className="c7-trait" style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: regle ? 0 : '-1px',
        height: '2px',
        background: ACC_H.BL,
        transform: 'scaleX(.2)',
        transformOrigin: '0 50%'
      }}></span></a>
    <Legende /></span>;
}

/* ——— Concepts sobres : le chiffre d'abord, rien d'autre ——— */

/* 1 · Colonnes : titre et bouton en tête; trois colonnes égales séparées par des filets verticaux. */

/* 2 · Relevé : titre et bouton à gauche; à droite, une ligne par chiffre, intitulé à gauche, chiffre aligné à droite. */

/* 3 · Centré : titre centré, trois chiffres sur une même ligne séparés par des filets courts, bouton centré. */
function O3Centre() {
  const ref = React.useRef(null),
    vu = ACC_H.useVu(ref, .3),
    P = PV();
  const G = 'clamp(40px,4.4vw,64px)';
  return <section ref={ref} className="c7" aria-labelledby="c7-t3" style={{
    position: 'relative',
    background: '#fff',
    overflow: 'hidden'
  }}>
    <span aria-hidden="true" style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: 'linear-gradient(rgba(69,129,203,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(69,129,203,.07) 1px,transparent 1px)',
      backgroundSize: '32px 32px',
      backgroundPosition: 'center',
      WebkitMaskImage: 'radial-gradient(70% 80% at 50% 55%,#000 20%,transparent 85%)',
      maskImage: 'radial-gradient(70% 80% at 50% 55%,#000 20%,transparent 85%)'
    }}></span>
    <div style={{
      ...ACC_H.BOITE,
      position: 'relative',
      display: 'grid',
      justifyItems: 'center',
      gap: G
    }}>
    <div style={{
        position: 'relative',
        top: 'calc(-.6 * ' + G + ')',
        display: 'grid',
        justifyItems: 'center'
      }}><Titre id="c7-t3" a="center" max="26ch" /></div>
    <dl className="c7-g3 c7-cartes" style={{
        margin: 0,
        width: '100%',
        maxWidth: '960px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
        gap: '16px'
      }}>
      {P.map((x, k) => <div key={x.l} className="c7-col c7-carte" style={{
          position: 'relative',
          display: 'grid',
          gap: '14px',
          justifyItems: 'center',
          alignContent: 'center',
          textAlign: 'center',
          padding: 'clamp(32px,3.4vw,48px) clamp(20px,2.4vw,32px)',
          boxSizing: 'border-box',
          aspectRatio: '1 / 1',
          borderRadius: '20px',
          background: 'var(--bleu-025)',
          border: '1px solid rgba(12,33,71,.26)',
          boxShadow: '0 2px 6px rgba(12,33,71,.05),0 30px 60px -28px rgba(12,33,71,.3)',
          ...ap(vu, k * 120)
        }}><span aria-hidden="true" style={{
            width: '60px',
            height: '60px',
            borderRadius: '17px',
            display: 'grid',
            placeItems: 'center',
            background: 'var(--marine-900)',
            boxShadow: '0 12px 26px -12px rgba(12,33,71,.7),inset 0 1px 0 rgba(255,255,255,.12)',
            marginBottom: '6px',
            ...ap(vu, k * 120)
          }}>{x.ic && <Icon name={x.ic} size={27.5} color="#fff" />}</span>
        <dd style={{
            margin: 0,
            ...ap(vu, k * 140)
          }}><Chiffre x={x} on={vu} k={k} t="clamp(25.5px,2.34vw,32.94px)" /></dd><dt style={ap(vu, 100 + k * 140)}><Lib x={x} a="center" max="18ch" fs="18.75px" /></dt></div>)}
    </dl>
    <div style={{
        position: 'relative',
        top: 'calc(.6 * ' + G + ')',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px 14px',
        ...ap(vu, 500)
      }}><ACC_H.Button variant="primaire" size="l" onClick={() => ACC_H.aller(VERS)}>Soumission gratuite</ACC_H.Button><ACC_H.Button variant="secondaire" size="l" onClick={() => ACC_H.aller('/gestion-immobiliere')}>Gestion d’immeubles</ACC_H.Button></div></div></section>;
}

/* 4 · Panneau : titre et bouton en tête; les trois chiffres réunis dans un panneau bleu très pâle, seul élément coloré de la section. */

/* 5 · Chiffres d'abord : les trois chiffres ouvrent la section; titre et bouton suivent sous un filet, en conclusion. */

/* ——— Revue ——— */

/* Retenu : 3 · Centré (revue des options retirée). */

let C7 = {
  Titre,
  Chiffre,
  Lib,
  CtaLien,
  ap,
  T_TITRE,
  T_NB,
  NAV,
  MAR,
  BL6,
  EZ,
  PV,
  useVu: ACC_H.useVu
};
export { C7, O3Centre as ChiffresCentre7 };
