/* Lecture d'un fichier de tableur dans le navigateur, sans bibliothèque : CSV (séparateur , ou ;) et Excel .xlsx (une archive ZIP de
   fichiers XML, décompressée par DecompressionStream). Rend les lignes de la première feuille, en texte.
   ponytail: l'ancien format binaire .xls n'est pas lu (le réenregistrer en .xlsx ou .csv); les dates Excel arrivent en numéro de série,
   converties par dateIso() pour les colonnes de dates seulement. */
import { lireCsv } from '@/app/(lanceur)/ventes/leads/import/Import';

async function gonfler(octets: Uint8Array): Promise<Uint8Array> {
  const flux = new Blob([octets as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(flux).arrayBuffer());
}
// Répertoire central du ZIP : nom, méthode (0 = tel quel, 8 = deflate) et position de chaque fichier.
async function dezipper(tampon: ArrayBuffer): Promise<Map<string, string>> {
  const o = new Uint8Array(tampon), v = new DataView(tampon), fichiers = new Map<string, string>(), texte = new TextDecoder();
  let fin = o.length - 22; while (fin >= 0 && v.getUint32(fin, true) !== 0x06054b50) fin--;
  if (fin < 0) throw new Error('Fichier Excel illisible.');
  let p = v.getUint32(fin + 16, true); const n = v.getUint16(fin + 10, true);
  for (let i = 0; i < n; i++) {
    const methode = v.getUint16(p + 10, true), taille = v.getUint32(p + 20, true), lNom = v.getUint16(p + 28, true), lExtra = v.getUint16(p + 30, true), lCom = v.getUint16(p + 32, true), local = v.getUint32(p + 42, true);
    const nom = texte.decode(o.subarray(p + 46, p + 46 + lNom));
    if (/^xl\/(workbook\.xml|sharedStrings\.xml|worksheets\/sheet\d+\.xml)$/.test(nom)) {
      const debut = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true), brut = o.subarray(debut, debut + taille);
      fichiers.set(nom, texte.decode(methode === 8 ? await gonfler(brut) : brut));
    }
    p += 46 + lNom + lExtra + lCom;
  }
  return fichiers;
}
const colonne = (ref: string) => [...ref.replace(/\d/g, '')].reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0) - 1;

export async function lireTableur(f: File): Promise<string[][]> {
  if (/\.xls$/i.test(f.name)) throw new Error('L’ancien format .xls n’est pas lu : dans Excel, « Enregistrer sous » .xlsx ou .csv.');
  if (!/\.xlsx$/i.test(f.name)) return lireCsv((await f.text()).replace(/^﻿/, ''));
  const z = await dezipper(await f.arrayBuffer()), xml = (s: string) => new DOMParser().parseFromString(s, 'application/xml');
  const partages = z.has('xl/sharedStrings.xml') ? [...xml(z.get('xl/sharedStrings.xml')!).getElementsByTagName('si')].map((si) => [...si.getElementsByTagName('t')].map((t) => t.textContent ?? '').join('')) : [];
  const feuille = [...z.keys()].filter((k) => k.startsWith('xl/worksheets/')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
  if (!feuille) throw new Error('Aucune feuille dans ce fichier Excel.');
  const lignes: string[][] = [];
  for (const r of xml(z.get(feuille)!).getElementsByTagName('row')) {
    const ligne: string[] = [];
    for (const c of r.getElementsByTagName('c')) {
      const t = c.getAttribute('t'), val = c.getElementsByTagName('v')[0]?.textContent ?? '';
      ligne[colonne(c.getAttribute('r') ?? 'A1')] = (t === 's' ? partages[Number(val)] ?? '' : t === 'inlineStr' ? [...c.getElementsByTagName('t')].map((x) => x.textContent ?? '').join('') : val).trim();
    }
    const pleine = Array.from(ligne, (x) => x ?? '');
    if (pleine.some((x) => x)) lignes.push(pleine);
  }
  const largeur = Math.max(0, ...lignes.map((l) => l.length));
  return lignes.map((l) => [...l, ...Array(largeur - l.length).fill('')]);
}

/* Une date de fichier → AAAA-MM-JJ : déjà ISO, JJ/MM/AAAA (ou JJ-MM-AAAA), ou numéro de série Excel (jours depuis le 30 déc. 1899). Illisible : rendue telle quelle (la base la refusera avec un message). */
export function dateIso(v: string): string {
  const s = v.trim(); if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  if (/^\d{5}(\.\d+)?$/.test(s)) return new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(s)) * 86400000).toISOString().slice(0, 10);
  return s;
}
export const versCsv = (lignes: (string | number | null)[][]) => '﻿' + lignes.map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
export function telecharger(nom: string, contenu: string) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' })); a.download = nom; a.click(); URL.revokeObjectURL(a.href);
}
