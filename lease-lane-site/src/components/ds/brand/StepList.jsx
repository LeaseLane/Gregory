/** @jsxImportSource @/lib/i18n */
import React from 'react';

export function StepList({etapes=[],ton='clair',colonnes=1,style,...rest}){
  const cTitre=ton==='marine'?'#fff':'var(--marine-900)';
  const cTexte=ton==='marine'?'var(--bleu-100)':'var(--texte-corps)';
  const cNum=ton==='marine'?'var(--bleu-300)':'var(--bleu-500)';
  const cFilet=ton==='marine'?'var(--bordure-marine)':'var(--bordure-fine)';
  return <ol style={{listStyle:'none',margin:0,padding:0,display:'grid',gap:'0',
    gridTemplateColumns:'repeat('+colonnes+',minmax(0,1fr))',...style}} {...rest}>
    {etapes.map((e,i)=><li key={i} style={{display:'flex',gap:'18px',padding:'18px 0',
      borderTop:i<colonnes?'none':'1px solid '+cFilet}}>
      <span style={{fontFamily:'var(--police-titre)',fontSize:'26px',lineHeight:1,color:cNum,minWidth:'34px'}}>
        {String(i+1).padStart(2,'0')}
      </span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
          <span style={{fontFamily:'var(--police-titre)',fontSize:'19px',letterSpacing:'.01em',color:cTitre}}>{e.titre}</span>
          {e.acteur&&<span style={{fontSize:'10px',fontWeight:600,letterSpacing:'.16em',textTransform:'uppercase',
            color:ton==='marine'?'var(--bleu-300)':'var(--texte-discret)'}}>{e.acteur}</span>}
        </div>
        {e.texte&&<div style={{fontSize:'13.5px',lineHeight:1.55,color:cTexte,marginTop:'5px'}}>{e.texte}</div>}
      </div>
    </li>)}
  </ol>;
}
