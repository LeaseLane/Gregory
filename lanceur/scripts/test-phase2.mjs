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
  const AN = (n) => `input[aria-label="${n} : année d’installation"]`;
  await p.waitForSelector(AN('Toiture'), { timeout: 60000 });
  t = await texte(p); verifier(/estimations non validées/.test(t), 'capex : bandeau « non validées » tant que rien n’est confirmé');
  await p.$eval(AN('Toiture'), (e) => e.select()); await p.type(AN('Toiture'), '1500');
  verifier(await p.$eval('section form button', (b) => b.disabled), 'capex : année impossible (1500) : bouton bloqué avant l’envoi');
  await p.$eval(AN('Toiture'), (e) => e.select()); await p.type(AN('Toiture'), '2001');
  await p.$eval(AN('Fenêtres'), (e) => e.select()); await p.type(AN('Fenêtres'), '2005');
  await p.$eval('#cx-ann', (e) => (e.value = '')); await p.type('#cx-ann', '1000');
  await p.click('section form button'); await p.waitForFunction(() => document.body.innerText.includes('Enregistré'), { timeout: 30000 });
  t = await texte(p); verifier(/Premier manque de liquidités/.test(t) && /Versement annuel requis/.test(t), 'capex : les trois indicateurs sont là');
  verifier(await p.$$eval('table', (r) => r.length) === 2, 'capex : tableau des composants et tableau de projection');
  verifier(await p.$$eval('table:last-of-type tbody tr', (r) => r.length) < 20, 'capex : seules les années avec dépenses sont listées');
  await p.screenshot({ path: `${SORTIE}/3-capex.png`, fullPage: true });
  // 4. Nouveaux propriétaires
  await p.goto('http://localhost:3020/finances/changements', { waitUntil: 'networkidle2', timeout: 120000 });
  await p.waitForFunction(() => document.body.innerText.includes('Rôle à jour au'), { timeout: 60000 });
  t = await texte(p); verifier(/3 novembre 2025/.test(t), 'changements : rôle à jour au 3 novembre 2025, dit à l’écran');
  verifier(/ne sont plus des ventes récentes/.test(t), 'changements : le rôle date de plus de 90 jours, dit à l’écran');
  verifier(!/\bBO\b|\bRU\b/.test(t.split('Propriétaire connu')[1] ?? ''), 'changements : adresses en toutes lettres, casse normale');
  await p.screenshot({ path: `${SORTIE}/4-nouveaux-proprietaires.png` });
  // 5. Modules sur la fiche propriétaire
  await p.goto('http://localhost:3020/clients/proprietaires', { waitUntil: 'networkidle2', timeout: 120000 });
  const lien = await p.$$eval('a[href^="/clients/proprietaires/"]', (a) => a[0]?.getAttribute('href'));
  verifier(!!lien, 'modules : un propriétaire à ouvrir');
  await p.goto(`http://localhost:3020${lien}`, { waitUntil: 'networkidle2', timeout: 120000 });
  const SW = 'section[aria-label="Modules"] button[role=switch][aria-label="CapEx"]';
  await p.waitForSelector(SW, { timeout: 60000 });
  verifier(await p.$$eval('section[aria-label="Modules"] button[role=switch]', (c) => c.length) === 5 && await p.$$eval('section[aria-label="Modules"] button[aria-checked=true]', (c) => c.length) === 0, 'modules : 5 interrupteurs, tous désactivés par défaut');
  await p.click(SW); await p.waitForFunction((s) => document.querySelector(s).getAttribute('aria-checked') === 'true', { timeout: 15000 }, SW);
  verifier((await texte(p)).includes('CapEx : module activé.'), 'modules : confirmation « module activé » affichée');
  await new Promise((r) => setTimeout(r, 800)); await p.reload({ waitUntil: 'networkidle2' }); await p.waitForSelector(SW);
  verifier(await p.$eval(SW, (c) => c.getAttribute('aria-checked') === 'true'), 'modules : l’activation survit au rechargement');
  await p.screenshot({ path: `${SORTIE}/5-modules.png` });
  await p.click(SW); await new Promise((r) => setTimeout(r, 800)); // remet à l'état d'origine
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
