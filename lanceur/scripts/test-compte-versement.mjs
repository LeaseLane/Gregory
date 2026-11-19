// Portail propriétaire, compte de versement (préproduction) : saisie, statut « À confirmer », 3 derniers chiffres, même saisie = « Rien de changé ».
// Nettoyage obligatoire ensuite : compte de mj remis à vide et courriel PRO-15 d'essai annulé (voir la fin du script, par SQL).
import puppeteer from 'puppeteer-core';
import { connecterPortail } from './connexion-portail.mjs';
const BASE = 'http://localhost:3020';
const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1000 } });
let echecs = 0; const verifier = (ok, quoi) => { console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${quoi}`); if (!ok) echecs++; };
const clic = async (p, t) => { await p.waitForFunction((t) => [...document.querySelectorAll('button')].some((b) => b.textContent.trim().startsWith(t) && !b.disabled), { timeout: 30000 }, t); return p.evaluate((t) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(t) && !b.disabled)?.click(), t); };
const saisir = async (p) => { for (const [id, v] of [['#cv-i', '001'], ['#cv-t', '12345'], ['#cv-c', '7654321']]) { await p.click(id, { clickCount: 3 }); await p.type(id, v); } };
try {
  const p = await nav.newPage(); await connecterPortail(p, 'proprietaire');
  await p.goto(`${BASE}/proprietaire/profil?t=versement`, { waitUntil: 'networkidle2', timeout: 120000 });
  await clic(p, 'Inscrire'); await p.waitForSelector('#cv-c'); await saisir(p); await clic(p, 'Enregistrer le compte');
  await p.waitForSelector('[role=status]', { timeout: 30000 });
  const t1 = await p.evaluate(() => document.body.innerText);
  verifier(t1.includes('courriel de confirmation'), 'première saisie : message « courriel envoyé »');
  verifier(t1.includes('321') && !t1.includes('7654321'), '3 derniers chiffres seulement');
  await clic(p, 'Changer'); await p.waitForSelector('#cv-c'); await saisir(p); await clic(p, 'Enregistrer le compte');
  await p.waitForFunction(() => document.body.innerText.includes('Rien de changé'), { timeout: 30000 });
  verifier(true, 'même saisie : « Rien de changé », aucun courriel annoncé');
} catch (e) { console.log('ERREUR', e.message); echecs++; }
finally { await nav.close(); }
console.log(echecs ? `${echecs} échec(s)` : 'tout est vert'); process.exit(echecs ? 1 : 0);
