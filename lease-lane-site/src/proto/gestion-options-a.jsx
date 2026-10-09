/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/gestion-options-a.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { PictoImmeuble } from '@/proto/pictos-immeubles';
import { PP_TYPES, Pictogramme, PP_FAMILLES, PP_SERVICES } from '@/proto/pages-proprietaires';
import { BoutonLien } from '@/proto/blocs';
import { useEtatClient, __ssr } from '@/lib/hydratation';
const F = '1px solid var(--bordure-fine)';
const O1 = '0 1px 2px rgba(12,33,71,.05),0 12px 32px rgba(12,33,71,.08)',
  O2 = '0 2px 4px rgba(12,33,71,.06),0 24px 56px rgba(12,33,71,.14)';
const lire = (k, d) => {
    try {
      return null || d;
    } catch (e) {
      return d;
    }
  },
  ecrire = (k, v) => {
    try {
      void 0;
    } catch (e) {}
  };

/* ——— Bascule de revue ——— */
/* Page Gestion d'immeubles figée (version finale) : options retenues, bascules de revue retirées. */
const FIGE = {
  s01: '1',
  s01t2: '1',
  s01f2: '2',
  s02: '3',
  s03: '1',
  s04: '1',
  s05: '1',
  s06: '2',
  som: '3',
  heros6: '1',
  offre3: '1'
};
function BasculeRevue({
  n,
  noms,
  o,
  set
}) {
  return null;
  const l = [['0', 'Actuel'], ...noms.map((x, i) => [String(i + 1), i + 1 + ' · ' + x])];
  return <div role="group" aria-label={'Options de design, ' + n + ' (revue)'} style={{
    justifySelf: 'start',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 4px 4px 14px',
    borderRadius: '999px',
    border: '1px dashed var(--bleu-300)',
    background: 'var(--bleu-025)'
  }}>
    <span style={{
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color: 'var(--bleu-700)',
      marginRight: '6px'
    }}>Revue · {n}</span>
    {l.map(([v, t]) => <button key={v} type="button" aria-pressed={o === v} onClick={() => set(v)} style={{
      height: '36px',
      padding: '0 14px',
      border: 0,
      borderRadius: 'var(--rayon-bouton)',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: '13px',
      fontWeight: 600,
      background: o === v ? 'var(--marine-900)' : 'transparent',
      color: o === v ? '#fff' : 'var(--marine-900)'
    }}>{t}</button>)}</div>;
}
function useRevue(k) {
  const c = 'll-gestion-' + k,
    [o, setO] = React.useState(() => FIGE[k] || lire(c, '1'));
  return [FIGE[k] || o, v => {
    ecrire(c, v);
    setO(v);
  }];
}
function OptionsSection({
  k,
  n,
  noms,
  actuel,
  options
}) {
  const [o, set] = useRevue(k);
  return <div style={{
    display: 'grid',
    gap: '24px'
  }}>
    <div key={o} className="lls-fondu" style={{
      minWidth: 0
    }}>{o === '0' ? actuel : options[+o - 1]}</div></div>;
}

/* ——— Petits outils ——— */
const BtnRond = ({
  ic,
  label,
  onClick
}) => <button type="button" aria-label={label} onClick={onClick} className="go-rond" style={{
  width: '44px',
  height: '44px',
  borderRadius: 'var(--rayon-bouton)',
  border: F,
  background: '#fff',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer'
}}><Icon name={ic} size={18} color="var(--marine-900)" /></button>;
function useDefile() {
  const r = React.useRef(null);
  return [r, d => {
    const el = r.current;
    if (!el) return;
    const c = el.firstElementChild;
    el.scrollBy({
      left: d * ((c ? c.getBoundingClientRect().width : 300) + 16),
      behavior: 'smooth'
    });
  }];
}

