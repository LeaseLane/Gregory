const { Icon, Button, Badge, Tag, Input, Select, Switch, Checkbox, Tabs, Dialog } = window.LeaseLaneDesignSystem_b7a479;

/* Modules Utilisateurs et accès · Conformité Loi 25 — grammaire du module Gaévan fourni par le client,
   posée sur le chrome Lease Lane. `portee` : 'admin' (équipe Lease Lane) ou 'proprietaire'. */
const A=()=>window.LL_ADMIN;
const TON={ok:'succes',attention:'alerte',refus:'urgence',systeme:'neutre',bleu:'bleu',succes:'succes',alerte:'alerte'};

const Avis=window.Avis;

function Matrice({roles,permissions}){
  const cell=c=>c==='y'?<Icon name="check" size={17} color="var(--succes-600)"/>:c==='p'?<span title="Partiel : limité à ses propres dossiers" style={{width:'10px',height:'10px',borderRadius:'50%',background:'var(--bleu-500)',display:'inline-block'}}/>:<Icon name="minus" size={15} color="var(--gris-300)"/>;
  return <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
    <thead><tr><th style={{...REF,textAlign:'left',padding:'0 0 10px',borderBottom:FILET}}>Permission</th>{roles.map(r=><th key={r} style={{...REF,padding:'0 8px 10px',borderBottom:FILET,textAlign:'center',whiteSpace:'nowrap'}}>{r}</th>)}</tr></thead>
    <tbody>{permissions.map(([p,...c])=><tr key={p} style={{borderBottom:FILET}}><td style={{padding:'13px 0',color:'var(--marine-900)',fontWeight:500}}>{p}</td>{c.map((x,i)=><td key={i} style={{textAlign:'center',padding:'13px 8px'}}>{cell(x)}</td>)}</tr>)}</tbody></table></div>;
}

