'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';

/* Outils du kit dataviz : couleurs par rôle (jamais de seriesColor au-delà de 8), échelles, chemins SVG, mesure du conteneur. */

/** Couleur d'une série : la seriesColor catégorielle n° i (0 à 7), fixe; au-delà, le gris « Autres ». La couleur suit l'entité, jamais le rang affiché. */
export const seriesColor = (i: number) => (i >= 0 && i < 8 ? `var(--dv-c${i + 1})` : 'var(--dv-ctx)');
/** Palier n° i (1 à 7) de la rampe séquentielle (bleu, du plus clair au plus foncé en thème clair). */
export const rampStep = (i: number) => `var(--dv-s${Math.min(7, Math.max(1, i))})`;

/** Graduations « rondes » de l'axe vertical, de min à max compris. */
export function niceTicks(min: number, max: number, n = 4): number[] {
  if (!(max > min)) max = min + 1;
  const brut = (max - min) / n, mag = 10 ** Math.floor(Math.log10(brut)), r = brut / mag;
  const pas = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag;
  const bas = Math.floor(min / pas + 1e-9) * pas, haut = Math.ceil(max / pas - 1e-9) * pas, out: number[] = [];
  for (let v = bas; v <= haut + pas / 2; v += pas) out.push(+v.toFixed(10));
  return out;
}

/** Nombre court pour un axe : en entier sous 10 000, compact (10 k) au-delà, une seule écriture par axe. */
export const compact = (n: number, locale = 'fr-CA') => Math.abs(n) >= 10000
  ? new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n).replace(/ /g, ' ')
  : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n).replace(/[  ]/g, ' ');

/** Largeur en pixels d'un conteneur, suivie à chaque redimensionnement (0 avant la première mesure : le rendu serveur ne dessine rien). */
export function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null), [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.round(el.getBoundingClientRect().width)));
    ro.observe(el); setW(Math.round(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Largeur approximative d'un texte de 12 px (pour réserver les marges des axes et décider si une étiquette tient). */
export const textWidth = (s: string, px = 12) => s.length * px * 0.58 + 2;

/** Rectangle de barre : coins arrondis (r, 2 px par défaut depuis la règle « arrondis réduits de moitié ») seulement du côté « donnée », carré sur la ligne de base. Vertical : de y0 (base) à y1 (bout). */
export function barPath(x: number, y0: number, y1: number, w: number, r = 2): string {
  const haut = y1 < y0, h = Math.abs(y1 - y0); if (h <= 0 || w <= 0) return '';
  const rr = Math.min(r, h, w / 2), yb = y0, yt = y1;
  return haut
    ? `M${x},${yb}V${yt + rr}Q${x},${yt} ${x + rr},${yt}H${x + w - rr}Q${x + w},${yt} ${x + w},${yt + rr}V${yb}Z`
    : `M${x},${yb}V${yt - rr}Q${x},${yt} ${x + rr},${yt}H${x + w - rr}Q${x + w},${yt} ${x + w},${yt - rr}V${yb}Z`;
}

/** Segment d'empilement : arrondi (r) seulement si c'est le dernier (extrémité côté donnée), sinon carré. */
export function segPath(x: number, ya: number, yb: number, w: number, r: number, arrondi: boolean): string {
  const haut = yb < ya, h = Math.abs(yb - ya); if (h <= 0) return '';
  if (!arrondi) return `M${x},${ya}V${yb}H${x + w}V${ya}Z`;
  return barPath(x, ya, yb, w, Math.min(r, h)) || (haut ? '' : '');
}

/** Index le plus proche d'une abscisse (positions croissantes). */
export function nearest(xs: number[], x: number): number {
  let best = 0, d = Infinity;
  for (let i = 0; i < xs.length; i++) { const e = Math.abs(xs[i] - x); if (e < d) { d = e; best = i; } }
  return best;
}
