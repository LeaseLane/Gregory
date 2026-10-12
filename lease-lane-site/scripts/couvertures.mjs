/* Couvertures du blogue : scène (assets/img/blogue/source/<slug>.png du prototype) mise en page par scripts/couvertures/gabarit.mjs,
   rendue par Chrome sans interface, puis compressée par sharp. Textes : scripts/couvertures/donnees.json.
   Sorties, dans le prototype et dans public/ :
   <slug>.webp (titre FR, listes)   <slug>-en.webp (titre EN)   <slug>-nu.webp (logo et slogan, page de l'article)
   <slug>-scene.webp (scène seule, cartes du blogue qui recadrent l'image)
   <slug>-og.jpg et <slug>-en-og.jpg (partage, 1200 × 630).
   Usage : node scripts/couvertures.mjs [slug] */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { pathToFileURL } from 'node:url';
import { page } from './couvertures/gabarit.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROTO = path.resolve('../lease-lane-design-system/project/assets/img/blogue');
const POLICES = pathToFileURL(path.resolve('../lease-lane-design-system/project/assets/fonts')).href;
const PUB = path.resolve('public/assets/img/blogue');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'couv-'));
const A = JSON.parse(fs.readFileSync('scripts/couvertures/donnees.json', 'utf8'));
const capture = (html, W, H) => {
  const f = path.join(TMP, 'p.html'), png = path.join(TMP, 'p.png');
  fs.writeFileSync(f, html);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${W},${H}`, `--screenshot=${png}`, pathToFileURL(f).href], { stdio: 'ignore' });
  return fs.readFileSync(png);
};
for (const a of A) {
  if (process.argv[2] && a.slug !== process.argv[2]) continue;
  const scene = pathToFileURL(path.join(PROTO, 'source', a.slug + '.png')).href;
  const out = {};
  for (const [suf, lg, nu, vide] of [['', 'fr'], ['-en', 'en'], ['-nu', 'fr', true], ['-scene', 'fr', true, true]]) {
    const d = { ...a[lg], scene, nu, vide };
    out[a.slug + suf + '.webp'] = await sharp(capture(page(d, 1376, 768, 1, POLICES), 1376, 768)).webp({ quality: 82 }).toBuffer();
    if (!nu) out[a.slug + suf + '-og.jpg'] = await sharp(capture(page(d, 1200, 630, .87, POLICES), 1200, 630)).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  }
  for (const [f, b] of Object.entries(out)) for (const d of [PROTO, PUB]) fs.writeFileSync(path.join(d, f), b);
  console.log(a.slug.padEnd(36), Object.keys(out).length + ' fichiers');
}
