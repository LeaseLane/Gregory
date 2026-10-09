/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-cleo-recit.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { CLEO_F } from '@/proto/accueil-cleo-final';
import { ACC_H } from '@/proto/accueil-options-1';
import { CLEO_V2H } from '@/proto/accueil-cleo-v2';
import { __ssr } from '@/lib/hydratation';
const num = i => String(i + 1).padStart(2, '0'),
  cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const cran = u => {
  const b = Math.floor(u),
    x = cl((u - b - .2) / .6);
  return b + x * x * (3 - 2 * x);
};
const TOP = 'calc(' + ACC_H.HAUT + ' + 32px)',
  PAS = '64vh';
const DEG = 'linear-gradient(90deg,#4581CB,#B5D4F7)';
/* Gauche : halo; le portrait est droit, accroché au mur comme la carte de droite. */
/* Portrait des variantes F : légende pleine largeur, collée au bas de la photo. */
const PortraitF = ({
  children,
  fini
}) => <figure className={fini ? 'cr-fini' : undefined} style={{
  margin: 0,
  position: 'relative',
  maxWidth: '440px',
  borderRadius: '28px',
  overflow: 'hidden',
  border: '1px solid rgba(181,212,247,.28)'
}}><img src={CLEO_F.PORT} alt={CLEO_F.ALT} style={{
    display: 'block',
    width: '100%',
    aspectRatio: '4 / 5',
    objectFit: 'cover',
    objectPosition: '50% 18%'
  }} />
  <figcaption className="cr-fin-leg" style={{
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'grid',
    gap: '14px',
    padding: '16px 18px 18px',
    background: 'linear-gradient(180deg,rgba(12,33,71,.82) 0%,rgba(12,33,71,.96) 100%)',
    backdropFilter: 'blur(16px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
    borderTop: '1px solid rgba(181,212,247,.22)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)'
  }}><span aria-hidden="true" style={{
      position: 'absolute',
      left: '18px',
      right: '18px',
      top: '-1px',
      height: '1px',
      background: 'linear-gradient(90deg,rgba(181,212,247,0),rgba(181,212,247,.85),rgba(181,212,247,0))'
    }}></span>{children || <span style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px'
    }}><span style={{
        display: 'grid',
        gap: '3px',
        minWidth: 0
      }}><strong style={{
          fontSize: '17px',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          color: '#fff'
        }}>Cléo</strong><span style={{
          fontSize: '13px',
          lineHeight: 1.35,
          color: 'var(--bleu-100)'
        }}>Agent IA de Lease Lane</span></span><span style={{
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: '28px',
        padding: '0 12px',
        boxSizing: 'border-box',
        borderRadius: '8px',
        background: 'rgba(63,179,127,.12)',
        border: '1px solid rgba(63,179,127,.36)',
        fontSize: '12px',
        fontWeight: 700,
        color: '#7FD9AE'
      }}><span aria-hidden="true" className="cr-pouls" style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: '#3FB37F'
        }}></span>En ligne</span></span>}</figcaption>
  {/* Fin de l'animation : réglé sur data-final (posé à l'instant où le logo Lease Lane se révèle), pas sur le verrouillage, qui arrive plus tard. La légende s'efface, le dégradé bleu pâle → marine et l'appel apparaissent dès que le logo commence (300 ms). */}
  <span aria-hidden="true" className="cr-fin-deg" style={{
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
    background: 'linear-gradient(180deg,rgba(12,33,71,0) 0%,rgba(12,33,71,.5) 55%,rgba(12,33,71,.9) 100%)',
    pointerEvents: 'none'
  }} />
  <div className="cr-fin-cta" style={{
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    padding: '0 0 18px'
  }}><button type="button" className="cr-cta-p" tabIndex={fini ? 0 : -1} aria-hidden={fini ? undefined : 'true'} onClick={() => CLEO_F.ouvrir && CLEO_F.ouvrir()} style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
      width: '346px',
      maxWidth: 'calc(100% - 36px)',
      minHeight: '62px',
      padding: '10px 22px 10px 10px',
      boxSizing: 'border-box',
      border: '1px solid rgba(181,212,247,.55)',
      borderRadius: '14px',
      background: 'rgba(255,255,255,.05)',
      boxShadow: '0 14px 30px -12px rgba(2,8,18,.75)',
      color: '#fff',
      fontFamily: 'inherit',
      fontSize: '16px',
      fontWeight: 700,
      lineHeight: 1.3,
      textAlign: 'center',
      cursor: 'pointer'
    }}><span aria-hidden="true" style={{
        width: '40px',
        height: '40px',
        flex: 'none',
        borderRadius: '10px',
        background: '#fff',
        display: 'grid',
        placeItems: 'center'
      }}><ACC_H.Icon name="message-circle" size={19} color="var(--marine-900)" /></span>Des questions? Allez-y!</button></div></figure>;
const Profond = ({
  children,
  fini
}) => <div style={{
  position: 'relative',
  maxWidth: '440px',
  marginTop: '-28px'
}}>
  <span aria-hidden="true" className="cr-fond" style={{
    position: 'absolute',
    inset: '-12% -16%',
    background: 'radial-gradient(closest-side,rgba(69,129,203,.07),rgba(69,129,203,0))',
    pointerEvents: 'none'
  }} />
  
  
  <div style={{
    position: 'relative',
    borderRadius: '28px',
    boxShadow: '0 0 0 1px rgba(181,212,247,.19),0 0 24px 1px rgba(91,154,232,.08),22px 22px 56px 6px rgba(12,33,71,.85)'
  }}><PortraitF fini={fini}>{children}</PortraitF></div></div>;

/* Fond de section, fixé à l'écran pendant toute la traversée : le même quadrillé au mur (de face, il monte lentement) et au sol (en perspective, il avance en continu), en faible opacité, de part et d'autre de la ligne d'horizon. */

/* Fond : sol quadrillé dense en vraie perspective (le même que les autres sections), fixé à l'écran pendant la traversée; point de fuite au centre, cases carrées au premier plan, fondu vers le haut. */
const FL_HZ = -40,
  FL_S = 30,
  FL_D = .0491,
  FL_ZM = 12,
  FL_V = Array.from({
    length: 227
  }, (_, k) => (k - 113) * FL_S),
  FL_H = (() => {
    const o = [];
    for (let z = 1; z <= FL_ZM; z += FL_D * z) o.push(FL_HZ + (600 - FL_HZ) / z);
    return o;
  })();
