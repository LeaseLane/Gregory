/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-heros7.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { H3 } from '@/proto/accueil-heros3';
import { __ssr } from '@/lib/hydratation';

/* Titre de la bannière d'accueil (fourni par le client, mot pour mot). */
const H1 = ({
  clair = true,
  bleu = '#6194D3'
}) => <h1 className="h3-monte" style={{
  margin: 0,
  fontSize: 'clamp(34.4px,3.01vw,43px)',
  fontWeight: 700,
  letterSpacing: '-0.03em',
  lineHeight: 1.29,
  color: clair ? '#fff' : 'var(--marine-900)',
  textWrap: 'balance',
  maxWidth: '24ch'
}}><span style={{
    display: 'block'
  }}>Bienvenue chez Lease Lane.</span>La première gestion immobilière <span style={{
    color: bleu
  }}>propulsée par l'IA</span> au <span style={{
    color: bleu
  }}>Québec</span></h1>;
const BLEU = '#6194D3',
  IMG = "/assets/img/";
/* Sous-texte de la bannière d'accueil (fourni par le client, mot pour mot). */
const LEAD = 'Lease Lane n’est pas qu’une simple gestion immobilière. C’est une plateforme automatisée qui permet aux propriétaires d\'optimiser leurs opérations et aux locataires d\'obtenir un service digne de ce nom.';
const Lead = ({
  centre
}) => <p className="h3-monte" style={{
  margin: centre ? '0 auto' : 0,
  fontSize: '14px',
  lineHeight: 1.65,
  color: '#fff',
  maxWidth: '54ch',
  textWrap: 'pretty',
  animationDelay: '90ms'
}}>{LEAD}</p>;
/* Trois présentations du slogan à comparer (revue). Texte mot pour mot; « clé » et « permanence » en bleu. */
const SL_TXT = <React.Fragment>Une <span style={{
    color: BLEU
  }}>clé</span> d’avance et ce, en <span style={{
    color: BLEU
  }}>permanence</span>.</React.Fragment>;
const SL_H = () => <p className="h3-monte" style={{
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  maxWidth: '600px',
  fontSize: '11.7px',
  fontWeight: 510,
  letterSpacing: '.112em',
  textTransform: 'uppercase',
  lineHeight: 1.5,
  color: '#fff',
  animationDelay: '160ms'
}}>
  <span aria-hidden="true" style={{
    flex: '0 0 32px',
    height: '1px',
    background: 'rgba(181,212,247,.5)'
  }}></span><span style={{
    flex: 'none'
  }}>{SL_TXT}</span><span aria-hidden="true" style={{
    flex: '1 1 32px',
    height: '1px',
    background: 'linear-gradient(90deg,rgba(181,212,247,.5),rgba(181,212,247,0))'
  }}></span></p>;
const Slogan = () => <SL_H />;
/* Toile : canevas à la densité de l'écran, temps cumulé figé en pause, arrêt hors écran. */
function useToile(ref, dessin, pause, deps) {
  const pr = React.useRef(pause),
    dr = React.useRef(dessin);
  pr.current = pause;
  dr.current = dessin;
  React.useEffect(() => {
    const cv = ref.current,
      ctx = cv && cv.getContext('2d');
    if (!ctx) return;
    const red = H3.sansMvt();
    let w = 0,
      h = 0,
      dpr = 1,
      id = 0,
      vu = true,
      last = performance.now(),
      acc = 0,
      etat = {};
    const image = n => {
      const dt = n - last;
      last = n;
      if (!pr.current && !red) acc += Math.min(dt, 64);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (w && h) dr.current(ctx, w, h, acc, etat, dpr);
    };
    const boucle = n => {
      image(n);
      if (vu && !red) id = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(boucle) : undefined;
    };
    const go = () => {
      cancelAnimationFrame(id);
      last = performance.now();
      if (red) image(last);else if (vu) id = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(boucle) : undefined;
    };
    const taille = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(2, ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.devicePixelRatio : undefined) || 1);
      w = r.width;
      h = r.height;
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      etat = {};
      go();
    };
    const ro = new ResizeObserver(taille);
    ro.observe(cv);
    const io = new IntersectionObserver(([x]) => {
      vu = x.isIntersecting;
      go();
    });
    io.observe(cv);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      io.disconnect();
    };
  }, deps);
}
/* Voie de chevrons en perspective (même tracé que la couverture de connexion), point de fuite vx. Couleur : blanc ou bleu très pâle #DCEAFB, réparti au hasard. */
/* lim() : bas de la bannière. Les chevrons apparaissent dès que leur pointe franchit cette ligne et défilent en continu jusqu'à l'horizon, sans fondu, flou ni lueur. */

