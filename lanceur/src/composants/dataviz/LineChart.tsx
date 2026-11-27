'use client';
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { useT } from '@/composants/Langue';
import { ChartFrame, Legend, type FrameState, type LegendItem } from './Frame';
import { Tooltip, TipContent, type TipState } from './Tooltip';
import { compact, nearest, niceTicks, seriesColor, textWidth, useWidth } from './util';

/* Courbe, aire et escalier (1 à 4 séries) : 2 px, repère vertical qui suit le pointeur, une seule infobulle pour toutes les séries,
   flèches du clavier pour parcourir les points, étiquette de fin de courbe, cible, bande, repères verticaux, tableau équivalent. */
export type LineSeries = { id: string; name: string; values: (number | null)[]; slot?: number; color?: string };
export type LineKind = 'line' | 'area' | 'step';
export type LineChartProps = {
  /** One short label per point (x axis). */
  labels: string[];
  /** Longer label per point for the tooltip and the table (defaults to labels). */
  titles?: string[];
  /** Numeric x positions (e.g. timestamps) for uneven spacing; default: evenly spaced by index. */
  xs?: number[];
  /** Right end of the x domain when xs is given (e.g. today) : the step line is extended to it. */
  xEnd?: number;
  series: LineSeries[];
  kind?: LineKind;
  height?: number;
  /** Value formatter (tooltip, table, end label), e.g. money. */
  format: (n: number) => string;
  /** Axis tick formatter (default: compact number). */
  tickFormat?: (n: number) => string;
  min?: number; max?: number;
  /** Start the y axis at zero (default: true for area). */
  zero?: boolean;
  target?: { value: number; label: string };
  /** Where the target's label sits: 'auto' (default: above the line, at its end or start) or 'below' (under the line, at its start). */
  targetLabel?: 'auto' | 'below';
  band?: { lo: (number | null)[]; hi: (number | null)[]; label: string };
  /** Vertical reference lines, in xs units (or point index without xs), e.g. today. */
  marks?: { x: number; label: string }[];
  /** Square markers on every point (default: step only). */
  dots?: boolean;
  endLabel?: boolean;
  /** Optional short note per point (e.g. « +40 $ » at each step), drawn just above the point; null = none. Off by default. */
  annotations?: (string | null)[];
  /** Number of y-axis ticks to aim for (default 4, or 3 under 180 px high). */
  ticks?: number;
  /** Accessible name of the chart. */
  label: string;
  summary?: string;
  legend?: boolean;
  table?: boolean; tableColumn?: string;
  state?: FrameState; emptyText?: string; title?: ReactNode; subtitle?: ReactNode; filters?: ReactNode; className?: string;
};

