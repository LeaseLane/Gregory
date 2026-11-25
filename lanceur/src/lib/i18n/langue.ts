/* Langue de l'interface (2026-11-25) : français par défaut, anglais au choix (témoin « ll-langue »).
   Le texte français reste dans le code et sert de clé : t('Mes demandes') → « My requests » en anglais.
   Une phrase sans traduction s'affiche en français : rien ne casse, la vérification (scripts/test-anglais.ts) la signale.
   Variables : t('{n} loyers en retard', { n }) — même {n} dans la traduction anglaise.
   Ce fichier ne contient aucun dictionnaire : il est importable partout (serveur et navigateur). */
export type Langue = 'fr' | 'en';
export type Vars = Record<string, string | number | null | undefined>;
export type T = (fr: string, vars?: Vars) => string;
export type Dico = Record<string, string>;

export const TEMOIN_LANGUE = 'll-langue';
export const LOCALES: Record<Langue, string> = { fr: 'fr-CA', en: 'en-CA' };
export const langueValide = (v?: string | null): Langue => (v === 'en' ? 'en' : 'fr');

// Même mot, deux sens : 'Relancer|campagne' s'affiche « Relancer » en français et prend sa propre traduction
// anglaise si elle existe, sinon celle de « Relancer ». Aucun texte de l'interface ne contient « | ».
export function traduire(dico: Dico | null, fr: string, vars?: Vars): string {
  let s = dico?.[fr];
  if (!s) { const i = fr.indexOf('|'); const base = i > 0 ? fr.slice(0, i) : fr; s = dico?.[base] || base; }
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k] ?? '') : m)) : s;
}
export const fabriqueT = (dico: Dico | null): T => (fr, vars) => traduire(dico, fr, vars);
