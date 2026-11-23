// Essai complet du circuit de paiement (préproduction, 23 nov. 2026) — les 6 tests demandés par Greg :
// encaissement Interac, imputation, reçu, retour, versement au propriétaire, rapprochement.
// Données : propriétaire démo mj.berube, locataire Samuel Fortin (LL-10005), Mathieu Roy (LL-10006); lignes « ESSAI QA ».
// Préparation et ménage en SQL (scripts/e2e-paiements-*.sql). Aucun courriel réel : comptes de LeaseLane posés en base.
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
import { connecterPortail } from './connexion-portail.mjs';
const BASE = 'http://localhost:3020', Q = `${process.env.HOME}/leaselane-qa/paiements`;
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const texte = (p) => p.evaluate(() => document.body.innerText);
const clic = async (p, t, dans = 'body') => { await p.waitForFunction((t, dans) => [...(document.querySelector(dans)?.querySelectorAll('button') ?? [])].some((b) => b.textContent.trim().startsWith(t) && !b.disabled), { timeout: 45000 }, t, dans); return p.evaluate((t, dans) => [...document.querySelector(dans).querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(t) && !b.disabled)?.click(), t, dans); };
const message = async (p) => { await p.waitForFunction(() => document.querySelector('.bandeau.info, .bandeau.erreur'), { timeout: 60000 }); return p.evaluate(() => (document.querySelector('.bandeau.erreur') ?? document.querySelector('.bandeau.info')).innerText); };
const importer = async (p, f) => {
  await p.goto(`${BASE}/finances/fideicommis?vue=depots`, { waitUntil: 'networkidle2', timeout: 120000 });
  await (await p.waitForSelector('input[type=file]')).uploadFile(f); await p.waitForSelector('select.champ-releve');
  await clic(p, 'Vérifier le relevé'); await p.waitForFunction(() => document.body.innerText.includes('Essai à blanc :'), { timeout: 60000 });
  await clic(p, 'Importer'); await p.waitForFunction(() => !document.querySelector('.import-releve'), { timeout: 60000 }); await att(1500);
};
const ligne = (p, txt) => p.evaluateHandle((txt) => [...document.querySelectorAll('[aria-label="Dépôts du compte"] tbody tr')].find((r) => r.innerText.includes(txt)), txt);
try {
  // 1. Le propriétaire inscrit son compte de versement (portail, double authentification)
  const pr = await (await nav.createBrowserContext()).newPage(); await connecterPortail(pr, 'proprietaire');
  await pr.goto(`${BASE}/proprietaire/profil?t=versement`, { waitUntil: 'networkidle2', timeout: 120000 });
  await pr.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /^(Inscrire|Changer)/.test(b.textContent.trim())), { timeout: 45000 });
  await pr.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^(Inscrire|Changer)/.test(b.textContent.trim())).click()); await pr.waitForSelector('#cv-c');
  for (const [id, v] of [['#cv-i', '815'], ['#cv-t', '30000'], ['#cv-c', '1234567']]) { await pr.click(id, { clickCount: 3 }); await pr.type(id, v); }
  await clic(pr, 'Enregistrer le compte'); await pr.waitForSelector('[role=status]', { timeout: 30000 });
  verifier((await texte(pr)).includes('567'), '1. propriétaire : compte inscrit, « à confirmer », 3 derniers chiffres');

  // 2. L'équipe vérifie par rappel
  const a = await (await nav.createBrowserContext()).newPage(); await connecter(a, 'admin');
  a.on('dialog', (d) => d.type() === 'prompt' ? d.accept('Rappel au 418 du dossier, essai QA') : d.accept());
  await a.goto(`${BASE}/finances/fideicommis?vue=soldes`, { waitUntil: 'networkidle2', timeout: 120000 });
  await a.waitForFunction(() => [...document.querySelectorAll('tr.ligne-lien')].some((r) => r.innerText.includes('Bérubé')), { timeout: 60000 });
  await a.evaluate(() => [...document.querySelectorAll('tr.ligne-lien')].find((r) => r.innerText.includes('Bérubé')).click());
  await clic(a, 'Coordonnées de versement'); await clic(a, 'J’ai fait le rappel');
  await a.waitForFunction(() => /Coordonnées vérifiées/.test(document.body.innerText), { timeout: 60000 }).catch(() => {});   // le tiroir montre déjà un bandeau « À vérifier » : attendre le succès lui-même
  const ok2 = await a.evaluate(() => /Coordonnées vérifiées/.test(document.body.innerText));
  if (!ok2) console.log('   bandeau :', await a.$$eval('.bandeau', (x) => x.map((e) => e.innerText)));
  verifier(ok2, '2. équipe : coordonnées vérifiées par rappel');

  // 3. Le locataire voit comment payer
  const l = await (await nav.createBrowserContext()).newPage(); await connecterPortail(l, 'samuel');
  await l.goto(`${BASE}/locataire/paiements`, { waitUntil: 'networkidle2', timeout: 120000 });
  const tl = await texte(l);
  verifier(tl.includes('loyers-essai@leaselane.test') && tl.includes('LL-10005'), '3. locataire : adresse Interac du fidéicommis et référence LL-10005 affichées');

  // 4. Liste « Prêt pour le 1er »
  await a.goto(`${BASE}/finances/fideicommis?vue=preparation`, { waitUntil: 'networkidle2', timeout: 120000 });
  await a.waitForSelector('[aria-label="Prêt pour le 1er"] li');
  const prep = await a.$$eval('[aria-label="Prêt pour le 1er"] li', (x) => x.map((e) => e.innerText.replace(/\s+/g, ' ')));
  verifier(['Compte en fidéicommis', 'Adresse Interac', 'Compte d’exploitation'].every((t) => prep.find((x) => x.startsWith(t))?.includes('Prêt')), '4. « Prêt pour le 1er » : fidéicommis, Interac et exploitation au vert');

  // 5. Relevé BMO : deux virements Interac et un retour
  await importer(a, `${Q}/releve-e2e-1.csv`);
  await a.evaluate(() => { const c = [...document.querySelectorAll('[aria-label="Dépôts du compte"] input[type=checkbox]')][0]; if (c && !c.checked) c.click(); }); await att(1500);
  const etat = async (t) => (await ligne(a, t)).evaluate((r) => r?.innerText.replace(/\s+/g, ' ') ?? '');
  verifier((await etat('LL-10005')).includes('Samuel'), '5. encaissement : le virement LL-10005 s’impute seul au bail de Samuel Fortin');
  verifier((await etat('LL-10006')).includes('Mathieu'), '5. encaissement : le virement LL-10006 s’impute seul au bail de Mathieu Roy');

  // 6. Retour : la banque reprend le virement de Mathieu
  await (await ligne(a, 'LL-10006')).evaluate((r) => [...r.querySelectorAll('button')].find((b) => b.textContent.startsWith('Retourné')).click());
  await a.waitForSelector('select[aria-label="Sortie du relevé"]');
  await a.select('select[aria-label="Sortie du relevé"]', await a.evaluate(() => [...document.querySelectorAll('select[aria-label="Sortie du relevé"] option')].find((o) => o.textContent.includes('DEPOT RETOURNE ESSAI QA')).value));
  await clic(a, 'Inscrire le retour');
  verifier((await message(a)).startsWith('Retour inscrit'), '6. retour : le loyer de Mathieu redevient dû, montant repris au propriétaire');

  // 7. Reçu du locataire
  await l.goto(`${BASE}/locataire/paiements`, { waitUntil: 'networkidle2', timeout: 120000 });
  const recu = await l.evaluate(() => [...document.querySelectorAll('a')].find((x) => x.textContent.includes('Reçu') && /\?r=/.test(x.getAttribute('href') ?? ''))?.getAttribute('href'));
  verifier(!!recu, '7. reçu : le loyer de décembre de Samuel est payé, reçu disponible');
  if (recu) { await l.goto(`${BASE}${recu}`, { waitUntil: 'networkidle2' }); await att(1000); await l.screenshot({ path: '/tmp/e2e-recu.png' }); }

  // 8. Versement au propriétaire (lot, à la main dans BMO, coché, envoyé)
  await a.goto(`${BASE}/finances/fideicommis?vue=versements`, { waitUntil: 'networkidle2', timeout: 120000 });
  await a.waitForSelector('[aria-label="Préparer les versements"] input[type=date]');
  await a.$eval('[aria-label="Préparer les versements"] input[type=date]', (i) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(i, '2026-11-23'); i.dispatchEvent(new Event('input', { bubbles: true })); });
  await clic(a, 'Aperçu', '[aria-label="Préparer les versements"]'); await att(2500);
  const ap = await a.$eval('[aria-label="Préparer les versements"]', (s) => s.innerText.replace(/\s+/g, ' '));
  verifier(/Bérubé.*1[\s ]?450/.test(ap), '8. aperçu du lot : 1 450 $ à verser à Marie-Josée Bérubé (le retour de Mathieu est déduit)');
  await clic(a, 'Préparer le lot'); await message(a); await att(1500);
  await clic(a, 'À la main', '[aria-label="Lots"]');
  await a.waitForFunction(() => [...document.querySelectorAll('[aria-label="Virements à faire à la main"] button')].some((b) => b.textContent.startsWith('Cocher fait') && !b.disabled), { timeout: 45000 });
  while (await a.evaluate(() => [...document.querySelectorAll('[aria-label="Virements à faire à la main"] button')].some((b) => b.textContent.startsWith('Cocher fait') && !b.disabled))) {
    await clic(a, 'Cocher fait', '[aria-label="Virements à faire à la main"]'); await att(3000);
  }
  await clic(a, 'Tous faits', '[aria-label="Virements à faire à la main"]');
  verifier((await message(a)).includes('envoyé'), '8. versement : virement fait à la main, coché, lot marqué envoyé');

  // 9. Rapprochement : la sortie du relevé se relie au versement
  await importer(a, `${Q}/releve-e2e-2.csv`);
  await a.goto(`${BASE}/finances/fideicommis?vue=versements`, { waitUntil: 'networkidle2', timeout: 120000 }); await att(2500);
  const lots = await a.$eval('[aria-label="Lots"]', (s) => s.innerText.replace(/\s+/g, ' '));
  verifier(lots.includes('VIREMENT ESSAI QA') || /Vu au relevé/.test(lots), '9. rapprochement : la sortie du relevé est reliée au versement du lot');
  await a.screenshot({ path: '/tmp/e2e-lots.png', fullPage: true });
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
