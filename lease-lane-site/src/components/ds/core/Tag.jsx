/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

export function Tag({actif=false,onRemove,onClick,icone,style,children,...rest}){
  const [survol,setSurvol]=React.useState(false);
  const cliquable=!!onClick;
  return <span onClick={onClick} onMouseEnter={()=>setSurvol(true)} onMouseLeave={()=>setSurvol(false)}
    style={{display:'inline-flex',alignItems:'center',gap:'7px',height:'32px',padding:'0 14px',
      borderRadius:'var(--rayon-pilule)',fontSize:'13px',fontWeight:500,cursor:cliquable?'pointer':'default',
      transition:'var(--transition-interface)',
      background:actif?'var(--action-primaire)':survol&&cliquable?'var(--surface-survol)':'var(--gris-000)',
      color:actif?'#fff':'var(--texte-titre)',
      border:'1px solid '+(actif?'var(--action-primaire)':survol&&cliquable?'var(--bleu-200)':'var(--bordure)'),
      ...style}} {...rest}>
    {icone}{children}
    {onRemove&&<button onClick={(e)=>{e.stopPropagation();onRemove()}} aria-label="Retirer"
      style={{border:0,background:'transparent',padding:0,display:'flex',cursor:'pointer',color:'inherit',opacity:.7}}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>}
  </span>;
}
