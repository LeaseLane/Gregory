// Fidéicommis, sommes en attente en navigateur (préproduction) : un dépôt reçu par erreur est mis en attente par « Répartir… »,
// décidé « à rembourser », puis relié à la sortie du relevé; la répartition refuse des parts qui n'égalent pas le dépôt.
// Rien n'est écrit au registre (le registre est immuable) : les lignes d'essai se retirent ensuite (ESSAI QA).
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const BASE = 'http://localhost:3020', F = `${process.env.HOME}/leaselane-qa/paiements/releve-attentes.csv`;
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1100 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const clic = async (p, t, dans = 'body') => { await p.waitForFunction((t, dans) => [...(document.querySelector(dans)?.querySelectorAll('button') ?? [])].some((b) => b.textContent.trim().startsWith(t) && !b.disabled), { timeout: 30000 }, t, dans); return p.evaluate((t, dans) => [...document.querySelector(dans).querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(t) && !b.disabled)?.click(), t, dans); };
try {
  const p = await nav.newPage(); await connecter(p, 'admin');
  p.on('dialog', (d) => d.accept(''));
  await p.goto(`${BASE}/finances/fideicommis?vue=depots`, { waitUntil: 'networkidle2', timeout: 120000 });
  await (await p.waitForSelector('input[type=file]')).uploadFile(F); await p.waitForSelector('select.champ-releve');
  await clic(p, 'Vérifier le relevé'); await p.waitForFunction(() => document.body.innerText.includes('Essai à blanc :'), { timeout: 60000 });
  await clic(p, 'Importer'); await p.waitForFunction(() => !document.querySelector('.import-releve') && document.body.innerText.includes('DEPOT ESSAI QA ERREUR'), { timeout: 60000 }); await att(1500);
  // Répartir… sur le dépôt de 40 $
  const ligne = async (txt) => p.evaluateHandle((txt) => [...document.querySelectorAll('[aria-label="Dépôts du compte"] tbody tr')].find((r) => r.innerText.includes(txt)), txt);
  await (await ligne('DEPOT ESSAI QA ERREUR')).evaluate((r) => [...r.querySelectorAll('button')].find((b) => b.textContent.startsWith('Répartir'))?.click());
  await p.waitForSelector('.repartir select[aria-label="Type de la part 1"]');
  await p.select('.repartir select[aria-label="Type de la part 1"]', 'erreur');
  const champ = await p.$('.repartir input[aria-label="Montant de la part"]'); await champ.click({ clickCount: 3 }); await champ.type('30');
  verifier(await p.evaluate(() => document.querySelector('.repartir').innerText.includes('reste à répartir') && [...document.querySelectorAll('.repartir button')].find((b) => b.textContent.startsWith('Répartir'))?.disabled), 'parts de 30 $ pour un dépôt de 40 $ : « reste à répartir » et bouton bloqué');
  await champ.click({ clickCount: 3 }); await champ.type('40');
  await p.type('.repartir input[aria-label="Note"]', 'mauvais destinataire (essai QA)');
  await clic(p, 'Répartir', '.repartir');
  try { await p.waitForFunction(() => document.body.innerText.includes('Sommes en attente de décision'), { timeout: 30000 }); }
  catch (e) { console.log('ÉTAT', JSON.stringify(await p.evaluate(() => [document.querySelector('.bandeau')?.innerText, document.querySelector('.repartir')?.innerText, document.querySelector('.repartir input[aria-label="Montant de la part"]')?.value]))); throw e; }
  await att(1000);
  verifier(await p.evaluate(() => document.querySelector('[aria-label="Sommes en attente de décision"]').innerText.includes('Reçu par erreur')), 'le dépôt reçu par erreur est en attente de décision');
  await clic(p, 'Rembourser', '[aria-label="Sommes en attente de décision"]'); await p.waitForFunction(() => document.querySelector('[aria-label="Sommes en attente de décision"] select[aria-label="Sortie du relevé"]'), { timeout: 60000 });
  const opt = await p.evaluate(() => [...document.querySelectorAll('[aria-label="Sommes en attente de décision"] select[aria-label="Sortie du relevé"] option')].find((o) => o.textContent.includes('REMBOURSEMENT ESSAI QA'))?.value);
  verifier(!!opt, 'à rembourser : la sortie de 40 $ du relevé est proposée');
  await p.select('[aria-label="Sommes en attente de décision"] select[aria-label="Sortie du relevé"]', opt);
  await clic(p, 'Relier', '[aria-label="Sommes en attente de décision"]'); await att(3000);
  verifier(await p.evaluate(() => !document.querySelector('[aria-label="Sommes en attente de décision"]')?.innerText.includes('ESSAI QA')), 'remboursement relié : la somme quitte la liste des attentes');
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : '\nOK');
} finally { await nav.close(); }
process.exit(echecs ? 1 : 0);
