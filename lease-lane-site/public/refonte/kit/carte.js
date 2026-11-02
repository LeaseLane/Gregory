/* LeaseLane — refonte A : dessin de la carte régionale (données CARTE_QC du site actuel).
   carteRegion() : la région de 50 km, les 129 secteurs en points, le médaillon « Québec et Lévis ».
   carteHeros() : la bannière des guides, carte en perspective et repère du site debout sur le secteur.
   carteVignette(), carteRegionNuit() : les petites cartes des cartes « Autres secteurs ». */
(function(){
  const A='/assets/';
  /* Les trois flèches du symbole officiel (leaselane-fleches-fonce.svg), en ligne pour animer chaque chevron. */
  const FLECHES=`<svg class="fl3" viewBox="-86 8 172 225" aria-hidden="true" focusable="false"><defs><linearGradient id="hf-22-0-0" gradientUnits="userSpaceOnUse" x1="-43.215" y1="43.387" x2="-33.277" y2="56.130"><stop offset="0.0000" stop-color="#30598D"/><stop offset="0.2500" stop-color="#3767A2"/><stop offset="0.5200" stop-color="#6C8FBA"/><stop offset="0.8000" stop-color="#35629B"/><stop offset="1.0000" stop-color="#2E5788"/></linearGradient><linearGradient id="hf-22-0-1" gradientUnits="userSpaceOnUse" x1="43.215" y1="43.387" x2="33.277" y2="56.130"><stop offset="0.0000" stop-color="#30598D"/><stop offset="0.2500" stop-color="#3767A2"/><stop offset="0.5200" stop-color="#6C8FBA"/><stop offset="0.8000" stop-color="#35629B"/><stop offset="1.0000" stop-color="#2E5788"/></linearGradient><linearGradient id="hf-22-1-0" gradientUnits="userSpaceOnUse" x1="-43.215" y1="115.017" x2="-33.277" y2="127.760"><stop offset="0.0000" stop-color="#182D46"/><stop offset="0.2500" stop-color="#1C3451"/><stop offset="0.5200" stop-color="#58697F"/><stop offset="0.8000" stop-color="#1B324D"/><stop offset="1.0000" stop-color="#182C44"/></linearGradient><linearGradient id="hf-22-1-1" gradientUnits="userSpaceOnUse" x1="43.215" y1="115.017" x2="33.277" y2="127.760"><stop offset="0.0000" stop-color="#182D46"/><stop offset="0.2500" stop-color="#1C3451"/><stop offset="0.5200" stop-color="#58697F"/><stop offset="0.8000" stop-color="#1B324D"/><stop offset="1.0000" stop-color="#182C44"/></linearGradient><linearGradient id="hf-22-2-0" gradientUnits="userSpaceOnUse" x1="-43.215" y1="186.654" x2="-33.277" y2="199.397"><stop offset="0.0000" stop-color="#000000"/><stop offset="0.2500" stop-color="#000000"/><stop offset="0.5200" stop-color="#434343"/><stop offset="0.8000" stop-color="#000000"/><stop offset="1.0000" stop-color="#000000"/></linearGradient><linearGradient id="hf-22-2-1" gradientUnits="userSpaceOnUse" x1="43.215" y1="186.654" x2="33.277" y2="199.397"><stop offset="0.0000" stop-color="#000000"/><stop offset="0.2500" stop-color="#000000"/><stop offset="0.5200" stop-color="#434343"/><stop offset="0.8000" stop-color="#000000"/><stop offset="1.0000" stop-color="#000000"/></linearGradient></defs><g class="chev c0"><path fill="none" stroke="#3767A2" stroke-width="16.16" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="6" d="M -76.4923 79.5867 L 0 19.9307 L 76.4923 79.5867"/><path fill="none" stroke="url(#hf-22-0-0)" stroke-width="16.16" stroke-linecap="round" d="M -76.4923 79.5867 L 0 19.9307"/><path fill="none" stroke="url(#hf-22-0-1)" stroke-width="16.16" stroke-linecap="round" d="M 0 19.9307 L 76.4923 79.5867"/></g><g class="chev c1"><path fill="none" stroke="#1C3451" stroke-width="16.16" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="6" d="M -76.4923 151.2163 L 0 91.5603 L 76.4923 151.2163"/><path fill="none" stroke="url(#hf-22-1-0)" stroke-width="16.16" stroke-linecap="round" d="M -76.4923 151.2163 L 0 91.5603"/><path fill="none" stroke="url(#hf-22-1-1)" stroke-width="16.16" stroke-linecap="round" d="M 0 91.5603 L 76.4923 151.2163"/></g><g class="chev c2"><path fill="none" stroke="#000000" stroke-width="16.16" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="6" d="M -76.4923 222.8538 L 0 163.1977 L 76.4923 222.8538"/><path fill="none" stroke="url(#hf-22-2-0)" stroke-width="16.16" stroke-linecap="round" d="M -76.4923 222.8538 L 0 163.1977"/><path fill="none" stroke="url(#hf-22-2-1)" stroke-width="16.16" stroke-linecap="round" d="M 0 163.1977 L 76.4923 222.8538"/></g></svg>`;
  const C=window.CARTE_QC,S=window.SECTEURS||[];
  const PAR=Object.fromEntries(S.map(s=>[s.s,s]));
  const med=s=>(C.pts[s]||[]).length>2;
  function couches(v,epais,ep=1,eau='#BFD5EE',fond=true){const e=n=>n*ep;return (fond?`<rect x="-2000" y="-2000" width="${v.W+4000}" height="${v.H+4000}" fill="#F4F7FB"/>`:'')+(v.mer?`<path d="${v.mer}" fill="${eau}"/>`:'')+`<path d="${v.eau}" fill="${eau}" fill-rule="evenodd" stroke="#A9C6E8" stroke-width="${e(.8)}"/>`+v.riv.map(r=>`<path d="${r.d}" fill="none" stroke="#9DBDE4" stroke-width="${e(epais?1.8:1.2)}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')+`<path d="${v.aut}" fill="none" stroke="#fff" stroke-width="${e(epais?4:3.2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${v.aut}" fill="none" stroke="#E2C58F" stroke-width="${e(epais?1.6:1.2)}" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`}
  /* Couches des vignettes : traits en pixels d'écran (non-scaling-stroke), partagées par <use> entre toutes les vignettes. nuit = version pour fond marine. */
  function couchesPx(v,nuit){
    const ns='vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"';
    if(nuit)return(v.mer?`<path d="${v.mer}" fill="rgba(69,129,203,.22)"/>`:'')+`<path d="${v.eau}" fill="rgba(69,129,203,.22)" fill-rule="evenodd"/>`+v.riv.map(r=>`<path d="${r.d}" fill="none" stroke="rgba(145,181,224,.32)" stroke-width="1" ${ns}/>`).join('')+`<path d="${v.aut}" fill="none" stroke="rgba(226,197,143,.5)" stroke-width="1.1" ${ns}/>`;
    return `<rect x="-2000" y="-2000" width="${v.W+4000}" height="${v.H+4000}" fill="#F4F7FB"/>`+(v.mer?`<path d="${v.mer}" fill="#BFD5EE"/>`:'')+`<path d="${v.eau}" fill="#BFD5EE" fill-rule="evenodd" stroke="#A9C6E8" stroke-width=".8" ${ns}/>`+v.riv.map(r=>`<path d="${r.d}" fill="none" stroke="#9DBDE4" stroke-width="1.1" ${ns}/>`).join('')+`<path d="${v.aut}" fill="none" stroke="#fff" stroke-width="3.2" ${ns}/><path d="${v.aut}" fill="none" stroke="#E2C58F" stroke-width="1.2" opacity=".9" ${ns}/>`;
  }
  /* Sol détaillé de la bannière des guides : terre, zones bâties, parcs, fleuve et lacs, rivières, détail de Québec et Lévis au centre,
     routes, autoroutes et limites de Québec et de Lévis. Les couches ajoutées viennent de CARTE_QC_PLUS (/refonte/kit/carte-qc-plus.js), si la page le charge. */
  function solDetaille(f,mx,my,ms){
    const v=C.m,X2=window.CARTE_QC_PLUS||{},e=n=>n*f,eau='url(#hc-eau)',ns='stroke-linecap="round" stroke-linejoin="round"';
    let h=`<rect x="-2000" y="-2000" width="${v.W+4000}" height="${v.H+4000}" fill="#F3F6FA"/>`;
    if(X2.bati)h+=`<path d="${X2.bati}" fill="#E3E9F2"/>`;
    if(X2.parcs)h+=`<path d="${X2.parcs}" fill="#DCE9E1"/>`;
    h+=(v.mer?`<path d="${v.mer}" fill="${eau}"/>`:'')+`<path d="${v.eau}" fill="${eau}" fill-rule="evenodd" stroke="#A9C6E8" stroke-width="${e(.9)}"/>`;
    if(X2.lacs)h+=`<path d="${X2.lacs}" fill="${eau}" fill-rule="evenodd" stroke="#A9C6E8" stroke-width="${e(.7)}"/>`;
    h+=v.riv.map(r=>`<path d="${r.d}" fill="none" stroke="#9DBDE4" stroke-width="${e(1.6)}" ${ns}/>`).join('');
    h+=`<g transform="translate(${mx} ${my}) scale(${ms})"><g mask="url(#hc-masque)">${couches(C.i,true,f*.95/ms,eau,false)}</g></g>`;
    if(X2.routes2)h+=`<path d="${X2.routes2}" fill="none" stroke="#D3DCE8" stroke-width="${e(2.6)}" ${ns}/><path d="${X2.routes2}" fill="none" stroke="#fff" stroke-width="${e(1.5)}" ${ns}/>`;
    if(X2.routes1)h+=`<path d="${X2.routes1}" fill="none" stroke="#CCD6E4" stroke-width="${e(3.6)}" ${ns}/><path d="${X2.routes1}" fill="none" stroke="#fff" stroke-width="${e(2.3)}" ${ns}/>`;
    h+=`<path d="${v.aut}" fill="none" stroke="#fff" stroke-width="${e(4.2)}" ${ns}/><path d="${v.aut}" fill="none" stroke="#E2C58F" stroke-width="${e(1.6)}" opacity=".95" ${ns}/>`;
    if(X2.limites)h+=`<path d="${X2.limites}" fill="none" stroke="#4581CB" stroke-opacity=".5" stroke-width="${e(1.4)}" stroke-dasharray="${e(7)} ${e(5)}"/>`;
    return h;
  }
  /* exposés pour les cartes des pages Logements (/refonte/kit/logements.js) */
  window.carteSol=solDetaille;window.carteFleches=FLECHES;
  let partage=false;
  function defs(){
    if(partage)return;partage=true;
    const d=document.createElementNS('http://www.w3.org/2000/svg','svg');
    d.setAttribute('aria-hidden','true');d.setAttribute('focusable','false');d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML=`<defs><g id="cqv-m">${couchesPx(C.m)}</g><g id="cqv-i">${couchesPx(C.i)}</g><g id="cqv-n">${couchesPx(C.m,true)}</g><g id="cqv-in">${couchesPx(C.i,true)}</g></defs>`;
    document.body.appendChild(d);
  }
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  function point(s,x,y,etat,petit){
    const r=etat==='actif'?9:etat==='on'?6:3.5,f=etat==='actif'?'#0C2147':etat==='on'?'#4581CB':'#A7B9D0';
    return `<g class="cq-pt" data-s="${s}" tabindex="-1">${etat==='actif'?`<circle class="cq-halo" cx="${x}" cy="${y}" r="15" fill="none" stroke="#4581CB" stroke-width="2"/>`:''}<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="#fff" stroke-width="${etat==='off'?1.4:2.2}"/>${etat==='actif'?`<text x="${x+13}" y="${y+4}" font-size="${petit?13:14}" font-weight="700" fill="#0C2147" stroke="#F4F7FB" stroke-width="4" stroke-linejoin="round" style="paint-order:stroke">${esc(PAR[s]?PAR[s].n:s)}</text>`:''}</g>`;
  }
  /* Région entière : o.filtre(secteur) → visible; o.actif = slug; o.clic(slug) au clic d'un point. */
  window.carteRegion=function(svg,o={}){
    const M=C.m,I=C.i,P=C.pts,B=C.lab,[cx,cy,cw,ch]=C.cadre;
    const IW=320,IH=Math.round(IW*I.H/I.W),IX=14,IY=14;
    const etat=s=>s===o.actif?'actif':(!o.filtre||o.filtre(PAR[s]))?'on':'off';
    const central=o.actif&&med(o.actif);
    let h=couches(M,false);
    h+=`<text x="${B.fleuve[0]}" y="${B.fleuve[1]}" font-size="13" fill="#5B86BB" letter-spacing="1.5" transform="rotate(-24 ${B.fleuve[0]} ${B.fleuve[1]})">Fleuve Saint-Laurent</text>`;
    h+=`<text x="${B.ile[0]}" y="${B.ile[1]}" font-size="10.5" fill="#5B86BB" letter-spacing="1" text-anchor="middle" transform="rotate(-34 ${B.ile[0]} ${B.ile[1]})" stroke="#F4F7FB" stroke-width="3" stroke-linejoin="round" style="paint-order:stroke">Île d’Orléans</text>`;
    h+=`<text x="${B.nord[0]}" y="${B.nord[1]}" font-size="11" font-weight="700" letter-spacing="2.4" fill="#4581CB">RIVE-NORD</text><text x="${B.sud[0]}" y="${B.sud[1]}" font-size="11" font-weight="700" letter-spacing="2.4" fill="#6B7A8F">RIVE-SUD</text>`;
    if(o.medaillon!==false){h+=`<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="${central?'rgba(12,33,71,.08)':'rgba(69,129,203,.06)'}" stroke="${central?'#0C2147':'#4581CB'}" stroke-width="1.6" stroke-dasharray="5 4"/><path d="M${cx} ${cy}L${IX} ${IY+IH}M${cx+cw} ${cy}L${IX+IW} ${IY+IH}" stroke="#4581CB" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/>`}
    const pts=Object.keys(P).filter(s=>o.medaillon===false||!med(s));
    const ordre=s=>etat(s)==='actif'?2:etat(s)==='on'?1:0;
    pts.sort((a,b)=>ordre(a)-ordre(b)).forEach(s=>{h+=point(s,P[s][0],P[s][1],etat(s),false)});
    if(o.medaillon!==false){
      h+=`<defs><filter id="cq-om" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0C2147" flood-opacity=".22"/></filter></defs>`;
      h+=`<g transform="translate(${IX} ${IY})"><rect x="-2" y="-2" width="${IW+4}" height="${IH+4}" fill="#fff" stroke="#fff" stroke-width="3" filter="url(#cq-om)"/><svg x="0" y="0" width="${IW}" height="${IH}" viewBox="0 0 ${I.W} ${I.H}" style="overflow:hidden">${couches(I,true)}`;
      Object.keys(P).filter(med).sort((a,b)=>ordre(a)-ordre(b)).forEach(s=>{h+=point(s,P[s][2],P[s][3],etat(s),true)});
      h+=`</svg><rect x="10" y="${IH-34}" width="${'QUÉBEC ET LÉVIS'.length*7.6+20}" height="24" fill="#0C2147"/><text x="20" y="${IH-18}" font-size="11" font-weight="700" fill="#fff" letter-spacing="1">QUÉBEC ET LÉVIS</text></g>`;
    }
    h+=`<g transform="translate(${M.W-196} ${M.H-62})"><rect width="184" height="34" fill="#fff" opacity=".92"/><path d="M12 17h22" stroke="#E2C58F" stroke-width="3" stroke-linecap="round"/><text x="40" y="21" font-size="11" fill="#3E4A59">Autoroute</text><path d="M106 17h22" stroke="#9DBDE4" stroke-width="2" stroke-linecap="round"/><text x="134" y="21" font-size="11" fill="#3E4A59">Rivière</text></g>`;
    h+=`<text x="${M.W-12}" y="${M.H-12}" text-anchor="end" font-size="10" fill="#6B7A8F">© OpenStreetMap</text>`;
    svg.setAttribute('viewBox',`0 0 ${M.W} ${M.H}`);svg.innerHTML=h;
    if(o.clic)svg.querySelectorAll('.cq-pt').forEach(g=>{g.style.cursor='pointer';g.addEventListener('click',()=>o.clic(g.dataset.s))});
  };
  /* Héros des guides de secteur : la carte régionale couvre toute la bannière, couchée en perspective (le sol fuit vers l'horizon),
     et le repère du site se tient debout sur le secteur : point et cercles au sol, hampe et flèches LeaseLane à la verticale.
     Le cadrage est calculé pour que le point tombe à droite du texte (ou dans la scène du haut sur tablette et mobile). */
  /* o.points : plusieurs repères nommés ({slug, nom, sous}), la caméra visant leur centre; o.zoom > 1 éloigne la vue. */
  window.carteHeros=function(h,slug,o={}){
    const sc=h&&h.querySelector('.scene');if(!sc)return;
    const pos=s2=>{const q2=C.pts[s2];return q2?(q2.length>2?[C.cadre[0]+q2[2]*C.cadre[2]/C.i.W,C.cadre[1]+q2[3]*C.cadre[2]/C.i.W]:[q2[0],q2[1]]):null};
    const pts=(o.points||[{slug,nom:PAR[slug]?PAR[slug].n:slug}]).map(p=>{const v=p.slug?pos(p.slug):[p.x,p.y];return v&&{x:v[0],y:v[1],nom:p.nom,sous:p.sous||''}}).filter(Boolean);if(!pts.length)return;
    /* o.centre : point visé par la caméra sur ordinateur (sinon, et sur tablette et mobile, le centre des repères) */
    const mX=pts.reduce((a,p)=>a+p.x,0)/pts.length,mY=pts.reduce((a,p)=>a+p.y,0)/pts.length;let X=mX,Y=mY;
    sc.innerHTML='<div class="plan"><svg class="sol" focusable="false" aria-hidden="true"></svg></div><div class="voile"></div><div class="reperes" aria-hidden="true"></div>';
    const plan=sc.children[0],sol=plan.firstChild,rp=sc.children[2];
    const calme=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let fait=false,cle='';
    function pose(){
      const HW=h.clientWidth,HH=h.clientHeight;if(!HW||!HH)return;
      const etroit=matchMedia('(max-width:1100px)').matches,k0=HW+'x'+HH+etroit;if(k0===cle)return;cle=k0;
      X=o.centre&&!etroit?o.centre[0]:mX;Y=o.centre&&!etroit?o.centre[1]:mY;
      /* géométrie : inclinaison, distance de vue, cible du point à l'écran */
      const deg=etroit?50:56,t=deg*Math.PI/180,c=Math.cos(t),s=Math.sin(t);
      const P=etroit?Math.max(600,HW*1.05):Math.max(900,HW*.74);
      const haut=etroit?(parseFloat(getComputedStyle(h).paddingTop)||380):0;
      const sx=etroit?HW*.5:HW*.74,sy=etroit?haut*.57:96+(HH-132-96)*.46;
      const ox=sx,by=HH+40,yt=-24;
      const PH=P*(by-yt)/(P*c+yt*s),kt=P/(P+PH*s);
      const L=ox+(-30-ox)/kt,PW=(ox+(HW+30-ox)/kt)-L,T=by-PH;
      const v=P*(sy-by)/(P*c+sy*s),kp=P/(P-v*s),px=ox+(sx-ox)/kp-L,py=PH+v;
      const f=(etroit?(HW<600?.34:.27):.21)*kp*(o.zoom||1),x0=X-px*f,y0=Y-py*f,W=PW*f,H=PH*f;
      const proj=(a,b)=>{const u=(a-x0)/f,w=(b-y0)/f-PH,k=P/(P-w*s);return{x:ox+(L+u-ox)*k,y:(by+w*c)*k,k}};
      sc.style.perspective=P+'px';sc.style.perspectiveOrigin=ox+'px 0px';
      /* inverse de proj : point de l'écran (px dans la bannière) → coordonnées de la carte (outil de placement des repères) */
      h.versCarte=(x,y)=>{const w=P*(y-by)/(c*P+y*s),k=P/(P-w*s),u=(x-ox)/k-L+ox;return[+(x0+u*f).toFixed(1),+(y0+(w+PH)*f).toFixed(1)]};
      plan.style.cssText=`left:${L}px;top:${T}px;width:${PW}px;height:${PH}px;transform:rotateX(${deg}deg)`;
      /* le sol : la carte, les autres secteurs en points, le repère au sol */
      /* près du secteur, le détail de Québec et Lévis (médaillon) se fond dans la carte régionale : plus on s'éloigne, plus le dessin se simplifie */
      const[mx,my,mw]=C.cadre,ms=mw/C.i.W;
      const gr=18,gx0=Math.floor(x0/gr)*gr,gy0=Math.floor(y0/gr)*gr;let quad='';
      for(let gx=gx0;gx<x0+W;gx+=gr)quad+=`M${gx} ${y0}V${y0+H}`;
      for(let gy=gy0;gy<y0+H;gy+=gr)quad+=`M${x0} ${gy}H${x0+W}`;
      let g=`<defs><linearGradient id="hc-eau" gradientUnits="userSpaceOnUse" x1="0" y1="${y0+H}" x2="0" y2="${y0}"><stop offset="0" stop-color="#C3D8F0"/><stop offset=".55" stop-color="#B4CDEC"/><stop offset="1" stop-color="#A6C3E8"/></linearGradient><radialGradient id="hc-lumiere"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".45" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><radialGradient id="hc-fondu" cx=".5" cy=".5" r=".5"><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="hc-masque" maskUnits="userSpaceOnUse" x="0" y="0" width="${C.i.W}" height="${C.i.H}"><rect width="${C.i.W}" height="${C.i.H}" fill="url(#hc-fondu)"/></mask></defs>`
        +solDetaille(f,mx,my,ms)
        +`<path d="${quad}" fill="none" stroke="#3767A2" stroke-opacity=".09" stroke-width="${1.3*f}"/>`
        +`<circle cx="${X}" cy="${Y}" r="${300*f}" fill="url(#hc-lumiere)"/>`;
      if(!o.points)pts.forEach(P2=>{
        g+=`<circle cx="${P2.x}" cy="${P2.y}" r="${58*f}" fill="none" stroke="#B5CDEA" stroke-width="${1.4*f}"/><circle cx="${P2.x}" cy="${P2.y}" r="${36*f}" fill="rgba(69,129,203,.12)" stroke="#91B5E0" stroke-width="${1.4*f}"/><circle cx="${P2.x}" cy="${P2.y}" r="${15*f}" fill="none" stroke="#4581CB" stroke-width="${2*f}"/>`;
        g+=`<path d="M${P2.x-78*f} ${P2.y}H${P2.x-22*f}M${P2.x+22*f} ${P2.y}H${P2.x+78*f}M${P2.x} ${P2.y+22*f}V${P2.y+78*f}" stroke="#91B5E0" stroke-width="${1.4*f}"/><circle cx="${P2.x}" cy="${P2.y}" r="${6*f}" fill="#0C2147"/>`;
      });
      sol.setAttribute('viewBox',`${x0} ${y0} ${W} ${H}`);sol.setAttribute('preserveAspectRatio','none');sol.innerHTML=g;
      /* debout : le repère et l'onde au sol (ellipse projetée); seul le secteur de la page est nommé */
      /* plusieurs repères : cercles au sol identiques (même taille, même angle, même disposition), à la mesure du centre de la vue */
      const ell=(x,y)=>{const pn=proj(x,y),e1=proj(x+58*f,y),e2=proj(x,y-58*f),e3=proj(x,y+58*f);return[2*(e1.x-pn.x),e3.y-e2.y]};
      const fixe=o.points?ell(X,Y):null;
      rp.innerHTML=pts.map(P2=>{const pin=proj(P2.x,P2.y),[ow,oh]=fixe||ell(P2.x,P2.y);
        return `<div class="repere-h" style="left:${pin.x}px;top:${pin.y}px;--ow:${ow.toFixed(1)}px;--oh:${oh.toFixed(1)}px">${o.points?'<span class="anneaux"><i></i></span>':''}<span class="onde"></span><span class="ombre"></span><span class="hampe"></span>${FLECHES}<span class="nom"><b>${esc(P2.nom)}</b>${P2.sous?`<small>${esc(P2.sous)}</small>`:''}</span></div>`}).join('')
        +`<span class="credit" style="top:${etroit?haut-24:HH-152}px">© OpenStreetMap</span>`;
      if(!fait){fait=true;
        if(calme)rp.classList.add('vu');
        else{plan.animate([{transform:`rotateX(${deg-18}deg)`,opacity:0},{transform:`rotateX(${deg}deg)`,opacity:1}],{duration:1700,easing:'cubic-bezier(.22,1,.36,1)'});setTimeout(()=>rp.classList.add('vu'),850)}
      }
    }
    pose();new ResizeObserver(pose).observe(h);
  };
  /* Vignette d'un secteur (cartes « Autres secteurs ») : la carte cadrée sur le secteur, avec un repère au sol. */
  window.carteVignette=function(svg,slug,o={}){
    defs();const centre=med(slug),p=C.pts[slug];if(!p)return;
    const x=centre?p[2]:p[0],y=centre?p[3]:p[1];
    const W=o.largeur||(centre?120:190),H=W*(o.ratio||.5625),x0=x-W*(o.fx||.5),y0=y-H*(o.fy||.5),f=W/(o.px||300);
    const n=o.nuit,pt=n?['#91B5E0','none',.7]:['#A7B9D0','#fff',1];
    let h=`<g class="z"><use href="#cqv-${n?(centre?'in':'n'):(centre?'i':'m')}"/>`;
    Object.keys(C.pts).filter(s=>s!==slug&&(centre?med(s):true)).forEach(s=>{const q=C.pts[s],a=centre?q[2]:q[0],b=centre?q[3]:q[1];if(a>x0-10&&a<x0+W+10&&b>y0-10&&b<y0+H+10)h+=`<circle cx="${a}" cy="${b}" r="${3*f}" fill="${pt[0]}" stroke="${pt[1]}" stroke-width="${1.2*f}" opacity="${pt[2]}"/>`});
    h+=n?`<circle cx="${x}" cy="${y}" r="${26*f}" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.45)" stroke-width="${f}"/><circle cx="${x}" cy="${y}" r="${11*f}" fill="none" stroke="#fff" stroke-width="${1.5*f}"/><circle cx="${x}" cy="${y}" r="${5*f}" fill="#fff"/></g>`
      :`<circle cx="${x}" cy="${y}" r="${24*f}" fill="rgba(69,129,203,.12)" stroke="#91B5E0" stroke-width="${f}"/><circle cx="${x}" cy="${y}" r="${10*f}" fill="none" stroke="#4581CB" stroke-width="${1.5*f}"/><circle cx="${x}" cy="${y}" r="${4.5*f}" fill="#0C2147"/></g>`;
    svg.setAttribute('viewBox',`${x0} ${y0} ${W} ${H}`);svg.setAttribute('preserveAspectRatio','xMidYMid slice');svg.innerHTML=h;
  };
  /* Région entière, version nuit (fond marine) : tous les secteurs en points, le secteur courant en blanc. */
  window.carteRegionNuit=function(svg,o={}){
    defs();const P=C.pts,xs=Object.values(P).map(q=>q[0]),ys=Object.values(P).map(q=>q[1]);
    const m=50,x0=Math.min(...xs)-m,y0=Math.min(...ys)-m,W=Math.max(...xs)+m-x0,H=Math.max(...ys)+m-y0;
    let h='<use href="#cqv-n"/>';
    Object.keys(P).forEach(s=>{if(s!==o.actif)h+=`<circle cx="${P[s][0]}" cy="${P[s][1]}" r="3" fill="#91B5E0" opacity=".8"/>`});
    if(P[o.actif]){const[a,b]=P[o.actif];h+=`<circle cx="${a}" cy="${b}" r="14" fill="none" stroke="#fff" stroke-width="1.2" opacity=".55"/><circle cx="${a}" cy="${b}" r="5.5" fill="#fff"/>`}
    svg.setAttribute('viewBox',`${x0} ${y0} ${W} ${H}`);svg.setAttribute('preserveAspectRatio',o.cadrage||'xMidYMid slice');svg.innerHTML=h;
  };
})();
