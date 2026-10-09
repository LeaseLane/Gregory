/* Version anglaise : liste les textes encore en français dans le HTML servi des pages /en/… (sans JavaScript).
   Un texte est « resté en français » s'il est une clé du dictionnaire (ou un fragment d'une clé) dont la traduction diffère.
   Usage : node scripts/francais-restant.mjs [http://localhost:3010] */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv.find(a => a.startsWith('http')) || 'http://localhost:3010';
const { versEN } = await import(path.join(ICI, '../src/lib/i18n/adresses.js'));
const { LL_EN_TXT: D, LL_EN_ATTR: A } = await import(path.join(ICI, '../src/lib/i18n/dictionnaire.js'));
const routes = JSON.parse(fs.readFileSync(path.join(ICI, 'routes.json'), 'utf8'));
const norm = s => s.replace(/\s+/g, ' ').trim();
const SEP = '␞';
/* Fragments français connus : clés entières et fragments de clés à plusieurs morceaux (traduits différemment). */
const fr = new Map();
for (const [k, v] of Object.entries(D)) {
  const ks = k.split(SEP), vs = String(v).split(SEP);
  ks.forEach((x, i) => { const n = norm(x); if (n.length > 3 && /[a-zà-ÿ]{3}/i.test(n) && n !== norm(vs[i] || '')) fr.set(n, norm(vs[i] || '')); });
}
const ent = s => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const total = new Map();
for (const r of routes) {
  const url = versEN(r.path);
  const html = await (await fetch(BASE + url)).text();
  const corps = html.split('<body')[1] || html;
  const textes = corps.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').split(/<[^>]+>/).map(t => norm(ent(t))).filter(Boolean);
  const attrs = [...corps.matchAll(/(?:aria-label|alt|title|placeholder)="([^"]+)"/g)].map(m => norm(ent(m[1])));
  const restes = [...new Set([...textes, ...attrs].filter(t => fr.has(t) || (A[t] != null && A[t] !== t)))];
  restes.forEach(t => total.set(t, (total.get(t) || []).concat(url)));
  console.log((restes.length ? '≠  ' : 'OK ') + url.padEnd(58) + (restes.length ? restes.length + ' texte(s) en français' : ''));
}
if (total.size) {
  console.log('\nTextes restés en français (' + total.size + ') :');
  [...total].sort((a, b) => b[1].length - a[1].length).forEach(([t, u]) => console.log('  « ' + t.slice(0, 110) + ' » — ' + u.length + ' page(s) · ' + u.slice(0, 2).join(', ')));
}
