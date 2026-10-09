/* Logements · magasin partagé entre l'Espace admin et le site public (prototype : localStorage).
   Format = celui des annonces du site (LL_DATA.logements) + champs de gestion : statut, photos [{src,alt}], description, inclus, dispoDate.
   Le site n'affiche que les fiches « publie ». En production : API + stockage des images. */
(function(){
  var CLE='ll-logements-v1',ABO=[];
  var INCLUS=['Chauffé','Éclairé','Meublé','Stationnement','Animaux acceptés','Entrées laveuse-sécheuse','Climatisation','Balcon'];
  var STATUTS=[['brouillon','Brouillon'],['publie','Publié'],['loue','Loué'],['archive','Archivé']];
  function depart(){var L=((window.LL_DATA||{}).logements||[]).map(function(l,i){var p=l.photo||(l.id==='L1'?'../../assets/img/logements/montcalm-cartier.jpg':null);
      return Object.assign({},l,{statut:'publie',photos:p?[{src:p,alt:l.titre}]:[],description:'',inclus:[],dispoDate:dateDe(l.dispo)})});return L}
  /* « Libre le 1er juillet » → prochaine occurrence AAAA-MM-JJ; « immédiatement » → vide. */
  function dateDe(t){t=String(t||'');if(/immédiat/i.test(t))return '';var M=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],m=t.match(/(\d+)(?:er)?\s+([a-zéû]+)/i);if(!m)return '';var mo=M.indexOf(m[2].toLowerCase());if(mo<0)return '';var auj=new Date(),a=auj.getFullYear(),d=new Date(a,mo,+m[1]);if(d<auj)d=new Date(a+1,mo,+m[1]);return d.getFullYear()+'-'+String(mo+1).padStart(2,'0')+'-'+String(+m[1]).padStart(2,'0')}
  function lire(){try{var v=JSON.parse(localStorage.getItem(CLE)||'null');if(Array.isArray(v))return v}catch(e){}return depart()}
  function ecrire(L){try{localStorage.setItem(CLE,JSON.stringify(L))}catch(e){alert('Espace de stockage du navigateur plein : retirez des photos ou réduisez leur taille.');return false}ABO.forEach(function(f){f(L)});return true}
  function prixTexte(n){n=parseInt(String(n).replace(/\D/g,''))||0;return n.toLocaleString('fr-CA')+' $'}
  function dispoTexte(l){if(!l.dispoDate)return 'Libre immédiatement';var d=new Date(l.dispoDate+'T12:00:00');var j=d.getDate(),m=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'][d.getMonth()];return 'Libre le '+(j===1?'1er':j)+' '+m}
  function normaliser(l){var ph=(l.photos||[])[0];return Object.assign({},l,{prix:prixTexte(l.prix),dispo:dispoTexte(l),photo:ph?ph.src:null,chambres:+l.chambres||0,sallesDeBain:+l.sallesDeBain||0,superficie:+l.superficie||0,annee:+l.annee||null,lat:+l.lat,lng:+l.lng})}
  window.LLStore={CLE:CLE,INCLUS:INCLUS,STATUTS:STATUTS,lire:lire,prixTexte:prixTexte,dispoTexte:dispoTexte,
    sauver:function(l){var L=lire(),n=normaliser(l),i=L.findIndex(function(x){return x.id===n.id});if(i<0)L.unshift(n);else L[i]=n;ecrire(L);return n},
    supprimer:function(id){ecrire(lire().filter(function(x){return x.id!==id}))},
    statut:function(id,s){var L=lire();L.forEach(function(x){if(x.id===id)x.statut=s});ecrire(L)},
    dupliquer:function(id){var L=lire(),o=L.find(function(x){return x.id===id});if(!o)return;var c=JSON.parse(JSON.stringify(o));c.id='L'+Date.now();c.titre=o.titre+' (copie)';c.statut='brouillon';L.unshift(c);ecrire(L);return c},
    neuf:function(){var s=((window.LL_DATA||{}).secteurs||[])[0]||{nom:'Montcalm',lat:46.803,lng:-71.226};return {id:'L'+Date.now(),statut:'brouillon',titre:'',prix:'',adresse:'',secteur:s.nom,chambres:1,sallesDeBain:1,superficie:'',dispoDate:'',batiment:'',propriete:'',annee:'',inclus:[],description:'',badge:'',photos:[],lat:s.lat,lng:s.lng}},
    reinitialiser:function(){localStorage.removeItem(CLE);ABO.forEach(function(f){f(lire())})},
    abonner:function(f){ABO.push(f);return function(){ABO=ABO.filter(function(x){return x!==f})}},
    /* Photo → JPEG 1600 px max, qualité 0,82 (allège le stockage local). */
    compresser:function(fichier){return new Promise(function(ok,ko){var r=new FileReader();r.onerror=ko;r.onload=function(){var im=new Image();im.onerror=ko;im.onload=function(){var k=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.82))};im.src=r.result};r.readAsDataURL(fichier)})}};
  /* Site public : les annonces publiées remplacent les annonces de démonstration. */
  if(window.LL_DATA&&!window.LL_ADM){try{var v=JSON.parse(localStorage.getItem(CLE)||'null');if(Array.isArray(v))window.LL_DATA.logements=v.filter(function(x){return x.statut==='publie'})}catch(e){}}
})();
