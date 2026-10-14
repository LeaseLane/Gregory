// Serveur MCP des agents, contre la PRÉPRODUCTION (et refus total en production).
// Secret de Cléo : ~/.leaselane-staging-mcp (« cleo:<secret> »); admin de vérification : ~/.leaselane-staging-e2e.
// Usage : node lanceur/scripts/test-mcp.mjs
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
const H = process.env.HOME, B = 'https://wwoapogkerhkowqqvwsu.supabase.co', K = 'sb_publishable_ZxhgH0Gj3ksemRnKq7ckAw_xUBixVPJ';
const PROD = 'https://kdmwfbcziokygfcmjxeq.supabase.co';
const SECRET = readFileSync(H + '/.leaselane-staging-mcp', 'utf8').trim().split(':').slice(1).join(':');
const res = []; const check = (n, ok, i = '') => { res.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (i ? '  — ' + i : '')); };
const mcp = async (corps, jeton = SECRET, base = B) => { const r = await fetch(base + '/functions/v1/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: 'Bearer ' + jeton } : {}) }, body: JSON.stringify(corps) }); return [r.status, await r.json().catch(() => null)]; };
const outil = async (name, args) => { const [, r] = await mcp({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name, arguments: args } }); const t = r?.result?.content?.[0]?.text; let j; try { j = JSON.parse(t); } catch { j = t; } return { erreur: !!r?.result?.isError, j }; };

// Admin de vérification (lit les prospects et le journal).
const [email, pw, sec] = readFileSync(H + '/.leaselane-staging-e2e', 'utf8').trim().split('\n');
const b32 = (s) => { const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = ''; for (const c of s.toUpperCase()) bits += a.indexOf(c).toString(2).padStart(5, '0'); return Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2))); };
const totp = () => { const t = Buffer.alloc(8); t.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000))); const h = createHmac('sha1', b32(sec)).update(t).digest(); const o = h[19] & 15; return String(((h.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0'); };
const api = async (p, o = {}) => { const r = await fetch(B + p, { method: o.method || 'POST', headers: { apikey: K, 'Content-Type': 'application/json', ...(o.tok ? { Authorization: 'Bearer ' + o.tok } : {}) }, body: o.body ? JSON.stringify(o.body) : undefined }); return r.json().catch(() => null); };
const s = await api('/auth/v1/token?grant_type=password', { body: { email, password: pw } }); const u = await api('/auth/v1/user', { tok: s.access_token, method: 'GET' }); const f = u.factors.find((x) => x.status === 'verified');
const ch = await api(`/auth/v1/factors/${f.id}/challenge`, { tok: s.access_token, body: {} }); const tok = (await api(`/auth/v1/factors/${f.id}/verify`, { tok: s.access_token, body: { challenge_id: ch.id, code: totp() } })).access_token;
const liste = await api('/functions/v1/crm-api', { tok, body: { action: 'list' } }); const karim = (liste.prospects || liste).find((x) => x.full_name === 'Karim Beaulieu');

let [st] = await mcp({ jsonrpc: '2.0', id: 1, method: 'initialize' }, null); check('sans secret → refusé', st === 401, st);
[st] = await mcp({ jsonrpc: '2.0', id: 1, method: 'initialize' }, 'mauvais-secret'); check('mauvais secret → refusé', st === 401, st);
[st] = await mcp({ jsonrpc: '2.0', id: 1, method: 'initialize' }, SECRET, PROD); check('production : refus total (aucun agent configuré)', st === 401, st);
let [, r] = await mcp({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } });
check('initialize', !!r?.result?.protocolVersion, r?.result?.serverInfo?.name);
[, r] = await mcp({ jsonrpc: '2.0', id: 2, method: 'tools/list' }); const noms = (r?.result?.tools || []).map((t) => t.name);
check('tools/list : 4 outils, aucune approbation', noms.length === 4 && !noms.some((n) => /approve|reject/.test(n)), noms.join(', '));
const cle = 'test-' + Date.now();
const p1 = await outil('propose-move-prospect-stage', { target_id: karim.id, after: { stage: 'contacted' }, reason: 'M. Beaulieu demande un rappel pour ses 4 logements.', source_type: 'conversation', source_excerpt: 'Pouvez-vous me rappeler demain?', confidence: 70, idempotency_key: cle });
check('propose → en attente', !p1.erreur && p1.j.status === 'pending', JSON.stringify(p1.j).slice(0, 90));
const p2 = await outil('propose-move-prospect-stage', { target_id: karim.id, after: { stage: 'contacted' }, reason: 'M. Beaulieu demande un rappel pour ses 4 logements.', source_type: 'conversation', idempotency_key: cle });
check('même clé → même proposition', p2.j.id === p1.j.id);
const p3 = await outil('propose-move-prospect-stage', { target_id: karim.id, after: { stage: 'lost', notes: 'x' }, reason: 'Champ non permis ajouté.', source_type: 'conversation', idempotency_key: cle + 'b' });
check('champ hors registre → refusé', p3.erreur, typeof p3.j === 'string' ? p3.j : '');
const g = await outil('get-proposal', { id: p1.j.id }); check('get-proposal', !g.erreur && g.j.status === 'pending' && g.j.id === p1.j.id);
const a = await outil('approve-proposal', { id: p1.j.id }); check('approve-proposal → interdit à un agent', a.erreur, typeof a.j === 'string' ? a.j : '');
const jr = await api(`/rest/v1/audit_log?proposal_id=eq.${p1.j.id}&action=eq.proposal.created&select=actor_kind,agent_name,channel`, { tok, method: 'GET' });
check('journal : agent cleo, canal mcp', jr?.[0]?.actor_kind === 'agent' && jr?.[0]?.agent_name === 'cleo' && jr?.[0]?.channel === 'mcp', JSON.stringify(jr?.[0]));
const vue = await api('/rest/v1/rpc/lanceur_propositions', { tok, body: { p_statut: 'pending' } }); check('visible dans « À approuver »', (vue || []).some((x) => x.id === p1.j.id));
console.log(`\n${res.filter(Boolean).length}/${res.length} réussis`);
process.exit(res.every(Boolean) ? 0 : 1);
