'use client';
import { useState, type ReactNode } from 'react';
import { useT } from '@/composants/Langue';

/* Chart frame: optional title (the page's own heading is usually enough), filters row, legend, chart / table view toggle, empty / loading / error states. */

export type TableCell = string | number | null;
export type TableSpec = { caption?: string; columns: string[]; rows: TableCell[][] };

/** Accessible twin of every chart: the same values as a real table. */
export function ChartTable({ caption, columns, rows }: TableSpec) {
  return <div className="dv-table-w"><table className="dv-table">
    {caption ? <caption className="dv-sr">{caption}</caption> : null}
    <thead><tr>{columns.map((c, i) => <th key={i} scope="col" className={i ? 'dv-num' : undefined}>{c}</th>)}</tr></thead>
    <tbody>{rows.map((l, i) => <tr key={i}>{l.map((c, j) => j === 0 ? <th key={j} scope="row">{c ?? '—'}</th> : <td key={j} className="dv-num">{c ?? '—'}</td>)}</tr>)}</tbody>
  </table></div>;
}

export type LegendItem = { id: string; name: string; color: string; shape?: 'square' | 'line'; hidden?: boolean };

/** Legend, always present from two series on. Buttons (isolate / hide) when onToggle is given, otherwise a plain list. Swatch = 8 px rounded square (never a circle). */
export function Legend({ items, onToggle, label }: { items: LegendItem[]; onToggle?: (id: string) => void; label?: string }) {
  const { t } = useT();
  return <ul className="dv-legend" aria-label={label}>{items.map((it) => <li key={it.id}>
    {onToggle
      ? <button type="button" className="dv-leg-b" aria-pressed={!it.hidden} title={t('Afficher ou masquer {nom}', { nom: it.name })} onClick={() => onToggle(it.id)}><i className="dv-key" data-k={it.shape ?? 'square'} style={{ background: it.color }} aria-hidden="true" /><span>{it.name}</span></button>
      : <span className="dv-leg-b"><i className="dv-key" data-k={it.shape ?? 'square'} style={{ background: it.color }} aria-hidden="true" /><span>{it.name}</span></span>}
  </li>)}</ul>;
}

export type FrameState = 'ok' | 'loading' | 'empty' | 'error';

export function ChartFrame({ title, subtitle, filters, legend, table, state = 'ok', emptyText, errorText, className, children }: {
  title?: ReactNode; subtitle?: ReactNode; filters?: ReactNode; legend?: ReactNode; table?: TableSpec | null; state?: FrameState;
  emptyText?: string; errorText?: string; className?: string; children: ReactNode;
}) {
  const { t } = useT(), [asTable, setAsTable] = useState(false);
  const withTable = !!table && state !== 'empty' && state !== 'error';
  return <figure className={`dv-frame${className ? ` ${className}` : ''}`} data-state={state}>
    {title || subtitle ? <figcaption className="dv-cap">{title ? <strong>{title}</strong> : null}{subtitle ? <span>{subtitle}</span> : null}</figcaption> : null}
    {filters ? <div className="dv-filters">{filters}</div> : null}
    {state === 'empty' ? <p className="dv-empty">{emptyText ?? t('Aucune donnée pour cette période.')}</p>
      : state === 'error' ? <p className="dv-empty" role="alert">{errorText ?? t('Le graphique n’a pas pu être affiché.')}</p>
      : <>
        {legend && !asTable ? <div className="dv-leg-w">{legend}</div> : null}
        <div className="dv-body" hidden={asTable} aria-busy={state === 'loading'}>{children}</div>
        {asTable && table ? <ChartTable {...table} /> : null}
        {withTable ? <div className="dv-foot"><button type="button" className="dv-toggle" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>{asTable ? t('Voir le graphique') : t('Voir le tableau')}</button></div> : null}
      </>}
  </figure>;
}
