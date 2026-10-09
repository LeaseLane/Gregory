const { Icon, Button, Dialog, Input, Toast } = window.LeaseLaneDesignSystem_b7a479;

const NAV=[['tableau','layout-grid','Tableau de bord'],['immeubles','building-2','Immeubles'],['locataires','users','Locataires'],['demandes','wrench','Demandes et travaux'],
  ['messages','message-square','Messages'],['finances','wallet','Finance'],['calendrier','calendar','Calendrier'],['acces','shield-check','Utilisateurs et accès'],['conformite','scale','Conformité Loi 25'],['aide','circle-help','Aide']];
const TITRES={tableau:['Tableau de bord','Septembre 2026 · 34 portes · 5 immeubles'],immeubles:['Vos immeubles','Votre parc et son occupation'],locataires:['Locataires','Baux, paiements et demandes par personne'],
  demandes:['Demandes et travaux','Du signalement à la fermeture du dossier'],messages:['Messages','Vos échanges avec l\u2019équipe Lease Lane'],finances:['Finance','Encaissements, honoraires, dépenses et relevés'],
  calendrier:['Calendrier','Visites, travaux, versements et échéances'],acces:['Utilisateurs et accès',''],conformite:['Conformité Loi 25',''],aide:['Aide','Questions fréquentes des propriétaires']};

function App(){
  const [page,setPage]=React.useState(()=>{const e=new URLSearchParams(location.search).get('ecran');return NAV.some(n=>n[0]===e)?e:'tableau'}); // ?ecran= : aperçus du site public
  const [sous,setSous]=React.useState({});           // sélection par page : immeuble, locataire, demande, message, mode ajout
  const [appro,setAppro]=React.useState(null);
  const [toast,setToast]=React.useState(null);
  const [reglages,setReglages]=useReglages('ll-portail-proprietaire');
  const data=window.LL_PROP;
  const aller=(p,sel)=>{setPage(p);setSous(s=>({...s,[p]:sel===undefined?s[p]:sel}));const el=document.getElementById('ll-main');if(el)el.scrollTop=0};
  const setSel=(p)=>v=>setSous(s=>({...s,[p]:v}));
  const badges={demandes:data.approbations.length+data.demandes.filter(d=>d.etat==='urgence').length,messages:data.messages.filter(m=>!m.lu).length};
  const notifier=(titre,message)=>{setToast({titre,message});setTimeout(()=>setToast(null),4200)};
  const im=data.immeubles.find(i=>i.id===sous.immeubles);
  return <Coquille nav={NAV} page={page} aller={aller} titres={TITRES} data={data} reglages={reglages} setReglages={setReglages} badges={badges}
    pied={{titre:'Loi 25',texte:'Toute décision automatisée peut être révisée par une personne. Demandez-le depuis le dossier.'}}
    actions={<Button size="s" variant="primaire" onClick={()=>aller('messages')} iconeAvant={<Icon name="message-square" size={15} color="#fff"/>}>Écrire à l'équipe</Button>}>
    {page==='tableau'&&<TableauBord data={data} ouvrir={setAppro} aller={aller}/>}
    {page==='immeubles'&&(sous.immeubles==='ajout'?<AjouterImmeuble retour={()=>setSel('immeubles')(null)} onCreer={()=>{setSel('immeubles')(null);notifier('Immeuble ajouté','Camille D. valide les informations sous 2 jours ouvrables.')}}/>
      :im?<FicheImmeuble im={im} data={data} retour={()=>setSel('immeubles')(null)} aller={aller}/>
      :<Immeubles data={data} ouvrirFiche={i=>setSel('immeubles')(i.id)} ajouter={()=>setSel('immeubles')('ajout')}/>)}
    {page==='locataires'&&<Locataires data={data} selId={sous.locataires} setSel={setSel('locataires')} aller={aller}/>}
    {page==='demandes'&&<Demandes data={data} ouvrir={setAppro} selId={sous.demandes||data.demandes[1].id} setSel={setSel('demandes')}/>}
    {page==='messages'&&<Messages data={data} selId={sous.messages||data.messages[0].id} setSel={setSel('messages')}/>}
    {page==='finances'&&<Finances data={data}/>}
    {page==='calendrier'&&<CalendrierPage data={data}/>}
    {page==='acces'&&<Acces portee="proprietaire" notifier={notifier} aller={aller}/>}
    {page==='conformite'&&<Conformite portee="proprietaire" notifier={notifier}/>}
    {page==='aide'&&<div style={{display:'grid',gap:'16px'}}><FAQ groupes={data.faq}/>
      <Carte><div style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}><Icon name="message-square" size={22} color="var(--marine-900)"/>
        <div style={{flex:1,minWidth:'240px'}}><div style={{fontSize:'15px',fontWeight:600,color:'var(--marine-900)'}}>Une question qui n'est pas ici ?</div><div style={{fontSize:'13.5px',color:'var(--texte-discret)'}}>Camille D. répond le jour ouvrable suivant. 418 555-0142, poste 3.</div></div>
        <Button variant="primaire" onClick={()=>aller('messages')}>Écrire à l'équipe</Button></div></Carte></div>}
    <Dialog ouvert={!!appro} onClose={()=>setAppro(null)} surtitre="Autorisation de dépense" titre={appro?appro.titre:''}
      actions={<React.Fragment><Button variant="secondaire" onClick={()=>setAppro(null)}>Refuser</Button>
        <Button variant="primaire" onClick={()=>{notifier('Dépense approuvée',appro.id+' — le fournisseur est mandaté, vous suivrez l\u2019intervention dans le dossier.');setAppro(null)}}>Approuver {appro?appro.montant:''}</Button></React.Fragment>}>
      {appro&&<div style={{display:'grid',gap:'18px'}}><p style={{fontSize:'14px',margin:0}}>{appro.adresse}</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
          <div style={{padding:'14px 16px',border:FILET,borderRadius:'var(--rayon-3)'}}><span style={REF}>Fournisseur</span><div style={{fontSize:'15px',fontWeight:600,color:'var(--marine-900)',marginTop:'6px'}}>{appro.fournisseur}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)',marginTop:'2px'}}>Licence RBQ et assurances vérifiées</div></div>
          <div style={{padding:'14px 16px',border:FILET,borderRadius:'var(--rayon-3)'}}><span style={REF}>Estimation</span><div style={chiffre('22px',{fontWeight:700,marginTop:'6px'})}>{appro.montant}</div><div style={{fontSize:'12.5px',color:'var(--texte-discret)',marginTop:'2px'}}>+ 10 % de coordination</div></div></div>
        <Input label="Note à notre équipe (facultatif)" placeholder="Une préférence, une contrainte d\u2019accès…"/></div>}
    </Dialog>
    {toast&&<div style={{position:'fixed',right:'24px',bottom:'24px',zIndex:90}}><Toast ton="succes" titre={toast.titre} message={toast.message} icone={<Icon name="circle-check" size={17}/>} onClose={()=>setToast(null)}/></div>}
  </Coquille>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
