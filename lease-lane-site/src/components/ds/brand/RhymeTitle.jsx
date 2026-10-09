/** @jsxImportSource @/lib/i18n */
import React from 'react';

export function RhymeTitle({ligne1,ligne2,taille='l',ton='clair',align='left',style,...rest}){
  const tailles={xl:'var(--titre-xl)',l:'var(--titre-l)',m:'var(--titre-m)',s:'var(--titre-s)'};
  const c1=ton==='marine'?'#fff':'var(--marine-900)';
  const c2=ton==='marine'?'var(--bleu-300)':'var(--bleu-500)';
  return <h2 style={{fontFamily:'var(--police-titre)',fontSize:tailles[taille],lineHeight:'var(--interligne-titre)',
    letterSpacing:'var(--interlettre-titre)',textTransform:'uppercase',fontWeight:400,margin:0,textAlign:align,...style}} {...rest}>
    <span style={{display:'block',color:c1}}>{ligne1}</span>
    <span style={{display:'block',color:c2}}>{ligne2}</span>
  </h2>;
}
