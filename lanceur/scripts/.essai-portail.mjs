import puppeteer from 'puppeteer-core';
import { connecterPortail } from './connexion-portail.mjs';
const S = '/private/tmp/claude-501/-Users-octa-Desktop-TWIM-PROJECTS-Gregory-main/342b025c-618f-49eb-8e60-b10fea3f97ac/scratchpad', att = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', defaultViewport: { width: 1440, height: 1024 } });
for (const espace of ['proprietaire', 'locataire']) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); const erreurs = [];
  p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text().slice(0, 200)); });
  await connecterPortail(p, espace); await att(1500);
  console.log(espace, p.url(), erreurs.slice(0, 3)); await p.screenshot({ path: S + '/' + espace + '-accueil.png', fullPage: true });
}
await b.close();
