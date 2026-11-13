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
    lignes: document.querySelectorAll('section[aria-label="Par client et par immeuble"] tbody tr').length, alertes: document.querySelectorAll('section[aria-label="Alertes"] > ul > li').length, erreur: document.querySelector('.bandeau.erreur')?.textContent ?? null }));
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

  // 1 bis. onglets groupés, alerte vue puis rouverte, fiche d'un autre client, messages du sélecteur
  const kAlertes = Number(avant.kpis[3]);
  if (kAlertes > 0) {
    await admin.evaluate(() => [...document.querySelectorAll('section[aria-label="Alertes"] button')].find((b) => b.textContent === 'Marquer comme vue').click());
    await admin.waitForFunction((n) => Number(document.querySelectorAll('.kpi b')[3].textContent) === n - 1, { timeout: 60000 }, kAlertes);
    const liens = await admin.evaluate(() => [...document.querySelectorAll('section[aria-label="Alertes"] button')].map((b) => b.textContent));
    verifier(liens.includes('Rouvrir'), `alerte marquée comme vue : le compteur passe de ${kAlertes} à ${kAlertes - 1}, elle est rangée sous « Déjà vues »`);
    await admin.evaluate(() => { document.querySelector('section[aria-label="Alertes"] details').open = true; [...document.querySelectorAll('section[aria-label="Alertes"] button')].find((b) => b.textContent === 'Rouvrir').click(); });
    await admin.waitForFunction((n) => Number(document.querySelectorAll('.kpi b')[3].textContent) === n, { timeout: 60000 }, kAlertes);
    verifier(true, `alerte rouverte : le compteur revient à ${kAlertes}`);
    const lien = await admin.evaluate(() => [...document.querySelectorAll('section[aria-label="Alertes"] > ul button')].map((b) => b.textContent).find((t) => t.startsWith('Voir les ')));
    if (lien) { await admin.evaluate((t) => [...document.querySelectorAll('section[aria-label="Alertes"] > ul button')].find((b) => b.textContent === t).click(), lien);
      await admin.waitForFunction(() => !location.pathname.endsWith('/finances/vue'), { timeout: 60000 }); await new Promise((r) => setTimeout(r, 1500));
      verifier(!(await admin.evaluate(() => document.querySelector('.bandeau.erreur'))), `lien de l'alerte « ${lien} » → ${await admin.evaluate(() => location.pathname)}, immeuble gardé dans le sélecteur`); }
  }
  await admin.goto(`${BASE}/finances/paiements`, { waitUntil: 'networkidle2', timeout: 120000 });
  const onglets = await admin.evaluate(() => ({ haut: [...document.querySelectorAll('nav.onglets .onglet')].map((o) => o.textContent.replace(/\d+$/, '')), actif: document.querySelector('nav.onglets .onglet.actif')?.textContent.replace(/\d+$/, ''),
    sous: [...document.querySelectorAll('nav.sous-espace a')].map((o) => o.textContent.replace(/\d+$/, '')), sousActif: document.querySelector('nav.sous-espace a.actif')?.textContent.replace(/\d+$/, ''),
    uneLigne: new Set([...document.querySelectorAll('nav.onglets .onglet')].map((o) => Math.round(o.getBoundingClientRect().top))).size === 1 }));
  verifier(onglets.haut.length === 5 && onglets.uneLigne && onglets.actif === 'Loyers' && onglets.sousActif === 'Paiements' && onglets.sous.length === 3, `Finances : ${onglets.haut.length} onglets sur une ligne (${onglets.haut.join(', ')}); « ${onglets.actif} » ouvre ${onglets.sous.join(', ')}`);
  const autre = await admin.evaluate((id) => [...document.querySelectorAll('#portee-client option')].find((o) => o.value && o.value !== id && !/essai|test/i.test(o.textContent))?.value, idClient);
  await admin.goto(`${BASE}/clients/proprietaires/${autre}`, { waitUntil: 'networkidle2', timeout: 120000 });
  const fiche = await admin.evaluate(() => ({ erreur: document.querySelector('.bandeau.erreur')?.textContent ?? null, message: document.querySelector('.portee-etat')?.textContent }));
  verifier(!fiche.erreur && /Cette fiche s’affiche en entier/.test(fiche.message ?? ''), `fiche d'un AUTRE client ouverte pendant qu'un client est choisi : affichée, sans erreur (« ${fiche.message} »)`);
  await admin.goto(`${BASE}/ventes/leads`, { waitUntil: 'networkidle2', timeout: 120000 });
  const mVentes = await admin.evaluate(() => document.querySelector('.portee-etat')?.textContent ?? '');
  await admin.goto(`${BASE}/reglages/equipe`, { waitUntil: 'networkidle2', timeout: 120000 });
  const mRegl = await admin.evaluate(() => document.querySelector('.portee-etat')?.textContent ?? '');
  verifier(/prospects et les mandats sans client restent affichés/.test(mVentes) && /ne dépend pas du client choisi/.test(mRegl), `le sélecteur dit vrai : Ventes « ${mVentes} » · Réglages « ${mRegl} »`);
  await ouvrir();

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
  await proprio.evaluate((adr) => [...document.querySelectorAll('section[aria-label="Revenus par immeuble"] button')].find((x) => x.textContent.includes(adr.split(',')[0])).click(), immeuble.adresse);
  await new Promise((r) => setTimeout(r, 400));
  const vent = await proprio.evaluate((adr) => { const s = document.querySelector('section[aria-label="Revenus par immeuble"]'); if (!s) return null;
    const l = [...s.querySelectorAll(':scope > table > tbody > tr')].find((tr) => tr.textContent.includes(adr.split(',')[0])), detail = l?.nextElementSibling;
    return { immeubles: s.querySelectorAll(':scope > table > tbody > tr').length - 1, ligne: l ? [...l.querySelectorAll('td')].slice(1).map((td) => td.textContent) : null, locataires: detail?.querySelectorAll('table tbody tr').length ?? 0,
      large: detail ? detail.querySelector('td').getBoundingClientRect().width / s.querySelector('table').getBoundingClientRect().width : 0 }; }, immeuble.adresse);
  verifier((vent?.locataires ?? 0) > 0 && vent.large > 0.95, `portail propriétaire : le détail des ${vent?.locataires} locataires s'ouvre sur toute la largeur du tableau (${Math.round((vent?.large ?? 0) * 100)} %)`);
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
