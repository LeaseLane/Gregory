const { Icon, Button, Badge, Tag, StatusPill, Input, Select, Switch, Checkbox, Dialog } = window.LeaseLaneDesignSystem_b7a479;

/* Écrans propriétaire — 2e partie : demandes (boîte 3 volets), messages, finances + relevé, calendrier, aide. */

function Suivi({etapes}){
  return <ol style={{listStyle:'none',margin:0,padding:0,display:'grid'}}>
    {etapes.map(([t,acteur,quand],i)=>{const fait=quand&&quand!=='—'&&quand!=='En attente', courant=quand==='En attente';
      return <li key={t+i} style={{display:'grid',gridTemplateColumns:'18px 1fr auto',gap:'12px',alignItems:'start'}}>
        <div style={{display:'grid',justifyItems:'center',height:'100%'}}>
          <span style={{width:'14px',height:'14px',borderRadius:'50%',marginTop:'3px',display:'grid',placeItems:'center',background:fait?'var(--marine-900)':courant?'var(--alerte-500)':'var(--gris-000)',border:(!fait&&!courant)?'2px solid var(--gris-300)':'none'}}>
            {fait&&<Icon name="check" size={9} color="#fff" strokeWidth={3.2}/>}</span>
          {i<etapes.length-1&&<span style={{width:'1px',flex:1,minHeight:'18px',background:fait?'var(--marine-900)':'var(--gris-200)'}}/>}</div>
        <div style={{paddingBottom:'12px'}}><div style={{fontSize:'14px',fontWeight:600,lineHeight:1.35,color:(!fait&&!courant)?'var(--texte-discret)':'var(--marine-900)'}}>{t}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{acteur}</div></div>
        <span style={chiffre('12.5px',{fontWeight:500,marginTop:'2px',color:courant?'var(--alerte-600)':fait?'var(--marine-900)':'var(--texte-discret)'})}>{quand}</span>
      </li>;})}
  </ol>;
}