function Acces({portee='admin',notifier,aller}){
  const d=A(); const [onglet,setOnglet]=React.useState('utilisateurs'); const [invite,setInvite]=React.useState(false);
  const admin=portee==='admin';
  const users=d.utilisateurs[admin?'admin':'proprietaire'], roles=admin?d.roles:d.rolesProprietaire, perms=admin?d.permissions:d.permissionsProprietaire;
  const tonRole=r=>/Administrateur|^Propriétaire$/.test(r)?'marine':/Gestionnaire/.test(r)?'bleu':'neutre';
  return <div style={{display:'grid',gap:'24px'}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
      <Tuile libelle="Comptes" valeur={users.length} precision={users.filter(u=>u.etat==='Actif').length+' actifs'} icone="users"/>
      <Tuile libelle="Double authentification" valeur={Math.round(users.filter(u=>u.dfa).length/users.length*100)+' %'} precision={users.filter(u=>!u.dfa).length+' compte'+(users.filter(u=>!u.dfa).length>1?'s':'')+' à configurer'} icone="shield-check" ton={users.some(u=>!u.dfa&&u.etat==='Actif')?undefined:undefined}/>
      <Tuile libelle="Accès refusés (30 j)" valeur={admin?'1':'0'} precision="journalisés et notifiés" icone="lock"/>
      <Tuile libelle="Dernière revue des accès" valeur="3 sept." precision="revue trimestrielle · prochaine le 3 déc." icone="calendar-check"/>
    </div>
    <Carte action={<div style={{display:'flex',gap:'8px'}}><Button size="s" variant="secondaire" iconeAvant={<Icon name="download" size={15}/>}>Journal (CSV)</Button><Button size="s" variant="primaire" onClick={()=>setInvite(true)} iconeAvant={<Icon name="plus" size={15} color="#fff"/>}>Inviter</Button></div>}
      titre={admin?'Comptes de la plateforme':'Qui a accès à vos immeubles'} sous={admin?'Équipe, propriétaires, locataires et fournisseurs':'Vous décidez qui voit quoi ; Lease Lane n\u2019accède qu\u2019au périmètre du mandat'}>
      <Tabs onglets={[{value:'utilisateurs',label:'Utilisateurs ('+users.length+')'},{value:'roles',label:'Rôles et paliers d\u2019accès'},{value:'journal',label:'Journal d\u2019accès'},{value:'securite',label:'Sécurité'}]} valeur={onglet} onChange={setOnglet}/>
      <div style={{marginTop:'20px'}}>
        {onglet==='utilisateurs'&&<Tableau2 colonnes={[
          {k:'nom',t:'Utilisateur',rendu:u=><div style={{display:'flex',alignItems:'center',gap:'12px'}}><Avatar initiales={u.nom.split(' ').map(w=>w[0]).slice(0,2).join('')} taille={36} ton={u.role==='Administrateur'?'marine':'clair'}/><div><div style={{fontWeight:600,color:'var(--marine-900)'}}>{u.nom}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{u.courriel}</div></div></div>},
          {k:'role',t:'Rôle · portée',rendu:u=><div style={{display:'grid',gap:'4px',justifyItems:'start'}}><Badge ton={tonRole(u.role)} taille="s">{u.role}</Badge><span style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{u.portee}</span></div>},
          {k:'dfa',t:'2FA',rendu:u=>u.dfa?<span style={{display:'inline-flex',gap:'6px',alignItems:'center',color:'var(--succes-600)',fontWeight:500}}><Icon name="shield-check" size={16} color="currentColor"/>Active</span>:<span style={{display:'inline-flex',gap:'6px',alignItems:'center',color:'var(--alerte-600)',fontWeight:500}}><Icon name="triangle-alert" size={16} color="currentColor"/>À configurer</span>},
          {k:'etat',t:'Statut',rendu:u=><Badge ton={u.etat==='Actif'?'succes':'urgence'} taille="s">{u.etat}</Badge>},
          {k:'derniere',t:'Dernière connexion',rendu:u=><span style={{color:'var(--texte-discret)'}}>{u.derniere}</span>},
          {k:'act',t:'',a:'right',rendu:u=><span style={{display:'inline-flex',gap:'2px'}}><Button size="s" variant="fantome" iconeAvant={<Icon name="pencil" size={14}/>}/><Button size="s" variant="fantome" onClick={()=>notifier('Courriel de réinitialisation envoyé',u.courriel)} iconeAvant={<Icon name="key" size={14}/>}/><Button size="s" variant="fantome" iconeAvant={<Icon name="circle-x" size={14}/>}/></span>}]} lignes={users}/>}
        {onglet==='roles'&&<div style={{display:'grid',gap:'16px'}}>
          <Avis>Paliers d'accès (Loi 25, art. 3.2) : chaque rôle n'accède qu'aux renseignements personnels nécessaires à ses fonctions. Le point bleu marque un accès partiel, limité aux dossiers de la personne (son logement, ses immeubles, ses bons de travail).</Avis>
          <Matrice roles={roles} permissions={perms}/>
          {admin&&<div style={{display:'flex',gap:'8px'}}><Button size="s" variant="secondaire" iconeAvant={<Icon name="plus" size={14}/>}>Nouveau rôle</Button><Button size="s" variant="fantome" iconeAvant={<Icon name="download" size={14}/>}>Exporter la matrice</Button></div>}</div>}
        {onglet==='journal'&&<div>{d.journal.filter(l=>admin||!/Plomberie|Stagiaire/.test(l[1])).map((l,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'110px minmax(0,1fr) auto auto',gap:'16px',alignItems:'center',padding:'12px 0',borderBottom:FILET,fontSize:'14px'}}>
          <span style={chiffre('13px',{fontWeight:500,color:'var(--texte-discret)'})}>{l[0]}</span>
          <span style={{minWidth:0}}><span style={{fontWeight:600,color:'var(--marine-900)'}}>{l[1]}</span> · {l[2]}{l[3]!=='—'&&<span style={{color:'var(--texte-discret)'}}> · {l[3]}</span>}</span>
          <span style={{fontSize:'12.5px',color:'var(--texte-discret)',whiteSpace:'nowrap'}}>{l[4]}</span>
          <Badge ton={TON[l[5]]} taille="s">{l[5]==='ok'?'OK':l[5]==='refus'?'Refusé':'Système'}</Badge></div>)}</div>}
        {onglet==='securite'&&<div style={{display:'grid',gap:'20px',maxWidth:'640px'}}>
          <Switch label="Double authentification obligatoire" description="Application d'authentification ou texto, pour tous les rôles." defaultChecked/>
          <Switch label="Appareils mémorisés 30 jours" description="Le code reste exigé pour exporter, approuver une dépense ou ouvrir un dossier de locataire." defaultChecked/>
          <Switch label="Déconnexion automatique après 30 min d'inactivité" defaultChecked/>
          {admin&&<Switch label="Restreindre les connexions au Canada" description="Blocage géographique des adresses IP hors Canada."/>}
          <Select label="Politique de mot de passe" options={['12 caractères minimum · renouvellement 12 mois','16 caractères minimum · renouvellement 6 mois']}/>
          {/* À valider par l'avocat */}
          {admin&&<div style={{display:'grid',gap:'8px',justifyItems:'start'}}><div style={{width:'100%'}}><Input label="Responsable de la protection des renseignements personnels" defaultValue={d.responsable} aide="Par défaut, la personne ayant la plus haute autorité de l'entreprise. Toute délégation se fait par écrit. Titre et coordonnées publiés sur le site (art. 3.1)."/></div>
            <Badge ton="alerte" taille="s">Délégation : à signer</Badge></div>}
          <div><Button variant="primaire" onClick={()=>notifier('Paramètres de sécurité enregistrés')}>Enregistrer</Button></div></div>}
      </div>
    </Carte>
    <Dialog ouvert={invite} onClose={()=>setInvite(false)} surtitre="Utilisateurs" titre="Inviter un utilisateur"
      actions={<React.Fragment><Button variant="secondaire" onClick={()=>setInvite(false)}>Annuler</Button><Button variant="primaire" onClick={()=>{setInvite(false);notifier('Invitation envoyée','Activation avec double authentification obligatoire.')}} iconeApres={<Icon name="send" size={15} color="#fff"/>}>Envoyer l'invitation</Button></React.Fragment>}>
      <div style={{display:'grid',gap:'16px'}}>
        <p style={{fontSize:'14px',margin:0,color:'var(--texte-discret)'}}>Un courriel d'activation avec configuration obligatoire de la double authentification sera envoyé.</p>
        <Input label="Nom complet" placeholder="Prénom Nom"/><Input label="Courriel" type="email" placeholder="nom@courriel.ca"/>
        <Select label="Rôle" options={roles}/>
        {!admin&&<Select label="Immeubles visibles" options={['Tous vos immeubles','1180, avenue Cartier','640, 3e Avenue','420, rue Saint-Joseph Est','2880, chemin Sainte-Foy','41, rue des Roseaux']}/>}
        <Checkbox label="Accès limité à ses propres dossiers" description={admin?'Recommandé pour Locataire et Fournisseur.':'Recommandé pour la comptabilité.'} defaultChecked/></div>
    </Dialog>
  </div>;
}

function NouvelleDemandeLoi25({ouvert,onClose,onCreer}){
  const d=A(); const auj=new Date().toISOString().slice(0,10);
  const [f,setF]=React.useState({type:d.typesDemandes[0],qui:'',recue:auj,identite:false});
  React.useEffect(()=>{if(ouvert)setF({type:d.typesDemandes[0],qui:'',recue:auj,identite:false})},[ouvert]);
  const ech=window.LLLoi25?window.LLLoi25.fmt(window.LLLoi25.echeance(f.recue))+' '+window.LLLoi25.echeance(f.recue).getFullYear():'—';
  return <Dialog ouvert={ouvert} onClose={onClose} surtitre="Conformité Loi 25" titre="Nouvelle demande"
    actions={<React.Fragment><Button variant="secondaire" onClick={onClose}>Annuler</Button><Button variant="primaire" onClick={()=>{onCreer(f)}} iconeAvant={<Icon name="plus" size={15} color="#fff"/>}>Inscrire au registre</Button></React.Fragment>}>
    <div style={{display:'grid',gap:'16px'}}>
      <Select label="Type de demande" options={d.typesDemandes} value={f.type} onChange={e=>setF({...f,type:e.target.value})}/>
      <Input label="Demandeur" placeholder="Nom et qualité (locataire, candidat, propriétaire…)" value={f.qui} onChange={e=>setF({...f,qui:e.target.value})}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'16px'}}>
        <Input label="Date de réception" type="date" value={f.recue} onChange={e=>setF({...f,recue:e.target.value})}/>
        <div style={{display:'grid',gap:'6px',alignContent:'start'}}><span style={{fontSize:'14px',fontWeight:600,color:'var(--marine-900)'}}>Échéance (30 jours)</span>
          <span style={{height:'44px',display:'flex',alignItems:'center',padding:'0 14px',borderRadius:'var(--rayon-3)',background:'var(--surface-douce)',fontSize:'14px',fontWeight:600,color:'var(--marine-900)'}}>{ech}</span></div></div>
      <Checkbox checked={f.identite} onChange={e=>setF({...f,identite:e.target.checked})} label="Identité du demandeur vérifiée"/>
    </div></Dialog>;
}

