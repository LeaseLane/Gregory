// « Prêt pour le 1er » en navigateur (préproduction) : la liste verte/rouge s'affiche dans l'admin, la saisie d'un compte invalide est refusée
// (aucun compte n'est enregistré : un enregistrement enverrait EQP-15 aux vrais administrateurs), et le portail locataire n'offre plus le prélèvement.
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
import { connecterPortail } from './connexion-portail.mjs';
const BASE = 'http://localhost:3020';
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1100 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const clic = async (p, t, dans = 'body') => { await p.waitForFunction((t, dans) => [...(document.querySelector(dans)?.querySelectorAll('button') ?? [])].some((b) => b.textContent.trim().startsWith(t) && !b.disabled), { timeout: 30000 }, t, dans); return p.evaluate((t, dans) => [...document.querySelector(dans).querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(t) && !b.disabled)?.click(), t, dans); };
try {
  const p = await nav.newPage(); await connecter(p, 'admin');
  await p.goto(`${BASE}/finances/fideicommis?vue=preparation`, { waitUntil: 'networkidle2', timeout: 120000 });
  await p.waitForSelector('[aria-label="Prêt pour le 1er"] li', { timeout: 60000 });
  const lignes = await p.$$eval('[aria-label="Prêt pour le 1er"] li', (l) => l.map((x) => x.innerText));
  verifier(lignes.length === 10, `10 points dans la liste (${lignes.length})`);
  verifier(lignes.some((l) => l.includes('Prélèvements automatiques') && l.includes('Info')), 'prélèvements : signalés comme reportés');
  verifier(!(await p.$eval('[aria-label="Comptes de LeaseLane"]', (s) => s.innerText)).match(/\d{6,}/), 'aucun numéro de compte complet à l’écran');
  await p.screenshot({ path: '/tmp/preparation-bureau.png', fullPage: true });
  await p.evaluate(() => [...document.querySelectorAll('[aria-label="Comptes de LeaseLane"] li')][1].querySelector('button').click());
  await p.waitForSelector('#cpt-compte');
  await p.type('#cpt-institution', '1'); await p.type('#cpt-transit', '12345'); await p.type('#cpt-compte', '7654321');
  await clic(p, 'Enregistrer', '[aria-label="Comptes de LeaseLane"]');
  await p.waitForSelector('.bandeau.erreur', { timeout: 30000 });
  verifier((await p.$eval('.bandeau.erreur', (b) => b.innerText)).includes('institution 3 chiffres'), 'institution d’un chiffre : refusée avec un message clair');
  await p.setViewport({ width: 390, height: 844 }); await p.reload({ waitUntil: 'networkidle2' }); await p.waitForSelector('[aria-label="Prêt pour le 1er"] li');
  verifier(await p.evaluate(() => document.documentElement.scrollWidth <= 390), 'mobile : pas de défilement horizontal');
  await p.screenshot({ path: '/tmp/preparation-mobile.png', fullPage: true });

  const l = await (await nav.createBrowserContext()).newPage(); await connecterPortail(l, 'samuel');   // preprod-locataire n'a plus de bail
  await l.goto(`${BASE}/locataire/paiements`, { waitUntil: 'networkidle2', timeout: 120000 });
  await l.screenshot({ path: '/tmp/preparation-locataire-avant.png', fullPage: true }); console.log('URL', l.url());
  await clic(l, 'Modifier', '[aria-label="Mode de paiement"]');   // « Changer de mode » est caché quand un loyer est en retard
  await l.waitForSelector('.lo-mode-choix');
  const modes = await l.$$eval('.lo-mode-choix', (b) => b.map((x) => x.innerText));
  verifier(!modes.some((m) => m.includes('Prélèvement automatique')) && modes.some((m) => m.includes('Virement Interac')), `locataire : Interac offert, prélèvement masqué (${modes.length} modes)`);
  await l.screenshot({ path: '/tmp/preparation-locataire.png' });
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
