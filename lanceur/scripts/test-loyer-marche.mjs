// Immeubles › Logements (préproduction) : « Loyer vs marché » compare au loyer moyen SCHL de la zone (oct. 2025), jamais au parc du client.
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
try {
  const p = await nav.newPage(); await connecter(p, 'admin');
  await p.goto('http://localhost:3020/immeubles/logements', { waitUntil: 'networkidle2', timeout: 120000 });
  await p.waitForSelector('table tbody tr', { timeout: 60000 });
  const t = await p.evaluate(() => document.body.innerText);
  verifier(t.includes('SCHL, octobre 2025'), 'la référence de marché est nommée : loyer moyen de la zone (SCHL, octobre 2025)');
  verifier(!/médian/i.test(t), 'plus aucune « médiane » (le parc du client)');
  const jauges = await p.$$eval('table tbody tr', (r) => r.filter((x) => /[+−-]\d/.test(x.cells[3]?.innerText ?? '')).length);
  verifier(jauges > 0, `jauges loyer vs marché affichées (${jauges} lignes)`);
  await p.screenshot({ path: '/tmp/loyer-marche.png' });
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
