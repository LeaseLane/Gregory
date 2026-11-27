'use client';
import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { useT } from '@/composants/Langue';
import { Legend, type LegendItem } from './Frame';
import { Tooltip, TipContent, type TipState } from './Tooltip';
import { barPath, nearest, useWidth } from './util';

/* Figures : tuile de chiffre (StatTile), micro-tendance (Sparkline), jauge à cible (ProgressBar / BulletBar), rangée de cases (CellStrip). */

/* ---------- Sparkline ---------- */
export type SparklineProps = {
  values: number[]; width?: number; height?: number; kind?: 'line' | 'bars';
  /** Labels per point for the hover readout (e.g. months). */
  labels?: string[]; format?: (n: number) => string; label?: string; className?: string;
};
export function Sparkline({ values, width, height = 32, kind = 'line', labels, format, label, className }: SparklineProps) {
  const { t, locale } = useT(), [ref, mw] = useWidth<HTMLSpanElement>(), [tip, setTip] = useState<TipState>(null), [hot, setHot] = useState<number | null>(null);
  const W = width ?? mw, n = values.length, fmt = format ?? ((v: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v).replace(/[  ]/g, ' '));
  const min = Math.min(...values), max = Math.max(...values), pad = 5;
  const lo = kind === 'bars' ? Math.min(0, min) : min, span = max - lo || 1;
  const x = (i: number) => kind === 'bars' ? (W / n) * (i + 0.5) : n > 1 ? pad + (i / (n - 1)) * (W - 2 * pad) : W / 2;
  const y = (v: number) => height - pad - ((v - lo) / span) * (height - 2 * pad), base = y(Math.max(lo, 0));
  const bw = kind === 'bars' ? Math.min(14, Math.max(3, (W / n) * 0.7)) : 0;
  const aria = label ?? (n ? t('Tendance : {de} à {a}', { de: fmt(values[0]), a: fmt(values[n - 1]) }) : '');
  const at = (i: number, ev?: { clientY: number }) => { const r = ref.current?.getBoundingClientRect(); if (!r) return; setHot(i); setTip({ x: r.left + x(i), y: ev?.clientY ?? r.top + y(values[i]), content: <TipContent title={labels?.[i]} rows={[{ name: '', value: fmt(values[i]), color: 'var(--dv-s7)', shape: 'square' as const }]} /> }); };
  const clear = () => { setHot(null); setTip(null); };
  const xs = values.map((_, i) => x(i));
  return <span ref={ref} className={`dv-spark${className ? ` ${className}` : ''}`} style={width ? { width, height } : { height, width: '100%', display: 'block' }} role="img" aria-label={aria}
    onPointerMove={(e) => { const r = ref.current?.getBoundingClientRect(); if (r && n) at(nearest(xs, e.clientX - r.left), e); }} onPointerLeave={clear}>
    {W > 0 && n > 0 ? <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} aria-hidden="true">
      {kind === 'bars'
        ? values.map((v, i) => <path key={i} className="dv-m" d={barPath(x(i) - bw / 2, base, y(v), bw, 1)} style={{ fill: i === n - 1 || hot === i ? 'var(--dv-s7)' : 'var(--dv-ctx)' }} />)
        : n > 1 ? <>
          <path className="dv-line dv-line-ctx" d={values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('')} />
          <path className="dv-line" style={{ stroke: 'var(--dv-s7)' }} d={`M${x(n - 2)},${y(values[n - 2])}L${x(n - 1)},${y(values[n - 1])}`} />
          <rect x={x(n - 1) - 6} y={y(values[n - 1]) - 6} width="12" height="12" rx="1.5" className="dv-ring" /><rect x={x(n - 1) - 4} y={y(values[n - 1]) - 4} width="8" height="8" rx="1" style={{ fill: 'var(--dv-s7)' }} />
          {hot != null && hot !== n - 1 ? <><rect x={x(hot) - 6} y={y(values[hot]) - 6} width="12" height="12" rx="1.5" className="dv-ring" /><rect x={x(hot) - 4} y={y(values[hot]) - 4} width="8" height="8" rx="1" style={{ fill: 'var(--dv-s7)' }} /></> : null}
        </> : null}
    </svg> : null}
    <Tooltip tip={labels ? tip : null} />
  </span>;
}

