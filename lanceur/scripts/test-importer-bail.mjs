// « Importer le bail » en une étape (préproduction, 23 nov. 2026) : le PDF d'essai (Camille et Olivier Essaibail, 2880 ch. Sainte-Foy app. 3)
// est lu par l'IA, puis « Créer le locataire et le bail » crée le locataire, le bail, le colocataire et les 2 invitations; le propriétaire a déjà accès.
// Ménage ensuite : ~/leaselane-qa/nettoyage-demo.sql (noms « Essaibail »).
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const BASE = 'http://localhost:3020', CAPT = `${process.env.HOME}/leaselane-qa/captures/`;
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const att = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const p = await nav.newPage(); await connecter(p, 'admin');
  await p.goto(`${BASE}/clients/locataires?nouveau=1`, { waitUntil: 'networkidle2', timeout: 120000 }); await att(1500);
  await (await p.waitForSelector('[role=dialog] input[type=file]')).uploadFile(CAPT + 'bail-essai.pdf');
  for (let i = 0; i < 90; i++) { await att(2000); const t = await p.$eval('[role=dialog]', (d) => d.innerText); if (/Bail lu|n’a pas|pas pu/.test(t) && !/Lecture du bail…/.test(t)) break; }
  const t = (await p.$eval('[role=dialog]', (d) => d.innerText)).replace(/\s+/g, ' ');
  verifier(/fait tout d’un coup/.test(t) && /Olivier Essaibail/.test(t), 'bail lu : logement reconnu, colocataire annoncé, « tout d’un coup »');
  verifier(/Inviter aussi le propriétaire/.test(t), 'option « Inviter aussi le propriétaire »');
  await p.screenshot({ path: '/tmp/import-bail-tiroir.png' });
  await p.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === 'Créer le locataire et le bail').click());
  await p.waitForFunction(() => /\/clients\/locataires\/[0-9a-f-]{36}/.test(location.pathname), { timeout: 60000 }); await att(2500);
  const fiche = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
  verifier(/Bail importé : locataire et bail créés, 1 colocataire ajouté, 2 invitations au portail envoyées/.test(fiche), 'fiche : bandeau « 1 colocataire, 2 invitations »');
  verifier(/déjà accès à son portail/.test(fiche), 'propriétaire déjà inscrit : pas réinvité');
  await p.screenshot({ path: '/tmp/import-bail-fiche.png' });
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
