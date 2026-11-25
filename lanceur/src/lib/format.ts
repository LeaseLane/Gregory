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
export const jourCourt = (iso: string, locale = 'fr-CA') => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso), j = qc(d).jour;
  if (locale.startsWith('en')) return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: FUSEAU });   // « Oct 19 »
  return `${j === 1 ? '1er' : j} ${d.toLocaleDateString('fr-CA', { month: 'short', timeZone: FUSEAU })}`;
};

/** Montant dans la langue de l'interface : « 1 195 $ » (fr-CA) ou « $1,195 » (en-CA); cents = 2 décimales. */
export const argentL = (n: number | string | null | undefined, locale = 'fr-CA', cents = false) => n == null || n === '' ? '—'
  : new Intl.NumberFormat(locale, { style: 'currency', currency: 'CAD', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })
    .format(Number(n)).replace(/\u202f/g, ' ');

/** Montant tapé au clavier → texte décimal pour la base : « 689,85 » → « 689.85 », « 1 250,50 $ » → « 1250.50 ».
    La virgule est la décimale au Québec : avant le 2026-11-24, ces champs l'effaçaient et 689,85 devenait 68 985. */
export const montantSaisi = (v: string) => {
  const s = v.replace(/,/g, '.').replace(/[^\d.]/g, ''), i = s.indexOf('.');
  return i < 0 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');
};