function DeclarerIncident({ouvert,onClose,onDeclarer}){
  const vide={decouverte:new Date().toISOString().slice(0,10),description:'',renseignements:'',personnes:'',sensibilite:'Moyenne',consequences:'',probabilite:'Faible',risque:'En évaluation',cai:false,aviserPersonnes:false,mesures:''};
  const [etape,setEtape]=React.useState(1), [f,setF]=React.useState(vide);
  React.useEffect(()=>{if(ouvert){setEtape(1);setF(vide)}},[ouvert]);
  const m=k=>e=>setF({...f,[k]:e.target.value});
  const titres=['Faits','Évaluation du risque','Décision'];
  const zone=(label,k,ph)=><label style={{display:'grid',gap:'6px'}}><span style={{fontSize:'14px',fontWeight:600,color:'var(--marine-900)'}}>{label}</span>
    <textarea rows={3} value={f[k]} onChange={m(k)} placeholder={ph} style={{width:'100%',resize:'vertical',border:FILET,borderRadius:'var(--rayon-3)',padding:'12px 14px',fontFamily:'var(--police-corps)',fontSize:'14px',color:'var(--marine-900)',outline:0}}/></label>;
  return <Dialog ouvert={ouvert} onClose={onClose} surtitre={'Étape '+etape+' sur 3 · '+titres[etape-1]} titre="Déclarer un incident" largeur={560}
    actions={<React.Fragment>{etape>1?<Button variant="secondaire" onClick={()=>setEtape(etape-1)}>Précédent</Button>:<Button variant="secondaire" onClick={onClose}>Annuler</Button>}
      {etape<3?<Button variant="primaire" onClick={()=>setEtape(etape+1)} iconeApres={<Icon name="arrow-right" size={15} color="#fff"/>}>Suivant</Button>
        :<Button variant="primaire" onClick={()=>onDeclarer(f)}>Inscrire au registre</Button>}</React.Fragment>}>
    <div style={{display:'grid',gap:'16px'}}>
      <ol style={{listStyle:'none',margin:0,padding:0,display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'8px'}}>{titres.map((t,i)=><li key={t} style={{display:'grid',gap:'6px'}}>
        <span style={{height:'4px',borderRadius:'2px',background:i<etape?'var(--bleu-500)':'var(--gris-200)'}}/><span style={{fontSize:'12.5px',fontWeight:i+1===etape?600:500,color:i+1===etape?'var(--marine-900)':'var(--texte-discret)'}}>{i+1}. {t}</span></li>)}</ol>
      {etape===1&&<React.Fragment>
        <Input label="Date de découverte" type="date" value={f.decouverte} onChange={m('decouverte')}/>
        {zone('Description','description','Ce qui s\u2019est produit, comment l\u2019incident a été constaté')}
        <Input label="Renseignements touchés" placeholder="Nom, adresse, coordonnées bancaires…" value={f.renseignements} onChange={m('renseignements')}/>
        <Input label="Nombre de personnes visées" type="number" min="0" value={f.personnes} onChange={m('personnes')}/></React.Fragment>}
      {etape===2&&<React.Fragment>
        <Select label="Sensibilité des renseignements" options={['Faible','Moyenne','Élevée']} value={f.sensibilite} onChange={m('sensibilite')}/>
        {zone('Conséquences appréhendées','consequences','Vol d\u2019identité, fraude, atteinte à la réputation…')}
        <Select label="Probabilité d'utilisation à des fins préjudiciables" options={['Faible','Moyenne','Élevée']} value={f.probabilite} onChange={m('probabilite')}/>
        <Select label="Risque de préjudice sérieux" options={['En évaluation','Oui','Non']} value={f.risque} onChange={m('risque')}/></React.Fragment>}
      {etape===3&&<React.Fragment>
        <Checkbox checked={f.cai} onChange={e=>setF({...f,cai:e.target.checked})} label="Aviser la Commission d'accès à l'information"/>
        <Checkbox checked={f.aviserPersonnes} onChange={e=>setF({...f,aviserPersonnes:e.target.checked})} label="Aviser les personnes visées"/>
        {zone('Mesures pour réduire le risque','mesures','Mots de passe réinitialisés, accès révoqués, fournisseur avisé…')}</React.Fragment>}
    </div></Dialog>;
}

