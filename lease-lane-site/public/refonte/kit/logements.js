/* LeaseLane — refonte A : page de toutes les propriétés (/logements-a-louer).
   Direction retenue (29 oct.) : Liste en rangées, Carrés en cartes blanches (quatre rangées par page), Carte en perspective.
   Cadre à filets (31 oct.) : les Carrés forment un « mur » à bords partagés (.mur de kit/filets.css), la disponibilité est une étiquette .etat.
   Recherche avancée : type de propriété, chambres, salles de bain, superficie, disponibilité, inclusions, animaux.
   Annonces : window.LOGEMENTS (/refonte/kit/logements-data.js). Cartes : CARTE_QC et CARTE_QC_PLUS, dessinées par kit/carte.js. */
(()=>{
  const L=window.LOGEMENTS||[],PH=window.LOGEMENTS_PHOTOS||{},A='/assets/',C=window.CARTE_QC;
  const photo=k=>A+PH[k];
  const ico=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I={lit:'<path d="M3 18V7M3 13h18v5M21 18v-5a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="10.5" r="1.5"/>',bain:'<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M7 19l-1 2M17 19l1 2"/>',
    surf:'<path d="M4 4h16v16H4z"/><path d="M4 9h5V4M20 15h-5v5"/>',an:'<rect x="3.5" y="5" width="17" height="15"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    fl:'<path d="M3.5 12h14M12.5 6.5 18 12l-5.5 5.5"/>',plus:'<path d="M12 5v14M5 12h14"/>',moins:'<path d="M5 12h14"/>',cible:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    x:'<path d="M6 6l12 12M18 6 6 18"/>',g:'<path d="M15 5l-7 7 7 7"/>',d:'<path d="M9 5l7 7-7 7"/>',tri:'<path d="M12 5v14M7 14l5 5 5-5"/>'};
  const TRAIT='<svg viewBox="0 0 28 12" fill="none" aria-hidden="true"><path d="M1 5H26.4M21.8 .6L26.4 5L21.8 9.4" stroke="currentColor" stroke-width="1.5"/><path d="M1 9.6H18" stroke="#6A9AD5" stroke-width="1.5"/></svg>';
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const prix=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' $';
  const RIVE={nord:'Rive-Nord',sud:'Rive-Sud'};
  /* statut : vert = disponible maintenant, jaune = disponible à la fin du bail en cours, rouge = non disponible (loué).
     Étiquette .etat : la date réelle de l'annonce, la couleur de la légende; le libellé de la légende reste lisible par les lecteurs d'écran. */
  const STATUT={vert:'disponible maintenant',jaune:'disponible à la fin du bail',rouge:'non disponible'},ETAT={vert:'vert',jaune:'ambre',rouge:'rouge'};
  const lien=o=>`/logements-a-louer?id=${o.id}`;
  const pieces=o=>o.type==='Maison'?5.5:parseFloat(o.type);
  const specs=o=>`<ul class="specs-l"><li>${ico(I.lit)}${o.chambres} ch.</li><li>${ico(I.bain)}${o.sdb} sdb</li><li>${ico(I.surf)}${prix(o.superficie).replace(' $','')} pi²</li></ul>`;
  const etat=o=>`<span class="etat ${ETAT[o.statut]}">${esc(o.dispo)}<span class="sr"> · ${STATUT[o.statut]}</span></span>`;
  const badge=o=>o.badge?`<span class="badge-l">${esc(o.badge)}</span>`:'';

  /* ——— état (dans l'adresse : ?vue=liste|carres|carte&rive=…) ——— */
  const q=new URLSearchParams(location.search);
  const S={vue:['liste','carres','carte'].includes(q.get('vue'))?q.get('vue'):'carres',rive:['nord','sud'].includes(q.get('rive'))?q.get('rive'):'tous',
    pieces:q.get('pieces')||'tous',max:+q.get('max')||0,tri:q.get('tri')||'recent',q:'',page:1,
    av:{type:[],ch:0,sdb:0,sup:0,dispo:'tous',inclus:[],animaux:false,meuble:false}};
  const res=document.getElementById('lg-res'),plein=document.getElementById('lg-plein'),nb=document.getElementById('lg-nb'),haut=document.getElementById('resultats');
  const sauver=()=>{const p=new URLSearchParams({vue:S.vue});if(S.rive!=='tous')p.set('rive',S.rive);if(S.pieces!=='tous')p.set('pieces',S.pieces);if(S.max)p.set('max',S.max);if(S.tri!=='recent')p.set('tri',S.tri);history.replaceState(null,'','?'+p)};
  const sa=t=>t.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  function liste(){
    let r=L.filter(o=>(S.rive==='tous'||o.zone===S.rive)&&(!S.max||o.loyer<=S.max)&&(!S.q||sa(o.titre+' '+o.secteur+' '+o.adresse).includes(S.q)));
    const a=S.av,auj='2026-10-29',dans=j=>{const d=new Date(auj);d.setDate(d.getDate()+j);return d.toISOString().slice(0,10)};
    if(a.type.length)r=r.filter(o=>a.type.includes(o.propriete==='Condo locatif'?'Appartement':o.propriete));
    if(a.ch)r=r.filter(o=>o.chambres>=a.ch);if(a.sdb)r=r.filter(o=>o.sdb>=a.sdb);if(a.sup)r=r.filter(o=>o.superficie>=a.sup);
    if(a.dispo==='maintenant')r=r.filter(o=>o.dispoTri<=auj);else if(a.dispo==='30')r=r.filter(o=>o.dispoTri<=dans(30));else if(a.dispo==='90')r=r.filter(o=>o.dispoTri<=dans(90));
    if(a.inclus.length)r=r.filter(o=>a.inclus.every(x=>o.inclus.includes(x)));
    if(a.animaux)r=r.filter(o=>o.animaux!=='Sans animaux');if(a.meuble)r=r.filter(o=>o.badge==='Meublé');
    if(S.pieces!=='tous'){const p=+S.pieces;r=r.filter(o=>p===1?pieces(o)<3:p===5?pieces(o)>=5:Math.floor(pieces(o))===p)}
    const T={'prix-asc':(a,b)=>a.loyer-b.loyer,'prix-desc':(a,b)=>b.loyer-a.loyer,dispo:(a,b)=>a.dispoTri.localeCompare(b.dispoTri),
      secteur:(a,b)=>a.secteur.localeCompare(b.secteur,'fr'),pieces:(a,b)=>pieces(a)-pieces(b),superficie:(a,b)=>a.superficie-b.superficie};
    const [k,sens]=S.tri.split(':');if(T[k]){r.sort(T[k]);if(sens==='desc')r.reverse()}
    return r;
  }

  /* ——— pagination ——— */
  function pagination(n,parPage){
    const pages=Math.max(1,Math.ceil(n/parPage));S.page=Math.min(S.page,pages);if(pages<2)return '';
    let b=`<nav class="pagin" aria-label="Pages de résultats"><button type="button" data-p="${S.page-1}" ${S.page===1?'disabled':''} aria-label="Page précédente">${ico(I.g)}</button>`;
    for(let i=1;i<=pages;i++)b+=`<button type="button" data-p="${i}" ${i===S.page?'aria-current="page"':''}>${i}</button>`;
    return b+`<button type="button" data-p="${S.page+1}" ${S.page===pages?'disabled':''} aria-label="Page suivante">${ico(I.d)}</button></nav><p class="pagin-n">Page ${S.page} de ${pages} · ${parPage} logements par page</p>`;
  }
  const tranche=(r,n)=>r.slice((S.page-1)*n,S.page*n);

  /* ——— Liste ——— */
  const rangee=o=>`<article class="lr"><a class="lr-img" href="${lien(o)}" tabindex="-1" aria-hidden="true"><img src="${photo(o.photos[0])}" alt="" loading="lazy">${badge(o)}</a>
    <div class="lr-c"><p class="lr-sect">${esc(o.secteur)} · ${RIVE[o.zone]}</p><h3><a href="${lien(o)}">${esc(o.titre)}</a></h3><p class="lr-adr">${esc(o.adresse)}</p>${specs(o)}<ul class="chips-l">${o.inclus.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="lr-p"><p class="prix-l"><b>${prix(o.loyer)}</b> <span>/mois</span></p>${etat(o)}<a class="btn btn-p" href="${lien(o)}">Voir le logement${TRAIT}</a></div></article>`;
  /* ——— Carrés : colonnes selon la largeur, toujours quatre rangées par page.
     Mur à la Attio (31 oct.) : une cellule par logement, photo en retrait en haut, puis loyer, titre, caractéristiques et état;
     la dernière rangée est complétée de cellules vides pour que le mur reste un rectangle. Même carte dans la fiche (/refonte/kit/logement.js, « Logements semblables »). ——— */
  const colonnes=()=>innerWidth<=640?1:innerWidth<=900?2:innerWidth<=1100?3:4;
  const carreB=o=>`<a class="sb" href="${lien(o)}"><span class="sb-img"><img src="${photo(o.photos[0])}" alt="" loading="lazy">${badge(o)}</span><span class="sb-c"><span class="sb-h"><span class="prix-l"><b>${prix(o.loyer)}</b> <span>/mois</span></span><span class="sb-go" aria-hidden="true">${ico(I.fl)}</span></span><b class="sb-t">${esc(o.titre)}</b>${specs(o).replace('<ul','<span').replace('</ul>','</span>').replace(/<li>/g,'<span>').replace(/<\/li>/g,'</span>')}${etat(o)}</span></a>`;
  const mur=(cartes,col)=>`<div class="mur lg-mur" style="--c:${col}">${cartes.join('')}${'<span class="mur-vide" aria-hidden="true"></span>'.repeat((col-cartes.length%col)%col)}</div>`;

  /* ——— Carte : la carte détaillée (défs du sol) ——— */
  const DEFS='<defs><linearGradient id="hc-eau" gradientUnits="userSpaceOnUse" x1="0" y1="900" x2="0" y2="0"><stop offset="0" stop-color="#C3D8F0"/><stop offset=".55" stop-color="#B4CDEC"/><stop offset="1" stop-color="#A6C3E8"/></linearGradient><radialGradient id="hc-fondu" cx=".5" cy=".5" r=".5"><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>'+
    `<mask id="hc-masque" maskUnits="userSpaceOnUse" x="0" y="0" width="${C.i.W}" height="${C.i.H}"><rect width="${C.i.W}" height="${C.i.H}" fill="url(#hc-fondu)"/></mask><radialGradient id="hc-lumiere"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".45" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
  const [MX,MY,MW]=C.cadre,MS=MW/C.i.W;
  let nettoyer=()=>{};
  /* ——— Carte en perspective : la carte couchée, chaque logement debout sur son point, la caméra vole vers le logement choisi ——— */
  function carteB(r){
    plein.innerHTML=`<div class="cb"><div class="scene"><div class="plan"><svg class="sol" aria-hidden="true" focusable="false"></svg></div><div class="cb-voile"></div><div class="cb-pins"></div></div>
      
      <div class="cb-ctl"><button type="button" data-n="-1" aria-label="Logement précédent">${ico(I.g)}</button><span aria-live="polite"></span><button type="button" data-n="1" aria-label="Logement suivant">${ico(I.d)}</button></div></div>
      <div class="crs"><button type="button" class="crs-fl g" data-n="-1" aria-label="Logement précédent">${ico(I.g)}</button><div class="crs-piste" role="list">${r.map((o,i)=>`<div class="cc" role="listitem" tabindex="0" data-i="${i}"><img src="${photo(o.photos[0])}" alt="" loading="lazy"><span><span class="prix-l"><b>${prix(o.loyer)}</b> <span>/mois</span></span><span class="mini-t">${esc(o.titre)}</span><span class="mini-s"><i class="s-${o.statut}" aria-hidden="true"></i>${o.chambres} ch. · ${esc(o.dispo)}</span><a href="${lien(o)}">Voir le logement${ico(I.fl)}</a></span></div>`).join('')}</div><button type="button" class="crs-fl d" data-n="1" aria-label="Logement suivant">${ico(I.d)}</button></div>`;
    if(!r.length){plein.querySelector('.cb').insertAdjacentHTML('beforeend','<div class="lg-vide cb-vide"><b>Aucun logement ne correspond.</b>Élargissez la recherche.</div>');return}
    const st=plein.querySelector('.cb'),sc=st.querySelector('.scene'),plan=sc.querySelector('.plan'),sol=plan.firstChild,pins=sc.querySelector('.cb-pins'),piste=plein.querySelector('.crs-piste'),cpt=st.querySelector('.cb-ctl span');
    const calme=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let G=null,cx=r[0].x,cy=r[0].y,i0=0,anim=0,premier=true;
    function geo(){
      const HW=st.clientWidth,HH=st.clientHeight,etroit=HW<=1100,deg=etroit?50:54,t=deg*Math.PI/180,c=Math.cos(t),s=Math.sin(t);
      const P=Math.max(etroit?600:900,HW*(etroit?1.05:.74)),sx=HW*.5,sy=HH*(etroit?.5:.5),ox=sx,by=HH+40,yt=-24;
      const PH=P*(by-yt)/(P*c+yt*s),kt=P/(P+PH*s),L=ox+(-30-ox)/kt,PW=(ox+(HW+30-ox)/kt)-L,T=by-PH;
      const v=P*(sy-by)/(P*c+sy*s),kp=P/(P-v*s),px=ox+(sx-ox)/kp-L,py=PH+v,f=(etroit?(HW<600?.3:.24):.17)*kp;
      G={HW,HH,deg,c,s,P,ox,by,PH,kt,L,PW,px,py,kp,f};
      sc.style.perspective=P+'px';sc.style.perspectiveOrigin=ox+'px 0px';plan.style.cssText=`left:${L}px;top:${T}px;width:${PW}px;height:${PH}px;transform:rotateX(${deg}deg)`;
      let quad='';for(let x=-200;x<=1080;x+=18)quad+=`M${x} -200V1060`;for(let y=-200;y<=1060;y+=18)quad+=`M-200 ${y}H1080`;
      sol.setAttribute('preserveAspectRatio','none');
      sol.innerHTML=DEFS+window.carteSol(f,MX,MY,MS)+`<path d="${quad}" fill="none" stroke="#3767A2" stroke-opacity=".08" stroke-width="${1.2*f}"/><g class="marque"><circle r="${260*f}" fill="url(#hc-lumiere)"/></g>`;
    }
    function cam(X,Y){
      cx=X;cy=Y;const g=G,x0=X-g.px*g.f,y0=Y-g.py*g.f;
      sol.setAttribute('viewBox',`${x0} ${y0} ${g.PW*g.f} ${g.PH*g.f}`);sol.querySelector('.marque').setAttribute('transform',`translate(${r[i0].x} ${r[i0].y})`);
      const pr=(a,b)=>{const u=(a-x0)/g.f,w=(b-y0)/g.f-g.PH,k=g.P/(g.P-w*g.s);return{x:g.ox+(g.L+u-g.ox)*k,y:(g.by+w*g.c)*k,k}};
      const vus=r.map((o,i)=>({o,i,p:pr(o.x,o.y)})).filter(v=>v.p.k>g.kt*1.05&&v.p.x>-60&&v.p.x<g.HW+60&&v.p.y>70&&v.p.y<g.HH-14).sort((a,b)=>b.p.y-a.p.y);
      /* cercles du repère choisi : mesurés une fois au centre de la vue, donc toujours de la même taille et du même angle */
      const c0=pr(cx,cy),c1=pr(cx+46*g.f,cy),c2=pr(cx,cy-46*g.f),c3=pr(cx,cy+46*g.f),ell=[2*(c1.x-c0.x),c3.y-c2.y];pins.style.setProperty('--ow',ell[0].toFixed(1)+'px');pins.style.setProperty('--oh',ell[1].toFixed(1)+'px');
      const pris=[],sv=vus.find(v=>v.i===i0);if(sv)pris.push({x:sv.p.x,y:sv.p.y-70,w:110,h:150});let h='',n=0;
      vus.forEach(v=>{const on=v.i===i0;if(!on&&sv&&Math.abs(v.p.x-sv.p.x)<60&&v.p.y>sv.p.y-150&&v.p.y<sv.p.y+24)return;const kk=Math.min(1.1,Math.max(.72,v.p.k/g.kp)),w=(prix(v.o.loyer).length*7.4+16)*kk,top=v.p.y-28*kk-26*kk;
        const libreChip=on||pris.every(b=>Math.abs(b.x-v.p.x)>(b.w+w)/2+4||Math.abs(b.y-top)>((b.h||26*kk)+26*kk)/2+4);if(libreChip&&!on)pris.push({x:v.p.x,y:top,w});
        let extra='';if(on){extra=`style="--ow:${ell[0].toFixed(1)}px;--oh:${ell[1].toFixed(1)}px;left:${v.p.x}px;top:${v.p.y}px;z-index:${Math.round(v.p.y)}"`}
        h+=`<button type="button" class="dr s-${v.o.statut}${on?' on':''}" data-i="${v.i}" ${extra||`style="left:${v.p.x}px;top:${v.p.y}px;--k:${kk.toFixed(2)};--n:${Math.min(n++,14)};z-index:${Math.round(v.p.y)}"`} aria-label="${esc(v.o.titre)}, ${prix(v.o.loyer)} par mois">${on?'<span class="anneaux"><i></i></span><span class="onde"></span>':'<span class="sol"></span>'}<span class="h"></span><span class="pt s-${v.o.statut}"></span>${on?window.carteFleches:''}${libreChip?`<span class="chip"><i aria-hidden="true"></i>${prix(v.o.loyer)}</span>`:''}</button>`});
      pins.innerHTML=h;
    }
    function choisir(i,voler=true){
      i0=(i+r.length)%r.length;cpt.textContent=`${i0+1} / ${r.length}`;
      piste.querySelectorAll('.cc').forEach((c,k)=>c.classList.toggle('on',k===i0));const c=piste.children[i0];if(c)piste.scrollTo({left:c.offsetLeft-(piste.clientWidth-c.offsetWidth)/2,behavior:calme?'auto':'smooth'});
      const tx=r[i0].x,ty=r[i0].y,fx=cx,fy=cy;cancelAnimationFrame(anim);
      if(!voler||calme){cam(tx,ty);return}
      const t0=performance.now(),d=Math.min(1400,600+Math.hypot(tx-fx,ty-fy)*9),e=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      const pas=n=>{const k=Math.min(1,(n-t0)/d),v=e(k);cam(fx+(tx-fx)*v,fy+(ty-fy)*v);if(k<1)anim=requestAnimationFrame(pas)};anim=requestAnimationFrame(pas);
    }
    pins.addEventListener('click',e=>{const b=e.target.closest('.dr');if(b)choisir(+b.dataset.i)});
    piste.addEventListener('click',e=>{if(e.target.closest('a'))return;const c=e.target.closest('.cc');if(c)choisir(+c.dataset.i)});
    piste.addEventListener('keydown',e=>{const c=e.target.closest('.cc');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();choisir(+c.dataset.i)}});
    st.querySelector('.cb-ctl').addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(b)choisir(i0+ +b.dataset.n)});
    plein.querySelector('.crs').addEventListener('click',e=>{const b=e.target.closest('.crs-fl');if(b)choisir(i0+ +b.dataset.n)});
    let cle='';const ro=new ResizeObserver(()=>{const k=st.clientWidth+'x'+st.clientHeight;if(k===cle)return;cle=k;geo();cam(cx,cy);
      if(premier){premier=false;if(!calme){pins.classList.add('pose');setTimeout(()=>pins.classList.remove('pose'),1700)}choisir(0,false);if(!calme)plan.animate([{transform:`rotateX(${G.deg-16}deg)`,opacity:0},{transform:`rotateX(${G.deg}deg)`,opacity:1}],{duration:1500,easing:'cubic-bezier(.22,1,.36,1)'})}});
    ro.observe(st);nettoyer=()=>{ro.disconnect();cancelAnimationFrame(anim)};
  }

  /* ——— rendu ——— */
  function rendre(){
    nettoyer();nettoyer=()=>{};const r=liste();sauver();
    document.getElementById('ch-n').textContent=r.length;
    document.querySelectorAll('.charte-s [data-s]').forEach(b=>{b.textContent=r.filter(o=>o.statut===b.dataset.s).length});
    nb.innerHTML=`${r.length} logement${r.length>1?'s':''} <span>${S.rive==='tous'?'rive nord et rive sud':RIVE[S.rive].toLowerCase()}</span>`;
    document.querySelectorAll('[data-v]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===S.vue));
    document.querySelectorAll('[data-r]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.r===S.rive));
    res.innerHTML='';plein.innerHTML='';plein.hidden=true;res.hidden=false;
    if(!r.length&&S.vue!=='carte'){res.innerHTML='<div class="lg-vide"><b>Aucun logement ne correspond.</b>Élargissez la recherche : une autre rive, plus de pièces, un loyer plus élevé ou moins de critères avancés.</div>';return}
    if(S.vue==='liste'){const n=10;res.innerHTML=`<div class="la">${tranche(r,n).map(rangee).join('')}</div>`+pagination(r.length,n)}
    else if(S.vue==='carres'){const col=colonnes(),n=col*4;res.innerHTML=mur(tranche(r,n).map(carreB),col)+pagination(r.length,n)}
    else{res.hidden=true;plein.hidden=false;carteB(r)}
  }
  /* ——— commandes ——— */
  document.getElementById('lg-barre').addEventListener('click',e=>{const v=e.target.closest('[data-v]'),rv=e.target.closest('[data-r]');
    if(v){S.vue=v.dataset.v;S.page=1;S.sel=null;rendre()}if(rv){S.rive=rv.dataset.r;S.page=1;rendre()}});
  const f=id=>document.getElementById(id);
  f('f-q').addEventListener('input',e=>{S.q=sa(e.target.value.trim());S.page=1;rendre()});
  f('f-pieces').value=S.pieces;f('f-max').value=String(S.max);f('f-tri').value=['recent','prix-asc','prix-desc','dispo'].includes(S.tri)?S.tri:'recent';
  f('f-pieces').addEventListener('change',e=>{S.pieces=e.target.value;S.page=1;rendre()});
  f('f-max').addEventListener('change',e=>{S.max=+e.target.value;S.page=1;rendre()});
  f('f-tri').addEventListener('change',e=>{S.tri=e.target.value;rendre()});
  document.querySelectorAll('[data-r] small').forEach(s=>{const z=s.parentNode.dataset.r;s.textContent=z==='tous'?L.length:L.filter(o=>o.zone===z).length});
  /* carte flottante de la bannière : toutes les annonces, par rive, et le loyer le plus bas */
  const fl={n:L.length,nord:L.filter(o=>o.zone==='nord').length,sud:L.filter(o=>o.zone==='sud').length,min:L.length?prix(Math.min(...L.map(o=>o.loyer))):''};
  document.querySelectorAll('[data-fl]').forEach(e=>{e.textContent=fl[e.dataset.fl]});
  res.addEventListener('click',e=>{const p=e.target.closest('[data-p]');if(p&&!p.disabled){S.page=+p.dataset.p;rendre();haut.scrollIntoView({behavior:'smooth',block:'start'});return}
  });
  /* recherche avancée : ouvrir et fermer le panneau, lire les critères, compter les critères actifs */
  const av=f('lg-avance'),btnAv=f('btn-avance'),nbAv=btnAv.querySelector('b');
  btnAv.addEventListener('click',()=>{const o=av.hidden;av.hidden=!o;btnAv.setAttribute('aria-expanded',o);if(o)av.querySelector('input,select').focus()});
  function lireAv(){const a=S.av,v=n=>[...av.querySelectorAll(`[name="${n}"]:checked`)].map(x=>x.value);
    a.type=v('type');a.inclus=v('inclus');a.ch=+f('av-ch').value;a.sdb=+f('av-sdb').value;a.sup=+f('av-sup').value;a.dispo=f('av-dispo').value;a.animaux=f('av-animaux').checked;a.meuble=f('av-meuble').checked;
    const n=a.type.length+a.inclus.length+(a.ch?1:0)+(a.sdb?1:0)+(a.sup?1:0)+(a.dispo!=='tous'?1:0)+(a.animaux?1:0)+(a.meuble?1:0);nbAv.textContent=n;nbAv.hidden=!n;S.page=1;rendre()}
  av.addEventListener('change',lireAv);
  f('av-effacer').addEventListener('click',()=>{av.querySelectorAll('input[type=checkbox]').forEach(x=>x.checked=false);av.querySelectorAll('select').forEach(x=>x.selectedIndex=0);lireAv()});
  f('av-fermer').addEventListener('click',()=>{av.hidden=true;btnAv.setAttribute('aria-expanded','false');btnAv.focus()});
  let lc=colonnes();addEventListener('resize',()=>{const c=colonnes();if(S.vue==='carres'&&c!==lc){lc=c;rendre()}});
  rendre();
})();
