// Les portails propriétaire et locataire s'ouvrent sans erreur, page par page (préproduction, lecture seule). Sert de filet après un
// changement qui touche les fonctions de lecture partagées (ex. : la portée client → immeuble de l'administration, qui ne doit rien changer ici).
import puppeteer from 'puppeteer-core';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { connecterPortail } from './connexion-portail.mjs';
const BASE = 'http://localhost:3020', APP = decodeURIComponent(new URL('../src/app/', import.meta.url).pathname);
const lister = (dossier, chemin, out = []) => { for (const f of readdirSync(dossier)) { const p = join(dossier, f); if (statSync(p).isDirectory()) { if (!f.startsWith('[')) lister(p, `${chemin}/${f}`, out); } else if (f === 'page.tsx') out.push(chemin); } return out.sort(); };
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0;
try {
  for (const [espace, groupe, racine] of [['proprietaire', '(proprietaire)/proprietaire', '/proprietaire'], ['samuel', '(locataire)/locataire', '/locataire']]) {
    const ctx = await nav.createBrowserContext(), page = await ctx.newPage(); await page.setViewport({ width: 1440, height: 1000 });
    await connecterPortail(page, espace);
    const routes = lister(join(APP, groupe), racine);
    for (const r of routes) {
      const rep = await page.goto(BASE + r, { waitUntil: 'networkidle2', timeout: 120000 }).catch(() => ({ status: () => 0 }));
      const erreur = await page.evaluate(() => [...document.querySelectorAll('.bandeau.erreur')].map((b) => b.textContent.trim().slice(0, 140)).join(' | ') || (/Application error|Unhandled Runtime Error/.test(document.body.innerText) ? document.body.innerText.slice(0, 140) : ''));
      if (rep.status() >= 400 || rep.status() === 0 || erreur) { echecs++; console.log(`ÉCHEC [${espace}] ${r} → ${rep.status()} ${erreur}`); }
    }
    console.log(`${espace} : ${routes.length} pages ouvertes`);
    await ctx.close();
  }
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : '\nOK');
} finally { await nav.close(); }
process.exit(echecs ? 1 : 0);
