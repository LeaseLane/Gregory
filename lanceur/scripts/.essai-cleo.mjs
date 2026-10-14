import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const S = '/private/tmp/claude-501/-Users-octa-Desktop-TWIM-PROJECTS-Gregory-main/342b025c-618f-49eb-8e60-b10fea3f97ac/scratchpad', att = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', defaultViewport: { width: 1440, height: 1024 } });
const p = await b.newPage();
await connecter(p, 'gestionnaire');
await p.goto('http://localhost:3020/', { waitUntil: 'networkidle0', timeout: 120000 }); await att(800);
await p.click('.haut-cherche'); await att(400); await p.type('[aria-label="Recherche"]', 'paquet'); await att(1500);
await p.screenshot({ path: S + '/cleo-1-palette.png' });
await p.$eval('[aria-label="Recherche"]', (el) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ''); el.dispatchEvent(new Event('input', { bubbles: true })); });
await p.type('[aria-label="Recherche"]', 'Quels loyers sont en retard, et que proposes-tu?'); await att(1200);
for (const e of await p.$$('.palette-ligne')) if ((await e.evaluate((x) => x.textContent)).includes('Quels loyers')) { await e.click(); break; }
await p.waitForSelector('.cleo-r .avatar-cleo + div p', { timeout: 60000 }).catch(() => null); await att(1000);
for (let i = 0; i < 60 && await p.$('.cleo-fil .gris') && (await p.$eval('.cleo-fil', (e) => e.textContent)).includes('Cléo lit'); i++) await att(1000);
await att(800); await p.screenshot({ path: S + '/cleo-2-reponse.png' });
console.log(await p.$eval('.cleo-fil', (e) => e.innerText.slice(0, 900)));
await b.close();
