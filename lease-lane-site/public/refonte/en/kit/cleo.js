/* LeaseLane — panneau de Cléo (1er nov. 2026). Repris du site : src/proto/cleo-options.jsx (accueil par statut),
   app.jsx (actions, scénarios, relais humain) et faq.jsx (FAQ). La bulle ronde (/refonte/kit/temoins.js) ouvre et ferme le panneau.
   Parcours : présentation, statut (gardé pour la session, comme ll-cleo-statut), accueil propre au profil, puis fil de conversation.
   Maquette : aucune donnée n'est envoyée; les formulaires confirment seulement à l'écran. */
(()=>{
  const AV='/assets/img/cleo-avatar.png',URG='418-473-3208',TEL='tel:4184733208',CLE='ll-cleo-statut';
  const FAQ={"p1":{"public":"proprietaires","q":"How is the management offer for my building put together?","r":"Each offer is prepared for your building, after a 30-minute call: number of doors, condition of the building, services wanted. You receive it in writing, with the transition schedule."},"p2":{"public":"proprietaires","q":"Which services are included in management?","r":"Rent collection, communications with tenants, coordination of maintenance, Cléo 24/7 and the monthly report. Re-renting, major work and files before the Tribunal administratif du logement (TAL) are specified in your offer."},"p3":{"public":"proprietaires","q":"How long is the contract, and how do I end it?","r":"The management contract lasts 12 months and renews. To not renew it, send written notice at least 30 days before its end; you can also end it at any time in writing. We then hand over leases, files and keys to the person you designate."},"p4":{"public":"proprietaires","q":"How does the transfer work if I already have a manager?","r":"We first read your current contract to respect its notice period. We then collect leases, files, keys and histories, notify tenants and activate Cléo. Your first report arrives at the end of the first full month."},"p5":{"public":"proprietaires","q":"How long does it take to rent a vacant unit?","r":"It depends on the area, the price and the season. Cléo answers prospective tenants at all times and books showings without waiting for office hours. The unit therefore stays empty for less time."},"p6":{"public":"proprietaires","q":"How does Cléo respond to my tenants and prospective tenants, and when does a person take over?","r":"Cléo answers 24/7, French first, then in the language of the person it is talking to. It gives general information on the Civil Code and TAL rules that apply to both parties, books viewings and sorts emergencies. It hands over to a member of the team for an emergency, a dispute or formal notice, a repossession, an eviction or a termination, a harassment or discrimination complaint, or whenever asked. It announces every handoff: to whom, why and within what time frame."},"p7":{"public":"proprietaires","q":"How are tenants screened, and how is their data protected?","r":"Each applicant chooses how to show their ability to pay: rent receipts or paid bills, references from previous landlords, a credit check with their consent, or a guarantor. We do not ask for income, employer or number of occupants, and the absence of a credit history is not a reason for refusal. Identification is shown at signing, with no copy kept, in accordance with Law 25."},"p8":{"public":"proprietaires","q":"When and how are rents paid into my account?","r":"Rents collected are paid into your account at the frequency set out in your contract, after deduction of authorized expenses. Each payment is itemized in your owner portal."},"p9":{"public":"proprietaires","q":"Which reports will I receive, and how often?","r":"A monthly report, no later than the 15th of the month: rents due and received, arrears, vacant units, work, invoices and deadlines. The online dashboard shows the same figures continuously."},"p10":{"public":"proprietaires","q":"Who approves work, and above what amount?","r":"Below the approval threshold you set in Schedule B of your contract (no default amount), we hire the supplier and inform you. Above it, nothing is committed without your approval, except an emergency that threatens the safety of people or the building."},"p11":{"public":"proprietaires","q":"Do I keep control over important decisions?","r":"Yes. Tenant selection, work above your threshold, rent increases and any recourse to the TAL are submitted to you. You approve online, and the decision is logged in the file."},"p12":{"public":"proprietaires","q":"Do you manage plexes of two to five units?","r":"Yes. We manage plexes and all residential rental buildings, except divided co-ownership (condos) and short-term rentals. The service and the reports are the same, whatever the number of doors."},"p13":{"public":"proprietaires","q":"Which areas do you serve?","r":"We serve the greater Québec City region, within a 50 km radius: Québec City, the North Shore, the South Shore and Île d’Orléans. Write to us for an offer: we reply in less than 24 hours."},"p14":{"public":"proprietaires","phase":2,"q":"How do you handle late payments and TAL files?","r":"A reminder goes out automatically on the first day of lateness, followed by a call from the team. If the delay continues, we prepare the file for the Tribunal administratif du logement, with your approval."},"p15":{"public":"proprietaires","phase":2,"q":"How is the annual rent increase set?","r":"We calculate the proposed increase using the method published each year by the TAL, then submit it to you. The notice of lease change goes out three to six months before the end of a twelve-month lease."},"p16":{"public":"proprietaires","phase":2,"q":"What does Bill 31 change for lease assignments?","r":"Since Bill 31, adopted in 2024, an owner who receives a notice of assignment can, rather than consent to it, terminate the lease. We present each option and its effects before replying to the tenant."},"l1":{"public":"locataires","q":"How do I see available units and book a showing?","r":"Our units-for-rent page isn't ready yet: it will soon be available on the site, with the availability date of each unit. Cléo will then be able to book your viewing at any time. In the meantime, ask her to notify you as soon as it goes live."},"l2":{"public":"locataires","q":"Which documents are needed for a rental application?","r":"Your contact details, the unit you are applying for, the move-in date and the method you chose to show your ability to pay. Identification is shown when the lease is signed, with no copy kept. No deposit or postdated cheque is required."},"l3":{"public":"locataires","q":"Can Cléo answer in English or another language?","r":"Yes. Cléo answers first in French, then in the language of your message, including English. Official documents, such as the lease, remain in French."},"l4":{"public":"locataires","q":"How do I submit a work request and follow its progress?","r":"Submit the request in your tenant portal, with photos. You receive a tracking number and an appointment window, then a notice at each stage: received, scheduled, in progress, completed."},"l5":{"public":"locataires","q":"What is an emergency, and which number should I call?","r":"A major water leak, a heating failure in winter, a power outage, a door or lock that no longer closes, a faulty smoke detector. Call 418-473-3208 at any time; in case of danger, call 911."},"l6":{"public":"locataires","q":"How do I pay my rent?","r":"In your tenant portal or by transfer. You receive an automatic receipt as soon as the payment arrives."},"l7":{"public":"locataires","q":"How do I assign my lease or sublet my unit?","r":"Send a written notice from your tenant portal, with the contact details of the proposed person. Since Bill 31, the owner can accept, refuse for a serious reason or, for an assignment, terminate the lease; the portal explains each case before you send."},"l8":{"public":"locataires","q":"How do I add a person to my lease?","r":"Fill out the Lease Addition form in your tenant portal: the person’s identity, arrival date and status, co-tenant signatory or simple occupant. The owner gives their approval, then the lease is updated."},"l9":{"public":"locataires","q":"What is a guarantor, and what do they commit to?","r":"The guarantor, or surety, commits to paying the rent and respecting the lease if the tenant does not. They choose how to show their ability to pay: credit check with their consent, or receipts and paid bills. They sign electronically; we never ask for their health insurance card."},"l10":{"public":"locataires","q":"How do I give feedback or file a complaint?","r":"Choose the category in the form: comment, complaint or administrative request. You receive an immediate acknowledgement of receipt, then we get back to you as soon as possible."},"l11":{"public":"locataires","phase":2,"q":"How does lease renewal work?","r":"Your lease renews on the same terms. If the owner wants to change it, they send you a notice three to six months before the end of a twelve-month lease. You have one month after receiving the notice to reply in writing that you refuse the change or that you are leaving the unit; if you do not reply, you are deemed to have accepted it (art. 1945 C.C.Q.)."},"l12":{"public":"locataires","phase":2,"q":"When will I receive my Relevé 31?","r":"Your Relevé 31 is provided to you no later than the last day of February, for the previous year. It is used to claim the solidarity tax credit."},"l13":{"public":"locataires","phase":2,"q":"What should I do if there is a conflict with a neighbour?","r":"Write to us describing the situation, the dates and the effect on your unit. We contact the people involved and keep you informed of what follows."},"l14":{"public":"locataires","phase":2,"q":"How does my move-out work?","r":"Give your notice to leave in your tenant portal, within the time limits set out in the lease. Cléo schedules re-rental showings with you, then we arrange the return of the keys."},"t1":{"public":"locataires","q":"What is the TAL, the former Régie du logement?","r":"The Tribunal administratif du logement (TAL) replaced the Régie du logement on August 31, 2020. It decides disputes between tenants and landlords of residential units in Québec, and publishes the rent increase calculation method each year."},"t2":{"public":"locataires","q":"Can I refuse a rent increase?","r":"Yes. You have one month after receiving the notice to refuse it in writing, and you stay in the unit. The landlord can then ask the TAL to set the rent, within the month following your refusal."},"t3":{"public":"locataires","q":"Can the landlord repossess my unit?","r":"Yes, to live there or house a close relative, by written notice at least six months before the end of a twelve-month lease. You have one month to respond; if you do not respond, you are deemed to refuse."},"t4":{"public":"locataires","q":"Can the landlord enter my unit?","r":"Yes. With 24 hours’ notice, they can check the condition of the unit, carry out work in it or show it to a buyer; showings take place between 9 a.m. and 9 p.m., work between 7 a.m. and 7 p.m. After your notice of non-renewal, they can show it to future tenants without notice, between 9 a.m. and 9 p.m. Major work requires written notice of at least 10 days, or 3 months if you must leave the unit for more than a week. You may refuse a showing if the owner or their representative cannot be present. In an emergency, no notice is required."},"t5":{"public":"proprietaires","q":"When can I go to the TAL for unpaid rent?","r":"After more than three weeks of delay, you can ask the TAL to terminate the lease and recover the rent. We prepare the file and submit it to you before any filing."},"t6":{"public":"proprietaires","q":"Can I require a security deposit?","r":"No. In Québec, only the first month’s rent can be requested in advance. No security deposit or postdated cheque can be required."},"t7":{"public":"proprietaires","q":"How do I repossess a unit to live in it?","r":"Send a written notice at least six months before the end of a twelve-month lease. The tenant has one month to respond; if they refuse or do not respond, you must ask the TAL for authorization within the following month."}};
  const I={
    key:'<path d="M15.5 7.5 19 4m-2 2 2 2m-6.6 3.6a4.5 4.5 0 1 1-6.4 6.4 4.5 4.5 0 0 1 6.4-6.4Zm0 0L16 8"/>',
    imm:'<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m12-13h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4m-4 4h4m-4 4h4m-4 4h4"/>',
    maison:'<path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
    oeil:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    idee:'<path d="M9 18h6m-5 4h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z"/>',
    pers:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    fl:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    q:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.3-2.4 3.6M12 17h.01"/>',
    tel:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
    env:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    x:'<path d="M6 6l12 12M18 6 6 18"/>',
    re:'<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16m0 5v-5h5"/>'
  };
  const ic=(n,c='')=>`<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const STATUTS=[['locataire','I\'m a tenant.','key'],['proprio','I\'m an owner and a client of yours.','imm'],['futur','I want to become a tenant.','maison'],['client','I\'m interested in your property management services.','oeil'],['info','I just want to find out more.','idee']];
  const PROFILS={
    locataire:{lib:'Tenant',k:['travaux','plainte','portailL','bail'],urg:true,faq:['l4','l5','l6','l11']},
    proprio:{lib:'Owner client',k:['portailP','proprio','bail'],faq:['p8','p9','p10','p11']},
    futur:{lib:'Future tenant',k:['chercher','demande','bail'],faq:['l1','l2','l9','t1']},
    client:{lib:'Future client',k:['gestion','proprio','bail'],faq:['p1','p2','p12','p13']},
    info:{lib:'Visiteur',k:['chercher','gestion','bail'],faq:['p13','l1','t1','p6']}
  };
  const ACTIONS={
    chercher:['Find a unit','For you'],demande:['Submit a rental application','For you'],
    travaux:['Services for tenants','For you'],plainte:['Comment or complaint','For you'],portailL:['My tenant space','For you'],
    gestion:['Entrust my building to you','For you'],proprio:['Services for owners','For you'],portailP:['My owner space','For you'],
    bail:['A question about a lease or the TAL','Housing law']
  };
  const lien=(t,h)=>({type:'lien',t,h});
  const SC={
    chercher:{m:[{t:'Here are the units currently for rent, on both shores. Filter by area, rent and number of rooms, then book a viewing from the unit\'s listing.'},lien('See units for rent','/en/apartments-for-rent'),lien('Submit a rental application','/en/tenants/rental-application')],s:['What documents are required?','Speak with a person']},
    demande:{m:[{t:'The application is made online and takes about ten minutes. You choose how to show your ability to pay: rent receipts, references, a credit check with your consent, or a guarantor.'},lien('Submit a rental application','/en/tenants/rental-application')],s:['What documents are required?','Speak with a person']},
    travaux:{m:[{t:`I'm noting the problem. If water is actively leaking or there is no heat, call the emergency line first, 24/7: ${URG}.`},{type:'urgence'},{t:'Otherwise, submit the request in your tenant space with photos: it is linked to your unit and you can follow it at every step.'},lien('Services for tenants','/en/tenants')],s:['It\'s an emergency','Speak with a person']},
    plainte:{m:[{t:'A comment, complaint or administrative request can be submitted online, without logging in. You receive an immediate acknowledgment of receipt.'},lien('Open the form','/en/tenants/comment-or-complaint')],s:['Speak with a person']},
    portailL:{m:[{t:'Your tenant space brings together your lease, your payments and the status of your requests.'},lien('My tenant space','/locataires#suivi')],s:['How do I pay my rent?','Speak with a person']},
    gestion:{m:[{t:'Each offer is prepared for your building, after a 30-minute call: number of doors, condition of the building and services wanted.'},{type:'resume',titre:'What management includes',l:[['Loyers','Collection, receipts, follow-ups'],['Tenants','Messages, requests, 24/7 emergencies'],['Work','Coordination of maintenance and work'],['Rapports','Monthly, with a dashboard']]},lien('Get a management offer','/en/get-a-quote')],s:['Do you manage plexes?','Speak with a person']},
    proprio:{m:[{t:'Full management, rental of your units, expertise and strategy: here is where it\'s all explained.'},lien('Property management','/en/property-management'),lien('Expertise and strategy','/en/rental-property-strategy')],s:['Get an offer','Speak with a person']},
    portailP:{m:[{t:'Your owner space shows the dashboard, monthly reports and work awaiting approval.'},lien('My owner space','/gestion-immobiliere#espace')],s:['What reports will I receive?','Speak with a person']},
    bail:{m:[{t:'I can explain the general rules of the Civil Code and the TAL on leases: notices, deadlines, assignment, repossession, termination, remedies. Describe your situation: I\'ll point you to the rules that apply and their sources, then a member of the team takes over for your specific case.'},{t:'General legal information, not legal advice.',note:1}],s:['A rent increase','A lease assignment','Speak with a person']},
    hausse:{m:[{t:'For a 12-month lease, notice of modification is given 3 to 6 months before the end of the lease: from January 1 to March 31 for a lease ending June 30 (Civil Code of Québec, art. 1942).'},{t:'The tenant has 1 month to accept, refuse and stay, or leave; silence counts as acceptance. If the tenant refuses and stays, the landlord has 1 month to ask the TAL to set the rent.'}],s:['A lease assignment','Speak with a person']},
    cession:{m:[{t:'The tenant gives written notice, with the name and address of the proposed person. The landlord has 15 days to respond; silence counts as consent (Civil Code of Québec, arts. 1870 and 1871).'},{t:'Since Bill 31, a refusal without a serious reason terminates the lease on the planned date of the assignment. Only reasonable expenses actually incurred can be claimed.'}],s:['A rent increase','Speak with a person']},
    humain:{m:[{t:'Of course. Leave me your contact details: a member of the team will get back to you, with the thread of our conversation so you don\'t have to repeat yourself.'},{type:'form',bouton:'Be contacted',usage:'get back to me about this conversation'}],s:['Continue with Cléo']},
    urgence:{m:[{t:'For an active water leak, a heating failure or any danger, call now: a person answers 24/7.'},{type:'urgence'}],s:['Services for tenants','Speak with a person']},
    defaut:{m:[{t:'I\'m noting your request. I don\'t have a reliable answer to give you here: a member of our team will get back to you on the next business day.'}],s:['Speak with a person','Continue with Cléo']}
  };
  /* suggestions et texte libre → scénario ou question de la FAQ */
  const SUGG={'Speak with a person':'humain','I want to speak to a human':'humain','It\'s an emergency':'urgence','A rent increase':'hausse','A lease assignment':'cession','Services for tenants':'travaux','Get an offer':'gestion','What documents are required?':'faq:l2','How do I pay my rent?':'faq:l6','Do you manage plexes?':'faq:p12','What reports will I receive?':'faq:p9'};
  const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ');
  const VIDES=new Set('le la les un une des de du d l a au aux et ou en est je j me mon ma mes vous votre vos il elle on que qui quoi pour par sur dans avec pas ne se ce cette ces comment quand quel quelle quels quelles puis peut faire faut y'.split(' '));
  const mots=s=>norm(s).split(/\s+/).filter(m=>m.length>2&&!VIDES.has(m));
  const CLES=[[/urgen|fuite|inond|chauffage|feu|incendi/,'urgence'],[/humain|personne|agent|parler a/,'humain'],[/hausse|augment/,'hausse'],[/cession|ceder|sous.?lou/,'cession'],[/logement.*(louer|dispo)|appartement|trouver|cherche|visite/,'chercher'],[/plainte|commentaire/,'plainte'],[/offre|confier|gestion de mon/,'gestion'],[/bail|tal|regie/,'bail']];
  function deviner(txt){
    const n=norm(txt);for(const [re,k] of CLES)if(re.test(n))return k;
    const m=mots(txt);let best=null,score=0;
    for(const id in FAQ){const q=new Set(mots(FAQ[id].q+' '+FAQ[id].r.slice(0,120)));const s=m.filter(x=>q.has(x)).length;if(s>score){score=s;best=id}}
    return score>=2?'faq:'+best:'defaut';
  }

  const racine=document.querySelector('.cl-flot');if(!racine)return;
  const bulle=racine.querySelector('.cl-bulle');
  const p=document.createElement('section');p.className='clv';p.id='clv';p.hidden=true;p.setAttribute('role','dialog');p.setAttribute('aria-label','Chat with Cléo, AI manager');
  racine.insertBefore(p,bulle);
  bulle.setAttribute('aria-controls','clv');bulle.setAttribute('aria-expanded','false');
  const reduit=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let statut=null,vu=false,sujet=null,fil=[],file=Promise.resolve(),gen=0;
  try{statut=PROFILS[sessionStorage.getItem(CLE)]?sessionStorage.getItem(CLE):null}catch(e){}

  p.innerHTML=`<header class="clv-tete"><span class="clv-av"><img src="${AV}" alt="" width="40" height="40"><i aria-hidden="true"></i></span><b>Cléo · AI Manager</b><button type="button" class="clv-x" data-a="fermer" aria-label="Close the chat">${ic('x')}</button></header>
  <div class="clv-corps" aria-live="polite"></div>
  <form class="clv-saisie" novalidate><label class="clv-vh" for="clv-q">Your question</label><textarea id="clv-q" rows="1" placeholder="Type your question…"></textarea><button type="submit" aria-label="Send">${ic('env')}</button></form>
  <footer class="clv-pied"><a href="/en/cleo">Who is Cléo?</a><a href="/en/privacy-policy">Privacy</a></footer>`;
  const corps=p.querySelector('.clv-corps'),form=p.querySelector('.clv-saisie'),q=p.querySelector('#clv-q');

  const ligne=(a,t,icone,d='')=>`<button type="button" class="clv-l" data-a="${a}"${d}><span>${esc(t)}</span><span class="clv-c">${ic(icone)}</span></button>`;
  function vueIntro(){
    corps.dataset.v='intro';
    corps.innerHTML=`<div class="clv-intro"><img src="${AV}" alt="" width="84" height="84"><b>Cléo</b><small>AI Manager</small><p>I answer tenants, owners and people looking for a unit 24/7. A member of the team takes over when your file calls for it.</p><button type="button" class="clv-passer" data-a="statut">Start</button></div>`;
  }
  function vueStatut(){
    corps.dataset.v='statut';
    corps.innerHTML=`<h2 class="clv-h">To guide you properly, what is your status with LeaseLane?</h2><div class="clv-ls">${STATUTS.map(([k,t,i])=>ligne('st',t,i,` data-k="${k}"`)).join('')}</div>`;
  }
  function vueAccueil(){
    corps.dataset.v='accueil';sujet=null;fil=[];
    const P=PROFILS[statut],grp={};P.k.forEach(k=>{const [t,g]=ACTIONS[k];(grp[g]=grp[g]||[]).push(ligne('ac',t,'fl',` data-k="${k}"`))});
    corps.innerHTML=`<h2 class="clv-h">Hello, how can I help you?</h2><p class="clv-vous">You are: <b>${P.lib}</b> <button type="button" data-a="modifier">Modifier</button></p>
    <div class="clv-ls">${P.urg?`<a class="clv-l clv-urg" href="${TEL}"><span>24/7 emergency · ${URG}</span><span class="clv-c">${ic('tel')}</span></a>`:''}${ligne('sc','I want to speak to a human','pers',' data-k="humain"')}</div>
    ${Object.entries(grp).map(([g,l])=>`<p class="clv-g">${g}</p><div class="clv-ls">${l.join('')}</div>`).join('')}
    <p class="clv-g">Frequently asked questions</p><div class="clv-ls">${P.faq.map(id=>ligne('faq',FAQ[id].q,'q',` data-k="${id}"`).replace('class="clv-l"','class="clv-l clv-f"')).join('')}</div>`;
  }
  function vueFil(titre){
    corps.dataset.v='fil';sujet=titre;
    corps.innerHTML=`<div class="clv-sujet"><span><small>Topic</small> <b>${esc(titre)}</b></span><button type="button" data-a="nouveau">${ic('re')}New topic</button></div><div class="clv-fil"></div>`;
  }
  const filEl=()=>corps.querySelector('.clv-fil');
  const bas=()=>{corps.scrollTop=corps.scrollHeight};
  function rendre(m){
    if(m.qui==='client')return `<p class="clv-m clv-moi">${esc(m.t)}</p>`;
    if(m.type==='lien')return `<a class="clv-lien" href="${m.h}"><span>${esc(m.t)}</span>${ic('fl')}</a>`;
    if(m.type==='urgence')return `<a class="clv-carte-urg" href="${TEL}">${ic('tel')}<span><small>Emergency 24/7</small><b>${URG}</b></span></a>`;
    if(m.type==='resume')return `<div class="clv-res"><p>${esc(m.titre)}</p><dl>${m.l.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></div>`;
    if(m.type==='form')return `<form class="clv-form" novalidate><p class="clv-form-t">Your contact details</p><label>Name<input name="nom" autocomplete="name" required></label><label>Email<input name="courriel" type="email" autocomplete="email" required></label><label>Phone <span>(optional)</span><input name="tel" type="tel" autocomplete="tel"></label><label class="clv-ok"><input type="checkbox" name="ok" required><span>I agree that LeaseLane may use this information only for ${esc(m.usage)}. <a href="/en/privacy-policy">Privacy Policy</a></span></label><p class="clv-err" hidden></p><button type="submit" class="clv-btn">${esc(m.bouton)}</button></form>`;
    if(m.type==='sugg')return `<div class="clv-sugg">${m.l.map(s=>`<button type="button" data-a="sugg">${esc(s)}</button>`).join('')}</div>`;
    return `<p class="clv-m${m.note?' clv-note':''}">${esc(m.t)}</p>`;
  }
  function ajouter(m){fil.push(m);const f=filEl();if(!f)return;f.insertAdjacentHTML('beforeend',rendre(m));bas()}
  function dire(liste,sugg){
    const g=gen;
    file=file.then(async()=>{
      for(const m of liste){
        if(g!==gen)return;
        if(!reduit){const f=filEl();f&&f.insertAdjacentHTML('beforeend','<p class="clv-ecrit" aria-label="Cléo is typing"><i></i><i></i><i></i></p>');bas();await new Promise(r=>setTimeout(r,m.type?350:Math.min(1100,450+(m.t||'').length*4)));const e=corps.querySelector('.clv-ecrit');e&&e.remove()}
        if(g!==gen)return;ajouter(m);
      }
      if(sugg&&sugg.length&&g===gen)ajouter({type:'sugg',l:sugg});
    });
  }
  function lancer(k,libelle,client){
    if(corps.dataset.v!=='fil'){gen++;file=Promise.resolve();vueFil(libelle)}
    corps.querySelectorAll('.clv-sugg').forEach(e=>e.remove());
    if(client)ajouter({qui:'client',t:client});
    if(k.startsWith('faq:')){const f=FAQ[k.slice(4)];dire([{t:f.r}],['Another question','Speak with a person']);return}
    if(k==='defaut'&&client&&window.llCleo){const g=gen,f=filEl();f&&f.insertAdjacentHTML('beforeend','<p class="clv-ecrit" aria-label="Cléo is typing"><i></i><i></i><i></i></p>');bas();window.llCleo(client).then(t=>[[{t}],['Another question','Speak with a person']],()=>[SC.defaut.m,SC.defaut.s]).then(([m,s])=>{const e=corps.querySelector('.clv-ecrit');e&&e.remove();if(g===gen)dire(m,s)});return}const s=SC[k]||SC.defaut;dire(s.m,s.s);
  }
  function choisirStatut(k){statut=k;try{sessionStorage.setItem(CLE,k)}catch(e){}vueAccueil();focusPremier()}
  const focusPremier=()=>{const f=corps.querySelector('button,a,input');f&&f.focus({preventScroll:true})};

  function ouvrir(){
    p.hidden=false;racine.classList.add('clv-ouvert');bulle.setAttribute('aria-expanded','true');
    if(!corps.dataset.v){if(statut){vueAccueil()}else{vueIntro();if(!reduit)setTimeout(()=>{if(corps.dataset.v==='intro'&&!p.hidden)vueStatut()},2200)}}
    vu=true;requestAnimationFrame(focusPremier);
  }
  function fermer(){p.hidden=true;racine.classList.remove('clv-ouvert');bulle.setAttribute('aria-expanded','false');bulle.focus({preventScroll:true})}
  bulle.addEventListener('click',e=>{e.preventDefault();p.hidden?ouvrir():fermer()});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!p.hidden)fermer()});
  /* tout lien « Parler à Cléo » du site ouvre aussi le panneau */
  document.addEventListener('click',e=>{const a=e.target.closest('a[data-cleo]');if(!a)return;e.preventDefault();ouvrir()});

  p.addEventListener('click',e=>{
    const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,k=b.dataset.k;
    if(a==='fermer')fermer();
    else if(a==='statut'){vueStatut();focusPremier()}
    else if(a==='st')choisirStatut(k);
    else if(a==='modifier'){vueStatut();focusPremier()}
    else if(a==='ac'||a==='sc')lancer(k,a==='sc'?'Speak with a person':ACTIONS[k][0]);
    else if(a==='faq')lancer('faq:'+k,'Frequently asked question',FAQ[k].q);
    else if(a==='nouveau'){gen++;file=Promise.resolve();statut?vueAccueil():vueStatut();focusPremier()}
    else if(a==='sugg'){const t=b.textContent;if(t==='Continue with Cléo'||t==='Another question'){gen++;file=Promise.resolve();vueAccueil();focusPremier();return}lancer(SUGG[t]||deviner(t),t,t)}
  });
  /* formulaire de coordonnées (maquette : confirmation à l'écran, rien n'est envoyé) */
  p.addEventListener('submit',e=>{
    const f=e.target;e.preventDefault();
    if(f===form){const t=q.value.trim();if(!t)return;q.value='';q.style.height='';if(!statut){statut='info';try{sessionStorage.setItem(CLE,'info')}catch(x){}}lancer(deviner(t),'Your question',t);return}
    const err=f.querySelector('.clv-err'),d=new FormData(f);let m='';
    if(!d.get('nom').trim())m='Enter your name.';else if(!/^\S+@\S+\.\S+$/.test(d.get('courriel')))m='Enter a valid email, for example name@example.ca.';else if(!d.get('ok'))m='Check the consent box so the team can reach you.';
    if(m){err.textContent=m;err.hidden=false;return}
    f.outerHTML=`<p class="clv-m clv-confirme">Thank you, ${esc(d.get('nom').trim().split(' ')[0])}. A member of the team will write to you at ${esc(d.get('courriel'))} on the next business day.</p>`;bas();
  });
  q.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
  q.addEventListener('input',()=>{q.style.height='';q.style.height=Math.min(q.scrollHeight,96)+'px'});
})();
