/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

export function Select({label,aide,options=[],taille='m',iconeAvant,encadre=false,style,id,...rest}){
  const [focus,setFocus]=React.useState(false);
  const auto=React.useId();
  const uid=id||auto;
  const h=taille==='s'?38:taille==='l'?52:44;
  const boite=encadre
    ?{background:'var(--gris-000)',borderRadius:'var(--rayon-champ)',
      border:'1px solid '+(focus?'var(--marine-900)':'var(--bordure)'),padding:'0 16px'}
    :{background:'transparent',borderRadius:0,padding:'0 2px',
      borderBottom:'1px solid '+(focus?'var(--marine-900)':'var(--gris-300)')};
  return <div style={{display:'flex',flexDirection:'column',gap:'6px',width:'100%'}}>
    {label&&<label htmlFor={uid} style={{fontSize:'12.5px',fontWeight:500,color:'var(--texte-titre)'}}>{label}</label>}
    <div style={{position:'relative',display:'flex',alignItems:'center',gap:'11px',height:h+'px',
      transition:'var(--transition-interface)',...boite}}>
      {iconeAvant&&<span style={{color:'var(--marine-900)',display:'flex',flex:'none'}}>{iconeAvant}</span>}
      <select id={uid} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        style={{flex:1,minWidth:0,height:'100%',paddingRight:'24px',appearance:'none',border:0,outline:0,
          background:'transparent',fontFamily:'var(--police-corps)',
          fontSize:taille==='s'?'13.5px':'14.5px',color:'var(--texte-titre)',...style}} {...rest}>
        {options.map(o=>{const v=typeof o==='string'?o:o.value;const t=typeof o==='string'?o:o.label;
          return <option key={v} value={v}>{t}</option>;})}
      </select>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--marine-900)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" style={{position:'absolute',right:encadre?'14px':'2px',pointerEvents:'none'}}>
        <path d="m6 9 6 6 6-6"/></svg>
    </div>
    {aide&&<span style={{fontSize:'12px',color:'var(--texte-discret)'}}>{aide}</span>}
  </div>;
}
