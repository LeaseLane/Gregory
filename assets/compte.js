/* Lease Lane — « Mon compte » dans tous les portails.
 *
 * 1. Onglet « Mon compte » : nom, téléphone (fonctions SQL mon_profil /
 *    maj_mon_profil) et changement de mot de passe.
 * 2. Premier accès avec le mot de passe temporaire envoyé par courriel
 *    (drapeau user_metadata.doit_changer_mdp posé à la création du compte) :
 *    une fenêtre impose de choisir son propre mot de passe.
 *
 * À inclure à la fin du <body>, AVANT assets/url-propre.js (qui doit voir
 * l'onglet pour gérer l'adresse /app/mon-compte).
 */
(function () {
  function client() {
    try { return typeof supabaseClient !== 'undefined' ? supabaseClient : null; } catch (e) { return null; }
  }
  function vueAdmin() {
    try { return sessionStorage.getItem('ll-vue-admin') === '1'; } catch (e) { return false; }
  }
  var ic = function (n) { return '<svg class="ic" aria-hidden="true"><use href="assets/icones.svg#' + n + '"/></svg>'; };
  var toast = function (m, t) { if (window.llToast) llToast(m, t); };

  // ── Onglet ────────────────────────────────────────────────────────────
  var aside = document.querySelector('aside');
  var main = document.querySelector('main');
  if (aside && main && !document.getElementById('compte')) {
    var btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.dataset.tab = 'compte';
    btn.setAttribute('onclick', "showTab('compte')");
    btn.innerHTML = ic('user') + '<span>Mon compte</span>';
    var fin = aside.querySelector('.signout');
    fin ? aside.insertBefore(btn, fin) : aside.appendChild(btn);

    var sec = document.createElement('section');
    sec.id = 'compte';
    sec.className = 'section';
    sec.innerHTML =
      '<h1>Mon compte</h1><p class="subtitle">Tes informations et ton mot de passe.</p>' +
      '<div class="fo-carte" id="cpt-profil">' +
        '<div><label class="ch-label" for="cpt-nom">Nom complet</label><input type="text" id="cpt-nom" maxlength="120" autocomplete="name"></div>' +
        '<div><label class="ch-label" for="cpt-tel">Téléphone</label><input type="tel" id="cpt-tel" maxlength="30" autocomplete="tel"></div>' +
        '<div><label class="ch-label" for="cpt-courriel">Courriel de connexion</label><input type="email" id="cpt-courriel" disabled></div>' +
        '<button class="ll-bouton ll-bouton--primaire" type="button" id="cpt-profil-btn">Enregistrer</button>' +
      '</div>' +
      '<h3 class="sous-titre">Mot de passe</h3>' +
      '<div class="fo-carte">' +
        '<div><label class="ch-label" for="cpt-mdp">Nouveau mot de passe</label><input type="password" id="cpt-mdp" autocomplete="new-password" minlength="8"></div>' +
        '<div><label class="ch-label" for="cpt-mdp2">Confirmer</label><input type="password" id="cpt-mdp2" autocomplete="new-password" minlength="8"></div>' +
        '<button class="ll-bouton ll-bouton--primaire" type="button" id="cpt-mdp-btn">Changer le mot de passe</button>' +
      '</div>';
    main.appendChild(sec);

    // Chargé quand l'onglet devient visible (clic ou adresse /app/mon-compte).
    new MutationObserver(function () { if (sec.classList.contains('active')) chargerProfil(); })
      .observe(sec, { attributes: true, attributeFilter: ['class'] });
    document.getElementById('cpt-profil-btn').onclick = enregistrerProfil;
    document.getElementById('cpt-mdp-btn').onclick = function () {
      changerMotDePasse(document.getElementById('cpt-mdp'), document.getElementById('cpt-mdp2'), false);
    };
  }

  async function chargerProfil() {
    var c = client(); if (!c) return;
    var r = await c.rpc('mon_profil');
    var p = (r.data || [])[0] || {};
    var u = (await c.auth.getUser()).data.user;
    document.getElementById('cpt-nom').value = p.nom || '';
    document.getElementById('cpt-tel').value = p.telephone || '';
    document.getElementById('cpt-courriel').value = p.courriel || (u && u.email) || '';
    // Les comptes admin n'ont pas de fiche nom/téléphone : seul le courriel s'affiche.
    var admin = p.role === 'admin';
    ['cpt-nom', 'cpt-tel'].forEach(function (id) { document.getElementById(id).closest('div').hidden = admin; });
    document.getElementById('cpt-profil-btn').hidden = admin;
  }

  async function enregistrerProfil() {
    var c = client(); if (!c) return;
    var r = await c.rpc('maj_mon_profil', { p_nom: document.getElementById('cpt-nom').value, p_telephone: document.getElementById('cpt-tel').value });
    if (r.error) { toast('Erreur : ' + r.error.message, 'erreur'); return; }
    toast('Informations enregistrées.', 'succes');
  }

  async function changerMotDePasse(champ, confirmation, premierAcces) {
    var c = client(); if (!c) return false;
    var mdp = champ.value, mdp2 = confirmation.value;
    if (mdp.length < 8) { toast('Le mot de passe doit contenir au moins 8 caractères.', 'erreur'); return false; }
    if (mdp !== mdp2) { toast('Les deux mots de passe ne correspondent pas.', 'erreur'); return false; }
    var r = await c.auth.updateUser({ password: mdp, data: { doit_changer_mdp: false } });
    if (r.error) { toast('Erreur : ' + r.error.message, 'erreur'); return false; }
    champ.value = confirmation.value = '';
    toast(premierAcces ? 'Mot de passe choisi. Bienvenue !' : 'Mot de passe changé.', 'succes');
    return true;
  }

  // ── Premier accès : mot de passe temporaire à remplacer ──────────────
  function imposerNouveauMotDePasse() {
    if (vueAdmin() || document.getElementById('dlg-mdp')) return;
    var d = document.createElement('dialog');
    d.id = 'dlg-mdp';
    d.className = 'lo-dialog';
    d.innerHTML =
      '<form method="dialog" style="padding:24px">' +
        '<h2 style="margin:0 0 6px">Choisis ton mot de passe</h2>' +
        '<p class="subtitle" style="margin:0 0 16px">Tu t\'es connecté avec le mot de passe temporaire reçu par courriel. Choisis-en un à toi pour continuer.</p>' +
        '<label class="ch-label" for="dlg-mdp1">Nouveau mot de passe (8 caractères minimum)</label><input type="password" id="dlg-mdp1" autocomplete="new-password" style="width:100%;box-sizing:border-box">' +
        '<label class="ch-label" for="dlg-mdp2" style="margin-top:12px">Confirmer</label><input type="password" id="dlg-mdp2" autocomplete="new-password" style="width:100%;box-sizing:border-box">' +
        '<div style="display:flex;justify-content:flex-end;margin-top:18px"><button class="ll-bouton ll-bouton--primaire" type="button" id="dlg-mdp-btn">Enregistrer mon mot de passe</button></div>' +
      '</form>';
    document.body.appendChild(d);
    d.addEventListener('cancel', function (e) { e.preventDefault(); });   // pas de fermeture par Échap
    document.getElementById('dlg-mdp-btn').onclick = async function () {
      if (await changerMotDePasse(document.getElementById('dlg-mdp1'), document.getElementById('dlg-mdp2'), true)) { d.close(); d.remove(); }
    };
    d.showModal();
  }

  function verifier(session) {
    if (session && session.user && session.user.user_metadata && session.user.user_metadata.doit_changer_mdp) imposerNouveauMotDePasse();
  }
  var c = client();
  if (c) {
    c.auth.getSession().then(function (r) { verifier(r.data.session); });
    c.auth.onAuthStateChange(function (_e, session) { verifier(session); });
  }
})();
