/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

export function Switch({label,description,checked,defaultChecked,onChange,disabled,style}){
  const [interne,setInterne]=React.useState(!!defaultChecked);
  const actif=checked!==undefined?checked:interne;
  const bascule=()=>{if(disabled)return;const n=!actif;if(checked===undefined)setInterne(n);onChange&&onChange(n)};
  return <label style={{display:'flex',gap:'12px',alignItems:'flex-start',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.45:1,...style}}>
    <button type="button" role="switch" aria-checked={actif} onClick={bascule} disabled={disabled}
      style={{width:'40px',height:'23px',flex:'none',marginTop:'1px',padding:'2px',borderRadius:'var(--rayon-pilule)',
        border:'1px solid '+(actif?'var(--action-primaire)':'var(--bordure-forte)'),
        background:actif?'var(--action-primaire)':'var(--gris-100)',cursor:'inherit',
        transition:'var(--transition-interface)',display:'flex',justifyContent:actif?'flex-end':'flex-start'}}>
      <span style={{width:'17px',height:'17px',borderRadius:'var(--rayon-pilule)',background:'#fff',boxShadow:'var(--ombre-1)',transition:'var(--transition-interface)'}}/>
    </button>
    {(label||description)&&<span>
      <span style={{fontSize:'14px',color:'var(--texte-titre)'}}>{label}</span>
      {description&&<span style={{display:'block',fontSize:'12.5px',color:'var(--texte-discret)',marginTop:'2px'}}>{description}</span>}
    </span>}
  </label>;
}
