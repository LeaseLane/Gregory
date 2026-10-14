// Étanchéité par rôle, contre la PRÉPRODUCTION : chaque rôle d'équipe a exactement ses droits, ne modifie pas
// l'équipe, ne lit pas le journal, et ne voit à l'accueil que ses espaces.
// Comptes : supabase/seed-univers-maquettes.sql (mot de passe : ~/.leaselane-staging-roles, mode 600).
// Secrets TOTP créés au premier passage : ~/.leaselane-staging-roles-totp.json (mode 600).
// Usage : node lanceur/scripts/test-roles.mjs   (Lanceur local sur http://localhost:3020)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import puppeteer from 'puppeteer-core';

const H = process.env.HOME, B = 'https://wwoapogkerhkowqqvwsu.supabase.co', K = 'sb_publishable_ZxhgH0Gj3ksemRnKq7ckAw_xUBixVPJ';
const MDP = readFileSync(H + '/.leaselane-staging-roles', 'utf8').trim();
const FT = H + '/.leaselane-staging-roles-totp.json';
const totps = existsSync(FT) ? JSON.parse(readFileSync(FT, 'utf8')) : {};
const LIRE = (...e) => e.map((x) => x + '.lire');
const ATTENDU = {
  gestionnaire: { espaces: 10, droits: [...LIRE('operations', 'ventes', 'ventes.mandats', 'ventes.location', 'clients', 'immeubles', 'maintenance', 'finances', 'juridique', 'studio', 'ia', 'rapports'),
    'operations.ecrire', 'ventes.mandats.ecrire', 'ventes.location.ecrire', 'clients.ecrire', 'immeubles.ecrire', 'maintenance.ecrire', 'juridique.ecrire', 'studio.ecrire'] },
  location: { espaces: 4, droits: [...LIRE('operations', 'ventes', 'ventes.location', 'immeubles', 'clients'), 'ventes.location.ecrire', 'immeubles.ecrire'] },
  prospection: { espaces: 2, droits: [...LIRE('ventes', 'ventes.mandats', 'ventes.prospection', 'clients'), 'ventes.mandats.ecrire', 'ventes.prospection.ecrire'] },
  comptabilite: { espaces: 2, droits: [...LIRE('finances', 'rapports'), 'finances.ecritures.ecrire'] },
  lecture: { espaces: 10, droits: LIRE('operations', 'ventes', 'clients', 'immeubles', 'maintenance', 'finances', 'juridique', 'studio', 'ia', 'rapports') },
};

const b32 = (s) => { const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const c of s.toUpperCase()) bits += a.indexOf(c).toString(2).padStart(5, '0'); return Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2))); };
const totp = (sec, decal = 0) => { const t = Buffer.alloc(8); t.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + decal)); const h = createHmac('sha1', b32(sec)).update(t).digest(); const o = h[19] & 15; return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0'); };
const call = async (p, { tok, method = 'POST', body } = {}) => { const r = await fetch(B + p, { method, headers: { apikey: K, 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }); const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; } return [r.status, j]; };
const res = []; const check = (nom, ok, info = '') => { res.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + nom + (info ? '  — ' + info : '')); };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const nav = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, defaultViewport: { width: 1440, height: 1024 } });
for (const [role, att] of Object.entries(ATTENDU)) {
  const courriel = `equipe-${role}@leaselane.test`;
  const [, s] = await call('/auth/v1/token?grant_type=password', { body: { email: courriel, password: MDP } });
  if (!s.access_token) { check(`${role} : connexion`, false, JSON.stringify(s).slice(0, 120)); continue; }
  // 2FA : inscrite une fois, secret gardé localement.
  const fs = (await call('/auth/v1/user', { tok: s.access_token, method: 'GET' }))[1].factors || [];
  for (const f of fs) if (f.status !== 'verified') await call(`/auth/v1/factors/${f.id}`, { tok: s.access_token, method: 'DELETE' });
  let f = fs.find((x) => x.status === 'verified');
  if (!f || !totps[role]) { const [, n] = await call('/auth/v1/factors', { tok: s.access_token, body: { factor_type: 'totp', friendly_name: 'tests-' + role } }); f = n; totps[role] = n.totp.secret; writeFileSync(FT, JSON.stringify(totps), { mode: 0o600 }); }
  const [, ch] = await call(`/auth/v1/factors/${f.id}/challenge`, { tok: s.access_token, body: {} });
  const [, v] = await call(`/auth/v1/factors/${f.id}/verify`, { tok: s.access_token, body: { challenge_id: ch.id, code: totp(totps[role]) } });
  const tok = v.access_token;

  const [, moi] = await call('/rest/v1/rpc/lanceur_moi', { tok, body: {} });
  const recus = [...(moi?.permissions || [])].sort(), voulus = [...att.droits].sort();
  check(`${role} : rôle et droits exacts`, moi?.role === role && JSON.stringify(recus) === JSON.stringify(voulus), `${moi?.role} · ${recus.length} droits`);
  check(`${role} : pas de routeur IA ni d'équipe`, !recus.includes('ia.routeur') && !recus.includes('reglages.equipe'));
  const [, eq] = await call('/rest/v1/rpc/lanceur_equipe', { tok, body: {} }); const lui = (eq || []).find((m) => m.display_name);
  const [st] = await call('/rest/v1/rpc/lanceur_maj_membre', { tok, body: { p: { user_id: lui?.user_id, read_version: lui?.updated_at, display_name: 'Intrusion' } } });
  check(`${role} : ne modifie pas l'équipe`, st === 403, st);
  const [sj, j] = await call('/rest/v1/audit_log?select=id&limit=1', { tok, method: 'GET' });
  const litJournal = role === 'gestionnaire'; // modele-donnees.md § 7 : admin et gestionnaire
  check(`${role} : ${litJournal ? 'lit' : 'ne lit pas'} le journal`, sj === 200 && Array.isArray(j) && (litJournal ? j.length === 1 : j.length === 0), `${sj} · ${Array.isArray(j) ? j.length : '?'} ligne(s)`);

  // Interface : connexion réelle, puis tuiles de l'accueil.
  const ctx = await nav.createBrowserContext(); const p = await ctx.newPage();
  await p.goto('http://localhost:3020/connexion', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.type('#courriel', courriel); await p.type('#mdp', MDP);
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0', timeout: 90000 }), p.click('button[type=submit]')]);
  await p.waitForSelector('.code6-case', { timeout: 60000 }); await p.click('.code6-case:nth-child(1)');
  await pause(1000); await p.keyboard.type(totp(totps[role]), { delay: 40 });
  await p.waitForSelector('.espaces', { timeout: 90000 }).catch(() => {});
  const tuiles = await p.$$eval('.espace h2', (e) => e.map((x) => x.textContent));
  const ini = await p.$eval('.haut-moi', (e) => e.textContent).catch(() => '?');
  check(`${role} : accueil = ${att.espaces} espace(s)`, tuiles.length === att.espaces, `${tuiles.join(', ')} · profil ${ini}`);
  await ctx.close();
}
await nav.close();
console.log(`\n${res.filter(Boolean).length}/${res.length} réussis`);
process.exit(res.every(Boolean) ? 0 : 1);
