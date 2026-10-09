/** @jsxImportSource @/lib/i18n */
import React from 'react';

export function StatBlock({valeur,libelle,precision,ton='clair',taille='l',align='left',style,...rest}){
  const t={xl:'72px',l:'56px',m:'40px',s:'30px'}[taille];
  const cv=ton==='marine'?'var(--bleu-200)':'var(--bleu-500)';
  const cl=ton==='marine'?'#fff':'var(--marine-900)';
  const cp=ton==='marine'?'var(--bleu-100)':'var(--texte-discret)';
  return <div style={{textAlign:align,...style}} {...rest}>
    <div style={{fontFamily:'var(--police-titre)',fontSize:t,lineHeight:.92,color:cv,letterSpacing:'.005em'}}>{valeur}</div>
    {libelle&&<div style={{fontSize:'13.5px',fontWeight:600,color:cl,marginTop:'8px'}}>{libelle}</div>}
    {precision&&<div style={{fontSize:'12.5px',color:cp,marginTop:'3px',lineHeight:1.5}}>{precision}</div>}
  </div>;
}
