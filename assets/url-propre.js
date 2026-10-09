/* Lease Lane — adresses propres dans les portails.
 *
 * La barre d'adresse montre / et /<onglet> (ex. /vue-ensemble), jamais le
 * nom du fichier. GitHub Pages ne sait pas réécrire les URL : / sert
 * index.html, et toute adresse /<onglet> tombe sur 404.html, qui recharge
 * le dernier portail ouvert (llCharger) sans changer l'URL. Les anciennes
 * adresses /app et /app/<onglet> (avant le 2026-10-09) marchent encore.
 *
 * À inclure à la fin du <body> de chaque portail, après showTab().
 */
(function () {
  var m = location.pathname.match(/portail-[a-z-]+/);
  // Vue admin (« Voir son portail ») : repérée par assets/ui.js ; ce portail
  // n'est alors retenu que pour cet onglet, jamais pour /app ailleurs.
  var vueAdmin = false;
  try { vueAdmin = sessionStorage.getItem('ll-vue-admin') === '1'; } catch (e) {}
  if (m && !vueAdmin) { try { localStorage.setItem('ll-portail', m[0]); } catch (e) {} }
  if (vueAdmin) bandeauVueAdmin();

  // « Vue d'ensemble » → « vue-ensemble », « Loyers et paiements » → « loyers-et-paiements »
  function slug(t) {
    return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/\b[dl]['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function boutons() { return Array.prototype.slice.call(document.querySelectorAll('.tab-btn[data-tab]')); }
  function slugDe(id) {
    var b = document.querySelector('.tab-btn[data-tab="' + id + '"]');
    return b ? slug(b.textContent) : id;
  }
  function idDe(s) {
    var b = boutons().filter(function (b) { return slug(b.textContent) === s; })[0];
    return b && b.dataset.tab;
  }

  var afficher = window.showTab;
  if (typeof afficher === 'function') {
    window.showTab = function (id) {
      afficher.apply(this, arguments);
      var u = '/' + slugDe(id);
      if (location.pathname !== u) history.pushState(null, '', u);
    };
  }
  function depuisUrl() {
    var id = idDe(location.pathname.replace(/^\/(app\/?)?/, '').replace(/\/$/, ''));
    if (id && afficher) afficher(id);
    return !!id;
  }
  window.addEventListener('popstate', function () {
    if (!depuisUrl() && afficher && boutons()[0]) afficher(boutons()[0].dataset.tab);
  });

  if (!depuisUrl() && location.pathname !== '/') history.replaceState(null, '', '/' + location.search + location.hash);
})();

// Déconnexion : on oublie le portail, / redevient l'écran de connexion.
// En vue admin, on revient simplement au compte admin.
function llQuitterPortail() {
  var vue = false;
  try { vue = sessionStorage.getItem('ll-vue-admin') === '1'; sessionStorage.removeItem('ll-portail'); sessionStorage.removeItem('ll-vue-admin'); } catch (e) {}
  if (!vue) { try { localStorage.removeItem('ll-portail'); } catch (e) {} }
  location.replace('/');
}

// Bandeau « vue admin » : rappelle qu'on regarde le portail d'un client et
// ramène au compte admin (ferme la session du client dans cet onglet).
function bandeauVueAdmin() {
  var role = { 'portail-locataire': 'locataire', 'portail-proprietaire': 'propriétaire', 'portail-travailleur': 'travailleur', 'portail-cold-caller': 'prospecteur' }[sessionStorage.getItem('ll-portail')] || 'client';
  var b = document.createElement('div');
  b.className = 'll-vue-admin';
  b.innerHTML = '<span>Tu consultes le portail <b>' + role + '</b> de <b id="ll-vue-nom">ce client</b>, tel qu\'il le voit. Les actions faites ici sont faites en son nom.</span>' +
    '<button type="button">Revenir à mon compte admin</button>';
  b.querySelector('button').onclick = async function () {
    try { if (typeof supabaseClient !== 'undefined' && supabaseClient) await supabaseClient.auth.signOut(); } catch (e) {}
    try { sessionStorage.removeItem('ll-portail'); sessionStorage.removeItem('ll-vue-admin'); } catch (e) {}
    location.replace('/');
  };
  document.body.prepend(b);
  document.body.classList.add('avec-vue-admin');
  // Hauteur réelle du bandeau (il peut passer sur deux lignes) : les
  // panneaux fixes (fiche latérale, fond) commencent juste en dessous.
  var ajuster = function () { document.documentElement.style.setProperty('--vue-admin-h', b.offsetHeight + 'px'); };
  ajuster(); window.addEventListener('resize', ajuster);
  // Le nom du client apparaît dans l'accueil du portail une fois chargé.
  var essais = 0, t = setInterval(function () {
    var g = document.querySelector('[id$="-greeting"]');
    var nom = g && g.textContent.replace(/^Bonjour,?\s*/, '').trim();
    if (nom && nom !== 'Bonjour') { document.getElementById('ll-vue-nom').textContent = nom; clearInterval(t); }
    if (++essais > 40) clearInterval(t);
  }, 250);
}
