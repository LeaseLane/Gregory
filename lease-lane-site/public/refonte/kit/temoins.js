/* LeaseLane — bulle de Cléo et choix des témoins (1er nov. 2026, repris du site : src/proto/cleo-temoins.jsx et app.jsx).
   La bulle ronde de Cléo reste en bas à droite de chaque page et ouvre son panneau de clavardage (/refonte/kit/cleo.js). Au premier passage (ou à l'échéance du choix),
   Cléo demande les témoins dans une petite bulle (Refuser, Accepter, Choisir); « Choisir » et « Gérer mes témoins » ouvrent le détail
   par catégorie. Le choix est gardé 12 mois (version 1.0 de la politique), comme sur le site. */
(()=>{
  const CLE='ll-temoins',VERSION='1.0',MOIS=12,AV='/assets/img/cleo-avatar.png';
  const CATS=[['preferences','Préférences','Filtres de recherche et logements consultés'],['audience','Mesure d’audience','Statistiques de fréquentation'],['publicite','Publicité et reciblage','Mesure de nos campagnes, annonces sur d’autres sites']];
  const AUCUN={preferences:false,audience:false,publicite:false},TOUS={preferences:true,audience:true,publicite:true};
  const X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const lire=()=>{try{const v=JSON.parse(localStorage.getItem(CLE));if(!v||v.version!==VERSION)return null;const lim=new Date(v.date);lim.setMonth(lim.getMonth()+MOIS);return lim<new Date()?null:v}catch(e){return null}};
  const resume=p=>{const n=CATS.filter(([k])=>p[k]).length;return n===0?'témoins essentiels seulement':n===CATS.length?'tous les témoins acceptés':n+' catégorie'+(n>1?'s':'')+' acceptée'+(n>1?'s':'')+' en plus des essentiels'};

  const racine=document.createElement('div');racine.className='cl-flot';
  racine.innerHTML=`<div class="ct" hidden></div><button type="button" class="cl-bulle" aria-label="Parler à Cléo, l’agent IA de LeaseLane"><img src="${AV}" alt="" width="64" height="64"><i aria-hidden="true"></i></button>`;
  document.body.appendChild(racine);
  const ct=racine.querySelector('.ct');let prefs={...AUCUN},retour=null,minuteur=0;
  const tete=(t,s,x)=>`<div class="ct-tete"><img src="${AV}" alt=""><span><b id="ct-t">${t}</b><small>${s}</small></span>${x?`<button type="button" class="ct-x" data-a="x" aria-label="${lire()?'Fermer sans modifier':'Revenir'}">${X}</button>`:''}</div>`;
  function vue(v){
    clearTimeout(minuteur);
    if(!v){ct.hidden=true;ct.innerHTML='';try{retour&&retour.focus()}catch(e){}return}
    ct.hidden=false;ct.dataset.vue=v;ct.setAttribute('role',v==='ok'?'status':'dialog');ct.setAttribute('aria-labelledby','ct-t');
    if(v==='bulle')ct.innerHTML=tete('Cléo · Vos témoins','Agent IA de LeaseLane')+`<p class="ct-tx">Je n’utilise que les témoins essentiels. Vous permettez les autres pour m’aider à améliorer le site? <a href="/temoins">En savoir plus</a></p><div class="ct-act"><button type="button" class="ct-b" data-a="non">Refuser</button><button type="button" class="ct-b" data-a="oui">Accepter</button><button type="button" class="ct-b" data-a="choisir">Choisir</button></div>`;
    if(v==='detail')ct.innerHTML=tete('Vos témoins','Choisissez catégorie par catégorie',true)+`<div class="ct-cats"><div class="ct-cat"><span><b>Essentiels</b><small>Sécurité, session, langue, vos choix de témoins, fenêtre de Cléo</small></span><span class="ct-fixe">Toujours actifs</span></div>${CATS.map(([k,t,d])=>`<div class="ct-cat"><span id="ct-l-${k}"><b>${t}</b><small>${d}</small></span><button type="button" role="switch" class="ct-sw" data-k="${k}" aria-checked="${prefs[k]}" aria-labelledby="ct-l-${k}"></button></div>`).join('')}</div><p class="ct-tx"><a href="/temoins">Politique relative aux témoins</a></p><div class="ct-act"><button type="button" class="ct-b" data-a="non">Tout refuser</button><button type="button" class="ct-b" data-a="garder">Enregistrer</button><button type="button" class="ct-b" data-a="oui">Tout accepter</button></div>`;
    if(v==='ok'){ct.innerHTML=`<div class="ct-ok"><img src="${AV}" alt=""><p id="ct-t">C’est noté : ${resume(prefs)}. Vous pouvez changer d’avis en tout temps dans « Gérer mes témoins ».</p><button type="button" class="ct-x" data-a="fermer" aria-label="Fermer le message">${X}</button></div>`;minuteur=setTimeout(()=>vue(null),5000)}
    const f=ct.querySelector(v==='detail'?'.ct-sw':'.ct-b');if(f)f.focus({preventScroll:true});
  }
  function enregistrer(p){prefs={...p};try{localStorage.setItem(CLE,JSON.stringify({...p,version:VERSION,date:new Date().toISOString()}))}catch(e){}dispatchEvent(new CustomEvent('ll-temoins-choix',{detail:{...p,version:VERSION}}));vue('ok')}
  ct.addEventListener('click',e=>{
    const sw=e.target.closest('.ct-sw');if(sw){const k=sw.dataset.k;prefs[k]=!prefs[k];sw.setAttribute('aria-checked',prefs[k]);return}
    const a=(e.target.closest('[data-a]')||{}).dataset?.a;
    if(a==='non')enregistrer(AUCUN);else if(a==='oui')enregistrer(TOUS);else if(a==='garder')enregistrer(prefs);
    else if(a==='choisir'){prefs={...AUCUN};vue('detail')}else if(a==='x')vue(lire()?null:'bulle');else if(a==='fermer')vue(null);
  });
  addEventListener('keydown',e=>{if(e.key!=='Escape'||ct.hidden)return;if(ct.dataset.vue==='detail')vue(lire()?null:'bulle');else if(ct.dataset.vue==='ok')vue(null)});
  /* « Gérer mes témoins » (pied de page) : le détail, avec le choix actuel */
  document.addEventListener('click',e=>{const g=e.target.closest('[data-gerer-temoins]');if(!g)return;e.preventDefault();retour=g;const v=lire();prefs=v?{preferences:!!v.preferences,audience:!!v.audience,publicite:!!v.publicite}:{...AUCUN};vue('detail')});
  if(!lire())setTimeout(()=>vue('bulle'),900);
})();
