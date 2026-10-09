const { Logo, Icon, IconButton, Button, Badge, StatusPill, Input, Select, Tag, Switch, Dialog } = window.LeaseLaneDesignSystem_b7a479;
const BASE_LOGO='../../assets/logo/';

/* Chrome commun aux espaces propriétaire et locataire (grammaire relevée dans DESIGN-admin.md, jetons Lease Lane).
   Rail clair ou marine, condensable ; barre de page avec notifications et menu de compte ; pièces de tableau de bord. */
const FILET='1px solid var(--bordure-portail, var(--bordure-fine))';
const CARTE={background:'var(--gris-000)',border:FILET,borderRadius:'var(--rayon-carte)'};
const CHIFFRE={fontFamily:'var(--police-titre)',fontWeight:600,fontVariantNumeric:'tabular-nums',letterSpacing:'-0.01em',color:'var(--marine-900)'};
const REF={fontSize:'12px',fontWeight:500,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--texte-discret)'};
const chiffre=(taille,extra)=>({...CHIFFRE,fontSize:taille,...extra});

function useReglages(cle){
  const lire=()=>{try{return JSON.parse(localStorage.getItem(cle))||{}}catch(e){return {}}};
  const [r,setR]=React.useState(lire);
  const set=p=>setR(prev=>{const n={...prev,...p};localStorage.setItem(cle,JSON.stringify(n));return n});
  const apparence=r.apparence||'clair';
  React.useEffect(()=>{document.documentElement.setAttribute('data-theme',apparence==='sombre'?'sombre':'clair')},[apparence]);
  return [{theme:r.theme||'clair',condense:!!r.condense,apparence},set];
}

/* Liens légaux visibles depuis chaque écran connecté (rail + menu de compte). À valider par l'avocat. */
const BASE_SITE='../site-public/index.html#';
const LIENS_LEGAUX=[['/conditions-utilisation','Conditions d’utilisation'],['/confidentialite','Politique de confidentialité'],['/temoins','Témoins de navigation'],['/gouvernance','Gouvernance des renseignements personnels']];
const responsablePRP=()=>(window.LL_ADMIN&&window.LL_ADMIN.responsable)||'Steven Paradis · steven@leaselane.ca';
function LiensLegaux({ton='clair',taille=12}){
  const [ouvert,setOuvert]=React.useState(false);
  const c=ton==='marine'?'var(--bleu-100)':'var(--texte-discret)';
  const st={fontSize:taille+'px',fontWeight:500,color:c,textDecoration:'none',lineHeight:1.45,background:'none',border:0,padding:0,cursor:'pointer',fontFamily:'var(--police-corps)',textAlign:'left'};
  return <nav aria-label="Information légale" style={{display:'flex',flexWrap:'wrap',gap:'4px 12px'}}>
    {LIENS_LEGAUX.map(([to,t])=><a key={to} href={BASE_SITE+to} target="_blank" rel="noopener" style={st}>{t}</a>)}
    <button type="button" onClick={()=>setOuvert(true)} style={st}>Responsable de la protection</button>
    <Dialog ouvert={ouvert} onClose={()=>setOuvert(false)} surtitre="Loi 25, art. 3.1" titre="Responsable de la protection des renseignements personnels" largeur={460}
      actions={<Button variant="secondaire" onClick={()=>setOuvert(false)}>Fermer</Button>}>
      {/* À valider par l'avocat */}
      <div style={{display:'grid',gap:'12px',fontSize:'14px',lineHeight:1.6,color:'var(--texte-corps)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',fontWeight:600,color:'var(--marine-900)'}}><Icon name="shield-check" size={18} color="var(--bleu-600)"/>{responsablePRP()}</div>
        <p style={{margin:0}}>Pour toute question sur vos renseignements personnels, ou pour exercer vos droits d'accès, de rectification ou de retrait, écrivez à cette personne.</p></div>
    </Dialog></nav>;
}

/* Pied de page des portails : liens légaux au bas de chaque écran connecté. À valider par l'avocat. */
function PiedPortail(){
  const [ouvert,setOuvert]=React.useState(false);
  const lien={display:'inline-flex',alignItems:'center',height:'24px',padding:'0 9px',borderRadius:'999px',fontSize:'9.4px',fontWeight:500,color:'var(--marine-900)',textDecoration:'none',background:'transparent',border:0,cursor:'pointer',fontFamily:'var(--police-corps)',transition:'var(--transition-interface)'};
  const survol={onMouseEnter:e=>e.currentTarget.style.background='var(--gris-000)',onMouseLeave:e=>e.currentTarget.style.background='transparent'};
  return <footer style={{marginTop:'48px',paddingTop:'20px',borderTop:FILET,display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'12px 24px'}}>
    <div style={{display:'flex',alignItems:'center',gap:'8px',minWidth:0}}>
      <span style={{width:'19px',height:'19px',flex:'none',borderRadius:'999px',background:'var(--gris-000)',border:FILET,display:'grid',placeItems:'center'}}><Icon name="shield-check" size={9} color="var(--bleu-600)"/></span>
      <span style={{fontSize:'9.4px',fontWeight:480,color:'var(--marine-900)',lineHeight:1.35}}>Vos renseignements sont protégés</span></div>
    <nav aria-label="Information légale" style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'flex-end',gap:'2px',marginLeft:'auto',marginRight:'-9px'}}>
      {LIENS_LEGAUX.map(([to,t])=><a key={to} href={BASE_SITE+to} target="_blank" rel="noopener" style={lien} {...survol}>{t}</a>)}
      <span style={{display:'inline-flex',alignItems:'center',height:'24px',padding:'0 9px',fontSize:'9.4px',fontWeight:500,color:'var(--texte-discret)',fontFamily:'var(--police-corps)'}}>© 2026 Solutions locatives Lease Lane · Loi 25</span>
      <button type="button" onClick={()=>setOuvert(true)} style={{...lien,gap:'6px',color:'var(--bleu-600)',fontWeight:600}} {...survol}><Icon name="user" size={10.5} color="currentColor"/>Responsable de la protection</button>
    </nav>
    <Dialog ouvert={ouvert} onClose={()=>setOuvert(false)} surtitre="Loi 25, art. 3.1" titre="Responsable de la protection des renseignements personnels" largeur={460}
      actions={<Button variant="secondaire" onClick={()=>setOuvert(false)}>Fermer</Button>}>
      <div style={{display:'grid',gap:'12px',fontSize:'14px',lineHeight:1.6,color:'var(--texte-corps)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',fontWeight:600,color:'var(--marine-900)'}}><Icon name="shield-check" size={18} color="var(--bleu-600)"/>{responsablePRP()}</div>
        <p style={{margin:0}}>Pour toute question sur vos renseignements personnels, ou pour exercer vos droits d'accès, de rectification ou de retrait, écrivez à cette personne.</p></div>
    </Dialog>
  </footer>;
}

