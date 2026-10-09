/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

const llToastTons={
  info:{barre:'var(--bleu-500)',fond:'var(--gris-000)'},
  succes:{barre:'var(--succes-500)',fond:'var(--gris-000)'},
  alerte:{barre:'var(--alerte-500)',fond:'var(--gris-000)'},
  urgence:{barre:'var(--urgence-500)',fond:'var(--gris-000)'}
};

export function Toast({ton='info',titre,message,icone,onClose,style}){
  const t=llToastTons[ton];
  return <div role="status" style={{display:'flex',gap:'12px',alignItems:'flex-start',width:'360px',
    padding:'14px 16px',background:t.fond,borderRadius:'var(--rayon-3)',boxShadow:'var(--ombre-4)',
    border:'1px solid var(--bordure-fine)',borderLeft:'3px solid '+t.barre,...style}}>
    {icone&&<span style={{color:t.barre,display:'flex',marginTop:'1px'}}>{icone}</span>}
    <div style={{flex:1,minWidth:0}}>
      {titre&&<div style={{fontSize:'13.5px',fontWeight:600,color:'var(--texte-titre)'}}>{titre}</div>}
      {message&&<div style={{fontSize:'13px',color:'var(--texte-discret)',marginTop:'2px'}}>{message}</div>}
    </div>
    {onClose&&<button onClick={onClose} aria-label="Fermer" style={{border:0,background:'transparent',cursor:'pointer',padding:0,color:'var(--texte-discret)',display:'flex'}}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>}
  </div>;
}
