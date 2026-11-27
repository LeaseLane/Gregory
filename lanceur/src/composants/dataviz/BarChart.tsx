'use client';
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { useT } from '@/composants/Langue';
import { ChartFrame, Legend, type FrameState, type LegendItem } from './Frame';
import { Tooltip, TipContent, type TipState } from './Tooltip';
import { barPath, compact, nearest, niceTicks, rampStep, seriesColor, textWidth, useWidth } from './util';

/* Barres : verticales (SVG, groupées ou empilées, écart de 2 px entre les éléments) ou horizontales classées (lignes HTML, une valeur écrite au bout de chaque barre).
   Barre de 24 px au plus, coin arrondi de 4 px côté donnée seulement, base carrée. Jamais un nombre sur chaque barre : étiquette de la dernière période ou du maximum. */
export type BarSeries = { id: string; name: string; values: number[]; slot?: number; color?: string };
export type BarChartProps = {
  labels: string[]; titles?: string[]; series: BarSeries[];
  orientation?: 'vertical' | 'horizontal'; mode?: 'grouped' | 'stacked';
  height?: number;
  /** Value formatter (tooltip, table, labels). */
  format: (n: number) => string; tickFormat?: (n: number) => string;
  /** Index of the band to emphasise (single series): the others take a lighter step of the same hue. */
  emphasis?: number | number[];
  /** Which values are printed on the bars (vertical). Default: the emphasised band(s) when emphasis is set, otherwise the last period. */
  valueLabels?: 'last' | 'max' | 'all' | 'none' | 'emphasis';
  /** Negative values use the second arm of the diverging pair (vertical, grouped). */
  diverging?: boolean;
  target?: { value: number; label: string };
  /** Horizontal: text printed after each bar (default: formatted total). */
  valueText?: string[];
  /** Horizontal: sort rows by total, largest first. */
  rank?: boolean; labelWidth?: number | string;
  max?: number;
  label: string; summary?: string; legend?: boolean; table?: boolean; tableColumn?: string;
  state?: FrameState; emptyText?: string; title?: ReactNode; subtitle?: ReactNode; filters?: ReactNode; className?: string;
};

const emph = (p: { emphasis?: number | number[] }, i: number) => Array.isArray(p.emphasis) ? p.emphasis.includes(i) : p.emphasis === i;

export function BarChart(p: BarChartProps) {
  return p.orientation === 'horizontal' ? <RankedBars {...p} /> : <Columns {...p} />;
}

const tableOf = (p: BarChartProps, titleOf: (i: number) => string, t: (s: string) => string) => ({ caption: p.label, columns: [p.tableColumn ?? t('Catégorie'), ...p.series.map((s) => s.name)],
  rows: p.labels.map((_, i) => [titleOf(i), ...p.series.map((s) => (s.values[i] == null ? null : p.format(s.values[i])))]) });