/* Mes renseignements personnels : cinq actions, chacune inscrite au registre Loi 25 avec une échéance de 30 jours. */
const ACTIONS_RP=[
  ['download','Télécharger mes renseignements','Portabilité (export structuré)'],
  ['pencil','Demander une correction','Rectification'],
  ['circle-x','Retirer un consentement','Retrait du consentement (infolettre, offres)','Infolettre, offres'],
  ['refresh-cw','Demander la révision d’une décision automatisée de Cléo','Révision d’une décision automatisée (Cléo)'],
  ['trash-2','Demander la suppression','Suppression','Certains documents, comme le bail et les reçus, sont conservés 3 ans après la fin du bail.']];
function MesRenseignements({ouvert,onClose,utilisateur}){
  const [faite,setFaite]=React.useState(null);
  React.useEffect(()=>{if(ouvert)setFaite(null)},[ouvert]);
  const profil=window.LL_LOC?'locataire':'propriétaire';
  const ech=window.LLLoi25?window.LLLoi25.echeance():null;
  return <Dialog ouvert={ouvert} onClose={onClose} surtitre="Loi 25" titre="Mes renseignements personnels" largeur={560} actions={<Button variant="secondaire" onClick={onClose}>Fermer</Button>}>
    <div style={{display:'grid',gap:'14px'}}>
      <p style={{fontSize:'14px',margin:0,color:'var(--texte-discret)',lineHeight:1.55}}>Chaque demande est inscrite au registre et reçoit une réponse dans les 30 jours{ech?' (au plus tard le '+window.LLLoi25.fmt(ech)+' '+ech.getFullYear()+')':''}.</p>
      <div style={{...CARTE,overflow:'hidden'}}>{ACTIONS_RP.map(([ic,t,type,note],i)=><button key={t} type="button" disabled={!!faite&&faite.type===type}
        onClick={()=>{const d=window.LLLoi25&&window.LLLoi25.ajouter({type,qui:utilisateur.nom+' ('+profil+')'});setFaite(d||{type,id:'—',echeance:'—'})}}
        style={{display:'grid',gridTemplateColumns:'36px minmax(0,1fr) auto',gap:'12px',alignItems:'center',width:'100%',padding:'14px 16px',border:0,borderTop:i?FILET:0,background:'transparent',cursor:'pointer',textAlign:'left',fontFamily:'var(--police-corps)'}}
        onMouseEnter={e=>e.currentTarget.style.background='var(--surface-douce)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
        <span style={{width:'36px',height:'36px',borderRadius:'999px',background:'var(--surface-douce)',display:'grid',placeItems:'center'}}><Icon name={ic} size={16} color="var(--marine-900)"/></span>
        <span><span style={{display:'block',fontSize:'14px',fontWeight:600,color:'var(--marine-900)'}}>{t}</span>
          {/* À valider par l'avocat */}{note&&<span style={{display:'block',fontSize:'12.5px',color:'var(--texte-discret)',marginTop:'2px',lineHeight:1.45}}>{note}</span>}</span>
        <span style={{fontSize:'12px',fontWeight:500,color:'var(--texte-discret)',whiteSpace:'nowrap'}}>{faite&&faite.type===type?'Envoyée':'30 jours'}</span></button>)}</div>
      {faite&&<div role="status" style={{display:'flex',gap:'12px',alignItems:'flex-start',padding:'14px 16px',background:'var(--bleu-025)',borderRadius:'var(--rayon-3)',fontSize:'13.5px',lineHeight:1.55}}>
        <Icon name="circle-check" size={18} color="var(--succes-600)" style={{flex:'none',marginTop:'1px'}}/><span>Demande {faite.id} inscrite au registre. Échéance : <strong>{faite.echeance}</strong>.</span></div>}
    </div></Dialog>;
}

function Rail({nav,page,aller,theme='clair',condense=false,badges={},utilisateur,pied,sombre=false,logoSrc,sansCarteUtilisateur=false}){
  const marine=theme==='marine';
  const c={fond:marine?(sombre?'var(--marine-950)':'var(--marine-900)'):'var(--gris-000)',filet:marine?'1px solid rgba(200,218,240,.14)':FILET,
    texte:marine?'#fff':'var(--marine-900)',pale:marine?'var(--bleu-100)':'var(--texte-discret)',
    actif:marine?'rgba(255,255,255,.12)':(sombre?'var(--bleu-500)':'var(--marine-900)'),actifTexte:sombre&&!marine?'#fff':(marine?'#fff':'#fff'),survol:marine?'rgba(255,255,255,.06)':'var(--surface-douce)'};
  const w=condense?72:248;
  return <aside className="ll-rail" style={{width:w+'px',flex:'none',display:'flex',flexDirection:'column',background:c.fond,borderRight:c.filet,
    transition:'width var(--duree-3) var(--courbe-sortie)',overflow:'hidden'}}>
    <div style={{height:'72px',display:'flex',alignItems:'center',justifyContent:condense?'center':'flex-start',padding:condense?0:'0 20px',borderBottom:c.filet,flex:'none'}}>
      {condense?<span style={{width:'38px',height:'38px',borderRadius:'var(--rayon-2)',background:marine?'#fff':'var(--marine-900)',display:'grid',placeItems:'center'}}>
        <Icon name="chevrons-up" size={19} color={marine?'var(--marine-900)':'#fff'}/></span>
        :(logoSrc&&!marine&&!sombre)?<img src={logoSrc} alt="Lease Lane" width="152" height="47" style={{display:'block',height:'47px',width:'auto',maxWidth:'100%'}}/>:<Logo base={BASE_LOGO} fond={(marine||sombre)?'marine':'blanc'} hauteur={48}/>}
    </div>
    <nav style={{display:'grid',gap:'2px',padding:condense?'16px 12px':'16px 12px',alignContent:'start'}} aria-label="Sections">
      {nav.map(([k,ic,t])=>{const actif=page===k; const n=badges[k];
        return <button key={k} onClick={()=>aller(k)} aria-current={actif?'page':undefined} title={t}
          style={{display:'flex',alignItems:'center',justifyContent:condense?'center':'flex-start',gap:'12px',height:'44px',padding:condense?0:'0 12px',border:0,borderRadius:'var(--rayon-2)',cursor:'pointer',textAlign:'left',
            background:actif?c.actif:'transparent',color:actif?c.actifTexte:c.texte,position:'relative',
            fontFamily:'var(--police-corps)',fontSize:'14px',fontWeight:actif?600:500,transition:'var(--transition-interface)',whiteSpace:'nowrap'}}
          onMouseEnter={e=>{if(!actif)e.currentTarget.style.background=c.survol}}
          onMouseLeave={e=>{if(!actif)e.currentTarget.style.background='transparent'}}>
          <Icon name={ic} size={18} color={actif?c.actifTexte:c.texte}/>
          {!condense&&<span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis'}}>{t}</span>}
          {n>0&&(condense
            ?<span style={{position:'absolute',top:'8px',right:'10px',width:'7px',height:'7px',borderRadius:'50%',background:'var(--bleu-500)',boxShadow:'0 0 0 2px '+c.fond}}/>
            :<span style={{fontSize:'12.5px',fontWeight:600,fontVariantNumeric:'tabular-nums',lineHeight:1,padding:'0 2px',
              color:actif?c.actifTexte:(marine?'var(--bleu-200)':'var(--bleu-600)')}}>{n}</span>)}
        </button>;})}
    </nav>
    <div style={{flex:1}}/>
    {pied&&!condense&&<div style={{margin:'12px',padding:'14px 16px',background:marine?'rgba(255,255,255,.06)':'var(--surface-douce)',borderRadius:'var(--rayon-3)',color:c.texte}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',...REF,color:c.texte}}><Icon name="shield-check" size={14}/>{pied.titre}</div>
      <p style={{fontSize:'12.5px',margin:'8px 0 0',lineHeight:1.5,color:c.pale}}>{pied.texte}</p></div>}
    {!sansCarteUtilisateur&&<div style={{display:'flex',alignItems:'center',justifyContent:condense?'center':'flex-start',gap:'12px',padding:condense?'16px 0':'16px 20px',borderTop:c.filet}}>
      <span style={{width:'36px',height:'36px',flex:'none',borderRadius:'999px',background:marine?'#fff':'var(--marine-900)',color:marine?'var(--marine-900)':'#fff',display:'grid',placeItems:'center',fontSize:'12.5px',fontWeight:600}}>{utilisateur.initiales}</span>
      {!condense&&<span style={{lineHeight:1.3,minWidth:0}}>
        <span style={{display:'block',fontSize:'13.5px',fontWeight:600,color:c.texte,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{utilisateur.nom}</span>
        <span style={{display:'block',fontSize:'12px',color:c.pale,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{utilisateur.sous}</span></span>}
    </div>}
  </aside>;
}

function Menu({ouvert,onClose,largeur=320,children,align='right'}){
  React.useEffect(()=>{if(!ouvert)return;const f=e=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f)},[ouvert]);
  if(!ouvert)return null;
  return <React.Fragment>
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:70}}/>
    <div role="menu" style={{position:'absolute',top:'calc(100% + 8px)',[align]:0,width:largeur+'px',zIndex:71,...CARTE,boxShadow:'var(--ombre-4)',overflow:'hidden'}}>{children}</div>
  </React.Fragment>;
}

function Barre({titre,sousTitre,actions,aCote,menuCompte,notifications=[],utilisateur,reglages,setReglages,onDeconnexion}){
  const [notif,setNotif]=React.useState(false), [compte,setCompte]=React.useState(false), [rp,setRp]=React.useState(false);
  const nonLues=notifications.filter(n=>!n.lu).length;
  const ligne=(ic,t,fn)=><button key={t} onClick={fn} style={{display:'flex',alignItems:'center',gap:'12px',width:'100%',height:'42px',padding:'0 16px',border:0,background:'transparent',
    cursor:'pointer',fontFamily:'var(--police-corps)',fontSize:'14px',color:'var(--marine-900)',textAlign:'left'}}
    onMouseEnter={e=>e.currentTarget.style.background='var(--surface-douce)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
    <Icon name={ic} size={16}/>{t}</button>;
  const seg=(label,opts,val,fn)=><div style={{display:'grid',gap:'8px'}}><span style={REF}>{label}</span>
    <div style={{display:'flex',padding:'3px',border:FILET,borderRadius:'999px'}}>{opts.map(([k,t])=><button key={k} onClick={()=>fn(k)} aria-pressed={val===k}
      style={{flex:1,height:'28px',border:0,borderRadius:'999px',cursor:'pointer',fontFamily:'var(--police-corps)',fontSize:'12.5px',fontWeight:600,
        background:val===k?'var(--marine-900)':'transparent',color:val===k?'#fff':'var(--marine-900)'}}>{t}</button>)}</div></div>;
  return <header style={{height:'72px',flex:'none',display:'flex',alignItems:'center',gap:'12px',padding:'0 32px',borderBottom:FILET,background:'var(--gris-000)',position:'relative',zIndex:50}}>
    <button onClick={()=>setReglages({condense:!reglages.condense})} aria-label={reglages.condense?'Déployer le rail':'Condenser le rail'} title={reglages.condense?'Déployer le rail':'Condenser le rail'}
      style={{width:'40px',height:'40px',flex:'none',marginLeft:'-4px',border:0,borderRadius:'var(--rayon-2)',background:'var(--marine-900)',color:'#fff',display:'grid',placeItems:'center',cursor:'pointer',transition:'var(--transition-interface)'}}
      onMouseEnter={e=>e.currentTarget.style.background='var(--marine-600)'} onMouseLeave={e=>e.currentTarget.style.background='var(--marine-900)'}>
      <Icon name="panel-left" size={19} color="#fff"/></button>
    <div style={{flex:1,minWidth:0,display:'flex',alignItems:'center',gap:'16px'}}>
      <h1 style={{fontSize:'22px',lineHeight:1.2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:0}}>{titre}</h1>{aCote}
    </div>
    {actions}
    <span style={{position:'relative'}}>
      <IconButton etiquette="Notifications" onClick={()=>{setNotif(!notif);setCompte(false)}} aria-expanded={notif}><Icon name="bell" size={19}/></IconButton>
      {nonLues>0&&<span style={{position:'absolute',top:'9px',right:'9px',width:'8px',height:'8px',borderRadius:'50%',background:'var(--bleu-500)',border:'2px solid var(--gris-000)',pointerEvents:'none'}}/>}
      <Menu ouvert={notif} onClose={()=>setNotif(false)} largeur={380}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:FILET}}>
          <span style={{fontSize:'15px',fontWeight:600,color:'var(--marine-900)'}}>Notifications</span>
          <span style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{nonLues} non lues</span></div>
        <div style={{maxHeight:'380px',overflowY:'auto'}}>
          {notifications.map((n,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'36px minmax(0,1fr)',gap:'12px',padding:'14px 20px',borderBottom:FILET,background:n.lu?'transparent':'var(--bleu-025)'}}>
            <span style={{width:'36px',height:'36px',borderRadius:'999px',background:'var(--surface-douce)',display:'grid',placeItems:'center'}}><Icon name={n.icone||'bell'} size={16} color="var(--marine-900)"/></span>
            <span><span style={{display:'block',fontSize:'13.5px',color:'var(--marine-900)',fontWeight:n.lu?500:600,lineHeight:1.4}}>{n.texte}</span>
              <span style={{display:'block',fontSize:'12px',color:'var(--texte-discret)',marginTop:'3px'}}>{n.quand}</span></span></div>)}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'10px 12px'}}>
          <Button size="s" variant="fantome">Tout marquer lu</Button><Button size="s" variant="fantome" iconeApres={<Icon name="arrow-right" size={14}/>}>Tout voir</Button></div>
      </Menu>
    </span>
    <span style={{position:'relative'}}>
      <button onClick={()=>{setCompte(!compte);setNotif(false)}} aria-expanded={compte} aria-label="Compte"
        style={{display:'flex',alignItems:'center',gap:'10px',height:'44px',padding:'0 6px 0 4px',border:0,borderRadius:'999px',background:'transparent',cursor:'pointer',fontFamily:'var(--police-corps)'}}>
        <span style={{width:'36px',height:'36px',borderRadius:'999px',background:'var(--marine-900)',color:'#fff',display:'grid',placeItems:'center',fontSize:'12.5px',fontWeight:600}}>{utilisateur.initiales}</span>
        <Icon name="chevron-down" size={15} color="var(--marine-900)"/></button>
      <Menu ouvert={compte} onClose={()=>setCompte(false)} largeur={menuCompte?340:300}>{menuCompte?menuCompte(()=>setCompte(false)):<React.Fragment>
        <div style={{padding:'16px 20px',borderBottom:FILET}}>
          <div style={{fontSize:'15px',fontWeight:600,color:'var(--marine-900)'}}>{utilisateur.nom}</div>
          <div style={{fontSize:'12.5px',color:'var(--texte-discret)',marginTop:'2px'}}>{utilisateur.courriel}</div></div>
        <div style={{padding:'8px 0',borderBottom:FILET}}>
          {ligne('user','Mon profil',()=>setCompte(false))}{ligne('settings','Préférences et avis',()=>setCompte(false))}{ligne('lock','Sécurité et connexion',()=>setCompte(false))}{ligne('shield-check','Mes renseignements personnels',()=>{setCompte(false);setRp(true)})}{ligne('circle-help','Aide',()=>setCompte(false))}</div>
        <div style={{padding:'16px 20px',borderBottom:FILET}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px'}}>
            <span style={{display:'grid',gap:'2px'}}><span style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'14px',fontWeight:600,color:'var(--marine-900)'}}><Icon name="sun" size={16}/>Mode sombre</span>
              <span style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>Tout le tableau de bord, rail compris</span></span>
            <Switch checked={reglages.apparence==='sombre'} onChange={v=>setReglages({apparence:v?'sombre':'clair'})}/></div></div>
        <div style={{padding:'14px 20px',borderBottom:FILET}}><LiensLegaux/></div>
        <div style={{padding:'8px 0'}}>{ligne('log-out','Se déconnecter',()=>{setCompte(false);onDeconnexion&&onDeconnexion()})}</div></React.Fragment>}
      </Menu>
      <MesRenseignements ouvert={rp} onClose={()=>setRp(false)} utilisateur={utilisateur}/>
    </span>
  </header>;
}

