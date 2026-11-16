// Fiche du prospect (Octa, 2026-11-16), dans le navigateur, préproduction, compte equipe-prospection : propriétaire sur la fiche,
// résultat d'appel en un clic (prochain appel placé tout seul), suivi enregistré sans écraser la date, note vocale (micro simulé), note écrite résumée.
// Usage : node scripts/test-fiche-prospect.mjs <deal_id> [captures]
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const BASE = 'http://localhost:3020', [DEAL, CAP] = process.argv.slice(2);
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1100 },
  // micro simulé de Chrome (un bip) : un fichier audio injecté arrive presque muet en mode sans écran
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const SUIVI = 'section[aria-label="Suivi du prospect"]';
try {
  const p = await nav.newPage(); await connecter(p, 'prospection');
  p.on('response', async (r) => { if (r.url().includes('/api/appel')) console.log('     /api/appel', r.status(), (await r.text().catch(() => '')).slice(0, 160)); });
  const carte = (l) => p.evaluate((x) => document.querySelector(`section[aria-label="${x}"]`)?.innerText ?? '', l);
  const bouton = (t) => p.evaluate((s, t) => [...document.querySelectorAll(`${s} button`)].find((b) => b.innerText.trim() === t || (t.startsWith('~') && b.innerText.includes(t.slice(1)))).click(), SUIVI, t);
  // agir : attendre que le message précédent soit parti, agir, puis lire le nouveau message
  const agir = async (fn) => { await p.waitForFunction(() => !document.querySelector('.toast'), { timeout: 15000 }).catch(() => {}); await fn(); await p.waitForSelector('.toast', { timeout: 120000 }); return p.evaluate(() => document.querySelector('.toast').innerText); };
  const remplir = async (sel, v) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.evaluate((s) => { const e = document.querySelector(s); e.select?.(); }, sel); await p.keyboard.down('Meta'); await p.keyboard.press('a'); await p.keyboard.up('Meta'); await p.keyboard.press('Backspace'); await p.type(sel, v); };
  const ouvrir = async () => { await p.goto(`${BASE}/ventes/deals/${DEAL}`, { waitUntil: 'domcontentloaded', timeout: 120000 }); await p.waitForSelector(SUIVI, { timeout: 90000 }); await att(800); };
  await ouvrir();
  const prop = await carte('Le propriétaire');
  verifier(/Décideur : Patrice St-Pierre/.test(prop) && /450-446-8221/.test(prop) && /Ses immeubles/i.test(prop), 'la fiche montre le propriétaire : décideur, téléphone, immeubles');
  const admin = await p.evaluate(() => ({ auto: !!document.querySelector('section[aria-label="Automatisation de l’étape"]'), cadrage: /Cadrage du mandat/.test(document.body.innerText), convertir: [...document.querySelectorAll('button')].some((b) => b.innerText.trim() === 'Convertir') }));
  verifier(!admin.auto && !admin.cadrage && !admin.convertir, 'sections d’administration masquées pour le prospecteur');
  if (CAP) await p.screenshot({ path: `${CAP}/fiche-1.png` });
  // 1. résultat d'appel en un clic
  await bouton('Pas de réponse'); await att(300); await p.type('#sv-n', 'boîte vocale pleine');
  const t1 = await agir(() => bouton('Noter l’appel')); await att(1200);
  const date1 = (await carte('Suivi du prospect')).match(/Prochain appel : ([^\n]+)/)?.[1];
  verifier(/Prochain appel : /.test(t1) && !!date1, `« Pas de réponse » en un clic : ${t1}`);
  // 2. suivi à la main : la date posée par l'appel reste
  await bouton('Tiède'); await remplir('#sv-a', 'Envoyer l’offre de gestion'); await remplir('#sv-notes', 'Préfère être appelé le soir. Associé : Serge Rouillard.');
  verifier(/Suivi enregistré/.test(await agir(() => bouton('Enregistrer le suivi'))), 'intérêt, prochaine action et notes enregistrés');
  await ouvrir();
  const relu = await p.evaluate((s) => ({ a: document.querySelector('#sv-a').value, n: document.querySelector('#sv-notes').value, t: [...document.querySelectorAll(`${s} button[aria-pressed="true"]`)].map((b) => b.innerText), tete: document.querySelector(`${s} header p`).innerText }), SUIVI);
  verifier(relu.a === 'Envoyer l’offre de gestion' && relu.n === 'Préfère être appelé le soir. Associé : Serge Rouillard.' && relu.t.includes('Tiède'), 'relu après rechargement : intérêt, action et notes gardés');
  verifier(relu.tete.includes(date1), `la date du prochain appel n’a pas été écrasée (${relu.tete})`);
  // 3. note vocale (micro simulé : un fichier audio)
  await bouton('~Note vocale'); await att(6000);
  await bouton('~Arrêter et envoyer');
  await p.waitForFunction((s) => !!document.querySelector('.toast') || !!document.querySelector(`${s} .bandeau.erreur`), { timeout: 150000 }, SUIVI);
  const vocal = await p.evaluate((s) => document.querySelector('.toast')?.innerText ?? document.querySelector(`${s} .bandeau.erreur`)?.innerText, SUIVI);
  console.log('     note vocale →', vocal);
  verifier(/Cléo a résumé|pas encore activée|audible/.test(vocal ?? ''), 'note vocale enregistrée et envoyée (résumé, ou message clair si la transcription est coupée)');
  if (CAP) await p.screenshot({ path: `${CAP}/fiche-vocal.png` });
  // 4. note écrite résumée par Cléo
  await ouvrir();
  await p.type('textarea[aria-label="Raconter l’appel par écrit"]', 'Rejoint Patrice. Il gère lui-même mais trouve ça lourd depuis le projet de Delson. Veut une offre par courriel, rappeler jeudi.');
  const t3 = await agir(() => bouton('Envoyer à Cléo'));
  verifier(/Cléo a résumé l’appel/.test(t3), `note écrite résumée : ${t3.slice(0, 180)}`);
  await ouvrir(); if (CAP) await p.screenshot({ path: `${CAP}/fiche-2.png`, fullPage: true });
  const notes = await carte('Fil chronologique');
  verifier(/Pas de réponse/.test(notes) && /Delson|offre/i.test(notes), 'les deux appels paraissent dans « Notes et appels »');
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : '\nOK');
} finally { await nav.close(); }
process.exit(echecs ? 1 : 0);
