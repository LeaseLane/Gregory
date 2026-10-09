/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

export function MapMarker({libelle,actif=false,groupe=false,onClick,style,...rest}){
  const [survol,setSurvol]=React.useState(false);
  const plein=actif||survol;
  if(groupe){
    return <button onClick={onClick} style={{width:'44px',height:'44px',borderRadius:'var(--rayon-pilule)',
      border:'2px solid #fff',background:'var(--marine-900)',color:'#fff',cursor:'pointer',
      fontFamily:'var(--police-titre)',fontSize:'17px',letterSpacing:'.02em',
      boxShadow:'var(--ombre-3)',display:'grid',placeItems:'center',...style}} {...rest}>{libelle}</button>;
  }
  return <button onClick={onClick} onMouseEnter={()=>setSurvol(true)} onMouseLeave={()=>setSurvol(false)}
    style={{position:'relative',height:'30px',padding:'0 12px',borderRadius:'var(--rayon-pilule)',
      border:'1px solid '+(plein?'var(--marine-900)':'var(--bleu-500)'),
      background:plein?'var(--marine-900)':'#fff',color:plein?'#fff':'var(--bleu-700)',
      fontFamily:'var(--police-mono)',fontSize:'12.5px',fontWeight:600,cursor:'pointer',
      boxShadow:'var(--ombre-2)',transition:'var(--transition-interface)',
      transform:plein?'scale(1.06)':'none',whiteSpace:'nowrap',...style}} {...rest}>
    {libelle}
    <span style={{position:'absolute',left:'50%',bottom:'-5px',width:'9px',height:'9px',
      marginLeft:'-4.5px',transform:'rotate(45deg)',
      background:plein?'var(--marine-900)':'#fff',
      borderRight:'1px solid '+(plein?'var(--marine-900)':'var(--bleu-500)'),
      borderBottom:'1px solid '+(plein?'var(--marine-900)':'var(--bleu-500)')}}/>
  </button>;
}
