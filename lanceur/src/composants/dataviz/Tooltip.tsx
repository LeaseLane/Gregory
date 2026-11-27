'use client';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/* Tooltip unique du kit : portée dans <body> en position fixe (aucune carte ne la coupe), repliée dans la fenêtre,
   jamais seule porteuse d'une valeur (le tableau et les étiquettes disent la même chose). */
export type TipState = { x: number; y: number; content: ReactNode } | null;

export function Tooltip({ tip }: { tip: TipState }) {
  const ref = useRef<HTMLDivElement>(null), [pos, setPos] = useState({ left: -9999, top: -9999 });
  useLayoutEffect(() => {
    if (!tip || !ref.current) return;
    const r = ref.current.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    let left = tip.x + 14; if (left + r.width > vw - 8) left = tip.x - 14 - r.width;
    let top = tip.y - r.height - 12; if (top < 8) top = tip.y + 18;
    setPos({ left: Math.max(8, left), top: Math.max(8, Math.min(top, vh - r.height - 8)) });
  }, [tip]);
  if (!tip || typeof document === 'undefined') return null;
  return createPortal(<div ref={ref} className="dv-tip" role="tooltip" style={{ left: pos.left, top: pos.top }}>{tip.content}</div>, document.body);
}

export type TipRow = { name: string; value: string; color: string; shape?: 'line' | 'square' };

/** Contenu type : title (période ou catégorie), puis une rangée par série, la valeur d'abord et le nom ensuite. Texte inséré comme nœud texte (React échappe). */
export function TipContent({ title, rows, foot }: { title?: string; rows: TipRow[]; foot?: string }) {
  return <>
    {title ? <div className="dv-tip-t">{title}</div> : null}
    {rows.map((l, i) => <div className="dv-tip-r" key={i}><span className="dv-key" data-k={l.shape ?? 'square'} style={{ background: l.color }} aria-hidden="true" /><b>{l.value}</b><span>{l.name}</span></div>)}
    {foot ? <div className="dv-tip-p">{foot}</div> : null}
  </>;
}
