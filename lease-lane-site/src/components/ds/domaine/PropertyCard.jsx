/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';
import { Icon } from '../brand/Icon.jsx';

export function PropertyCard({photos=[],photo,badge,badgeTon='marine',prix,periode='/ mois',titre,adresse,
  chambres,sallesDeBain,superficie,disponibilite,favori=false,onFavori,onComparer,onClick,horizontal=false,flottante=false,style,...rest}){
  const [survol,setSurvol]=React.useState(false);
  const [i,setI]=React.useState(0);
  const liste=photos.length?photos:(photo?[photo]:[]);
  const meta=[
    superficie!=null&&{i:'ruler',t:superficie+' pi²'},
    chambres!=null&&{i:'bed',t:chambres},
    sallesDeBain!=null&&{i:'bath',t:sallesDeBain}
  ].filter(Boolean);
  const tons={marine:{background:'var(--marine-900)',color:'#fff'},bleu:{background:'var(--bleu-500)',color:'#fff'},
    blanc:{background:'#fff',color:'var(--marine-900)'},succes:{background:'var(--succes-500)',color:'#fff'}};
  return <article onClick={onClick} onMouseEnter={()=>setSurvol(true)} onMouseLeave={()=>setSurvol(false)}
    style={{display:horizontal?'grid':'block',gridTemplateColumns:horizontal?'224px 1fr':undefined,gap:horizontal?'22px':0,
      background:flottante?'var(--gris-000)':'transparent',borderRadius:flottante?'var(--rayon-carte)':0,overflow:flottante?'hidden':'visible',
      cursor:onClick?'pointer':'default',...style}} {...rest}>
    <div style={{position:'relative',overflow:'hidden',borderRadius:flottante?0:'var(--rayon-carte)',
      aspectRatio:horizontal?'4 / 3':'740 / 560',background:'var(--gris-100)',display:'grid',placeItems:'center'}}>
      {liste.length
        ?<img src={liste[i]} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block',
            transform:survol?'scale(1.04)':'none',transition:'transform var(--duree-4) var(--courbe-sortie)'}}/>
        :<span style={{display:'grid',placeItems:'center',gap:'8px',color:'var(--gris-400)'}}>
           <Icon name="image" size={26} color="var(--gris-400)"/>
           <span style={{fontSize:'10.5px',letterSpacing:'.12em',textTransform:'uppercase'}}>Photo à fournir</span>
         </span>}
      {badge&&<span style={{position:'absolute',left:'14px',top:'14px',height:'28px',padding:'0 14px',
        display:'inline-flex',alignItems:'center',borderRadius:'var(--rayon-pilule)',fontSize:'11.5px',
        fontWeight:500,letterSpacing:'.02em',...tons[badgeTon]}}>{badge}</span>}
      <div style={{position:'absolute',right:'14px',top:'14px',display:'grid',gap:'8px',
        opacity:survol?1:0,transition:'opacity var(--duree-2) var(--courbe-sortie)'}}>
        {onFavori&&<button onClick={e=>{e.stopPropagation();onFavori()}} aria-label={favori?'Retirer des favoris':'Ajouter aux favoris'}
          style={{width:'36px',height:'36px',borderRadius:'var(--rayon-pilule)',border:0,cursor:'pointer',
            background:favori?'var(--marine-900)':'rgba(255,255,255,.94)',display:'grid',placeItems:'center',
            color:favori?'#fff':'var(--marine-900)'}}><Icon name="bookmark" size={15}/></button>}
        {onComparer&&<button onClick={e=>{e.stopPropagation();onComparer()}} aria-label="Comparer"
          style={{width:'36px',height:'36px',borderRadius:'var(--rayon-pilule)',border:0,cursor:'pointer',
            background:'rgba(255,255,255,.94)',display:'grid',placeItems:'center',color:'var(--marine-900)'}}>
          <Icon name="scale" size={15}/></button>}
      </div>
      {liste.length>1&&<div style={{position:'absolute',left:0,right:0,bottom:'12px',display:'flex',
        justifyContent:'center',gap:'6px'}}>
        {liste.map((_,n)=><button key={n} aria-label={'Photo '+(n+1)}
          onClick={e=>{e.stopPropagation();setI(n)}}
          style={{width:n===i?'18px':'6px',height:'6px',borderRadius:'var(--rayon-pilule)',border:0,padding:0,
            cursor:'pointer',background:n===i?'#fff':'rgba(255,255,255,.55)',
            transition:'width var(--duree-2) var(--courbe-sortie)'}}/>)}
      </div>}
    </div>
    <div style={{padding:flottante?'18px 20px 20px':(horizontal?'4px 0 0':'18px 0 0'),minWidth:0}}>
      {adresse&&<div style={{display:'flex',alignItems:'center',gap:'7px',fontSize:'12.5px',color:'var(--texte-discret)'}}>
        <Icon name="map-pin" size={13} color="var(--bleu-500)"/>{adresse}</div>}
      <h3 style={{fontSize:'21px',marginTop:'9px',color:survol?'var(--bleu-600)':'var(--marine-900)',
        transition:'color var(--duree-2) var(--courbe-sortie)'}}>{titre}</h3>
      {disponibilite&&<p style={{fontSize:'13.5px',color:'var(--texte-discret)',margin:'9px 0 0'}}>{disponibilite}</p>}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',flexWrap:'wrap',
        marginTop:'16px',paddingTop:'16px',borderTop:'1px solid var(--bordure-fine)'}}>
        <div style={{display:'flex',gap:'16px'}}>
          {meta.map(m=><span key={m.i} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'var(--texte-corps)'}}>
            <Icon name={m.i} size={16} color="var(--marine-900)"/>{m.t}</span>)}
        </div>
        <span style={{display:'flex',alignItems:'baseline',gap:'4px'}}>
          <span style={{fontFamily:'var(--police-titre)',fontSize:'20px',fontWeight:700,
            letterSpacing:'-0.02em',color:'var(--marine-900)'}}>{prix}</span>
          {periode&&<span style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{periode}</span>}
        </span>
      </div>
    </div>
  </article>;
}
