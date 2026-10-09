/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';
import { Icon } from '../brand/Icon.jsx';
import { Button, FormeBoutonContexte } from '../core/Button.jsx';

/* Panneau de conversation de Cléo. Messages texte + « cartes » riches dans le fil :
   logements, créneaux, résumé de demande, passage à une personne. Les actions rapides
   du départ (chips) disparaissent dès le premier échange. */
function llBulle(role){
  return role==='agent'
    ?{background:'var(--gris-050)',color:'var(--texte-titre)',borderRadius:'16px 16px 16px 4px',alignSelf:'flex-start'}
    :{background:'var(--marine-900)',color:'#fff',borderRadius:'16px 16px 4px 16px',alignSelf:'flex-end'};
}
const REF={fontSize:'11px',fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--texte-discret)'};

function Portrait({avatar,taille=28}){
  return avatar?<img src={avatar} alt="" style={{width:taille,height:taille,borderRadius:'50%',objectFit:'cover',flex:'none',display:'block'}}/>
    :<span style={{width:taille,height:taille,borderRadius:'50%',background:'var(--degrade-chevron)',display:'grid',placeItems:'center',flex:'none'}}>
      <Icon name="sparkles" size={taille*.5} color="var(--marine-900)"/></span>;
}

function CarteLogements({items=[],onLogement}){
  return <div style={{display:'grid',gap:'8px',alignSelf:'stretch'}}>
    {items.map((l,i)=><button key={i} onClick={()=>onLogement&&onLogement(l)}
      style={{display:'grid',gridTemplateColumns:'72px minmax(0,1fr) auto',gap:'12px',alignItems:'center',padding:'8px',textAlign:'left',cursor:'pointer',
        background:'var(--gris-000)',border:'1px solid var(--bordure-fine)',borderRadius:'var(--rayon-3)',fontFamily:'var(--police-corps)',transition:'var(--transition-interface)'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--bleu-300)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--bordure-fine)'}>
      <span style={{width:'72px',height:'56px',borderRadius:'var(--rayon-2)',overflow:'hidden',background:'var(--gris-100)',display:'block'}}>
        {l.photo&&<img src={l.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>}</span>
      <span style={{minWidth:0}}>
        <span style={{display:'block',fontSize:'13.5px',fontWeight:600,color:'var(--marine-900)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.titre}</span>
        <span style={{display:'block',fontSize:'12px',color:'var(--texte-discret)',marginTop:'2px'}}>{l.detail}</span>
      </span>
      <span style={{fontFamily:'var(--police-titre)',fontSize:'14px',fontWeight:700,color:'var(--marine-900)',whiteSpace:'nowrap'}}>{l.prix}</span>
    </button>)}
  </div>;
}
function CarteCreneaux({creneaux=[],onCreneau}){
  return <div style={{alignSelf:'stretch',border:'1px solid var(--bordure-fine)',borderRadius:'var(--rayon-3)',padding:'14px',background:'var(--gris-000)'}}>
    <div style={{display:'flex',alignItems:'center',gap:'8px',...REF,color:'var(--marine-900)',marginBottom:'10px'}}>
      <Icon name="calendar-check" size={14} color="var(--bleu-500)"/>Créneaux libres</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
      {creneaux.map((c,i)=><button key={i} onClick={()=>onCreneau&&onCreneau(c)}
        style={{padding:'10px 12px',borderRadius:'var(--rayon-2)',border:'1px solid var(--bordure)',background:'var(--gris-000)',cursor:'pointer',
          fontFamily:'var(--police-corps)',fontSize:'12.5px',color:'var(--marine-900)',textAlign:'left',lineHeight:1.3,transition:'var(--transition-interface)'}}
        onMouseEnter={e=>{e.currentTarget.style.background='var(--bleu-025)';e.currentTarget.style.borderColor='var(--bleu-300)'}}
        onMouseLeave={e=>{e.currentTarget.style.background='var(--gris-000)';e.currentTarget.style.borderColor='var(--bordure)'}}>
        <span style={{display:'block',fontWeight:600}}>{c.jour}</span>
        <span style={{color:'var(--texte-discret)'}}>{c.heure}</span></button>)}
    </div>
  </div>;
}
function CarteResume({titre,lignes=[],etat,note}){
  return <div style={{alignSelf:'stretch',border:'1px solid var(--bordure-fine)',borderRadius:'var(--rayon-3)',overflow:'hidden',background:'var(--gris-000)'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',padding:'12px 14px',background:'var(--bleu-025)'}}>
      <span style={{display:'inline-flex',alignItems:'center',gap:'8px',fontSize:'13px',fontWeight:600,color:'var(--marine-900)'}}>
        <Icon name="circle-check" size={15} color="var(--succes-500)"/>{titre}</span>
      {etat&&<span style={{...REF,color:'var(--bleu-700)'}}>{etat}</span>}
    </div>
    <dl style={{margin:0,padding:'6px 14px',display:'grid',gridTemplateColumns:'auto 1fr',gap:'6px 16px',fontSize:'12.5px'}}>
      {lignes.map(([k,v])=><React.Fragment key={k}><dt style={{color:'var(--texte-discret)',margin:0}}>{k}</dt><dd style={{margin:0,color:'var(--marine-900)',fontWeight:500}}>{v}</dd></React.Fragment>)}
    </dl>
    {note&&<div style={{padding:'8px 14px 12px',fontSize:'12px',color:'var(--texte-discret)',lineHeight:1.45}}>{note}</div>}
  </div>;
}
function CarteHumain({nom,role,delai,onAppel}){
  return <div style={{alignSelf:'stretch',display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',border:'1px solid var(--bordure-fine)',borderRadius:'var(--rayon-3)',background:'var(--gris-000)'}}>
    <span style={{width:'38px',height:'38px',borderRadius:'50%',background:'var(--marine-900)',color:'#fff',display:'grid',placeItems:'center',fontSize:'12.5px',fontWeight:600,flex:'none'}}>
      {nom.split(' ').map(x=>x[0]).join('').slice(0,2)}</span>
    <span style={{flex:1,minWidth:0}}>
      <span style={{display:'block',fontSize:'13.5px',fontWeight:600,color:'var(--marine-900)'}}>{nom}</span>
      <span style={{display:'block',fontSize:'12px',color:'var(--texte-discret)'}}>{role} · {delai}</span></span>
    <Button size="s" variant="secondaire" onClick={onAppel} iconeAvant={<Icon name="phone" size={14}/>}>Rappel</Button>
  </div>;
}

function AIAgentPanelBase({messages=[],suggestions=[],actions=[],creneaux=[],saisie='',onSaisie,onEnvoi,onSuggestion,onAction,onCreneau,onLogement,
  onClose,onHumain,nom='Cléo',statut='Répond en quelques secondes',ecrit=false,largeur=400,hauteur=620,avatar,mentionAutomatisee=true,style}){
  const fin=React.useRef(null);
  React.useEffect(()=>{if(fin.current)fin.current.parentNode.scrollTop=fin.current.parentNode.scrollHeight},[messages,ecrit,creneaux]);
  const debut=messages.filter(m=>m.role==='client').length===0;
  return <section aria-label={'Conversation avec '+nom} style={{width:largeur+'px',height:hauteur+'px',maxHeight:'calc(100vh - 120px)',display:'flex',flexDirection:'column',
    background:'var(--gris-000)',borderRadius:'var(--rayon-5)',overflow:'hidden',boxShadow:'var(--ombre-5)',border:'1px solid var(--bordure-fine)',...style}}>
    <header style={{position:'relative',padding:'14px 16px 14px 18px',background:'var(--degrade-marine)',flex:'none'}}>
      <div className="ll-grille" style={{position:'absolute',inset:0,opacity:.7}}/>
      <div style={{position:'relative',display:'flex',alignItems:'center',gap:'12px'}}>
        <span style={{position:'relative',flex:'none'}}>
          <Portrait avatar={avatar} taille={44}/>
          <span aria-hidden="true" style={{position:'absolute',right:0,bottom:0,width:'12px',height:'12px',borderRadius:'50%',background:'var(--bleu-500)',border:'2px solid #0F2440'}}/>
        </span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:'var(--police-titre)',fontSize:'17px',fontWeight:700,color:'#fff',lineHeight:1.2}}>{nom}</div>
          <div style={{fontSize:'12px',color:'var(--bleu-200)',marginTop:'2px'}}>{statut}</div>
        </div>
        {onHumain&&<button onClick={onHumain} title="Parler à une personne" aria-label="Parler à une personne"
          style={{height:'34px',padding:'0 12px',border:'1px solid rgba(255,255,255,.3)',borderRadius:'var(--rayon-pilule)',background:'transparent',color:'#fff',cursor:'pointer',
            display:'inline-flex',alignItems:'center',gap:'7px',fontFamily:'var(--police-corps)',fontSize:'12.5px',fontWeight:600}}>
          <Icon name="headset" size={14} color="#fff"/>Une personne</button>}
        {onClose&&<button onClick={onClose} aria-label="Fermer la conversation"
          style={{width:'34px',height:'34px',border:0,borderRadius:'50%',background:'transparent',color:'#fff',cursor:'pointer',display:'grid',placeItems:'center'}}>
          <Icon name="x" size={19} color="#fff"/></button>}
      </div>
    </header>
    <div style={{flex:1,overflowY:'auto',padding:'18px',display:'flex',flexDirection:'column',gap:'10px',background:'var(--gris-000)'}}>
      {mentionAutomatisee&&<div style={{alignSelf:'center',display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'11.5px',color:'var(--texte-discret)',marginBottom:'4px'}}>
        <Icon name="bot" size={13} color="var(--texte-discret)"/>Agent IA · une personne peut prendre le relais à tout moment</div>}
      {messages.map((m,i)=>{
        if(m.type==='logements')return <CarteLogements key={i} items={m.items} onLogement={onLogement}/>;
        if(m.type==='resume')return <CarteResume key={i} titre={m.titre} lignes={m.lignes} etat={m.etat} note={m.note}/>;
        if(m.type==='humain')return <CarteHumain key={i} nom={m.nom} role={m.role} delai={m.delai} onAppel={m.onAppel}/>;
        const agent=m.role==='agent', suivant=messages[i+1], groupe=suivant&&suivant.role==='agent'&&!suivant.type;
        return <div key={i} style={{display:'flex',gap:'8px',alignItems:'flex-end',alignSelf:agent?'flex-start':'flex-end',maxWidth:'88%'}}>
          {agent&&<span style={{width:'28px',flex:'none',visibility:groupe?'hidden':'visible'}}><Portrait avatar={avatar} taille={28}/></span>}
          <div style={{padding:'10px 14px',fontSize:'13.5px',lineHeight:1.55,...llBulle(m.role)}}>{m.texte}</div>
        </div>;})}
      {ecrit&&<div style={{display:'flex',gap:'8px',alignItems:'flex-end',alignSelf:'flex-start'}}>
        <Portrait avatar={avatar} taille={28}/>
        <div style={{padding:'12px 14px',display:'flex',gap:'4px',...llBulle('agent')}}>
          {[0,1,2].map(i=><span key={i} style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--gris-400)',animation:'llPoint 1.1s '+(i*0.15)+'s infinite ease-in-out'}}/>)}
          <style>{'@keyframes llPoint{0%,60%,100%{opacity:.3}30%{opacity:1}}'}</style>
        </div></div>}
      {creneaux.length>0&&<CarteCreneaux creneaux={creneaux} onCreneau={onCreneau}/>}
      {debut&&actions.length>0&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginTop:'6px',alignSelf:'stretch'}}>
        {actions.map((a,i)=><button key={i} onClick={()=>onAction&&onAction(a)}
          style={{display:'grid',gap:'8px',padding:'12px',textAlign:'left',border:'1px solid var(--bordure-fine)',borderRadius:'var(--rayon-3)',background:'var(--gris-000)',cursor:'pointer',
            fontFamily:'var(--police-corps)',transition:'var(--transition-interface)'}}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--bleu-025)';e.currentTarget.style.borderColor='var(--bleu-300)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='var(--gris-000)';e.currentTarget.style.borderColor='var(--bordure-fine)'}}>
          <Icon name={a.icone} size={18} color="var(--bleu-600)"/>
          <span style={{fontSize:'13px',fontWeight:600,color:'var(--marine-900)',lineHeight:1.3}}>{a.titre}</span>
        </button>)}
      </div>}
      <div ref={fin}/>
    </div>
    {suggestions.length>0&&<div style={{display:'flex',gap:'8px',padding:'0 18px 12px',flexWrap:'wrap',flex:'none'}}>
      {suggestions.map((s,i)=><button key={i} onClick={()=>onSuggestion&&onSuggestion(s)}
        style={{height:'30px',padding:'0 12px',borderRadius:'var(--rayon-pilule)',border:'1px solid var(--bleu-100)',background:'var(--bleu-025)',color:'var(--bleu-700)',cursor:'pointer',
          fontFamily:'var(--police-corps)',fontSize:'12.5px',fontWeight:500}}>{s}</button>)}
    </div>}
    <form onSubmit={e=>{e.preventDefault();onEnvoi&&onEnvoi()}}
      style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 14px',borderTop:'1px solid var(--bordure-fine)',background:'var(--surface-douce)',flex:'none'}}>
      <button type="button" aria-label="Joindre une photo" title="Joindre une photo"
        style={{width:'40px',height:'40px',flex:'none',border:0,borderRadius:'50%',background:'transparent',cursor:'pointer',display:'grid',placeItems:'center',color:'var(--texte-discret)'}}>
        <Icon name="paperclip" size={18}/></button>
      <input value={saisie} onChange={e=>onSaisie&&onSaisie(e.target.value)} placeholder="Écrivez à Cléo…" aria-label={'Message à '+nom}
        style={{flex:1,minWidth:0,height:'42px',padding:'0 16px',borderRadius:'var(--rayon-pilule)',border:'1px solid var(--bordure)',outline:0,background:'var(--gris-000)',
          fontFamily:'var(--police-corps)',fontSize:'13.5px',color:'var(--texte-titre)'}}/>
      <Button type="submit" variant="primaire" aria-label="Envoyer" style={{width:'42px',height:'42px',padding:0,borderRadius:'var(--rayon-pilule)'}}>
        <Icon name="send" size={17} color="#fff"/></Button>
    </form>
  </section>;
}

/* Le fil de conversation garde ses pilules, quelle que soit la forme des boutons de la page. */
export function AIAgentPanel(props){return <FormeBoutonContexte.Provider value={null}><AIAgentPanelBase {...props}/></FormeBoutonContexte.Provider>}
