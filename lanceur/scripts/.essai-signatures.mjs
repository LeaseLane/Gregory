import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
const S = '/private/tmp/claude-501/-Users-octa-Desktop-TWIM-PROJECTS-Gregory-main/342b025c-618f-49eb-8e60-b10fea3f97ac/scratchpad', att = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', defaultViewport: { width: 1440, height: 1024 } });
const p = await b.newPage();
const clic = async (sel, t) => { for (const e of await p.$$(sel)) if ((await e.evaluate((x) => x.textContent)).includes(t)) { await e.click(); return true; } return false; };
const msg = async () => [await p.$eval('.toast', (e) => e.textContent).catch(() => ''), await p.$eval('.bandeau.erreur', (e) => e.textContent).catch(() => '')].join(' | ');
await connecter(p, 'gestionnaire');
await p.goto('http://localhost:3020/clients/processus', { waitUntil: 'networkidle0', timeout: 120000 });
await clic('.tableau tbody tr', 'Emménagement'); await att(600);
console.log('bail prep', await clic('button', 'Préparer le bail'), await (att(2500).then(msg)));
await p.goto('http://localhost:3020/clients/documents', { waitUntil: 'networkidle0' }); await att(800);
await clic('.tableau tbody tr', 'Bail');  await att(400);
console.log('envoyer', await clic('button', 'Envoyer à signer'), await (att(4000).then(msg)));
await p.screenshot({ path: S + '/docs-1-envoye.png' });
for (let i = 0; i < 2; i++) { console.log('signe', await clic('button', 'Simuler la signature'), await (att(3500).then(msg))); }
await p.screenshot({ path: S + '/docs-2-signe.png' });
const opt = await p.$$eval('.tete-action option', (o) => o.map((x) => x.value).filter(Boolean));
if (opt.length) { await p.select('.tete-action select', opt[0]); await clic('button', 'Préparer'); await att(2500); console.log('mandat', await msg());
  await clic('button', 'Envoyer à signer'); await att(4000); console.log('envoi mandat', await msg());
  for (let i = 0; i < 2; i++) { await clic('button', 'Simuler la signature'); await att(3500); }
  console.log('mandat signé', await msg()); await p.screenshot({ path: S + '/docs-3-mandat.png' }); }
await b.close();