function Carte({titre,sous,action,children,rembourrage=24,style,className}){
  return <section className={className} style={{...CARTE,display:'flex',flexDirection:'column',minWidth:0,...style}}>
    {(titre||action)&&<div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',padding:rembourrage+'px '+rembourrage+'px 0'}}>
      <div style={{minWidth:0}}>
        {titre&&<h2 style={{fontSize:'16px',fontWeight:600,letterSpacing:'-0.01em',lineHeight:1.3}}>{titre}</h2>}
        {sous&&<div style={{fontSize:'13px',color:'var(--texte-discret)',marginTop:'3px'}}>{sous}</div>}
      </div>{action}</div>}
    <div style={{padding:rembourrage+'px',flex:1,minWidth:0}}>{children}</div>
  </section>;
}

function Tuile({libelle,valeur,precision,ton,icone,variation}){
  const urg=ton==='urgence';
  const haut=variation&&variation.startsWith('+'), bas=variation&&variation.startsWith('−');
  return <div style={{...CARTE,padding:'20px',display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:'8px 16px',alignContent:'start',minWidth:0}}>
    <span style={{...REF,lineHeight:'18px',alignSelf:'center',gridColumn:1}}>{libelle}</span>
    {icone&&<span style={{width:'36px',height:'36px',borderRadius:'999px',display:'grid',placeItems:'center',gridColumn:2,gridRow:'1 / span 2',
      background:urg?'var(--urgence-100)':'var(--bleu-025)'}}><Icon name={icone} size={17} color={urg?'var(--urgence-600)':'var(--bleu-600)'}/></span>}
    <div style={{...chiffre('28px',{fontWeight:700,letterSpacing:'-0.02em',lineHeight:'32px',whiteSpace:'nowrap'}),gridColumn:1,color:urg?'var(--urgence-600)':'var(--marine-900)'}}>{valeur}</div>
    {(precision||variation)&&<div style={{gridColumn:'1 / -1',display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',lineHeight:'18px',color:'var(--texte-discret)',flexWrap:'wrap'}}>
      {variation&&<span style={{display:'inline-flex',alignItems:'center',gap:'4px',fontWeight:600,fontVariantNumeric:'tabular-nums',
        color:haut?'var(--succes-600)':bas?'var(--urgence-600)':'var(--marine-900)'}}>
        <Icon name={haut?'trending-up':bas?'trending-down':'minus'} size={14} color="currentColor"/>{variation}</span>}
      {precision&&<span>{precision}</span>}</div>}
  </div>;
}

function Jauge({valeur=0,libelle,sous,taille=132,couleur='var(--bleu-500)'}){
  const r=(taille-14)/2, c=2*Math.PI*r, p=Math.max(0,Math.min(100,valeur));
  return <div style={{display:'grid',justifyItems:'center',gap:'10px',textAlign:'center'}}>
    <div style={{position:'relative',width:taille,height:taille}}>
      <svg width={taille} height={taille} viewBox={'0 0 '+taille+' '+taille} style={{transform:'rotate(-90deg)'}}>
        <circle cx={taille/2} cy={taille/2} r={r} fill="none" stroke="var(--gris-100)" strokeWidth="10"/>
        <circle cx={taille/2} cy={taille/2} r={r} fill="none" stroke={couleur} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c*(1-p/100)} style={{transition:'stroke-dashoffset var(--duree-4) var(--courbe-sortie)'}}/></svg>
      <span style={{position:'absolute',inset:0,display:'grid',placeItems:'center',...chiffre('26px',{fontWeight:700})}}>{Math.round(p)} %</span></div>
    {libelle&&<span style={{fontSize:'14px',fontWeight:600,color:'var(--marine-900)'}}>{libelle}</span>}
    {sous&&<span style={{fontSize:'12.5px',color:'var(--texte-discret)',marginTop:'-6px'}}>{sous}</span>}
  </div>;
}

function GrapheBarres({series=[],hauteur=160,unite='k',compteurs=[],periodes,periode,onPeriode}){
  const max=Math.max(...series.map(s=>s.v),1);
  return <div style={{display:'grid',gap:'20px'}}>
    {periodes&&<div style={{display:'flex',gap:'6px'}}>{periodes.map(p=><Tag key={p} actif={periode===p} onClick={()=>onPeriode&&onPeriode(p)}>{p}</Tag>)}</div>}
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat('+series.length+',minmax(0,1fr))',gap:'12px',alignItems:'end',height:hauteur+'px',borderBottom:'1px solid var(--marine-900)'}}>
        {series.map((s,i)=><div key={s.m} style={{display:'grid',justifyItems:'center',gap:'8px',alignContent:'end',height:'100%'}} title={s.m+' : '+s.v+' '+unite}>
          <span style={chiffre('12px')}>{s.v}{unite==='k'?' k':unite}</span>
          <div style={{width:'100%',maxWidth:'48px',height:Math.max(4,s.v/max*(hauteur-40))+'px',background:i===series.length-1?'var(--bleu-500)':'var(--marine-900)',borderRadius:'3px 3px 0 0'}}/></div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat('+series.length+',minmax(0,1fr))',gap:'12px',marginTop:'8px'}}>
        {series.map(s=><span key={s.m} style={{...REF,textAlign:'center'}}>{s.m}</span>)}</div>
    </div>
    {compteurs.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat('+compteurs.length+',minmax(0,1fr))',gap:'16px',paddingTop:'16px',borderTop:FILET}}>
      {compteurs.map(c=><div key={c.l}><span style={REF}>{c.l}</span>
        <div style={{display:'flex',alignItems:'baseline',gap:'8px',marginTop:'4px'}}>
          <span style={chiffre('18px',{fontWeight:700})}>{c.v}</span>
          {c.var&&<span style={{fontSize:'12.5px',fontWeight:600,color:c.var.startsWith('+')?'var(--succes-600)':'var(--urgence-600)'}}>{c.var}</span>}</div></div>)}</div>}
  </div>;
}

function Progression({items=[]}){
  return <div style={{display:'grid',gap:'14px'}}>
    {items.map(it=><div key={it.l} style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:'6px 12px',alignItems:'center'}}>
      <span style={{fontSize:'14px',color:'var(--marine-900)',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{it.l}</span>
      <span style={chiffre('13.5px')}>{it.d||(it.v+' %')}</span>
      <div style={{gridColumn:'1 / -1',height:'6px',borderRadius:'999px',background:'var(--gris-100)',overflow:'hidden'}}>
        <div style={{width:it.v+'%',height:'100%',background:it.couleur||'var(--bleu-500)',borderRadius:'999px'}}/></div></div>)}
  </div>;
}

function Tableau2({colonnes,lignes,sur,selId}){
  return <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
    <thead><tr>{colonnes.map((c,i)=><th key={c.k} style={{textAlign:c.a||'left',padding:'0 12px 10px',paddingLeft:i===0?0:undefined,paddingRight:i===colonnes.length-1?0:undefined,
      ...REF,borderBottom:FILET,whiteSpace:'nowrap'}}>{c.t}</th>)}</tr></thead>
    <tbody>{lignes.map((l,i)=>{const sel=selId&&l.id===selId;
      return <tr key={l.id||i} onClick={()=>sur&&sur(l)} aria-selected={sel||undefined}
        style={{cursor:sur?'pointer':'default',borderBottom:FILET,background:sel?'var(--bleu-025)':'transparent',transition:'background var(--duree-2) var(--courbe-sortie)'}}
        onMouseEnter={e=>{if(sur&&!sel)e.currentTarget.style.background='var(--surface-survol)'}}
        onMouseLeave={e=>{if(!sel)e.currentTarget.style.background='transparent'}}>
        {colonnes.map((c,j)=><td key={c.k} style={{padding:'14px 12px',paddingLeft:j===0?(sel?'8px':0):undefined,paddingRight:j===colonnes.length-1?0:undefined,
          textAlign:c.a||'left',color:'var(--texte-corps)',verticalAlign:'middle',boxShadow:sel&&j===0?'inset 3px 0 0 var(--bleu-500)':'none'}}>{c.rendu?c.rendu(l):l[c.k]}</td>)}
      </tr>;})}</tbody></table></div>;
}

function Avatar({initiales,photo,taille=40,ton='marine'}){
  return photo?<img src={photo} alt="" style={{width:taille,height:taille,borderRadius:'50%',objectFit:'cover',display:'block',flex:'none'}}/>
    :<span style={{width:taille,height:taille,flex:'none',borderRadius:'50%',display:'grid',placeItems:'center',fontSize:Math.round(taille*.34)+'px',fontWeight:600,
      background:ton==='marine'?'var(--marine-900)':'var(--bleu-025)',color:ton==='marine'?'#fff':'var(--bleu-700)'}}>{initiales}</span>;
}

function FichePersonne({initiales,photo,nom,role,coordonnees=[],actions,note}){
  return <div style={{display:'grid',justifyItems:'center',textAlign:'center',gap:'6px'}}>
    <Avatar initiales={initiales} photo={photo} taille={84}/>
    <div style={{fontSize:'18px',fontWeight:600,color:'var(--marine-900)',marginTop:'10px'}}>{nom}</div>
    <div style={{fontSize:'13px',color:'var(--texte-discret)'}}>{role}</div>
    {coordonnees.length>0&&<div style={{display:'grid',gap:'10px',marginTop:'18px',width:'100%',textAlign:'left'}}>
      {coordonnees.map(([ic,t])=><div key={t} style={{display:'flex',alignItems:'center',gap:'12px',fontSize:'14px',color:'var(--marine-900)',padding:'10px 0',borderTop:FILET}}>
        <Icon name={ic} size={16} color="var(--texte-discret)"/><span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t}</span></div>)}</div>}
    {note&&<p style={{fontSize:'13px',color:'var(--texte-discret)',margin:'12px 0 0',textAlign:'left',width:'100%'}}>{note}</p>}
    {actions&&<div style={{display:'grid',gap:'8px',width:'100%',marginTop:'16px'}}>{actions}</div>}
  </div>;
}

function ZoneDepot({texte='Déposez vos photos ici, ou cliquez pour parcourir',sous='PNG ou JPG · 4:3 recommandé · 10 Mo max.',icone='upload',hauteur=180}){
  const [sur,setSur]=React.useState(false);
  return <div onDragOver={e=>{e.preventDefault();setSur(true)}} onDragLeave={()=>setSur(false)} onDrop={e=>{e.preventDefault();setSur(false)}}
    style={{display:'grid',placeItems:'center',alignContent:'center',gap:'8px',minHeight:hauteur+'px',padding:'24px',textAlign:'center',cursor:'pointer',
      border:'1px dashed '+(sur?'var(--bleu-500)':'var(--gris-300)'),borderRadius:'var(--rayon-3)',background:sur?'var(--bleu-025)':'var(--surface-douce)',transition:'var(--transition-interface)'}}>
    <span style={{width:'44px',height:'44px',borderRadius:'999px',background:'var(--gris-000)',border:FILET,display:'grid',placeItems:'center'}}><Icon name={icone} size={19} color="var(--marine-900)"/></span>
    <span style={{fontSize:'14px',fontWeight:500,color:'var(--marine-900)'}}>{texte}</span>
    <span style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{sous}</span>
  </div>;
}

function Pilules({items=[]}){
  return <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
    {items.map(([ic,t])=><span key={t} style={{display:'inline-flex',alignItems:'center',gap:'8px',height:'34px',padding:'0 14px',borderRadius:'999px',border:FILET,fontSize:'13.5px',fontWeight:500,color:'var(--marine-900)'}}>
      {ic&&<Icon name={ic} size={15} color="var(--texte-discret)"/>}{t}</span>)}</div>;
}

/* Boîte de réception 3 volets : dossiers · liste · lecture. */
function BoiteReception({dossiers=[],dossier,onDossier,items=[],selId,onSel,rendreItem,rendreLecture,actionHaut,hauteur='calc(100vh - 72px - 56px)',vide}){
  return <div className="ll-boite" style={{...CARTE,display:'grid',gridTemplateColumns:'240px 360px minmax(0,1fr)',height:hauteur,minHeight:'520px',overflow:'hidden'}}>
    <div style={{borderRight:FILET,padding:'20px 16px',display:'grid',alignContent:'start',gap:'2px',background:'var(--surface-douce)'}}>
      {actionHaut&&<div style={{paddingBottom:'20px',marginBottom:'4px',borderBottom:FILET}}>{actionHaut}</div>}
      {dossiers.map(([k,ic,t,n])=>{const actif=dossier===k;
        return <button key={k} onClick={()=>onDossier(k)} style={{display:'flex',alignItems:'center',gap:'12px',height:'42px',padding:'0 14px',border:0,borderRadius:'var(--rayon-2)',cursor:'pointer',textAlign:'left',
          background:actif?'var(--gris-000)':'transparent',boxShadow:actif?'var(--ombre-1)':'none',color:'var(--marine-900)',fontFamily:'var(--police-corps)',fontSize:'14px',fontWeight:actif?600:500}}>
          <Icon name={ic} size={16}/><span style={{flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t}</span>{n>0&&<span style={{fontSize:'12.5px',fontWeight:600,fontVariantNumeric:'tabular-nums',color:actif?'var(--marine-900)':'var(--texte-discret)'}}>{n}</span>}</button>;})}
    </div>
    <div style={{borderRight:FILET,overflowY:'auto'}}>
      {items.length===0&&<div style={{padding:'48px 24px',textAlign:'center',fontSize:'14px',color:'var(--texte-discret)'}}>Rien dans ce dossier.</div>}
      {items.map(it=>{const sel=it.id===selId;
        return <div key={it.id} onClick={()=>onSel(it)} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')onSel(it)}}
          style={{padding:'16px 20px',borderBottom:FILET,cursor:'pointer',background:sel?'var(--bleu-025)':'transparent',boxShadow:sel?'inset 3px 0 0 var(--bleu-500)':'none'}}
          onMouseEnter={e=>{if(!sel)e.currentTarget.style.background='var(--surface-survol)'}} onMouseLeave={e=>{if(!sel)e.currentTarget.style.background='transparent'}}>
          {rendreItem(it,sel)}</div>;})}
    </div>
    <div style={{overflowY:'auto',minWidth:0}}>{selId?rendreLecture(items.find(i=>i.id===selId)):(vide||<div style={{display:'grid',placeItems:'center',height:'100%',color:'var(--texte-discret)',fontSize:'14px'}}>Sélectionnez un élément.</div>)}</div>
  </div>;
}

/* Calendrier mensuel. `evenements` : [{jour, titre, ton}] ; `mois` : {nom, annee, jours, premier(0=dim)} */
function Calendrier({mois,evenements=[],jourSel,onJour,aujourdhui}){
  const cellules=[];for(let i=0;i<mois.premier;i++)cellules.push(null);for(let j=1;j<=mois.jours;j++)cellules.push(j);while(cellules.length%7)cellules.push(null);
  const tons={bleu:'var(--bleu-500)',alerte:'var(--alerte-500)',urgence:'var(--urgence-500)',succes:'var(--succes-500)',marine:'var(--marine-900)'};
  return <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',borderBottom:FILET}}>
      {['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'].map(j=><span key={j} style={{...REF,padding:'0 0 10px',textAlign:'center'}}>{j}</span>)}</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))'}}>
      {cellules.map((j,i)=>{const evs=j?evenements.filter(e=>e.jour===j):[]; const sel=j&&j===jourSel; const auj=j&&j===aujourdhui;
        return <div key={i} onClick={()=>j&&onJour&&onJour(j)} style={{minHeight:'96px',padding:'8px',borderBottom:FILET,borderRight:(i%7===6)?'none':FILET,cursor:j?'pointer':'default',
          background:sel?'var(--bleu-025)':'transparent',display:'grid',alignContent:'start',gap:'4px'}}>
          {j&&<span style={{width:'26px',height:'26px',display:'grid',placeItems:'center',borderRadius:'999px',fontSize:'13px',fontWeight:auj?700:500,
            background:auj?'var(--marine-900)':'transparent',color:auj?'#fff':'var(--marine-900)'}}>{j}</span>}
          {evs.slice(0,3).map((e,k)=><span key={k} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'var(--marine-900)',lineHeight:1.3,minWidth:0}}>
            <span style={{width:'6px',height:'6px',flex:'none',borderRadius:'50%',background:tons[e.ton]||tons.bleu}}/>
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.titre}</span></span>)}
          {evs.length>3&&<span style={{fontSize:'11.5px',color:'var(--texte-discret)'}}>+{evs.length-3}</span>}
        </div>;})}
    </div>
  </div>;
}

