// Écriture courte des maquettes Penpot dans les tableaux du Lanceur : « 1180, Cartier — 2 », « 2880, ch. Sainte-Foy », « 640, 3e Avenue », « 4½ ».
// La ville se lit dans la colonne Quartier; l'adresse complète reste dans la fiche de l'immeuble.
export const adresse = (a: string | null | undefined) => !a ? '—' : a
  .replace(/,\s*(Québec|Lévis)(?=\s*(—|·|$))/g, '')
  .replace(/^(\d+[A-Za-z]?(?:-\d+)?),\s*(?:rue|avenue)\s+(?=[A-ZÉÈÎ])/, '$1, ')
  .replace(/\bchemin\b/g, 'ch.').replace(/\bboulevard\b/g, 'boul.');

export const piece = (t: string | null | undefined) => t ? t.replace(/(\d) ?1\/2/g, '$1½') : t ?? null;

// Dates à l'heure du Québec, quel que soit le fuseau de l'appareil (même texte au rendu serveur et dans le navigateur).
const FUSEAU = 'America/Toronto';
/** Jour, mois (0–11), année, heure et minute d'un horodatage à Québec, et son jour « AAAA-MM-JJ ». */
export const qc = (x: string | Date) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(x)).map((q) => [q.type, q.value]));
  return { iso: `${p.year}-${p.month}-${p.day}`, an: +p.year, mois: +p.month - 1, jour: +p.day, h: +p.hour, min: +p.minute };
};
/** « 19 oct. » (« 1er » le premier) : date seule « AAAA-MM-JJ » ou horodatage, au jour de Québec. */
export const jourCourt = (iso: string) => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso), j = qc(d).jour;
  return `${j === 1 ? '1er' : j} ${d.toLocaleDateString('fr-CA', { month: 'short', timeZone: FUSEAU })}`;
};
