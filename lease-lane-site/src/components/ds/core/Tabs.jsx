/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

export function Tabs({onglets=[],valeur,onChange,variant='souligne',pleineLargeur=false,style}){
  const [interne,setInterne]=React.useState(onglets[0]&&(onglets[0].value||onglets[0]));
  const actif=valeur!==undefined?valeur:interne;
  const choisir=(v)=>{if(valeur===undefined)setInterne(v);onChange&&onChange(v)};
  const items=onglets.map(o=>typeof o==='string'?{value:o,label:o}:o);
  if(variant==='pilules'){
    return <div style={{display:'inline-flex',gap:'4px',padding:'4px',background:'var(--gris-050)',borderRadius:'calc(var(--rayon-bouton) + 2px)',...style}}>
      {items.map(o=><button key={o.value} onClick={()=>choisir(o.value)}
        style={{height:'32px',padding:'0 16px',border:0,borderRadius:'calc(var(--rayon-bouton) - 2px)',cursor:'pointer',
          fontFamily:'var(--police-corps)',fontSize:'13px',fontWeight:600,transition:'var(--transition-interface)',
          background:actif===o.value?'var(--gris-000)':'transparent',
          color:actif===o.value?'var(--marine-900)':'var(--texte-discret)',
          boxShadow:actif===o.value?'var(--ombre-1)':'none'}}>{o.label}</button>)}
    </div>;
  }
  return <div style={{display:'flex',gap:'26px',borderBottom:'1px solid var(--bordure-fine)',
    ...(pleineLargeur?{justifyContent:'space-between'}:null),...style}}>
    {items.map(o=><button key={o.value} onClick={()=>choisir(o.value)}
      style={{position:'relative',padding:'0 0 12px',border:0,background:'transparent',cursor:'pointer',
        fontFamily:'var(--police-corps)',fontSize:'14px',fontWeight:600,
        color:actif===o.value?'var(--marine-900)':'var(--texte-discret)',
        transition:'color var(--duree-2) var(--courbe-sortie)',
        ...(pleineLargeur?{flex:1}:null)}}>
      {o.label}
      <span style={{position:'absolute',left:0,right:0,bottom:'-1px',height:'2px',
        background:actif===o.value?'var(--action-primaire)':'transparent',transition:'var(--transition-interface)'}}/>
    </button>)}
  </div>;
}
