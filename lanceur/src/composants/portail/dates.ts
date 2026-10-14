/* Heures des portails à l'heure du Québec, quel que soit le fuseau de l'appareil. */
const FUSEAU = 'America/Toronto';
export const heureQc = (iso: string) => new Intl.DateTimeFormat('fr-CA', { hour: 'numeric', minute: '2-digit', timeZone: FUSEAU }).format(new Date(iso)).replace(/\s?h\s?/, ' h ');
export const jourQc = (iso: string, mois: 'short' | 'long' = 'short') => {
  const p = new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: mois, timeZone: FUSEAU }).formatToParts(new Date(iso));
  const j = p.find((x) => x.type === 'day')?.value ?? '', m = p.find((x) => x.type === 'month')?.value ?? '';
  return `${j === '1' ? '1er' : j} ${m}`;
};
export const memeJourQc = (a: string | Date, b: string | Date) => { const f = (x: string | Date) => new Date(x).toLocaleDateString('fr-CA', { timeZone: FUSEAU }); return f(a) === f(b); };
