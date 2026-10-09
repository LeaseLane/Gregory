import { useEffect } from 'react';
/* Finitions du site (prototype : finition.js, carrousels-mobile.js, centrage-mobile.js), lancées une fois après l'hydratation.
   Elles observent le DOM (MutationObserver) et suivent donc aussi les changements de page. */
/* Le marquage des sections attend que la page soit hydratée (sinon le HTML du serveur et le rendu client diffèrent) :
   chaque vue l'annonce avec usePagePrete(). */
let pagePrete = false, relancer = null;
export function usePagePrete() {
  useEffect(() => { pagePrete = true; if (relancer) relancer(); }, []);
}
export function demarrerFinitions() {
  if (typeof window === 'undefined' || window.__llFinitions) return;
  window.__llFinitions = 1;
/* Apparition au défilement : chaque section intérieure (sauf la bannière et les sections épinglées) monte en fondu une seule fois. */
(function(){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('fn-vu');io.unobserve(e.target)}})},{root:null,rootMargin:'0px 0px -8% 0px',threshold:.08});
  function marquer(){var m=document.getElementById('ll-page');if(!m||!pagePrete)return;
    m.querySelectorAll('section').forEach(function(s,i){
      if(s.dataset.fn||s.closest('[data-fn]')&&s.closest('[data-fn]')!==s)return;s.dataset.fn='1';
      var r=s.getBoundingClientRect();if(i===0||r.top<innerHeight*.9||s.querySelector('[style*="sticky"]')||s.querySelector('.leaflet-container')||s.offsetHeight>innerHeight*2.2)return;
      s.classList.add('fn-rev');io.observe(s)})}
  var t=0;new MutationObserver(function(){clearTimeout(t);t=setTimeout(marquer,120)}).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',function(){setTimeout(marquer,300)});relancer=function(){setTimeout(marquer,120)};if(pagePrete)relancer();
})();

/* Retour en haut : bouton fixe en bas à gauche, visible après un écran de défilement. */
(function(){
  if(window.__llHaut)return;window.__llHaut=1;
  var b=document.createElement('button');b.type='button';b.className='ll-haut';b.setAttribute('aria-label','Retour en haut de la page');b.title='Retour en haut';
  b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  var sc=null,lie=function(){var n=document.getElementById('ll-scroll');if(n&&n!==sc){if(sc)sc.removeEventListener('scroll',maj);sc=n;sc.addEventListener('scroll',maj,{passive:true});maj()}};
  function maj(){var on=sc&&sc.scrollTop>(window.innerHeight*.9);b.classList.toggle('ll-haut-on',!!on);b.tabIndex=on?0:-1}
  b.addEventListener('click',function(){if(!sc)return;var r=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;sc.scrollTo({top:0,behavior:r?'auto':'smooth'});var m=document.getElementById('ll-page');if(m){m.setAttribute('tabindex','-1');setTimeout(function(){m.focus({preventScroll:true})},r?0:500)}});
  function pret(){if(document.querySelector('.ll-haut'))return;document.body.appendChild(b);lie();new MutationObserver(lie).observe(document.getElementById('root')||document.body,{childList:true})}
  if(document.body)pret();else document.addEventListener('DOMContentLoaded',pret);
})();

/* Carrousels mobiles (≤ 620 px) : points de pagination sous chaque carrousel de cartes.
   Les carrousels eux-mêmes sont en CSS (responsive.css, une carte pleine largeur, rien ne dépasse les marges).
   Ici : un point par carte, le point actif suit le défilement, toucher un point amène à la carte. */
