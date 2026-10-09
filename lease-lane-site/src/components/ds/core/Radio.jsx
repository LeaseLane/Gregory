/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

export function Radio({label,description,name,value,checked,onChange,disabled,style,...rest}){
  return <label style={{display:'flex',gap:'10px',alignItems:'flex-start',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.45:1,...style}}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled}
      style={{position:'absolute',opacity:0,width:1,height:1}} {...rest}/>
    <span style={{width:'18px',height:'18px',flex:'none',marginTop:'2px',borderRadius:'var(--rayon-pilule)',
      display:'grid',placeItems:'center',transition:'var(--transition-interface)',background:'var(--gris-000)',
      border:'1px solid '+(checked?'var(--action-primaire)':'var(--bordure-forte)')}}>
      {checked&&<span style={{width:'9px',height:'9px',borderRadius:'var(--rayon-pilule)',background:'var(--action-primaire)'}}/>}
    </span>
    <span>
      <span style={{fontSize:'14px',color:'var(--texte-titre)'}}>{label}</span>
      {description&&<span style={{display:'block',fontSize:'12.5px',color:'var(--texte-discret)',marginTop:'2px'}}>{description}</span>}
    </span>
  </label>;
}
