/** @jsxImportSource @/lib/i18n */
import React from 'react';
import { Overline } from './Overline.jsx';
import { RhymeTitle } from './RhymeTitle.jsx';

export function SectionBanner({surtitre,ligne1,ligne2,icone,hauteur=260,base='assets/img/',skyline=true,style,children,...rest}){
  return <section style={{position:'relative',overflow:'hidden',background:'var(--degrade-marine)',
    minHeight:hauteur+'px',display:'flex',alignItems:'center',...style}} {...rest}>
    <div className="ll-grille" style={{position:'absolute',inset:0}}/>
    <div style={{position:'absolute',inset:0,background:'var(--lueur-bleue)'}}/>
    {skyline&&<img src={base+'skyline-lumineux.png'} alt=""
      style={{position:'absolute',right:'-20px',bottom:0,height:Math.round(hauteur*0.78)+'px',opacity:.95,pointerEvents:'none'}}/>}
    <div style={{position:'relative',width:'100%',maxWidth:'var(--largeur-max)',margin:'0 auto',padding:'40px 32px'}}>
      {surtitre&&<div style={{marginBottom:'26px'}}><Overline ton="marine">{surtitre}</Overline></div>}
      <div style={{display:'flex',alignItems:'center',gap:'28px'}}>
        {icone&&<span style={{position:'relative',width:'92px',height:'92px',flex:'none',display:'grid',placeItems:'center',
          border:'1px solid rgba(255,255,255,.35)'}}>
          {icone}
          <span style={{position:'absolute',left:'14px',bottom:'14px',width:'28px',height:'3px',background:'var(--bleu-400)'}}/>
        </span>}
        <RhymeTitle ton="marine" taille="l" ligne1={ligne1} ligne2={ligne2}/>
      </div>
      {children}
    </div>
  </section>;
}
