/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';
import { Icon } from '../brand/Icon.jsx';

/* Forme des boutons d'une zone d'interface. null = pilules (défaut, espaces connectés).
   {forme:'voie', icone:(libellé)=>nom} = boutons « voie » du site public : parallélogramme, segment d'icône bordé de deux bandes, libellé. */
export const FormeBoutonContexte=React.createContext(null);
const llVoieRoles={primaire:'rp',marine:'rp',accent:'ra',secondaire:'rs',inverse:'ri',contour_inverse:'ro',urgence:'ru'};
function llTexte(n){if(n==null||typeof n==='boolean')return '';if(typeof n==='string'||typeof n==='number')return String(n);if(Array.isArray(n))return n.map(llTexte).join('');return n.props?llTexte(n.props.children):''}

const llBtnBase={display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'10px',
  fontFamily:'var(--police-corps)',fontWeight:600,border:'1px solid transparent',
  borderRadius:'var(--rayon-bouton)',cursor:'pointer',textDecoration:'none',whiteSpace:'nowrap',
  letterSpacing:'-0.005em',
  transition:'background var(--duree-2) var(--courbe-sortie),color var(--duree-2) var(--courbe-sortie),border-color var(--duree-2) var(--courbe-sortie),transform var(--duree-1) var(--courbe-sortie)'};

/* Taille maximale d'un bouton : 40 px, Poppins 14 px (le bouton « Service de gestion » de l'en-tête). Toutes les tailles s'y alignent. */
const llBtnTaille={height:'40px',padding:'0 20px',fontSize:'14px'};
const llBtnSizes={s:llBtnTaille,m:llBtnTaille,l:llBtnTaille,xl:llBtnTaille};

const llBtnVariants={
  primaire:{background:'var(--marine-900)',color:'#fff'},
  accent:{background:'var(--bleu-500)',color:'#fff'},
  marine:{background:'var(--marine-900)',color:'#fff'},
  secondaire:{background:'transparent',color:'var(--marine-900)',borderColor:'var(--gris-300)'},
  fantome:{background:'transparent',color:'var(--marine-900)',padding:'0'},
  inverse:{background:'#fff',color:'var(--marine-900)'},
  contour_inverse:{background:'transparent',color:'#fff',borderColor:'rgba(255,255,255,.4)'}
};

const llBtnHover={
  primaire:{background:'var(--bleu-500)'},
  accent:{background:'var(--bleu-600)'},
  marine:{background:'var(--bleu-500)'},
  secondaire:{background:'var(--marine-900)',color:'#fff',borderColor:'var(--marine-900)'},
  fantome:{color:'var(--bleu-500)'},
  inverse:{background:'var(--bleu-025)'},
  contour_inverse:{background:'#fff',color:'var(--marine-900)',borderColor:'#fff'}
};