/* Écran vivant de l'espace propriétaire, recadrable : (x,y,cw) = zone affichée dans une fenêtre virtuelle de 1440 px. */
function Ecran({
  e = 'tableau',
  x = 0,
  y = 0,
  cw = 1440,
  ch = 900,
  ih = 900,
  remplir,
  titre
}) {
  const ref = React.useRef(null),
    [k, setK] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const f = () => setK(el.clientWidth / cw);
    f();
    const ro = new ResizeObserver(f);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cw]);
  return <div ref={ref} style={{
    position: 'relative',
    height: remplir ? '100%' : ch * k + 'px',
    overflow: 'hidden',
    background: 'var(--gris-025)'
  }}>
    <iframe src={'/espace-proprietaire/index.html?ecran=' + e} title={titre || 'Aperçu de l’espace propriétaire'} tabIndex={-1} loading="lazy" style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: '1440px',
      height: ih + 'px',
      border: 0,
      transform: 'scale(' + k + ') translate(' + -x + 'px,' + -y + 'px)',
      transformOrigin: '0 0',
      pointerEvents: 'none'
    }} /></div>;
}
const Cadre = ({
  nom,
  ombre = O2,
  children
}) => <div style={{
  borderRadius: '16px',
  overflow: 'hidden',
  background: '#fff',
  boxShadow: ombre,
  border: F
}}>
  <div style={{
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '0 14px',
    borderBottom: F,
    background: 'var(--surface-douce)'
  }}>
    {[0, 1, 2].map(i => <span key={i} style={{
      width: '9px',
      height: '9px',
      borderRadius: '50%',
      background: 'var(--gris-200)'
    }} />)}
    <span style={{
      marginLeft: '10px',
      fontSize: '12px',
      color: 'var(--texte-discret)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }}>Espace propriétaire · {nom}</span></div>{children}</div>;

/* Fond « Studio » derrière l'immeuble du panneau marine, et trois raffinements. sol = ligne de sol du pictogramme (y 134 sur 140). */
const MURM = 'radial-gradient(ellipse 62% 100% at 50% 100%,#000 35%,transparent 100%)';
function FondImmeuble({
  v,
  h,
  k = 0
}) {
  const ref = React.useRef(null),
    [lw, setLw] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current && ref.current.parentElement;
    if (!el) return;
    const m = () => setLw(el.clientWidth);
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const s = lw ? Math.min(lw / 200, h / 140) : h / 140,
    yg = (h - 140 * s) / 2 + 134 * s,
    sol = 16 + yg,
    abs = {
      position: 'absolute',
      pointerEvents: 'none'
    };
  if (!v || v === '0') return <span ref={ref} hidden />;
  const mur = (o = .2) => <span style={{
    ...abs,
    left: 0,
    right: 0,
    top: 0,
    height: sol + 'px',
    background: 'linear-gradient(to top,rgba(91,154,232,' + o + '),transparent 72%)',
    WebkitMaskImage: MURM,
    maskImage: MURM
  }} />;
  const horizon = (o = .4) => <span style={{
    ...abs,
    left: 0,
    right: 0,
    top: sol - .5 + 'px',
    height: '1px',
    background: 'linear-gradient(90deg,transparent,rgba(200,218,240,' + o + ') 25% 75%,transparent)'
  }} />;
  const grille = (o = 1) => <span style={{
    ...abs,
    left: '-30%',
    right: '-30%',
    top: sol + 'px',
    height: '120px',
    opacity: o,
    transformOrigin: '50% 0',
    transform: 'perspective(320px) rotateX(62deg)',
    background: 'repeating-linear-gradient(90deg,rgba(200,218,240,.16) 0 1px,transparent 1px 44px),repeating-linear-gradient(180deg,rgba(200,218,240,.12) 0 1px,transparent 1px 20px)',
    WebkitMaskImage: 'linear-gradient(to bottom,#000,transparent 85%),linear-gradient(90deg,transparent 18%,#000 38% 62%,transparent 82%)',
    WebkitMaskComposite: 'source-in',
    maskImage: 'linear-gradient(to bottom,#000,transparent 85%),linear-gradient(90deg,transparent 18%,#000 38% 62%,transparent 82%)',
    maskComposite: 'intersect'
  }} />;
  const flaque = (w, o) => <span style={{
    ...abs,
    left: '50%',
    top: sol - 10 + 'px',
    width: w + 'px',
    height: '70px',
    transform: 'translateX(-50%)',
    borderRadius: '50%',
    background: 'radial-gradient(ellipse 50% 50% at 50% 30%,rgba(156,196,242,' + o + '),transparent 75%)'
  }} />;
  const cadre = (kk, enfants) => <div ref={ref} aria-hidden="true" key={kk} className="lls-fondu" style={{
    ...abs,
    inset: 0
  }}>{enfants}</div>;
  if (v === '1') return cadre('1', <React.Fragment>{mur()}{grille()}{horizon()}</React.Fragment>);
  if (v === '2') {
    const L = [-260, -170, -100, -50, -14, 14, 34, 50, 66, 86, 114, 150, 200, 270, 360],
      S = sol + 40,
      H = [4, 10, 19, 32, 50, 74, 100];
    return <div ref={ref} aria-hidden="true" key="2" className="lls-fondu" style={{
      ...abs,
      left: '-40px',
      right: '-40px',
      top: '-40px',
      height: '1400px'
    }}>
      <span style={{
        ...abs,
        left: 0,
        right: 0,
        top: 0,
        height: S + 'px',
        background: 'linear-gradient(to top,rgba(91,154,232,.26) 0,rgba(91,154,232,.1) 38%,transparent 88%)'
      }} />
      <span style={{
        ...abs,
        left: 0,
        right: 0,
        top: 0,
        height: S + 'px',
        background: 'radial-gradient(ellipse 48% 70% at 50% 100%,rgba(91,154,232,.22),transparent 75%)'
      }} />
      <span style={{
        ...abs,
        left: 0,
        right: 0,
        top: S - 36 + 'px',
        height: '72px',
        background: 'radial-gradient(ellipse 70% 50% at 50% 50%,rgba(91,154,232,.22),transparent 85%)'
      }} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{
        ...abs,
        left: 0,
        top: S + 'px',
        width: '100%',
        height: '560px',
        WebkitMaskImage: 'linear-gradient(to bottom,#000 0,#000 25%,transparent 100%)',
        maskImage: 'linear-gradient(to bottom,#000 0,#000 25%,transparent 100%)'
      }}>
        {L.map(x => <line key={x} x1="50" y1="0" x2={x} y2="100" stroke="rgba(200,218,240,.17)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
        {H.map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(200,218,240,.08)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}</svg>
      <span style={{
        ...abs,
        left: '50%',
        top: S - 10 + 'px',
        width: h * 1.3 + 'px',
        height: '80px',
        transform: 'translateX(-50%)',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse 50% 50% at 50% 30%,rgba(156,196,242,.18),transparent 75%)'
      }} />
    </div>;
  }
  if (v === '3') return cadre('3', <React.Fragment>
      {mur(.1)}
      <span style={{
      ...abs,
      left: '50%',
      top: '-20px',
      width: h * 1.2 + 'px',
      height: sol + 20 + 'px',
      transform: 'translateX(-50%)',
      clipPath: 'polygon(41% 0,59% 0,100% 100%,0 100%)',
      background: 'linear-gradient(to bottom,rgba(200,218,240,.02),rgba(156,196,242,.18) 92%,rgba(156,196,242,.06))'
    }} />
      <span style={{
      ...abs,
      left: '50%',
      top: '-36px',
      width: '160px',
      height: '60px',
      transform: 'translateX(-50%)',
      borderRadius: '50%',
      background: 'radial-gradient(ellipse 50% 50% at 50% 50%,rgba(255,255,255,.28),transparent 75%)'
    }} />
      {grille(.55)}{horizon(.32)}{flaque(h * 1.25, .28)}</React.Fragment>);
  if (v === '4') {
    const PI = PictoImmeuble;
    return cadre('4', <React.Fragment>
      {mur()}
      <span style={{
        ...abs,
        left: 0,
        right: 0,
        top: sol + 'px',
        height: '90px',
        background: 'linear-gradient(to bottom,rgba(91,154,232,.12),transparent)',
        WebkitMaskImage: 'linear-gradient(90deg,transparent 10%,#000 35% 65%,transparent 90%)',
        maskImage: 'linear-gradient(90deg,transparent 10%,#000 35% 65%,transparent 90%)'
      }} />
      <div key={'r' + k} className="lls-fondu" style={{
        ...abs,
        left: 0,
        right: 0,
        top: '16px',
        height: h + 'px',
        transformOrigin: '50% ' + yg + 'px',
        transform: 'scaleY(-1)',
        opacity: .2,
        WebkitMaskImage: 'linear-gradient(to bottom,transparent ' + (yg - 64) + 'px,#000 ' + (yg - 2) + 'px)',
        maskImage: 'linear-gradient(to bottom,transparent ' + (yg - 64) + 'px,#000 ' + (yg - 2) + 'px)'
      }}><PI k={k} sombre h={h} /></div>
      {horizon(.5)}</React.Fragment>);
  }
  return <span ref={ref} hidden />;
}
/* ——— 01 · Pour qui? ——— */
function S01Selecteur() {
  const T = PP_TYPES,
    PI = PictoImmeuble,
    [i, setI] = React.useState(3),
    t = T[i],
    [v, setV] = useRevue('s01t2'),
    [fd, setFd] = useRevue('s01f2'),
    hp = v === '2' || v === '3' ? 250 : 288;
  return <div className="go-2c" style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
    gap: '20px',
    alignItems: 'stretch'
  }}>
    <div role="tablist" aria-label="Types d’immeubles" aria-orientation="vertical" className="go-types" style={{
      display: 'grid',
      gap: '2px',
      alignContent: 'start'
    }}>
      {T.map((x, k) => {
        const on = k === i;
        return <button key={x.n} type="button" role="tab" aria-selected={on} className="go-type" onClick={() => setI(k)} onMouseEnter={() => setI(k)} style={{
          display: 'grid',
          gridTemplateColumns: '56px minmax(0,1fr)',
          alignItems: 'center',
          gap: '14px',
          minHeight: '56px',
          padding: '6px 14px 6px 6px',
          border: 0,
          borderRadius: '12px',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          background: on ? 'var(--surface-douce)' : 'transparent',
          transition: 'background 200ms'
        }}>
        <span aria-hidden="true" style={{
            display: 'grid',
            placeItems: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '10px',
            border: '1px solid var(--marine-900)',
            background: 'transparent'
          }}><PI k={k} h={38} centre /></span>
        <span className="go-type-tx" style={{
            display: 'grid',
            gap: '1px'
          }}><span style={{
              fontSize: '15px',
              fontWeight: on ? 800 : 700,
              color: 'var(--marine-900)',
              lineHeight: 1.3
            }}>{x.n}</span><span style={{
              fontSize: '13px',
              fontWeight: on ? 600 : 500,
              color: 'var(--texte-discret)'
            }}>{x.u}</span></span></button>;
      })}
    </div>
    <article role="tabpanel" className="ll-sombre go-type-pan" style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '20px',
      background: 'var(--degrade-marine)',
      padding: '40px',
      display: 'grid',
      alignContent: 'space-between',
      gap: '32px',
      minHeight: '420px'
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(70% 90% at 100% 0%,rgba(91,154,232,.3),transparent 60%)'
      }} />
      <div style={{
        position: 'relative',
        paddingTop: '16px'
      }}><FondImmeuble v={fd} h={hp} k={i} /><div key={'p' + i} className="lls-fondu" style={{
          position: 'relative',
          zIndex: 1
        }}><PI k={i} sombre h={hp} anime /></div></div>
      <div key={'t' + i + v} className="lls-fondu" style={{
        position: 'relative'
      }}><TitrePanneau v={v} t={t} i={i} n={T.length} /></div>
    </article>
    <div style={{
      gridColumn: '1 / -1',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px'
    }}><BasculeRevue n="titre du panneau" noms={['Ligne de base', 'Fiche numérotée', 'Grand numéro']} o={v} set={setV} /><BasculeRevue n="fond de l’immeuble" noms={['Studio', 'Cyclorama', 'Projecteur', 'Reflet']} o={fd} set={setFd} /></div></div>;
}
/* Dispositions du bloc titre + bouton du panneau marine (0 = actuel). */
function TitrePanneau({
  v,
  t,
  i,
  n
}) {
  const B = <BoutonLien to="/offre-de-service" variant="inverse">Obtenir une offre</BoutonLien>,
    num = String(i + 1).padStart(2, '0'),
    tot = String(n).padStart(2, '0');
  if (v === '1') return <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '16px 24px',
    flexWrap: 'wrap',
    paddingTop: '24px',
    borderTop: '1px solid rgba(200,218,240,.22)'
  }}>
    <div style={{
      display: 'grid',
      gap: '6px',
      flex: '1 1 220px'
    }}><span style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--bleu-300)'
      }}>{t.u}</span>
    <h3 style={{
        margin: 0,
        fontSize: '25.5px',
        lineHeight: 1.208,
        letterSpacing: '-0.03em',
        color: '#fff',
        textWrap: 'balance'
      }}>{t.n}</h3></div>{B}</div>;
  if (v === '2') return <div style={{
    display: 'grid',
    gap: '20px'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--bleu-300)'
    }}><span>Type d’immeuble</span><span>{num} / {tot}</span></div>
    <h3 style={{
      margin: 0,
      fontSize: '40px',
      lineHeight: 1.173,
      letterSpacing: '-0.03em',
      color: '#fff',
      textWrap: 'balance'
    }}>{t.n}</h3>
    <div style={{
      display: 'grid'
    }}>{B}</div></div>;
  if (v === '3') return <div style={{
    display: 'grid',
    gap: '24px'
  }}>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0,1fr)',
      alignItems: 'center',
      gap: '20px'
    }}>
      <span aria-hidden="true" style={{
        fontSize: '72px',
        fontWeight: 800,
        lineHeight: .9,
        letterSpacing: '-0.05em',
        color: 'var(--bleu-300)'
      }}>{num}</span>
      <div style={{
        display: 'grid',
        gap: '4px',
        paddingLeft: '20px',
        borderLeft: '1px solid rgba(200,218,240,.22)'
      }}><h3 style={{
          margin: 0,
          fontSize: '30px',
          lineHeight: 1.208,
          letterSpacing: '-0.025em',
          color: '#fff',
          textWrap: 'balance'
        }}>{t.n}</h3><span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'rgba(255,255,255,.82)'
        }}>{t.u}</span></div></div>
    <div style={{
      justifySelf: 'start'
    }}>{B}</div></div>;
  return <div style={{
    display: 'grid',
    gap: '22px',
    justifyItems: 'start'
  }}>
    <h3 style={{
      margin: 0,
      fontSize: '44px',
      lineHeight: 1.15,
      letterSpacing: '-0.035em',
      color: '#fff',
      maxWidth: '12ch',
      textWrap: 'balance'
    }}>{t.n}</h3>{B}</div>;
}
const NB = [['1', 'logement'], ['2+', 'logements'], ['2', 'logements'], ['3', 'logements'], ['4', 'logements'], ['5', 'logements'], ['6–11', 'logements'], ['12+', 'logements'], ['1+', 'unité']];
function S01Index() {
  const T = PP_TYPES,
    P = Pictogramme;
  return <div style={{
    display: 'grid',
    gap: '32px'
  }}>{PP_FAMILLES.map(([f, d, ids], g) => <section key={f} aria-labelledby={'go-f' + g}>
    <header style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid var(--marine-900)'
      }}>
      <h3 id={'go-f' + g} style={{
          margin: 0,
          fontSize: '20px',
          letterSpacing: '-0.015em',
          color: 'var(--marine-900)'
        }}>{f}</h3><span style={{
          fontSize: '13px',
          color: 'var(--texte-discret)'
        }}>{d}</span></header>
    <ul style={{
        listStyle: 'none',
        margin: 0,
        padding: 0
      }}>{ids.map(i => {
          const t = T[i],
            [n, u] = NB[i];
          return <li key={t.n} className="go-rang" style={{
            display: 'grid',
            gridTemplateColumns: '112px minmax(0,1fr) 112px',
            alignItems: 'center',
            gap: '20px',
            padding: '8px 12px',
            borderBottom: F
          }}>
      <span style={{
              display: 'grid',
              gap: '2px'
            }}><span style={{
                fontSize: '34px',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--marine-900)',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums'
              }}>{n}</span><span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--bleu-600)'
              }}>{u}</span></span>
      <span style={{
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--marine-900)'
            }}>{t.n}</span>
      <span aria-hidden="true" style={{
              display: 'block'
            }}><P t={t} h={64} /></span></li>;
        })}</ul></section>)}</div>;
}
function S01Photos() {
  const T = PP_TYPES,
    P = Pictogramme,
    [r, pas] = useDefile();
  return <div style={{
    display: 'grid',
    gap: '20px'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px'
    }}><span style={{
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--marine-900)'
      }}>{T.length} types d’immeubles</span>
      <div style={{
        display: 'flex',
        gap: '8px'
      }}><BtnRond ic="chevron-left" label="Précédent" onClick={() => pas(-1)} /><BtnRond ic="chevron-right" label="Suivant" onClick={() => pas(1)} /></div></div>
    <ul ref={r} className="go-defile" style={{
      listStyle: 'none',
      margin: 0,
      padding: '0 0 8px',
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'minmax(240px,31%)',
      gap: '16px',
      overflowX: 'auto',
      scrollSnapType: 'x mandatory'
    }}>
      {T.map((t, i) => <li key={t.n} style={{
        scrollSnapAlign: 'start',
        display: 'grid',
        gap: '14px',
        alignContent: 'start'
      }}>
        <div style={{
          position: 'relative',
          aspectRatio: '4 / 5',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'var(--bleu-025)'
        }}>
          <image-slot id={'go-type-' + i} shape="rect" placeholder={'Photo · ' + t.n} style={{
            display: 'block',
            width: '100%',
            height: '100%'
          }}></image-slot>
          <span aria-hidden="true" style={{
            position: 'absolute',
            left: '12px',
            top: '12px',
            width: '68px',
            padding: '4px 2px 0',
            borderRadius: '12px',
            background: '#fff',
            boxShadow: O1,
            pointerEvents: 'none'
          }}><P t={t} h={44} /></span></div>
        <span style={{
          display: 'grid',
          gap: '2px'
        }}><span style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--marine-900)'
          }}>{t.n}</span><span style={{
            fontSize: '13px',
            color: 'var(--texte-discret)'
          }}>{t.u}</span></span></li>)}
    </ul></div>;
}