function Conformite({portee='admin',notifier}){
  const d=A(); const [onglet,setOnglet]=React.useState('demandes'); const admin=portee==='admin';
  const [, maj]=React.useReducer(x=>x+1,0);
  React.useEffect(()=>{const f=()=>maj();window.addEventListener('ll-loi25',f);window.addEventListener('storage',f);return()=>{window.removeEventListener('ll-loi25',f);window.removeEventListener('storage',f)}},[]);
  const [nouvelle,setNouvelle]=React.useState(false), [declarer,setDeclarer]=React.useState(false);
  const [incidents,setIncidents]=React.useState(d.incidents);
  const toutes=[...(window.LLLoi25?window.LLLoi25.lister():[]),...d.demandes];
  const demandes=admin?toutes:toutes.filter(x=>!/Cléo|automatisée/.test(x.type));
  const enCours=demandes.filter(x=>x.etat!=='Traitée');
  const onglets=[{value:'demandes',label:'Demandes ('+demandes.length+')'},{value:'consentement',label:'Registre de consentement'},{value:'conservation',label:'Conservation'},{value:'documents',label:'Documents légaux'},{value:'incidents',label:'Incidents'}];
  if(admin)onglets.push({value:'horsquebec',label:'Communications hors Québec'});
  return <div style={{display:'grid',gap:'24px'}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
      <Tuile libelle="Demandes en cours" valeur={enCours.length} precision={enCours.length?'prochaine échéance : '+(enCours[1]||enCours[0]).echeance:'aucune échéance'} icone="mail"/>
      <Tuile libelle="Consentements actifs" valeur={admin?'1 284':'27'} variation="+38" precision={admin?'infolettre et offres':'vos locataires · infolettre'} icone="check"/>
      <Tuile libelle="Retraits (30 j)" valeur={admin?'6':'1'} precision="traités sous 24 h" icone="circle-x"/>
      <button type="button" onClick={()=>setOnglet('incidents')} aria-label="Ouvrir l'onglet Incidents" style={{all:'unset',display:'grid',cursor:'pointer',borderRadius:'var(--rayon-carte)'}}>
        <Tuile libelle="Incidents de confidentialité" valeur={incidents.length} precision="registre à jour · 2026" icone="shield-check"/></button>
    </div>
    <Carte titre="Conformité Loi 25" sous={admin?'Demandes des personnes concernées, consentements, conservation, documents publiés, incidents et communications hors Québec':'Demandes de vos locataires, bases de consentement, durées de conservation et incidents touchant vos immeubles'}
      action={<div style={{display:'flex',gap:'8px'}}><Button size="s" variant="secondaire" iconeAvant={<Icon name="download" size={15}/>}>Rapport (PDF)</Button><Button size="s" variant="primaire" onClick={()=>setNouvelle(true)} iconeAvant={<Icon name="plus" size={15} color="#fff"/>}>Nouvelle demande</Button></div>}>
      <Tabs onglets={onglets} valeur={onglet} onChange={setOnglet}/>
      <div style={{marginTop:'20px'}}>
        {onglet==='demandes'&&<div style={{display:'grid',gap:'16px'}}>
          <Avis icone="clock">Loi 25 : toute demande d'accès, de rectification ou de suppression reçoit une réponse dans les <strong>30 jours</strong>. Les échéances sont calculées automatiquement ; une décision automatisée peut toujours être révisée par une personne (art. 12.1).</Avis>
          <Tableau2 colonnes={[
            {k:'id',t:'Dossier',rendu:x=><span style={chiffre('13.5px',{fontWeight:500})}>{x.id}</span>},{k:'type',t:'Type de demande',rendu:x=><span style={{fontWeight:600,color:'var(--marine-900)'}}>{x.type}{x.source==='portail'&&<span style={{marginLeft:'8px'}}><Badge ton="bleu" taille="s">Portail</Badge></span>}</span>},{k:'qui',t:'Demandeur'},
            {k:'recue',t:'Reçue',rendu:x=><span style={{color:'var(--texte-discret)'}}>{x.recue}</span>},
            {k:'echeance',t:'Échéance',rendu:x=><span style={{fontWeight:x.etat==='Traitée'?400:600,color:x.echeance==='Immédiat'?'var(--texte-discret)':'var(--marine-900)'}}>{x.echeance}{x.jours!=null&&x.etat!=='Traitée'&&<span style={{fontSize:'12px',color:'var(--texte-discret)',fontWeight:400}}> · {x.jours} j</span>}</span>},
            {k:'etat',t:'Statut',rendu:x=><Badge ton={TON[x.ton]} taille="s">{x.etat}</Badge>},
            {k:'act',t:'',a:'right',rendu:()=><Button size="s" variant="secondaire">Ouvrir</Button>}]} lignes={demandes}/></div>}
        {onglet==='consentement'&&<div className="ll-deux-tiers" style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1.2fr)',gap:'32px'}}>
          <div style={{display:'grid',gap:'16px',alignContent:'start'}}><span style={REF}>Taux d'acceptation par catégorie de témoins (30 jours · {admin?'4 812':'—'} visiteurs)</span>
            <Progression items={d.consentements.stats.map(([l,v])=>({l,v}))}/>
            <p style={{fontSize:'12.5px',color:'var(--texte-discret)',margin:0,lineHeight:1.55}}>Le bandeau propose « Tout refuser » avec la même visibilité que « Tout accepter ». Chaque choix est horodaté et conservé 13 mois comme preuve.</p></div>
          <div style={{display:'grid',gap:'2px',alignContent:'start'}}><span style={{...REF,marginBottom:'10px'}}>Bases de consentement actives</span>
            {d.consentements.bases.map(([t,x,ton])=><div key={t} style={{display:'flex',gap:'12px',alignItems:'flex-start',padding:'10px 0',borderBottom:FILET}}>
              <Icon name={ton==='ok'?'circle-check':'triangle-alert'} size={18} color={ton==='ok'?'var(--succes-600)':'var(--alerte-600)'} style={{flex:'none',marginTop:'2px'}}/>
              <div><div style={{fontSize:'14px',fontWeight:600,color:'var(--marine-900)'}}>{t}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)',lineHeight:1.5}}>{x}</div></div></div>)}</div></div>}
        {onglet==='conservation'&&<div style={{display:'grid',gap:'16px'}}>
          <Tableau2 colonnes={[{k:'0',t:'Catégorie de renseignements',rendu:l=><span style={{fontWeight:600,color:'var(--marine-900)'}}>{l[0]}</span>},{k:'1',t:'Durée',rendu:l=><span style={{display:'inline-flex',gap:'6px',flexWrap:'wrap'}}><Badge ton="neutre" taille="s">{l[1]}</Badge>{l[3]==='avalider'&&<Badge ton="alerte" taille="s">À valider</Badge>}</span>},{k:'2',t:'Règle',rendu:l=><span style={{color:'var(--texte-corps)'}}>{l[2]}</span>},
            {k:'a',t:'',a:'right',rendu:()=>admin?<Button size="s" variant="fantome" iconeAvant={<Icon name="pencil" size={14}/>}/>:null}]} lignes={d.conservation.map((l,i)=>({...l,id:'C'+i}))}/>
          {admin&&<div style={{display:'flex',gap:'8px'}}><Button size="s" variant="secondaire" iconeAvant={<Icon name="plus" size={14}/>}>Ajouter une règle</Button><Button size="s" variant="fantome" onClick={()=>notifier('Purge exécutée','6 candidatures et 2 conversations supprimées · journalisé.')} iconeAvant={<Icon name="play" size={14}/>}>Exécuter la purge maintenant</Button></div>}</div>}
        {onglet==='documents'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
          {d.documents.map(([t,x,ton,s])=><div key={t} style={{...CARTE,padding:'18px 20px',display:'grid',gap:'8px',alignContent:'start'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px'}}><Icon name="file-text" size={20} color="var(--texte-discret)"/><Badge ton={TON[ton]} taille="s">{s}</Badge></div>
            <div style={{fontSize:'15px',fontWeight:600,color:'var(--marine-900)',lineHeight:1.3}}>{t}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{x}</div>
            <div style={{display:'flex',gap:'6px',marginTop:'6px'}}>{admin&&<Button size="s" variant="secondaire" iconeAvant={<Icon name="pencil" size={14}/>}>Modifier</Button>}<Button size="s" variant="fantome" iconeAvant={<Icon name="external-link" size={14}/>}>Voir</Button></div></div>)}</div>}
        {onglet==='incidents'&&<div style={{display:'grid',gap:'16px'}}>
          {/* À valider par l'avocat */}
          <Avis icone="triangle-alert">En cas de risque de préjudice sérieux, la Commission d'accès à l'information et les personnes visées sont avisées avec diligence (Loi 25, art. 3.5). Tout incident est inscrit au registre, même sans risque sérieux.</Avis>
          {admin&&<div><Button size="s" variant="primaire" onClick={()=>setDeclarer(true)} iconeAvant={<Icon name="plus" size={14} color="#fff"/>}>Déclarer un incident</Button></div>}
          {incidents.length===0?<p style={{fontSize:'14px',color:'var(--texte-discret)',margin:0,padding:'24px 0',textAlign:'center',borderTop:FILET}}>Aucun incident inscrit au registre en 2026.</p>
          :<Tableau2 colonnes={[{k:'date',t:'Date'},{k:'description',t:'Description',rendu:l=><span style={{fontWeight:600,color:'var(--marine-900)'}}>{l.description||'—'}</span>},{k:'renseignements',t:'Renseignements touchés'},{k:'personnes',t:'Personnes visées',a:'right'},
            {k:'risque',t:'Risque de préjudice sérieux',rendu:l=><Badge ton={l.risque==='Oui'?'urgence':l.risque==='Non'?'succes':'alerte'} taille="s">{l.risque}</Badge>},{k:'cai',t:'CAI avisée'},{k:'avisees',t:'Personnes avisées'},{k:'statut',t:'Statut',rendu:l=><Badge ton="bleu" taille="s">{l.statut}</Badge>}]} lignes={incidents}/>}</div>}
        {onglet==='horsquebec'&&admin&&<div style={{display:'grid',gap:'16px'}}>
          {/* À valider par l'avocat */}
          <Avis icone="map-pin">Toute communication de renseignements personnels à l'extérieur du Québec est précédée d'une évaluation des facteurs relatifs à la vie privée et encadrée par une entente écrite (Loi 25, art. 17).</Avis>
          <Tableau2 colonnes={[{k:'0',t:'Fournisseur',rendu:l=><span style={{fontWeight:600,color:'var(--marine-900)'}}>{l[0]}</span>},{k:'1',t:'Renseignements communiqués'},{k:'2',t:'Lieu d\u2019hébergement'},{k:'3',t:'EFVP (art. 17)'},{k:'4',t:'Entente écrite'},
            {k:'5',t:'Statut',rendu:l=><Badge ton="alerte" taille="s">{l[5]}</Badge>}]} lignes={d.horsQuebec.map((l,i)=>({...l,id:'H'+i}))}/></div>}
      </div>
    </Carte>
    <NouvelleDemandeLoi25 ouvert={nouvelle} onClose={()=>setNouvelle(false)} onCreer={f=>{const dem=window.LLLoi25.ajouter({type:f.type,qui:f.qui||'—',recue:f.recue,identite:f.identite,source:'registre'});setNouvelle(false);setOnglet('demandes');notifier('Demande inscrite au registre',dem.id+' · échéance '+dem.echeance)}}/>
    <DeclarerIncident ouvert={declarer} onClose={()=>setDeclarer(false)} onDeclarer={f=>{const dt=new Date(f.decouverte+'T00:00');const aj=new Date();const fm=x=>window.LLLoi25?window.LLLoi25.fmt(x):x.toLocaleDateString('fr-CA');
      setIncidents(l=>[{id:'I'+(l.length+1),date:fm(dt),description:f.description,renseignements:f.renseignements||'—',personnes:f.personnes||'—',risque:f.risque,cai:f.cai?fm(aj):'—',avisees:f.aviserPersonnes?fm(aj):'—',statut:'Ouvert'},...l]);
      setDeclarer(false);setOnglet('incidents');notifier('Incident inscrit au registre')}}/>
  </div>;
}

Object.assign(window,{Acces,Conformite});
