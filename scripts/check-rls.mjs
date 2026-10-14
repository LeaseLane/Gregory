// Garde-fou du module-builder (PASSATION : « RLS + politiques dans la même migration ») :
// toute table créée par une migration active la RLS ET reçoit au moins une politique dans le MÊME fichier.
// Les migrations antérieures au 2026-10-13 sont auditées une fois (voir recipe-status) et exemptées ici.
// Usage : node scripts/check-rls.mjs  (code de sortie 1 si une table est sans protection)
import { readdirSync, readFileSync } from 'node:fs';

const DOSSIER = 'supabase/migrations', DEPUIS = '20261013';
const fautes = [];
for (const f of readdirSync(DOSSIER).filter((x) => x.endsWith('.sql') && x.slice(0, 8) >= DEPUIS).sort()) {
  const sql = readFileSync(`${DOSSIER}/${f}`, 'utf8').replace(/--.*$/gm, '');
  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z_]+\.)?"?([a-z_0-9]+)"?/gi)) {
    const schema = (m[1] || 'public.').toLowerCase(), table = m[2].toLowerCase(), nom = schema + table;
    const re = (x) => new RegExp(x.replace('NOM', `(${schema.replace('.', '\\.')})?"?${table}"?`), 'i');
    if (!re('alter\\s+table\\s+NOM\\s+enable\\s+row\\s+level\\s+security').test(sql)) fautes.push(`${f} : ${nom} sans « enable row level security »`);
    if (!re('create\\s+policy\\s+[^;]*?\\son\\s+NOM\\b').test(sql)) fautes.push(`${f} : ${nom} sans politique`);
  }
}
if (fautes.length) { console.error('Tables non protégées :\n  ' + fautes.join('\n  ')); process.exit(1); }
console.log('RLS : toutes les tables des nouvelles migrations sont protégées.');
