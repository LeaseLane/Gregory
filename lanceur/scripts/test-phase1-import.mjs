// Phase 1 · import et export du parc (préproduction). Fichier Excel réel, six lignes dont trois fautives :
// colonnes associées toutes seules → essai à blanc (rien de créé) → import → le client paraît dans le sélecteur avec ses immeubles → export CSV.
// Le client d'essai se retire ensuite avec supabase/seed-nettoyage-import-essai.sql (préproduction). Usage : node scripts/test-phase1-import.mjs <fichier.xlsx> [captures]
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const BASE = 'http://localhost:3020', FICHIER = process.argv[2], CAP = process.argv[3];
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1100 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const photo = async (page, nom) => CAP && page.screenshot({ path: `${CAP}/${nom}.png`, fullPage: true });
const clic = (page, texte) => page.evaluate((t) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t)).click(), texte);
try {
  const page = await nav.newPage();
  await connecter(page, 'admin');
  await page.goto(`${BASE}/clients/import`, { waitUntil: 'networkidle2', timeout: 120000 });
  const avant = await page.evaluate(() => [...document.querySelectorAll('#portee-client option')].some((o) => o.textContent.includes('Essai Phase1')));
  verifier(!avant, 'le client d’essai n’existe pas avant l’import');
  await (await page.waitForSelector('input[type=file]')).uploadFile(FICHIER);
  await page.waitForSelector('select.champ-map', { timeout: 30000 });
  const map = await page.evaluate(() => [...document.querySelectorAll('select.champ-map')].map((s) => s.value));
  verifier(JSON.stringify(map) === JSON.stringify(['proprietaire', 'courriel_proprietaire', 'immeuble', 'logement', 'loyer', 'locataire', 'courriel_locataire', 'telephone_locataire', 'debut', 'fin', 'ignorer']), `Excel lu, 11 colonnes associées toutes seules : ${map.join(', ')}`);
  await photo(page, 'p1-import-colonnes');
  // colonne requise retirée : l'écran bloque
  await page.evaluate(() => { const s = document.querySelectorAll('select.champ-map')[2]; s.value = 'ignorer'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  await new Promise((r) => setTimeout(r, 300));
  verifier(await page.evaluate(() => document.body.innerText.includes('Colonne requise non trouvée') && [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Vérifier le fichier')).disabled), 'colonne « immeuble » retirée : message et bouton bloqué');
  await page.evaluate(() => { const s = document.querySelectorAll('select.champ-map')[2]; s.value = 'immeuble'; s.dispatchEvent(new Event('change', { bubbles: true })); });
  await new Promise((r) => setTimeout(r, 300));
  await clic(page, 'Vérifier le fichier');
  await page.waitForFunction(() => document.body.innerText.includes('Essai à blanc'), { timeout: 90000 });
  const essai = await page.evaluate(() => ({ texte: document.querySelector('.import-corps .fenetre-texte').textContent, erreurs: [...document.querySelectorAll('.import-corps .planifier li')].map((l) => l.textContent), seg: [...document.querySelectorAll('.import-corps table tbody tr')].map((tr) => tr.textContent) }));
  await photo(page, 'p1-import-verification');
  verifier(/1 client, 2 immeubles, 3 logements, 2 baux/.test(essai.texte) && essai.erreurs.length === 3, `essai à blanc : ${essai.texte.trim()}`);
  verifier(essai.erreurs.some((e) => /autre client \(Marie-Josée Bérubé\)/.test(e)) && essai.erreurs.some((e) => /Client manquant/.test(e)) && essai.erreurs.some((e) => /Loyer requis/.test(e)), `les 3 lignes fautives sont expliquées : ${essai.erreurs.join(' · ')}`);
  await page.reload({ waitUntil: 'networkidle2' });
  verifier(!(await page.evaluate(() => [...document.querySelectorAll('#portee-client option')].some((o) => o.textContent.includes('Essai Phase1')))), 'après l’essai à blanc, rien n’a été créé');
  // import réel
  await (await page.waitForSelector('input[type=file]')).uploadFile(FICHIER); await page.waitForSelector('select.champ-map');
  await clic(page, 'Vérifier le fichier'); await page.waitForFunction(() => document.body.innerText.includes('Essai à blanc'), { timeout: 90000 });
  await clic(page, 'Importer 3 lignes'); await page.waitForFunction(() => document.body.innerText.includes('Import terminé :'), { timeout: 90000 });
  await photo(page, 'p1-import-termine');
  const fait = await page.evaluate(() => document.querySelector('.import-corps .fenetre-texte').textContent);
  verifier(/1 client, 2 immeubles, 3 logements, 2 baux créés/.test(fait), `import : ${fait.trim()}`);
  await page.goto(`${BASE}/immeubles`, { waitUntil: 'networkidle2', timeout: 120000 });
  const id = await page.evaluate(() => [...document.querySelectorAll('#portee-client option')].find((o) => o.textContent.includes('Essai Phase1'))?.value);
  verifier(!!id, 'le client importé est dans le sélecteur');
  await page.select('#portee-client', id); await page.waitForFunction(() => document.querySelector('#portee-immeuble option')?.textContent.includes('(2)'), { timeout: 60000 }); await new Promise((r) => setTimeout(r, 1500));
  const imm = await page.evaluate(() => document.body.innerText.match(/50[13], rue Essai-Phase1/g)?.length ?? 0);
  await photo(page, 'p1-import-immeubles');
  verifier(imm >= 2, `Immeubles, client choisi : ses 2 immeubles importés sont affichés (${imm} mentions)`);
  await page.goto(`${BASE}/clients/import`, { waitUntil: 'networkidle2', timeout: 120000 });
  const client = await page.target().createCDPSession(); await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: CAP ?? '/tmp', eventsEnabled: true });
  const telecharge = new Promise((ok) => client.on('Browser.downloadProgress', (e) => e.state === 'completed' && ok(true)));
  await clic(page, 'Exporter en CSV'); await Promise.race([telecharge, new Promise((r) => setTimeout(r, 20000))]);
  const { readFileSync, readdirSync } = await import('node:fs');
  const f = readdirSync(CAP ?? '/tmp').filter((x) => /^parc-\d{4}-\d{2}-\d{2}.*\.csv$/.test(x)).sort().pop();
  const csv = f ? readFileSync(`${CAP ?? '/tmp'}/${f}`, 'utf8').trim().split('\n') : [];
  verifier(csv.length === 4 && csv.every((l, i) => i === 0 || l.includes('Gestion Essai Phase1')) && csv.some((l) => l.includes('Jeanne Essai-Phase1') && l.includes('2026-07-01')), `export CSV du client choisi : ${csv.length - 1} logements, tous du client d’essai (${f})`);
  await clic(page, 'Voir tous les clients');
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : '\nOK');
} finally { await nav.close(); }
process.exit(echecs ? 1 : 0);
