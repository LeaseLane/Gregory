/* Lease Lane — notifications et fenêtres de confirmation.
 *
 * Remplace les boîtes natives du navigateur (alert, confirm, prompt), qui
 * affichent le nom de domaine, cassent la charte et proposent même de
 * « bloquer les notifications de ce site ».
 *
 *   alert(msg)                 → notification en coin, se retire seule
 *   await llConfirmer(msg)     → true / false, comme confirm()
 *   await llDemander(msg, déf) → texte, ou null si annulé, comme prompt()
 *
 * Mêmes valeurs de retour que les fonctions natives : les appels existants
 * n'ont changé que par l'ajout de « await ».
 */
(function () {
  var TONS = {
    erreur: /erreur|impossible|échec|echec|refus|invalide|manquant|requis/i,
    succes: /envoy|enregistr|créé|cree|ajout|mis à jour|mise à jour|confirm|approuv|supprim|retir|copié|terminé|réussi|synchronis/i,
  };
  // Les actions irréversibles prennent un bouton rouge.
  var DANGER = /^(supprimer|désactiver|déconnecter|retirer|régénérer)/i;

  function el(tag, cls, texte) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texte != null) e.textContent = texte; // jamais innerHTML : le message peut venir du serveur
    return e;
  }

  function zoneToasts() {
    var z = document.getElementById("ll-toasts");
    if (!z) {
      z = el("div", "ll-toasts");
      z.id = "ll-toasts";
      z.setAttribute("role", "status");
      z.setAttribute("aria-live", "polite");
      document.body.appendChild(z);
    }
    return z;
  }

  window.llToast = function (message, ton) {
    var texte = String(message == null ? "" : message);
    ton = ton || (TONS.erreur.test(texte) ? "erreur" : TONS.succes.test(texte) ? "succes" : "info");
    var t = el("div", "ll-toast ll-toast--" + ton);
    t.appendChild(el("span", "ll-toast__texte", texte));
    var fermer = el("button", "ll-toast__fermer", "×");
    fermer.type = "button";
    fermer.setAttribute("aria-label", "Fermer");
    fermer.onclick = function () { retirer(); };
    t.appendChild(fermer);
    zoneToasts().appendChild(t);
    requestAnimationFrame(function () { t.classList.add("ll-toast--visible"); });
    // Les erreurs restent plus longtemps : on doit avoir le temps de les lire.
    var delai = ton === "erreur" ? 9000 : 4500;
    var minuterie = setTimeout(retirer, Math.max(delai, texte.length * 60));
    function retirer() {
      clearTimeout(minuterie);
      t.classList.remove("ll-toast--visible");
      setTimeout(function () { t.remove(); }, 250);
    }
  };

  function fenetre(message, options) {
    return new Promise(function (resoudre) {
      var precedent = document.activeElement;
      var fond = el("div", "ll-modale-fond");
      var boite = el("div", "ll-modale");
      boite.setAttribute("role", "dialog");
      boite.setAttribute("aria-modal", "true");
      var texte = el("p", "ll-modale__texte", message);
      texte.id = "ll-modale-texte-" + Date.now();
      boite.setAttribute("aria-labelledby", texte.id);
      boite.appendChild(texte);

      var champ = null;
      if (options.saisie) {
        champ = el("textarea", "ll-modale__champ");
        champ.rows = 3;
        champ.value = options.defaut == null ? "" : String(options.defaut);
        boite.appendChild(champ);
      }

      var actions = el("div", "ll-modale__actions");
      var annuler = el("button", "ll-bouton ll-bouton--secondaire", "Annuler");
      var valider = el("button", "ll-bouton " + (options.danger ? "ll-bouton--danger" : "ll-bouton--primaire"),
        options.libelle || (options.saisie ? "Valider" : "Confirmer"));
      annuler.type = valider.type = "button";
      actions.appendChild(annuler);
      actions.appendChild(valider);
      boite.appendChild(actions);
      fond.appendChild(boite);
      document.body.appendChild(fond);
      requestAnimationFrame(function () { fond.classList.add("ll-modale-fond--visible"); });
      (champ || valider).focus();

      function fin(valeur) {
        document.removeEventListener("keydown", clavier, true);
        fond.classList.remove("ll-modale-fond--visible");
        setTimeout(function () { fond.remove(); }, 180);
        if (precedent && precedent.focus) precedent.focus();
        resoudre(valeur);
      }
      function clavier(e) {
        if (e.key === "Escape") { e.preventDefault(); fin(options.saisie ? null : false); }
        // Entrée valide, sauf Maj+Entrée dans un champ multiligne.
        else if (e.key === "Enter" && !(champ && e.shiftKey)) { e.preventDefault(); fin(options.saisie ? champ.value : true); }
        else if (e.key === "Tab") {
          // Garder le focus dans la fenêtre.
          var f = [champ, annuler, valider].filter(Boolean);
          var i = f.indexOf(document.activeElement);
          e.preventDefault();
          f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
        }
      }
      document.addEventListener("keydown", clavier, true);
      annuler.onclick = function () { fin(options.saisie ? null : false); };
      valider.onclick = function () { fin(options.saisie ? champ.value : true); };
      fond.addEventListener("mousedown", function (e) { if (e.target === fond) fin(options.saisie ? null : false); });
    });
  }

  window.llConfirmer = function (message, options) {
    options = options || {};
    var texte = String(message);
    var m = texte.match(DANGER);
    // Un bouton rouge dit ce qu'il fait : « Supprimer » plutôt que « Confirmer ».
    var libelle = options.libelle || (m ? m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() : null);
    return fenetre(texte, { danger: options.danger != null ? options.danger : !!m, libelle: libelle });
  };

  window.llDemander = function (message, defaut) {
    return fenetre(String(message), { saisie: true, defaut: defaut });
  };

  // Les 53 alert() existants deviennent des notifications sans toucher
  // à leurs appels : aucun ne précède une navigation (vérifié le
  // 2026-09-26), le caractère non bloquant ne change donc rien.
  window.alert = function (message) { window.llToast(message); };
})();
