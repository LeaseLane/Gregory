// Studio › Site web › Demandes en navigateur (préproduction) : tuile d'accueil, sous-onglet avec compte, comptes réels (sans limite),
// tiroir au clavier (focus, Échap, retour), « Marquer contactée » puis « Annuler » (la demande revient « Nouvelle »), mobile.
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const BASE = 'http://localhost:3020';
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const tuile = (p, l) => p.evaluate((l) => Number([...document.querySelectorAll('.tuiles-filtres button')].find((b) => b.innerText.startsWith(l))?.querySelector('b')?.textContent), l);
try {
  const p = await nav.newPage(); await connecter(p, 'admin');
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 120000 });
  verifier(await p.evaluate(() => [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/studio/site/demandes')), 'accueil : la tuile mène à la liste');
  await p.goto(`${BASE}/studio/site/demandes`, { waitUntil: 'networkidle2', timeout: 120000 });
  await p.waitForSelector('[aria-label="Demandes du site"] tbody tr', { timeout: 60000 });
  const nouvelles = await tuile(p, 'Nouvelles'), toutes = await tuile(p, 'Toutes');
  verifier(await p.evaluate((n) => (document.querySelector('.sous-onglets a.actif')?.textContent ?? '').replace(/\s+/g, '') === `Demandes${n}`, nouvelles), `sous-onglet « Demandes » avec son compte (${nouvelles})`);
  verifier(toutes > 300, `« Toutes » compte sans limite (${toutes})`);
  verifier(!(await p.$eval('body', (b) => b.innerText)).includes('Fermer la demande'), 'plus de « Fermer la demande » (collision avec le X)');
  // clavier
  await p.focus('[aria-label="Demandes du site"] tbody tr td button'); await p.keyboard.press('Enter');
  await p.waitForSelector('.tiroir');
  verifier(await p.evaluate(() => !!document.activeElement?.closest('.tiroir')), 'tiroir : le focus y entre');
  await p.keyboard.press('Escape'); await att(300);
  verifier(await p.evaluate(() => !document.querySelector('.tiroir') && !!document.activeElement?.closest('tbody')), 'Échap ferme et le focus revient à la ligne');
  await p.screenshot({ path: '/tmp/demandes-liste.png' });
  // statut puis annulation
  await p.click('[aria-label="Demandes du site"] tbody tr td button'); await p.waitForSelector('.tiroir-pied');
  await p.screenshot({ path: '/tmp/demandes-bureau.png' });
  await p.evaluate(() => [...document.querySelectorAll('.tiroir-pied button')].find((b) => b.textContent.startsWith('Marquer contactée')).click());
  await p.waitForFunction(() => /marquée contactée/.test(document.querySelector('[role=status]')?.innerText ?? ''), { timeout: 30000 }); await att(1500);
  verifier(await tuile(p, 'Nouvelles') === nouvelles - 1, 'marquée contactée : bandeau, une nouvelle de moins');
  await p.evaluate(() => [...document.querySelectorAll('[role=status] button')].find((b) => b.textContent === 'Annuler').click());
  await p.waitForFunction((n) => Number([...document.querySelectorAll('.tuiles-filtres button')].find((b) => b.innerText.startsWith('Nouvelles'))?.querySelector('b')?.textContent) === n, { timeout: 30000 }, nouvelles);
  verifier(true, 'Annuler : la demande redevient « Nouvelle »');
  await p.setViewport({ width: 390, height: 844 }); await p.reload({ waitUntil: 'networkidle2' }); await p.waitForSelector('[aria-label="Demandes du site"]');
  verifier(await p.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile : pas de défilement horizontal');
  await p.screenshot({ path: '/tmp/demandes-mobile.png' });
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