function FAQ({groupes=[]}){
  const [ouvert,setOuvert]=React.useState(groupes[0]?groupes[0].t+0:null);
  return <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))',gap:'16px',alignItems:'start'}}>
    {groupes.map(g=><Carte key={g.t} titre={g.t}>
      <div style={{marginTop:'-8px'}}>{g.items.map(([q,a],i)=>{const k=g.t+i, on=ouvert===k;
        return <div key={k} style={{borderBottom:FILET}}>
          <button onClick={()=>setOuvert(on?null:k)} aria-expanded={on} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',width:'100%',padding:'16px 0',border:0,background:'transparent',
            cursor:'pointer',textAlign:'left',fontFamily:'var(--police-corps)',fontSize:'15px',fontWeight:600,color:'var(--marine-900)'}}>
            {q}<Icon name={on?'minus':'plus'} size={16} color="var(--texte-discret)"/></button>
          {on&&<p style={{fontSize:'14px',lineHeight:1.6,margin:'0 0 18px',color:'var(--texte-corps)',maxWidth:'62ch'}}>{a}</p>}
        </div>;})}</div></Carte>)}
  </div>;
}

/* Relevé / reçu imprimable (window.print — seule la zone .ll-imprimable sort sur papier). */
function Facture({titre,numero,date,emetteur,destinataire,lignes=[],total,note,onFermer}){
  return <div style={{display:'grid',gap:'16px'}}>
    <div style={{display:'flex',justifyContent:'flex-end',gap:'8px'}} className="ll-non-imprimable">
      {onFermer&&<Button size="s" variant="fantome" onClick={onFermer} iconeAvant={<Icon name="arrow-left" size={15}/>}>Retour</Button>}
      <Button size="s" variant="secondaire" iconeAvant={<Icon name="download" size={15}/>}>PDF</Button>
      <Button size="s" variant="primaire" onClick={()=>window.print()} iconeAvant={<Icon name="printer" size={15} color="#fff"/>}>Imprimer</Button></div>
    <div className="ll-imprimable" style={{...CARTE,padding:'48px',maxWidth:'820px',width:'100%',margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'24px',paddingBottom:'28px',borderBottom:'1px solid var(--marine-900)'}}>
        <Logo base={BASE_LOGO} fond="blanc" hauteur={56}/>
        <div style={{textAlign:'right'}}><div style={{fontSize:'22px',fontWeight:700,color:'var(--marine-900)'}}>{titre}</div>
          <div style={{fontSize:'13px',color:'var(--texte-discret)',marginTop:'4px'}}>N° {numero} · {date}</div></div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'32px',padding:'28px 0'}}>
        {[['Émis par',emetteur],['Destinataire',destinataire]].map(([l,b])=><div key={l}><span style={REF}>{l}</span>
          <div style={{fontSize:'14px',lineHeight:1.6,marginTop:'8px',color:'var(--marine-900)'}}>{b.map((x,i)=><div key={i} style={{fontWeight:i===0?600:400}}>{x}</div>)}</div></div>)}</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
        <thead><tr>{['Description','Période','Montant'].map((t,i)=><th key={t} style={{...REF,textAlign:i===2?'right':'left',padding:'0 0 10px',borderBottom:FILET}}>{t}</th>)}</tr></thead>
        <tbody>{lignes.map((l,i)=><tr key={i} style={{borderBottom:FILET}}>
          <td style={{padding:'14px 0',color:'var(--marine-900)',fontWeight:500}}>{l.d}</td><td style={{padding:'14px 0',color:'var(--texte-discret)'}}>{l.p}</td>
          <td style={{padding:'14px 0',textAlign:'right',...chiffre('14px')}}>{l.m}</td></tr>)}</tbody></table>
      <div style={{display:'flex',justifyContent:'flex-end',padding:'20px 0 0'}}>
        <div style={{display:'grid',gridTemplateColumns:'auto auto',gap:'8px 32px',alignItems:'baseline'}}>
          <span style={REF}>Total</span><span style={chiffre('26px',{fontWeight:700})}>{total}</span></div></div>
      {note&&<p style={{fontSize:'12.5px',color:'var(--texte-discret)',margin:'28px 0 0',paddingTop:'20px',borderTop:FILET,lineHeight:1.6}}>{note}</p>}
    </div>
  </div>;
}

