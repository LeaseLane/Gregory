/* Lease Lane — navigation sur téléphone (tous les portails).
 *
 * Sous 860 px, la barre latérale devient un menu qui glisse depuis la
 * gauche, ouvert par le bouton ☰ d'une barre du haut qui affiche l'onglet
 * courant. Avant, les onglets défilaient à l'horizontale : seuls deux ou
 * trois étaient visibles sur quinze.
 *
 * À inclure à la fin du <body> des portails (avant url-propre.js).
 */
(function () {
  var shell = document.querySelector('.shell');
  var aside = shell && shell.querySelector('aside');
  if (!shell || !aside || document.querySelector('.ll-barre-mobile')) return;

  var barre = document.createElement('div');
  barre.className = 'll-barre-mobile';
  barre.innerHTML =
    '<button type="button" class="ll-menu-btn" aria-label="Ouvrir le menu" aria-expanded="false">' +
      '<svg class="ic" aria-hidden="true"><use href="assets/icones.svg#menu"/></svg></button>' +
    '<span class="ll-barre-titre"></span>' +
    '<img src="assets/logo/leaselane-horizontal-blanc.svg" alt="Lease Lane">';
  shell.insertBefore(barre, shell.firstChild);
  var fond = document.createElement('div');
  fond.className = 'll-nav-fond';
  document.body.appendChild(fond);

  var bouton = barre.querySelector('.ll-menu-btn');
  function ouvrir(o) {
    document.body.classList.toggle('nav-ouverte', o);
    bouton.setAttribute('aria-expanded', o ? 'true' : 'false');
  }
  bouton.onclick = function () { ouvrir(!document.body.classList.contains('nav-ouverte')); };
  fond.onclick = function () { ouvrir(false); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ouvrir(false); });
  // Choisir un onglet referme le menu.
  aside.addEventListener('click', function (e) { if (e.target.closest('.tab-btn')) ouvrir(false); });

  // Le titre de la barre suit l'onglet actif.
  var titre = barre.querySelector('.ll-barre-titre');
  function maj() {
    var a = aside.querySelector('.tab-btn.active');
    titre.textContent = a ? a.textContent.trim() : '';
  }
  new MutationObserver(maj).observe(aside, { subtree: true, attributes: true, attributeFilter: ['class'] });
  maj();
})();