/* Voie « au sol » (modèle Pastille lumineuse de la page de connexion) : chaque chevron est un polygone plein posé au sol, projeté sommet par sommet; épaisseur raccourcie par la distance, pointe affinée,
   grille régulière (colonnes et rangées à écarts égaux), entrée douce en bas, fondu vers l'horizon et les côtés, teinte qui bleuit avec la profondeur. */
const voieSol = (vx, op, fk, lim, vit = 1) => (ctx, w, h, t) => {
  const D = .2484,
    DZ = .4375,
    TH = .04,
    ZN = .8,
    ZF = 9,
    N = 6,
    T = 3125 / vit,
    F = fk * w,
    cx = w * vx(),
    off = h / ZF,
    ph = t / T % 1;
  /* Angle du logo : demi-largeur réglée pour que la pointe fasse 90° à l'écran sur la rangée de référence (z = 1,4); écart entre colonnes = largeur + écart entre rangées. */
  const A = Math.min(.6028, 1.56 * (h / F) * D / (1.4 + D)),
    S = 2 * A + .19;
  const L = lim && lim(),
    cvs = ctx.canvas,
    kx = (cvs.offsetWidth || w) / w,
    ky = (cvs.offsetHeight || h) / h,
    SN = Math.sin(-1.15 * Math.PI / 180),
    CS = Math.cos(-1.15 * Math.PI / 180);
  const sx = (x, z) => cx + x * F / z,
    sy = z => h / z - off,
    lis = (a, b, v) => {
      const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };
  for (let j = 0;; j++) {
    const z = ZN + (j + ph) * DZ;
    if (z > ZF) break;
    const zt = z + D;
    if (sy(zt) < 0) continue;
    const d = Math.max(TH, .6 * z * z / h),
      af = 1 - lis(ZF * .42, ZF, z),
      pr = lis(1, ZF * .6, z),
      col = Math.round(255 - 85 * pr) + ',' + Math.round(255 - 55 * pr) + ',' + Math.round(255 - 12 * pr);
    for (let X = -N; X <= N; X++) {
      const xc = X * S;
      let a = .2346 * op * af * (1 - lis(1.05, 4.6, Math.abs(X)));
      if (a <= .006) continue;
      if (L) {
        const yl = (L.st - L.yh - (sx(xc, zt) * kx - L.x0) * SN) / CS / ky,
          zE = h / (yl + off) - D;
        if (z <= zE) continue;
        a *= lis(zE, zE + DZ * .8, z);
      } else a *= Math.min(1, .35 + sy(z) / h / .2);
      if (a <= .006) continue;
      ctx.fillStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(sx(xc - A, z), sy(z));
      ctx.lineTo(sx(xc, zt), sy(zt));
      ctx.lineTo(sx(xc + A, z), sy(z));
      ctx.lineTo(sx(xc + A, z - d), sy(z - d));
      ctx.lineTo(sx(xc, zt - d), sy(zt - d));
      ctx.lineTo(sx(xc - A, z - d), sy(z - d));
      ctx.closePath();
      ctx.fill();
    }
  }
};

/* Icônes « Trousseau » (option 2) en clés anciennes, au trait blanc 1,75 px.
   Détails : anneau en perspective (arc arrière estompé), tête percée, épaulement, lame rainurée, pannetons découpés, arête d'épaisseur bleue décalée.
   Mouvement : balancement lent en continu (4,5 s); au survol, les clés tintent (propriétaire) ou la clé tourne et l'étiquette se balance (locataire). */

/* Clés anciennes (clés à gorge, « passe-partout ») : anneau de tête ouvragé, tige ronde à bagues, panneton à dents. Trait blanc, arête bleue d'épaisseur. */

/* Version épurée (retenue) : trait blanc 1,75 px, aucun effet de perspective ni de détail superflu; seul l'accent bleu signale la clé principale. Survol : les clés pivotent légèrement. */
/* Option 1 « Trousseau plein » (retenue) : clés pleines à tête carrée légèrement adoucie, détourées d'un liseré couleur fond. Métal en dégradé de marque. */
const BGK = '#0E2340';
const KSvgP = ({
  children,
  t = 69.75
}) => <svg className="h7-ico" viewBox="0 0 64 64" width={t} height={t} aria-hidden="true" focusable="false" style={{
  overflow: 'visible'
}}>{children}</svg>;
/* Entrées v3, d'après les deux pictos fournis : le même buste bleu pour les deux (tête, épaules, col en V); propriétaire = plaque blanche portée devant le torse, clé à tête carrée découpée en marine; locataire = enseigne blanche portée au même endroit que la plaque, maison découpée.
   Les pièces sont séparées par de vrais jours transparents (masques), lisibles sur le dégradé du bandeau. Survol : la clé tourne; la maison grandit légèrement. */
