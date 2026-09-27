/* Lease Lane — adresses propres dans les portails.
 *
 * La barre d'adresse montre /app et /app/<onglet> (ex. /app/vue-ensemble),
 * jamais le nom du fichier. GitHub Pages ne sait pas réécrire les URL :
 * /app sert app.html, et toute adresse /app/<onglet> tombe sur 404.html,
 * qui recharge le dernier portail ouvert (llCharger) sans changer l'URL.
 *
 * À inclure à la fin du <body> de chaque portail, après showTab().
 */
(function () {
  var m = location.pathname.match(/portail-[a-z-]+/);
  // Lien magique « Voir son portail » ouvert par un admin : on ne retient
  // pas ce portail, sinon /app ouvrirait ensuite celui du client.
  if (m && !/access_token|type=magiclink/.test(location.hash)) { try { localStorage.setItem('ll-portail', m[0]); } catch (e) {} }

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
      var u = '/app/' + slugDe(id);
      if (location.pathname !== u) history.pushState(null, '', u);
    };
  }
  function depuisUrl() {
    var id = idDe(location.pathname.replace(/^\/app\/?/, ''));
    if (id && afficher) afficher(id);
    return !!id;
  }
  window.addEventListener('popstate', function () {
    if (!depuisUrl() && afficher && boutons()[0]) afficher(boutons()[0].dataset.tab);
  });

  if (/^\/app(\/|$)/.test(location.pathname)) depuisUrl();
  else history.replaceState(null, '', '/app' + location.search + location.hash);
})();

// Déconnexion : on oublie le portail, /app redevient l'écran de connexion.
function llQuitterPortail() {
  try { localStorage.removeItem('ll-portail'); } catch (e) {}
  location.replace('/app');
}
