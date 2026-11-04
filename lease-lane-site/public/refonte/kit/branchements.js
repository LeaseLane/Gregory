/* LeaseLane — branchements de la refonte statique (copié dans /refonte/kit/ par importer.py).
   Les pages de Steven sont une maquette : rien n'y est envoyé. Ce script fait ce que le site Next.js fait déjà :
   - mesure (GA4, pixel Meta) seulement après consentement (« ll-temoins-choix », Loi 25), et preuve du choix dans le registre;
   - formulaires (nous joindre, offre de service, plainte, Cléo, inscription d'entreprise) envoyés aux mêmes fonctions Supabase
     (handle-public-inquiry, inscription-entreprise), avec Turnstile; la page affiche son « merci » seulement après l'envoi réussi;
   - questions libres à Cléo répondues par handle-public-faq (window.llCleo, appelée par kit/cleo.js).
   Mêmes valeurs que src/lib/envoi.js, src/components/{GoogleAnalytics,PixelMeta,PreuveTemoins}.jsx. */
(() => {
  const BASE = 'https://kdmwfbcziokygfcmjxeq.supabase.co', FONCTIONS = BASE + '/functions/v1/';
  const CLE = 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR', TURNSTILE = '0x4AAAAAAEwdcNdTN1rCC_Jz';
  const GA = 'G-JQLFWEYSSH', META = '1081699598100533';
  const ECHEC = 'Envoi impossible pour le moment. Réessayez dans un instant, ou écrivez à info@leaselane.ca.';
  const ENTETES = { apikey: CLE, Authorization: 'Bearer ' + CLE };

  /* ---------- Témoins : mesure et preuve ---------- */
  const choix = () => { try { return JSON.parse(localStorage.getItem('ll-temoins')) || {}; } catch (e) { return {}; } };
  function ga() {
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() { window.dataLayer.push(arguments); };
      gtag('js', new Date()); gtag('config', GA, { send_page_view: false });
      const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA; document.head.appendChild(s);
    }
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('event', 'page_view', { page_location: location.href, page_title: document.title });
  }
  function meta() {
    /* Code d'installation fourni par Meta. */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    if (!window.fbq.llInit) { fbq('init', META); fbq.llInit = true; }
    fbq('consent', 'grant'); fbq('track', 'PageView');
  }
  const c0 = choix();
  if (c0.audience) ga();
  if (c0.publicite) meta();
  function visiteur() {
    try { let v = localStorage.getItem('ll-visiteur'); if (!v) { v = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)).replace(/[^A-Za-z0-9-]/g, ''); localStorage.setItem('ll-visiteur', v); } return v; } catch (e) { return null; }
  }
  addEventListener('ll-temoins-choix', e => {
    const c = e.detail || {};
    if (c.audience) ga(); else if (window.gtag) gtag('consent', 'update', { analytics_storage: 'denied' });
    if (c.publicite) meta(); else if (window.fbq) fbq('consent', 'revoke');
    const v = visiteur();
    if (v) fetch(BASE + '/rest/v1/rpc/site_temoins', { method: 'POST', keepalive: true, headers: { ...ENTETES, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: { visiteur: v, choix: { mesure: !!c.audience, marketing: !!c.publicite }, version: String(c.version || '?'), langue: document.documentElement.lang || 'fr' } }) }).catch(() => null);
  });

  /* ---------- Bouton EN (la maquette n'a pas d'anglais) : page jumelle de l'application (hreflang en-CA), sinon /en ---------- */
  document.addEventListener('click', async e => {
    const b = e.target.closest('a[lang="en"],button[lang="en"]');
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    let cible = '/en';
    try {
      const u = new URL(document.querySelector('link[rel=alternate][hreflang="en-CA"]').href).pathname;
      if ((await fetch(u, { method: 'HEAD' })).ok) cible = u;
    } catch (x) {}
    location.href = cible;
  }, true);

  /* ---------- Envoi (Turnstile invisible, comme src/lib/envoi.js) ---------- */
  let ts = null;
  const turnstile = () => ts || (ts = new Promise((ok, ko) => {
    const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true;
    s.onload = () => ok(window.turnstile); s.onerror = () => { ts = null; ko(new Error('Vérification anti-robot indisponible. Réessayez dans un instant.')); };
    document.head.appendChild(s);
  }));
  async function jeton() {
    const t = await turnstile(), boite = document.createElement('div');
    boite.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647'; document.body.appendChild(boite);
    try {
      return await new Promise((ok, ko) => t.render(boite, { sitekey: TURNSTILE, language: 'fr', appearance: 'interaction-only', callback: ok,
        'error-callback': () => ko(new Error('La vérification anti-robot a échoué. Réessayez.')) }));
    } finally { boite.remove(); }
  }
  async function appeler(fonction, corps) {
    const r = await fetch(FONCTIONS + fonction, { method: 'POST', headers: { ...ENTETES, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...corps, 'cf-turnstile-response': await jeton() }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.ok === false) throw new Error(d.error || ECHEC);
    return d;
  }
  window.llCleo = async q => (await appeler('handle-public-faq', { question: String(q).slice(0, 500) })).answer;

  /* ---------- Lecture d'un formulaire de la maquette (champs sans name : libellés lus à l'écran) ---------- */
  const net = s => (s || '').replace(/\s+/g, ' ').replace(/\s*\*\s*/g, ' ').replace(/\(facultatif\)/i, '').trim();
  const libelle = el => net((el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent) || el.closest('label')?.textContent);
  const groupe = el => net(el.closest('fieldset')?.querySelector('legend')?.textContent || el.closest('.champ')?.querySelector('.etiq,legend')?.textContent || el.closest('.bloc-num')?.querySelector('h3')?.textContent || el.name);
  function lire(f) {
    const r = { lignes: [], fichiers: [] }, vus = new Set();
    for (const el of f.elements) {
      if (el.disabled || typeof el.value !== 'string' || /^(button|submit|reset|hidden)$/.test(el.type) || /^(FIELDSET|OUTPUT|OBJECT)$/.test(el.tagName)) continue;
      const ac = el.autocomplete;
      if (el.type === 'file') { r.fichiers.push(...el.files); continue; }
      if (el.type === 'checkbox' && (!el.name || el.name === 'ok')) { r.consent = r.consent || el.checked; continue; }
      if (el.type === 'radio' || el.type === 'checkbox') {
        if (!el.checked) continue;
        const k = el.name || groupe(el), v = el.value && el.value !== 'on' ? el.value : libelle(el);
        r[el.name] = v; if (!vus.has(k)) { vus.add(k); r.lignes.push([groupe(el), v]); } else r.lignes.find(l => l[0] === groupe(el))[1] += ', ' + v;
        continue;
      }
      const v = el.value.trim(); if (!v) continue;
      if (ac === 'name') r.nom = v; else if (ac === 'given-name') r.prenom = v; else if (ac === 'family-name') r.nomFamille = v;
      else if (el.type === 'email') r.courriel = v; else if (el.type === 'tel') r.tel = v;
      else if (el.tagName === 'TEXTAREA') r.message = v;
      else { if (el.name) r[el.name] = v; r.lignes.push([libelle(el) || el.name, v]); }
    }
    r.nom = r.nom || [r.prenom, r.nomFamille].filter(Boolean).join(' ');
    return r;
  }
  /* Validation minimale (champs « data-req » de la maquette et required) : si elle échoue, la page affiche ses propres erreurs. */
  function complet(f) {
    for (const el of f.querySelectorAll('[data-req],[required]')) {
      if (el.disabled || el.closest('[hidden]')) continue;
      if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) { if (el.querySelector('input') && !el.querySelector('input:checked')) return false; continue; }
      if (el.type === 'radio') { if (!f.querySelector(`input[name="${el.name}"]:checked`)) return false; }
      else if (el.type === 'checkbox') { if (!el.checked) return false; }
      else if (el.type === 'file') { if (!el.files.length) return false; }
      else if (!el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value))) return false;
    }
    return true;
  }
  const corps = (sujet, r) => [sujet && 'Sujet : ' + sujet, r.message, ...r.lignes.map(([k, v]) => k + ' : ' + v),
    r.fichiers.length && `Pièces jointes : ${r.fichiers.length} (non transmises par le site, à demander au besoin)`].filter(Boolean).join('\n');
  const FORMS = {
    '#f-joindre': r => ({ type: 'contact', full_name: r.nom, email: r.courriel, phone: r.tel, consent: !!r.consent, message: corps('Nous joindre', r) }),
    '#f-plainte': r => ({ type: 'contact', full_name: r.nom, email: r.courriel, phone: r.tel, consent: true, message: corps('Commentaire ou plainte', r) }),
    '#f-offre': r => ({ type: 'mandat', full_name: r.nom, email: r.courriel, phone: r.tel, consent: !!r.consent, message: corps('Offre de service', r),
      sector: r.secteur, num_doors: r.logements, current_management: r.actuel === 'Oui' ? 'sous_gestion' : r.actuel ? 'autogere' : undefined }),
    '.clv-form': (r, f) => ({ type: 'contact', full_name: r.nom || f.elements.nom?.value.trim(), email: r.courriel, phone: r.tel, consent: !!f.elements.ok?.checked,
      message: corps('Cléo : demande de suivi', { ...r, message: [...document.querySelectorAll('.clv-moi')].map(p => 'Question : ' + p.textContent).join('\n') }) }),
  };

  function erreur(f, texte) {
    let p = f.querySelector('.ll-envoi-err');
    if (!p) { p = document.createElement('p'); p.className = 'll-envoi-err'; p.setAttribute('role', 'alert'); p.style.cssText = 'margin:12px 0 0;color:#B42318;font-size:14px';
      (f.querySelector('button[type=submit]')?.parentElement || f).appendChild(p); }
    p.textContent = texte; p.hidden = !texte;
  }
  async function envoyer(f, action) {
    const b = f.querySelector('button[type=submit]'), t = b && b.textContent;
    if (b) { b.disabled = true; b.textContent = 'Envoi…'; }
    erreur(f, '');
    try { await action(); return true; } catch (e) { erreur(f, e.message || ECHEC); return false; } finally { if (b) { b.disabled = false; b.textContent = t; } }
  }

  /* Zone de dépôt (« Preuve d'assurance ») : la maquette n'affiche pas le fichier choisi et un fichier glissé ouvrait le PDF dans le navigateur.
     On montre le nom et la taille (« prêt à envoyer »), on accepte le glisser-déposer et on refuse tout autre format ou plus de 10 Mo. */
  const TYPES_DEPOT = /\.(pdf|jpe?g|png)$/i, MAX_DEPOT = 10 * 1024 * 1024;
  function majDepot(l) {
    const i = l.querySelector('input[type=file]'), f = i.files[0], b = l.querySelector('b'), s = l.querySelector('small');
    l.dataset.b = l.dataset.b || b.textContent; l.dataset.s = l.dataset.s || s.textContent;
    let err = '';
    if (f && !TYPES_DEPOT.test(f.name)) err = 'Format refusé : joignez un PDF, un JPG ou un PNG.';
    else if (f && f.size > MAX_DEPOT) err = 'Fichier trop lourd : 10 Mo maximum.';
    if (err) i.value = '';
    const ok = !err && i.files[0];
    b.textContent = ok ? '✓ ' + ok.name : l.dataset.b;
    s.textContent = err || (ok ? (ok.size < 1048576 ? Math.max(1, Math.round(ok.size / 1024)) + ' Ko' : (ok.size / 1048576).toFixed(1).replace('.', ',') + ' Mo') + ' · prêt à envoyer · cliquez pour remplacer' : l.dataset.s);
    s.style.color = err ? '#B42318' : ''; s.setAttribute('role', err ? 'alert' : 'status');
    l.style.borderColor = err ? '#B42318' : ok ? '#12694F' : ''; l.style.background = ok ? '#EEF7F2' : '';
  }
  document.addEventListener('change', e => { const l = e.target.closest?.('label.depot'); if (l && e.target.type === 'file') majDepot(l); });
  ['dragenter', 'dragover'].forEach(t => document.addEventListener(t, e => {
    if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
    e.preventDefault();   // jamais d'ouverture du fichier dans l'onglet
    const l = e.target.closest?.('label.depot'); if (l) { e.dataTransfer.dropEffect = 'copy'; l.style.borderColor = '#2E5788'; }
  }));
  document.addEventListener('dragleave', e => { const l = e.target.closest?.('label.depot'); if (l && !l.contains(e.relatedTarget)) majDepot(l); });
  document.addEventListener('drop', e => {
    if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
    e.preventDefault();
    const l = e.target.closest?.('label.depot'), f = e.dataTransfer.files[0]; if (!l || !f) return;
    const i = l.querySelector('input[type=file]'), dt = new DataTransfer(); dt.items.add(f); i.files = dt.files; majDepot(l);
  });

  /* Inscription d'entreprise : document + téléphone + courriel (inscription-entreprise, multipart). */
  const estInscription = f => location.pathname === '/inscrire-mon-entreprise' && f.querySelector('input[type=file]');
  let idem = null;
  async function inscrire(f) {
    const fichier = f.querySelector('input[type=file]').files[0], tel = f.querySelector('input[type=tel]').value.trim(),
      courriel = f.querySelector('input[type=email]').value.trim(), poste = f.querySelector('#ie-poste')?.value.trim() || '';
    // Dispatch d'abord (2026-11-04) : entreprise, métiers, secteurs, RBQ.
    const entreprise = f.querySelector('#ie-ent')?.value.trim() || '', secteurs = f.querySelector('#ie-sect')?.value.trim() || '',
      rbq = f.querySelector('#ie-rbq')?.value.trim() || '', metiers = [...f.querySelectorAll('#ie-metiers input:checked')].map(c => c.value).join(',');
    if (!fichier || tel.replace(/\D/g, '').length < 10 || !/^\S+@\S+\.\S+$/.test(courriel))
      return erreur(f, 'Joignez votre preuve d’assurance et indiquez un téléphone et un courriel valides.');
    if (f.querySelector('#ie-ent') && (entreprise.length < 2 || !metiers)) return erreur(f, 'Indiquez le nom de l’entreprise et au moins un métier.');
    if (rbq && rbq.replace(/\D/g, '').length !== 10) return erreur(f, 'Le numéro RBQ a la forme 1234-5678-90.');
    idem = idem || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    const ok = await envoyer(f, async () => {
      const fd = new FormData();
      fd.set('courriel', courriel); fd.set('telephone', tel); fd.set('poste', poste); fd.set('document', fichier); fd.set('idempotency_key', idem);
      if (f.querySelector('#ie-ent')) { fd.set('dispatch', '1'); fd.set('entreprise', entreprise); fd.set('metiers', metiers); fd.set('secteurs', secteurs); fd.set('rbq', rbq); }
      fd.set('cf-turnstile-response', await jeton());
      const r = await fetch(FONCTIONS + 'inscription-entreprise', { method: 'POST', headers: ENTETES, body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.ok === false) throw new Error(d.error || ECHEC);
    });
    if (ok) f.innerHTML = '<h2 class="h3" role="status">Inscription reçue. Merci!</h2><p class="aide" style="margin-top:8px">Vous recevrez une confirmation par courriel. L’équipe LeaseLane vérifie votre preuve d’assurance, puis vous ouvre l’accès à la plateforme.</p>';
  }

  /* Avant le script de la page : envoyer d'abord, puis laisser la page afficher son « merci ». */
  document.addEventListener('submit', async e => {
    const f = e.target;
    if (f.dataset.llEnvoye) { delete f.dataset.llEnvoye; return; }
    if (estInscription(f)) { e.preventDefault(); e.stopImmediatePropagation(); return inscrire(f); }
    const cle = Object.keys(FORMS).find(s => f.matches(s));
    if (!cle || !complet(f)) return;
    if (cle === '.clv-form' && !f.elements.ok?.checked) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!(await envoyer(f, () => appeler('handle-public-inquiry', FORMS[cle](lire(f), f))))) return;
    f.dataset.llEnvoye = '1'; f.requestSubmit();
    /* La maquette n'a pas d'écran de confirmation pour tous les formulaires (nous joindre) : si le bouton est encore là, on en met un. */
    setTimeout(() => { if (document.contains(f) && f.querySelector('button[type=submit]')?.offsetParent)
      f.innerHTML = '<h2 class="h3" role="status">Merci, votre message est envoyé.</h2><p class="aide" style="margin-top:8px">Une personne de l’équipe LeaseLane vous répond au prochain jour ouvrable. Urgence : 418 473-3208.</p>'; }, 100);
  }, true);
})();
