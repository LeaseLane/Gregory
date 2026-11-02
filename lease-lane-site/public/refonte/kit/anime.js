/* Animations du site (direction du Guide Local, 29 oct.) : le coup d'œil monte quand il devient visible, sa barre se remplit et son chiffre compte;
   les groupes (cases, frises, étapes, cartes, articles, équipe, questions, contacts) apparaissent à tour de rôle. Chargé sur toutes les pages par construire.py. */
(()=>{
  const calme=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vus=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');vus.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});
  const groupes=['.guides','.cases','.vie-q','.jalons','.autres','.escalier','.grille','.arts','.ix','.points','.equipe','.semblables','.fq-g>div:last-child','.fin-portes .contacts'].join(',');
  document.querySelectorAll(groupes).forEach(c=>{if(c.closest('.cascade'))return;c.classList.add('cascade');[...c.children].forEach((e,i)=>e.style.setProperty('--i',Math.min(i,8)));if(calme)c.classList.add('on');else vus.observe(c)});
  const cq=document.querySelector('.cq'),ch=cq&&cq.querySelector('.cq-c4-chiffre');
  /* le chiffre compte jusqu'à sa valeur, avec le même nombre de décimales (58,7 ou 129) */
  const compte=()=>{const t=ch&&ch.firstChild;if(!t||calme)return;const txt=t.textContent.trim();if(!/^[\d\s\u00a0]+(,\d+)?$/.test(txt))return;const fin=parseFloat(txt.replace(/[\s\u00a0]/g,'').replace(',','.')),dec=(txt.split(',')[1]||'').length;if(!isFinite(fin))return;
    const d=1400,t0=performance.now()+450,ecrit=v=>{t.textContent=v.toFixed(dec).replace('.',',')};ecrit(0);
    const pas=n=>{const k=Math.min(1,Math.max(0,(n-t0)/d));ecrit(fin*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(pas);else t.textContent=txt};requestAnimationFrame(pas)};
  if(cq){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){cq.classList.add('vu');compte();io.disconnect()}}),{threshold:.25});io.observe(cq)}
  if(!('IntersectionObserver' in window)&&cq)cq.classList.add('vu');
})();
