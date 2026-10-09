/* Vérifie chaque adresse du site, telle que servie (sans JavaScript), en français et en anglais :
   code HTTP, <html lang>, H1, JSON-LD, canonique, hreflang. (Texte resté en français : scripts/francais-restant.mjs.)
   Usage : node scripts/verifier-routes.mjs [http://localhost:3010] [--detail] */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv.find(a => a.startsWith('http')) || 'http://localhost:3010';
const DETAIL = process.argv.includes('--detail');
const { ROUTES_EN, versEN } = await import(path.join(ICI, '../src/lib/i18n/adresses.js'));
const routes = JSON.parse(fs.readFileSync(path.join(ICI, 'routes.json'), 'utf8'));

const MOTS_FR = /\b(le|la|les|des|du|une|est|et|vous|votre|vos|nous|pour|avec|dans|sur|par|qui|que|pas|plus|aux|cette|ces|leur|leurs|être|avez|êtes|logement|logements|propriétaire|locataire|demande|loyer|bail)\b/gi;
const texteVisible = html => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
  .split(/<[^>]+>/).map(s => s.replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);

let pb = 0;
for (const lang of ['fr', 'en']) {
  for (const r of routes) {
    const url = lang === 'en' ? versEN(r.path) : r.path;
    let code = 0, html = '';
    try { const rep = await fetch(BASE + url, { redirect: 'manual' }); code = rep.status; html = await rep.text(); } catch (e) { code = 'ERR'; }
    const langue = (html.match(/<html[^>]*lang="([^"]+)"/) || [])[1];
    const h1 = ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const ld = (html.match(/application\/ld\+json/g) || []).length;
    const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || '';
    const hreflang = (html.match(/hrefLang="|hreflang="/g) || []).length;
    const fr = [];
    const ok = code === 200 && langue === (lang === 'en' ? 'en-CA' : 'fr-CA') && h1 && ld >= 1 && canon && hreflang >= 3 && !fr.length;
    if (!ok) pb++;
    console.log((ok ? 'OK ' : '≠  ') + url.padEnd(58) + ' ' + code + ' ' + (langue || '?') + ' ld=' + ld + ' hreflang=' + hreflang + (fr.length ? ' · français restant : ' + fr.length : '') + ' · ' + h1.slice(0, 48));
    if (DETAIL && fr.length) fr.slice(0, 12).forEach(t => console.log('      « ' + t.slice(0, 140) + ' »'));
  }
}
console.log(pb ? pb + ' adresse(s) à revoir' : 'Toutes les adresses sont conformes.');
