const { Icon, Button, Badge, Tag, StatusPill, Input, Select, Switch, Tabs } = window.LeaseLaneDesignSystem_b7a479;

/* Écrans propriétaire — 1re partie : tableau de bord, immeubles (grille / liste / fiche / ajout), locataires. */

function AFaire({data,ouvrir,aller}){
  const urgences=data.demandes.filter(d=>d.etat==='urgence');
  const n=data.approbations.length+urgences.length;
  return <section>
    <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
      <h2 style={{fontSize:'16px',fontWeight:600}}>À faire maintenant</h2><Badge ton="alerte">{n}</Badge>
      <span style={{fontSize:'13px',color:'var(--texte-discret)'}}>Le reste est pris en charge par l'équipe.</span></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:'16px'}}>
      {data.approbations.map(a=><article key={a.id} style={{...CARTE,padding:'20px 22px',display:'grid',gap:'6px',alignContent:'start'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}><span style={REF}>Autorisation de dépense</span><StatusPill etat="attente_approbation" point={false}/></div>
        <div style={{fontSize:'16px',fontWeight:600,color:'var(--marine-900)',marginTop:'6px',lineHeight:1.3}}>{a.titre}</div>
        <div style={{fontSize:'13px',color:'var(--texte-discret)'}}>{a.adresse}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:'10px',marginTop:'10px',flexWrap:'wrap'}}>
          <span style={chiffre('24px',{fontWeight:700,letterSpacing:'-0.02em',whiteSpace:'nowrap'})}>{a.montant}</span>
          <span style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{a.fournisseur} · au-delà de votre seuil</span></div>
        <div style={{display:'flex',gap:'8px',marginTop:'14px',flexWrap:'wrap'}}>
          <Button size="s" variant="primaire" onClick={()=>ouvrir(a)}>Approuver</Button><Button size="s" variant="secondaire">Refuser</Button><span style={{flex:1}}/>
          <Button size="s" variant="fantome" onClick={()=>aller('demandes',a.demande)} iconeApres={<Icon name="arrow-right" size={14}/>}>Dossier</Button></div>
      </article>)}
      {urgences.map(u=><article key={u.id} style={{...CARTE,padding:'20px 22px',display:'grid',gap:'6px',alignContent:'start',borderColor:'var(--urgence-500)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}><span style={{...REF,color:'var(--urgence-600)'}}>Urgence en cours</span><StatusPill etat="urgence" point={false}/></div>
        <div style={{fontSize:'16px',fontWeight:600,color:'var(--marine-900)',marginTop:'6px',lineHeight:1.3}}>{u.titre}</div>
        <div style={{fontSize:'13px',color:'var(--texte-discret)'}}>{u.logement} · reçue le {u.date}</div>
        <p style={{fontSize:'13.5px',margin:'10px 0 0'}}>Camille D. a repris le dossier. Aucune action requise : vous suivez l'intervention.</p>
        <div style={{display:'flex',gap:'8px',marginTop:'14px'}}><Button size="s" variant="secondaire" onClick={()=>aller('demandes',u.id)} iconeApres={<Icon name="arrow-right" size={14}/>}>Suivre le dossier</Button></div>
      </article>)}
    </div>
  </section>;
}

function TableauBord({data,ouvrir,aller}){
  const [periode,setPeriode]=React.useState('6 mois');
  const ouvertes=data.demandes.filter(d=>d.etat!=='fermee');
  const portes=data.immeubles.reduce((s,i)=>s+i.portes,0), occ=data.immeubles.reduce((s,i)=>s+i.occupees,0);
  return <div style={{display:'grid',gap:'32px'}}>
    <AFaire data={data} ouvrir={ouvrir} aller={aller}/>
    <section>
      <h2 style={{fontSize:'16px',fontWeight:600,marginBottom:'14px'}}>Septembre 2026</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
        <Tuile libelle="Loyers perçus" valeur="41 280 $" variation="−2,4 %" precision="sur 43 150 $ prévus" icone="banknote"/>
        <Tuile libelle="Arriérés" valeur="1 870 $" variation="+420 $" precision="2 logements · relances en cours" icone="triangle-alert" ton="urgence"/>
        <Tuile libelle="Net versé le 30" valeur="37 830 $" variation="−1,1 %" precision="après honoraires et travaux" icone="wallet"/>
        <Tuile libelle="Demandes ouvertes" valeur={ouvertes.length} variation="+2" precision={data.approbations.length+' en attente de vous'} icone="wrench"/>
      </div>
    </section>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.6fr) minmax(0,1fr)',gap:'16px',alignItems:'start'}} className="ll-deux-tiers">
      <Carte titre="Loyers perçus" sous="En milliers de dollars">
        <GrapheBarres series={data.mois} periodes={['6 mois','12 mois','Année']} periode={periode} onPeriode={setPeriode}
          compteurs={[{l:'Encaissé',v:'245 k $',var:'+3,2 %'},{l:'Honoraires',v:'14,7 k $'},{l:'Travaux',v:'6,1 k $',var:'−12 %'},{l:'Net',v:'224 k $',var:'+4,0 %'}]}/></Carte>
      <div style={{display:'grid',gap:'16px'}}>
        <Carte titre="Occupation" sous={portes+' portes'}>
          <div style={{display:'grid',gridTemplateColumns:'auto minmax(0,1fr)',gap:'24px',alignItems:'center'}}>
            <Jauge valeur={occ/portes*100} taille={120}/>
            <Progression items={[{l:'Occupés',v:Math.round(occ/portes*100),d:occ+' / '+portes},{l:'Vacants',v:Math.round((portes-occ)/portes*100),d:(portes-occ),couleur:'var(--gris-300)'},{l:'En arriéré',v:6,d:'2',couleur:'var(--urgence-500)'}]}/></div></Carte>
        <Carte titre="Par secteur" sous="Part des loyers perçus">
          <Progression items={[{l:'Limoilou',v:38},{l:'Montcalm',v:27},{l:'Saint-Roch',v:19},{l:'Sainte-Foy',v:13},{l:'Beauport',v:7}]}/></Carte>
      </div>
    </div>
    <Carte titre="Demandes en cours" sous={ouvertes.length+' dossiers ouverts'} action={<Button size="s" variant="fantome" onClick={()=>aller('demandes')} iconeApres={<Icon name="arrow-right" size={14}/>}>Tout voir</Button>}>
      <Tableau2 colonnes={[
        {k:'titre',t:'Demande',rendu:l=><div><div style={{fontWeight:600,color:'var(--marine-900)'}}>{l.titre}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{l.id} · {l.logement}</div></div>},
        {k:'locataire',t:'Locataire'},{k:'etat',t:'État',rendu:l=><StatusPill etat={l.etat}/>},{k:'date',t:'Reçue'},
        {k:'cout',t:'Coût',a:'right',rendu:l=><span style={chiffre('14px')}>{l.cout}</span>}]} lignes={ouvertes} sur={l=>aller('demandes',l.id)}/></Carte>
  </div>;
}

