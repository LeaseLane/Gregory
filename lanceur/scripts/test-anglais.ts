// Vérifie l'anglais de l'interface : npx tsx scripts/test-anglais.ts [dossier ou fichier…]
// 1. Chaque t('…') littéral doit avoir sa traduction dans lib/i18n/en (sinon il s'affiche en français) → échec.
// 2. Texte français resté hors de t() (texte JSX, chaînes avec accents) → liste « à revoir », sans échec (heuristique).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DICO_EN } from '../src/lib/i18n/en/index.ts';

const RACINE = fileURLToPath(new URL('../src/', import.meta.url));
const cibles = process.argv.slice(2).length ? process.argv.slice(2) : [RACINE];
const fichiers: string[] = [];
const parcourir = (p: string) => {
  if (statSync(p).isDirectory()) { for (const f of readdirSync(p)) if (f !== 'i18n') parcourir(join(p, f)); }
  else if (/\.(tsx|ts)$/.test(p)) fichiers.push(p);
};
for (const c of cibles) parcourir(c);

const APPEL = /\bt\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;          // t('…'), t("…"), t(`…`) sans ${}
const ACCENTS = /[àâçéèêëîïôûùüÿœÀÂÇÉÈÊËÎÏÔÛÙÜŸŒ]/;
let manquants = 0, suspects = 0;
for (const f of fichiers) {
  const src = readFileSync(f, 'utf8'), rel = relative(RACINE, f);
  const lignes = src.split('\n');
  const trous: string[] = [];
  for (const m of src.matchAll(APPEL)) {
    const cle = m[2].replace(/\\(['"`\\])/g, '$1');
    if (m[1] === '`' && cle.includes('${')) { trous.push(`gabarit \${} interdit dans t() : ${cle.slice(0, 60)}`); continue; }
    if (!(cle in DICO_EN)) trous.push(cle.slice(0, 90));
  }
  // Heuristique : lignes avec accents hors commentaires, sans t( ni import, ni clé de base (snake_case), ni CSS.
  const aRevoir = lignes.map((l, i) => [i + 1, l] as const).filter(([, l]) => {
    const s = l.trim();
    if (!ACCENTS.test(s) || s.startsWith('//') || s.startsWith('/*') || s.startsWith('*') || s.startsWith('{/*')) return false;
    const sansT = s.replace(/\bt\(\s*(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '');
    return ACCENTS.test(sansT.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, ''));
  });
  if (trous.length) { manquants += trous.length; console.log(`✗ ${rel} : ${trous.length} sans traduction\n    ` + trous.slice(0, 8).join('\n    ')); }
  if (aRevoir.length) { suspects += aRevoir.length; if (process.env.DETAIL) console.log(`? ${rel} : ${aRevoir.length} ligne(s) avec du français hors t()\n    ` + aRevoir.slice(0, 6).map(([n, l]) => `${n}: ${l.trim().slice(0, 100)}`).join('\n    ')); }
}
console.log(`\n${fichiers.length} fichiers · ${Object.keys(DICO_EN).length} traductions · ${manquants} t() sans traduction · ${suspects} lignes de français hors t() (DETAIL=1 pour les voir)`);
process.exitCode = manquants ? 1 : 0;
