// Clients › Documents › « Déposer un document » (préproduction, 23 nov. 2026) : un PDF chez un locataire (Samuel Fortin) et chez un propriétaire
// (Marie-Josée Bérubé, dossier qui n'acceptait rien avant). Titres « essai QA » : à retirer ensuite (documents + fichiers).
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const clic = (p, t) => p.evaluate((t) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(t) && !b.disabled)?.click(), t);
try {
  const p = await nav.newPage(); await connecter(p, 'admin');
  for (const [qui, recherche, titre] of [['locataire', 'Samuel Fortin', 'Facture essai QA locataire'], ['propriétaire', 'Bérubé', 'Facture essai QA propriétaire']]) {
    await p.goto('http://localhost:3020/clients/documents', { waitUntil: 'networkidle2', timeout: 120000 });
    await clic(p, 'Déposer un document'); await p.waitForSelector('[aria-labelledby="dd-t"]');
    await (await p.$('[aria-labelledby="dd-t"] input[type=file]')).uploadFile('/tmp/facture-essai-qa.pdf');
    await p.waitForSelector('[aria-label^="Type de"]');
    const type = await p.$eval('[aria-label^="Type de"]', (s) => s.value);
    if (qui === 'locataire') verifier(type === 'facture', `type deviné par le nom du fichier : ${type}`);
    const t = await p.$('[aria-labelledby="dd-t"] input[id^="dd-n"]'); await t.click({ clickCount: 3 }); await t.type(titre);
    await p.type('[aria-label="Chercher le client"]', recherche);
    await p.waitForFunction((qui) => [...document.querySelectorAll('[aria-label="Clients trouvés"] button')].some((b) => b.innerText.toLowerCase().includes(qui)), { timeout: 30000 }, qui);
    await p.evaluate((qui) => [...document.querySelectorAll('[aria-label="Clients trouvés"] button')].find((b) => b.innerText.toLowerCase().includes(qui)).click(), qui);
    if (qui === 'locataire') await p.screenshot({ path: '/tmp/deposer-document.png' });
    await p.evaluate(() => [...document.querySelectorAll('[aria-labelledby="dd-t"] footer button')].find((b) => /^Déposer/.test(b.textContent.trim())).click()); await att(500);
    await p.waitForFunction(() => /document déposé/.test(document.body.innerText) || document.querySelector('[aria-labelledby="dd-t"] .bandeau.erreur'), { timeout: 60000 });
    const ok = await p.evaluate(() => /1 document déposé/.test(document.body.innerText));
    if (!ok) console.log('   ', await p.$eval('[aria-labelledby="dd-t"] .bandeau.erreur', (e) => e.innerText).catch(() => ''));
    verifier(ok, `déposé chez un ${qui} en un geste`);
  }
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