const BUSTE = 'M-22 0V-4.6C-22-13.6-12.9-21.3 0-21.3S22-13.6 22-4.6V0Z',
  COLV = 'M-5.6-23L0-14.6L5.6-23';
const DefsB = ({
  m,
  children
}) => <defs><linearGradient id="hk2-bu" gradientUnits="userSpaceOnUse" x1="0" y1="-43.3" x2="0" y2="0"><stop offset="0" stopColor="#8DB3E2" /><stop offset="1" stopColor="#4581CB" /></linearGradient>
  <linearGradient id="hk2-bl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#C8DAF0" /></linearGradient>
  <mask id={m} maskUnits="userSpaceOnUse" x="-40" y="-60" width="80" height="90"><rect x="-40" y="-60" width="80" height="90" fill="#fff" /><path d={COLV} fill="none" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />{children}</mask></defs>;
const Buste = ({
  x,
  y,
  m
}) => <g transform={'translate(' + x + ' ' + y + ')'} fill="url(#hk2-bu)"><path d={BUSTE} mask={'url(#' + m + ')'} /><ellipse cy="-33.2" rx="8.6" ry="10.1" /></g>;
const IcoProp = () => <KSvgP t={76.725}><DefsB m="hk2-mp"><rect x="-11.5" y="-9.5" width="23" height="23" rx="2.6" stroke="#000" strokeWidth="3.6" /></DefsB><Buste x={32} y={47.2} m="hk2-mp" />
  <rect x="20.5" y="37.7" width="23" height="23" rx="2.6" fill="url(#hk2-bl)" />
  <g className="h7-k-tour" style={{
    transformOrigin: '28.9px 51.9px',
    transformBox: 'view-box'
  }}><g transform="translate(28.9 51.9) rotate(-45)" fill={BGK}><path d="M3.4-1.15H13.2V1.15H12V3.5H10.2V1.15H9.5V2.95H7.8V1.15H3.4Z" /><rect x="3.2" y="-1.6" width="2.4" height="3.2" rx=".35" /><rect x="-3.8" y="-3.8" width="7.6" height="7.6" rx="1.4" /></g></g>
  <circle cx="28.9" cy="51.9" r="1.6" fill="#DDE8F6" /></KSvgP>;
const IcoLoc = () => <KSvgP t={76.725}><DefsB m="hk2-ml"><rect x="-11.5" y="-9.5" width="23" height="23" rx="2.6" stroke="#000" strokeWidth="3.6" /></DefsB><Buste x={32} y={47.2} m="hk2-ml" />
  <rect x="20.5" y="37.7" width="23" height="23" rx="2.6" fill="url(#hk2-bl)" />
  <g className="h7-maison" style={{
    transformOrigin: '32px 55.68px',
    transformBox: 'view-box'
  }}><g transform="translate(32 49.2) scale(1.2) translate(-32 -49.2)"><path d="M26.5 54.6V48.4L32 43.8L37.5 48.4V54.6Z" fill={BGK} /><rect x="30.65" y="50.5" width="2.7" height="4.1" rx=".5" fill="#D8E5F4" /></g></g></KSvgP>;
/* Nos propriétés : même buste et même plaque carrée; maison au trait (toit, cheminée) et loupe qui sort par le bas, d'après le picto fourni. Survol : la loupe s'avance. */
const IcoRech = () => <KSvgP t={76.725}><DefsB m="hk2-mr"><rect x="-11.5" y="-9.5" width="23" height="23" rx="2.6" stroke="#000" strokeWidth="3.6" /></DefsB><Buste x={32} y={47.2} m="hk2-mr" />
  <rect x="20.5" y="37.7" width="23" height="23" rx="2.6" fill="url(#hk2-bl)" />
  <g fill="none" stroke={BGK} strokeWidth="1.45" strokeLinecap="butt" strokeLinejoin="miter"><path d="M24.4 48.3L32 41.9L39.6 48.3" /><path d="M36.1 44.5V42.4H37.7V45.9" /><path d="M26.2 46.9V57.1H32.6M36.3 57.1H37.8V46.9" /></g>
  <g className="h7-loupe" style={{
    transformBox: 'view-box',
    transformOrigin: '31.6px 51.4px'
  }} stroke={BGK} fill="none" strokeLinecap="round"><circle cx="31.6" cy="51.4" r="3.1" strokeWidth="1.45" /><path d="M33.9 53.7L36.4 56.9" strokeWidth="2.1" /></g></KSvgP>;
