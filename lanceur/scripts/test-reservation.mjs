// Réservation entre prospecteurs (Grégory, 2026-11-16), dans le navigateur (préproduction) : le prospecteur réserve un propriétaire de la liste,
// le voit « Réservé par vous »; l'admin le voit « Réservé par <nom> » et le libère. Usage : node scripts/test-reservation.mjs [captures]
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const BASE = 'http://localhost:3020', CAP = process.argv[2];
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
// La recherche par défaut (Québec et Lévis entières) dépasse le délai de la base en préproduction (19 894 immeubles, 1,3 s en production) :
// le test passe par une recherche enregistrée plus étroite.
const ETROITE = JSON.stringify([{ nom: 'essai réservation', filtres: { villes: ['Lévis'], min: 60, max: 67 } }]);
async function ouvrirRecherche(page) {
  await page.evaluateOnNewDocument((v) => { try { localStorage.setItem('ll-recherches-prospection', v); } catch {} }, ETROITE);
  await page.goto(`${BASE}/ventes/prospection`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('select[aria-label="Recherches enregistrées"] option[value="0"]', { timeout: 60000 });
  await page.select('select[aria-label="Recherches enregistrées"]', '0');
  await page.waitForFunction(() => document.querySelectorAll('table.tableau tbody tr').length > 1 && document.body.innerText.includes('60 à 67 logements'), { timeout: 90000 });
  await attendre(800);
}
const panneau = (p) => p.evaluate(() => document.querySelector('aside[aria-label="Propriétaire choisi"], aside[aria-label="Immeuble choisi"]')?.innerText ?? '');
try {
  const ctxP = await nav.createBrowserContext(), p = await ctxP.newPage(); await p.setViewport({ width: 1440, height: 1000 });
  await connecter(p, 'prospection');
  await ouvrirRecherche(p);
  // un propriétaire connu et libre
  const nom = await p.evaluate(() => { const tr = [...document.querySelectorAll('table.tableau tbody tr')].find((t) => !t.textContent.includes('Réservé') && !t.textContent.includes('À confirmer') && !/\d+ RU|\d+ BO|\d+ AV|\d+ CH/.test(t.querySelector('strong')?.textContent ?? '')); tr.click(); return tr.querySelector('strong').textContent; });
  await attendre(600);
  verifier(/Libre : vos collègues le voient aussi/.test(await panneau(p)), `prospecteur : « ${nom} » est libre`);
  await p.evaluate(() => [...document.querySelectorAll('aside button')].find((b) => b.textContent === 'Réserver').click());
  await p.waitForFunction(() => /Réservé par vous/.test(document.querySelector('aside')?.innerText ?? ''), { timeout: 60000 }); await attendre(600);
  const ligne = await p.evaluate((n) => [...document.querySelectorAll('table.tableau tbody tr')].find((t) => t.querySelector('strong')?.textContent === n)?.textContent ?? '', nom);
  if (CAP) await p.screenshot({ path: `${CAP}/reserve-prospecteur.png` });
  verifier(/Réservé par vous/.test(ligne), 'prospecteur : réservé, la ligne et le panneau disent « Réservé par vous »');
  const ctxA = await nav.createBrowserContext(), a = await ctxA.newPage(); await a.setViewport({ width: 1440, height: 1000 });
  await connecter(a, 'admin');
  await ouvrirRecherche(a);
  const vue = await a.evaluate((n) => { const tr = [...document.querySelectorAll('table.tableau tbody tr')].find((t) => t.querySelector('strong')?.textContent === n); tr?.click(); return tr?.textContent ?? null; }, nom);
  await attendre(600);
  if (CAP) await a.screenshot({ path: `${CAP}/reserve-admin.png` });
  verifier(!!vue && /Réservé par (?!vous)/.test(vue), `admin : voit « ${nom} » avec ${vue?.match(/Réservé par [^\d]*?(?=$|\d)/)?.[0] ?? 'aucune mention'}`);
  await a.evaluate(() => [...document.querySelectorAll('aside button')].find((b) => b.textContent === 'Libérer').click());
  await a.waitForFunction(() => /Libre : vos collègues/.test(document.querySelector('aside')?.innerText ?? ''), { timeout: 60000 });
  verifier(true, 'admin : libère, le propriétaire redevient libre');
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : '\nOK');
} finally { await nav.close(); }
process.exit(echecs ? 1 : 0);
