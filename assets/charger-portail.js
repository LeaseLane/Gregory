/* Charge un portail à la place de la page courante sans changer l'adresse
 * (utilisé par /app et 404.html). Le code appelant ne doit déclarer aucune
 * variable globale : document.open() garde le même objet window, et un
 * « const supabaseClient » déjà déclaré ferait planter le portail. */
window.llCharger = function (nom) {
  return fetch('/' + nom + '.html', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (html) { document.open(); document.write(html); document.close(); });
};

/* Compte connecté dans le mauvais portail (ex. un locataire sur l'écran
 * admin, parce que /app a rouvert le dernier portail utilisé sur ce
 * navigateur) : on transfère la session au bon portail au lieu de lui
 * afficher une erreur — ou, côté admin, l'inscription au double facteur.
 * Rend true si une redirection est lancée. */
(function () {
  var CLE = {
    'portail-proprietaire': 'sb-portail-owner-auth',
    'portail-locataire': 'sb-portail-tenant-auth',
    'portail-travailleur': 'sb-portail-worker-auth',
    'portail-admin': 'sb-portail-admin-auth',
  };
  var PAR_ROLE = { owner: 'portail-proprietaire', tenant: 'portail-locataire', worker: 'portail-travailleur' };
  window.llBonPortail = async function (client, ici) {
    try {
      // Un admin qui serait aussi propriétaire reste sur son portail admin.
      if (ici === 'portail-admin') {
        var u = (await client.auth.getUser()).data.user;
        var a = u && (await client.from('users').select('is_admin').eq('id', u.id).maybeSingle()).data;
        if (a && a.is_admin) return false;
      }
      var r = await client.functions.invoke('whoami');
      var cible = PAR_ROLE[r.data && r.data.role];
      if (!cible || cible === ici) return false;
      localStorage.setItem(CLE[cible], localStorage.getItem(CLE[ici]));
      localStorage.removeItem(CLE[ici]);
      localStorage.setItem('ll-portail', cible);
      location.replace('/app');
      return true;
    } catch (e) { return false; }
  };
})();