/* ——— Immeubles ——— */
function CarteImmeuble({im,onClick}){
  const vac=im.portes-im.occupees;
  return <article onClick={onClick} style={{...CARTE,overflow:'hidden',cursor:'pointer',display:'grid',transition:'var(--transition-interface)'}}
    onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--ombre-3)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
    <div style={{position:'relative',aspectRatio:'16/9',background:'var(--gris-100)'}}>
      {im.photo?<img src={im.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
        :<span style={{position:'absolute',inset:0,display:'grid',placeItems:'center'}}><Icon name="building-2" size={32} color="var(--gris-300)"/></span>}
      <span style={{position:'absolute',left:'12px',top:'12px'}}><StatusPill etat={vac?'vacant':'occupe'} libelle={vac?vac+' vacant':'Complet'} point={false}/></span></div>
    <div style={{padding:'16px 18px 18px',display:'grid',gap:'4px'}}>
      <div style={{fontSize:'15px',fontWeight:600,color:'var(--marine-900)'}}>{im.adresse}</div>
      <div style={{fontSize:'13px',color:'var(--texte-discret)'}}>{im.secteur} · {im.ville}</div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginTop:'12px',paddingTop:'12px',borderTop:FILET}}>
        <span style={{fontSize:'13px',color:'var(--texte-discret)'}}>{im.portes} portes · {im.etages} étages</span>
        <span style={chiffre('16px',{fontWeight:700})}>{im.loyer}<span style={{fontSize:'12px',fontWeight:500,color:'var(--texte-discret)'}}> / mois</span></span></div>
    </div>
  </article>;
}

