/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pictos-immeubles.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
const PAL = {
  c: {
    t: 'var(--marine-900)',
    f: '#fff',
    r: 'var(--marine-900)',
    on: 'var(--bleu-500)',
    off: 'var(--bleu-100)',
    p: 'var(--marine-700)',
    s: 'var(--bleu-200)',
    g: 'var(--bleu-025)',
    v: 'var(--bleu-050,#EEF3FA)'
  },
  s: {
    t: '#E6EEF8',
    f: 'rgba(255,255,255,.08)',
    r: 'var(--bleu-700)',
    on: 'var(--bleu-300)',
    off: 'rgba(200,218,240,.16)',
    p: 'var(--bleu-700)',
    s: 'rgba(200,218,240,.4)',
    g: 'rgba(200,218,240,.12)',
    v: 'rgba(200,218,240,.08)'
  }
};
function PictoImmeuble({
  k = 0,
  sombre,
  h = 110,
  anime,
  centre
}) {
  const ref = React.useRef(null),
    [vb, setVb] = React.useState(null);
  React.useLayoutEffect(() => {
    if (!centre || !ref.current) return;
    try {
      const b = ref.current.getBBox(),
        p = 6;
      setVb([b.x - p, b.y - p, b.width + p * 2, b.height + p * 2].join(' '));
    } catch (e) {}
  }, [k, centre]);
  const c = PAL[sombre ? 's' : 'c'],
    det = h >= 100,
    sw = h >= 160 ? 1.6 : det ? 1.35 : 1.1;
  const S = {
    stroke: c.t,
    strokeWidth: sw,
    vectorEffect: 'non-scaling-stroke',
    strokeLinejoin: 'round',
    strokeLinecap: 'round'
  };
  const el = [];
  let id = 0,
    n = 0;
  const K = () => 'e' + id++,
    add = x => el.push(x);
  const lum = () => anime ? {
    className: 'gp-on',
    style: {
      animationDelay: 140 + n++ * 60 + 'ms'
    }
  } : {};
  const fac = (x, y, w, ht, fill = c.f, f = 1) => add(<rect key={K()} x={x} y={y} width={w} height={ht} fill={fill} {...S} strokeWidth={sw * f} />);
  const poly = (pts, fill = c.r) => add(<polygon key={K()} points={pts} fill={fill} {...S} />);
  const plein = (x, y, w, ht, fill = c.t) => add(<rect key={K()} x={x} y={y} width={w} height={ht} fill={fill} />);
  const ligne = (x1, y1, x2, y2, f = 1, col = c.t) => add(<line key={K()} x1={x1} y1={y1} x2={x2} y2={y2} {...S} stroke={col} strokeWidth={sw * f} />);
  const uid = (React.useId ? React.useId() : 'gp').replace(/:/g, '');
  let sol = null;
  /* Sol : ombre elliptique diffuse sous l'immeuble et fil de sol qui s'estompe aux extrémités (jamais une ligne pleine largeur). */
  const ombre = (x, w) => {
    const cx = x + w / 2,
      ex = w * .72;
    sol = [cx, x, w];
    add(<defs key={K()}><radialGradient id={uid + 'o'} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={c.t} stopOpacity={sombre ? .42 : .16} /><stop offset="1" stopColor={c.t} stopOpacity="0" /></radialGradient>
      <linearGradient id={uid + 'l'} x1="0" x2="1"><stop offset="0" stopColor={c.t} stopOpacity="0" /><stop offset=".18" stopColor={c.t} stopOpacity="1" /><stop offset=".82" stopColor={c.t} stopOpacity="1" /><stop offset="1" stopColor={c.t} stopOpacity="0" /></linearGradient></defs>);
    add(<ellipse key={K()} cx={cx} cy={135.4} rx={ex} ry={4.2} fill={'url(#' + uid + 'o)'} />);
  };
  const socle = (x, w) => fac(x, 128, w, 6, c.g, .8);
  const porte = (x, y, w, ht, double) => {
    fac(x, y, w, ht, c.p);
    if (!det) return;
    const m = sombre ? c.t : '#fff';
    if (double) ligne(x + w / 2, y + 2, x + w / 2, y + ht, .7, m);else plein(x + w - 3.2, y + ht * .52, 1.6, 1.6, m);
    plein(x - 1.5, y - 2.6, w + 3, 2.2);
  };
  const fen = (x, y, w, ht, on = true, croix = 0) => {
    plein(x, y, w, ht, c.off);
    if (on) add(<rect key={K()} x={x} y={y} width={w} height={ht} fill={c.on} {...lum()} />);
    if (det && croix) {
      ligne(x + w / 2, y, x + w / 2, y + ht, .6);
      if (croix === 2) ligne(x, y + ht * .42, x + w, y + ht * .42, .6);
    }
    add(<rect key={K()} x={x} y={y} width={w} height={ht} fill="none" {...S} />);
    if (det && croix !== -1) {
      plein(x - 1.6, y - 2.8, w + 3.2, 2.2);
      plein(x - 1, y + ht, w + 2, 1.5);
    }
  };
  /* Balcon : dalle, main courante, lisse basse, balustres; rail = portion garde-corps (laisse place à l'escalier). */
  const balcon = (x1, x2, y, rail = [x1, x2]) => {
    const [a, b] = rail,
      t = y - 9;
    if (det) {
      for (let x = a + 3.2; x < b - 1.5; x += 3.2) ligne(x, t + 1, x, y - 1.4, .5);
      ligne(a, y - 1.6, b, y - 1.6, .6);
    }
    plein(a - .8, t, 1.6, 9);
    plein(b - .8, t, 1.6, 9);
    plein(a - .8, t - .6, b - a + 1.6, 1.8);
    plein(x1 - 2, y, x2 - x1 + 4, 2.8);
  };
  const corniche = (x1, x2, y) => {
    plein(x1 - 2.5, y - 2.4, x2 - x1 + 5, 2.6, c.r);
    fac(x1, y, x2 - x1, 6, c.r);
    if (det) {
      for (let x = x1 + 6; x < x2 - 7; x += 5.2) plein(x, y + 6, 2.4, 2.4, c.r);
      plein(x1 + 1, y + 6, 3.4, 7, c.r);
      plein(x2 - 4.4, y + 6, 3.4, 7, c.r);
    }
  };
  switch (k) {
    case 0:
      /* Maison unifamiliale : toit à deux versants, deux lucarnes, cheminée, galerie couverte et marches */
      ombre(44, 112);
      fac(122, 36, 9, 20);
      poly('44,90 66,52 134,52 156,90');
      [70, 111].forEach(x => {
        fac(x, 62, 19, 17);
        poly(x - 2.5 + ',63.5 ' + (x + 9.5) + ',53.5 ' + (x + 21.5) + ',63.5');
        fen(x + 5, 66.5, 9, 9.5, true, -1);
      });
      fac(54, 88, 92, 46);
      fen(64, 103, 19, 13, true, 2);
      fen(117, 103, 19, 13, true, 2);
      porte(93, 101, 14, 23);
      poly('46,101 52,95 148,95 154,101');
      [55, 87.5, 112.5, 145].forEach(x => plein(x - 1, 101, 2, 23));
      fac(50, 126.6, 100, 7.4, c.g, .8);
      plein(50, 124, 100, 2.6);
      if (det) [[56, 86.5], [113.5, 144]].forEach(([a, b]) => {
        for (let x = a + 3.2; x < b - 1; x += 3.2) ligne(x, 118, x, 123.6, .5);
      });
      plein(55, 117, 32.5, 1.6);
      plein(112.5, 117, 32.5, 1.6);
      fac(89, 126.6, 22, 2.6);
      fac(87, 129.2, 26, 2.6);
      fac(85, 131.8, 30, 2.2);
      break;
    case 1:
      /* Jumelé : deux logements en miroir sous un même pignon, mur mitoyen; voisins en rangée esquissés */
      ombre(38, 124);
      fac(60, 50, 8, 14);
      fac(132, 50, 8, 14);
      fac(42, 74, 116, 60);
      poly('34,76 100,44 166,76');
      plein(96, 42.6, 8, 2.4);
      plein(99.2, 74, 1.6, 60);
      fen(52, 83, 20, 15, true, 2);
      fen(128, 83, 20, 15, true, 2);
      fen(78, 83, 14, 15, true, 1);
      fen(108, 83, 14, 15, true, 1);
      plein(42, 102, 116, 1.4, c.s);
      fen(50, 109, 24, 15, true, 2);
      fen(126, 109, 24, 15, true, 2);
      porte(81, 108, 12, 26);
      porte(107, 108, 12, 26);
      plein(78, 104.5, 18, 2.4);
      plein(104, 104.5, 18, 2.4);
      break;
    case 2:
      /* Duplex : corniche, socle, deux entrées au rez-de-chaussée, balcon continu et porte-fenêtre centrée à l'étage */
      ombre(56, 88);
      fac(58, 58, 84, 76);
      corniche(56, 144, 50);
      socle(58, 84);
      porte(65, 104, 13, 24);
      fen(87, 106, 26, 15, true, 2);
      porte(122, 104, 13, 24);
      fen(65, 68, 20, 15, true, 2);
      porte(94, 64, 12, 30);
      fen(115, 68, 20, 15, true, 2);
      balcon(58, 142, 94);
      break;
    case 3:
      /* Triplex : trois étages, deux entrées au sol, porte-fenêtre centrée entre deux fenêtres par étage, balcons continus */
      ombre(60, 80);
      fac(62, 42, 76, 92);
      corniche(60, 140, 34);
      socle(62, 76);
      porte(68, 104, 12, 24);
      fen(86, 107, 28, 15, true, 2);
      porte(120, 104, 12, 24);
      [[78, 74], [48, 44]].forEach(([y, d]) => {
        fen(68, y, 18, 15, true, 2);
        porte(94, d, 12, 27);
        fen(114, y, 18, 15, true, 2);
      });
      balcon(62, 138, 101);
      balcon(62, 138, 71);
      break;
    case 4:
      /* Quadruplex : deux logements par étage, entrée centrale abritée, balcon continu */
      ombre(34, 132);
      fac(36, 60, 128, 74);
      corniche(34, 166, 52);
      socle(36, 128);
      fen(46, 105, 34, 16, true, 2);
      fen(120, 105, 34, 16, true, 2);
      porte(90, 104, 20, 24, true);
      plein(86, 100, 28, 3);
      fac(88, 128, 24, 3);
      fac(86, 131, 28, 3);
      fen(46, 68, 26, 16, true, 2);
      porte(83, 66, 11, 30);
      porte(106, 66, 11, 30);
      fen(128, 68, 26, 16, true, 2);
      balcon(36, 164, 96);
      break;
    case 5:
      /* Quintuplex : un logement au rez-de-chaussée, deux par étage, balcons continus */
      ombre(38, 104);
      fac(40, 40, 120, 94);
      corniche(38, 162, 32);
      socle(40, 120);
      fen(50, 107, 28, 15, true, 2);
      porte(93.5, 104, 13, 24);
      fen(118, 107, 28, 15, true, 2);
      [[76, 77], [46, 47]].forEach(([y, d]) => {
        fen(48, y, 24, 15, true, 2);
        porte(80, d, 11, 24);
        porte(109, d, 11, 24);
        fen(128, y, 24, 15, true, 2);
      });
      balcon(40, 160, 101);
      balcon(40, 160, 71);
      break;
    case 6:
      {
        /* Multilogement : trois étages, cage d'escalier vitrée, entrée sous marquise */
        ombre(26, 148);
        fac(28, 42, 144, 92);
        plein(25, 36.5, 150, 5.5, c.r);
        plein(23, 34.5, 154, 2.4, c.r);
        socle(28, 144);
        const L = [[1, 1, 1, 0], [1, 0, 1, 1], [0, 1, 1, 1]];
        [50, 79, 107].forEach((y, r) => [36, 60, 120, 144].forEach((x, j) => fen(x, y, 20, 15, !!L[r][j], 1)));
        fen(92, 49, 16, 44, false, 2);
        plein(82, 98.5, 36, 3.5);
        porte(89, 104, 22, 24, true);
        fac(86, 128, 28, 3);
        fac(84, 131, 32, 3);
        break;
      }
    case 7:
      {
        /* Immeuble à logements : cinq étages, balcons vitrés, hall vitré sous marquise, édicule au toit */
        ombre(44, 112);
        fac(84, 9, 32, 9);
        fac(46, 18, 108, 116);
        plein(43, 14, 114, 4, c.r);
        const OFF = ['0-2', '2-0', '3-3', '4-1'];
        [0, 1, 2, 3, 4].forEach(r => [54, 78, 102, 126].forEach((x, j) => {
          const y = 26 + 15 * r;
          fen(x, y, 20, 10, !OFF.includes(r + '-' + j), 1);
        }));
        plein(50, 101, 100, 3);
        fac(54, 104, 92, 30, c.g);
        [77, 123].forEach(x => ligne(x, 104, x, 134, .7));
        porte(91, 111, 18, 23, true);
        break;
      }
    case 8:
      {
        /* Condo en location : tour à mur-rideau, balcons vitrés, une seule unité allumée et repérée */
        ombre(64, 72);
        fac(80, 8, 40, 8);
        fac(70, 16, 60, 118);
        fac(70, 16, 14, 118, c.g, .8);
        fen(73.5, 22, 7, 90, false, -1);
        for (let i = 0; i < 8; i++) {
          const y = 20 + 12 * i,
            lit = i === 3;
          fen(88, y + 1.5, 18, 8.5, false, 1);
          if (lit && det) add(<rect key={K()} x={104.5} y={y - 2} width={25} height={15.5} rx={2} fill={c.on} opacity={sombre ? .35 : .25} />);
          fen(108, y + 1.5, 18, 8.5, lit, 1);
          plein(85, y + 11, 52, 1.8);
        }
        fac(76, 118, 48, 16, c.g);
        plein(72, 115, 56, 2.6);
        porte(93, 121, 14, 13, true);
        if (det) {
          ligne(137, 62, 148, 62, .8, c.on);
          add(<g key={K()} className={anime ? 'gp-pin' : undefined}><path d="M155 62 C153 58.4 148 54 148 48.4 A7 7 0 1 1 162 48.4 C162 54 157 58.4 155 62 Z" fill={c.on} {...S} /><circle cx={155} cy={48.4} r={2.6} fill="#fff" /></g>);
        }
        break;
      }
  }
  if (sol) {
    const [cx, x, w] = sol,
      ex = w * .72;
    add(<rect key={K()} x={cx - ex} y={134 - sw * .5} width={ex * 2} height={sw} rx={sw / 2} fill={'url(#' + uid + 'l)'} opacity={sombre ? .9 : 1} />);
  }
  return <svg viewBox={vb || '0 0 200 140'} width={centre ? h : '100%'} height={h} aria-hidden="true" focusable="false" style={{
    display: 'block',
    overflow: 'visible'
  }}><g ref={ref}>{el}</g></svg>;
}
export { PictoImmeuble };