(function(){
  if(window.__llCar)return;window.__llCar=1;
  var SEL=['.sv-ecrans','#ll-page .ll-deux:has(>div>.cs-carte)','#ll-page .cs-tab4:has(>section.cs-col)','#ll-page .cpb-qui','#ll-page .cpb-deux','#ll-page .ap2-eq','#ll-page .go-ecr-car','#ll-page .go-tal-car'];
  var mq=window.matchMedia('(max-width:620px)');
  /* cartes = éléments aimantés (scroll-snap-align), enfants directs ou petits-enfants (colonnes en display:contents) */
  function cartes(c){var r=[];var snap=function(e){return getComputedStyle(e).scrollSnapAlign.indexOf('start')>-1||getComputedStyle(e).scrollSnapAlign.indexOf('center')>-1};for(var i=0;i<c.children.length;i++){var e=c.children[i];if(snap(e)){r.push(e);continue}for(var j=0;j<e.children.length;j++)if(snap(e.children[j]))r.push(e.children[j])}return r.length?r:[].slice.call(c.children)}
  function actif(c,l){var g=c.getBoundingClientRect().left+parseFloat(getComputedStyle(c).paddingLeft||0),best=0,d=1e9;l.forEach(function(e,i){var v=Math.abs(e.getBoundingClientRect().left-g);if(v<d){d=v;best=i}});return best}
  function monter(c){
    var l=cartes(c);if(l.length<2)return;if(c.__pts){if(c.__pts.children.length===l.length)return;c.__pts.remove();c.__pts=null}
    var nav=document.createElement('div');nav.className='ll-car-pts';nav.setAttribute('role','group');nav.setAttribute('aria-label','Choisir une carte');
    l.forEach(function(e,i){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Carte '+(i+1)+' sur '+l.length);
      b.addEventListener('click',function(){var r=matchMedia('(prefers-reduced-motion: reduce)').matches;c.scrollTo({left:c.scrollLeft+e.getBoundingClientRect().left-c.getBoundingClientRect().left-parseFloat(getComputedStyle(c).paddingLeft||0),behavior:r?'auto':'smooth'})});nav.appendChild(b)});
    c.insertAdjacentElement('afterend',nav);c.__pts=nav;
    var maj=function(){var k=actif(c,l);[].forEach.call(nav.children,function(b,i){b.setAttribute('aria-current',i===k?'true':'false')});
      /* hauteur adaptée à la diapositive affichée (carrousels marqués data-hauteur-auto) */
      if(c.hasAttribute('data-hauteur-auto'))c.style.height=mq.matches?l[k].offsetHeight+'px':''};
    c.addEventListener('scroll',function(){clearTimeout(c.__t);c.__t=setTimeout(maj,60)},{passive:true});maj();
    if(c.hasAttribute('data-hauteur-auto')){window.addEventListener('resize',function(){clearTimeout(c.__r);c.__r=setTimeout(maj,150)});if(document.fonts)document.fonts.ready.then(maj)}
  }
  function balayer(){if(!mq.matches)return;SEL.forEach(function(s){var n;try{n=document.querySelectorAll(s)}catch(e){return}[].forEach.call(n,function(c){if(c.scrollWidth>c.clientWidth+4)monter(c)})})}
  var t=0;new MutationObserver(function(){clearTimeout(t);t=setTimeout(balayer,250)}).observe(document.documentElement,{childList:true,subtree:true});
  mq.addEventListener('change',balayer);window.addEventListener('load',function(){setTimeout(balayer,600)});
})();

/* Centrage mobile (≤ 620 px) : les blocs de texte de carte sont centrés par responsive.css.
   Exception : une rangée « pictogramme à gauche + texte » garde son texte aligné à gauche,
   sinon le texte centré flotte loin de son pictogramme. Ce script repère ces rangées d'après la mise en page réelle
   (pictogramme côte à côte avec le texte) et leur ajoute la classe ll-a-cote. */
(function(){
  if(window.__llCentre)return;window.__llCentre=1;
  var mq=window.matchMedia('(max-width:620px)');
  function balayer(){
    var page=document.getElementById('ll-page');if(!page)return;
    [].forEach.call(page.querySelectorAll('.ll-a-cote'),function(e){if(!mq.matches)e.classList.remove('ll-a-cote')});
    [].forEach.call(page.querySelectorAll('.ll-sans-puce'),function(e){if(!mq.matches)e.classList.remove('ll-sans-puce')});
    if(!mq.matches)return;
    /* Listes centrées : la puce ou le pictogramme de tête (fait pour un alignement à gauche) est masqué. */
    [].forEach.call(page.querySelectorAll('li'),function(li){
      var ic=li.firstElementChild;if(!ic||ic.getAttribute('aria-hidden')!=='true'||ic.offsetWidth>26||ic.classList.contains('pc-ic'))return;
      if(li.closest('nav,button,.ll-fl,.bl-corps,.ll-legal,form,.fp'))return;
      var cs=getComputedStyle(li);if(cs.textAlign!=='center'&&cs.justifyContent!=='center')return;
      li.classList.add('ll-sans-puce');
      [].forEach.call(li.querySelectorAll('.ll-a-cote'),function(x){x.classList.remove('ll-a-cote')});
    });
    [].forEach.call(page.querySelectorAll(':is(span,div,i):has(>svg,>img)'),function(p){
      if(p.closest('button,.ll-fl'))return;
      var t=p.nextElementSibling;if(!t||p.offsetWidth===0||p.offsetWidth>96||p.offsetHeight>96)return;
      if(getComputedStyle(t).textAlign!=='center'&&!t.classList.contains('ll-a-cote'))return;
      var a=p.getBoundingClientRect(),b=t.getBoundingClientRect();
      /* côte à côte : le pictogramme est à gauche du texte et chevauche sa hauteur */
      if(a.right<=b.left+2&&a.bottom>b.top+4&&a.top<b.bottom-4)t.classList.add('ll-a-cote');
    });
  }
  var t=0;new MutationObserver(function(){clearTimeout(t);t=setTimeout(balayer,300)}).observe(document.documentElement,{childList:true,subtree:true});
  mq.addEventListener('change',balayer);window.addEventListener('load',function(){setTimeout(balayer,600)});
})();

}
