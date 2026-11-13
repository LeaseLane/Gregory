// Sélecteur client → immeuble (phase 1, D01) : chaque page de l'administration s'ouvre sans erreur pour « tous les clients »,
// pour un client, puis pour un de ses immeubles. Préproduction, lecture seule. Usage : node scripts/test-portee.mjs [dossier des captures]
import puppeteer from 'puppeteer-core';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { connecter } from './connexion-role.mjs';
const BASE = 'http://localhost:3020', RACINE = new URL('../src/app/(lanceur)/', import.meta.url).pathname.replace(/%20/g, ' '), CAPTURES = process.argv[2];
const routes = [];
(function lister(dossier, chemin) {
  for (const f of readdirSync(dossier)) {
    const p = join(dossier, f);
    if (statSync(p).isDirectory()) { if (!f.startsWith('[')) lister(p, `${chemin}/${f}`); }   // les fiches ([id]) demandent un identifiant : hors de ce balayage
    else if (f === 'page.tsx') routes.push(chemin || '/');
  }
})(decodeURIComponent(RACINE), '');
const FERMEES = ['/maintenance/catalogue'];   // page fermée par un drapeau (lib/drapeaux.ts) : 404 voulu
routes.sort(); for (const f of FERMEES) { const i = routes.indexOf(f); if (i >= 0) routes.splice(i, 1); }
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0;
try {
  const page = await nav.newPage();
  await connecter(page, 'admin');
  const options = await page.evaluate(async () => {
    const s = [...document.querySelectorAll('#portee-client option')].filter((o) => o.value).map((o) => ({ id: o.value, nom: o.textContent }));
    return s;
  });
  if (!options.length) throw new Error('Le sélecteur de client est absent de l’accueil.');
  // le client qui a le plus d'immeubles : lu dans le sélecteur lui-même
  let client = null, immeubles = [];
  for (const o of options) {
    await page.select('#portee-client', o.id); await page.waitForFunction((id) => document.querySelector('#portee-client')?.value === id && !document.querySelector('.portee[aria-busy="true"]'), { timeout: 30000 }, o.id);
    await new Promise((r) => setTimeout(r, 400));
    const im = await page.evaluate(() => [...document.querySelectorAll('#portee-immeuble option')].filter((x) => x.value).map((x) => ({ id: x.value, adresse: x.textContent })));
    if (im.length > immeubles.length) { client = o; immeubles = im; }
  }
  console.log(`${routes.length} pages · client d’essai : ${client.nom} (${immeubles.length} immeubles) · immeuble : ${immeubles[0].adresse}`);
  const etats = [['tous', ''], ['client', client.id], ['immeuble', `${client.id}:${immeubles[0].id}`]];
  const lignes = [];
  for (const [nom, valeur] of etats) {
    await page.setCookie({ name: 'll_portee', value: valeur, url: BASE });
    if (!valeur) await page.deleteCookie({ name: 'll_portee', url: BASE });
    for (const r of routes) {
      const rep = await page.goto(BASE + r, { waitUntil: 'networkidle2', timeout: 120000 }).catch((e) => ({ status: () => 0, erreur: e.message }));
      const etat = await page.evaluate(() => ({
        erreur: [...document.querySelectorAll('.bandeau.erreur')].map((b) => b.textContent.trim().slice(0, 160)).join(' | ') || (/Application error|Unhandled Runtime Error|Une erreur est survenue/.test(document.body.innerText) ? document.body.innerText.slice(0, 160) : ''),
        lignes: document.querySelectorAll('table tbody tr').length, selecteur: document.querySelector('#portee-client')?.value ?? null, url: location.pathname }));
      const ko = rep.status() >= 400 || rep.status() === 0 || !!etat.erreur || (etat.selecteur !== null && etat.selecteur !== valeur.split(':')[0]);
      if (ko) { echecs++; console.log(`ÉCHEC [${nom}] ${r} → ${rep.status()} ${etat.url} ${etat.erreur || (etat.selecteur !== valeur.split(':')[0] ? 'sélecteur désaligné' : '')}`); }
      lignes.push({ nom, r, n: etat.lignes });
      if (CAPTURES && ['/finances/paiements', '/immeubles', '/clients/proprietaires'].includes(r)) await page.screenshot({ path: `${CAPTURES}/portee-${nom}${r.replace(/\//g, '-')}.png` });
    }
  }
  // La portée doit réduire les listes là où il y a des données par client.
  for (const r of ['/immeubles', '/clients/proprietaires', '/clients/locataires', '/finances/paiements', '/maintenance/bons']) {
    const n = (e) => lignes.find((l) => l.nom === e && l.r === r)?.n ?? -1;
    console.log(`${r} : ${n('tous')} lignes → client ${n('client')} → immeuble ${n('immeuble')}`);
  }
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : `\nOK : ${routes.length} pages × 3 portées, aucune erreur`);
} finally { await nav.close(); }
process.exit(echecs ? 1 : 0);
