/* LeaseLane — refonte A : fiche d'une propriété à louer. logement.html?id=L1&dir=a|b
   A · Galerie : bannière, carte clé qui chevauche, mosaïque de photos, détails et carte de réservation collante.
   B · Immersive : photos plein écran en diaporama, bande des chiffres, visite avec Cléo, le quartier sur la carte en perspective.
   Bloc clé de A (loyer, disponibilité, actions, chiffres) en trois options, &fc=1|2|3 : 1 · Barre, 2 · Indicateurs, 3 · Sur la photo (0 = l'ancien).
   Cadre à filets (31 oct.) : dans A, la barre 1 est découpée en cellules à filets, « Ce qui est inclus » et « En détail » deviennent des cellules
   et un tableau à lignes fines, la carte de réservation est une carte flottante (.flot) et les logements semblables reprennent le mur de la liste.
   Chiffres (31 oct., Steven) : plus dans la bannière, en A option 3 comme en B; ils sont dans « Le logement », sous la description (.lg-chif). */
(()=>{
  const L=window.LOGEMENTS||[],PH=window.LOGEMENTS_PHOTOS||{},A='/assets/',SECT=Object.fromEntries((window.SECTEURS||[]).map(s=>[s.s,s]));
  const photo=k=>A+PH[k];
  /* photos temporaires de Steven (29 oct.) : la bannière de toutes les fiches, dans son ordre; img/temporaire/ */
  const HEROS=['salle-de-bain','salon-salle-a-manger','cuisine-aire-ouverte','immeuble-facade'].map(n=>new URL(`/refonte/img/temporaire/${n}.jpg`,document.baseURI).href);
  const ico=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I={coche:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',fl:'<path d="M3.5 12h14M12.5 6.5 18 12l-5.5 5.5"/>',g:'<path d="M15 5l-7 7 7 7"/>',d:'<path d="M9 5l7 7-7 7"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',
    tel:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'};
  const IC=['<path d="M4 4h16v16H4z"/><path d="M4 12h7v8M11 4v4M15 12h5"/>','<path d="M3 18V7M3 13h18v5M21 18v-5a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="10.5" r="1.5"/>','<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M7 19l-1 2M17 19l1 2"/>','<path d="M4 4h16v16H4z"/><path d="M4 9h5V4M20 15h-5v5"/>'];
  const TRAIT='<svg viewBox="0 0 28 12" fill="none" aria-hidden="true"><path d="M1 5H26.4M21.8 .6L26.4 5L21.8 9.4" stroke="currentColor" stroke-width="1.5"/><path d="M1 9.6H18" stroke="#6A9AD5" stroke-width="1.5"/></svg>';
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const prix=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' $';
  const RIVE={nord:'Rive-Nord',sud:'Rive-Sud'};
  const q=new URLSearchParams(location.search);
  const o=L.find(x=>x.id===q.get('id'))||L[0];let dir=q.get('dir')==='a'?'a':'b'; /* B · Immersive retenue (31 oct., Steven) : le sélecteur de direction est retiré; A reste lisible par ?dir=a */
  const FC=['0','1','2','3'];let fc=q.get('fc');if(FC.includes(fc)){try{localStorage.setItem('ll-fc',fc)}catch(e){}}else{try{fc=localStorage.getItem('ll-fc')}catch(e){}}if(!FC.includes(fc))fc='1';let obs=null;
  const dispo=`<span class="dispo-l s-${o.statut}"><i aria-hidden="true"></i>${esc(o.dispo)}</span>`;
  /* état .etat (/refonte/kit/filets.css) aux couleurs de la légende de la liste : vert = disponible maintenant, ambre = à la fin du bail, rouge = non disponible */
  const ETAT={vert:'vert',jaune:'ambre',rouge:'rouge'},STATUT={vert:'disponible maintenant',jaune:'disponible à la fin du bail',rouge:'non disponible'};
  const etatDe=x=>`<span class="etat ${ETAT[x.statut]}">${esc(x.dispo)}<span class="sr"> · ${STATUT[x.statut]}</span></span>`,etat=etatDe(o);
  const chiffres=[['Pièces',o.type,o.propriete],['Chambres',o.chambres,o.chambres>1?'chambres fermées':'chambre fermée'],['Salles de bain',o.sdb,o.sdb>1?'salles de bain':'salle de bain'],['Superficie',prix(o.superficie).replace(' $',''),'pieds carrés']];
  /* B · les cinq chiffres du logement en cases (31 oct., Steven) : seul le libellé, au-dessus du chiffre; aucune précision dessous.
     L'unité reste avec sa valeur (« $ » du loyer, « pi² » de la superficie); « mensuel » passe dans le libellé. */
  const chifB=`<ul class="bt-chif">${[['Loyer mensuel',prix(o.loyer)],['Pièces',o.type],['Chambres',o.chambres],['Salles de bain',o.sdb],['Superficie',prix(o.superficie).replace(/\s*\$$/,''),'pi²']].map(([a,b,u])=>`<li><small>${a}</small><b${/\d/.test(b)?'':' class="mot"'}>${esc(b)}${u?`<i>${u}</i>`:''}</b></li>`).join('')}</ul>`;
  const chifL=(av=[])=>`<ul class="lg-chif">${[...av,...chiffres].map(([a,b,c])=>`<li><small>${a}</small><b>${esc(b)}</b><span>${esc(c)}</span></li>`).join('')}</ul>`;
  const guide=o.slug==='montcalm'?{href:'/quartiers/montcalm',t:'Découvrir le quartier Montcalm'}:{href:`/quartiers#${o.slug}`,t:`Voir ${o.secteur} dans le Guide Local`};
  const s=SECT[o.slug]||{};
  /* icônes de la recherche avancée (inclusions, animaux, meublé), reprises dans « Inclus dans le loyer » et « Conditions » */
  const AI={patte:'<circle cx="12" cy="15.5" r="3.6"/><circle cx="6" cy="10.5" r="1.9"/><circle cx="9.6" cy="6.5" r="1.9"/><circle cx="14.4" cy="6.5" r="1.9"/><circle cx="18" cy="10.5" r="1.9"/>',
    thermo:'<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',eclair:'<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z"/>',
    goutte:'<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',frigo:'<rect x="6" y="2.5" width="12" height="19" rx="1"/><path d="M6 10h12M9 5.5v2M9 13v3"/>',
    laveuse:'<rect x="4" y="2.5" width="16" height="19" rx="1"/><circle cx="12" cy="13.5" r="4.5"/><path d="M7 6h2.5M14.5 6h.01M17 6h.01"/>',p:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M10 16.5V7.5h3.2a2.7 2.7 0 0 1 0 5.4H10"/>',
    clim:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5"/>',balcon:'<path d="M7 11V4h10v7"/><path d="M3 11h18M3 20h18M5.5 11v9M9.5 11v9M14.5 11v9M18.5 11v9"/>',
    boite:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',sofa:'<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 11.5a2 2 0 0 1 4 0V14h10v-2.5a2 2 0 0 1 4 0V18H3z"/><path d="M5 18v2M19 18v2"/>'};
  /* bloc d'état de la bannière B (31 oct., Steven : à la place des atouts) : les couleurs de la légende de la liste — vert, ambre, rouge */
  const ETITRE={vert:'Disponible maintenant',jaune:'Disponible à la fin du bail',rouge:'Non disponible'};
  const etatB=`<p class="fb-etat s-${o.statut}"><i aria-hidden="true"></i><b>${ETITRE[o.statut]}</b></p>`;
  /* « Ce qui est inclus » : une cellule à filets par inclusion de l'annonce, la coche en haut, le nom en bas */
  const inclus=`<ul class="mur fi-inc" style="--c:${Math.min(Math.max(o.inclus.length,1),3)}">${o.inclus.map(x=>`<li>${ico(I.coche)}<span>${esc(x)}<span class="sr">, inclus</span></span></li>`).join('')}</ul>`;
  /* « En détail » : un tableau à lignes fines, le libellé gris à gauche, la valeur à droite */
  const carac=`<dl class="fi-dl"><div><dt>Type de bâtiment</dt><dd>${esc(o.batiment)}</dd></div><div><dt>Construction</dt><dd>${o.annee}</dd></div><div><dt>Étage</dt><dd>${esc(o.etage)}</dd></div><div><dt>Animaux</dt><dd>${esc(o.animaux)}</dd></div><div><dt>Disponibilité</dt><dd>${esc(o.dispo.replace('Libre ','').replace(/^le /,''))}</dd></div><div><dt>Secteur</dt><dd>${esc(o.secteur)} · ${RIVE[o.zone]}</dd></div></dl>`;
  /* B · section « Le logement » en bento (retenue par Steven le 29 oct. 2026; concept design/refonte-fiche/concepts/bento-du-logement).
     Un logement loué n'offre pas de visite. 31 oct. (Steven) : tous les critères de la recherche avancée sont sur la fiche — les 9 inclusions en tableau oui / non
     (données d'exemple complétées pour ne plus contredire les annonces), meublé ou non, le type de propriété, le secteur et la rive; L'immeuble montre le pictogramme du type de bâtiment. */
  const BI={immeuble:'<path d="M4 21V3.5h10V21"/><path d="M14 9h6v12"/><path d="M2.5 21h19"/><path d="M7.5 7.5h3M7.5 11h3M7.5 14.5h3"/>',cle:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l2 2M15 8l2 2"/>',
    etiquette:'<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',patte:AI.patte};
  const BINC={'Chauffage':AI.thermo,'Électricité':AI.eclair,'Eau chaude':AI.goutte,'Électroménagers':AI.frigo,'Laveuse-sécheuse':AI.laveuse,'Stationnement':AI.p,'Climatisation':AI.clim,'Balcon':AI.balcon,'Rangement':AI.boite};
  const ins=t=>esc(t).replace(/ \+/g,' +').replace(/(\d+(?:er)?) (?=\p{L})/gu,'$1 ');
  /* pictogramme du type de bâtiment, celui de la page Gestion immobilière (/refonte/kit/pictos.js : 1 jumelé ou maison en rangée, 3 triplex, 7 immeuble à logements) */
  /* plan du logement (31 oct., Steven) : une image temporaire, la même pour toutes les fiches, en attendant les vrais plans */
  const PLAN=new URL('/refonte/img/temporaire/plan-logement.jpg',document.baseURI).href;
  const PICTO={'Maison de ville':1,'Plex (2 à 5 logements)':3,'Immeuble de 6 logements et +':7};
  /* nom du type sous le pictogramme, et sa précision au-dessus (« Plex » · « 2 à 5 logements »), comme la scène des types de la page Gestion immobilière */
  const BAT=(()=>{const b=o.batiment||'',m=b.match(/^(.*?)\s*\((.*)\)$/);if(m)return [m[1],m[2]];const n=b.match(/^(Immeuble) de (.*)$/);return n?[n[1],n[2]]:[b,'']})();
  function bento(cren){
    const ph=o.photos&&o.photos[0]&&PH[o.photos[0]]?photo(o.photos[0]):'',loue=o.statut==='rouge';
    /* B · bento repris le 31 oct. (Steven : composants, formulaire, typographie, hiérarchie, architecture de l'information) :
       la visite dit qui répond (Cléo, agent IA), puis un petit formulaire de créneaux; les inclusions affichent leur compte.
       les 9 inclusions de la recherche avancée, en petit tableau oui / non (31 oct., Steven) */
    const inc=Object.keys(BINC).map(n=>{const ok=(o.inclus||[]).includes(n);return `<div class="${ok?'oui':'non'}"><dt>${ico(BINC[n])}${esc(n)}</dt><dd>${ok?ico(I.coche)+'Oui':'<i aria-hidden="true"></i>Non'}</dd></div>`}).join('');
    const visite=loue
      ?`<div class="bt-v-t"><h3 id="t-vi">Ce logement est loué.</h3><p class="bt-intro">Voyez les logements semblables de la ${RIVE[o.zone].toLowerCase()}, ou tous nos logements à louer.</p>
        <ul class="bt-sem">${L.filter(x=>x.id!==o.id&&x.zone===o.zone&&x.statut!=='rouge').sort((a,b)=>Math.abs(a.loyer-o.loyer)-Math.abs(b.loyer-o.loyer)).slice(0,2).map(x=>`<li><a href="/logements-a-louer?id=${x.id}&dir=${dir}"><b>${esc(x.titre)}</b><span>${prix(x.loyer)} /mois · ${esc(x.dispo)}</span>${ico(I.fl)}</a></li>`).join('')}</ul></div>
        <div class="bt-v-d"><div class="bt-act"><a class="btn btn-p" href="#t-se">Logements semblables${TRAIT}</a><a class="btn btn-c" href="/logements-a-louer">Logements à louer${TRAIT}</a></div></div>`
      :`<div class="bt-v-t"><div class="bt-qui"><img class="bt-cleo" src="${A}img/cleo-avatar.png" alt="" width="48" height="48"><p><b>Cléo</b><span>Agent IA de LeaseLane</span></p></div>
        <h3 id="t-vi">Réservez une visite.</h3>
        <p class="bt-intro">Cléo confirme la visite et répond à vos questions, 24/7.</p></div>
        <div class="bt-v-d"><fieldset class="bt-f"><legend>Choisissez un moment</legend><div class="bt-cren" role="group" aria-label="Moments proposés">${cren.map(([j,h],i)=>`<button type="button" aria-pressed="${i===0}" data-m="${j.toLowerCase()} ${h}">${j}<small>${h}</small></button>`).join('')}</div>
        <p class="bt-ex">Exemple de disponibilités.</p></fieldset>
        <div class="bt-act"><a class="btn btn-p" href="/cleo"><span class="bt-rl">Réserver ${cren[0][0].toLowerCase()} ${cren[0][1]}</span>${TRAIT}</a><a class="btn btn-c" href="/locataires/demande-de-location">Demande de location${TRAIT}</a></div>
        <p class="sr" aria-live="polite" id="bt-m"></p></div>`;
    return `<section class="sec" id="sec-logement" aria-labelledby="t-lg"><div class="in"><div class="bt">
    <article class="bt-t bt-log" aria-labelledby="t-lg">
      ${ph?`<figure class="bt-ph"><img src="${ph}" alt="" decoding="async">${o.badge?`<span class="bt-badge">${esc(o.badge)}</span>`:''}</figure>`:''}
      <div class="bt-log-c"><h2 class="bt-k" id="t-lg">Le logement</h2><p class="bt-desc">${esc(o.desc)}</p></div>
      ${chifB}
    </article>
    <aside class="bt-t bt-visite sombre" id="visite" aria-labelledby="t-vi"><div class="bt-v">${visite}</div></aside>
    <section class="bt-t bt-inc" aria-labelledby="t-in"><div class="bt-h"><h3 class="bt-k" id="t-in">Inclus dans le loyer</h3><span class="bt-compte"><b>${(o.inclus||[]).length}</b> sur 9</span></div><dl class="bt-tab">${inc}</dl></section>
    <section class="bt-t bt-cond" aria-labelledby="t-co"><div class="bt-h"><h3 class="bt-k" id="t-co">Conditions</h3></div>
      <dl class="bt-dl"><div><dt>Disponibilité</dt><dd><i class="bt-pastille s-${esc(o.statut)}" aria-hidden="true"></i>${ins(o.dispo)}</dd></div><div><dt>Animaux</dt><dd>${ico(BI.patte)}${esc(o.animaux)}</dd></div><div><dt>Meublé</dt><dd>${ico(AI.sofa)}${o.badge==='Meublé'?'Oui':'Non'}</dd></div><div><dt>Enquête de crédit</dt><dd>${ico('<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3 10h18M7 15h4"/>')}Demandée</dd></div></dl>
    </section>
    <section class="bt-t bt-imm sombre" aria-labelledby="t-im">
      <div class="bt-im-g"><h3 class="bt-k bt-im-k" id="t-im">Informations sur l’immeuble</h3><div class="bt-im-scene" aria-hidden="true"><div class="bt-im-pose"><i class="sol"></i><div class="bt-pic" data-k="${PICTO[o.batiment]??3}"></div></div></div>
        <dl class="bt-im-pied"><div><dt>${BAT[1]?ins(BAT[1]):'Type de bâtiment'}</dt><dd>${esc(BAT[0])}</dd></div><div><dt>Construit en</dt><dd>${esc(o.annee)}</dd></div></dl></div>
      <div class="bt-im-d">
        <figure class="bt-plan"><img src="${PLAN}" alt="Plan d’illustration d’un logement : chambres, cuisine, salle de bain et salon" width="1500" height="959" loading="lazy" decoding="async"><figcaption>Plan d’illustration</figcaption></figure>
        <dl class="bt-dl"><div><dt>Type de propriété</dt><dd>${esc(o.propriete)}</dd></div><div><dt>Bâtiment</dt><dd>${ins(o.batiment)}</dd></div><div><dt>Étage</dt><dd>${esc(o.etage)}</dd></div><div><dt>Secteur</dt><dd>${esc(o.secteur)} · ${RIVE[o.zone]}</dd></div></dl></div>
    </section>
  </div></div></section>`;
  }
  const fil=`<nav class="fil" aria-label="Fil d’Ariane"><ol><li><a href="/">Accueil</a></li><li><a href="/logements-a-louer">Logements à louer</a></li><li aria-current="page">${esc(o.titre)}</li></ol></nav>`;
  const semblables=L.filter(x=>x.id!==o.id&&x.zone===o.zone).sort((a,b)=>Math.abs(a.loyer-o.loyer)-Math.abs(b.loyer-o.loyer)).slice(0,3);
  /* carte du mur : la même que les Carrés de la liste (/refonte/kit/logements.js, carreB) — photo en retrait, loyer, titre, caractéristiques, état */
  const SP={lit:'<path d="M3 18V7M3 13h18v5M21 18v-5a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="10.5" r="1.5"/>',bain:IC[2],surf:IC[3]};
  const mini=(x,d)=>d==='b'?`<a class="sb" href="/logements-a-louer?id=${x.id}&dir=${dir}"><span class="sb-img"><img src="${photo(x.photos[0])}" alt="" loading="lazy">${x.badge?`<span class="badge-l">${esc(x.badge)}</span>`:''}</span><span class="sb-c"><span class="sb-h"><span class="prix-l"><b>${prix(x.loyer)}</b> <span>/mois</span></span><span class="sb-go" aria-hidden="true">${ico(I.fl)}</span></span><b class="sb-t">${esc(x.titre)}</b><span class="specs-l"><span>${ico(SP.lit)}${x.chambres} ch.</span><span>${ico(SP.bain)}${x.sdb} sdb</span><span>${ico(SP.surf)}${prix(x.superficie).replace(' $','')} pi²</span></span>${etatDe(x)}</span></a>`
    :`<a class="sa" href="/logements-a-louer?id=${x.id}&dir=${dir}"><img src="${photo(x.photos[0])}" alt="" loading="lazy"><span class="sa-prix">${prix(x.loyer)}<small>/mois</small></span><span class="sa-c"><b>${esc(x.titre)}</b><span>${esc(x.secteur)} · ${x.chambres} ch.</span></span><span class="fleche" aria-hidden="true">${ico(I.fl)}</span></a>`;
  /* A (cartes « b ») : section blanche et mur à bords partagés; B (cartes photo « a ») garde sa bande grise */
  const blocSemblables=d=>d==='b'
    ?`<section class="sec lg-semb" aria-labelledby="t-se"><div class="in"><div class="tete-sec rv"><div><p class="sur">À voir aussi</p><h2 class="h2" id="t-se">Logements <span class="acc">semblables</span>.</h2></div><a class="btn btn-c" href="/logements-a-louer?rive=${o.zone}" style="justify-self:end">Tous les logements de la ${RIVE[o.zone].toLowerCase()}${TRAIT}</a></div><div class="semblables mur lg-mur">${semblables.map(x=>mini(x,d)).join('')}</div></div></section>`
    :`<section class="sec sec-gris" aria-labelledby="t-se"><div class="in"><div class="tete-sec rv"><div><p class="sur">À voir aussi</p><h2 class="h2" id="t-se">Logements <span class="acc">semblables</span>.</h2></div><a class="lien" href="/logements-a-louer?rive=${o.zone}" style="justify-self:end">Tous les logements de la ${RIVE[o.zone].toLowerCase()}${ico(I.fl)}</a></div><div class="semblables">${semblables.map(x=>mini(x,d)).join('')}</div></div></section>`;
  const el=document.getElementById('fiche');

  /* bloc clé de A : trois options (maquette) */
  const prixL=`<p class="prix-l"><b>${prix(o.loyer)}</b> <span>/mois</span></p>`;
  const acts=`<a class="btn btn-p" href="/locataires/demande-de-location">Demande de location${TRAIT}</a><a class="btn btn-c" href="#visite">Réserver une visite${TRAIT}</a>`;
  function heros3(t){
    if(fc!=='3')return t;
    return `<div class="fc3-g"><div class="fc3-t">${t}</div><div class="fc3-p">${prixL}${dispo}<div class="actions">${acts}</div></div></div>`;
  }
  function cle(){
    if(fc==='3')return '';
    /* 1 · Barre en cellules à filets : libellé gris, grand chiffre, précision */
    if(fc==='1')return `<div class="regle"><div class="in"><div class="fc1"><div class="fc1-p"><small class="fc1-l">Loyer</small>${prixL}${etat}</div>
      <ul class="fc1-c">${chiffres.map(([a,b,c])=>`<li><small class="fc1-l">${a}</small><b>${esc(b)}</b><span>${esc(c)}</span></li>`).join('')}</ul><div class="fc1-a">${acts}</div></div></div></div>`;
    if(fc==='2')return `<div class="regle"><div class="in"><div class="fc2"><div class="fc2-p"><small class="fc-k">Loyer</small>${prixL}${dispo}<div class="actions">${acts}</div></div>
      ${chiffres.map(([a,b,c],i)=>`<div class="fc2-k" style="--i:${i+1}"><div class="t"><small class="fc-k">${a}</small><span class="fc-ic">${ico(IC[i])}</span></div><b>${esc(b)}</b><span class="s">${esc(c)}</span></div>`).join('')}</div></div></div>`;
    return `<div class="regle"><div class="in"><div class="fi-cle"><div class="fi-prix"><p class="prix-l"><b>${prix(o.loyer)}</b> <span>/mois</span></p>${dispo}<div class="actions"><a class="btn btn-p" href="/locataires/demande-de-location">Demande de location${TRAIT}</a><a class="btn btn-c" href="#visite">Réserver une visite${TRAIT}</a></div></div>
      <ul class="fi-chiffres">${chiffres.map(([a,b,c])=>`<li><small>${a}</small><b>${esc(b)}</b><span>${esc(c)}</span></li>`).join('')}</ul></div></div></div>`;
  }
  const quaiHtml=()=>fc!=='1'?'':`<div class="fc1-dock" role="region" aria-label="Réserver ce logement" inert><div class="fc1-dp">${prixL}${etat}</div><a class="btn btn-c" href="#visite">Réserver une visite${TRAIT}</a><a class="btn btn-p" href="/locataires/demande-de-location">Demande de location${TRAIT}</a></div>`;
  /* la barre revient en bas de l'écran une fois dépassée, tant que la carte de réservation et l'appel final ne sont pas à l'écran */
  function quai(){
    const dk=el.querySelector('.fc1-dock');if(!dk)return;
    const bar=el.querySelector('.fc1'),cote=el.querySelector('#visite'),fin=document.querySelector('.fin'),vu=new Map();
    const maj=()=>{const on=bar.getBoundingClientRect().bottom<0&&!vu.get(cote)&&!vu.get(fin);dk.classList.toggle('on',on);dk.inert=!on;document.documentElement.classList.toggle('fc-dock-on',on)};
    obs=new IntersectionObserver(es=>{es.forEach(e=>vu.set(e.target,e.isIntersecting));maj()});[bar,cote,fin].forEach(x=>x&&obs.observe(x));
  }

  function vueA(){
    el.innerHTML=`<section class="heros heros-page court lg-heros sombre" aria-labelledby="t-heros" style="--photo:url('${HEROS[0]}');--pos:60% 50%"><div class="heros-photo" aria-hidden="true"></div><div class="in">${heros3(`${fil}<h1 id="t-heros">${esc(o.titre.split(',')[0])}<em>,${esc(o.titre.split(',').slice(1).join(','))}</em>.</h1><p class="lead">${esc(o.adresse)} · ${esc(o.secteur)}, ${RIVE[o.zone].toLowerCase()}</p>`)}</div></section>
    ${cle()}
    <section class="sec fi-ph" aria-label="Photos"><div class="in"><div class="galerie">${o.photos.slice(0,5).map((k,i)=>`<button type="button" data-ph="${i}" aria-label="Agrandir la photo ${i+1} sur ${o.photos.length}"><img src="${photo(k)}" alt="" ${i?'loading="lazy"':''}>${i===4?`<span class="plus">Voir les ${o.photos.length} photos</span>`:''}</button>`).join('')}</div><p class="galerie-l">Photos d’illustration.</p></div></section>
    <section class="sec fi-sec" aria-label="Le logement"><div class="in fi-g"><div>
      <div class="bloc"><p class="sur">Le logement</p><h2>${esc(o.titre)}</h2><p class="fi-desc">${esc(o.desc)}</p>${fc==='3'?chifL():''}</div>
      <div class="bloc"><p class="sur">Inclus dans le loyer</p><h2>Ce qui est inclus.</h2>${inclus}</div>
      <div class="bloc"><p class="sur">Caractéristiques</p><h2>En détail.</h2>${carac}</div>
      <div class="bloc"><p class="sur">Le quartier</p><h2>${esc(o.secteur)}.</h2><div class="fi-quartier"><svg class="vq" aria-hidden="true" focusable="false"></svg><div><b>${esc(o.secteur)} · ${RIVE[o.zone]}</b><p>${esc(s.d||'')}</p><a class="btn btn-c" href="${guide.href}">${guide.t}${TRAIT}</a></div></div></div>
    </div>
    <aside class="flot fi-cote" id="visite" aria-label="Réserver"><small class="fc1-l">Loyer</small><p class="prix-l"><b>${prix(o.loyer)}</b> <span>/mois</span></p>${etat}<a class="btn btn-p" href="/locataires/demande-de-location">Demande de location${TRAIT}</a>
      <div class="cleo-l"><img src="${A}img/cleo-avatar.png" alt=""><div><b>Réserver une visite avec Cléo</b>Il répond 24/7 et propose un moment.</div></div><a class="btn btn-c" href="/cleo">Écrire à Cléo${TRAIT}</a><p class="tel">${ico(I.tel)}<a href="tel:4184733208">418-473-3208</a><span>· en semaine</span></p></aside></div></section>
    ${blocSemblables('b')}${quaiHtml()}`;
    const v=el.querySelector('.vq');if(v&&window.carteVignette)carteVignette(v,o.slug,{largeur:120,ratio:130/200,px:200});
    el.querySelector('.galerie').addEventListener('click',e=>{const b=e.target.closest('[data-ph]');if(b)boite(+b.dataset.ph)});
    quai();
  }

  function vueB(){
    const cren=[['Jeu.','18 h 00'],['Ven.','12 h 30'],['Sam.','10 h 00'],['Sam.','14 h 00'],['Dim.','11 h 00'],['Lun.','19 h 00']];
    el.innerHTML=`<section class="fb-heros" aria-labelledby="t-heros">${HEROS.map((u,i)=>`<div class="diapo${i?'':' on'}"><img src="${u}" alt="" ${i?'loading="lazy"':''}></div>`).join('')}
      <div class="in">${etatB}<h1 id="t-heros">${esc(o.titre)}.</h1><p class="lead">${esc(o.adresse)} · <span class="nw">${RIVE[o.zone]}</span></p><div class="fb-vign">${HEROS.map((u,i)=>`<button type="button" data-i="${i}" class="${i?'':'on'}" aria-label="Photo ${i+1}"><img src="${u}" alt=""></button>`).join('')}</div></div>
      <div class="fb-nav"><button type="button" data-n="-1" aria-label="Photo précédente">${ico(I.g)}</button><span aria-live="polite">1 / ${HEROS.length}</span><button type="button" data-n="1" aria-label="Photo suivante">${ico(I.d)}</button></div></section>
    ${bento(cren)}
    <section class="fb-q heros-carte sombre" aria-labelledby="t-fq"><div class="scene" role="img" aria-label="Carte : ${esc(o.secteur)}"></div><div class="in"><div class="texte-h"><p class="sur">Le quartier</p><h2 class="h2" id="t-fq">Vivre <span class="acc">à ${esc(o.secteur)}</span>.</h2><p class="chap">${esc(s.d||'')}</p><div class="actions"><a class="btn btn-p" href="${guide.href}">${guide.t}${TRAIT}</a></div></div></div></section>
    ${blocSemblables('a')}`;
    const d=[...el.querySelectorAll('.diapo')],vg=[...el.querySelectorAll('.fb-vign button')],cpt=el.querySelector('.fb-nav span');let i0=0,auto=0;
    const aller=i=>{i0=(i+d.length)%d.length;d.forEach((x,k)=>x.classList.toggle('on',k===i0));vg.forEach((x,k)=>x.classList.toggle('on',k===i0));cpt.textContent=`${i0+1} / ${d.length}`};
    el.querySelector('.fb-nav').addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(b){clearInterval(auto);aller(i0+ +b.dataset.n)}});
    el.querySelector('.fb-vign').addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(b){clearInterval(auto);aller(+b.dataset.i)}});
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)auto=setInterval(()=>aller(i0+1),5500);
    const crs=el.querySelector('.bt-cren');if(crs)crs.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;crs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
      const m=b.dataset.m,rl=el.querySelector('.bt-rl'),lv=el.querySelector('#bt-m');if(rl)rl.textContent='Réserver '+m;if(lv)lv.textContent='Moment choisi : '+m});
    const pz=el.querySelector('.bt-pic');if(pz&&window.pictoImmeuble){pz.innerHTML=pictoImmeuble(+pz.dataset.k,{sombre:true,h:220});pictoRecadrer(pz.firstElementChild)}
    if(window.carteHeros)carteHeros(el.querySelector('.fb-q'),o.slug);
  }

  /* boîte à photos */
  function boite(i){
    const b=document.createElement('div');b.className='boite';b.setAttribute('role','dialog');b.setAttribute('aria-label','Photos du logement');
    const maj=()=>{b.innerHTML=`<img src="${photo(o.photos[i])}" alt=""><button type="button" class="x" aria-label="Fermer">${ico(I.x)}</button><button type="button" class="pr" aria-label="Précédente">${ico(I.g)}</button><button type="button" class="sv" aria-label="Suivante">${ico(I.d)}</button><p>${i+1} / ${o.photos.length} · photo d’illustration</p>`;b.querySelector('.x').focus()};
    const fin=()=>{b.remove();removeEventListener('keydown',cl)};
    const cl=e=>{if(e.key==='Escape')fin();if(e.key==='ArrowRight'){i=(i+1)%o.photos.length;maj()}if(e.key==='ArrowLeft'){i=(i-1+o.photos.length)%o.photos.length;maj()}};
    b.addEventListener('click',e=>{if(e.target===b||e.target.closest('.x'))fin();else if(e.target.closest('.sv')){i=(i+1)%o.photos.length;maj()}else if(e.target.closest('.pr')){i=(i-1+o.photos.length)%o.photos.length;maj()}});
    addEventListener('keydown',cl);document.body.appendChild(b);maj();
  }

  function rendre(){
    document.title=`${o.titre} · Logements à louer · LeaseLane (refonte)`;
    history.replaceState(null,'',`?id=${o.id}&dir=${dir}${dir==='a'?`&fc=${fc}`:''}`);
    if(obs){obs.disconnect();obs=null}document.documentElement.classList.remove('fc-dock-on');el.dataset.fc=dir==='a'?fc:'';
    document.querySelectorAll('.choix-opt [data-fc]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.fc===fc));const rf=document.querySelector('.choix-r[data-r=fc]');if(rf)rf.hidden=dir!=='a';
    document.querySelectorAll('.choix-opt [data-d]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.d===dir));
    (dir==='a'?vueA:vueB)();scrollTo(0,0);
    el.querySelectorAll('.rv').forEach(x=>x.classList.add('on'));
  }
  const choix=document.querySelector('.choix-opt');if(choix)choix.addEventListener('click',e=>{const b=e.target.closest('[data-d]'),f=e.target.closest('[data-fc]');if(b&&b.dataset.d!==dir){dir=b.dataset.d;rendre()}if(f&&f.dataset.fc!==fc){fc=f.dataset.fc;try{localStorage.setItem('ll-fc',fc)}catch(e){}rendre()}});
  rendre();
})();
