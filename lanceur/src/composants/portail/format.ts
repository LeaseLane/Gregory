/* Montants et dates des portails (dates « 1er », D13; espace insécable des milliers). */
export const argent = (n: number, cents = false) => `${n.toLocaleString('fr-CA', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).replace(/[  ]/g, ' ')} $`;
const d = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
const jour = (x: Date) => (x.getDate() === 1 ? '1er' : String(x.getDate()));
export const dateLongue = (iso: string) => { const x = d(iso); return `${jour(x)} ${x.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}`; };
export const dateCourte = (iso: string, annee = false) => { const x = d(iso); return `${jour(x)} ${x.toLocaleDateString('fr-CA', annee ? { month: 'short', year: 'numeric' } : { month: 'short' })}`; };
export const moisAnnee = (iso: string) => { const s = d(iso).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };
export const taille = (n: number | null | undefined) => n == null ? '' : n > 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} Mo` : `${Math.max(1, Math.round(n / 1e3))} ko`;
// Fenêtre d'avis de renouvellement (daterange texte, borne supérieure exclusive « ) ») → [premier jour, dernier jour] inclus.
export const fenetreAvis = (t: string | null | undefined): [string, string] | null => {
  const m = t?.match(/^[[(]([\d-]+),([\d-]+)([\])])$/); if (!m) return null;
  const fin = new Date(`${m[2]}T12:00:00`); if (m[3] === ')') fin.setDate(fin.getDate() - 1);
  return [m[1], `${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`];
};