/* ——— 02 · Services offerts ——— */

/* ——— 03 · Ce que vous voyez : plusieurs écrans de l'espace propriétaire ——— */
const ECR = [['tableau', 'layout-grid', 'Tableau de bord', 'Loyers perçus, arriérés, demandes en cours et autorisations à donner, sur un seul écran.'], ['finances', 'wallet', 'Finance', 'Encaissements, honoraires, dépenses et relevés.'], ['demandes', 'wrench', 'Demandes et travaux', 'Du signalement à la fermeture du dossier.'], ['immeubles', 'building-2', 'Immeubles', 'Votre parc et son occupation.'], ['calendrier', 'calendar', 'Calendrier', 'Visites, travaux, versements et échéances.']];
/* Mobile (≤ 620 px) : les écrans deviennent un carrousel — une capture par diapositive, son titre en pastille centrée au-dessus, sa légende centrée dessous.
   Les captures se chargent à l'approche (diapositive affichée et suivante) pour ne pas lancer cinq espaces propriétaires d'un coup. */
const useMob = (q = '(max-width:620px)') => {
  const [m, setM] = useEtatClient(() => !!(((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia(q).matches : undefined)));
  React.useEffect(() => {
    if (!((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined)) return;
    const mq = (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia(q) : {
        matches: false,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
      },
      f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return m;
};
function S03Carrousel() {
  const r = React.useRef(null),
    [vus, setVus] = React.useState([0, 1]);
  React.useEffect(() => {
    const c = r.current;
    if (!c) return;
    let t = 0;
    const f = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const k = Math.round(c.scrollLeft / Math.max(1, c.clientWidth));
        setVus(v => v.includes(k) && v.includes(k + 1) ? v : [...new Set([...v, k, k + 1])]);
      }, 80);
    };
    c.addEventListener('scroll', f, {
      passive: true
    });
    return () => {
      clearTimeout(t);
      c.removeEventListener('scroll', f);
    };
  }, []);
  return <div ref={r} className="go-ecr-car" role="region" aria-roledescription="carrousel" aria-label="Écrans de l’espace propriétaire" tabIndex={0} style={{
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: '100%',
    gap: '16px',
    overflowX: 'auto',
    overscrollBehaviorX: 'contain',
    scrollSnapType: 'x mandatory',
    scrollbarWidth: 'none'
  }}>
    {ECR.map(([k, ic, t, d], j) => <figure key={k} role="group" aria-roledescription="diapositive" aria-label={j + 1 + ' sur ' + ECR.length + ' · ' + t} style={{
      margin: 0,
      minWidth: 0,
      display: 'grid',
      gap: '16px',
      justifyItems: 'center',
      alignContent: 'start',
      textAlign: 'center',
      scrollSnapAlign: 'start'
    }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: '44px',
        padding: '0 18px',
        borderRadius: 'var(--rayon-bouton)',
        background: 'var(--marine-900)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 600
      }}><Icon name={ic} size={16} color="var(--bleu-300)" />{t}</span>
      <div style={{
        width: '100%'
      }}><Cadre nom={t} ombre="none">{vus.includes(j) ? <Ecran e={k} titre={'Aperçu · ' + t} /> : <div style={{
            aspectRatio: '1440 / 900',
            background: 'var(--gris-025)'
          }} />}</Cadre></div>
      <figcaption style={{
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'var(--texte-corps)',
        maxWidth: '34ch'
      }}>{d}</figcaption></figure>)}
  </div>;
}
const S03Onglets = () => useMob() ? <S03Carrousel /> : <S03OngletsBureau />;
function S03OngletsBureau() {
  const [i, setI] = React.useState(0),
    [vus, setVus] = React.useState([0]),
    n = ECR.length,
    [,, t, d] = ECR[i];
  const aller = j => {
    setI(j);
    setVus(v => v.includes(j) ? v : [...v, j]);
  };
  /* Mobile : la rangée de titres devient un carrousel — le titre actif se centre, et glisser choisit le titre arrivé au centre. */
  const rang = React.useRef(null),
    mob = () => ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(max-width:640px)').matches : undefined),
    doux = () => !(((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : undefined));
  React.useEffect(() => {
    const r = rang.current;
    if (!r || !mob()) return;
    const b = r.children[i];
    if (!b) return;
    r.scrollTo({
      left: b.offsetLeft - (r.clientWidth - b.offsetWidth) / 2,
      behavior: doux() ? 'smooth' : 'auto'
    });
  }, [i]);
  React.useEffect(() => {
    const r = rang.current;
    if (!r) return;
    let t = null;
    const f = () => {
      if (!mob()) return;
      clearTimeout(t);
      t = setTimeout(() => {
        const c = r.scrollLeft + r.clientWidth / 2;
        let best = 0,
          d = 1e9;
        [...r.children].forEach((b, j) => {
          const x = Math.abs(b.offsetLeft + b.offsetWidth / 2 - c);
          if (x < d) {
            d = x;
            best = j;
          }
        });
        setI(cur => {
          if (cur !== best) setVus(v => v.includes(best) ? v : [...v, best]);
          return best;
        });
      }, 140);
    };
    r.addEventListener('scroll', f, {
      passive: true
    });
    return () => {
      clearTimeout(t);
      r.removeEventListener('scroll', f);
    };
  }, []);
  return <div style={{
    display: 'grid',
    gap: '20px'
  }}>
    <div ref={rang} role="tablist" aria-label="Écrans de l’espace propriétaire" className="go-ecr-tabs" style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px'
    }}>{ECR.map(([k, ic, t2], j) => {
        const on = j === i;
        return <button key={k} role="tab" aria-selected={on} type="button" onClick={() => aller(j)} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          height: '44px',
          padding: '0 18px',
          borderRadius: 'var(--rayon-bouton)',
          border: '1px solid var(--marine-900)',
          background: on ? 'var(--marine-900)' : '#fff',
          color: on ? '#fff' : 'var(--marine-900)',
          fontFamily: 'inherit',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer'
        }}><Icon name={ic} size={16} color={on ? 'var(--bleu-300)' : 'var(--marine-900)'} />{t2}</button>;
      })}</div>
    <Cadre nom={t}>{vus.map(j => <div key={ECR[j][0]} style={{
        display: j === i ? 'block' : 'none'
      }}><Ecran e={ECR[j][0]} titre={'Aperçu · ' + ECR[j][2]} /></div>)}</Cadre>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px 24px',
      flexWrap: 'wrap'
    }}>
      <p style={{
        margin: 0,
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'var(--texte-corps)',
        maxWidth: '60ch'
      }}><strong style={{
          color: 'var(--marine-900)'
        }}>{t}.</strong> {d}</p>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}><span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--texte-discret)',
          fontVariantNumeric: 'tabular-nums',
          marginRight: '4px'
        }}>{i + 1} / {n}</span>
        <BtnRond ic="chevron-left" label="Écran précédent" onClick={() => aller((i + n - 1) % n)} /><BtnRond ic="chevron-right" label="Écran suivant" onClick={() => aller((i + 1) % n)} /></div></div>
  </div>;
}
function S03Pellicule() {
  const [r, pas] = useDefile();
  return <div style={{
    display: 'grid',
    gap: '20px'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px'
    }}><span style={{
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--marine-900)'
      }}>{ECR.length} écrans de votre espace</span>
      <div style={{
        display: 'flex',
        gap: '8px'
      }}><BtnRond ic="chevron-left" label="Précédent" onClick={() => pas(-1)} /><BtnRond ic="chevron-right" label="Suivant" onClick={() => pas(1)} /></div></div>
    <ul ref={r} className="go-defile" style={{
      listStyle: 'none',
      margin: '0 -8px',
      padding: '8px 8px 32px',
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'minmax(280px,82%)',
      gap: '16px',
      overflowX: 'auto',
      scrollSnapType: 'x mandatory',
      scrollPaddingLeft: '8px'
    }}>
      {ECR.map(([e, ic, t, d]) => <li key={e} style={{
        scrollSnapAlign: 'start',
        display: 'grid',
        gap: '16px',
        alignContent: 'start'
      }}>
        <Cadre nom={t} ombre={O1}><Ecran e={e} titre={'Aperçu · ' + t} /></Cadre>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px minmax(0,1fr)',
          gap: '14px',
          alignItems: 'start'
        }}>
          <span aria-hidden="true" style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--bleu-025)',
            display: 'grid',
            placeItems: 'center'
          }}><Icon name={ic} size={18} color="var(--bleu-600)" /></span>
          <span style={{
            display: 'grid',
            gap: '2px'
          }}><span style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--marine-900)'
            }}>{t}</span><span style={{
              fontSize: '14px',
              lineHeight: 1.55,
              color: 'var(--texte-corps)'
            }}>{d}</span></span></div></li>)}
    </ul></div>;
}
const MOS = [{
  e: 'tableau',
  a: 'a',
  x: 0,
  cw: 1100
}, {
  e: 'finances',
  a: 'b',
  x: 250,
  cw: 1190
}, {
  e: 'demandes',
  a: 'c',
  x: 250,
  cw: 1190
}, {
  e: 'calendrier',
  a: 'd',
  x: 250,
  cw: 1190
}];
function S03Mosaique() {
  return <div className="go-mos" style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)',
    gridTemplateAreas: '"a b" "a c" "d d"',
    gridAutoRows: '210px',
    gap: '16px'
  }}>
    {MOS.map(o => {
      const [, ic, t, d] = ECR.find(x => x[0] === o.e);
      return <figure key={o.e} className="lls-carte" title={d} style={{
        gridArea: o.a,
        position: 'relative',
        margin: 0,
        borderRadius: '16px',
        overflow: 'hidden',
        border: F,
        boxShadow: O1,
        background: '#fff'
      }}>
      <Ecran e={o.e} x={o.x} cw={o.cw} ih={1200} remplir titre={'Aperçu · ' + t} />
      <figcaption style={{
          position: 'absolute',
          left: '12px',
          bottom: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          height: '36px',
          padding: '0 14px',
          borderRadius: '999px',
          background: 'var(--marine-900)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 8px 20px rgba(12,33,71,.25)'
        }}><Icon name={ic} size={15} color="var(--bleu-300)" />{t}</figcaption></figure>;
    })}
  </div>;
}
const GestionS01 = ({
  actuel
}) => <OptionsSection k="s01" n="01" noms={['Sélecteur', 'Index', 'Photos']} actuel={actuel} options={[<S01Selecteur />, <S01Index />, <S01Photos />]} />;
/* ——— 02 · trois versions de la disposition actuelle (2 × 2) ——— */
function Carte02({
  s,
  mode,
  k
}) {
  const sombre = mode === 'marine',
    fil = sombre ? '1px solid rgba(200,218,240,.16)' : F;
  if (mode === 'epure') return <section aria-labelledby={'v2-' + s.k} style={{
    display: 'grid',
    gap: '20px',
    alignContent: 'start',
    padding: '28px 32px',
    borderRadius: '20px',
    background: '#fff'
  }}>
    <header style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    }}>
      <span aria-hidden="true" style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        border: '1.5px solid var(--marine-900)',
        display: 'grid',
        placeItems: 'center'
      }}><Icon name={s.ic} size={19} color="var(--marine-900)" /></span>
      <h3 id={'v2-' + s.k} style={{
        margin: 0,
        fontSize: '22px',
        letterSpacing: '-0.02em',
        color: 'var(--marine-900)'
      }}>{s.t}</h3></header>
    <ul style={{
      listStyle: 'none',
      margin: 0,
      padding: 0
    }}>{s.items.map((it, j) => <li key={it} style={{
        display: 'grid',
        gridTemplateColumns: '14px minmax(0,1fr)',
        gap: '12px',
        alignItems: 'baseline',
        padding: '9px 0',
        borderTop: j ? F : 'none',
        fontSize: '14px',
        lineHeight: 1.5,
        color: 'var(--marine-900)'
      }}>
      <span aria-hidden="true" style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'var(--bleu-500)',
          justifySelf: 'center',
          transform: 'translateY(-2px)'
        }} /><span>{it}</span></li>)}</ul></section>;
  if (mode === 'bandeau') return <section aria-labelledby={'v2-' + s.k} className="lls-carte" style={{
    display: 'grid',
    alignContent: 'start',
    borderRadius: '20px',
    overflow: 'hidden',
    border: F,
    background: '#fff',
    boxShadow: O1
  }}>
    <header className="ll-sombre" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '18px 24px',
      background: k ? 'var(--marine-900)' : 'var(--degrade-marine,var(--marine-900))'
    }}>
      <span aria-hidden="true" style={{
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,.12)',
        display: 'grid',
        placeItems: 'center'
      }}><Icon name={s.ic} size={19} color="#fff" /></span>
      <h3 id={'v2-' + s.k} style={{
        margin: 0,
        fontSize: '22px',
        letterSpacing: '-0.02em',
        color: '#fff'
      }}>{s.t}</h3></header>
    <ul style={{
      listStyle: 'none',
      margin: 0,
      padding: '8px 24px 16px'
    }}>{s.items.map((it, j) => <li key={it} style={{
        display: 'grid',
        gridTemplateColumns: '22px minmax(0,1fr)',
        gap: '12px',
        alignItems: 'start',
        padding: '10px 0',
        borderTop: j ? F : 'none',
        fontSize: '14px',
        lineHeight: 1.5,
        color: 'var(--marine-900)'
      }}>
      <span aria-hidden="true" style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'var(--bleu-025)',
          display: 'grid',
          placeItems: 'center'
        }}><Icon name="check" size={13} color="var(--bleu-600)" /></span><span>{it}</span></li>)}</ul></section>;
  return <section aria-labelledby={'v2-' + s.k} className="ll-sombre lls-carte" style={{
    position: 'relative',
    overflow: 'hidden',
    display: 'grid',
    gap: '20px',
    alignContent: 'start',
    padding: '28px 28px 20px',
    borderRadius: '20px',
    background: 'var(--degrade-marine,var(--marine-900))',
    boxShadow: '0 20px 48px rgba(12,33,71,.22)'
  }}>
    <div aria-hidden="true" style={{
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(70% 80% at 100% 0%,rgba(91,154,232,.26),transparent 60%)',
      pointerEvents: 'none'
    }} />
    <header style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      paddingBottom: '18px',
      borderBottom: fil
    }}>
      <span aria-hidden="true" style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        border: '1.5px solid #fff',
        display: 'grid',
        placeItems: 'center'
      }}><Icon name={s.ic} size={21} color="#fff" /></span>
      <h3 id={'v2-' + s.k} style={{
        margin: 0,
        fontSize: '24px',
        letterSpacing: '-0.02em',
        color: '#fff'
      }}>{s.t}</h3></header>
    <ul style={{
      position: 'relative',
      listStyle: 'none',
      margin: 0,
      padding: 0
    }}>{s.items.map((it, j) => <li key={it} style={{
        display: 'grid',
        gridTemplateColumns: '22px minmax(0,1fr)',
        gap: '12px',
        alignItems: 'start',
        padding: '10px 0',
        borderTop: j ? fil : 'none',
        fontSize: '14px',
        lineHeight: 1.5,
        color: '#fff'
      }}>
      <span aria-hidden="true" style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,.14)',
          display: 'grid',
          placeItems: 'center'
        }}><Icon name="check" size={13} color="#fff" /></span><span>{it}</span></li>)}</ul></section>;
}
/* 02 retenu · « Plan » : le vocabulaire des volets de l'accueil (carte blanche à fine bordure marine, en-tête bleu très pâle, tuile marine, puces carrées), liste complète. */
const BORD = '1px solid rgba(12,33,71,.16)';
function CartePlan({
  s
}) {
  return <section aria-labelledby={'v2-' + s.k} className="cs-carte" style={{
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    borderRadius: '18px',
    background: '#fff',
    border: BORD,
    overflow: 'hidden'
  }}>
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      padding: '22px 24px',
      background: 'var(--bleu-025)',
      borderBottom: BORD
    }}>
      <span style={{
        display: 'grid',
        gap: '6px'
      }}><h3 id={'v2-' + s.k} style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          color: 'var(--marine-900)'
        }}>{s.t}</h3>
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--bleu-600)',
          fontVariantNumeric: 'tabular-nums'
        }}>{s.items.length} services inclus</span></span>
      <span aria-hidden="true" style={{
        width: '44px',
        height: '44px',
        flex: 'none',
        borderRadius: '12px',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--marine-900)'
      }}><Icon name={s.ic} size={19} color="#fff" /></span></header>
    <ul style={{
      listStyle: 'none',
      margin: 0,
      padding: '20px 24px 24px',
      display: 'grid',
      gap: '11px'
    }}>{s.items.map(it => <li key={it} style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '14px',
        lineHeight: 1.5,
        color: 'var(--texte-corps)'
      }}>
      <span aria-hidden="true" style={{
          width: '6px',
          height: '6px',
          flex: 'none',
          marginTop: '8px',
          borderRadius: '2px',
          background: 'var(--bleu-500)'
        }} /><span>{it}</span></li>)}</ul></section>;
}
function Services02({
  mode
}) {
  const [loc, ges, cpt, ent] = PP_SERVICES,
    C = (s, k) => mode === 'plan' ? <CartePlan s={s} /> : <Carte02 s={s} mode={mode} k={k} />;
  const grille = <div className="ll-deux" style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
    gap: mode === 'epure' ? '12px' : '20px',
    alignItems: 'start'
  }}>
    <div style={{
      display: 'grid',
      gap: mode === 'epure' ? '12px' : '20px'
    }}>{C(loc, 0)}{C(cpt, 2)}</div><div style={{
      display: 'grid',
      gap: mode === 'epure' ? '12px' : '20px'
    }}>{C(ges, 1)}{C(ent, 3)}</div></div>;
  return mode === 'epure' ? <div style={{
    padding: '12px',
    borderRadius: '28px',
    background: 'var(--bleu-025)'
  }}>{grille}</div> : grille;
}
const GestionS02 = ({
  actuel
}) => <OptionsSection k="s02" n="02" noms={['Épuré', 'Bandeau marine', 'Plan']} actuel={actuel} options={[<Services02 mode="epure" />, <Services02 mode="bandeau" />, <Services02 mode="plan" />]} />;
const GestionS03 = ({
  actuel
}) => <OptionsSection k="s03" n="03" noms={['Onglets d’écrans', 'Pellicule', 'Mosaïque']} actuel={actuel} options={[<S03Onglets />, <S03Pellicule />, <S03Mosaique />]} />;
export { Ecran as GO_Ecran, BasculeRevue as GO_BasculeRevue, useRevue as GO_useRevue, OptionsSection as GO_OptionsSection, GestionS01, GestionS02, GestionS03 };
