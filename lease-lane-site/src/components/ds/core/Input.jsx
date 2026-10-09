/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

export function Input({label,aide,erreur,iconeAvant,suffixe,taille='m',encadre=false,style,id,...rest}){
  const [focus,setFocus]=React.useState(false);
  const auto=React.useId();
  const uid=id||auto;
  const h=taille==='s'?38:taille==='l'?52:44;
  const boite=encadre
    ?{padding:'0 16px',background:'var(--gris-000)',borderRadius:'var(--rayon-champ)',
      border:'1px solid '+(erreur?'var(--urgence-500)':focus?'var(--marine-900)':'var(--bordure)')}
    :{padding:'0 2px',background:'transparent',borderRadius:0,
      borderBottom:'1px solid '+(erreur?'var(--urgence-500)':focus?'var(--marine-900)':'var(--gris-300)')};
  return <div style={{display:'flex',flexDirection:'column',gap:'6px',width:'100%'}}>
    {label&&<label htmlFor={uid} style={{fontSize:'12.5px',fontWeight:500,color:'var(--texte-titre)'}}>{label}</label>}
    <div style={{display:'flex',alignItems:'center',gap:'11px',height:h+'px',
      transition:'var(--transition-interface)',...boite}}>
      {iconeAvant&&<span style={{color:'var(--marine-900)',display:'flex'}}>{iconeAvant}</span>}
      <input id={uid} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        style={{flex:1,minWidth:0,border:0,outline:0,background:'transparent',fontFamily:'var(--police-corps)',
          fontSize:taille==='s'?'13.5px':'14.5px',color:'var(--texte-titre)',...style}} {...rest}/>
      {suffixe&&<span style={{color:'var(--texte-discret)',fontSize:'13px',display:'flex'}}>{suffixe}</span>}
    </div>
    {(aide||erreur)&&<span style={{fontSize:'12px',color:erreur?'var(--urgence-600)':'var(--texte-discret)'}}>{erreur||aide}</span>}
  </div>;
}
