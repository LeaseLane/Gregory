// Dépôt retourné en navigateur (préproduction) : un chèque LL-10706 importé se rapproche seul, puis la banque le reprend le lendemain;
// « Retourné… » relie la sortie au dépôt, le loyer redevient dû. Lignes « ESSAI QA » : à retirer ensuite (scripts/nettoyer-retour-qa.sql).
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const BASE = 'http://localhost:3020', F = `${process.env.HOME}/leaselane-qa/paiements/releve-retour.csv`;
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1100 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const clic = async (p, t, dans = 'body') => { await p.waitForFunction((t, dans) => [...(document.querySelector(dans)?.querySelectorAll('button') ?? [])].some((b) => b.textContent.trim().startsWith(t) && !b.disabled), { timeout: 30000 }, t, dans); return p.evaluate((t, dans) => [...document.querySelector(dans).querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(t) && !b.disabled)?.click(), t, dans); };
const ligne = (p, txt) => p.evaluateHandle((txt) => [...document.querySelectorAll('[aria-label="Dépôts du compte"] tbody tr')].find((r) => r.innerText.includes(txt)), txt);
try {
  const p = await nav.newPage(); await connecter(p, 'admin');
  p.on('dialog', (d) => d.accept());
  await p.goto(`${BASE}/finances/fideicommis?vue=depots`, { waitUntil: 'networkidle2', timeout: 120000 });
  await (await p.waitForSelector('input[type=file]')).uploadFile(F); await p.waitForSelector('select.champ-releve');
  await clic(p, 'Vérifier le relevé'); await p.waitForFunction(() => document.body.innerText.includes('Essai à blanc :'), { timeout: 60000 });
  await clic(p, 'Importer'); await p.waitForFunction(() => !document.querySelector('.import-releve'), { timeout: 60000 }); await att(1500);
  await p.evaluate(() => { const c = [...document.querySelectorAll('[aria-label="Dépôts du compte"] input[type=checkbox]')][0]; if (c && !c.checked) c.click(); });
  await p.waitForFunction(() => document.body.innerText.includes('CHEQUE ESSAI QA'), { timeout: 30000 });
  const depot = await ligne(p, 'CHEQUE ESSAI QA');
  verifier(await depot.evaluate((r) => !!r && [...r.querySelectorAll('button')].some((b) => b.textContent.startsWith('Retourné'))), 'le chèque s’est rapproché seul et offre « Retourné… »');
  await depot.evaluate((r) => [...r.querySelectorAll('button')].find((b) => b.textContent.startsWith('Retourné')).click());
  await p.waitForSelector('select[aria-label="Sortie du relevé"]');
  const opt = await p.evaluate(() => [...document.querySelectorAll('select[aria-label="Sortie du relevé"] option')].find((o) => o.textContent.includes('CHQ RETOURNE ESSAI QA'))?.value);
  verifier(!!opt, 'la sortie de même montant est proposée');
  await p.select('select[aria-label="Sortie du relevé"]', opt);
  await clic(p, 'Inscrire le retour');
  await p.waitForFunction(() => /Retour inscrit/.test(document.querySelector('.bandeau.info')?.innerText ?? '') || document.querySelector('.bandeau.erreur'), { timeout: 60000 });
  const msg = await p.evaluate(() => (document.querySelector('.bandeau.info') ?? document.querySelector('.bandeau.erreur')).innerText);
  verifier(msg.startsWith('Retour inscrit'), `message : ${msg}`);
  await att(1500);
  verifier(await (await ligne(p, 'CHEQUE ESSAI QA')).evaluate((r) => r.innerText.includes('Retourné par la banque') && ![...r.querySelectorAll('button')].some((b) => b.textContent.startsWith('Retourné'))), 'le dépôt porte la note du retour et ne peut plus être retourné');
  await p.screenshot({ path: '/tmp/retour-depot.png', fullPage: false });
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