export function LineChart(p: LineChartProps) {
  const { t, locale } = useT(), [wrapRef, W] = useWidth<HTMLDivElement>();
  const [hidden, setHidden] = useState<string[]>([]), [active, setActive] = useState<number | null>(null), [tip, setTip] = useState<TipState>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const kind = p.kind ?? 'line', H = p.height ?? 220, n = p.labels.length, fmt = p.format, tf = p.tickFormat ?? ((v: number) => compact(v, locale));
  const vis = p.series.filter((s) => !hidden.includes(s.id));
  // une seule série sans couleur imposée : le marine (l'accent unique du bloc); plusieurs séries : les couleurs catégorielles fixes
  const colorOf = (s: LineSeries) => s.color ?? (p.series.length === 1 && s.slot == null ? 'var(--dv-s7)' : seriesColor(s.slot ?? p.series.indexOf(s)));
  const vals = [...vis.flatMap((s) => s.values.filter((v): v is number => v != null)), ...(p.band ? [...p.band.lo, ...p.band.hi].filter((v): v is number => v != null) : []), ...(p.target ? [p.target.value] : [])];
  const state: FrameState = p.state ?? (vals.length ? 'ok' : 'empty');
  const titleOf = (i: number) => p.titles?.[i] ?? p.labels[i];
  const table = p.table === false ? null : { caption: p.label, columns: [p.tableColumn ?? t('Période'), ...p.series.map((s) => s.name)], rows: p.labels.map((_, i) => [titleOf(i), ...p.series.map((s) => s.values[i] == null ? null : fmt(s.values[i] as number))]) };
  const legendItems: LegendItem[] = p.series.map((s) => ({ id: s.id, name: s.name, color: colorOf(s), shape: kind === 'area' ? 'square' : 'line', hidden: hidden.includes(s.id) }));
  const toggle = (id: string) => setHidden((h) => h.includes(id) ? h.filter((x) => x !== id) : vis.length > 1 ? [...h, id] : h);
  const summary = p.summary ?? `${p.label} : ` + p.series.map((s) => { const v = s.values.filter((x): x is number => x != null); return v.length ? `${s.name} ${fmt(v[0])} → ${fmt(v[v.length - 1])}` : s.name; }).join('; ');

  // ---- géométrie
  let body: ReactNode = null;
  let lo = 0, hi = 1;
  if (vals.length) {
    lo = Math.min(...vals); hi = Math.max(...vals);
    if (p.zero ?? kind === 'area') { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    else { const sp = hi - lo || Math.abs(hi) * 0.2 || 1; const neg = lo < 0; lo -= sp * 0.15; hi += sp * 0.15; if (!neg && lo < 0) lo = 0; }
    if (p.min != null) lo = p.min; if (p.max != null) hi = p.max;
  }
  const ticks = niceTicks(lo, hi, p.ticks ?? (H < 180 ? 3 : 4)), yMin = p.min ?? ticks[0], yMax = p.max ?? ticks[ticks.length - 1];
  const ends = vis.map((s) => { let li = -1; s.values.forEach((v, i) => { if (v != null) li = i; }); return { s, li, v: li >= 0 ? (s.values[li] as number) : null }; }).filter((e) => e.li >= 0);
  const withEnd = p.endLabel ?? vis.length <= 4;
  const left = Math.max(...ticks.map((v) => textWidth(tf(v)))) + 12, right = withEnd && ends.length ? Math.max(...ends.map((e) => textWidth(fmt(e.v as number)))) + 18 : 14, top = 18, bottom = 28;
  const iw = Math.max(10, W - left - right), ih = H - top - bottom;
  const x0 = p.xs ? p.xs[0] : 0, x1 = p.xs ? (p.xEnd ?? p.xs[n - 1]) : Math.max(1, n - 1);
  const xv = (v: number) => left + ((v - x0) / (x1 - x0 || 1)) * iw;
  const px = p.labels.map((_, i) => p.xs ? xv(p.xs[i]) : n > 1 ? xv(i) : left + iw / 2);
  const y = (v: number) => top + ((yMax - v) / (yMax - yMin || 1)) * ih, yBase = y(Math.min(yMax, Math.max(yMin, 0)));
  const showDots = p.dots ?? kind === 'step';

  const runs = (s: LineSeries) => { const out: number[][] = []; let cur: number[] = []; s.values.forEach((v, i) => { if (v == null) { if (cur.length) out.push(cur); cur = []; } else cur.push(i); }); if (cur.length) out.push(cur); return out; };
  const linePath = (s: LineSeries, idx: number[], last: boolean) => idx.map((i, k) => {
    const v = s.values[i] as number;
    if (k === 0) return `M${px[i]},${y(v)}`;
    return kind === 'step' ? `H${px[i]}V${y(v)}` : `L${px[i]},${y(v)}`;
  }).join('') + (kind === 'step' && last && p.xs && p.xEnd != null ? `H${left + iw}` : '');

  // ---- interaction
  const showAt = (i: number, cy?: number) => {
    const r = plotRef.current?.getBoundingClientRect(); if (!r) return;
    const rows = vis.filter((s) => s.values[i] != null).map((s) => ({ name: s.name, value: fmt(s.values[i] as number), color: colorOf(s), shape: 'line' as const }));
    const ys = vis.filter((s) => s.values[i] != null).map((s) => y(s.values[i] as number));
    const foot = p.target ? `${p.target.label} : ${fmt(p.target.value)}` : p.band && p.band.lo[i] != null && p.band.hi[i] != null ? `${p.band.label} : ${fmt(p.band.lo[i] as number)} – ${fmt(p.band.hi[i] as number)}` : undefined;
    setActive(i); setTip({ x: r.left + px[i], y: cy ?? r.top + (ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : top), content: <TipContent title={titleOf(i)} rows={rows} foot={foot} /> });
  };
  const clear = () => { setActive(null); setTip(null); };
  const onMove = (e: PointerEvent<HTMLDivElement>) => { const r = plotRef.current?.getBoundingClientRect(); if (r) showAt(nearest(px, e.clientX - r.left), e.clientY); };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const a = active ?? (e.key === 'ArrowLeft' ? n : -1); let i = a;
    if (e.key === 'ArrowRight') i = Math.min(n - 1, a + 1); else if (e.key === 'ArrowLeft') i = Math.max(0, a - 1);
    else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = n - 1; else if (e.key === 'Escape') { clear(); return; } else return;
    e.preventDefault(); showAt(i);
  };
  const live = active != null ? `${titleOf(active)} : ` + vis.filter((s) => s.values[active] != null).map((s) => `${s.name} ${fmt(s.values[active] as number)}`).join(', ') : '';

  if (state === 'ok' || state === 'loading') {
    // étiquettes de l'axe x : on garde celles qui tiennent côte à côte, première et dernière comprises
    const wmax = Math.max(...p.labels.map((l) => textWidth(l))) + 14, shown: number[] = [0];
    for (let i = 1; i < n; i++) if (px[i] - px[shown[shown.length - 1]] >= wmax) shown.push(i);
    if (n > 1 && shown[shown.length - 1] !== n - 1) { if (px[n - 1] - px[shown[shown.length - 1]] >= wmax) shown.push(n - 1); else if (shown.length > 1) shown[shown.length - 1] = n - 1; }
    const endLabels: { x: number; y: number; text: string }[] = [];
    if (withEnd) [...ends].sort((a, b) => y(a.v as number) - y(b.v as number)).forEach((e) => { const yy = y(e.v as number); if (!endLabels.length || yy - endLabels[endLabels.length - 1].y >= 14) endLabels.push({ x: (kind === 'step' && p.xs && p.xEnd != null ? left + iw : px[e.li]) + 10, y: yy, text: fmt(e.v as number) }); });
    body = <div ref={plotRef} className="dv-plot" style={{ height: H }} tabIndex={0} role="group" aria-label={`${p.label}. ${t('Utilisez les flèches gauche et droite pour parcourir les valeurs.')}`}
      onPointerMove={onMove} onPointerLeave={() => { if (document.activeElement !== plotRef.current) clear(); }} onKeyDown={onKey} onFocus={(e) => { if (active == null && e.target === e.currentTarget && !e.currentTarget.matches(':hover')) showAt(n - 1); }} onBlur={clear}>
      <svg className="dv-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        {ticks.map((v) => v < yMin || v > yMax ? null : <g key={v}><line x1={left} x2={left + iw} y1={y(v)} y2={y(v)} className={v === yMin ? 'dv-axis' : 'dv-grid'} /><text x={left - 8} y={y(v) + 4} textAnchor="end" className="dv-tick">{tf(v)}</text></g>)}
        <g className="dv-in">
          {p.band ? <><path className="dv-band" d={(() => { const ix = p.labels.map((_, i) => i).filter((i) => p.band!.lo[i] != null && p.band!.hi[i] != null); return ix.length ? ix.map((i, k) => `${k ? 'L' : 'M'}${px[i]},${y(p.band!.hi[i] as number)}`).join('') + [...ix].reverse().map((i) => `L${px[i]},${y(p.band!.lo[i] as number)}`).join('') + 'Z' : ''; })()} />
            <text x={left + 6} y={top + 12} className="dv-note">{p.band.label}</text></> : null}
          {kind === 'area' ? vis.map((s) => runs(s).map((r, k) => <path key={s.id + k} className="dv-area" style={{ fill: colorOf(s) }} d={`${linePath(s, r, false)}L${px[r[r.length - 1]]},${yBase}L${px[r[0]]},${yBase}Z`} />)) : null}
          {vis.map((s) => runs(s).map((r, k, all) => <path key={s.id + k} className="dv-line" style={{ stroke: colorOf(s) }} d={linePath(s, r, k === all.length - 1)} />))}
          {p.target && p.target.value >= yMin && p.target.value <= yMax ? (() => {
            // étiquette de la cible (avec sa valeur) en bout de ligne, ou au début si elle croiserait l'étiquette d'un repère vertical
            const txt = `${p.target.label} · ${fmt(p.target.value)}`, dessous = p.targetLabel === 'below', ty = y(p.target.value) + (dessous ? 14 : -5), tw = textWidth(txt, 11.5);
            const heurte = (p.marks ?? []).some((m) => { const xx = p.xs ? xv(m.x) : n > 1 ? xv(m.x) : left + iw / 2, end = xx > left + iw - 60, mw = textWidth(m.label, 11.5), a = end ? xx - 5 - mw : xx + 5;
              return Math.abs(ty - (top + 11)) < 15 && a < left + iw + 2 && a + mw > left + iw - tw - 2; });
            return <g><line className="dv-ref" x1={left} x2={left + iw} y1={y(p.target.value)} y2={y(p.target.value)} /><text x={heurte || dessous ? left + 4 : left + iw} y={ty} textAnchor={heurte || dessous ? 'start' : 'end'} className="dv-note">{txt}</text></g>; })() : null}
          {(p.marks ?? []).map((m, k) => { const xx = p.xs ? xv(m.x) : n > 1 ? xv(m.x) : left + iw / 2, end = xx > left + iw - 60; return <g key={k}><line className="dv-ref dv-mark" x1={xx} x2={xx} y1={top} y2={top + ih} /><text x={xx + (end ? -5 : 5)} y={top + 11} textAnchor={end ? 'end' : 'start'} className="dv-note">{m.label}</text></g>; })}
          {showDots ? vis.map((s) => s.values.map((v, i) => v == null ? null : <rect key={s.id + i} className="dv-dot" x={px[i] - 4} y={y(v) - 4} width="8" height="8" rx="1" style={{ fill: colorOf(s) }} />)) : ends.filter((e) => vis.includes(e.s)).map((e) => <rect key={e.s.id} className="dv-dot" x={(kind === 'step' && p.xs && p.xEnd != null ? left + iw : px[e.li]) - 4} y={y(e.v as number) - 4} width="8" height="8" rx="1" style={{ fill: colorOf(e.s) }} />)}
        </g>
        {p.annotations ? vis.slice(0, 1).map((s) => p.annotations!.map((a, i) => a == null || s.values[i] == null ? null : <text key={'an' + i} x={Math.min(px[i] + 8, left + iw - textWidth(a, 11.5))} y={y(s.values[i] as number) - 9} className="dv-note dv-annot">{a}</text>)) : null}
        {endLabels.map((l, i) => <text key={i} x={l.x} y={l.y + 4} className="dv-endv">{l.text}</text>)}
        {shown.map((i) => <text key={i} x={px[i]} y={H - 8} textAnchor={px[i] < left + 18 ? 'start' : px[i] > W - 18 ? 'end' : 'middle'} className="dv-tick">{p.labels[i]}</text>)}
        {active != null ? <g pointerEvents="none"><line className="dv-cross" x1={px[active]} x2={px[active]} y1={top} y2={top + ih} />
          {vis.map((s) => s.values[active] == null ? null : <g key={s.id}><rect x={px[active] - 6} y={y(s.values[active] as number) - 6} width="12" height="12" rx="1.5" className="dv-ring" /><rect x={px[active] - 4} y={y(s.values[active] as number) - 4} width="8" height="8" rx="1" style={{ fill: colorOf(s) }} /></g>)}</g> : null}
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

export const AreaChart = (p: Omit<LineChartProps, 'kind'>) => <LineChart {...p} kind="area" />;
export const StepChart = (p: Omit<LineChartProps, 'kind'>) => <LineChart {...p} kind="step" />;