export function Button({variant='primaire',size='m',forme,icone,compteur,direction,tuile,flecheSurvol,capitales=false,pleineLargeur=false,disabled=false,iconeAvant=null,iconeApres=null,as='button',href,style,className,children,...rest}){
  const ctx=React.useContext(FormeBoutonContexte);
  const [survol,setSurvol]=React.useState(false);
  const [appui,setAppui]=React.useState(false);
  const Tag=as==='a'?'a':'button';
  const f=forme||(ctx&&ctx.forme)||'pilule';
  if(f==='fleche'&&variant!=='fantome'){
    /* Kit Flèche : la tuile d'icône s'étire sur tout le bouton au survol, l'icône devient une flèche qui file. */
    const role={primaire:'p',marine:'p',accent:'ac',secondaire:'s',urgence:'u',inverse:'i',contour_inverse:'o2'}[variant]||'p';
    const tl='ll-fl-sm';
    const isz=16;
    const flecheF=!!(iconeApres&&iconeApres.props&&/^(arrow|chevron)/.test(iconeApres.props.name||''));
    const el=iconeAvant||(iconeApres&&!flecheF?iconeApres:null);
    const nom=icone||(React.isValidElement(el)?null:(ctx&&ctx.icone?ctx.icone(llTexte(children)):null));
    const icn=nom?<Icon name={nom} size={isz} color="currentColor"/>:(React.isValidElement(el)?React.cloneElement(el,{size:isz,color:'currentColor'}):null);
    const d={ne:'M7 17 17 7M8 7h9v9',s:'M12 5v14M6 13l6 6 6-6'}[direction]||'M5 12h14M13 6l6 6-6 6';
    const fl=<svg viewBox="0 0 24 24" width={isz} height={isz} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={d}/></svg>;
    const seul=compteur==null&&(children==null||children===false||children==='');
    const garde=!!icn&&flecheSurvol===false;
    const ar=<span className="ll-fl-ar" aria-hidden="true">{icn?(garde?<i className="ll-ic">{icn}</i>:<React.Fragment><i className="ll-ic">{icn}</i><i className="ll-fx">{fl}</i></React.Fragment>):<React.Fragment><i>{fl}</i><i>{fl}</i></React.Fragment>}</span>;
    const lb=<React.Fragment>{compteur!=null&&<b className="ll-fl-n">{compteur}</b>}{children}</React.Fragment>;
    const cls=['ll-fl','ll-fl-'+role,tl,pleineLargeur&&'ll-fl-w',seul&&'ll-fl-io',icn&&!garde&&'ll-sw',tuile==='droite'&&'ll-fl-d',className].filter(Boolean).join(' ');
    return <Tag className={cls} href={href} data-dir={direction&&direction!=='e'?direction:undefined} disabled={Tag==='button'?disabled:undefined} aria-disabled={disabled||undefined} style={style} {...rest}>
      <span className="ll-fl-c">{lb}</span>
      <span className="ll-fl-o" aria-hidden="true"><span className="ll-fl-c">{lb}</span>{ar}</span>
    </Tag>;
  }
  if(f==='voie'&&variant!=='fantome'){
    const sz=18, flecheV=!!(iconeApres&&iconeApres.props&&/^(arrow|chevron)/.test(iconeApres.props.name||''));
    const el=iconeAvant||(iconeApres&&!flecheV?iconeApres:null);
    let ic;
    if(compteur!=null)ic=<React.Fragment><span className="ll-voie-pt" aria-hidden="true"/>{compteur}</React.Fragment>;
    else if(icone)ic=<Icon name={icone} size={sz} color="currentColor"/>;
    else if(React.isValidElement(el))ic=React.cloneElement(el,{size:sz,color:'currentColor'});
    else ic=<Icon name={(ctx&&ctx.icone&&ctx.icone(llTexte(children)))||'circle-check'} size={sz} color="currentColor"/>;
    const seul=compteur==null&&(children==null||children===false||children==='');
    const cls=['ll-voie','ll-voie-'+(llVoieRoles[variant]||'rp'),'ll-voie-s',compteur!=null&&'ll-voie-n',seul&&'ll-voie-io',pleineLargeur&&'ll-voie-plein',className].filter(Boolean).join(' ');
    return <Tag className={cls} href={href} disabled={Tag==='button'?disabled:undefined} aria-disabled={disabled||undefined} style={style} {...rest}>
      <span className="ll-voie-bd" aria-hidden="true"/>
      <span className="ll-voie-ic" aria-hidden={compteur==null&&!seul?'true':undefined}><span className="ll-voie-in">{ic}</span></span>
      <span className="ll-voie-bd" aria-hidden="true"/>
      {!seul&&<span className="ll-voie-lb"><span className="ll-voie-in">{children}</span></span>}
    </Tag>;
  }
  const s={...llBtnBase,...llBtnSizes[size],...llBtnVariants[variant],
    ...(survol&&!disabled?llBtnHover[variant]:null),
    ...(capitales?{textTransform:'uppercase',letterSpacing:'.14em',fontSize:size==='s'?'11px':'12px',fontWeight:600}:null),
    ...(pleineLargeur?{width:'100%'}:null),
    ...(appui&&!disabled?{transform:'translateY(1px)'}:null),
    ...(disabled?{opacity:.45,cursor:'not-allowed'}:null),...style};
  const fleche=!!(iconeApres&&iconeApres.props&&/^(arrow|chevron)/.test(iconeApres.props.name||''));
  return <Tag className={['ll-btn','ll-btn-'+variant,className].filter(Boolean).join(' ')} href={href} disabled={Tag==='button'?disabled:undefined} style={s}
    onMouseEnter={()=>setSurvol(true)} onMouseLeave={()=>{setSurvol(false);setAppui(false)}}
    onMouseDown={()=>setAppui(true)} onMouseUp={()=>setAppui(false)} {...rest}>
    {iconeAvant}{children}{fleche?<span className="ll-btn-fleche" style={{display:'inline-flex'}}>{iconeApres}</span>:iconeApres}
  </Tag>;
}