/* ---------- StatTile ---------- */
export type Delta = { text: string; dir: 'up' | 'down' | 'flat'; /** Is this direction good news? null = neutral. */ good?: boolean | null };
export type StatTileProps = {
  label: string; value: ReactNode; sub?: ReactNode; delta?: Delta;
  trend?: SparklineProps; hero?: boolean; className?: string; children?: ReactNode;
};
/** Une tuile : libellé, grand chiffre (proportionnel), écart avec la période de référence, micro-tendance. Garde les classes .kpi pour la mise en page et le thème existants. */
export function StatTile({ label, value, sub, delta, trend, hero, className, children }: StatTileProps) {
  const { t } = useT();
  const tone = delta ? (delta.good == null ? 'n' : delta.good ? 'g' : 'b') : 'n';
  return <div className={`kpi dv-stat${hero ? ' dv-hero' : ''}${className ? ` ${className}` : ''}`}>
    <span>{label}</span><b className="dv-stat-v">{value}</b>
    {sub || delta ? <span>{delta ? <span className="dv-delta" data-t={tone}><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">{delta.dir === 'up' ? <path d="M5 1.5 9 8H1z" /> : delta.dir === 'down' ? <path d="M5 8.5 1 2h8z" /> : <rect x="1" y="4" width="8" height="2" rx=".5" />}</svg>{delta.text}<span className="dv-sr"> ({delta.dir === 'up' ? t('en hausse') : delta.dir === 'down' ? t('en baisse') : t('stable')})</span></span> : null}{delta && sub ? ' · ' : null}{sub}</span> : null}
    {trend ? <div className="dv-stat-trend"><Sparkline {...trend} /></div> : null}
    {children}
  </div>;
}

/* ---------- ProgressBar / BulletBar ---------- */
export type ProgressBarProps = {
  value: number; max?: number; /** Target tick (ink line), e.g. objective or median. */ target?: number;
  tone?: 'accent' | 'good' | 'warn' | 'critical'; size?: 'sm' | 'md' | 'lg'; width?: number | string;
  /** Accessible name; without it the bar is decorative (aria-hidden). */ label?: string; valueText?: string; className?: string; style?: CSSProperties;
};
export function ProgressBar({ value, max = 100, target, tone = 'accent', size = 'sm', width, label, valueText, className, style }: ProgressBarProps) {
  const { t } = useT(), pc = (v: number) => `${Math.max(0, Math.min(100, (100 * v) / (max || 1)))}%`;
  const a11y = label ? { role: 'meter' as const, 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': Math.min(max, Math.max(0, value)), 'aria-valuetext': valueText ?? (target != null ? `${value} / ${max} (${t('cible')} : ${target})` : `${value} / ${max}`) } : { 'aria-hidden': true as const };
  return <span className={`dv-meter${className ? ` ${className}` : ''}`} data-size={size} data-tone={tone} style={width != null || style ? { ...(width != null ? { width } : null), ...style } : undefined} {...a11y}>
    <i className="dv-meter-f" style={{ width: pc(value) }} />{target != null ? <b className="dv-meter-t" style={{ left: pc(target) }} /> : null}
  </span>;
}
export const BulletBar = ProgressBar;

/* ---------- CellStrip ---------- */
export type CellState = 'good' | 'warn' | 'bad' | 'accent' | 'muted' | 'none';
export type StripCell = { id: string; label: string; state: CellState; detail?: string };
const ICON: Record<string, string> = { good: 'M2.5 6.2 5 8.6 9.5 3.4', bad: 'M3 3l6 6M9 3 3 9', warn: 'M6 3v4M6 9v.1' };
/** Rangée de cases aux coins adoucis (12 mois à temps ou en retard, unités occupées…), infobulle et flèches du clavier. Le rouge porte aussi une hachure et une icône. */
export function CellStrip({ cells, size = 'md', icons, label, legend, className, decorative }: { cells: StripCell[]; size?: 'sm' | 'md'; icons?: boolean; label: string; legend?: LegendItem[]; className?: string;
  /** Inside a link or a tile that already says it all: no focus, no tooltip, hidden from screen readers. */ decorative?: boolean }) {
  const [tip, setTip] = useState<TipState>(null), [cur, setCur] = useState(-1), ref = useRef<HTMLUListElement>(null), { t } = useT();
  const withIcons = icons ?? size === 'md';
  const show = (i: number, anchor?: { x: number; y: number }) => {
    const el = ref.current?.children[i] as HTMLElement | undefined; if (!el) return; const r = el.getBoundingClientRect(), c = cells[i];
    setCur(i); setTip({ x: anchor?.x ?? r.left + r.width / 2, y: anchor?.y ?? r.top, content: <TipContent title={c.label} rows={c.detail ? [{ name: '', value: c.detail, color: `var(--dv-${c.state === 'good' ? 'good' : c.state === 'bad' ? 'critical' : c.state === 'warn' ? 'warn' : c.state === 'accent' ? 'c1' : 'ctx'})`, shape: 'square' }] : []} /> });
  };
  const key = (e: KeyboardEvent<HTMLUListElement>) => {
    let i = cur < 0 ? (e.key === 'ArrowLeft' ? cells.length : -1) : cur;
    if (e.key === 'ArrowRight') i = Math.min(cells.length - 1, i + 1); else if (e.key === 'ArrowLeft') i = Math.max(0, i - 1); else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = cells.length - 1; else if (e.key === 'Escape') { setTip(null); setCur(-1); return; } else return;
    e.preventDefault(); show(i);
  };
  if (decorative) return <div className={`dv-cells-w${className ? ` ${className}` : ''}`} aria-hidden="true"><ul className="dv-cells" data-size={size}>{cells.map((c) => <li key={c.id} className="dv-cell" data-s={c.state} />)}</ul></div>;
  return <div className={`dv-cells-w${className ? ` ${className}` : ''}`}>
    <ul ref={ref} className="dv-cells" data-size={size} tabIndex={0} aria-label={`${label}. ${t('Utilisez les flèches gauche et droite pour parcourir les valeurs.')}`} onKeyDown={key} onBlur={() => { setTip(null); setCur(-1); }} onFocus={(e) => { if (cur < 0 && e.target === e.currentTarget && !e.currentTarget.matches(':hover')) show(cells.length - 1); }}
      onPointerMove={(e) => { const li = (e.target as HTMLElement).closest('li'); if (li && ref.current) { const i = Array.prototype.indexOf.call(ref.current.children, li); if (i >= 0 && i !== cur) show(i); } }} onPointerLeave={() => { setTip(null); setCur(-1); }}>
      {cells.map((c, i) => <li key={c.id} className="dv-cell" data-s={c.state} data-cur={cur === i ? '1' : undefined} role="img" aria-label={c.detail ? `${c.label} : ${c.detail}` : c.label}>
        {withIcons && ICON[c.state] ? <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d={ICON[c.state]} /></svg> : null}</li>)}
    </ul>
    {legend ? <Legend items={legend} /> : null}
    <Tooltip tip={tip} />
  </div>;
}