const FondLarge = () => <div aria-hidden="true" style={{
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  height: 'var(--cr-fond-h, 100%)',
  pointerEvents: 'none',
  opacity: 'var(--cr-fond-o, 1)'
}}><div style={{
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflow: 'hidden'
  }}>
    <span style={{
      position: 'absolute',
      left: '50%',
      top: '60%',
      width: '90%',
      height: '60%',
      transform: 'translate(-50%,-50%)',
      background: 'radial-gradient(closest-side,rgba(69,129,203,.13),rgba(69,129,203,0))'
    }} />
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '78%',
      WebkitMaskImage: 'linear-gradient(to top,#000 0%,rgba(0,0,0,.55) 45%,transparent 100%)',
      maskImage: 'linear-gradient(to top,#000 0%,rgba(0,0,0,.55) 45%,transparent 100%)'
    }}><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" width="100%" height="100%" style={{
        display: 'block'
      }}><g stroke="rgba(181,212,247,.09)" strokeWidth="1" fill="none">{FL_V.map(dx => <line key={'v' + dx} x1={500 + dx / FL_ZM} y1={FL_HZ + (600 - FL_HZ) / FL_ZM} x2={500 + dx} y2="600" vectorEffect="non-scaling-stroke" />)}{FL_H.map((y, i) => <line key={'h' + i} x1="-2000" y1={y} x2="3000" y2={y} vectorEffect="non-scaling-stroke" />)}</g></svg></div></div></div>;

/* opt.fin : temps d'arrêt ajouté après la dernière tâche (en vh de défilement). opt.verrou : une fois la fin atteinte, l'animation reste figée dans son état final (elle ne repart qu'au retour sur la page). */
function usePiste(ecrire, opt = {}) {
  const fin = opt.fin || 0,
    verrou = !!opt.verrou,
    n = opt.n || CLEO_F.CAP.length;
  const piste = React.useRef(null),
    scene = React.useRef(null),
    racine = React.useRef(null),
    ec = React.useRef(ecrire),
    [k, setK] = React.useState(0),
    [fini, setFini] = React.useState(false),
    fixe = ACC_H.sansMvt();
  ec.current = ecrire;
  React.useLayoutEffect(() => {
    if (fixe) return;
    const {
      sc
    } = ACC_H.vue();
    let raf = 0,
      der = -1,
      fait = false,
      defile = false,
      tm = 0,
      st = 0,
      tc = -1,
      last = 0,
      dern = 0,
      compacte = false,
      lastY = null;
    const posY = () => sc === window ? (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.scrollY : undefined : sc.scrollTop;
    const mesure = () => {
      const s = scene.current;
      st = s ? parseFloat((__ssr() ? "undefined" : typeof window) !== "undefined" ? getComputedStyle(s).top : undefined) || 0 : 0;
    };
    /* Compactage : la piste d'épinglage est retirée et le défilement compensé (rien ne bouge à l'écran). Fait seulement quand le défilement est au repos, pour ne jamais couper l'inertie. */
    const compacter = () => {
      if (compacte) return;
      compacte = true;
      clearTimeout(tm);
      const p2 = piste.current,
        s2 = scene.current,
        sp = p2 && p2.lastElementChild;
      if (!sp || !s2) return;
      const v = ACC_H.vue(),
        r2 = p2.getBoundingClientRect(),
        H = sp.offsetHeight,
        sIn = Math.min(H, Math.max(0, v.top + st - r2.top)); /* Position visée calculée AVANT le retrait, puis imposée en valeur absolue : l'ancrage de défilement du navigateur ne peut plus doubler la correction (ce qui renvoyait vers le haut du site). */
      const el = v.sc === window ? ((__ssr() ? "undefined" : typeof document) !== "undefined" ? document.scrollingElement : undefined) || ((__ssr() ? "undefined" : typeof document) !== "undefined" ? document.documentElement : undefined) : v.sc,
        ancre = el.style.overflowAnchor,
        y0 = posY(),
        vise = Math.max(0, y0 - sIn);
      el.style.overflowAnchor = 'none';
      sp.style.height = '0px';
      void p2.offsetHeight;
      if (Math.abs(posY() - vise) > 1) {
        if (v.sc === window) window.scrollTo(0, vise);else v.sc.scrollTop = vise;
      }
      requestAnimationFrame(() => {
        el.style.overflowAnchor = ancre;
      });
    };
    const planifier = () => {
      lastY = posY();
      const go = () => {
        if (compacte) return;
        if (performance.now() - dern > 180) compacter();else tm = setTimeout(go, 120);
      };
      tm = setTimeout(go, 1500);
    };
    const f = () => {
      raf = 0;
      if (fait) return;
      const p = piste.current,
        s = scene.current;
      if (!p || !s) return;
      const {
          top
        } = ACC_H.vue(),
        r = p.getBoundingClientRect(),
        cible = cl((top + st - r.top) / Math.max(1, r.height - s.offsetHeight - fin / 100 * ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.innerHeight : undefined)));
      const now = performance.now(),
        dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      tc = tc < 0 ? cible : tc + (cible - tc) * (1 - Math.pow(.8, dt / 16.7));
      if (Math.abs(cible - tc) < .0005) tc = cible;
      const t = tc,
        u = cran(t * (n - 1));
      if (racine.current) racine.current.style.setProperty('--t', t.toFixed(4));
      ec.current(u, t);
      const a = Math.round(u);
      if (a !== der) {
        der = a;
        setK(a);
      }
      if (verrou && defile && u >= n - 1 - .001 && r.top <= top + st + 1 && r.bottom >= top + st + s.offsetHeight - 1) {
        fait = true;
        setFini(true);
        planifier();
        return;
      }
      if (tc !== cible) raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;else last = 0;
    };
    const g = () => {
        defile = true;
        dern = performance.now();
        if (fait) {
          if (!compacte) {
            const y = posY();
            if (lastY != null && y < lastY - 2) compacter();
            lastY = y;
          }
          return;
        }
        if (!raf) raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;
      },
      gr = () => {
        mesure();
        if (!raf) raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;
      };
    sc.addEventListener('scroll', g, {
      passive: true
    });
    window.addEventListener('resize', gr);
    mesure();
    f();
    return () => {
      sc.removeEventListener('scroll', g);
      window.removeEventListener('resize', gr);
      cancelAnimationFrame(raf);
      clearTimeout(tm);
    };
  }, [fixe]);
  return {
    piste,
    scene,
    racine,
    k,
    fixe,
    fini,
    setK
  };
}
const Fixe = () => <ol style={{
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '14px'
}}>{CLEO_F.CAP.map(c => <li key={c.t} style={{
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0,1fr)',
    gap: '16px',
    padding: '24px',
    borderRadius: '24px',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(181,212,247,.24)'
  }}><CLEO_F.Tuile ic={c.ic} t={44} urg={c.urg} /><div style={{
      display: 'grid',
      gap: '10px'
    }}><h3 style={{
        ...CLEO_V2H.H3(0),
        fontSize: 'clamp(20px,1.8vw,24px)'
      }}>{c.t}</h3><p style={CLEO_F.P14}>{c.d}</p>{c.tags && <CLEO_F.Tags tags={c.tags} />}</div></li>)}</ol>;
