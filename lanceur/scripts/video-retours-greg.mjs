// Vidéo « Retours de Greg » (23 nov. 2026) : narration ElevenLabs ~/leaselane-qa/video-retours-greg (index.json), tournage en local
// (version de production du Lanceur, branche retours-greg-23nov, base de préproduction = données de la démo). Une seule prise.
// Préparation : lanceur/scripts/e2e-paiements-preparation.sql + compte vérifié de Marie-Josée (Gregory-tri). Ménage : e2e-paiements-menage.sql,
// ~/leaselane-qa/nettoyage-demo.sql (Essaibail) et les documents « essai QA ».
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { connecter } from './connexion-role.mjs';
const BASE = 'http://localhost:3020', H = process.env.HOME, V = H + '/leaselane-qa/video-retours-greg/', Q = H + '/leaselane-qa/paiements/';
const VOIX = Object.fromEntries(JSON.parse(readFileSync(V + 'index.json', 'utf8')).map((x) => [x.cle, x]));
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 900 } });

// Légende de la réplique (bas d'écran) et curseur visible; la bulle « Insight » d'un outil externe est masquée.
const habiller = (p) => p.evaluateOnNewDocument(() => {
  const poser = () => {
    if (document.getElementById('__leg') || location.protocol === 'about:') return;
    const st = document.createElement('style');
    st.textContent = `#__leg{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);max-width:1100px;background:rgba(12,33,71,.94);color:#fff;font:600 20px/1.4 Poppins,Arial,sans-serif;
      padding:14px 26px;border-radius:12px;z-index:2147483647;box-shadow:0 8px 30px rgba(0,0,0,.25);text-align:center;transition:opacity .3s;pointer-events:none}#__leg:empty{opacity:0}
      #__cur{position:fixed;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(232,93,4,.55);border:2px solid #fff;z-index:2147483647;pointer-events:none;transition:transform .12s}#__cur.clic{transform:scale(.7)}`;
    document.head.appendChild(st);
    const l = document.createElement('div'); l.id = '__leg'; l.textContent = sessionStorage.getItem('__leg') ?? ''; document.body.appendChild(l);
    const c = document.createElement('div'); c.id = '__cur'; c.style.left = sessionStorage.getItem('__x') ?? '720px'; c.style.top = sessionStorage.getItem('__y') ?? '450px'; document.body.appendChild(c);
    addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; sessionStorage.setItem('__x', c.style.left); sessionStorage.setItem('__y', c.style.top); }, true);
    addEventListener('mousedown', () => c.classList.add('clic'), true); addEventListener('mouseup', () => c.classList.remove('clic'), true);
    setInterval(() => { for (const e of document.querySelectorAll('body > *')) if (e.id !== '__leg' && e.id !== '__cur' && /^\s*\d+\s*Insights?\b/.test(e.textContent ?? '') && getComputedStyle(e).position === 'fixed') e.style.display = 'none'; }, 400);
  };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', poser) : poser();
});

let p, T0 = 0, finVoix = 0; const MONTAGE = [];
const dire = async (cle) => {
  if (Date.now() < finVoix) await att(finVoix - Date.now());
  const v = VOIX[cle];
  await p.evaluate((t) => { try { sessionStorage.setItem('__leg', t); } catch {} const l = document.getElementById('__leg'); if (l) l.textContent = t; }, v.texte).catch(() => {});
  MONTAGE.push({ fichier: v.fichier, ms: Date.now() - T0 }); finVoix = Date.now() + v.duree * 1000 + 350;
};
const finir = async () => { if (Date.now() < finVoix) await att(finVoix - Date.now()); };
const viser = async (trouver, arg) => {
  const h = await p.evaluateHandle(trouver, arg); const el = h.asElement(); if (!el) throw new Error('élément introuvable : ' + String(arg ?? trouver));
  await el.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await att(250);
  const b = await el.boundingBox(); await p.mouse.move(b.x + Math.min(b.width / 2, 140), b.y + b.height / 2, { steps: 22 }); await att(300); return el;
};
const cliquer = async (trouver, arg) => { await viser(trouver, arg); await p.mouse.down(); await att(110); await p.mouse.up(); await att(700); };
const bouton = (t, dans = 'body') => [...document.querySelector(dans).querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(t) && !b.disabled);
const aller = async (chemin) => { await p.goto(BASE + chemin, { waitUntil: 'networkidle2', timeout: 120000 }); await att(900); };