/* ---------- horizontales classées ---------- */
function RankedBars(p: BarChartProps) {
  const { t } = useT(), [hidden, setHidden] = useState<string[]>([]);
  const vis = p.series.filter((s) => !hidden.includes(s.id)), stacked = p.series.length > 1;
  const order = p.labels.map((_, i) => i); const tot = (i: number) => vis.reduce((a, s) => a + Math.max(0, s.values[i] ?? 0), 0);
  if (p.rank) order.sort((a, b) => tot(b) - tot(a));
  const max = Math.max(p.max ?? 0, 1e-9, ...order.map(tot)), state: FrameState = p.state ?? (p.labels.length ? 'ok' : 'empty');
  const colorOf = (s: BarSeries) => s.color ?? seriesColor(s.slot ?? p.series.indexOf(s));
  const toggle = (id: string) => setHidden((h) => h.includes(id) ? h.filter((x) => x !== id) : vis.length > 1 ? [...h, id] : h);
  const legend = stacked && p.legend !== false ? <Legend label={t('Légende')} onToggle={toggle} items={p.series.map((s): LegendItem => ({ id: s.id, name: s.name, color: colorOf(s), hidden: hidden.includes(s.id) }))} /> : undefined;
  const style = { '--dv-rank-lab': typeof p.labelWidth === 'number' ? `${p.labelWidth}px` : p.labelWidth } as CSSProperties;
  return <ChartFrame title={p.title} subtitle={p.subtitle} filters={p.filters} className={p.className} state={state} emptyText={p.emptyText} legend={legend}
    table={p.table ? tableOf(p, (i) => p.titles?.[i] ?? p.labels[i], t) : null}>
    <ul className="dv-rank" style={p.labelWidth != null ? style : undefined} aria-label={p.label}>{order.map((i) => {
      const total = tot(i), em = p.emphasis != null && !stacked;
      return <li key={i} data-em={em && emph(p, i) ? '1' : undefined}><span className="dv-rank-l" title={p.titles?.[i] ?? p.labels[i]}>{p.labels[i]}</span>
        <span className="dv-rank-t">{vis.map((s) => { const v = Math.max(0, s.values[i] ?? 0); return v > 0 ? <i key={s.id} className="dv-seg" style={{ width: `max(2px, ${(100 * v) / max}%)`, background: em ? (emph(p, i) ? (s.color ?? 'var(--dv-s7)') : 'var(--dv-ctx)') : colorOf(s) }} /> : null; })}</span>
        <b className="dv-rank-v">{p.valueText?.[i] ?? p.format(total)}</b></li>;
    })}</ul>
  </ChartFrame>;
}

