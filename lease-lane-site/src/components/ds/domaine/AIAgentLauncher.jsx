/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';
import { Icon } from '../brand/Icon.jsx';

/* Bouton flottant de l'agent. Deux formes :
   — `avatar` fourni : portrait rond (60 px) avec point de présence bleu qui pulse (onde --bleu-500) et étiquette
     « pilule » qui se déploie au survol, à gauche du portrait ;
   — sans avatar : pilule marine avec chevron étincelant (forme historique). */
export function AIAgentLauncher({onClick,etiquette='Parler à Cléo',pastille,ouvert=false,avatar,nom='Cléo',style,...rest}){
  const [survol,setSurvol]=React.useState(false);
  if(avatar){
    const actif=survol&&!ouvert;
    return <button onClick={onClick} onMouseEnter={()=>setSurvol(true)} onMouseLeave={()=>setSurvol(false)}
      aria-label={ouvert?'Fermer la conversation':etiquette} aria-expanded={ouvert}
      style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'flex-end',gap:'0',height:'66px',
        padding:0,border:0,background:'transparent',cursor:'pointer',fontFamily:'var(--police-corps)',...style}} {...rest}>
      <span aria-hidden="true" style={{display:'inline-flex',alignItems:'center',height:'44px',padding:actif?'0 22px 0 18px':'0',marginRight:actif?'12px':0,
        maxWidth:actif?'260px':'0',overflow:'hidden',whiteSpace:'nowrap',borderRadius:'var(--rayon-pilule)',
        background:'var(--marine-900)',color:'#fff',fontSize:'14px',fontWeight:600,boxShadow:'var(--ombre-3)',
        opacity:actif?1:0,transform:actif?'translateX(0)':'translateX(8px)',
        transition:'max-width var(--duree-3) var(--courbe-sortie),padding var(--duree-3) var(--courbe-sortie),margin var(--duree-3) var(--courbe-sortie),opacity var(--duree-2) var(--courbe-sortie),transform var(--duree-3) var(--courbe-sortie)'}}>
        {etiquette}</span>
      <span style={{position:'relative',width:'66px',height:'66px',flex:'none'}}>
        {!ouvert&&<span aria-hidden="true" style={{position:'absolute',inset:0,borderRadius:'50%',border:'2.5px solid var(--bleu-500)',
          animation:'ll-onde 2.4s var(--courbe-douce) infinite'}}/>}
        <span style={{position:'absolute',inset:0,borderRadius:'50%',overflow:'hidden',
          border:'1.2px solid var(--gris-000)',boxShadow:survol?'var(--ombre-4)':'var(--ombre-3)',background:'var(--marine-900)',
          transform:survol?'scale(1.04)':'scale(1)',transition:'var(--transition-interface)'}}>
          <img src={avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',
            opacity:ouvert?0:1,transform:ouvert?'scale(.8)':'scale(1)',transition:'var(--transition-interface)'}}/>
          <span style={{position:'absolute',inset:0,display:'grid',placeItems:'center',color:'#fff',
            opacity:ouvert?1:0,transform:ouvert?'rotate(0)':'rotate(-90deg)',transition:'var(--transition-interface)'}}>
            <Icon name="x" size={22} color="#fff"/></span>
        </span>
        {!ouvert&&<span aria-hidden="true" style={{position:'absolute',right:'2px',bottom:'2px',width:'15px',height:'15px',borderRadius:'50%',
          background:'var(--bleu-500)',border:'2.5px solid var(--gris-000)'}}/>}
        {pastille>0&&!ouvert&&<span style={{position:'absolute',top:'-2px',right:'-2px',minWidth:'20px',height:'20px',padding:'0 6px',
          borderRadius:'var(--rayon-pilule)',background:'var(--bleu-500)',color:'#fff',fontSize:'11px',fontWeight:700,
          display:'grid',placeItems:'center',border:'2px solid var(--gris-000)'}}>{pastille}</span>}
      </span>
    </button>;
  }
  return <button onClick={onClick} onMouseEnter={()=>setSurvol(true)} onMouseLeave={()=>setSurvol(false)}
    aria-label={etiquette} aria-expanded={ouvert}
    style={{position:'relative',display:'inline-flex',alignItems:'center',gap:'10px',height:'52px',padding:'0 22px 0 18px',
      borderRadius:'var(--rayon-pilule)',border:'1px solid var(--bordure-marine)',
      background:survol?'var(--marine-600)':'var(--marine-900)',color:'#fff',cursor:'pointer',
      fontFamily:'var(--police-corps)',fontSize:'14px',fontWeight:600,
      boxShadow:survol?'var(--ombre-4)':'var(--ombre-3)',transition:'var(--transition-interface)',...style}} {...rest}>
    <span style={{width:'30px',height:'30px',borderRadius:'var(--rayon-pilule)',background:'var(--degrade-chevron)',
      display:'grid',placeItems:'center',flex:'none'}}>
      <Icon name={ouvert?'x':'sparkles'} size={16} color="var(--marine-900)"/>
    </span>
    {etiquette}
    {pastille>0&&<span style={{position:'absolute',top:'-4px',right:'-4px',minWidth:'20px',height:'20px',padding:'0 6px',
      borderRadius:'var(--rayon-pilule)',background:'var(--bleu-500)',color:'#fff',fontSize:'11px',fontWeight:700,
      display:'grid',placeItems:'center',border:'2px solid var(--gris-000)'}}>{pastille}</span>}
  </button>;
}
