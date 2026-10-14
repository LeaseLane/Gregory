// Ouvre une session de portail réelle (préproduction) : propriétaire (mj.berube, 2FA inscrite au besoin) ou locataire (preprod-locataire).
import { readFileSync, writeFileSync } from 'node:fs';
import { MDP, TOTP, totp } from './connexion-role.mjs';
const H = process.env.HOME, FICHIER_TOTP = H + '/.leaselane-staging-roles-totp.json';
const COMPTES = { proprietaire: ['mj.berube@leaselane.test', () => MDP, 'mj'], locataire: ['preprod-locataire@leaselane.test', () => readFileSync(H + '/.leaselane-staging-locataire', 'utf8').trim(), 'locataire'] };
export async function connecterPortail(page, espace, base = 'http://localhost:3020') {
  const [courriel, mdp, cle] = COMPTES[espace];
  let secret = TOTP[cle];
  page.on('response', async (r) => { if (r.url().includes('/auth/v1/factors') && r.request().method() === 'POST') { const j = await r.json().catch(() => null); if (j?.totp?.secret) secret = j.totp.secret; } });
  await page.goto(`${base}/espace/connexion?p=${espace}`, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.type('#courriel', courriel); await page.type('#mdp', mdp());
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 90000 }), page.click('button[type=submit]')]);
  if (page.url().includes('/espace/2fa')) {                       // inscription du facteur, puis on garde le secret pour les prochains essais
    await page.waitForSelector('.qr img', { timeout: 60000 }); await new Promise((r) => setTimeout(r, 800));
    const tous = JSON.parse(readFileSync(FICHIER_TOTP, 'utf8')); tous[cle] = secret; writeFileSync(FICHIER_TOTP, JSON.stringify(tous, null, 2), { mode: 0o600 });
  } else if (!page.url().includes('/espace/code')) return;          // locataire sans facteur : déjà dans son espace
  await page.waitForSelector('.code6-case', { timeout: 60000 }); await page.click('.code6-case:nth-child(1)');
  await page.keyboard.type(totp(secret), { delay: 40 });
  await page.waitForFunction(() => /\/(proprietaire|locataire)/.test(location.pathname), { timeout: 90000 });
}
