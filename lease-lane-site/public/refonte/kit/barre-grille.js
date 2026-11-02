/* Grille réglée : les contrôles directs écrivent dans les listes natives (masquées) puis émettent 'change' ; kit/logements.js filtre.
   Tout l'affichage se resynchronise quand le script réécrit #ch-n (MutationObserver) : on ne recalcule jamais le compte. */
(()=>{
  const $=id=>document.getElementById(id),F=$('lg-barre'),AV=$('lg-avance');
  if(!F||!AV)return;
  const calme=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease='cubic-bezier(.23,1,.32,1)';
  const emettre=(sel,v)=>{if(sel.value===String(v))return;sel.value=String(v);sel.dispatchEvent(new Event('change',{bubbles:true}))};
  const rouler=(el,dir,ms)=>{if(!dir||calme()||!el.animate)return;el.animate([{transform:`translateY(${dir*70}%)`,opacity:0},{transform:'none',opacity:1}],{duration:ms,easing:ease})};

  /* segments à boutons radio → liste native (Pièces, Disponible, Trier par) */
  F.querySelectorAll('.seg[data-pour]').forEach(g=>g.addEventListener('change',e=>{
    if(!e.target.matches('input[type=radio]'))return;
    e.stopPropagation();emettre($(g.dataset.pour),e.target.value)}));

  /* bloc marine qui glisse sous l'option choisie */
  function placer(g){
    const ind=g.querySelector('.seg-ind');if(!ind)return;
    const a=g.querySelector(':scope>label:has(input:checked),:scope>button[aria-pressed="true"]');
    if(!a||!a.offsetWidth){ind.style.opacity=0;return}
    ind.style.opacity=1;ind.style.width=a.offsetWidth+'px';ind.style.height=a.offsetHeight+'px';ind.style.transform=`translate(${a.offsetLeft}px,${a.offsetTop}px)`;
    if(!g.classList.contains('pret'))requestAnimationFrame(()=>requestAnimationFrame(()=>g.classList.add('pret')));
  }
  const ro=new ResizeObserver(es=>es.forEach(e=>placer(e.target)));
  F.querySelectorAll('.seg').forEach(g=>ro.observe(g));

  /* curseur à crans du loyer maximum : 1 200 $ · 1 500 $ · 2 000 $ · Aucun (sans maximum, au bout de l'échelle) */
  const MAX=[1200,1500,2000,0],MAXT=['1 200 $','1 500 $','2 000 $','Aucun'];
  const zone=F.querySelector('.cran-zone'),cran=zone.closest('.cran'),piste=zone.querySelector('.cran-piste');
  let iMax=3;
  function poserMax(i,emet){
    i=Math.max(0,Math.min(3,i));iMax=i;
    zone.style.setProperty('--p',i/3);zone.setAttribute('aria-valuenow',i);zone.setAttribute('aria-valuetext',MAXT[i]);
    cran.querySelectorAll('.cran-pts i').forEach((t,k)=>t.classList.toggle('on',k<=i));
    cran.querySelectorAll('.cran-rep span').forEach((s,k)=>s.classList.toggle('on',k===i));
    if(emet)emettre($('f-max'),MAX[i]);
  }
  zone.addEventListener('keydown',e=>{
    const k=e.key;let i=iMax;
    if(k==='ArrowRight'||k==='ArrowUp'||k==='PageUp')i++;else if(k==='ArrowLeft'||k==='ArrowDown'||k==='PageDown')i--;
    else if(k==='Home')i=0;else if(k==='End')i=3;else return;
    e.preventDefault();poserMax(i,true)});
  const versI=x=>{const r=piste.getBoundingClientRect();return Math.round(Math.max(0,Math.min(1,(x-r.left)/r.width))*3)};
  zone.addEventListener('pointerdown',e=>{if(e.button)return;zone.setPointerCapture(e.pointerId);zone.classList.add('tire');zone.focus({preventScroll:true});poserMax(versI(e.clientX),true)});
  zone.addEventListener('pointermove',e=>{if(!zone.hasPointerCapture(e.pointerId))return;const i=versI(e.clientX);if(i!==iMax)poserMax(i,true)});
  ['pointerup','pointercancel'].forEach(t=>zone.addEventListener(t,()=>zone.classList.remove('tire')));
  cran.querySelectorAll('.cran-rep span').forEach(s=>s.addEventListener('click',()=>poserMax(+s.dataset.i,true)));

  /* compteurs − / + : ils parcourent les options de la liste native, rien d'autre */
  F.querySelectorAll('.cpt').forEach(c=>{
    const sel=$(c.dataset.pour);c.querySelector('.cpt-crans').innerHTML='<i></i>'.repeat(sel.options.length-1);
    c.addEventListener('click',e=>{const b=e.target.closest('.cpt-b');if(!b||b.getAttribute('aria-disabled')==='true')return;
      const i=sel.selectedIndex+ +b.dataset.d;if(i<0||i>=sel.options.length)return;
      sel.selectedIndex=i;sel.dispatchEvent(new Event('change',{bubbles:true}))});
  });
  function majCpt(c,anim){
    const sel=$(c.dataset.pour),i=sel.selectedIndex,n=sel.options.length,v=c.querySelector('.cpt-v'),s=v.firstElementChild,t=sel.options[i].text;
    if(s.textContent!==t){const avant=+(v.dataset.i||0);s.textContent=t;if(anim)rouler(s,i>avant?1:-1,150)}
    v.dataset.i=i;v.classList.toggle('zero',i===0);
    const [m,p]=c.querySelectorAll('.cpt-b');m.setAttribute('aria-disabled',String(i===0));p.setAttribute('aria-disabled',String(i===n-1));
    c.querySelectorAll('.cpt-crans i').forEach((x,k)=>x.classList.toggle('on',k<i));
  }

  /* le compte qui défile */
  let n0=null;
  function compte(anim){
    const n=+$('ch-n').textContent;if(n===n0)return;
    const el=$('gr-n'),dir=n0==null?0:(n>n0?1:-1);
    el.textContent=n;$('gr-nt').textContent=n>1?'logements correspondent':'logement correspond';
    F.querySelector('.voir-n').textContent=n;
    if(anim)rouler(el,dir,200);n0=n;
  }

  /* synchronisation complète, après chaque rendu du script */
  const coche=(nom,v)=>F.querySelectorAll(`input[name="${nom}"]`).forEach(r=>r.checked=r.value===v);
  function sync(anim){
    const v=id=>$(id).value;
    coche('gr-pieces',v('f-pieces'));coche('gr-tri',v('f-tri'));coche('gr-dispo',v('av-dispo'));
    const im=MAX.indexOf(+v('f-max'));poserMax(im<0?3:im,false);
    F.querySelectorAll('.cpt').forEach(c=>majCpt(c,anim));
    const rive=(F.querySelector('[data-r][aria-pressed="true"]')||{dataset:{r:'tous'}}).dataset.r;
    const nAv=+$('btn-avance').querySelector('b').textContent||0;
    const on={q:!!v('f-q').trim(),rive:rive!=='tous',pieces:v('f-pieces')!=='tous',max:+v('f-max')>0,av:nAv>0,
      type:!!AV.querySelector('[name=type]:checked'),ch:+v('av-ch')>0,sdb:+v('av-sdb')>0,sup:+v('av-sup')>0,
      inclus:!!AV.querySelector('[name=inclus]:checked'),dispo:v('av-dispo')!=='tous',animaux:$('av-animaux').checked,meuble:$('av-meuble').checked};
    F.querySelectorAll('[data-crit]').forEach(c=>c.classList.toggle('on',!!on[c.dataset.crit]));
    const N=(on.q?1:0)+(on.rive?1:0)+(on.pieces?1:0)+(on.max?1:0)+nAv;
    $('gr-actifs').textContent=N?`${N} critère${N>1?'s':''} actif${N>1?'s':''}`:'Tous nos logements, sans filtre';
    $('av-effacer').setAttribute('aria-disabled',N?'false':'true');
    F.querySelector('.c-compte').classList.toggle('vide',!N);
    F.querySelectorAll('.seg').forEach(placer);
    compte(anim);
  }
  new MutationObserver(()=>sync(true)).observe($('ch-n'),{childList:true,characterData:true,subtree:true});

  /* « Effacer les critères » : le script efface la recherche avancée ; la grille efface aussi le secteur, les pièces, le loyer et la rive */
  $('av-effacer').addEventListener('click',()=>{
    emettre($('f-pieces'),'tous');emettre($('f-max'),'0');
    const q=$('f-q');if(q.value){q.value='';q.dispatchEvent(new Event('input',{bubbles:true}))}
    const t=F.querySelector('[data-r="tous"]');if(t&&t.getAttribute('aria-pressed')!=='true')t.click();
    setTimeout(()=>{const b=$('av-effacer');if(document.activeElement===document.body||!b.offsetParent)F.querySelector('.compte').focus()},0);
  });
  /* Échap ferme la recherche avancée */
  AV.addEventListener('keydown',e=>{if(e.key==='Escape'&&!AV.hidden){e.preventDefault();$('av-fermer').click()}});

  sync(false);
  if(document.fonts)document.fonts.ready.then(()=>F.querySelectorAll('.seg').forEach(placer));
})();
