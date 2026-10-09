/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

export function Card({ton='clair',interactif=false,elevation=1,rembourrage=24,style,children,...rest}){
  const [survol,setSurvol]=React.useState(false);
  const clair={background:'var(--surface-carte)',border:'1px solid var(--bordure-fine)',
    boxShadow:elevation>2?'var(--ombre-'+elevation+')':'none',color:'var(--texte-corps)'};
  const marine={background:'rgba(255,255,255,.05)',border:'1px solid var(--bordure-marine)',
    boxShadow:'none',color:'var(--texte-inverse-discret)'};
  const douce={background:'var(--surface-douce)',border:'1px solid transparent',boxShadow:'none',color:'var(--texte-corps)'};
  const accent={background:'var(--surface-carte)',border:'1px solid var(--bordure-fine)',
    borderLeft:'3px solid var(--bleu-500)',boxShadow:'none',color:'var(--texte-corps)'};
  const nu={background:'transparent',border:'0',boxShadow:'none',color:'var(--texte-corps)'};
  const base={clair,marine,douce,accent,nu}[ton];
  return <div onMouseEnter={()=>setSurvol(true)} onMouseLeave={()=>setSurvol(false)}
    style={{borderRadius:'var(--rayon-carte)',padding:rembourrage+'px',
      transition:'box-shadow var(--duree-3) var(--courbe-sortie),transform var(--duree-3) var(--courbe-sortie),background var(--duree-2) var(--courbe-sortie),border-color var(--duree-2) var(--courbe-sortie)',
      ...base,
      ...(interactif?{cursor:'pointer'}:null),
      ...(interactif&&survol?(ton==='marine'
        ?{background:'rgba(255,255,255,.09)'}
        :{boxShadow:'var(--ombre-3)',borderColor:'transparent',transform:'translateY(-3px)'}):null),
      ...style}} {...rest}>{children}</div>;
}