function Immeubles({data,ouvrirFiche,ajouter}){
  const [vue,setVue]=React.useState('grille');
  const portes=data.immeubles.reduce((s,i)=>s+i.portes,0), occ=data.immeubles.reduce((s,i)=>s+i.occupees,0);
  const bascule=(k,ic,t)=><button key={k} onClick={()=>setVue(k)} aria-label={t} title={t} aria-pressed={vue===k}
    style={{width:'36px',height:'36px',display:'grid',placeItems:'center',border:0,cursor:'pointer',borderRadius:'var(--rayon-2)',background:vue===k?'var(--marine-900)':'transparent'}}>
    <Icon name={ic} size={17} color={vue===k?'#fff':'var(--gris-400)'}/></button>;
  return <div style={{display:'grid',gap:'24px'}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
      <Tuile libelle="Portes" valeur={portes} precision={data.immeubles.length+' immeubles · Québec'} icone="building-2"/>
      <Tuile libelle="Occupation" valeur={Math.round(occ/portes*100)+' %'} precision={(portes-occ)+' logements vacants · 0 $ de frais'} icone="key"/>
      <Tuile libelle="Loyers prévus" valeur="43 150 $" variation="+1,8 %" precision="par mois, tous immeubles" icone="banknote"/>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
      <div style={{flex:'1 1 260px',maxWidth:'380px'}}><Input placeholder="Rechercher un immeuble ou un logement" aria-label="Rechercher" iconeAvant={<Icon name="search" size={16} color="var(--texte-discret)"/>}/></div>
      <div style={{width:'200px'}}><Select aria-label="Secteur" options={['Tous les secteurs','Montcalm','Limoilou','Saint-Roch','Sainte-Foy','Beauport']}/></div>
      <span style={{flex:1}}/>
      <div style={{display:'flex',gap:'4px',padding:'3px',border:FILET,borderRadius:'var(--rayon-2)',background:'var(--gris-000)'}}>{bascule('grille','grid-2x2','Grille')}{bascule('liste','list','Liste')}</div>
      <Button size="m" variant="primaire" onClick={ajouter} iconeAvant={<Icon name="plus" size={16} color="#fff"/>}>Ajouter un immeuble</Button>
    </div>
    {vue==='grille'?<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px'}}>
        {data.immeubles.map(im=><CarteImmeuble key={im.id} im={im} onClick={()=>ouvrirFiche(im)}/>)}</div>
      :<Carte rembourrage={24}><Tableau2 colonnes={[
        {k:'adresse',t:'Immeuble',rendu:l=><div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{width:'44px',height:'44px',borderRadius:'var(--rayon-2)',background:'var(--gris-100)',display:'grid',placeItems:'center',overflow:'hidden',flex:'none'}}>
            {l.photo?<img src={l.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<Icon name="building-2" size={18} color="var(--gris-400)"/>}</span>
          <div><div style={{fontWeight:600,color:'var(--marine-900)'}}>{l.adresse}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{l.secteur} · {l.ville}</div></div></div>},
        {k:'portes',t:'Portes',rendu:l=><span style={chiffre('14px')}>{l.portes}</span>},
        {k:'occupees',t:'Occupation',rendu:l=><div style={{display:'flex',alignItems:'center',gap:'10px'}}><span style={chiffre('14px')}>{l.occupees} / {l.portes}</span>
          <StatusPill etat={l.occupees===l.portes?'occupe':'vacant'} libelle={l.occupees===l.portes?'Complet':(l.portes-l.occupees)+' vacant'} point={false}/></div>},
        {k:'loyer',t:'Loyer mensuel',a:'right',rendu:l=><span style={chiffre('14px')}>{l.loyer}</span>},
        {k:'arriere',t:'Arriérés',a:'right',rendu:l=><span style={chiffre('14px',{color:l.arriere==='0 $'?'var(--texte-discret)':'var(--urgence-600)',fontWeight:l.arriere==='0 $'?500:600})}>{l.arriere}</span>},
        {k:'go',t:'',a:'right',rendu:()=><Icon name="chevron-right" size={16} color="var(--gris-400)"/>}]} lignes={data.immeubles} sur={ouvrirFiche}/></Carte>}
  </div>;
}

function FicheImmeuble({im,data,retour,aller}){
  const [onglet,setOnglet]=React.useState('logements');
  const vac=im.portes-im.occupees, demandes=data.demandes.filter(d=>d.logement.startsWith(im.adresse.split(',')[0]));
  const locs=data.locataires.filter(t=>t.logement.startsWith(im.adresse.split(',')[0]));
  return <div style={{display:'grid',gap:'20px'}}>
    <Button size="s" variant="fantome" onClick={retour} iconeAvant={<Icon name="arrow-left" size={15}/>} style={{justifySelf:'start',paddingLeft:0}}>Tous les immeubles</Button>
    <div className="ll-deux-tiers" style={{display:'grid',gridTemplateColumns:'340px minmax(0,1fr)',gap:'16px',alignItems:'start'}}>
      <div style={{display:'grid',gap:'16px'}}>
        <Carte titre="Gestionnaire attitrée">
          <FichePersonne initiales="CD" nom="Camille Desrosiers" role="Gestionnaire · Lease Lane" coordonnees={[['phone','418 555-0142, poste 3'],['mail','camille@leaselane.ai'],['clock','Lun.–ven., 8 h à 17 h']]}
            actions={<React.Fragment><Button variant="primaire" pleineLargeur onClick={()=>aller('messages')} iconeAvant={<Icon name="message-square" size={16} color="#fff"/>}>Écrire</Button><Button variant="secondaire" pleineLargeur iconeAvant={<Icon name="phone" size={16}/>}>Appeler</Button></React.Fragment>}/></Carte>
        <Carte titre="Ce mois-ci">
          <div style={{display:'grid',gap:'14px'}}>{[['Loyers perçus',im.loyer],['Arriérés',im.arriere],['Demandes ouvertes',demandes.filter(d=>d.etat!=='fermee').length],['Travaux engagés','1 460 $']].map(([l,v])=>
            <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',paddingBottom:'12px',borderBottom:FILET}}><span style={{fontSize:'14px',color:'var(--texte-discret)'}}>{l}</span><span style={chiffre('15px',{fontWeight:600})}>{v}</span></div>)}</div></Carte>
      </div>
      <div style={{display:'grid',gap:'16px'}}>
        <div style={{...CARTE,overflow:'hidden'}}>
          <div style={{position:'relative',height:'300px',background:'var(--gris-100)'}}>
            {im.photo?<img src={im.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>:<span style={{position:'absolute',inset:0,display:'grid',placeItems:'center'}}><Icon name="building-2" size={40} color="var(--gris-300)"/></span>}
            <span style={{position:'absolute',left:'16px',top:'16px'}}><StatusPill etat={vac?'vacant':'occupe'} libelle={vac?vac+' logement vacant':'Complet'} point={false}/></span>
            <button aria-label="Options" style={{position:'absolute',right:'16px',top:'16px',width:'36px',height:'36px',borderRadius:'999px',border:0,background:'rgba(255,255,255,.92)',display:'grid',placeItems:'center',cursor:'pointer'}}><Icon name="ellipsis" size={18} color="var(--marine-900)"/></button></div>
          <div style={{padding:'24px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'24px',flexWrap:'wrap'}}>
              <div><h2 style={{fontSize:'24px',fontWeight:700,letterSpacing:'-0.02em'}}>{im.adresse}</h2>
                <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'14px',color:'var(--texte-discret)',marginTop:'6px'}}><Icon name="map-pin" size={14}/>{im.secteur}, {im.ville}<Button size="s" variant="fantome" iconeAvant={<Icon name="files" size={13}/>}>Copier</Button></div></div>
              <div style={{textAlign:'right'}}><span style={REF}>Loyers</span><div style={chiffre('26px',{fontWeight:700,letterSpacing:'-0.02em'})}>{im.loyer}<span style={{fontSize:'13px',fontWeight:500,color:'var(--texte-discret)'}}> / mois</span></div></div></div>
            <div style={{marginTop:'18px'}}><Pilules items={[['building-2',im.portes+' portes'],['layers',im.etages+' étages'],['calendar','Construit en '+im.annee],['key',im.occupees+' occupés'],['car','Stationnement 6 places']]}/></div>
          </div>
        </div>
        <Carte rembourrage={24} titre={undefined}>
          <Tabs onglets={[{value:'logements',label:'Logements ('+im.portes+')'},{value:'locataires',label:'Locataires ('+locs.length+')'},{value:'demandes',label:'Demandes ('+demandes.length+')'},{value:'documents',label:'Documents'}]} valeur={onglet} onChange={setOnglet}/>
          <div style={{marginTop:'20px'}}>
            {onglet==='logements'&&<Tableau2 colonnes={[{k:'0',t:'N°',rendu:l=><span style={chiffre('14px')}>{l[0]}</span>},{k:'1',t:'Type'},{k:'2',t:'Loyer',a:'right',rendu:l=><span style={chiffre('14px')}>{l[2]}</span>},
              {k:'3',t:'État',rendu:l=><StatusPill etat={l[3]==='Occupé'?'occupe':l[3]==='Vacant'?'vacant':'retard'} libelle={l[3]} point={false}/>},{k:'4',t:'Locataire'}]} lignes={im.logements.map((l,i)=>({...l,id:'L'+i}))}/>}
            {onglet==='locataires'&&(locs.length?<Tableau2 colonnes={[{k:'nom',t:'Locataire',rendu:l=><div style={{display:'flex',alignItems:'center',gap:'10px'}}><Avatar initiales={l.initiales} taille={32} ton="clair"/><span style={{fontWeight:600,color:'var(--marine-900)'}}>{l.nom}</span></div>},
              {k:'logement',t:'Logement'},{k:'bail',t:'Bail'},{k:'loyer',t:'Loyer',a:'right',rendu:l=><span style={chiffre('14px')}>{l.loyer}</span>},{k:'etat',t:'Paiement',rendu:l=><StatusPill etat={l.etat} point={false}/>}]} lignes={locs} sur={l=>aller('locataires',l.id)}/>
              :<p style={{fontSize:'14px',color:'var(--texte-discret)',margin:0}}>Aucun locataire n'est encore rattaché à cet immeuble dans le prototype.</p>)}
            {onglet==='demandes'&&(demandes.length?<Tableau2 colonnes={[{k:'titre',t:'Demande',rendu:l=><div><div style={{fontWeight:600,color:'var(--marine-900)'}}>{l.titre}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{l.id} · {l.logement}</div></div>},
              {k:'etat',t:'État',rendu:l=><StatusPill etat={l.etat}/>},{k:'date',t:'Reçue'},{k:'cout',t:'Coût',a:'right',rendu:l=><span style={chiffre('14px')}>{l.cout}</span>}]} lignes={demandes} sur={l=>aller('demandes',l.id)}/>
              :<p style={{fontSize:'14px',color:'var(--texte-discret)',margin:0}}>Aucune demande pour cet immeuble.</p>)}
            {onglet==='documents'&&<div style={{display:'grid',gap:'0'}}>{[['Acte de propriété','PDF · 2,1 Mo'],['Police d\u2019assurance 2026','PDF · 640 ko'],['Rapport d\u2019inspection — toiture','PDF · 4,8 Mo'],['Plans d\u2019étage','PDF · 1,2 Mo']].map(([n,s])=>
              <div key={n} style={{display:'grid',gridTemplateColumns:'40px minmax(0,1fr) auto',alignItems:'center',gap:'14px',padding:'12px 0',borderBottom:FILET}}>
                <span style={{width:'40px',height:'40px',borderRadius:'var(--rayon-2)',border:FILET,display:'grid',placeItems:'center'}}><Icon name="file-text" size={17} color="var(--marine-900)"/></span>
                <div><div style={{fontSize:'14px',fontWeight:600,color:'var(--marine-900)'}}>{n}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{s}</div></div>
                <Button size="s" variant="fantome" iconeAvant={<Icon name="download" size={14}/>}>Télécharger</Button></div>)}</div>}
          </div></Carte>
      </div>
    </div>
  </div>;
}

function AjouterImmeuble({retour,onCreer}){
  const [f,setF]=React.useState({adresse:'',secteur:'Montcalm',portes:'',etages:'',annee:'',loyer:''});
  const maj=k=>e=>setF({...f,[k]:e.target.value});
  return <div style={{display:'grid',gap:'20px'}}>
    <Button size="s" variant="fantome" onClick={retour} iconeAvant={<Icon name="arrow-left" size={15}/>} style={{justifySelf:'start',paddingLeft:0}}>Annuler</Button>
    <div className="ll-deux-tiers" style={{display:'grid',gridTemplateColumns:'340px minmax(0,1fr)',gap:'16px',alignItems:'start'}}>
      <div style={{display:'grid',gap:'16px',position:'sticky',top:0}}>
        <span style={REF}>Aperçu</span>
        <CarteImmeuble im={{adresse:f.adresse||'Adresse de l\u2019immeuble',secteur:f.secteur,ville:'Québec',portes:f.portes||'—',occupees:f.portes||0,etages:f.etages||'—',loyer:f.loyer?f.loyer+' $':'— $'}}/>
        <Button variant="primaire" pleineLargeur onClick={onCreer} iconeAvant={<Icon name="plus" size={16} color="#fff"/>}>Ajouter l'immeuble</Button>
        <p style={{fontSize:'12.5px',color:'var(--texte-discret)',margin:0}}>Camille D. valide les informations sous 2 jours ouvrables, puis les logements deviennent visibles.</p>
      </div>
      <div style={{display:'grid',gap:'16px'}}>
        <Carte titre="Photos de l'immeuble" sous="La première devient la photo principale"><ZoneDepot/></Carte>
        <Carte titre="Informations">
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'20px 24px'}}>
            <div style={{gridColumn:'1 / -1'}}><Input label="Adresse" placeholder="1180, avenue Cartier" value={f.adresse} onChange={maj('adresse')}/></div>
            <Select label="Secteur" options={['Montcalm','Limoilou','Saint-Roch','Sainte-Foy','Beauport','Charlesbourg','Lebourgneuf','Vieux-Québec']} value={f.secteur} onChange={maj('secteur')}/>
            <Select label="Type" options={['Immeuble à logements','Duplex / triplex','Maison','Copropriété']}/>
            <Input label="Nombre de portes" placeholder="8" value={f.portes} onChange={maj('portes')}/>
            <Input label="Étages" placeholder="3" value={f.etages} onChange={maj('etages')}/>
            <Input label="Année de construction" placeholder="1962" value={f.annee} onChange={maj('annee')}/>
            <Input label="Loyers mensuels prévus" placeholder="11 240" suffixe="$" value={f.loyer} onChange={maj('loyer')}/>
            <Select label="Chauffage" options={['Électrique, aux locataires','Central, inclus','Gaz, inclus']}/>
            <Select label="Stationnement" options={['Aucun','Extérieur','Intérieur','Extérieur et intérieur']}/>
            <div style={{gridColumn:'1 / -1'}}><Input label="Notes pour l'équipe (facultatif)" placeholder="Code d\u2019accès, particularités, fournisseurs habituels…"/></div>
          </div></Carte>
        <Carte titre="Règles de gestion">
          <div style={{display:'grid',gap:'14px'}}>
            <Switch label="Seuil d'autorisation à 500 $" description="Toute dépense au-delà vous est soumise." defaultChecked/>
            <Switch label="Je garde la décision finale sur les locataires" description="Sinon, l'équipe sélectionne selon vos critères." defaultChecked/>
            <Switch label="Reçus de loyer automatiques aux locataires" defaultChecked/></div></Carte>
      </div>
    </div>
  </div>;
}

/* ——— Locataires ——— */
function Locataires({data,selId,setSel,aller}){
  const sel=data.locataires.find(t=>t.id===selId);
  if(sel)return <FicheLocataire t={sel} data={data} retour={()=>setSel(null)} aller={aller}/>;
  return <div style={{display:'grid',gap:'24px'}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
      <Tuile libelle="Locataires" valeur={data.locataires.length} precision="sur 32 logements occupés" icone="users"/>
      <Tuile libelle="À jour" valeur={data.locataires.filter(t=>t.etat==='paye').length} precision="loyers de septembre reçus" icone="circle-check"/>
      <Tuile libelle="En retard" valeur={data.locataires.filter(t=>t.etat==='retard').length} precision="relances automatiques envoyées" icone="clock" ton="urgence"/>
      <Tuile libelle="Documents" valeur="38" precision="6 catégories · 2 ajoutés cette semaine" icone="files"/>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
      <div style={{flex:'1 1 260px',maxWidth:'380px'}}><Input placeholder="Rechercher un locataire" aria-label="Rechercher" iconeAvant={<Icon name="search" size={16} color="var(--texte-discret)"/>}/></div>
      <div style={{width:'220px'}}><Select aria-label="Immeuble" options={['Tous les immeubles',...data.immeubles.map(i=>i.adresse)]}/></div>
      <span style={{flex:1}}/><Button variant="secondaire" iconeAvant={<Icon name="plus" size={16}/>}>Ajouter un locataire</Button></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
      {data.locataires.map(t=><article key={t.id} onClick={()=>setSel(t.id)} style={{...CARTE,padding:'20px',cursor:'pointer',display:'grid',gap:'14px',transition:'var(--transition-interface)'}}
        onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--ombre-3)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}><Avatar initiales={t.initiales} taille={44}/>
          <div style={{minWidth:0,flex:1}}><div style={{fontSize:'15px',fontWeight:600,color:'var(--marine-900)'}}>{t.nom}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.logement}</div></div>
          <StatusPill etat={t.etat} point={false}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',paddingTop:'12px',borderTop:FILET}}>
          <div><span style={REF}>Loyer</span><div style={chiffre('15px',{fontWeight:600,marginTop:'2px'})}>{t.loyer}</div></div>
          <div><span style={REF}>Depuis</span><div style={chiffre('15px',{fontWeight:600,marginTop:'2px'})}>{t.depuis}</div></div></div>
      </article>)}
    </div>
  </div>;
}

function FicheLocataire({t,data,retour,aller}){
  const dem=data.demandes.filter(d=>d.locataire===t.nom);
  const [onglet,setOnglet]=React.useState('documents');
  return <div style={{display:'grid',gap:'20px'}}>
    <Button size="s" variant="fantome" onClick={retour} iconeAvant={<Icon name="arrow-left" size={15}/>} style={{justifySelf:'start',paddingLeft:0}}>Tous les locataires</Button>
    <div className="ll-deux-tiers" style={{display:'grid',gridTemplateColumns:'340px minmax(0,1fr)',gap:'16px',alignItems:'start'}}>
      <Carte><FichePersonne initiales={t.initiales} nom={t.nom} role={'Locataire depuis '+t.depuis} coordonnees={[['house',t.logement],['phone',t.tel],['mail',t.courriel]]}
        note="Les échanges passent par l'équipe Lease Lane : le locataire ne voit pas vos coordonnées."
        actions={<React.Fragment><Button variant="primaire" pleineLargeur onClick={()=>aller('messages')} iconeAvant={<Icon name="message-square" size={16} color="#fff"/>}>Message via l'équipe</Button><Button variant="secondaire" pleineLargeur iconeAvant={<Icon name="file-text" size={16}/>}>Voir le bail</Button></React.Fragment>}/></Carte>
      <div style={{display:'grid',gap:'16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'16px'}}>
          <Tuile libelle="Loyer mensuel" valeur={t.loyer} precision="échéance le 1er" icone="banknote"/>
          <Tuile libelle="Paiement" valeur={t.etat==='paye'?'À jour':'En retard'} ton={t.etat==='paye'?undefined:'urgence'} precision={t.etat==='paye'?'reçu le 1er sept.':'relance J+7 envoyée'} icone={t.etat==='paye'?'circle-check':'clock'}/>
          <Tuile libelle="Bail" valeur={t.bail.split(' → ')[1]} precision={'depuis le '+t.bail.split(' → ')[0]} icone="file-text"/></div>
        <Carte rembourrage={24}>
          <Tabs onglets={[{value:'documents',label:'Documents'},{value:'paiements',label:'Paiements'},{value:'demandes',label:'Demandes ('+dem.length+')'}]} valeur={onglet} onChange={setOnglet}/>
          <div style={{marginTop:'20px'}}>
            {onglet==='documents'&&<DossierLocataire t={t}/>}
            {onglet==='paiements'&&<div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(12,minmax(0,1fr))',gap:'6px'}}>
                {['O','N','D','J','F','M','A','M','J','J','A','S'].map((m,i)=>{const tard=t.etat==='retard'&&i===11, partiel=t.etat==='retard'&&i===9;
                  return <div key={i} style={{display:'grid',gap:'6px',justifyItems:'center'}}>
                    <div style={{width:'100%',height:'40px',borderRadius:'var(--rayon-1)',background:tard?'var(--urgence-500)':partiel?'var(--alerte-500)':'var(--succes-500)',opacity:tard||partiel?1:.85}} title={m}/>
                    <span style={{...REF,fontSize:'11px'}}>{m}</span></div>;})}</div>
              <div style={{display:'flex',gap:'18px',marginTop:'14px',fontSize:'12.5px',color:'var(--texte-discret)'}}>{[['succes','Reçu à temps'],['alerte','Partiel'],['urgence','En retard']].map(([k,l])=><span key={k} style={{display:'inline-flex',alignItems:'center',gap:'6px'}}><span style={{width:'10px',height:'10px',borderRadius:'2px',background:'var(--'+k+'-500)'}}/>{l}</span>)}</div></div>}
            {onglet==='demandes'&&(dem.length?<Tableau2 colonnes={[{k:'titre',t:'Demande',rendu:l=><div><div style={{fontWeight:600,color:'var(--marine-900)'}}>{l.titre}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{l.id}</div></div>},{k:'etat',t:'État',rendu:l=><StatusPill etat={l.etat}/>},{k:'date',t:'Reçue'},{k:'cout',t:'Coût',a:'right',rendu:l=><span style={chiffre('14px')}>{l.cout}</span>}]} lignes={dem} sur={l=>aller('demandes',l.id)}/>
              :<p style={{fontSize:'14px',color:'var(--texte-discret)',margin:0}}>Aucune demande de service.</p>)}
          </div></Carte>
      </div>
    </div>
  </div>;
}

/* Dossier documentaire du locataire : dépôt + classement par catégorie, filtre, liste. */
const CATEGORIES_DOC=[['bail','file-text','Bail et annexes'],['identite','user','Identité et enquête'],['paiements','receipt','Paiements et reçus'],['avis','mail','Avis et correspondance'],['tal','gavel','TAL et juridique'],['etat','camera','États des lieux'],['autre','files','Autres']];
function DossierLocataire({t}){
  const initiaux=[
    {id:'D1',nom:'Bail '+t.bail.split(' → ')[0].slice(-4)+'-'+t.bail.split(' → ')[1].slice(-4)+' (formulaire TAL)',cat:'bail',date:'12 mai 2025',taille:'1,8 Mo',par:'Camille D.'},
    {id:'D2',nom:'Annexe — règlements de l’immeuble',cat:'bail',date:'12 mai 2025',taille:'320 ko',par:'Camille D.'},
    {id:'D3',nom:'Enquête de crédit et références',cat:'identite',date:'4 mai 2025',taille:'640 ko',par:'Camille D.'},
    {id:'D4',nom:'État des lieux d’entrée (24 photos)',cat:'etat',date:'1 juill. 2025',taille:'38 Mo',par:'Camille D.'},
    {id:'D5',nom:'Reçu de loyer — septembre 2026',cat:'paiements',date:'1 sept. 2026',taille:'90 ko',par:'Plateforme'},
    {id:'D6',nom:'Avis de travaux — inspection de la toiture',cat:'avis',date:'12 sept. 2026',taille:'140 ko',par:'Camille D.'}];
  const [docs,setDocs]=React.useState(initiaux);
  const [cat,setCat]=React.useState('tous');
  const [catDepot,setCatDepot]=React.useState('bail');
  const [sur,setSur]=React.useState(false);
  const ajouter=fichiers=>{const n=[...fichiers].map((f,i)=>({id:'N'+Date.now()+i,nom:f.name,cat:catDepot,date:'Aujourd’hui',taille:(f.size/1024>1000?(f.size/1048576).toFixed(1)+' Mo':Math.round(f.size/1024)+' ko'),par:'Vous',nouveau:true}));setDocs(d=>[...n,...d])};
  const visibles=docs.filter(d=>cat==='tous'||d.cat===cat);
  const nCat=k=>docs.filter(d=>d.cat===k).length;
  const libelle=k=>(CATEGORIES_DOC.find(c=>c[0]===k)||[])[2];
  return <div style={{display:'grid',gap:'20px'}}>
    <div onDragOver={e=>{e.preventDefault();setSur(true)}} onDragLeave={()=>setSur(false)} onDrop={e=>{e.preventDefault();setSur(false);ajouter(e.dataTransfer.files)}}
      style={{display:'grid',gridTemplateColumns:'auto minmax(0,1fr) auto',gap:'16px',alignItems:'center',padding:'16px 18px',border:'1px dashed '+(sur?'var(--bleu-500)':'var(--gris-300)'),borderRadius:'var(--rayon-3)',background:sur?'var(--bleu-025)':'var(--surface-douce)',transition:'var(--transition-interface)'}}>
      <span style={{width:'44px',height:'44px',borderRadius:'999px',background:'var(--gris-000)',border:FILET,display:'grid',placeItems:'center'}}><Icon name="upload" size={19} color="var(--marine-900)"/></span>
      <div style={{minWidth:0}}><div style={{fontSize:'14px',fontWeight:600,color:'var(--marine-900)'}}>Déposez un document ici, ou parcourez</div>
        <div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>PDF, JPG, PNG · 25 Mo max. · chiffré au repos, conservé 3 ans après la fin du bail (Loi 25)</div></div>
      <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
        <div style={{width:'200px'}}><Select taille="s" aria-label="Classer sous" options={CATEGORIES_DOC.map(c=>c[2])} value={libelle(catDepot)} onChange={e=>setCatDepot(CATEGORIES_DOC.find(c=>c[2]===e.target.value)[0])}/></div>
        <label style={{display:'inline-flex'}}><input type="file" multiple style={{display:'none'}} onChange={e=>{ajouter(e.target.files);e.target.value=''}}/>
          <span style={{height:'38px',padding:'0 16px',display:'inline-flex',alignItems:'center',borderRadius:'999px',background:'var(--marine-900)',color:'#fff',fontSize:'13.5px',fontWeight:600,cursor:'pointer'}}>Parcourir</span></label></div>
    </div>
    {/* À valider par l'avocat */}
    {catDepot==='identite'&&<div role="note" style={{display:'flex',gap:'12px',alignItems:'flex-start',padding:'14px 16px',background:'var(--alerte-100)',borderRadius:'var(--rayon-3)'}}><Icon name="triangle-alert" size={18} color="var(--alerte-600)" style={{flex:'none',marginTop:'1px'}}/>
      <span style={{fontSize:'13.5px',lineHeight:1.55,color:'var(--alerte-600)',fontWeight:500}}>Ne déposez jamais de numéro d'assurance sociale, de numéro de permis de conduire ni de carte d'assurance maladie. L'enquête de crédit n'est déposée qu'avec le consentement signé du candidat.</span></div>}
    <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
      <Tag actif={cat==='tous'} onClick={()=>setCat('tous')}>Tous · {docs.length}</Tag>
      {CATEGORIES_DOC.map(([k,ic,l])=><Tag key={k} actif={cat===k} onClick={()=>setCat(k)} icone={<Icon name={ic} size={13}/>}>{l}{nCat(k)?' · '+nCat(k):''}</Tag>)}</div>
    {visibles.length===0?<p style={{fontSize:'14px',color:'var(--texte-discret)',margin:0,padding:'24px 0',textAlign:'center'}}>Aucun document dans « {libelle(cat)} ». Déposez-en un ci-dessus.</p>
      :<Tableau2 colonnes={[
        {k:'nom',t:'Document',rendu:l=><div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{width:'38px',height:'38px',flex:'none',borderRadius:'var(--rayon-2)',border:FILET,display:'grid',placeItems:'center',background:l.nouveau?'var(--bleu-025)':'transparent'}}><Icon name={(CATEGORIES_DOC.find(c=>c[0]===l.cat)||[])[1]||'file-text'} size={16} color="var(--marine-900)"/></span>
          <div style={{minWidth:0}}><div style={{fontWeight:600,color:'var(--marine-900)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.nom}{l.nouveau&&<Badge ton="bleu" taille="s" style={{marginLeft:'8px'}}>Nouveau</Badge>}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)'}}>{l.taille} · ajouté par {l.par}</div></div></div>},
        {k:'cat',t:'Catégorie',rendu:l=><div style={{width:'180px'}}><Select taille="s" aria-label="Catégorie" options={CATEGORIES_DOC.map(c=>c[2])} value={libelle(l.cat)} onChange={e=>setDocs(ds=>ds.map(d=>d.id===l.id?{...d,cat:CATEGORIES_DOC.find(c=>c[2]===e.target.value)[0]}:d))}/></div>},
        {k:'date',t:'Date'},
        {k:'act',t:'',a:'right',rendu:l=><span style={{display:'inline-flex',gap:'4px'}}><Button size="s" variant="fantome" iconeAvant={<Icon name="eye" size={14}/>}/><Button size="s" variant="fantome" iconeAvant={<Icon name="download" size={14}/>}/><Button size="s" variant="fantome" onClick={()=>setDocs(ds=>ds.filter(d=>d.id!==l.id))} iconeAvant={<Icon name="trash-2" size={14}/>}/></span>}]} lignes={visibles}/>}
  </div>;
}

Object.assign(window,{TableauBord,Immeubles,FicheImmeuble,AjouterImmeuble,Locataires,CarteImmeuble});