/* Cléo : même buste et même plaque carrée; picto fourni (tête et circuit) en marine. Au survol, le circuit s'allume en bleu. */
const IcoCleo = () => {
  const hh = 16.4,
    hw = hh * .7732,
    x = 32 - hw / 2;
  return <KSvgP t={76.725}><DefsB m="hk2-mc"><rect x="-11.5" y="-9.5" width="23" height="23" rx="2.6" stroke="#000" strokeWidth="3.6" /></DefsB><Buste x={32} y={47.2} m="hk2-mc" />
  <rect x="20.5" y="37.7" width="23" height="23" rx="2.6" fill="url(#hk2-bl)" />
  <image href={IMG + 'cleo-tete.png'} x={x} y="40.8" width={hw} height={hh} /><image className="h7-circ" href={IMG + 'cleo-tete-circuit.png'} x={x} y="40.8" width={hw} height={hh} /></KSvgP>;
};
/* Flèche A « Signature » (retenue) : au repos, les trois chevrons du logo (59,65 × 153, pas de 71,6; bleu-gris, bleu, bleu clair).
   Au survol, fondu enchaîné vers un flux de trois chevrons qui glissent vers la droite sur 40 px (2,5 × l'écart de 16 px entre le mot et le premier chevron) : chacun apparaît en fondu à la place du premier chevron, s'éclaircit et s'efface en fin de course. */
const LGK = i => 'M' + i * 71.6 + ' 0 L' + (59.65 + i * 71.6) + ' 76.49 L' + i * 71.6 + ' 152.98';
const ChvLogo = ({
  h = 32,
  cadre
}) => <svg className="h7-socle-chv" viewBox="-10 -10 366 173" height={h} width={Math.round(h * 85 / 40)} aria-hidden="true" focusable="false" fill="none" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" style={{
  display: 'block',
  overflow: 'visible'
}}>
  <g className="h7-chv-fixe">{['#FFFFFF', '#B5D4F7', '#4581CB'].map((c, i) => <path key={i} d={LGK(i)} stroke={c} />)}</g>
  <g className="h7-chv-flux">{[0, 1, 2].map(k => <path key={k} className="h7-chv-c" d={LGK(0)} stroke="#6F86A0" style={{
      animationDelay: (-k / 3 * 3.6).toFixed(3) + 's'
    }} />)}</g>
  {cadre && <g className="h7-cad" strokeWidth="11.2" strokeLinecap="round" strokeLinejoin="miter">{[["M269.2 -64.3 L-64.4 -64.3 L-64.4 66", BLEU], ["M-64.4 217.3 L269.2 217.3 L269.2 87", "#FFFFFF"]].map(([d, c], k) => <React.Fragment key={k}><path className="h7-cad-t" pathLength="1" d={d} stroke={c} /><path className="h7-cad-f" pathLength="1" d={d} stroke={c} /></React.Fragment>)}</g>}</svg>;
