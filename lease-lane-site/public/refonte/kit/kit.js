/* LeaseLane — refonte A, comportements communs : menu plein écran, entrées au défilement, onglets,
   sommaire de page, démo Cléo, maître-détail, témoignages et petits automatismes de formulaire. */

/* Menu : rubriques et liens du site actuel, pointés vers les pages du prototype. */
const MENU_ICO={"immeuble":"<path d=\"M4 21V3.5h10V21\"/><path d=\"M14 9h6v12\"/><path d=\"M2.5 21h19\"/><path d=\"M7.5 7.5h3M7.5 11h3M7.5 14.5h3\"/>","etiquette":"<path d=\"M3 12V3h9l9 9-9 9z\"/><circle cx=\"7.5\" cy=\"7.5\" r=\"1.5\"/>","graph":"<path d=\"M4 20V4M4 20h16\"/><path d=\"M8 16v-4M12 16V8M16 16v-6\"/>","echange":"<path d=\"M4 8h13l-3-3M20 16H7l3 3\"/>","doc":"<path d=\"M6 3h8l4 4v14H6z\"/><path d=\"M14 3v4h4M9 12h6M9 16h6\"/>","lieu":"<path d=\"M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.5\" r=\"2.5\"/>","balance":"<path d=\"M12 3v18M7 21h10M5 7h14\"/><path d=\"M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z\"/>","cle":"<circle cx=\"8\" cy=\"15\" r=\"4\"/><path d=\"M11 12l9-9M17 6l2 2M15 8l2 2\"/>","maison":"<path d=\"M3 11.5 12 4l9 7.5\"/><path d=\"M5.5 9.5V20h13V9.5\"/><path d=\"M10 20v-5h4v5\"/>","info":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6M12 7.5v.5\"/>","outil":"<path d=\"M15 4a5 5 0 0 0-6 6l-6 6 3 3 6-6a5 5 0 0 0 6-6l-3 3-3-1-1-3z\"/>","suivi":"<path d=\"M4 6h16M4 12h10M4 18h7\"/><path d=\"M16 17l2 2 4-4\"/>","bulle":"<path d=\"M4 5h16v11H9l-5 4z\"/>","stylo":"<path d=\"M4 20l4-1 11-11-3-3L5 16z\"/><path d=\"M14 6l3 3\"/>","cession":"<path d=\"M7 7h11l-3-3M17 17H6l3 3\"/><rect x=\"3\" y=\"10\" width=\"7\" height=\"4\"/>","faq":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17v.5\"/>","joindre":"<path d=\"M4 6h16v12H4z\"/><path d=\"M4 7l8 6 8-6\"/>","blogue":"<path d=\"M5 4h14v16H5z\"/><path d=\"M8 8h8M8 12h8M8 16h5\"/>","cleo":"<path d=\"M6 11.5 12 5.5l6 6\"/><path d=\"M6 16l6-6 6 6\"/><path d=\"M6 20.5l6-6 6 6\"/>","entreprise":"<path d=\"M3 8h18v12H3z\"/><path d=\"M8 8V5h8v3M3 13h18\"/>","cadenas":"<rect x=\"5\" y=\"11\" width=\"14\" height=\"10\"/><path d=\"M8 11V8a4 4 0 0 1 8 0v3\"/>"};
const MENU_ONGLETS=[
 [["Gestion immobilière","immeuble","/gestion-immobiliere"],["Location et mise en marché","etiquette","/gestion-immobiliere/location"],["Expertise et stratégie","graph","/expertise-et-strategie"],["Changement de gestionnaire","echange","/changer-de-gestionnaire"],["Obtenir une offre de service","doc","/offre-de-service"],["Le Guide Local","lieu","/guide-local"],["Droit du logement · TAL","balance","/cleo#tal"]],
 [["Service aux locataires","cle","/locataires"],["Demande de travaux","outil","/locataires#services"],["Suivi d’une demande","suivi","/locataires#suivi"],["Administration et plaintes","bulle","/commentaire-ou-plainte"],["Endossement au bail","stylo","/locataires#services"],["Cession de bail","cession","/locataires#services"],["Droit du logement · TAL","balance","/cleo#tal"]],
 [["Logements à louer","maison","/logements-a-louer"],["Demande de location","doc","/locataires/demande-de-location"],["Le Guide Local","lieu","/guide-local"],["Foire aux questions","faq","/faq"]],
 [["À propos","info","/a-propos"],["Nous joindre","joindre","/nous-joindre"],["Foire aux questions","faq","/faq"],["Blogue et nouvelles","blogue","/blogue"],["Cléo","cleo","/cleo"],["Inscrire mon entreprise","entreprise","/inscrire-mon-entreprise"],["Politique de confidentialité","cadenas","/confidentialite"]]
];
(function(){
  const menu=document.getElementById('menu');if(!menu)return;
  const ouvrir=document.querySelector('.burger'),fermer=menu.querySelector('.menu-fermer'),liste=document.getElementById('menu-liens'),ongl=[...menu.querySelectorAll('[role=tab]')];
  const ici=location.pathname.split('/').pop()||'/';
  const FL='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.5 12h14M12.5 6.5 18 12l-5.5 5.5" stroke="currentColor" stroke-width="1.75"/></svg>';
  const ic=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${MENU_ICO[k]}</svg>`;
  function onglet(i){ongl.forEach((b,k)=>{b.setAttribute('aria-selected',k===i);b.tabIndex=k===i?0:-1});liste.innerHTML=MENU_ONGLETS[i].map(([t,k,h])=>`<li><a href="${h}"${h===ici?' aria-current="page"':''}><span class="ic">${ic(k)}</span><b>${t}</b><span class="fl">${FL}</span></a></li>`).join('')}
  ongl.forEach((b,i)=>{b.onclick=()=>onglet(i);b.onkeydown=e=>{const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(d){const n=(i+d+ongl.length)%ongl.length;ongl[n].focus();onglet(n)}}});
  onglet(+(document.body.dataset.onglet||0));
  function ouvre(){menu.hidden=false;document.body.classList.add('menu-ouvert');ouvrir.setAttribute('aria-expanded','true');fermer.focus()}
  function ferme(){menu.hidden=true;document.body.classList.remove('menu-ouvert');ouvrir.setAttribute('aria-expanded','false');ouvrir.focus()}
  ouvrir.addEventListener('click',ouvre);fermer.addEventListener('click',ferme);
  menu.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(a&&!a.getAttribute('href').startsWith('#'))ferme()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden)ferme()});
  menu.querySelectorAll('.menu-langue button').forEach(b=>b.onclick=()=>menu.querySelectorAll('.menu-langue button').forEach(x=>x.setAttribute('aria-pressed',x===b)));
})();

/* Entrées au défilement, une seule fois. */
(function(){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));
  document.querySelectorAll('a[href="#"]').forEach(a=>a.addEventListener('click',e=>e.preventDefault()));
  document.querySelectorAll('form:not([data-libre])').forEach(f=>f.addEventListener('submit',e=>e.preventDefault()));
})();

/* Onglets génériques : [data-onglets] contient des [role=tab] liés à leurs [role=tabpanel] par aria-controls. */
document.querySelectorAll('[data-onglets]').forEach(z=>{
  const tabs=[...z.querySelectorAll('[role=tab]')].filter(t=>t.closest('[data-onglets]')===z);
  function choisir(t,focus){tabs.forEach(x=>{const on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;const p=document.getElementById(x.getAttribute('aria-controls'));if(p)p.hidden=!on});if(focus)t.focus();z.dispatchEvent(new CustomEvent('onglet',{detail:t}))}
  tabs.forEach((t,i)=>{t.addEventListener('click',()=>choisir(t));t.addEventListener('keydown',e=>{const v=z.dataset.onglets==='v';const d=(e.key===(v?'ArrowDown':'ArrowRight'))?1:(e.key===(v?'ArrowUp':'ArrowLeft'))?-1:0;if(d){e.preventDefault();choisir(tabs[(i+d+tabs.length)%tabs.length],true)}})});
  const dep=tabs.find(t=>t.getAttribute('aria-selected')==='true')||tabs[0];if(dep)choisir(dep);
});

/* Sommaire de page et sommaire de lecture : la section visible est soulignée. */
document.querySelectorAll('.sommaire, .toc').forEach(nav=>{
  const liens=[...nav.querySelectorAll('a[href^="#"]')];const cibles=liens.map(a=>document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if(!cibles.length)return;
  const vu=new Map();
  const io=new IntersectionObserver(es=>{es.forEach(e=>vu.set(e.target,e.isIntersecting));const c=cibles.find(t=>vu.get(t));if(c)liens.forEach(a=>{const on=a.getAttribute('href')==='#'+c.id;a.setAttribute('aria-current',on);if(on&&nav.classList.contains('sommaire')){const ol=a.closest('ol');if(ol&&ol.scrollWidth>ol.clientWidth+4){const x=a.getBoundingClientRect().left-ol.getBoundingClientRect().left+ol.scrollLeft;ol.scrollTo({left:Math.max(0,x-24),behavior:'smooth'})}}})},{rootMargin:'-90px 0px -55% 0px'});
  cibles.forEach(t=>io.observe(t));
});

/* Démo Cléo : chaque question affiche sa réponse; les onglets Propriétaire / Locataire changent la liste. */
document.querySelectorAll('[data-demo]').forEach(d=>{
  const rep=d.querySelector('.demo-r p');
  function brancher(){d.querySelectorAll('.demo-q:not([hidden]) button').forEach(b=>b.onclick=()=>{d.querySelectorAll('.demo-q button').forEach(x=>x.setAttribute('aria-pressed',x===b));rep.textContent=b.dataset.r;rep.closest('.demo-r').animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.23,1,.32,1)'})})}
  brancher();
  d.addEventListener('onglet',()=>{const b=d.querySelector('.demo-q:not([hidden]) button');if(b){brancher();b.click()}});
});

/* Témoignages : précédent, suivant, position. */
document.querySelectorAll('[data-temoins]').forEach(z=>{
  const items=[...z.querySelectorAll('.temoin')],pos=z.querySelector('.pos'),pts=z.querySelector('.points-n');let i=0;
  if(pts)pts.innerHTML=items.map(()=>'<i></i>').join('');
  function voir(n){i=(n+items.length)%items.length;items.forEach((t,k)=>t.hidden=k!==i);if(pos)pos.textContent=String(i+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');if(pts)[...pts.children].forEach((p,k)=>p.classList.toggle('on',k===i))}
  z.querySelector('[data-prec]').onclick=()=>voir(i-1);z.querySelector('[data-suiv]').onclick=()=>voir(i+1);voir(0);
});

/* Compteurs de caractères. */
document.querySelectorAll('[data-max]').forEach(t=>{const c=document.getElementById(t.dataset.compteur);const m=+t.dataset.max;const maj=()=>{if(c)c.textContent=t.value.length+' / '+m};t.maxLength=m;t.addEventListener('input',maj);maj()});

/* Progression : « X sur N complétés » et barre de l'en-tête, une étape par question obligatoire. */
document.querySelectorAll('form[data-prog]').forEach(f=>{
  const txt=f.querySelector('.form-tete .prog'),bar=f.querySelector('.form-tete .barre'),q=[],vus=new Set();
  f.querySelectorAll('[required],[data-req]').forEach(c=>{
    if(c.type==='radio'){if(vus.has(c.name))return;vus.add(c.name);q.push(()=>!!f.querySelector(`input[name="${c.name}"]:checked`))}
    else if(c.type==='checkbox')q.push(()=>c.checked);else q.push(()=>!!c.value.trim())});
  const modele=f.dataset.prog||'{n} sur {t} complétés';
  const maj=()=>{const n=q.filter(t=>t()).length;if(txt)txt.textContent=modele.replace('{n}',n).replace('{t}',q.length);if(bar)bar.style.setProperty('--p',(q.length?n/q.length*100:0)+'%')};
  f.addEventListener('input',maj);f.addEventListener('change',maj);maj();
});

/* Nombre de logements : moins et plus; une tuile data-n le préremplit. */
document.querySelectorAll('.pas').forEach(z=>{
  const v=z.querySelector('input'),f=z.closest('form'),pose=x=>{v.value=x;v.dispatchEvent(new Event('input',{bubbles:true}))};
  z.querySelectorAll('[data-pas]').forEach(b=>b.addEventListener('click',()=>pose(Math.max(1,(+v.value||0)+(+b.dataset.pas)))));
  if(f)f.querySelectorAll('input[data-n]').forEach(r=>r.addEventListener('change',()=>pose(r.dataset.n)));
});

/* Récapitulatif : chaque champ marqué data-recap écrit sa valeur dans la ligne correspondante. */
document.querySelectorAll('[data-recap-de]').forEach(f=>{
  const zone=document.getElementById(f.dataset.recapDe);if(!zone)return;
  const maj=()=>{zone.querySelectorAll('[data-cle]').forEach(dd=>{const k=dd.dataset.cle;const el=f.querySelector(`[data-recap="${k}"]:checked`)||f.querySelector(`input[data-recap="${k}"]:not([type=radio]):not([type=checkbox])`);const v=el?(el.dataset.libelle||el.value):'';dd.textContent=v||dd.dataset.vide})};
  f.addEventListener('input',maj);f.addEventListener('change',maj);maj();
});

/* FAQ : dans la colonne de gauche, le nombre de questions de la page, entre le titre et la carte de Cléo */
document.querySelectorAll('.fq-g').forEach(g=>{const [a,b]=g.children;const c=a&&a.querySelector(':scope>.carte-cleo');const n=b?b.querySelectorAll(':scope>details').length:0;if(!c||n<2)return;
  const tous=/faq\.html$/.test(location.pathname)?'':'<a class="lien" href="/faq">Toute la foire aux questions<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.5 12h14M12.5 6.5 18 12l-5.5 5.5" stroke="currentColor" stroke-width="1.75"/></svg></a>';
  c.insertAdjacentHTML('beforebegin',`<div class="fq-stat"><p class="fq-stat-n"><b>${String(n).padStart(2,'0')}</b><span>questions<br>et leurs réponses</span></p><ol class="fq-stat-l" aria-hidden="true">${[...b.querySelectorAll(':scope>details summary')].map((x,i)=>`<li><i>${String(i+1).padStart(2,'0')}</i>${x.textContent.trim().replace(/^\d+/,'')}</li>`).join('')}</ol>${tous}</div>`)});