function Avis({icone='shield-check',children}){
  return <div style={{display:'flex',gap:'12px',alignItems:'flex-start',padding:'14px 16px',background:'var(--bleu-025)',borderRadius:'var(--rayon-3)',fontSize:'13.5px',lineHeight:1.55,color:'var(--texte-corps)'}}>
    <Icon name={icone} size={18} color="var(--bleu-600)" style={{flex:'none',marginTop:'1px'}}/><span>{children}</span></div>;
}

function Vide({icone,titre,texte,action}){
  return <div style={{...CARTE,display:'grid',placeItems:'center',gap:'10px',padding:'72px 24px',textAlign:'center'}}>
    <span style={{width:'56px',height:'56px',borderRadius:'999px',background:'var(--surface-douce)',display:'grid',placeItems:'center'}}><Icon name={icone} size={24} color="var(--marine-900)"/></span>
    <h2 style={{fontSize:'18px',fontWeight:600,marginTop:'6px'}}>{titre}</h2>
    <p style={{fontSize:'14px',color:'var(--texte-discret)',maxWidth:'46ch',margin:0}}>{texte}</p>
    {action&&<div style={{marginTop:'8px'}}>{action}</div>}
  </div>;
}

function Coquille({nav,page,aller,titres,data,reglages,setReglages,badges,pied,actions,aCote,menuCompte,logoSrc,children,onDeconnexion,sansCarteUtilisateur}){
  const [t,st]=titres[page]||['',''];
  return <div style={{display:'flex',height:'100vh',background:'var(--surface-douce)'}}>
    <Rail sansCarteUtilisateur={sansCarteUtilisateur} nav={nav} page={page} aller={aller} theme="clair" condense={reglages.condense} badges={badges} utilisateur={data.utilisateur} pied={pied} sombre={reglages.apparence==='sombre'} logoSrc={logoSrc}/>
    <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
      <Barre titre={t} sousTitre={st} actions={actions} aCote={aCote} menuCompte={menuCompte} notifications={data.notifications} utilisateur={data.utilisateur} reglages={reglages} setReglages={setReglages} onDeconnexion={onDeconnexion}/>
      <main id="ll-main" style={{flex:1,overflowY:'auto'}}><div style={{maxWidth:'1320px',margin:'0 auto',padding:'28px 32px 32px'}}>{children}<PiedPortail/></div></main>
    </div>
  </div>;
}

Object.assign(window,{useReglages,Rail,Barre,Carte,Tuile,Jauge,GrapheBarres,Progression,Tableau2,Avatar,FichePersonne,ZoneDepot,Pilules,BoiteReception,Calendrier,FAQ,Facture,Avis,Vide,Coquille,
  CHIFFRE,REF,FILET,CARTE,BASE_LOGO,chiffre,LiensLegaux,MesRenseignements,PiedPortail});
