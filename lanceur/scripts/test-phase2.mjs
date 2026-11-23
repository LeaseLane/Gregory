// Phase 2 (préproduction) : modules par client, vacance, taux, CapEx, nouveaux propriétaires. Captures dans ~/leaselane-qa/phase2/.
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const SORTIE = `${process.env.HOME}/leaselane-qa/phase2`;
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const texte = (p) => p.evaluate(() => document.body.innerText);
try {
  const p = await nav.newPage(); await connecter(p, 'admin');
  // 1. Vacance
  await p.goto('http://localhost:3020/finances/vacance', { waitUntil: 'networkidle2', timeout: 120000 });
  await p.waitForSelector('table tbody tr', { timeout: 60000 });
  let t = await texte(p);
  verifier(t.includes('Taux de vacance par zone') && t.includes('SCHL'), 'vacance : titre et source SCHL');
  verifier(/Haute-Ville/.test(t) && /2,9\s*%/.test(t), 'vacance : Haute-Ville 2,9 %');
  verifier(t.includes('non publié par la SCHL'), 'vacance : zones non publiées dites telles');
  await p.screenshot({ path: `${SORTIE}/1-vacance.png` });
  // 2. Taux
  await p.goto('http://localhost:3020/finances/taux', { waitUntil: 'networkidle2', timeout: 120000 });
  await p.waitForSelector('#tx-capital', { timeout: 60000 });
  t = await texte(p); verifier(t.includes('2,50') && t.includes('Taux directeur'), 'taux : taux directeur 2,50 %');
  await p.$eval('#tx-capital', (e) => (e.value = '')); await p.type('#tx-capital', '500000');
  await p.$eval('#tx-actuel', (e) => (e.value = '')); await p.type('#tx-actuel', '5');
  await p.$eval('#tx-nouveau', (e) => (e.value = '')); await p.type('#tx-nouveau', '4');
  await p.click('form button'); await p.waitForSelector('[role=status]', { timeout: 30000 });
  t = await texte(p); verifier(/277,92/.test(t) && /3\s?335,04/.test(t), 'taux : refinancement 5 % → 4 % = 277,92 $ par mois, 3 335,04 $ par année');
  await p.screenshot({ path: `${SORTIE}/2-taux.png` });
  // 3. CapEx
  await p.goto('http://localhost:3020/finances/capex', { waitUntil: 'networkidle2', timeout: 120000 });
  await p.waitForSelector('#cx-toiture', { timeout: 60000 });
  t = await texte(p); verifier(/estimations non validées/.test(t), 'capex : bandeau « non validées » tant que rien n’est confirmé');
  await p.type('#cx-toiture', '2001'); await p.type('#cx-fenetres', '2005');
  await p.$eval('#cx-ann', (e) => (e.value = '')); await p.type('#cx-ann', '1000');
  await p.click('section form button'); await p.waitForFunction(() => document.body.innerText.includes('Échéance 2026'), { timeout: 30000 });
  t = await texte(p); verifier(/Manque de liquidités dès/.test(t) || /couvre toutes les dépenses/.test(t), 'capex : alerte ou confirmation de liquidités affichée');
  verifier(await p.$$eval('table tbody tr', (r) => r.length) === 20, 'capex : 20 années projetées');
  await p.screenshot({ path: `${SORTIE}/3-capex.png`, fullPage: true });
  // 4. Nouveaux propriétaires
  await p.goto('http://localhost:3020/finances/changements', { waitUntil: 'networkidle2', timeout: 120000 });
  await p.waitForFunction(() => document.body.innerText.includes('Rôle à jour au'), { timeout: 60000 });
  t = await texte(p); verifier(/3 novembre 2025/.test(t), 'changements : rôle à jour au 3 novembre 2025, dit à l’écran');
  await p.screenshot({ path: `${SORTIE}/4-nouveaux-proprietaires.png` });
  // 5. Modules sur la fiche propriétaire
  await p.goto('http://localhost:3020/clients/proprietaires', { waitUntil: 'networkidle2', timeout: 120000 });
  const lien = await p.$$eval('a[href^="/clients/proprietaires/"]', (a) => a[0]?.getAttribute('href'));
  verifier(!!lien, 'modules : un propriétaire à ouvrir');
  await p.goto(`http://localhost:3020${lien}`, { waitUntil: 'networkidle2', timeout: 120000 });
  await p.waitForSelector('input[aria-label="Prévision CapEx"]', { timeout: 60000 });
  verifier(await p.$$eval('section[aria-label="Modules"] input[type=checkbox]', (c) => c.length) === 5 && await p.$$eval('section[aria-label="Modules"] input:checked', (c) => c.length) === 0, 'modules : 5 interrupteurs, tous désactivés par défaut');
  await p.click('input[aria-label="Prévision CapEx"]'); await p.waitForFunction(() => document.querySelector('input[aria-label="Prévision CapEx"]').checked, { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 800)); await p.reload({ waitUntil: 'networkidle2' }); await p.waitForSelector('input[aria-label="Prévision CapEx"]');
  verifier(await p.$eval('input[aria-label="Prévision CapEx"]', (c) => c.checked), 'modules : l’activation survit au rechargement');
  await p.screenshot({ path: `${SORTIE}/5-modules.png` });
  await p.click('input[aria-label="Prévision CapEx"]'); await new Promise((r) => setTimeout(r, 800)); // remet à l'état d'origine
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