function Demandes({data,ouvrir,selId,setSel}){
  const [dossier,setDossier]=React.useState('toutes');
  const filtre=d=>dossier==='toutes'||(dossier==='attente'&&d.etat==='attente_approbation')||(dossier==='urgence'&&d.etat==='urgence')||(dossier==='cours'&&!['fermee','attente_approbation','urgence'].includes(d.etat))||(dossier==='fermee'&&d.etat==='fermee');
  const items=data.demandes.filter(filtre);
  const n=k=>data.demandes.filter(d=>({toutes:()=>true,attente:x=>x.etat==='attente_approbation',urgence:x=>x.etat==='urgence',cours:x=>!['fermee','attente_approbation','urgence'].includes(x.etat),fermee:x=>x.etat==='fermee'})[k](d)).length;
  const appro=d=>data.approbations.find(a=>a.demande===d.id);
  return <BoiteReception dossiers={[['toutes','layers','Toutes',n('toutes')],['attente','wallet','En attente de vous',n('attente')],['urgence','triangle-alert','Urgences',n('urgence')],['cours','wrench','En cours',n('cours')],['fermee','circle-check','Fermées',n('fermee')]]}
    dossier={dossier} onDossier={k=>{setDossier(k)}} items={items} selId={selId} onSel={d=>setSel(d.id)}
    actionHaut={<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',padding:'0 2px'}}><span style={REF}>Seuil d'autorisation</span><span style={chiffre('13.5px',{fontWeight:600})}>500 $</span></div>}
    rendreItem={(d,sel)=><div style={{display:'grid',gap:'6px'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:'10px',alignItems:'center'}}><span style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{d.id}</span><span style={{fontSize:'12px',color:'var(--texte-discret)'}}>{d.date}</span></div>
      <div style={{fontSize:'14.5px',fontWeight:600,color:'var(--marine-900)',lineHeight:1.3}}>{d.titre}</div>
      <div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{d.logement} · {d.locataire}</div>
      <div style={{marginTop:'4px'}}><StatusPill etat={d.etat} point={false}/></div></div>}
    rendreLecture={d=>{const a=appro(d);return <div style={{padding:'28px 32px',display:'grid',gap:'24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'16px',flexWrap:'wrap'}}>
        <div><span style={REF}>{d.id} · {d.logement}</span><h2 style={{fontSize:'22px',fontWeight:700,letterSpacing:'-0.02em',marginTop:'6px'}}>{d.titre}</h2>
          <div style={{fontSize:'13.5px',color:'var(--texte-discret)',marginTop:'4px'}}>Signalée par {d.locataire} le {d.date} · urgence {d.urgence}</div></div>
        <StatusPill etat={d.etat}/></div>
      <div style={{padding:'16px 18px',background:'var(--surface-douce)',borderRadius:'var(--rayon-3)',fontSize:'14px',lineHeight:1.6,color:'var(--texte-corps)'}}>
        {d.texte}{d.pieces>0&&<div style={{display:'flex',gap:'8px',marginTop:'12px'}}>{Array.from({length:d.pieces}).map((_,i)=><span key={i} style={{width:'72px',height:'54px',borderRadius:'var(--rayon-2)',background:'var(--gris-200)',display:'grid',placeItems:'center'}}><Icon name="image" size={16} color="var(--gris-400)"/></span>)}</div>}</div>
      {a&&<div style={{padding:'18px 20px',background:'var(--bleu-025)',borderRadius:'var(--rayon-3)',display:'grid',gap:'10px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:'12px'}}><span style={REF}>Estimation à autoriser</span><span style={chiffre('24px',{fontWeight:700})}>{a.montant}</span></div>
        <div style={{fontSize:'13px',color:'var(--texte-discret)'}}>{a.fournisseur} · licence RBQ et assurances vérifiées · + 10 % de coordination</div>
        <div style={{display:'flex',gap:'8px',marginTop:'4px'}}><Button size="s" variant="primaire" onClick={()=>ouvrir(a)}>Approuver</Button><Button size="s" variant="secondaire">Refuser</Button><Button size="s" variant="fantome" iconeAvant={<Icon name="file-text" size={14}/>}>Estimation PDF</Button></div></div>}
      <div><div style={{...REF,marginBottom:'12px'}}>Boucle fermée</div><Suivi etapes={d.etapes}/></div>
      <div style={{paddingTop:'16px',borderTop:FILET,display:'flex',gap:'8px',flexWrap:'wrap'}}>
        <Button size="s" variant="secondaire" iconeAvant={<Icon name="message-square" size={14}/>}>Question à Camille</Button>
        <Button size="s" variant="fantome" iconeAvant={<Icon name="user" size={14}/>}>Demander une révision humaine</Button></div>
    </div>}}/>;
}

function Messages({data,selId,setSel}){
  const [dossier,setDossier]=React.useState('boite');
  const [rep,setRep]=React.useState('');
  const items=data.messages.filter(m=>dossier==='boite'?m.dossier==='boite':dossier==='envoyes'?m.dossier==='envoyes':dossier==='importants'?!m.lu:true);
  return <BoiteReception dossiers={[['boite','mail','Boîte de réception',data.messages.filter(m=>m.dossier==='boite'&&!m.lu).length],['importants','star','Non lus',data.messages.filter(m=>!m.lu).length],['envoyes','send','Envoyés',0],['archives','files','Archives',0]]}
    dossier={dossier} onDossier={setDossier} items={items} selId={selId} onSel={m=>setSel(m.id)}
    actionHaut={<Button variant="primaire" pleineLargeur size="m" iconeAvant={<Icon name="pencil" size={15} color="#fff"/>}>Nouveau message</Button>}
    rendreItem={m=><div style={{display:'grid',gridTemplateColumns:'36px minmax(0,1fr)',gap:'12px'}}>
      <Avatar initiales={m.initiales} taille={36} ton={m.de==='Vous'?'clair':'marine'}/>
      <div style={{minWidth:0}}><div style={{display:'flex',justifyContent:'space-between',gap:'10px'}}><span style={{fontSize:'14px',fontWeight:m.lu?500:700,color:'var(--marine-900)'}}>{m.de}</span><span style={{fontSize:'12px',color:'var(--texte-discret)',whiteSpace:'nowrap'}}>{m.quand}</span></div>
        <div style={{fontSize:'13.5px',fontWeight:m.lu?500:600,color:'var(--marine-900)',marginTop:'2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.objet}</div>
        <div style={{fontSize:'12.5px',color:'var(--texte-discret)',marginTop:'2px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.corps.split('\n')[0]}</div></div></div>}
    rendreLecture={m=><div style={{display:'grid',gridTemplateRows:'auto minmax(0,1fr) auto',height:'100%'}}>
      <div style={{padding:'24px 32px',borderBottom:FILET,display:'flex',alignItems:'center',gap:'14px'}}>
        <Avatar initiales={m.initiales} taille={44} ton={m.de==='Vous'?'clair':'marine'}/>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:'15px',fontWeight:600,color:'var(--marine-900)'}}>{m.de}{m.role&&<span style={{fontWeight:400,color:'var(--texte-discret)'}}> · {m.role}</span>}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{m.quand} · à vous</div></div>
        <Button size="s" variant="fantome" iconeAvant={<Icon name="star" size={15}/>}/><Button size="s" variant="fantome" iconeAvant={<Icon name="trash-2" size={15}/>}/></div>
      <div style={{padding:'28px 32px',overflowY:'auto'}}>
        <h2 style={{fontSize:'20px',fontWeight:700,letterSpacing:'-0.02em',marginBottom:'16px'}}>{m.objet}</h2>
        <div style={{fontSize:'14.5px',lineHeight:1.7,color:'var(--texte-corps)',whiteSpace:'pre-line',maxWidth:'68ch'}}>{m.corps}</div>
        {m.pieces.length>0&&<div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginTop:'24px'}}>{m.pieces.map(p=><span key={p} style={{display:'inline-flex',alignItems:'center',gap:'10px',padding:'10px 14px',border:FILET,borderRadius:'var(--rayon-2)',fontSize:'13px',fontWeight:500,color:'var(--marine-900)'}}><Icon name="paperclip" size={14} color="var(--texte-discret)"/>{p}<Icon name="download" size={14} color="var(--texte-discret)"/></span>)}</div>}</div>
      <div style={{padding:'16px 32px 20px',borderTop:FILET,display:'grid',gap:'10px'}}>
        <textarea value={rep} onChange={e=>setRep(e.target.value)} placeholder={'Répondre à '+m.de.split(' ')[0]+'…'} rows={3}
          style={{width:'100%',resize:'vertical',border:FILET,borderRadius:'var(--rayon-3)',padding:'12px 14px',fontFamily:'var(--police-corps)',fontSize:'14px',color:'var(--marine-900)',outline:0}}/>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}><Button size="s" variant="fantome" iconeAvant={<Icon name="paperclip" size={15}/>}>Joindre</Button><span style={{flex:1}}/>
          <Button size="s" variant="primaire" onClick={()=>setRep('')} iconeApres={<Icon name="send" size={14} color="#fff"/>}>Envoyer</Button></div></div>
    </div>}/>;
}

function Finances({data}){
  const [releve,setReleve]=React.useState(false);
  const [r31,setR31]=React.useState(data.releves31||[]);
  if(releve)return <Facture titre="Relevé mensuel" numero="REL-2026-09-034" date="30 septembre 2026" onFermer={()=>setReleve(false)}
    emetteur={['Solutions locatives Lease Lane','NEQ 1182479981','Québec (Québec)','info@leaselane.ca']} destinataire={[data.utilisateur.nom,'34 portes · 5 immeubles',data.utilisateur.courriel]}
    lignes={[{d:'Loyers encaissés',p:'Septembre 2026',m:'41 280,00 $'},{d:'Honoraires de gestion 6 %',p:'Logements occupés',m:'−2 476,80 $'},{d:'Entretien — Plomberie Capitale (DEM-2026-0148)',p:'8 sept.',m:'−210,00 $'},{d:'Coordination 10 %',p:'8 sept.',m:'−21,00 $'},{d:'Assurance — 420 Saint-Joseph Est',p:'15 sept.',m:'−742,00 $'}]}
    total="37 830,20 $" note="Net versé le 30 septembre 2026 au compte se terminant par 4417. Les factures des fournisseurs sont jointes telles quelles au dossier ; les frais de coordination de 10 % sont détaillés ci-dessus. Ce relevé tient lieu de rapport mensuel (article 12 du mandat)."/>;
  return <div style={{display:'grid',gap:'24px'}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
      <Tuile libelle="Encaissé" valeur="41 280 $" variation="−2,4 %" precision="septembre 2026" icone="banknote"/>
      <Tuile libelle="Honoraires 6 %" valeur="2 476,80 $" precision="logements occupés seulement" icone="wallet"/>
      <Tuile libelle="Dépenses et travaux" valeur="973,00 $" variation="−12 %" precision="3 factures, remises telles quelles" icone="wrench"/>
      <Tuile libelle="Net au propriétaire" valeur="37 830,20 $" variation="−1,1 %" precision="versé le 30 septembre" icone="arrow-right"/>
    </div>
    <div className="ll-deux-tiers" style={{display:'grid',gridTemplateColumns:'minmax(0,1.6fr) minmax(0,1fr)',gap:'16px',alignItems:'start'}}>
      <Carte titre="Grand livre" sous="Septembre 2026 · une ligne par écriture"
        action={<div style={{display:'flex',gap:'8px'}}><Button size="s" variant="primaire" onClick={()=>setReleve(true)} iconeAvant={<Icon name="receipt" size={15} color="#fff"/>}>Relevé du mois</Button><Button size="s" variant="secondaire" iconeAvant={<Icon name="download" size={15}/>}>CSV</Button></div>}>
        <Tableau2 colonnes={[{k:'date',t:'Date',rendu:l=><span style={chiffre('13.5px',{fontWeight:500})}>{l.date}</span>},
          {k:'libelle',t:'Écriture',rendu:l=><span style={{color:'var(--marine-900)',fontWeight:500}}>{l.libelle}</span>},
          {k:'categorie',t:'Catégorie',rendu:l=><Badge ton={l.ton==='alerte'?'alerte':'neutre'} taille="s">{l.categorie}</Badge>},
          {k:'montant',t:'Montant',a:'right',rendu:l=><span style={chiffre('14px',{color:l.montant.startsWith('+')?'var(--succes-600)':'var(--marine-900)'})}>{l.montant}</span>}]} lignes={data.ecritures}/>
        <div style={{display:'flex',gap:'12px',marginTop:'20px',fontSize:'13.5px',color:'var(--texte-corps)'}}><Icon name="info" size={17} color="var(--bleu-600)"/>{/* À valider par l'avocat */}<span>La facture du fournisseur vous est remise telle quelle et les rabais obtenus vous sont crédités. Des frais de coordination de 10 % s'ajoutent et sont détaillés sur chaque relevé.</span></div></Carte>
      <div style={{display:'grid',gap:'16px'}}>
        <Carte titre="Répartition" sous="Septembre 2026">
          <div style={{display:'grid',gridTemplateColumns:'auto minmax(0,1fr)',gap:'24px',alignItems:'center'}}><Jauge valeur={91.6} taille={120} libelle="Net / encaissé"/>
            <Progression items={[{l:'Net versé',v:92,d:'37 830 $'},{l:'Honoraires',v:6,d:'2 477 $',couleur:'var(--marine-900)'},{l:'Travaux et assurance',v:2,d:'973 $',couleur:'var(--gris-300)'}]}/></div></Carte>
        <Carte titre="Relevés" sous="Un par mois, imprimable">
          {['Septembre 2026','Août 2026','Juillet 2026','Juin 2026'].map((m,i)=><div key={m} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 0',borderBottom:FILET}}>
            <Icon name="file-text" size={17} color="var(--marine-900)"/><span style={{flex:1,fontSize:'14px',fontWeight:500,color:'var(--marine-900)'}}>{m}</span>
            {i===0?<Button size="s" variant="fantome" onClick={()=>setReleve(true)} iconeApres={<Icon name="arrow-right" size={14}/>}>Ouvrir</Button>:<Button size="s" variant="fantome" iconeAvant={<Icon name="download" size={14}/>}>PDF</Button>}</div>)}</Carte>
      </div>
    </div>
    {/* À valider par l'avocat */}
    <Carte titre="Relevés 31 — année 2026" sous="Un relevé par logement, pour chaque locataire au 31 décembre"
      action={<div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}><Button size="s" variant="primaire" onClick={()=>setR31(l=>l.map(x=>x.statut==='À produire'?{...x,statut:'Produit'}:x))} iconeAvant={<Icon name="file-text" size={15} color="#fff"/>}>Produire les Relevés 31</Button>
        <Button size="s" variant="secondaire" onClick={()=>setR31(l=>l.map(x=>x.statut==='Produit'?{...x,statut:'Remis au locataire'}:x))} iconeAvant={<Icon name="send" size={15}/>}>Remettre aux locataires</Button></div>}>
      <div className="ll-deux-tiers" style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 260px',gap:'24px',alignItems:'start'}}>
        <Tableau2 colonnes={[{k:'immeuble',t:'Immeuble',rendu:l=><span style={{fontWeight:600,color:'var(--marine-900)'}}>{l.immeuble}</span>},{k:'logement',t:'Logement'},{k:'locataires',t:'Locataires au 31 décembre'},
          {k:'statut',t:'Statut',rendu:l=><Badge ton={l.statut==='Remis au locataire'?'succes':l.statut==='Produit'?'bleu':'alerte'} taille="s">{l.statut}</Badge>}]} lignes={r31}/>
        <Tuile libelle="Échéance" valeur="28 février 2027" precision="remise aux locataires" icone="calendar"/></div></Carte>
  </div>;
}

function CalendrierPage({data}){
  const [jour,setJour]=React.useState(data.calendrier.aujourdhui);
  const [planif,setPlanif]=React.useState(false);
  const evs=data.evenements.filter(e=>e.jour===jour);
  return <div className="ll-deux-tiers" style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 340px',gap:'16px',alignItems:'start'}}>
    <Carte titre={data.calendrier.nom+' '+data.calendrier.annee} sous={data.evenements.length+' événements'}
      action={<div style={{display:'flex',gap:'6px',alignItems:'center'}}><Button size="s" variant="fantome" iconeAvant={<Icon name="chevron-left" size={15}/>}/><Button size="s" variant="secondaire">Aujourd'hui</Button><Button size="s" variant="fantome" iconeAvant={<Icon name="chevron-right" size={15}/>}/></div>}>
      <Calendrier mois={data.calendrier} evenements={data.evenements} jourSel={jour} onJour={setJour} aujourdhui={data.calendrier.aujourdhui}/></Carte>
    <div style={{display:'grid',gap:'16px'}}>
      <Carte titre={jour+' '+data.calendrier.nom.toLowerCase()} sous={evs.length?evs.length+' événement'+(evs.length>1?'s':''):'Rien de prévu'}>
        <div style={{display:'grid',gap:'12px'}}>{evs.map((e,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'4px minmax(0,1fr)',gap:'12px'}}>
          <span style={{borderRadius:'2px',background:'var(--'+({bleu:'bleu-500',alerte:'alerte-500',urgence:'urgence-500',succes:'succes-500',marine:'marine-900'})[e.ton]+')'}}/>
          <div><div style={{fontSize:'14px',fontWeight:600,color:'var(--marine-900)'}}>{e.titre}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>Ajouté par l'équipe Lease Lane</div></div></div>)}</div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'16px'}}><Button size="s" variant="primaire" onClick={()=>setPlanif(true)} iconeAvant={<Icon name="calendar" size={14} color="#fff"/>}>Planifier un rendez-vous</Button><Button size="s" variant="secondaire" iconeAvant={<Icon name="plus" size={14}/>}>Ajouter un rappel</Button></div></Carte>
      <Carte titre="Légende"><div style={{display:'grid',gap:'10px',fontSize:'13.5px',color:'var(--marine-900)'}}>
        {[['succes','Loyers et versements'],['bleu','Visites et inspections'],['alerte','Travaux planifiés'],['urgence','Urgences'],['marine','Rapports et échéances']].map(([k,l])=><span key={k} style={{display:'flex',alignItems:'center',gap:'10px'}}><span style={{width:'10px',height:'10px',borderRadius:'50%',background:'var(--'+(k==='marine'?'marine-900':k+'-500')+')'}}/>{l}</span>)}
        {/* À valider par l'avocat */}
        <p style={{fontSize:'12.5px',color:'var(--texte-discret)',margin:'4px 0 0',lineHeight:1.5,paddingTop:'10px',borderTop:FILET}}>Logement occupé : préavis de 24 h requis, entre 9 h et 21 h, sauf urgence (art. 1931-1932 C.c.Q.).</p></div></Carte>
    </div>
    <PlanifierRdv ouvert={planif} onClose={()=>setPlanif(false)} data={data}/>
  </div>;
}

/* Planification d'un rendez-vous dans un logement : préavis de 24 h et plage 9 h – 21 h si le logement est occupé, sauf urgence. */
function verifierPreavis({occupe,date,heure,urgence}){
  if(!occupe||urgence||!date||!heure)return true;
  const quand=new Date(date+'T'+heure), h=quand.getHours()+quand.getMinutes()/60;
  return quand-new Date()>=24*36e5&&h>=9&&h<=21;
}
function PlanifierRdv({ouvert,onClose,data}){
  const logs=data.immeubles.flatMap(im=>im.logements.map(l=>({k:im.adresse.split(',')[0]+' — '+l[0],occupe:l[3]==='Occupé'})));
  const vide={logement:logs[0]?logs[0].k:'',objet:'Visite',date:'',heure:'10:00',urgence:false};
  const [f,setF]=React.useState(vide), [essai,setEssai]=React.useState(false);
  React.useEffect(()=>{if(ouvert){setF(vide);setEssai(false)}},[ouvert]);
  const occupe=(logs.find(l=>l.k===f.logement)||{}).occupe;
  const ok=verifierPreavis({occupe,date:f.date,heure:f.heure,urgence:f.urgence});
  return <Dialog ouvert={ouvert} onClose={onClose} surtitre="Calendrier" titre="Planifier un rendez-vous"
    actions={<React.Fragment><Button variant="secondaire" onClick={onClose}>Annuler</Button><Button variant="primaire" onClick={()=>{setEssai(true);if(ok&&f.date)onClose()}}>Planifier</Button></React.Fragment>}>
    <div style={{display:'grid',gap:'16px'}}>
      <Select label="Logement" options={logs.map(l=>l.k)} value={f.logement} onChange={e=>setF({...f,logement:e.target.value})}/>
      <Select label="Objet" options={['Visite','Inspection','Travaux']} value={f.objet} onChange={e=>setF({...f,objet:e.target.value})}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'16px'}}>
        <Input label="Date" type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})} erreur={essai&&!f.date?'Choisissez une date.':undefined}/>
        <Input label="Heure" type="time" value={f.heure} onChange={e=>setF({...f,heure:e.target.value})}/></div>
      <Checkbox checked={f.urgence} onChange={e=>setF({...f,urgence:e.target.checked})} label="Urgence"/>
      {/* À valider par l'avocat */}
      {!ok&&<div role="alert" style={{display:'flex',gap:'12px',padding:'14px 16px',background:'var(--alerte-100)',borderRadius:'var(--rayon-3)'}}><Icon name="triangle-alert" size={18} color="var(--alerte-600)" style={{flex:'none',marginTop:'1px'}}/>
        <span style={{fontSize:'13.5px',lineHeight:1.55,color:'var(--alerte-600)',fontWeight:500}}>Préavis de 24 h requis, entre 9 h et 21 h (art. 1931-1932 C.c.Q.). Cochez « Urgence » pour déroger.</span></div>}
    </div></Dialog>;
}

Object.assign(window,{Demandes,Messages,Finances,CalendrierPage,Suivi,PlanifierRdv,verifierPreavis});
