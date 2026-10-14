import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const S = '/private/tmp/claude-501/-Users-octa-Desktop-TWIM-PROJECTS-Gregory-main/342b025c-618f-49eb-8e60-b10fea3f97ac/scratchpad', att = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', defaultViewport: { width: 1440, height: 1024 } });
const p = await b.newPage();
const clic = async (sel, t) => { for (const e of await p.$$(sel)) if ((await e.evaluate((x) => x.textContent)).includes(t)) { await e.click(); return true; } return false; };
const msg = async () => [await p.$eval('.toast', (e) => e.textContent).catch(() => ''), await p.$eval('.bandeau.erreur', (e) => e.textContent).catch(() => '')].join(' | ');
await connecter(p, 'gestionnaire');
await p.goto('http://localhost:3020/maintenance/soumissions?bt=00000000-0000-4000-d000-0000000009c1', { waitUntil: 'networkidle0', timeout: 120000 }); await att(800);
await p.screenshot({ path: S + '/soum-1.png' });
const besoin = await p.$('[aria-label="Montant accordé"]');
if (besoin) { await p.type('[aria-label="Montant accordé"]', '1400'); await p.type('[aria-label="Moyen"]', 'Courriel du 11 oct.'); await clic('button', 'Consigner'); await att(2500); console.log('accord', await msg()); }
await clic('button', 'Choisir '); await att(2500); console.log('choisir', await msg());
await p.screenshot({ path: S + '/soum-2.png' });
await b.close();
