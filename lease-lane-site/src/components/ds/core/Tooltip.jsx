/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

export function Tooltip({contenu,position='haut',children,style}){
  const [vu,setVu]=React.useState(false);
  const pos={
    haut:{bottom:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)'},
    bas:{top:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)'},
    gauche:{right:'calc(100% + 8px)',top:'50%',transform:'translateY(-50%)'},
    droite:{left:'calc(100% + 8px)',top:'50%',transform:'translateY(-50%)'}
  }[position];
  return <span style={{position:'relative',display:'inline-flex',...style}}
    onMouseEnter={()=>setVu(true)} onMouseLeave={()=>setVu(false)} onFocus={()=>setVu(true)} onBlur={()=>setVu(false)}>
    {children}
    {vu&&<span role="tooltip" style={{position:'absolute',zIndex:60,...pos,padding:'7px 11px',
      background:'var(--marine-900)',color:'#fff',fontSize:'12.5px',lineHeight:1.4,borderRadius:'var(--rayon-2)',
      boxShadow:'var(--ombre-3)',whiteSpace:'nowrap',pointerEvents:'none'}}>{contenu}</span>}
  </span>;
}