/* ---------- verticales ---------- */
function Columns(p: BarChartProps) {
  const { t, locale } = useT(), [wrapRef, W] = useWidth<HTMLDivElement>(), plotRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<string[]>([]), [active, setActive] = useState<number | null>(null), [tip, setTip] = useState<TipState>(null);
  const H = p.height ?? 220, n = p.labels.length, fmt = p.format, tf = p.tickFormat ?? ((v: number) => compact(v, locale)), stacked = p.mode === 'stacked';
  const vis = p.series.filter((s) => !hidden.includes(s.id));
  const colorOf = (s: BarSeries) => s.color ?? seriesColor(s.slot ?? p.series.indexOf(s));
  const titleOf = (i: number) => p.titles?.[i] ?? p.labels[i];
  const totalOf = (i: number) => vis.reduce((a, s) => a + Math.max(0, s.values[i] ?? 0), 0);
  const all = vis.flatMap((s) => s.values.filter((v) => v != null)), state: FrameState = p.state ?? (n && all.length ? 'ok' : 'empty');
  let lo = 0, hi = 1;
  if (all.length) { if (stacked) { hi = Math.max(1e-9, ...p.labels.map((_, i) => totalOf(i))); lo = 0; } else { lo = Math.min(0, ...all); hi = Math.max(0, ...all); } if (p.target) { hi = Math.max(hi, p.target.value); lo = Math.min(lo, p.target.value); } if (p.max != null) hi = p.max; }
  const ticks = niceTicks(lo, hi, 4), yMin = ticks[0], yMax = ticks[ticks.length - 1];
  const left = Math.max(...ticks.map((v) => textWidth(tf(v)))) + 12, right = 8, top = 22, bottom = 28, iw = Math.max(10, W - left - right), ih = H - top - bottom;
  const bandW = iw / Math.max(1, n), k = stacked ? 1 : Math.max(1, vis.length), barW = Math.max(3, Math.min(24, (bandW * 0.72 - (k - 1) * 2) / k)), groupW = k * barW + (k - 1) * 2;
  const cx = (i: number) => left + bandW * i + bandW / 2, y = (v: number) => top + ((yMax - v) / (yMax - yMin || 1)) * ih, y0 = y(0);
  const fillOf = (s: BarSeries, i: number, v: number) => p.diverging && v < 0 ? 'var(--dv-dn3)' : p.emphasis != null && p.series.length === 1 ? (emph(p, i) ? (s.color ?? 'var(--dv-s7)') : 'var(--dv-ctx)') : colorOf(s);   // mise en relief : l'élément choisi en marine, le reste en gris de contexte
  const table = p.table === false ? null : tableOf(p, titleOf, t);
  const legendItems: LegendItem[] = p.series.map((s) => ({ id: s.id, name: s.name, color: colorOf(s), hidden: hidden.includes(s.id) }));
  const toggle = (id: string) => setHidden((h) => h.includes(id) ? h.filter((x) => x !== id) : vis.length > 1 ? [...h, id] : h);
  const summary = p.summary ?? `${p.label} : ` + p.labels.map((l, i) => `${l} ${vis.map((s) => fmt(s.values[i] ?? 0)).join(' / ')}`).join('; ');
  const px = p.labels.map((_, i) => cx(i));

  const showAt = (i: number, cy?: number) => {
    const r = plotRef.current?.getBoundingClientRect(); if (!r) return;
    const rows = vis.map((s) => ({ name: s.name, value: fmt(s.values[i] ?? 0), color: fillOf(s, i, s.values[i] ?? 0), shape: 'square' as const }));
    const foot = stacked && vis.length > 1 ? `${t('Total')} : ${fmt(totalOf(i))}` : p.target ? `${p.target.label} : ${fmt(p.target.value)}` : undefined;
    setActive(i); setTip({ x: r.left + px[i], y: cy ?? r.top + top + 20, content: <TipContent title={titleOf(i)} rows={rows} foot={foot} /> });
  };
  const clear = () => { setActive(null); setTip(null); };
  const onMove = (e: PointerEvent<HTMLDivElement>) => { const r = plotRef.current?.getBoundingClientRect(); if (r) showAt(nearest(px, e.clientX - r.left), e.clientY); };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const a = active ?? (e.key === 'ArrowLeft' ? n : -1); let i = a;
    if (e.key === 'ArrowRight') i = Math.min(n - 1, a + 1); else if (e.key === 'ArrowLeft') i = Math.max(0, a - 1);
    else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = n - 1; else if (e.key === 'Escape') { clear(); return; } else return;
    e.preventDefault(); showAt(i);
  };
  const live = active != null ? `${titleOf(active)} : ` + vis.map((s) => `${s.name} ${fmt(s.values[active] ?? 0)}`).join(', ') : '';

  let body: ReactNode = null;
  if (state === 'ok' || state === 'loading') {
    const wmax = Math.max(...p.labels.map((l) => textWidth(l))) + 10, every = Math.max(1, Math.ceil(wmax / bandW));
    const lab = p.valueLabels ?? (p.emphasis != null ? 'emphasis' : 'last'), maxIdx = p.labels.map((_, i) => i).sort((a, b) => totalOf(b) - totalOf(a))[0];
    const labelFor = (i: number) => lab === 'all' || (lab === 'last' && i === n - 1) || (lab === 'max' && i === maxIdx) || (lab === 'emphasis' && emph(p, i));
    body = <div ref={plotRef} className="dv-plot" style={{ height: H }} tabIndex={0} role="group" aria-label={`${p.label}. ${t('Utilisez les flèches gauche et droite pour parcourir les valeurs.')}`}
      onPointerMove={onMove} onPointerLeave={() => { if (document.activeElement !== plotRef.current) clear(); }} onKeyDown={onKey} onFocus={(e) => { if (active == null && e.target === e.currentTarget && !e.currentTarget.matches(':hover')) showAt(n - 1); }} onBlur={clear}>
      <svg className="dv-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        {ticks.map((v) => <g key={v}><line x1={left} x2={left + iw} y1={y(v)} y2={y(v)} className={v === 0 || v === yMin ? 'dv-axis' : 'dv-grid'} /><text x={left - 8} y={y(v) + 4} textAnchor="end" className="dv-tick">{tf(v)}</text></g>)}
        {active != null ? <rect className="dv-wash" x={left + bandW * active} y={top} width={bandW} height={ih} rx="2" /> : null}
        <g className="dv-in">
          {p.labels.map((_, i) => {
            let cum = 0; const first = vis.findIndex((s) => (s.values[i] ?? 0) > 0), last = vis.length - 1 - [...vis].reverse().findIndex((s) => (s.values[i] ?? 0) > 0);
            return <g key={i} className="dv-bargrp" data-h={active === i ? '1' : undefined}>
              {vis.map((s, si) => {
                const v = s.values[i] ?? 0; if (!v) return null;
                if (stacked) {
                  const a = cum, b = cum + Math.max(0, v); cum = b; const ya = y(a) - (si === first ? 0 : 1), yb = y(b) + (si === last ? 0 : 1), x = cx(i) - barW / 2;
                  return <path key={s.id} className="dv-m" d={si === last ? barPath(x, ya, yb, barW, 2) : `M${x},${ya}V${yb}H${x + barW}V${ya}Z`} style={{ fill: colorOf(s) }} />;
                }
                const x = cx(i) - groupW / 2 + vis.indexOf(s) * (barW + 2);
                return <path key={s.id} className="dv-m" d={barPath(x, y0, y(v), barW, 2)} style={{ fill: fillOf(s, i, v) }} />;
              })}
              {labelFor(i) ? (stacked ? [{ v: totalOf(i), x: cx(i), top: y(totalOf(i)) }] : vis.map((s) => ({ v: s.values[i] ?? 0, x: cx(i) - groupW / 2 + vis.indexOf(s) * (barW + 2) + barW / 2, top: y(s.values[i] ?? 0) }))).map((l, j) => {
                const txt = fmt(l.v); if (!l.v || (!stacked && vis.length > 1 && textWidth(txt) > barW + 2 + 40) || textWidth(txt) > bandW * 2.4) return null;
                return <text key={j} x={Math.min(Math.max(l.x, left + textWidth(txt) / 2), left + iw - textWidth(txt) / 2 + 6)} y={l.v < 0 ? l.top + 14 : l.top - 6} textAnchor="middle" className="dv-endv">{txt}</text>; }) : null}
            </g>;
          })}
          {p.target && p.target.value >= yMin && p.target.value <= yMax ? <g><line className="dv-ref" x1={left} x2={left + iw} y1={y(p.target.value)} y2={y(p.target.value)} /><text x={left + iw} y={y(p.target.value) - 5} textAnchor="end" className="dv-note">{p.target.label}</text></g> : null}
        </g>
        {p.labels.map((l, i) => (i % every === 0 && !p.labels.some((_, j) => j !== i && emph(p, j) && Math.abs(j - i) < every)) || (emph(p, i) && p.labels.filter((_, j) => j !== i && emph(p, j) && Math.abs(j - i) < every).length === 0) ? <text key={i} x={cx(i)} y={H - 8} textAnchor="middle" className={`dv-tick${emph(p, i) ? ' dv-tick-em' : ''}`}>{l}</text> : null)}
      </svg>
      <span className="dv-sr" aria-live="polite">{live}</span>
    </div>;
  }
  return <>
    <ChartFrame title={p.title} subtitle={p.subtitle} filters={p.filters} className={p.className} state={state} emptyText={p.emptyText} table={table}
      legend={p.series.length >= 2 && p.legend !== false ? <Legend items={legendItems} onToggle={toggle} label={t('Légende')} /> : undefined}>
      <div ref={wrapRef} className="dv-measure" style={{ minHeight: H }}>{W > 0 ? body : null}</div>
    </ChartFrame>
    <Tooltip tip={tip} />
  </>;
}