// Carte de chapitre aux couleurs de Lease Lane (sans légende : le titre est à l'écran).
const carte = async (surtitre, titre, cle) => {
  await p.evaluate(() => { try { sessionStorage.setItem('__leg', ''); } catch {} });
  await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"><style>
    body{margin:0;height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 70% 30%,#1D3A66 0,#0C2147 60%);font-family:Poppins,Arial,sans-serif;color:#fff}
    .b{text-align:center}.s{font-size:20px;letter-spacing:.22em;text-transform:uppercase;color:#91B5E0;font-weight:600}.t{font-size:64px;font-weight:700;margin:18px 0 0;line-height:1.1}
    .l{width:72px;height:4px;background:#4A7DC0;margin:28px auto 0;border-radius:2px}.m{position:fixed;left:48px;top:40px;font-weight:700;letter-spacing:.08em;font-size:22px}</style></head>
    <body><div class="m">LEASE LANE</div><div class="b"><div class="s">${surtitre}</div><div class="t">${titre}</div><div class="l"></div></div></body></html>`, { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 4000))]));
  await dire(cle); await finir(); await att(300);
};

try {
  p = await nav.newPage(); await habiller(p); p.on('dialog', (d) => d.accept());
  await connecter(p, 'admin');
  await aller('/finances/fideicommis?vue=preparation');   // charge les polices et la session avant de tourner
  const rec = await p.screencast({ path: V + 'prise.webm' }); T0 = Date.now();

  await carte('Retours de Greg · 23 novembre 2026', 'Ce qu’on a réglé', 'i0');

  // 1. Paiements
  await carte('Point 1', 'Paiements du 1<sup style="font-size:.5em">er</sup> décembre', 'p0');
  await aller('/finances/fideicommis?vue=preparation'); await p.waitForSelector('[aria-label="Prêt pour le 1er"] li');
  await dire('p1');
  for (const t of ['Compte en fidéicommis', 'Adresse Interac', 'Compte d’exploitation']) await viser((t) => [...document.querySelectorAll('[aria-label="Prêt pour le 1er"] li')].find((x) => x.innerText.startsWith(t)), t);
  await finir();
  await aller('/finances/fideicommis?vue=depots');
  await dire('p2');
  await (await p.waitForSelector('input[type=file]')).uploadFile(Q + 'releve-e2e-1.csv'); await p.waitForSelector('select.champ-releve');
  await cliquer(bouton, 'Vérifier le relevé'); await p.waitForFunction(() => document.body.innerText.includes('Essai à blanc :'), { timeout: 60000 });
  await cliquer(bouton, 'Importer'); await p.waitForFunction(() => !document.querySelector('.import-releve'), { timeout: 60000 }); await att(1200);
  await p.evaluate(() => { const c = [...document.querySelectorAll('[aria-label="Dépôts du compte"] input[type=checkbox]')][0]; if (c && !c.checked) c.click(); }); await att(1500);
  const ligne = (t) => [...document.querySelectorAll('[aria-label="Dépôts du compte"] tbody tr')].find((r) => r.innerText.includes(t));
  await viser(ligne, 'LL-10005'); await att(600); await viser(ligne, 'LL-10006'); await finir();
  await dire('p3');
  await cliquer((t) => [...document.querySelectorAll('[aria-label="Dépôts du compte"] tbody tr')].find((r) => r.innerText.includes(t))?.querySelector('button.lien[aria-expanded]'), 'LL-10006').catch(async () =>
    cliquer(() => [...document.querySelectorAll('[aria-label="Dépôts du compte"] tbody tr')].find((r) => r.innerText.includes('LL-10006')).querySelectorAll('button')[0]));
  await p.waitForSelector('select[aria-label="Sortie du relevé"]');
  await p.select('select[aria-label="Sortie du relevé"]', await p.evaluate(() => [...document.querySelectorAll('select[aria-label="Sortie du relevé"] option')].find((o) => o.textContent.includes('DEPOT RETOURNE')).value));
  await cliquer(bouton, 'Inscrire le retour'); await p.waitForFunction(() => /Retour inscrit/.test(document.body.innerText), { timeout: 60000 });
  await viser(() => document.querySelector('.bandeau.info')); await finir();
  await aller('/finances/fideicommis?vue=versements');
  await p.$eval('[aria-label="Préparer les versements"] input[type=date]', (i) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(i, '2026-11-23'); i.dispatchEvent(new Event('input', { bubbles: true })); });
  await dire('p4');
  await cliquer(bouton, 'Aperçu'); await att(2500);
  await viser(() => [...document.querySelectorAll('[aria-label="Préparer les versements"] tr')].find((r) => r.innerText.includes('Bérubé')) ?? document.querySelector('[aria-label="Préparer les versements"]'));
  await finir();

  // 2. Marché
  await carte('Point 2', 'Analyse du marché', 'm0');
  await aller('/immeubles/logements'); await p.waitForSelector('table tbody tr');
  await dire('m1');
  await viser(() => [...document.querySelectorAll('table tbody tr')].find((r) => /Limoilou/.test(r.innerText) && /[+−-]\d/.test(r.cells[3]?.innerText ?? '')));
  await att(1500); await viser(() => [...document.querySelectorAll('p')].find((x) => /SCHL, octobre 2025/.test(x.textContent))); await finir();

  // 3. Prospection
  await carte('Point 3', 'Agent de prospection', 'a0');
  await aller('/ventes/prospection');
  await p.waitForFunction(() => document.querySelectorAll('[aria-label="Résultats"] tbody tr').length > 3, { timeout: 90000 });
  await dire('a1');
  await viser(() => document.querySelector('select[aria-label="Trier les résultats"]'));
  const rep = p.waitForResponse((r) => r.url().includes('lanceur_recherche_role') && (r.request().postData() ?? '').includes('"tri":"logements"'), { timeout: 60000 });
  await p.select('select[aria-label="Trier les résultats"]', 'logements'); await rep; await att(800);
  await viser(() => document.querySelector('[aria-label="Résultats"] tbody tr td:nth-child(3)')); await finir();
  await dire('a2');
  await cliquer(() => [...document.querySelectorAll('[aria-label="Propriétaires actifs ou écartés"] button')].find((b) => b.textContent.startsWith('Écartés')));
  await p.waitForFunction(() => /Écarté/.test(document.querySelector('[aria-label="Propriétaire choisi"]')?.innerText ?? ''), { timeout: 90000 });
  await viser(() => document.querySelector('[aria-label="Propriétaire choisi"] .bandeau')); await att(800);
  await viser(() => [...document.querySelectorAll('[aria-label="Propriétaire choisi"] button')].find((b) => b.textContent.startsWith('Rétablir'))); await finir();
  await dire('a3');
  await cliquer(() => [...document.querySelectorAll('[aria-label="Propriétaires actifs ou écartés"] button')].find((b) => b.textContent.startsWith('Actifs')));
  await p.waitForFunction(() => document.querySelectorAll('[aria-label="Résultats"] tbody tr').length > 3, { timeout: 90000 });
  const champ = await p.$('input[placeholder^="Ex. :"]') ?? await p.$('section input[type=text]');
  await champ.click(); await p.keyboard.type('les propriétaires à Montréal de 12 à 100 logements', { delay: 35 });
  await cliquer(bouton, 'Chercher');
  await p.waitForFunction(() => /Montréal/.test(document.querySelector('[aria-label="Résultats"]')?.innerText ?? ''), { timeout: 120000 });
  await viser(() => document.querySelector('[aria-label="Résultats"] h2')); await finir();

  // 4. Clients
  await carte('Point 4', 'Clients', 'c0');
  await aller('/clients/locataires?nouveau=1'); await p.waitForSelector('[role=dialog] input[type=file]');
  await viser(() => document.querySelector('[role=dialog] label.bouton'));
  await (await p.$('[role=dialog] input[type=file]')).uploadFile(H + '/leaselane-qa/captures/bail-essai.pdf');
  await dire('c1');
  for (let i = 0; i < 90; i++) { await att(1000); if (/Bail lu/.test(await p.$eval('[role=dialog]', (d) => d.innerText))) break; }
  await viser(() => document.querySelector('[role=dialog] .bandeau.info')); await finir();
  await dire('c2');
  await cliquer(() => [...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === 'Créer le locataire et le bail'));
  await p.waitForFunction(() => /Bail importé/.test(document.body.innerText), { timeout: 60000 }); await att(600);
  await viser(() => [...document.querySelectorAll('.bandeau.info')].find((b) => /Bail importé/.test(b.textContent))); await finir();
  await aller('/clients/documents');
  await dire('d1');
  await cliquer(bouton, 'Déposer un document'); await p.waitForSelector('[aria-labelledby="dd-t"]');
  await (await p.$('[aria-labelledby="dd-t"] input[type=file]')).uploadFile('/tmp/facture-essai-qa.pdf');
  await p.waitForSelector('[aria-label^="Type de"]'); await viser(() => document.querySelector('[aria-label^="Type de"]'));
  const t = await p.$('[aria-labelledby="dd-t"] input[id^="dd-n"]'); await t.click({ clickCount: 3 }); await t.type('Facture essai QA', { delay: 25 });
  await cliquer(() => document.querySelector('[aria-label="Chercher le client"]')); await p.keyboard.type('Samuel Fortin', { delay: 40 });
  await p.waitForSelector('[aria-label="Clients trouvés"] button', { timeout: 30000 });
  await cliquer(() => [...document.querySelectorAll('[aria-label="Clients trouvés"] button')].find((b) => /Locataire/.test(b.innerText)));
  await cliquer(() => [...document.querySelectorAll('[aria-labelledby="dd-t"] footer button')].find((b) => /^Déposer/.test(b.textContent.trim())));
  await p.waitForFunction(() => /document déposé/.test(document.body.innerText), { timeout: 60000 });
  await viser(() => [...document.querySelectorAll('.bandeau.info')].find((b) => /document déposé/.test(b.textContent))); await finir();

  // 5. Demandes du site
  await carte('Point 5', 'Demandes du site', 's0');
  await aller('/studio/site/demandes'); await p.waitForSelector('[aria-label="Demandes du site"] tbody tr');
  await cliquer(() => document.querySelector('[aria-label="Demandes du site"] tbody tr td button'));
  await p.waitForSelector('.tiroir'); await viser(() => document.querySelector('.tiroir-pied') ?? document.querySelector('.tiroir')); await finir();

  await carte('Prochaine étape', 'Les numéros de BMO', 'f0'); await att(1200);
  await rec.stop();
  writeFileSync(V + 'montage.json', JSON.stringify(MONTAGE));
  console.log('ok', MONTAGE.length, 'répliques', Math.round((Date.now() - T0) / 1000), 's');
} catch (e) { console.log('ERREUR', e.message); await p?.screenshot({ path: '/tmp/video-erreur.png' }).catch(() => {}); }
finally { await nav.close(); }
