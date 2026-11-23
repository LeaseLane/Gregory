// Prospection IA (préproduction) : tri des résultats et vue « Écartés » avec « Rétablir » (retours de Greg, 23 nov. 2026). Rien n'est modifié.
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const lignes = (p) => p.$$eval('[aria-label="Résultats"] tbody tr', (r) => r.filter((x) => x.cells.length === 4).map((x) => ({ logements: Number(x.cells[2].innerText.replace(/\D/g, '')), immeubles: Number(x.cells[1].innerText.replace(/\D/g, '')) })));
try {
  const p = await nav.newPage(); await connecter(p, 'admin');
  await p.goto('http://localhost:3020/ventes/prospection', { waitUntil: 'networkidle2', timeout: 120000 });
  await p.waitForFunction(() => document.querySelectorAll('[aria-label="Résultats"] tbody tr').length > 3, { timeout: 90000 });
  const trier = async (t) => { const rep = p.waitForResponse((r) => r.url().includes('lanceur_recherche_role') && (r.request().postData() ?? '').includes(`"tri":"${t}"`), { timeout: 60000 }); await p.select('select[aria-label="Trier les résultats"]', t); await rep; await att(800); };
  await trier('immeubles');
  let L = await lignes(p); const ko = L.findIndex((x, i) => i > 0 && L[i - 1].immeubles < x.immeubles); if (ko > 0) console.log('   rupture à', ko, L.slice(ko - 2, ko + 2));
  verifier(L.length > 3 && ko < 0, `tri par immeubles (${L.slice(0, 3).map((x) => x.immeubles).join(', ')}…)`);
  await trier('logements');
  L = await lignes(p); verifier(L.every((x, i) => i === 0 || L[i - 1].logements >= x.logements), `tri par logements (${L.slice(0, 3).map((x) => x.logements).join(', ')}…)`);
  await p.screenshot({ path: '/tmp/prospection-tri.png' });
  const libelle = await p.evaluate(() => [...document.querySelectorAll('[aria-label="Propriétaires actifs ou écartés"] button')].map((b) => b.textContent).join(' | '));
  verifier(/Écartés \(\d/.test(libelle), `bouton « Écartés » avec le compte (${libelle})`);
  await p.evaluate(() => [...document.querySelectorAll('[aria-label="Propriétaires actifs ou écartés"] button')].find((b) => b.textContent.startsWith('Écartés')).click());
  await p.waitForFunction(() => /Écarté/.test(document.querySelector('[aria-label="Propriétaire choisi"]')?.innerText ?? ''), { timeout: 90000 });
  const panneau = await p.$eval('[aria-label="Propriétaire choisi"]', (a) => a.innerText);
  verifier(panneau.includes('Rétablir dans la recherche') && !panneau.includes('Ajouter au pipeline'), 'vue Écartés : date, auteur et note de l’écart, bouton « Rétablir », pas d’« Ajouter »');
  await p.screenshot({ path: '/tmp/prospection-ecartes.png' });
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
