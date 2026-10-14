import puppeteer from 'puppeteer-core';
import { connecterPortail } from './connexion-portail.mjs';
const S = '/private/tmp/claude-501/-Users-octa-Desktop-TWIM-PROJECTS-Gregory-main/342b025c-618f-49eb-8e60-b10fea3f97ac/scratchpad', att = (ms) => new Promise((r) => setTimeout(r, ms)), B = 'http://localhost:3020';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', defaultViewport: { width: 1440, height: 1024 } });
const p = await b.newPage(); const err = []; p.on('console', (m) => { if (m.type() === 'error') err.push(p.url().replace(B, '') + ' ' + m.text().slice(0, 140)); });
await connecterPortail(p, 'proprietaire');
for (const [u, n] of [['/proprietaire/finance', '10'], ['/proprietaire/finance/releve', '11'], ['/proprietaire/documents', '12'], ['/proprietaire/calendrier', '13'], ['/proprietaire/acces', '14'], ['/proprietaire/loi25', '15'], ['/proprietaire/aide', '16']]) {
  await p.goto(B + u, { waitUntil: 'networkidle0' }); await att(800); await p.screenshot({ path: S + '/po-' + n + '.png', fullPage: true });
  console.log(n, await p.$eval('.bandeau.erreur', (e) => e.textContent).catch(() => 'ok'));
}
await p.goto(B + '/proprietaire', { waitUntil: 'networkidle0' }); await p.click('.po-cherche'); await att(500);
await p.type('[aria-label="Écrivez à Cléo"]', 'Qu’est-ce qui attend ma décision, et combien me coûte la facture du 5?'); await p.keyboard.press('Enter');
for (let i = 0; i < 40 && (await p.$eval('.cleo-fil', (e) => e.textContent).catch(() => '')).includes('Cléo lit'); i++) await att(1000);
await att(800); await p.screenshot({ path: S + '/po-17.png' }); console.log('17', (await p.$eval('.cleo-fil', (e) => e.innerText)).slice(0, 500));
console.log('erreurs', err.slice(0, 5)); await b.close();
