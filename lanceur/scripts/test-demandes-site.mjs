// Studio › Site web › Demandes en navigateur (préproduction) : l'onglet existe, la liste « Nouvelles » s'affiche, le tiroir montre le message,
// la tuile d'accueil y mène. Aucun statut changé (préproduction partagée). Bureau et mobile.
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const BASE = 'http://localhost:3020';
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
try {
  const p = await nav.newPage(); await connecter(p, 'admin');
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 120000 });
  verifier(await p.evaluate(() => [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/studio/site/demandes')), 'accueil : la tuile « nouvelles demandes du site » mène à la liste');
  await p.goto(`${BASE}/studio/site/demandes`, { waitUntil: 'networkidle2', timeout: 120000 });
  await p.waitForSelector('[aria-label="Demandes du site"] tbody tr', { timeout: 60000 });
  verifier(await p.evaluate(() => document.querySelector('.sous-onglets a.actif')?.textContent === 'Demandes'), 'sous-onglet « Demandes » actif');
  const n = await p.$$eval('[aria-label="Demandes du site"] tbody tr.ligne-lien', (r) => r.length);
  verifier(n > 0, `liste « Nouvelles » : ${n} demande(s)`);
  await p.click('[aria-label="Demandes du site"] tbody tr.ligne-lien');
  await p.waitForSelector('.tiroir [role=dialog], .tiroir', { timeout: 30000 });
  const t = await p.$eval('.tiroir', (x) => x.innerText);
  verifier(t.includes('Message') && /Marquer contactée|Fermer la demande/.test(t), 'tiroir : message et boutons de statut');
  await p.screenshot({ path: '/tmp/demandes-bureau.png' });
  await p.keyboard.press('Escape'); await p.goto(`${BASE}/studio/site/demandes`, { waitUntil: 'networkidle2' });
  await p.setViewport({ width: 390, height: 844 }); await p.reload({ waitUntil: 'networkidle2' }); await p.waitForSelector('[aria-label="Demandes du site"]');
  verifier(await p.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile : pas de défilement horizontal');
  await p.screenshot({ path: '/tmp/demandes-mobile.png', fullPage: true });
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