/* Socle (option B « Cléo au centre », retenue) : trois entrées pleine largeur posées sur la voie. Cléo au centre, part plus large, fond bleu plus clair et filet bleu permanent. */
const ENT3 = [{
  k: 'prop',
  mot: 'Gestion d’immeubles',
  to: '/gestion-immobiliere'
}, {
  k: 'cleo',
  mot: 'Gestionnaire IA',
  to: '/cleo'
}, {
  k: 'loc',
  mot: 'Services aux locataires',
  /* Page Service aux locataires (l'ancien lien pointait vers le prototype, introuvable). */
  to: '/locataires'
}, {
  /* 4e case : Logements à louer retiré le 11 oct. 2026 (aucun logement sous gestion); même picto (maison et loupe) pour l'évaluation. */
  k: 'rech',
  mot: 'Soumission gratuite',
  to: '/offre-de-service'
}];
const SocleActuel = () => <nav aria-label="Choisissez votre profil" className="h3-monte h7-socle" style={{
  position: 'relative',
  zIndex: 2,
  borderTop: '1px solid rgba(255,255,255,.18)',
  background: 'linear-gradient(180deg,rgba(10,26,48,.835) 0%,rgba(10,26,48,1) 100%)',
  animationDelay: '240ms'
}}>
  <div className="h7-socle-g" style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(' + ENT3.length + ',minmax(0,1fr))'
  }}>
    {ENT3.map((e, i) => <a key={e.k} href={e.href || e.to} className={'h7-socle-a' + (i ? ' h7-socle-d' : '') + (e.k === 'cleo' ? ' h7-socle-v' : '')} style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: 'clamp(96px,7.6vw,116px) minmax(0,1fr)',
      minHeight: 'clamp(96px,7.6vw,116px)',
      padding: 0,
      borderLeft: i ? '1px solid rgba(255,255,255,.18)' : 0,
      textDecoration: 'none',
      color: '#fff'
    }}>
      <span aria-hidden="true" className="h7-socle-trait" style={{
        position: 'absolute',
        left: i ? 0 : '-1px',
        right: 0,
        top: '-1px',
        height: '2px',
        background: BLEU
      }} />
      <span aria-hidden="true" className="h7-socle-ic" style={{
        boxSizing: 'border-box',
        borderRight: '1px solid rgba(255,255,255,.18)',
        display: 'grid',
        placeItems: 'center'
      }}>{e.k === 'prop' ? <IcoProp /> : e.k === 'loc' ? <IcoLoc /> : e.k === 'rech' ? <IcoRech /> : <IcoCleo />}</span>
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '0 clamp(12px,1.4vw,22px)',
        minWidth: 0
      }}><span className="h7-socle-mot" style={{
          fontSize: 'clamp(13.4px,1.06vw,16.3px)',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.2,
          whiteSpace: 'nowrap'
        }}>{e.mot}</span><ChvLogo h={14.59} /></span></a>)}
  </div></nav>;

/* Revue du bandeau : A deux rangées (2 × 2), B cartes posées dans la grille du contenu, C ligne compacte (icône dans le libellé). Choix gardé dans le navigateur. */
const LIGNE = '1px solid rgba(255,255,255,.18)';
const IcS = ({
  k
}) => k === 'prop' ? <IcoProp /> : k === 'loc' ? <IcoLoc /> : k === 'rech' ? <IcoRech /> : <IcoCleo />;
const lienS = e => e.href || e.to;
const Trait = ({
  style
}) => <span aria-hidden="true" className="h7-socle-trait" style={{
  position: 'absolute',
  left: 0,
  right: 0,
  top: '-1px',
  height: '2px',
  background: BLEU,
  ...style
}} />;
const Mot = ({
  e,
  t,
  ls = '-0.02em'
}) => <span className="h7-socle-mot" style={{
  fontSize: t,
  fontWeight: 700,
  letterSpacing: ls,
  lineHeight: 1.2,
  whiteSpace: 'nowrap'
}}>{e.mot}</span>;
const GrilleA = () => <div className="h7s h7s-a2" style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(2,minmax(0,1fr))'
}}>
    {ENT3.map((e, i) => <a key={e.k} href={lienS(e)} className="h7-socle-a" style={{
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '88px minmax(0,1fr)',
    minHeight: '84px',
    textDecoration: 'none',
    color: '#fff',
    borderLeft: i % 2 ? LIGNE : 0,
    borderTop: i > 1 ? LIGNE : 0
  }}>
      <Trait style={{
      top: i > 1 ? 0 : '-1px',
      background: 'rgba(255,255,255,.6)',
      height: '1px'
    }} />
      <span aria-hidden="true" className="h7-socle-ic" style={{
      borderRight: LIGNE,
      display: 'grid',
      placeItems: 'center'
    }}><IcS k={e.k} /></span>
      <span style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      padding: '0 15px 0 clamp(20px,2.6vw,44px)',
      minWidth: 0
    }}><Mot e={e} t="clamp(18px,1.98vw,30.5px)" ls="-0.009em" /><ChvLogo h={20.47} cadre /></span></a>)}</div>;