function Cadre({
  o,
  children,
  sansPanneau,
  tete,
  sansTete,
  decal = 0,
  legende
}) {
  const {
      racine,
      fixe
    } = o,
    kt = o.k - decal,
    k = Math.min(Math.max(kt, 0), CLEO_F.CAP.length - 1),
    c = CLEO_F.CAP[k];
  const leg = fixe || kt < 0 ? null : <React.Fragment>{legende ? legende(kt) : <div key={k} className="cf-entre" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px'
    }}><CLEO_F.Tuile ic={c.ic} t={40} urg={c.urg} /><strong style={{
        minWidth: 0,
        fontSize: '14.5px',
        lineHeight: 1.3,
        color: '#fff',
        textAlign: 'center'
      }}>{c.t}</strong></div>}
    <span aria-hidden="true" style={{
      display: 'block',
      height: o.fini ? '0px' : '2px',
      marginTop: o.fini ? '-12px' : 0,
      opacity: o.fini ? 0 : 1,
      borderRadius: '2px',
      background: 'rgba(181,212,247,.18)',
      overflow: 'hidden',
      transition: 'opacity 450ms,height 350ms 400ms,margin-top 350ms 400ms'
    }}><span style={{
        display: 'block',
        height: '100%',
        background: DEG,
        transformOrigin: '0 50%',
        transform: 'scaleX(var(--t,0))'
      }} /></span></React.Fragment>;
  return <CLEO_V2H.Dispo r={racine} deco={<React.Fragment><CLEO_F.Lueur x="78%" y="30%" /><FondLarge /></React.Fragment>} portrait={<Profond fini={o.fini}>{leg}</Profond>}>{sansTete && !fixe ? null : tete && !fixe ? <div ref={tete} style={{
      position: 'sticky',
      top: 'calc(' + ACC_H.HAUT + ' + 4px)'
    }}><CLEO_V2H.Tete /></div> : <CLEO_V2H.Tete />}{fixe ? <Fixe /> : children}{sansPanneau && !fixe ? null : <CLEO_V2H.Panneau />}</CLEO_V2H.Dispo>;
}
const Piste = ({
  o,
  style,
  children,
  fin = 0,
  n = CLEO_F.CAP.length,
  pas = PAS
}) => <div ref={o.piste} style={{
  position: 'relative',
  overflowAnchor: 'none'
}}><div ref={o.scene} className="cr-scene" style={{
    position: 'sticky',
    top: TOP,
    ...style
  }}>{children}</div><div aria-hidden="true" style={{
    height: 'calc(' + (n - 1) + ' * ' + pas + ' + ' + fin + 'vh)'
  }} /></div>;
const Progres = ({
  b,
  k,
  style,
  choix,
  n = CLEO_F.CAP.length
}) => {
  const va = j => choix && choix(Math.max(0, Math.min(n - 1, j))),
    tot = String(n).padStart(2, '0');
  return <div aria-hidden={choix ? undefined : 'true'} role={choix ? 'group' : undefined} aria-label={choix ? 'Revoir une compétence' : undefined} onPointerDown={choix ? e => {
    e.currentTarget.dataset.x = e.clientX;
  } : undefined} onPointerUp={choix ? e => {
    const dx = e.clientX - (+e.currentTarget.dataset.x || e.clientX);
    if (Math.abs(dx) > 30) va(k + (dx < 0 ? 1 : -1));
  } : undefined} style={{
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    touchAction: choix ? 'pan-y' : undefined,
    ...style
  }}><span style={{
      minWidth: '54px',
      fontSize: '13px',
      fontWeight: 700,
      color: '#fff',
      fontVariantNumeric: 'tabular-nums'
    }}>{num(k)} <span style={{
        color: 'var(--bleu-200)'
      }}>/ {tot}</span></span><span style={{
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'repeat(' + n + ',minmax(0,1fr))',
      gap: '6px'
    }}>{Array.from({
        length: n
      }, (_, i) => <span key={i} role={choix ? 'button' : undefined} tabIndex={choix ? 0 : undefined} aria-label={choix ? CLEO_F.CAP[i] ? 'Compétence ' + num(i) + ' : ' + CLEO_F.CAP[i].t : 'Questions' : undefined} aria-current={choix && i === k ? 'true' : undefined} onClick={choix ? () => va(i) : undefined} onKeyDown={choix ? e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          va(i);
        } else if (e.key === 'ArrowRight') va(k + 1);else if (e.key === 'ArrowLeft') va(k - 1);
      } : undefined} style={{
        display: 'grid',
        alignContent: 'center',
        height: choix ? '32px' : '3px',
        cursor: choix ? 'pointer' : undefined,
        outlineOffset: '2px'
      }}><span style={{
          display: 'block',
          height: '3px',
          borderRadius: '3px',
          background: 'rgba(181,212,247,.2)',
          overflow: 'hidden'
        }}><span ref={el => b.current[i] = el} style={{
            display: 'block',
            height: '100%',
            borderRadius: '3px',
            background: DEG,
            transformOrigin: '0 50%',
            transform: 'scaleX(' + (i ? 0 : 1) + ')'
          }} /></span></span>)}</span></div>;
};
const majB = (b, u) => b.current.forEach((el, i) => {
  if (el) el.style.transform = 'scaleX(' + cl(u - i + 1).toFixed(3) + ')';
});
const sXo = (i, u) => ({
  transform: 'none',
  opacity: cl(1 - Math.abs(i - u) * 2.2).toFixed(3)
});
/* Dernier écran de F4 : récapitulatif des six compétences (icône + intitulé, en grille alignée, apparition en cascade) et l'appel à écrire à Cléo. */
const Recap = () => <div style={{
  display: 'grid',
  gap: '20px',
  justifyItems: 'center',
  width: '100%'
}}>
  <ul className="cr-recap-g" style={{
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
    gap: '10px',
    width: '100%'
  }}>{CLEO_F.CAP.map((c, i) => <li key={c.t} className="cr-recap-i" style={{
      animationDelay: i * 70 + 'ms',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      minHeight: '58px',
      boxSizing: 'border-box',
      padding: '10px 12px',
      borderRadius: '16px',
      background: 'rgba(255,255,255,.05)',
      border: '1px solid rgba(181,212,247,.22)',
      textAlign: 'left'
    }}><CLEO_F.Tuile ic={c.ic} t={34} urg={c.urg} /><strong style={{
        minWidth: 0,
        fontSize: '15px',
        lineHeight: 1.3,
        color: '#fff',
        textWrap: 'balance'
      }}>{c.t}</strong></li>)}</ul>
  </div>;

/* F1 · Pile : chaque tâche monte par-dessus la précédente, qui recule dans la pile. */

/* F2 · Scène : grand compteur qui roule, intitulé révélé derrière un masque, texte en fondu. */

