// Tests des opérations Lanceur contre la PRÉPRODUCTION (jamais la production).
// Compte : ~/.leaselane-staging-e2e (courriel, mot de passe, secret TOTP; mode 600). Usage : node lanceur/scripts/test-operations.mjs
import { readFileSync, writeFileSync } from 'node:fs'; import { createHmac } from 'node:crypto';
const FICHIER = process.env.HOME + '/.leaselane-staging-e2e';
let [email, pw, secret] = readFileSync(FICHIER, 'utf8').trim().split('\n');
const B = 'https://wwoapogkerhkowqqvwsu.supabase.co', K = 'sb_publishable_ZxhgH0Gj3ksemRnKq7ckAw_xUBixVPJ';
const b32 = (s) => { const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits=''; for (const c of s.toUpperCase()) bits += a.indexOf(c).toString(2).padStart(5,'0'); return Buffer.from(bits.match(/.{8}/g).map(b=>parseInt(b,2))); };
const totp = (sec) => { const t=Buffer.alloc(8); t.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000))); const h=createHmac('sha1',b32(sec)).update(t).digest(); const o=h[19]&15; return String(((h.readUInt32BE(o)&0x7fffffff)%1e6)).padStart(6,'0'); };
const call = async (path, { tok, method = 'POST', body } = {}) => { const r = await fetch(B + path, { method, headers: { apikey: K, 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }); const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; } return [r.status, j]; };
const res = []; const check = (nom, ok, info = '') => { res.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + nom + (info ? '  — ' + info : '')); };

let [, s] = await call('/auth/v1/token?grant_type=password', { body: { email, password: pw } }); const aal1 = s.access_token;
let [st, r] = await call('/rest/v1/rpc/lanceur_maj_membre', { body: { p: {} } }); check('visiteur → refusé', st === 401, st);
[st, r] = await call('/rest/v1/rpc/lanceur_maj_membre', { tok: aal1, body: { p: { user_id: s.user.id, read_version: '2020-01-01', display_name: 'X' } } }); check('mot de passe seul (aal1) → 2FA exigée', st === 403 && /Deuxième facteur/.test(r.message), st + ' ' + r.message);

// 2FA du compte de tests : inscrite une fois, secret gardé dans ~/.leaselane-staging-e2e (mode 600).
let fid;
const facteurs = (await call('/auth/v1/user', { tok: aal1, method: 'GET' }))[1].factors || [];
for (const x of facteurs) if (x.status !== 'verified') await call(`/auth/v1/factors/${x.id}`, { tok: aal1, method: 'DELETE' });
const verifie = facteurs.find(x => x.status === 'verified');
if (verifie && secret) fid = verifie.id;
else { const [, f] = await call('/auth/v1/factors', { tok: aal1, body: { factor_type: 'totp', friendly_name: 'tests-automatiques' } }); fid = f.id; secret = f.totp.secret; writeFileSync(FICHIER, [email, pw, secret].join('\n') + '\n', { mode: 0o600 }); }
let [, ch] = await call(`/auth/v1/factors/${fid}/challenge`, { tok: aal1, body: {} });
let [, v] = await call(`/auth/v1/factors/${fid}/verify`, { tok: aal1, body: { challenge_id: ch.id, code: totp(secret) } }); const tok = v.access_token;
check('2FA de test vérifiée', !!tok);

[st, r] = await call('/rest/v1/rpc/lanceur_equipe', { tok, body: {} }); const moi = (r || []).find(m => m.user_id === s.user.id); check('list-team-members', st === 200 && !!moi, `${(r||[]).length} membre(s)`);
[st, r] = await call('/rest/v1/rpc/lanceur_maj_membre', { tok, body: { p: { user_id: s.user.id, read_version: '2020-01-01T00:00:00Z', display_name: 'Ne doit pas passer' } } }); check('version périmée → 409', st === 409, st + ' ' + r.message);
[st, r] = await call('/rest/v1/rpc/lanceur_maj_membre', { tok, body: { p: { user_id: s.user.id, read_version: moi.updated_at, initials: '1x' } } }); check('initiales invalides → 422', st === 422, r.message);
// (Le retrait d'un admin a été vérifié une fois le 2026-10-14 : journal admin → lecture, puis 403 sur l'équipe. Pas rejoué : il retirerait les droits du compte de tests.)
const moi2 = (await call('/rest/v1/rpc/lanceur_equipe', { tok, body: {} }))[1].find(m => m.user_id === s.user.id);
const nouveauNom = 'Tests automatiques ' + new Date().toISOString().slice(11, 19);
[st, r] = await call('/rest/v1/rpc/lanceur_maj_membre', { tok, body: { p: { user_id: s.user.id, read_version: moi2.updated_at, display_name: nouveauNom, initials: 'ta' } } }); check('mise à jour valide', st === 200 && r.display_name === nouveauNom && r.initials === 'TA', st);
[st, r] = await call('/rest/v1/rpc/lanceur_journal_connexion', { tok, body: {} }); check('record-sign-in', st === 204 || st === 200, st);

[st, r] = await call('/rest/v1/audit_log?operation=in.(update-team-member,record-sign-in)&order=created_at.desc&limit=2&select=action,operation,actor_kind,channel,actor_id,before,after', { tok, method: 'GET' });
const maj = (r || []).find(x => x.operation === 'update-team-member'), cx = (r || []).find(x => x.operation === 'record-sign-in');
check('journal : avant/après de la mise à jour', !!maj && maj.before?.display_name !== maj.after?.display_name && maj.after?.display_name === nouveauNom && maj.actor_kind === 'person' && maj.channel === 'interface' && maj.actor_id === s.user.id, maj ? `${maj.before.display_name} → ${maj.after.display_name}` : 'aucune ligne');
check('journal : connexion inscrite', !!cx && cx.action === 'auth.sign_in');
[st, r] = await call('/rest/v1/audit_log', { tok, body: { actor_type: 'admin', action: 'faux.journal' } }); check('écriture directe au journal → refusée', st >= 400, st);
[st, r] = await call('/rest/v1/rpc/journal', { tok, body: {} }); check('crm.journal inaccessible par l’API', st >= 400, st);

console.log(`\n${res.filter(Boolean).length}/${res.length} réussis`);