/* Bandeau figé : A « Deux rangées » retenu, sélecteur de revue retiré (options B et C conservées dans le code). */
function SocleRevue() {
  const v = 'a',
    rev = null;
  const nav = (contenu, fond = true, op = 1) => <nav aria-label="Choisissez votre profil" className="h3-monte h7-socle" style={{
    position: 'relative',
    zIndex: 2,
    borderTop: fond ? LIGNE : 0,
    background: fond ? 'linear-gradient(180deg,rgba(10,26,48,' + (.835 * op).toFixed(3) + ') 0%,rgba(10,26,48,' + op + ') 100%)' : 'transparent',
    animationDelay: '240ms'
  }}>{rev}{contenu}</nav>;
  if (v === 'a') return nav(<GrilleA />, true, .68);
  if (v === 'b') return nav(<div style={{
    maxWidth: 'var(--web-conteneur)',
    margin: '0 auto',
    padding: '0 var(--web-gouttiere) clamp(20px,2.6vw,36px)',
    boxSizing: 'border-box'
  }}>
    <div className="h7s h7s-c4" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: '12px'
    }}>
    {ENT3.map(e => <a key={e.k} href={lienS(e)} className="h7-socle-a" style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '64px minmax(0,1fr)',
        alignItems: 'center',
        minHeight: '80px',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.2)',
        background: 'rgba(10,26,48,.74)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 24px 48px -28px rgba(2,8,18,.9)',
        textDecoration: 'none',
        color: '#fff',
        transition: 'border-color 300ms'
      }}>
      <Trait style={{
          top: 0
        }} />
      <span aria-hidden="true" className="h7-socle-ic" style={{
          display: 'grid',
          placeItems: 'center',
          paddingLeft: '8px'
        }}><IcS k={e.k} /></span>
      <span style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '0 18px 0 6px',
          minWidth: 0
        }}><Mot e={e} t="clamp(14px,1.05vw,15.5px)" /><ChvLogo h={12} /></span></a>)}</div></div>, false);
  if (v === 'c') return nav(<div className="h7s h7s-l4" style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(4,minmax(0,1fr))'
  }}>
    {ENT3.map((e, i) => <a key={e.k} href={lienS(e)} className="h7-socle-a" style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '76px',
      textDecoration: 'none',
      color: '#fff',
      borderLeft: i ? LIGNE : 0
    }}>
      <Trait />
      <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '0 16px'
      }}><span aria-hidden="true" className="h7-socle-ic" style={{
          display: 'grid',
          placeItems: 'center'
        }}><IcS k={e.k} /></span><Mot e={e} t="clamp(14px,1.05vw,16px)" /><ChvLogo h={12} /></span></a>)}</div>);
  return <div style={{
    position: 'relative'
  }}>{rev}<SocleActuel /></div>;
}
const Socle = ({
  revue
}) => revue ? <SocleRevue /> : <SocleActuel />;
/* Pied de page : bandeau A « Deux rangées », sans sélecteur. */
let H7SocleA = () => <nav aria-label="Accès rapides" className="h7-socle" style={{
  position: 'relative'
}}><GrilleA /></nav>;
/* 1 · Skyline : la couverture de connexion en grand. Les immeubles posés sur l'horizon à droite, la voie de chevrons qui file vers la ville, les deux entrées sur la voie. */
const ROT = 'rotate(-1.15deg)';
function S1Skyline() {
  const [p, setP] = React.useState(false),
    ref = React.useRef(null),
    cv = React.useRef(null),
    [g, setG] = React.useState(null),
    vxr = React.useRef(.68),
    limr = React.useRef(null),
    [hv, setHv] = React.useState(0);
  /* Bannière à la hauteur de l'écran : le socle touche le bas de la fenêtre au chargement, sans espace dessous. */
  React.useLayoutEffect(() => {
    const sec = ref.current && ref.current.parentElement;
    if (!sec) return;
    const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;
    const m = () => {
      const t0 = sc ? sc.getBoundingClientRect().top : 0,
        st = sc ? sc.scrollTop : ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.scrollY : undefined) || 0;
      const top = sec.getBoundingClientRect().top - t0 + st;
      const vis = Math.min(sc && sc.clientHeight ? sc.clientHeight : (__ssr() ? "undefined" : typeof window) !== "undefined" ? innerHeight : undefined, (__ssr() ? "undefined" : typeof window) !== "undefined" ? innerHeight : undefined);
      const a = Math.round(vis - top);
      setHv(a > 420 ? a : 0);
    };
    m();
    addEventListener('resize', m);
    return () => removeEventListener('resize', m);
  }, []);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = () => {
      const Wd = el.clientWidth,
        H = el.clientHeight;
      if (!Wd || !H) return;
      const yh = Math.round(H * .7),
        s = Math.min(.46 * H / 446, Wd * .5 / 700) * 1.2;
      /* Ville centrée entre le bord droit du texte et le bord droit de la bannière : même distance de part et d'autre. */
      const tx = el.parentElement && el.parentElement.querySelector('.h7-sky-texte'),
        tr = tx ? tx.getBoundingClientRect().right - el.getBoundingClientRect().left : Wd * .45,
        ox = tr + (Wd - tr - 641 * s) / 2;
      const so = el.parentElement && el.parentElement.querySelector('.h7-socle');
      setG({
        Wd,
        H,
        yh,
        s,
        ox,
        st: so ? so.offsetTop : H
      });
    };
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    const tx = el.parentElement && el.parentElement.querySelector('.h7-sky-texte');
    if (tx) ro.observe(tx);
    return () => ro.disconnect();
  }, []);
  if (g) {
    const fx = g.ox + 277 * g.s;
    vxr.current = (fx + .04 * g.Wd) / (1.08 * g.Wd);
    limr.current = {
      st: g.H,
      yh: g.yh,
      x0: fx + .04 * g.Wd
    };
  }
  useToile(cv, voieSol(() => vxr.current, .845, .22, () => limr.current, 1.25), p, [!!g]);
  const IM = IMG + 'couverture-immeubles.png',
    abs = {
      position: 'absolute',
      pointerEvents: 'none'
    };
  let scene = null;
  if (g) {
    const {
        Wd,
        yh,
        s,
        ox
      } = g,
      X = x => ox + x * s,
      px = v => v * s + 'px',
      fx = X(277);
    scene = <React.Fragment>
      {/* Duotone de marque : netteté renforcée (convolution 3×3) et arêtes soulignées (détection de contours ajoutée à 22 %), immeubles en gris (55 %) mêlé au bleu du bouton Soumission #3767A2 (45 %), contraste +18 %, puis dégradé marine à 35 % vers le pied des tours. */}
      <svg aria-hidden="true" width="0" height="0" style={{
        position: 'absolute'
      }}><defs><filter id="h7-duo" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%"><feConvolveMatrix in="SourceGraphic" order="3" kernelMatrix="0 -0.9 0 -0.9 4.6 -0.9 0 -0.9 0" preserveAlpha="true" edgeMode="duplicate" result="net" /><feConvolveMatrix in="SourceGraphic" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" edgeMode="duplicate" result="bords" /><feComposite in="net" in2="bords" operator="arithmetic" k1="0" k2="1" k3=".22" k4="0" /><feColorMatrix type="matrix" values=".1169 .3934 .0397 0 .0971 .1169 .3934 .0397 0 .1818 .1169 .3934 .0397 0 .2859 0 0 0 1 0" /><feComponentTransfer><feFuncR type="linear" slope="1.18" intercept="-.05" /><feFuncG type="linear" slope="1.18" intercept="-.05" /><feFuncB type="linear" slope="1.18" intercept="-.05" /></feComponentTransfer></filter></defs></svg>
      <div style={{
        ...abs,
        left: fx - 408 * s + 'px',
        top: yh - 202 * s - 275 * s + 'px',
        width: px(816),
        height: px(550),
        background: 'radial-gradient(closest-side,rgba(255,255,255,.48) 0%,rgba(255,255,255,.264) 32%,rgba(255,255,255,.096) 62%,rgba(255,255,255,0) 100%)',
        WebkitMaskImage: 'linear-gradient(180deg,rgba(0,0,0,.75) 0%,rgba(0,0,0,.75) 28%,#000 66%)',
        maskImage: 'linear-gradient(180deg,rgba(0,0,0,.75) 0%,rgba(0,0,0,.75) 28%,#000 66%)'
      }} />
      <img src={IM} alt="" className="ll-auth-fondu" style={{
        ...abs,
        left: X(-81) + 'px',
        top: yh - 529 * s + 'px',
        width: px(811),
        height: px(611),
        filter: 'url(#h7-duo)',
        transform: ROT,
        transformOrigin: px(401) + ' ' + px(529),
        WebkitMaskImage: 'linear-gradient(180deg,#000 86.58%,rgba(0,0,0,0) 86.58%)',
        maskImage: 'linear-gradient(180deg,#000 86.58%,rgba(0,0,0,0) 86.58%)'
      }} />
      <div className="ll-auth-fondu" style={{
        ...abs,
        left: X(-81) + 'px',
        top: yh - 529 * s + 'px',
        width: px(811),
        height: px(611),
        transform: ROT,
        transformOrigin: px(401) + ' ' + px(529),
        background: 'linear-gradient(180deg,rgba(12,33,71,0) 12%,rgba(12,33,71,.35) 86.58%)',
        WebkitMaskImage: 'url(' + IM + '),linear-gradient(180deg,#000 86.58%,rgba(0,0,0,0) 86.58%)',
        WebkitMaskSize: '100% 100%',
        WebkitMaskComposite: 'source-in',
        maskImage: 'url(' + IM + '),linear-gradient(180deg,#000 86.58%,rgba(0,0,0,0) 86.58%)',
        maskSize: '100% 100%',
        maskComposite: 'intersect'
      }} />
      <div style={{
        ...abs,
        left: X(-81) + 'px',
        top: yh + 'px',
        width: px(811),
        height: px(152),
        overflow: 'hidden',
        opacity: .85,
        transform: ROT,
        transformOrigin: px(401) + ' 0',
        WebkitMaskImage: 'linear-gradient(180deg,rgba(0,0,0,.62) 0%,rgba(0,0,0,.22) 46%,rgba(0,0,0,0) 88%)',
        maskImage: 'linear-gradient(180deg,rgba(0,0,0,.62) 0%,rgba(0,0,0,.22) 46%,rgba(0,0,0,0) 88%)'
      }}><img src={IM} alt="" style={{
          position: 'absolute',
          left: 0,
          top: px(-82),
          width: px(811),
          height: px(611),
          filter: 'url(#h7-duo)',
          transform: 'scaleY(-1)'
        }} /></div>
      <div style={{
        ...abs,
        left: '-2%',
        width: '104%',
        top: yh - 38 * s + 'px',
        height: px(204),
        transform: ROT,
        transformOrigin: fx + 'px ' + px(38)
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: px(28),
          height: px(46),
          background: 'linear-gradient(180deg,rgba(18,41,74,0) 0%,rgba(18,41,74,.92) 14%,rgba(18,41,74,1) 19%,rgba(18,41,74,.94) 26%,rgba(18,41,74,.5) 46%,rgba(18,41,74,.14) 72%,rgba(18,41,74,0) 100%)'
        }} />
        <div style={{
          position: 'absolute',
          left: fx - Wd * .35 + 'px',
          width: Wd * .7 + 'px',
          top: px(6),
          height: px(64),
          background: 'radial-gradient(ellipse 50% 54% at 50% 50%,rgba(205,228,255,.66) 0%,rgba(147,188,238,.2) 48%,rgba(147,188,238,0) 100%)'
        }} />
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: px(31),
          height: px(5),
          filter: 'blur(1.5px)',
          background: 'linear-gradient(90deg,rgba(4,7,13,0) 0%,#0B1728 30%,#12294A 60%,rgba(25,48,75,0) 100%)'
        }} />
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: px(38),
          height: px(34),
          filter: 'blur(' + (5 * s).toFixed(2) + 'px)',
          background: 'linear-gradient(180deg,rgba(69,125,194,.3) 0%,rgba(69,125,194,0) 100%)'
        }} /></div>
      <div style={{
        ...abs,
        left: '-4%',
        right: '-4%',
        top: yh + 'px',
        bottom: 0,
        transform: ROT,
        transformOrigin: fx + .04 * Wd + 'px 0'
      }}><canvas ref={cv} className="ll-auth-fondu" style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          mixBlendMode: 'overlay',
          filter: 'blur(.35px)'
        }}></canvas></div>
    </React.Fragment>;
  }
  return <section className="ll-sombre" style={{
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: hv ? hv + 'px' : undefined,
    background: 'linear-gradient(176deg,#0E2039 0%,#142744 34%,#1A3252 62%,#0E1F3A 100%)'
  }}>
    <div ref={ref} aria-hidden="true" style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }}>
      {/* Fond « lignes néon » derrière toute la scène, à 2 % d'opacité. */}
      <img src={IMG + 'fond-lignes-neon.jpg'} alt="" style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: .02
      }} />{scene}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: g && g.Wd < 1240 ? 'linear-gradient(90deg,rgba(10,26,48,.92) 0%,rgba(10,26,48,.8) 46%,rgba(10,26,48,.36) 72%,rgba(10,26,48,0) 92%)' : 'linear-gradient(90deg,rgba(10,26,48,.86) 0%,rgba(10,26,48,.5) 34%,rgba(10,26,48,0) 58%)'
      }} /></div>
    <div style={{
      ...H3.CT,
      position: 'relative',
      zIndex: 2,
      display: 'grid',
      flex: '1 0 auto',
      alignContent: 'center',
      width: '100%',
      boxSizing: 'border-box',
      padding: 'clamp(40px,6vh,104px) var(--web-gouttiere) clamp(40px,7vh,120px)'
    }}>
      <div className="h7-sky-texte" style={{
        display: 'grid',
        gap: '25px',
        alignContent: 'start',
        justifySelf: 'start',
        maxWidth: '600px'
      }}><H1 clair bleu={BLEU} /><Lead /><Slogan /></div></div>
    <Socle revue />
    
  </section>;
}

/* Accueil retenu : 1 · Skyline (les concepts 2 à 5 et la barre de revue « série 7 » ont été supprimés). */
function AccueilHeros7() {
  return <S1Skyline />;
}
export { H7SocleA, Socle as H7Socle, AccueilHeros7 };
