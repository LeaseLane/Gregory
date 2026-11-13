// Phase 1 · finance par client et par immeuble (préproduction). Le parcours complet :
// 1. Finances › Vue d'ensemble pour tous les clients, puis pour le client de démonstration (Marie-Josée Bérubé), puis un immeuble;
// 2. l'équipe inscrit un revenu de stationnement sur cet immeuble : il paraît dans la vue et dans le total;
// 3. la propriétaire le retrouve dans sa finance, ventilé par immeuble, service et locataire; 4. le revenu d'essai est retiré.
// Usage : node scripts/test-phase1-finance.mjs [dossier des captures]
import puppeteer from 'puppeteer-core';
import { connecter } from './connexion-role.mjs';
import { connecterPortail } from './connexion-portail.mjs';
const BASE = 'http://localhost:3020', CAP = process.argv[2], NOTE = `essai-phase1-${Date.now()}`;
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1100 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const photo = async (page, nom) => CAP && page.screenshot({ path: `${CAP}/${nom}.png`, fullPage: true });
const nombre = (t) => Number((t ?? '').replace(/[^\d,-]/g, '').replace(',', '.'));
try {
  const admin = await nav.newPage();
  await connecter(admin, 'admin');
  const ouvrir = async () => { await admin.goto(`${BASE}/finances/vue`, { waitUntil: 'networkidle2', timeout: 120000 }); await admin.waitForSelector('.kpis', { timeout: 60000 }); };
  const lire = () => admin.evaluate(() => ({ kpis: [...document.querySelectorAll('.kpi b')].map((b) => b.textContent), clients: document.querySelectorAll('section[aria-label="Par client et par immeuble"] tbody tr[style]').length,
    lignes: document.querySelectorAll('section[aria-label="Par client et par immeuble"] tbody tr').length, alertes: document.querySelectorAll('section[aria-label="Alertes"] li').length, erreur: document.querySelector('.bandeau.erreur')?.textContent ?? null }));
  await ouvrir(); const tous = await lire(); await photo(admin, 'p1-vue-tous');
  verifier(!tous.erreur && tous.clients > 1, `vue d'ensemble, tous les clients : ${tous.clients} clients, ${tous.lignes - tous.clients} immeubles, ${tous.alertes} alertes affichées, KPI ${tous.kpis.join(' | ')}`);

  const idClient = await admin.evaluate(() => [...document.querySelectorAll('#portee-client option')].find((o) => o.textContent.includes('Bérubé'))?.value);
  verifier(!!idClient, 'Marie-Josée Bérubé est dans le sélecteur de client');
  await admin.select('#portee-client', idClient); await admin.waitForFunction(() => document.querySelectorAll('section[aria-label="Par client et par immeuble"] tbody tr[style]').length === 1, { timeout: 60000 });
  const client = await lire(); await photo(admin, 'p1-vue-client');
  verifier(client.clients === 1 && nombre(client.kpis[0]) <= nombre(tous.kpis[0]), `un client choisi : 1 client, ${client.lignes - 1} immeubles, KPI ${client.kpis.join(' | ')}`);

  const immeuble = await admin.evaluate(() => { const o = [...document.querySelectorAll('#portee-immeuble option')].filter((x) => x.value)[0]; return { id: o.value, adresse: o.textContent }; });
  await admin.select('#portee-immeuble', immeuble.id); await admin.waitForFunction(() => document.querySelectorAll('section[aria-label="Par client et par immeuble"] tbody tr').length === 2, { timeout: 60000 });
  const avant = await lire(); await photo(admin, 'p1-vue-immeuble');
  verifier(avant.lignes === 2, `un immeuble choisi (${immeuble.adresse}) : 1 ligne d'immeuble, KPI ${avant.kpis.join(' | ')}`);

  // 2. un revenu de stationnement de 120 $
  await admin.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Inscrire un revenu')).click());
  await admin.waitForSelector('#rev-m'); await admin.type('#rev-m', '120,00'); await admin.type('#rev-n', NOTE);
  verifier(await admin.$eval('#rev-i', (s) => !!s.value), 'la fenêtre propose déjà l’immeuble choisi');
  await admin.evaluate(() => [...document.querySelectorAll('.fenetre button')].find((b) => b.textContent === 'Inscrire').click());
  await admin.waitForFunction((n) => document.body.innerText.includes(n), { timeout: 60000 }, NOTE);
  const apres = await lire(); await photo(admin, 'p1-vue-apres-revenu');
  verifier(Math.abs(nombre(apres.kpis[0]) - nombre(avant.kpis[0]) - 120) < 0.5 && Math.abs(nombre(apres.kpis[2]) - nombre(avant.kpis[2]) - 120) < 0.5, `revenu de 120 $ inscrit : revenus perçus ${avant.kpis[0]} → ${apres.kpis[0]}, net ${avant.kpis[2]} → ${apres.kpis[2]}`);

  // 3. la propriétaire le voit
  const ctx = await nav.createBrowserContext(), proprio = await ctx.newPage(); await proprio.setViewport({ width: 1440, height: 1100 });
  await connecterPortail(proprio, 'proprietaire');
  await proprio.goto(`${BASE}/proprietaire/finance?m=${new Date().toISOString().slice(0, 7)}`, { waitUntil: 'networkidle2', timeout: 120000 });
  const vent = await proprio.evaluate((adr) => { const s = document.querySelector('section[aria-label="Revenus par immeuble"]'); if (!s) return null;
    const l = [...s.querySelectorAll('tbody tr')].find((tr) => tr.textContent.includes(adr.split(',')[0])); return { immeubles: s.querySelectorAll('tbody tr').length, ligne: l ? [...l.querySelectorAll('td')].slice(1).map((td) => td.textContent) : null, locataires: l?.querySelectorAll('li').length ?? 0 }; }, immeuble.adresse);
  await proprio.evaluate(() => document.querySelectorAll('section[aria-label="Revenus par immeuble"] details').forEach((d, i) => { if (i === 0) d.open = true; }));
  if (CAP) await proprio.screenshot({ path: `${CAP}/p1-proprietaire-finance.png`, fullPage: true });
  // le total que voit la propriétaire pour cet immeuble = les revenus perçus que voit l'équipe, revenu d'essai compris
  verifier(!!vent?.ligne && nombre(vent.ligne[1]) >= 120 && Math.abs(nombre(vent.ligne[4]) - nombre(apres.kpis[0])) < 1, `portail propriétaire : « Revenus par immeuble » (${vent?.immeubles} lignes); ${immeuble.adresse} → loyers ${vent?.ligne?.[0]}, stationnement ${vent?.ligne?.[1]}, total ${vent?.ligne?.[4]}, ${vent?.locataires} locataires détaillés`);
  await ctx.close();

  // 4. ménage : le revenu d'essai est retiré
  await admin.evaluate((n) => [...document.querySelectorAll('section[aria-label="Autres revenus du mois"] tbody tr')].find((tr) => tr.textContent.includes(n)).querySelector('button').click(), NOTE);
  await admin.waitForFunction((n) => !document.querySelector('section[aria-label="Autres revenus du mois"]')?.textContent.includes(n), { timeout: 60000 }, NOTE);
  const fin = await lire();
  verifier(Math.abs(nombre(fin.kpis[0]) - nombre(avant.kpis[0])) < 0.5, `revenu d'essai retiré : revenus perçus revenus à ${fin.kpis[0]}`);
  await admin.evaluate(() => [...document.querySelectorAll('.portee button')].find((b) => b.textContent.includes('Voir tous les clients'))?.click());
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : '\nOK');
} finally { await nav.close(); }
process.exit(echecs ? 1 : 0);
