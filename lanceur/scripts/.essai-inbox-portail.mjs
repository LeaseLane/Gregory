import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
import { connecterPortail } from './connexion-portail.mjs';
const S = '/private/tmp/claude-501/-Users-octa-Desktop-TWIM-PROJECTS-Gregory-main/342b025c-618f-49eb-8e60-b10fea3f97ac/scratchpad', att = (ms) => new Promise((r) => setTimeout(r, ms)), B = 'http://localhost:3020', ID = process.argv[2];
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', defaultViewport: { width: 1440, height: 1024 } });
let p = await (await b.createBrowserContext()).newPage();
await connecter(p, 'gestionnaire'); await p.goto(B + '/operations/inbox/' + ID, { waitUntil: 'networkidle0' }); await att(1000);
await p.screenshot({ path: S + '/inbox-portail.png' });
const zone = await p.$('textarea[placeholder^="Écrire à"]'); if (zone) { await zone.type('Bonjour Marie-Josée, le plombier passe demain matin.'); }
await p.click('button[aria-label="Envoyer"]');
await att(3000); console.log('equipe', await p.$eval('.bandeau.erreur', (e) => e.textContent).catch(() => 'ok'));
p = await (await b.createBrowserContext()).newPage(); await connecterPortail(p, 'proprietaire');
await p.goto(B + '/proprietaire/messages?m=' + ID, { waitUntil: 'networkidle0' }); await att(1000); await p.click('.cloche > button'); await att(800);
await p.screenshot({ path: S + '/po-09-reponse.png' }); await b.close();
