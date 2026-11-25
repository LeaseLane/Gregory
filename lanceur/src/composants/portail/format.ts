/* Montants et dates des portails (dates « 1er », D13; espace insécable des milliers). */
export const argent = (n: number, cents = false, locale = 'fr-CA') => locale.startsWith('en')
  ? `$${n.toLocaleString('en-CA', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`
  : `${n.toLocaleString('fr-CA', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).replace(/[  ]/g, ' ')}\u00a0$`;
// Un horodatage devient d'abord le jour du calendrier à Québec, ancré à midi : même texte au serveur (UTC) et dans tout navigateur.
const jourIsoQc = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
const d = (iso: string) => new Date(`${iso.length === 10 ? iso : jourIsoQc(new Date(iso))}T12:00:00`);
/** Aujourd'hui à Québec (midi) : getDate, getMonth et les formats sans fuseau donnent le même jour partout. */
export const aujQc = () => new Date(`${jourIsoQc(new Date())}T12:00:00`);
const jour = (x: Date) => (x.getDate() === 1 ? '1er' : String(x.getDate()));
const en = (l: string) => l.startsWith('en');
export const dateLongue = (iso: string, locale = 'fr-CA') => { const x = d(iso); return en(locale) ? x.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }) : `${jour(x)} ${x.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}`; };
export const dateCourte = (iso: string, annee = false, locale = 'fr-CA') => { const x = d(iso); return en(locale) ? x.toLocaleDateString('en-CA', annee ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric' }) : `${jour(x)} ${x.toLocaleDateString('fr-CA', annee ? { month: 'short', year: 'numeric' } : { month: 'short' })}`; };
export const moisAnnee = (iso: string, locale = 'fr-CA') => { const s = d(iso).toLocaleDateString(locale, { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };
export const taille = (n: number | null | undefined, locale = 'fr-CA') => n == null ? '' : n > 1e6 ? `${(n / 1e6).toFixed(1).replace('.', en(locale) ? '.' : ',')} ${en(locale) ? 'MB' : 'Mo'}` : `${Math.max(1, Math.round(n / 1e3))} ${en(locale) ? 'KB' : 'ko'}`;
// Fenêtre d'avis de renouvellement (daterange texte, borne supérieure exclusive « ) ») → [premier jour, dernier jour] inclus.
export const fenetreAvis = (t: string | null | undefined): [string, string] | null => {
  const m = t?.match(/^[[(]([\d-]+),([\d-]+)([\])])$/); if (!m) return null;
  const fin = new Date(`${m[2]}T12:00:00`); if (m[3] === ')') fin.setDate(fin.getDate() - 1);
  return [m[1], `${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`];
};

/** Libellé d'une écriture du grand livre (texte fabriqué par la base) : décimale française, et anglais pour les formes connues. */
export const libelleEcriture = (l: string, t: (fr: string, v?: Record<string, string | number>) => string, locale = 'fr-CA') => {
  if (!en(locale)) return l.replace(/(\d+)\.(\d*?)0* %/, (_, a, b) => `${a}${b ? `,${b}` : ''} %`);
  let m = l.match(/^Loyers payés chez vous — (.*)$/);
  if (m) return t('Loyers payés chez vous — {immeuble}', { immeuble: m[1] });
  m = l.match(/^Honoraires de gestion ([\d.,]+) %$/);
  if (m) return t('Honoraires de gestion {taux} %', { taux: m[1] });
  m = l.match(/^Honoraires sur travaux ([\d.,]+) % \(facture de ([\d.,]+) \$ avant taxes(, estimée)?\) — (.*)$/);
  if (m) { const montant = argent(Number(m[2].replace(/,/g, '')), true, locale);
    return m[3] ? t('Honoraires sur travaux {taux} % (facture de {montant} avant taxes, estimée) — {ref}', { taux: m[1], montant, ref: m[4] }) : t('Honoraires sur travaux {taux} % (facture de {montant} avant taxes) — {ref}', { taux: m[1], montant, ref: m[4] }); }
  return l;
};
