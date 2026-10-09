/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

export function Checkbox({label,description,checked,defaultChecked,onChange,disabled,style,...rest}){
  const [interne,setInterne]=React.useState(!!defaultChecked);
  const actif=checked!==undefined?checked:interne;
  const bascule=(e)=>{if(disabled)return;if(checked===undefined)setInterne(e.target.checked);onChange&&onChange(e)};
  return <label style={{display:'flex',gap:'10px',alignItems:'flex-start',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.45:1,...style}}>
    <input type="checkbox" checked={actif} onChange={bascule} disabled={disabled}
      style={{position:'absolute',opacity:0,width:1,height:1}} {...rest}/>
    <span style={{width:'18px',height:'18px',flex:'none',marginTop:'2px',borderRadius:'var(--rayon-1)',
      display:'grid',placeItems:'center',transition:'var(--transition-interface)',
      background:actif?'var(--action-primaire)':'var(--gris-000)',
      border:'1px solid '+(actif?'var(--action-primaire)':'var(--bordure-forte)')}}>
      {actif&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
    </span>
    <span>
      <span style={{fontSize:'14px',color:'var(--texte-titre)'}}>{label}</span>
      {description&&<span style={{display:'block',fontSize:'12.5px',color:'var(--texte-discret)',marginTop:'2px'}}>{description}</span>}
    </span>
  </label>;
}