/* F3 · Cylindre : les six intitulés sur un tambour 3D qui tourne au défilement; le détail s'affiche sous la fenêtre de lecture. */
const TICKS = [];
for (let j = -12; j <= (CLEO_F.CAP.length - 1) * 4 + 12; j++) TICKS.push(j);
/* F4 · Circuit : un tracé lumineux part de Cléo et allume chaque tâche, comme une puce sur une carte électronique. */
const PTS = [[20, 64], [70, 64], [150, 64], [168, 46], [232, 46], [250, 64], [300, 64], [380, 64], [398, 82], [452, 82], [470, 64], [530, 64], [556, 64], [576, 84], [576, 156], [556, 176], [530, 176], [452, 176], [434, 194], [366, 194], [348, 176], [300, 176], [232, 176], [214, 158], [156, 158], [138, 176], [70, 176]];
const NDS = [1, 6, 11, 16, 21, 26],
  LG = [0];
for (let i = 1; i < PTS.length; i++) LG.push(LG[i - 1] + Math.hypot(PTS[i][0] - PTS[i - 1][0], PTS[i][1] - PTS[i - 1][1]));
const LT = LG[LG.length - 1],
  LN = NDS.map(n => LG[n]),
  TRACE = 'M' + PTS.map(p => p.join(' ')).join(' L');
const pt = l => {
  for (let i = 1; i < PTS.length; i++) if (LG[i] >= l) {
    const a = PTS[i - 1],
      b = PTS[i],
      f = (l - LG[i - 1]) / (LG[i] - LG[i - 1] || 1);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }
  return PTS[PTS.length - 1];
};
const long = u => {
  const b = Math.min(CLEO_F.CAP.length - 2, Math.floor(u));
  return LN[b] + (LN[b + 1] - LN[b]) * (u - b);
};
const DECOR = ['M70 64 V22 H118', 'M300 64 V18', 'M530 64 V26 H590', 'M70 176 V218 H22', 'M300 176 V222', 'M530 176 V214 H590', 'M122 108 H478', 'M150 120 H450', 'M178 132 H422'];
const VIAS = [[118, 22], [300, 18], [590, 26], [22, 218], [300, 222], [590, 214], [122, 108], [478, 108], [150, 120], [450, 120], [178, 132], [422, 132]];
/* Énergie : chaque piste secondaire se charge quand sa tâche est atteinte (puis des impulsions blanches y circulent); les trois bus se remplissent pas à pas avec la progression. */
const STUBS = [['M70 64 V22 H118', 0, 90, [118, 22]], ['M300 64 V18', 1, 46, [300, 18]], ['M530 64 V26 H590', 2, 98, [590, 26]], ['M530 176 V214 H590', 3, 98, [590, 214]], ['M300 176 V222', 4, 46, [300, 222]], ['M70 176 V218 H22', 5, 90, [22, 218]]],
  BUS = [[122, 478, 108], [150, 450, 120], [178, 422, 132]];
/* Bus en cellules multicolores qui se chargent pas à pas; à la toute fin, ils flashent puis s'éteignent. */
const PAL = ['#2F6BB3', '#4581CB', '#5B9AE8', '#8FBDF2', '#7ADBC7', '#3FB37F'],
  COUL = x => PAL[Math.min(PAL.length - 1, Math.floor(x * PAL.length))];
/* Version courte : les six compétences passent deux par deux (trois écrans au lieu de six), le titre et le récapitulatif restent; plus de pause imposée à la fin. */
/* Étiquettes compactes des écrans de paires : deux étiquettes au plus, puis « +N », sur une seule rangée; les écrans gardent la même hauteur. */
/* Écran titre du circuit : pastille « En ligne », titre centré, filet lumineux dessous. Sobre, aligné sur les cartes des écrans suivants. */
const TitreSol = () => <div style={{
  display: 'grid',
  justifyItems: 'center',
  gap: '18px',
  width: '100%'
}}>
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    height: '28px',
    padding: '0 12px',
    boxSizing: 'border-box',
    borderRadius: '8px',
    background: 'rgba(63,179,127,.12)',
    border: '1px solid rgba(63,179,127,.36)',
    fontSize: '12px',
    fontWeight: 700,
    color: '#7FD9AE'
  }}><span aria-hidden="true" className="cr-pouls" style={{
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      background: '#3FB37F',
      boxShadow: '0 0 0 3px rgba(63,179,127,.22)'
    }}></span>En ligne</span>
  <CLEO_F.Titre centre taille="clamp(28px,2.6vw,38px)" />
  <span aria-hidden="true" style={{
    width: '72px',
    height: '2px',
    borderRadius: '2px',
    background: DEG,
    boxShadow: '0 0 14px 1px rgba(91,154,232,.55)'
  }}></span></div>;
