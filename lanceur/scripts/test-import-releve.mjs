// Import du relevé du fidéicommis (revue du 18 nov. 2026), préproduction, en navigateur :
// 1. relevé BMO (préambule, retraits/dépôts séparés, solde, montant « 1 380,00 ») : colonnes associées seules, essai à blanc → bons sorts;
// 2. import réel d'un relevé sans rapprochement automatique (aucun mouvement au registre), puis réimport → rien de nouveau;
// 3. relevé avec un trou de solde → refusé. Les lignes d'essai se retirent ensuite (DEPOT/FRAIS … ESSAI QA).
// Usage : node scripts/test-import-releve.mjs [dossier des relevés, défaut ~/leaselane-qa/paiements]
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const BASE = 'http://localhost:3020', D = process.argv[2] ?? `${process.env.HOME}/leaselane-qa/paiements`;
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1100 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const clic = async (p, t) => { await p.waitForFunction((t) => [...document.querySelectorAll('button')].some((b) => b.textContent.trim().startsWith(t) && !b.disabled), { timeout: 30000 }, t); return p.evaluate((t) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(t) && !b.disabled)?.click(), t); };
const texte = (p) => p.evaluate(() => document.body.innerText);
const att = (ms) => new Promise((r) => setTimeout(r, ms));
async function charger(p, fichier) {
  await p.goto(`${BASE}/finances/fideicommis?vue=depots`, { waitUntil: 'networkidle2', timeout: 120000 });
  await (await p.waitForSelector('input[type=file]')).uploadFile(`${D}/${fichier}`);
  await p.waitForSelector('select.champ-releve', { timeout: 30000 });
}
try {
  const p = await nav.newPage(); await connecter(p, 'admin');
  // 1. essai à blanc d'un relevé BMO réaliste
  await charger(p, 'releve-essai.csv');
  const map = await p.evaluate(() => [...document.querySelectorAll('select.champ-releve')].map((s) => s.value));
  verifier(JSON.stringify(map) === JSON.stringify(['date', 'description', 'retrait', 'depot', 'solde']), `colonnes associées seules : ${map.join(', ')}`);
  verifier((await texte(p)).includes('2026-11-16 · VIREMENT INTERAC JULIE LEVESQUE LL-10004'), 'préambule sauté, date JJ/MM lue, « 1 380,00 » lu');
  await clic(p, 'Vérifier le relevé'); await p.waitForFunction(() => document.body.innerText.includes('Essai à blanc :'), { timeout: 60000 });
  const sorts = await p.evaluate(() => [...document.querySelectorAll('.import-releve tbody')].at(-1) ? [...[...document.querySelectorAll('.import-releve tbody')].at(-1).querySelectorAll('tr')].map((r) => r.querySelector('.puce')?.textContent) : []);
  verifier(JSON.stringify(sorts) === JSON.stringify(['automatique', 'automatique', 'automatique', 'à confirmer', 'à confirmer', 'sortie']),
    `sorts prévus : ${sorts.join(', ')} (référence + nom → auto, deux virements identiques gardés, référence seule → à confirmer, nom + montant → à confirmer, frais → sortie)`);
  // 2. import réel d'un relevé sans rapprochement automatique
  await charger(p, 'releve-reel.csv');
  await clic(p, 'Vérifier le relevé'); await p.waitForFunction(() => document.body.innerText.includes('Essai à blanc :'), { timeout: 60000 });
  await clic(p, 'Importer'); await att(4000);
  const apres = await p.evaluate(() => [...document.querySelectorAll('[aria-label="Dépôts du compte"] tr')].filter((r) => /ESSAI QA|PAUL GAGNON/.test(r.innerText)).length);
  verifier(apres >= 3, `import réel : ${apres} ligne(s) d'essai à rapprocher dans la liste`);
  await charger(p, 'releve-reel.csv');
  await clic(p, 'Vérifier le relevé'); await p.waitForFunction(() => document.body.innerText.includes('Essai à blanc :'), { timeout: 60000 });
  verifier((await texte(p)).includes('4 déjà importée(s)'), 'réimport du même relevé : 4 lignes reconnues, rien de nouveau');
  // 3. trou dans les soldes
  await charger(p, 'releve-trou.csv');
  await clic(p, 'Vérifier le relevé'); await att(4000);
  verifier(/ne suit pas le précédent/.test(await texte(p)), 'relevé avec un trou de solde : refusé avec la raison');
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : '\nOK');
} finally { await nav.close(); }
process.exit(echecs ? 1 : 0);
