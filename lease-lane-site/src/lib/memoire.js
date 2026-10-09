/* Mémoire de session en cours de visite (remplace sessionStorage du prototype).
   SB1 : aucune clé de stockage navigateur hors politique des témoins. Les valeurs vivent le temps de la visite
   (navigation client) et disparaissent au rechargement. Côté serveur, rien n'y est écrit (seuls les gestionnaires
   et effets du navigateur appellent setItem). */
const m = new Map();
export const sessionStorage = {
  getItem: k => (m.has(k) ? m.get(k) : null),
  setItem: (k, v) => { m.set(k, String(v)); },
  removeItem: k => { m.delete(k); },
};