const PAIRES = [];
for (let j = 0; j < CLEO_F.CAP.length; j += 2) PAIRES.push(j + 1 < CLEO_F.CAP.length ? [j, j + 1] : [j]);
const PR = PAIRES.length;
function CleoCircuit() {
  const Tr = React.useRef(null),
    Q = React.useRef(null),
    Te = React.useRef(null),
    P = React.useRef([]),
    X = React.useRef([]),
    B = React.useRef([]),
    E = React.useRef([]),
    Sl = React.useRef([]),
    Sp = React.useRef([]),
    Sv = React.useRef([]),
    Bl = React.useRef([]),
    Cb = React.useRef([]),
    Bh = React.useRef([]),
    Bv = React.useRef([]),
    Bg = React.useRef([]),
    Ce = React.useRef([]),
    Pc = React.useRef(null),
    Ct = React.useRef(null),
    Lg = React.useRef(null),
    Ec = React.useRef(null),
    Fin = React.useRef(false),
    Raf = React.useRef(0),
    Pg = React.useRef(null),
    Ol = React.useRef(null),
    FiniR = React.useRef(false),
    Tt = React.useRef(null),
    TrG = React.useRef(null),
    QG = React.useRef(null);
  /* Fin de l'animation : le schéma part en poussière (balayage de gauche à droite) et le logo apparaît dans un éclair. Grains tirés du tracé réel : piste, bus, pistes secondaires, puces. */
  const grains = () => {
    const g = [],
      le = (a, b, pas, c) => {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]),
          n = Math.max(1, Math.round(L / pas));
        for (let i = 0; i <= n; i++) g.push({
          x: a[0] + (b[0] - a[0]) * i / n,
          y: a[1] + (b[1] - a[1]) * i / n,
          c: typeof c === 'function' ? c(i / n) : c
        });
      };
    for (let i = 1; i < PTS.length; i++) le(PTS[i - 1], PTS[i], 3.5, () => Math.random() < .35 ? '#FFFFFF' : '#8FBDF2');
    BUS.forEach(([a, b, y]) => le([a, y], [b, y], 5, f => COUL(f)));
    STUBS.forEach(([d]) => {
      const n = d.match(/[\d.]+/g).map(Number);
      let px = n[0],
        py = n[1];
      d.slice(1).split(/(?=[VH])/).slice(1).forEach(sg => {
        const v = +sg.slice(1),
          q = sg[0] === 'V' ? [px, v] : [v, py];
        le([px, py], q, 5, '#8FBDF2');
        px = q[0];
        py = q[1];
      });
    });
    NDS.forEach(n => {
      const [x, y] = PTS[n];
      for (let k = 0; k < 26; k++) g.push({
        x: x + (Math.random() - .5) * 36,
        y: y + (Math.random() - .5) * 36,
        c: Math.random() < .4 ? '#FFFFFF' : '#5B9AE8'
      });
    });
    return g;
  };
  const poussiere = () => {
    const cv = Pc.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect(),
      dpr = Math.min(2, ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.devicePixelRatio : undefined) || 1);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    const ctx = cv.getContext('2d'),
      Wb = r.width / 1.12,
      Hb = r.height / 1.24,
      ox = Wb * .06,
      oy = Hb * .12,
      kx = Wb / 600,
      ky = Hb / 240;
    const G = grains().map(q => ({
      x: ox + q.x * kx,
      y: oy + q.y * ky,
      c: q.c,
      d: q.x / 600 * 260 + Math.random() * 80,
      vx: (.25 + Math.random() * .9) * kx,
      vy: -(.15 + Math.random() * .8) * ky,
      l: 520 + Math.random() * 420,
      s: 1 + Math.random() * 1.4,
      ph: Math.random() * 6
    }));
    const t0 = performance.now();
    cancelAnimationFrame(Raf.current);
    const pas = n => {
      const t = n - t0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      let vif = false;
      for (const q of G) {
        const a = t - q.d;
        let x = q.x,
          y = q.y,
          al = 1;
        if (a > 0) {
          if (a > q.l) continue;
          const f = a / q.l;
          x += q.vx * a * .12 + Math.sin(a * .012 + q.ph) * 2.2;
          y += q.vy * a * .12;
          al = 1 - f * f;
        }
        vif = true;
        ctx.globalAlpha = al;
        ctx.fillStyle = q.c;
        ctx.fillRect(x - q.s / 2, y - q.s / 2, q.s, q.s);
      }
      ctx.globalAlpha = 1;
      if (vif) Raf.current = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(pas) : undefined;
    };
    Raf.current = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(pas) : undefined;
  };
  /* Pause de 1,5 s vers le bas à l'apparition du logo (une seule fois) : molette, glissé, clavier et inertie vers le bas sont retenus; remonter reste libre. */
  const Pause = React.useRef(false),
    Lever = React.useRef(null);
  const pauseDescente = ms => {
    const {
        sc
      } = ACC_H.vue(),
      el = sc === window ? window : sc,
      lire = () => sc === window ? (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.scrollY : undefined : sc.scrollTop,
      poser = y => {
        if (sc === window) window.scrollTo(0, y);else sc.scrollTop = y;
      },
      y0 = lire();
    let ty = null;
    const wh = e => {
        if (e.deltaY > 0) e.preventDefault();
      },
      ts = e => {
        ty = e.touches[0].clientY;
      },
      tm = e => {
        if (ty != null && e.touches[0].clientY < ty) e.preventDefault();
      },
      kd = e => {
        if (['ArrowDown', 'PageDown', ' ', 'End'].includes(e.key)) e.preventDefault();
      },
      sv = () => {
        if (lire() > y0 + 1) poser(y0);
      };
    el.addEventListener('wheel', wh, {
      passive: false
    });
    el.addEventListener('touchstart', ts, {
      passive: true
    });
    el.addEventListener('touchmove', tm, {
      passive: false
    });
    window.addEventListener('keydown', kd);
    el.addEventListener('scroll', sv, {
      passive: true
    });
    const lever = () => {
      clearTimeout(id);
      el.removeEventListener('wheel', wh);
      el.removeEventListener('touchstart', ts);
      el.removeEventListener('touchmove', tm);
      window.removeEventListener('keydown', kd);
      el.removeEventListener('scroll', sv);
      Lever.current = null;
    };
    const id = setTimeout(lever, ms);
    Lever.current = lever;
  };
  const finale = u => {
    const fin = u >= CLEO_F.CAP.length - 1 - .001;
    if (fin === Fin.current) return;
    Fin.current = fin;
    const on = fin ? '1' : '0';
    if (o.racine.current) o.racine.current.dataset.final = on;
    if (Lg.current) Lg.current.dataset.on = on;
    if (Ec.current) Ec.current.dataset.on = on;
    if (Ct.current) Ct.current.style.opacity = fin ? '0' : '1';
    if (fin) {
      if (!ACC_H.sansMvt()) poussiere();
    } else {
      cancelAnimationFrame(Raf.current);
      const cv = Pc.current,
        c = cv && cv.getContext('2d');
      if (c) c.clearRect(0, 0, cv.width, cv.height);
    }
  };
  React.useEffect(() => () => {
    cancelAnimationFrame(Raf.current);
    if (Lever.current) Lever.current();
  }, []);
  const energie = (r, u) => {
    STUBS.forEach(([d, n, len], i) => {
      const e = cl((r - n + .2) / .4),
        on = e >= .98 ? '1' : '0',
        a = Sl.current[i],
        b = Sp.current[i],
        c = Sv.current[i];
      if (a) a.style.strokeDashoffset = (len * (1 - e)).toFixed(2);
      if (b && b.dataset.on !== on) {
        b.style.opacity = on;
        b.dataset.on = on;
      }
      if (c) c.style.opacity = on;
    });
    BUS.forEach(([a0, b0], k) => {
      const L = b0 - a0,
        f = cl((u - k * .12) / (CLEO_F.CAP.length - 1 - k * .12)),
        cs = Ce.current[k] || [],
        n = cs.length,
        hd = Bh.current[k],
        v0 = Bv.current[k * 2],
        v1 = Bv.current[k * 2 + 1];
      cs.forEach((el, c) => {
        if (!el) return;
        const on = (c + 1) / n <= f + 1e-6 ? '1' : '0.14';
        if (el.style.opacity !== on) el.style.opacity = on;
      });
      if (hd) {
        hd.setAttribute('cx', (a0 + L * f).toFixed(2));
        hd.style.opacity = f > .005 && f < .995 ? '1' : '0';
      }
      if (v0) v0.style.opacity = f > .005 ? '1' : '0';
      if (v1) v1.style.opacity = f >= .995 ? '1' : '0';
    });
    const fin = u >= CLEO_F.CAP.length - 1 - .001 ? '1' : '0';
    Bg.current.forEach(g => {
      if (g && g.dataset.fin !== fin) g.dataset.fin = fin;
    });
  };
  const Bd = React.useRef(null);
  const o = usePiste((u, t) => {
    const U = u;
    u = cl(2 * U - 1, 0, CLEO_F.CAP.length - 1);
    const l = long(u),
      [x, y] = pt(l),
      gA = Math.round(U) - 1;
    energie(cl(2 * U - .8, 0, CLEO_F.CAP.length), u);
    finale(u);
    const d1 = (LT - l).toFixed(2),
      d2 = (70 - l).toFixed(2);
    if (Tr.current) Tr.current.style.strokeDashoffset = d1;
    if (TrG.current) TrG.current.style.strokeDashoffset = d1;
    if (Q.current) Q.current.style.strokeDashoffset = d2;
    if (QG.current) QG.current.style.strokeDashoffset = d2;
    if (Te.current) Te.current.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ')');
    P.current.forEach((el, i) => {
      if (!el) return;
      const re = u > i - .04,
        s = re ? gA >= 0 && Math.floor(i / 2) === gA ? 2 : 1 : 0;
      if (E.current[i] !== s) {
        E.current[i] = s;
        el.dataset.on = re ? '1' : '0';
        el.dataset.act = s === 2 ? '1' : '0';
      }
    });
    X.current.forEach((el, i) => {
      if (!el) return;
      Object.assign(el.style, sXo(i, U));
      if (i === PR + 1) {
        const on = Math.abs(i - U) < .5;
        el.style.pointerEvents = on ? 'auto' : 'none';
        el.dataset.on = on ? '1' : '0';
      }
    });
    majB(B, U);
  }, {
    fin: 12,
    verrou: true,
    n: PR + 2
  });
  /* Ligne d'horizon sous les cartes : la carte du circuit et le portrait restent sur le mur, au-dessus de la ligne, pendant tout l'épinglage. */
  React.useEffect(() => {
    const sec = o.racine.current,
      bd = Bd.current;
    if (!sec || !bd) return;
    const fig = sec.querySelector('.cf-collant figure'),
      col = sec.querySelector('.cf-collant'),
      {
        sc: scr
      } = ACC_H.vue();
    let stP = 0,
      raf2 = 0,
      vis = null;
    /* Barre de progression : visible seulement pendant l'épinglage (fondu). */
    const sy = () => {
      raf2 = 0;
      const sc = o.scene.current,
        pg = Pg.current;
      if (!sc || !pg) return;
      const on = !FiniR.current && Math.abs(sc.getBoundingClientRect().top - stP) < 1.5;
      if (on !== vis) {
        vis = on;
        pg.style.opacity = on ? '1' : '0';
      }
    };
    const syR = () => {
      if (!raf2) raf2 = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(sy) : undefined;
    };
    const m = () => {
      const mob = (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(max-width:960px)').matches : undefined,
        sc = o.scene.current,
        ol = Ol.current,
        pg = Pg.current,
        pi = o.piste.current;
      if (!sc) return;
      if (col) col.style.paddingBottom = '';
      sc.style.paddingBottom = '';
      const st = parseFloat((__ssr() ? "undefined" : typeof window) !== "undefined" ? getComputedStyle(sc).top : undefined) || 0,
        vh = (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.innerHeight : undefined,
        B = bd.offsetHeight,
        T = ol ? ol.offsetHeight : 0;
      /* Ligne d'horizon sous tout le schéma (carte, texte) et sous le portrait. */
      const M = Math.max(B + T + 44, mob || !fig ? 0 : fig.offsetHeight),
        hz = Math.min(st + M + 24, vh - 48),
        ln = hz * .7 + vh * .3;
      sec.style.setProperty('--cr-hz', hz + 'px');
      /* Texte centré entre le bas de la carte et la ligne : même espace au-dessus et au-dessous. */
      if (ol) {
        const mt = FiniR.current && !mob ? '16px' : Math.max(0, Math.round((ln - st - B - T) / 2 - 22)) + 'px';
        if (ol.style.marginTop !== mt) ol.style.marginTop = mt;
      }
      /* Barre : à mi-chemin entre la ligne et le bas de l'écran, jamais sur le texte (position fixe dans la scène). */
      stP = st;
      if (pg) {
        const min = ol ? ol.offsetTop + ol.offsetHeight + 16 + pg.offsetHeight / 2 : 0;
        pg.style.top = Math.max((ln + vh) / 2 - st, min).toFixed(1) + 'px';
      }
      /* Portrait et scène se libèrent au même instant : leurs bas collants sont égalisés (le plus court reçoit un rembourrage invisible). */
      if (col && !mob) {
        const S = sc.offsetHeight,
          C = col.offsetHeight,
          ct = parseFloat((__ssr() ? "undefined" : typeof window) !== "undefined" ? getComputedStyle(col).top : undefined) || 0,
          diff = Math.round(st + S - (ct + C));
        if (diff > 0) col.style.paddingBottom = diff + 'px';else if (diff < 0) sc.style.paddingBottom = -diff + 'px';
      }
      /* Le fond se libère en même temps que la scène. */
      if (pi) {
        const fh = Math.round(pi.getBoundingClientRect().bottom - sec.getBoundingClientRect().top + vh - st - sc.offsetHeight) + 'px';
        sec.style.setProperty('--cr-fond-h', fh);
      }
      vis = null;
      sy();
    };
    m();
    const ro = new ResizeObserver(() => (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(m) : undefined);
    ro.observe(bd);
    if (fig) ro.observe(fig);
    if (Ol.current) ro.observe(Ol.current);
    if (o.piste.current) ro.observe(o.piste.current);
    window.addEventListener('resize', m);
    scr.addEventListener('scroll', syR, {
      passive: true
    });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', m);
      scr.removeEventListener('scroll', syR);
      cancelAnimationFrame(raf2);
      if (col) col.style.paddingBottom = '';
    };
  }, []);
  FiniR.current = o.fini;
  /* Une fois tout terminé, le fond se fige (le quadrillé cesse de défiler). */
  React.useEffect(() => {
    const sec = o.racine.current;
    if (sec) sec.dataset.fige = o.fini ? '1' : '0';
    if (o.fini && Pg.current) Pg.current.style.opacity = '0';
  }, [o.fini]);
  /* État final (bureau) : les six boutons remontent sous la carte du logo, et le portrait s'aligne sur la colonne de droite (haut de la carte → bas des boutons). */
  React.useEffect(() => {
    const sec = o.racine.current,
      bd = Bd.current,
      ol = Ol.current;
    if (!sec || !bd || !ol) return;
    const li = sec.querySelector('.cr-cta-li'),
      fig = sec.querySelector('.cf-collant figure'),
      img = fig && fig.querySelector('img'),
      wrap = fig && fig.parentElement && fig.parentElement.parentElement;
    const reset = () => {
      if (li) li.style.alignSelf = 'center';
      if (img) {
        img.style.aspectRatio = '4 / 5';
        img.style.height = '';
      }
      if (wrap) wrap.style.transform = '';
    };
    if (!o.fini || ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(max-width:960px)').matches : undefined)) {
      reset();
      return;
    }
    /* Recalé à chaque image de défilement : portrait et colonne de droite ne se libèrent pas exactement au même instant. */
    let raf = 0,
      dy = 0;
    const aligne = () => {
      raf = 0;
      if (li) li.style.alignSelf = 'start';
      if (ol.style.marginTop !== '16px') ol.style.marginTop = '16px';
      if (!img || !wrap) return;
      const b = bd.getBoundingClientRect(),
        g = sec.querySelector('.cr-recap-g'),
        r = g ? g.getBoundingClientRect() : null;
      if (!r) return;
      const h = Math.round(r.bottom - b.top - 2) + 'px'; /* −2 : bordure de 1 px du cadre, en haut et en bas */
      if (img.style.height !== h) {
        img.style.aspectRatio = 'auto';
        img.style.height = h;
      }
      const f = fig.getBoundingClientRect(),
        base = f.top - dy;
      dy = Math.round(b.top - base);
      wrap.style.transform = 'translateY(' + dy + 'px)';
    };
    raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(() => requestAnimationFrame(aligne)) : undefined;
    const t2 = setTimeout(aligne, 450);
    const rz = () => {
      if (!raf) raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(aligne) : undefined;
    };
    const scr = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;
    window.addEventListener('resize', rz);
    if (scr) scr.addEventListener('scroll', rz, {
      passive: true
    });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t2);
      window.removeEventListener('resize', rz);
      if (scr) scr.removeEventListener('scroll', rz);
    };
  }, [o.fini]);
  const revoir = j => {
    o.setK(j);
    X.current.forEach((el, i) => {
      if (!el) return;
      el.style.transition = 'opacity 320ms';
      Object.assign(el.style, sXo(i, j));
      if (i === PR + 1) {
        el.style.pointerEvents = j === PR + 1 ? 'auto' : 'none';
        el.dataset.on = j === PR + 1 ? '1' : '0';
      }
    });
    majB(B, j);
  };
  const [x0, y0] = pt(LN[0]);
  const legP = kt => {
    const g = Math.min(Math.max(kt, 0), PR - 1);
    return <ul key={g} className="cf-entre" style={{
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(' + PAIRES[g].length + ',minmax(0,1fr))',
      gap: '8px'
    }}>{PAIRES[g].map(j => <li key={j} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minHeight: '52px',
        padding: '8px 10px',
        boxSizing: 'border-box',
        borderRadius: '12px',
        background: 'rgba(255,255,255,.05)',
        border: '1px solid rgba(181,212,247,.16)'
      }}><CLEO_F.Tuile ic={CLEO_F.CAP[j].ic} t={30} urg={CLEO_F.CAP[j].urg} /><strong style={{
          minWidth: 0,
          fontSize: '13px',
          fontWeight: 600,
          lineHeight: 1.35,
          color: '#fff',
          textWrap: 'balance'
        }}>{CLEO_F.CAP[j].t}</strong></li>)}</ul>;
  };
  return <Cadre o={o} sansPanneau sansTete decal={1} legende={legP}><Piste o={o} fin={12} n={PR + 2} pas="54vh" style={{
      top: 'calc(' + ACC_H.HAUT + ' + 4px)',
      display: 'grid',
      gap: '22px'
    }}>
    <div ref={Bd} style={{
        padding: 'clamp(14px,1.8vw,22px)',
        borderRadius: '28px',
        border: '1px solid rgba(214,232,252,.32)',
        boxShadow: '0 0 30px 2px rgba(91,154,232,.1),inset 0 0 24px rgba(91,154,232,.04),22px 22px 56px 6px rgba(12,33,71,.85)',
        background: 'radial-gradient(rgba(181,212,247,.13) 1px,transparent 1.6px) 0 0/20px 20px,linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.015)),linear-gradient(180deg,#10294C,#0B1F3B)'
      }}>
      <div aria-hidden="true" style={{
          position: 'relative',
          aspectRatio: '600 / 240'
        }}><div ref={Ct} style={{
            position: 'absolute',
            inset: 0,
            transition: 'opacity 140ms'
          }}>
        <svg viewBox="0 0 600 240" style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible'
            }}>
          <defs><radialGradient id="cr-tete"><stop offset="0" stopColor="#fff" /><stop offset=".3" stopColor="#B5D4F7" stopOpacity=".95" /><stop offset="1" stopColor="#4581CB" stopOpacity="0" /></radialGradient><linearGradient id="cr-bus" gradientUnits="userSpaceOnUse" x1="122" y1="0" x2="478" y2="0"><stop offset="0" stopColor="#4581CB" /><stop offset=".65" stopColor="#8FBDF2" /><stop offset="1" stopColor="#fff" /></linearGradient>{BUS.map(([a, b, y], k) => <clipPath key={k} id={'cr-cb' + k}><rect ref={el => Cb.current[k] = el} x={a - 3} y={y - 5} width="0" height="10" /></clipPath>)}</defs>
          <g fill="none" stroke="rgba(181,212,247,.2)" strokeWidth="1.2">{DECOR.map(d => <path key={d} d={d} />)}</g>
          <g fill="#0B1E38" stroke="rgba(181,212,247,.3)" strokeWidth="1.2">{VIAS.map(([x, y]) => <circle key={x + '-' + y} cx={x} cy={y} r="3.2" />)}</g>
          <g fill="none" strokeLinecap="round">{STUBS.map(([d, n, len], i) => <React.Fragment key={d}><path ref={el => Sl.current[i] = el} d={d} stroke="#8FBDF2" strokeWidth="1.7" strokeDasharray={len + ' ' + len} style={{
                    strokeDashoffset: len,
                    filter: 'drop-shadow(0 0 3px rgba(91,154,232,.95))'
                  }} /><path ref={el => Sp.current[i] = el} className="cr-flux" d={d} stroke="#fff" strokeWidth="1.7" strokeDasharray="5 22" style={{
                    opacity: 0,
                    transition: 'opacity 400ms'
                  }} /></React.Fragment>)}</g>
          <g fill="#fff" style={{
                filter: 'drop-shadow(0 0 4px #8FBDF2)'
              }}>{STUBS.map(([d, n, len, [x, y]], i) => <circle key={'s' + i} ref={el => Sv.current[i] = el} cx={x} cy={y} r="3.2" style={{
                  opacity: 0,
                  transition: 'opacity 400ms'
                }} />)}</g>
          {BUS.map(([a, b, y], k) => {
                const n = Math.floor((b - a) / 14);
                return <g key={'bus' + k} ref={el => Bg.current[k] = el} className="cr-bus" data-fin="0">{Array.from({
                    length: n
                  }, (_, c) => <rect key={c} ref={el => {
                    (Ce.current[k] = Ce.current[k] || [])[c] = el;
                  }} x={a + c * 14 + 2} y={y - 2.5} width="10" height="5" rx="1.5" fill={COUL(c / Math.max(1, n - 1))} style={{
                    opacity: .14
                  }} />)}<circle ref={el => Bv.current[k * 2] = el} cx={a} cy={y} r="3.2" fill="#fff" style={{
                    opacity: 0,
                    transition: 'opacity 400ms'
                  }} /><circle ref={el => Bv.current[k * 2 + 1] = el} cx={b} cy={y} r="3.2" fill="#fff" style={{
                    opacity: 0,
                    transition: 'opacity 400ms'
                  }} /><circle ref={el => Bh.current[k] = el} cx={a} cy={y} r="2.6" fill="#fff" style={{
                    opacity: 0
                  }} /></g>;
              })}
          <path d={TRACE} fill="none" stroke="rgba(181,212,247,.22)" strokeWidth="2" strokeLinejoin="round" />
          <path ref={TrG} d={TRACE} fill="none" stroke="rgba(91,154,232,.3)" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={LT + ' ' + LT} style={{
                strokeDashoffset: LT - LN[0]
              }} /><path ref={Tr} d={TRACE} fill="none" stroke="#8FBDF2" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={LT + ' ' + LT} style={{
                strokeDashoffset: LT - LN[0]
              }} />
          <path ref={QG} d={TRACE} fill="none" stroke="rgba(181,212,247,.32)" strokeWidth="10" strokeLinecap="round" strokeDasharray={'70 ' + (LT + 70)} style={{
                strokeDashoffset: 70 - LN[0]
              }} /><path ref={Q} d={TRACE} fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeDasharray={'70 ' + (LT + 70)} style={{
                strokeDashoffset: 70 - LN[0]
              }} />
          <rect x="6" y="52" width="24" height="24" rx="7" fill="#0E2546" stroke="#B5D4F7" strokeWidth="1.4" /><circle cx="18" cy="64" r="3.5" fill="#B5D4F7" />
          <g ref={Te} transform={'translate(' + x0 + ' ' + y0 + ')'}><circle r="16" fill="url(#cr-tete)" /><circle r="3.6" fill="#fff" /></g></svg>
        {CLEO_F.CAP.map((c, i) => {
              const [x, y] = PTS[NDS[i]];
              return <React.Fragment key={c.t}><span ref={el => P.current[i] = el} className="cr-puce" data-on={i ? '0' : '1'} data-act={i ? '0' : '1'} style={{
                  position: 'absolute',
                  left: x / 6 + '%',
                  top: y / 2.4 + '%',
                  width: 'clamp(32px,7.4%,46px)',
                  aspectRatio: '1',
                  transform: 'translate(-50%,-50%)',
                  borderRadius: '13px',
                  display: 'grid',
                  placeItems: 'center',
                  background: '#0E2546',
                  border: '1px solid rgba(181,212,247,.32)',
                  color: 'var(--bleu-200)'
                }}><ACC_H.Icon name={c.ic} size={18} color="currentColor" /></span></React.Fragment>;
            })}</div>
        <span ref={Ec} className="cr-eclair" data-on="0" style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '70%',
            aspectRatio: '1',
            borderRadius: '50%',
            background: 'radial-gradient(closest-side,rgba(255,255,255,.95),rgba(181,212,247,.45) 38%,rgba(91,154,232,0) 72%)',
            pointerEvents: 'none'
          }} />
        <span ref={Lg} className="cr-logo" data-on="0" style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            height: '88%',
            pointerEvents: 'none'
          }}><img src="/assets/img/logo/lease-lane-cadre-vertical.png" alt="" style={{
              display: 'block',
              height: '100%',
              width: 'auto'
            }} /></span>
        <canvas ref={Pc} style={{
            position: 'absolute',
            left: '-6%',
            top: '-12%',
            width: '112%',
            height: '124%',
            pointerEvents: 'none'
          }}></canvas></div></div>
    <ol ref={Ol} style={{
        listStyle: 'none',
        margin: '22px 0',
        padding: 0,
        display: 'grid'
      }}><li key="titre" ref={el => X.current[0] = el} style={{
          gridArea: '1 / 1',
          alignSelf: 'center',
          display: 'grid',
          justifyItems: 'center',
          textAlign: 'center',
          ...sXo(0, 0)
        }}><TitreSol /></li>{PAIRES.map((ps, g) => <li key={'p' + g} ref={el => X.current[g + 1] = el} className="cr-paire" style={{
          gridArea: '1 / 1',
          alignSelf: 'center',
          display: 'grid',
          gridTemplateColumns: 'repeat(' + ps.length + ',minmax(0,1fr))',
          gap: '14px',
          alignItems: 'stretch',
          ...sXo(g + 1, 0)
        }}>{ps.map((j, q) => {
            const c = CLEO_F.CAP[j];
            return <div key={c.t} style={{
              display: 'grid',
              gap: '12px',
              alignContent: 'center',
              justifyItems: 'center',
              padding: 'clamp(18px,1.8vw,22px)',
              boxSizing: 'border-box',
              borderRadius: '20px',
              background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025))',
              border: '1px solid rgba(181,212,247,.18)',
              textAlign: 'center'
            }}><CLEO_F.Tuile ic={c.ic} t={34} urg={c.urg} /><h3 style={{
                ...CLEO_V2H.H3(0),
                width: '100%',
                fontSize: 'clamp(17px,1.4vw,20px)',
                lineHeight: 1.4375,
                textAlign: 'center',
                textWrap: 'balance'
              }}>{c.t}</h3><p style={{
                ...CLEO_F.P14,
                margin: 0,
                maxWidth: '44ch'
              }}>{c.d}</p></div>;
          })}</li>)}<li key="cta" ref={el => X.current[PR + 1] = el} data-on="0" className="cr-cta-li" style={{
          gridArea: '1 / 1',
          alignSelf: 'center',
          display: 'grid',
          pointerEvents: 'none',
          ...sXo(PR + 1, 0)
        }}><Recap /></li></ol>
    <div ref={Pg} style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: '100%',
        transform: 'translateY(-50%)',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity: 0,
        transition: 'opacity 320ms'
      }}><Progres b={B} k={o.k} n={PR + 2} choix={null} style={{
          width: 'min(100%,420px)'
        }} /></div></Piste></Cadre>;
}

/* F5 · Profondeur : on traverse un couloir de cadres; chaque tâche arrive du fond et passe derrière la caméra. */

const avec = C => () => <C />;
let __exp_CleoCircuit_3 = avec(CleoCircuit);
export { __exp_CleoCircuit_3 as CleoCircuit };
