/* Charge un portail à la place de la page courante sans changer l'adresse
 * (utilisé par /app et 404.html). Le code appelant ne doit déclarer aucune
 * variable globale : document.open() garde le même objet window, et un
 * « const supabaseClient » déjà déclaré ferait planter le portail. */
window.llCharger = function (nom) {
  return fetch('/' + nom + '.html', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (html) { document.open(); document.write(html); document.close(); });
};
