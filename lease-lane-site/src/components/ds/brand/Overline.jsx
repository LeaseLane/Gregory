/** @jsxImportSource @/lib/i18n */
import React from 'react';

export function Overline({barre,trait,ton='clair',style,children,...rest}){
  if(barre===undefined)barre=trait===undefined?true:trait;
  const couleurTexte=ton==='marine'?'var(--bleu-100)':'var(--texte-discret)';
  const couleurBarre=ton==='marine'?'var(--bleu-300)':'var(--bleu-500)';
  return <span style={{display:'inline-flex',alignItems:'baseline',gap:'8px',
    fontFamily:'var(--police-corps)',fontSize:'var(--surtitre-taille)',fontWeight:500,
    letterSpacing:'var(--interlettre-surtitre)',textTransform:'uppercase',color:couleurTexte,...style}} data-overline="" {...rest}>
    {barre&&<span aria-hidden="true" style={{color:couleurBarre,fontWeight:600}}>/</span>}
    {children}
  </span>;
}
