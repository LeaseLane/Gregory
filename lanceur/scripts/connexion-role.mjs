// Ouvre une session Lanceur réelle pour un compte de rôle (préproduction), pour les tests d'interface.
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
const H = process.env.HOME;
export const MDP = readFileSync(H + '/.leaselane-staging-roles', 'utf8').trim();
export const TOTP = JSON.parse(readFileSync(H + '/.leaselane-staging-roles-totp.json', 'utf8'));
const b32 = (s) => { const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const c of s.toUpperCase()) bits += a.indexOf(c).toString(2).padStart(5, '0'); return Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2))); };
export const totp = (sec) => { const t = Buffer.alloc(8); t.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000))); const h = createHmac('sha1', b32(sec)).update(t).digest(); const o = h[19] & 15; return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0'); };
export async function connecter(page, role, base = 'http://localhost:3020') {
  await page.goto(base + '/connexion', { waitUntil: 'networkidle0', timeout: 90000 });
  await page.type('#courriel', `equipe-${role}@leaselane.test`); await page.type('#mdp', MDP);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 90000 }), page.click('button[type=submit]')]);
  await page.waitForSelector('.code6-case', { timeout: 60000 }); await page.click('.code6-case:nth-child(1)');
  await page.keyboard.type(totp(TOTP[role]), { delay: 40 });
  await page.waitForSelector('.espaces', { timeout: 90000 });
}
