/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

export function Dialog({ouvert,titre,surtitre,onClose,actions,largeur=560,style,children}){
  React.useEffect(()=>{
    if(!ouvert)return;
    const k=(e)=>{if(e.key==='Escape')onClose&&onClose()};
    window.addEventListener('keydown',k);return()=>window.removeEventListener('keydown',k);
  },[ouvert,onClose]);
  if(!ouvert)return null;
  return <div role="dialog" aria-modal="true" onClick={onClose}
    style={{position:'fixed',inset:0,zIndex:80,display:'grid',placeItems:'center',padding:'24px',
      background:'rgba(7,26,46,.55)',backdropFilter:'blur(3px)',
      animation:'llFondu var(--duree-3) var(--courbe-sortie)'}}>
    <style>{'@keyframes llFondu{from{opacity:0}to{opacity:1}}@keyframes llMonte{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'}</style>
    <div onClick={e=>e.stopPropagation()}
      style={{width:'100%',maxWidth:largeur+'px',maxHeight:'86vh',overflow:'auto',background:'var(--gris-000)',
        borderRadius:'var(--rayon-5)',boxShadow:'var(--ombre-5)',animation:'llMonte var(--duree-4) var(--courbe-sortie)',...style}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',padding:'24px 26px 0'}}>
        <div>
          {surtitre&&<div className="ll-surtitre" style={{marginBottom:'8px'}}>{surtitre}</div>}
          {titre&&<h3 style={{fontSize:'var(--titre-s)'}}>{titre}</h3>}
        </div>
        <button onClick={onClose} aria-label="Fermer"
          style={{border:0,background:'transparent',cursor:'pointer',padding:'4px',color:'var(--texte-discret)',display:'flex'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div style={{padding:'16px 26px 24px',fontSize:'14.5px'}}>{children}</div>
      {actions&&<div style={{display:'flex',justifyContent:'flex-end',gap:'10px',padding:'16px 26px',
        borderTop:'1px solid var(--bordure-fine)',background:'var(--surface-douce)',
        borderRadius:'0 0 var(--rayon-5) var(--rayon-5)'}}>{actions}</div>}
    </div>
  </div>;
}
