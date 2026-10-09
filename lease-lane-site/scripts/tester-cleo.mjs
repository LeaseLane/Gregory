/* Tests du routage de Cléo : node scripts/tester-cleo.mjs
   Charge src/lib/cleo-routage.js tel quel (alias @/ et fichiers .jsx sans JSX) et vérifie chaque cas. */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';

const src = new URL('../src/', import.meta.url);
register('data:text/javascript,' + encodeURIComponent(`
  import { existsSync } from 'node:fs';
  import { fileURLToPath } from 'node:url';
  const SRC = ${JSON.stringify(src.href)};
  export async function resolve(spec, ctx, next) {
    if (spec.startsWith('@/')) {
      for (const ext of ['', '.js', '.jsx']) { const u = new URL(spec.slice(2) + ext, SRC); if (existsSync(fileURLToPath(u)) && ext !== '' ) return { url: u.href, shortCircuit: true }; }
    }
    return next(spec, ctx);
  }
  export async function load(url, ctx, next) {
    if (url.endsWith('.jsx') || url.includes('/src/')) return { ...(await next(url, { ...ctx, format: 'module' })), format: 'module', shortCircuit: true };
    return next(url, ctx);
  }
`));
const { decider } = await import(new URL('lib/cleo-routage.js', src).href);
const { LL_FAQ } = await import(new URL('proto/faq.jsx', src).href);
const { CAS } = await import(new URL('./cas-cleo.mjs', import.meta.url).href);

const resume = d => d.type + (d.k ? ':' + d.k : d.id ? ':' + d.id : d.to ? ':' + d.to : d.aud ? ':' + d.aud : '');
let ok = 0;
const echecs = [];
for (const [texte, pr, attendu] of CAS) {
  const r = resume(decider(texte, pr));
  const bon = Array.isArray(attendu) ? attendu.some(a => r === a || r.startsWith(a)) : (r === attendu || r.startsWith(attendu));
  if (bon) ok++; else echecs.push(`  ✗ [${pr || '—'}] « ${texte} » → ${r}  (attendu ${[].concat(attendu).join(' | ')})`);
}
/* Chaque question de la FAQ, posée telle quelle par son public, doit donner sa propre réponse. */
let nFaq = 0;
for (const [id, f] of Object.entries(LL_FAQ)) {
  for (const pr of f.public === 'proprietaires' ? ['proprio'] : ['locataire', 'prospect']) {
    nFaq++;
    const r = resume(decider(f.q, pr));
    if (r === 'faq:' + id) ok++; else echecs.push(`  ✗ FAQ ${id} [${pr}] « ${f.q} » → ${r}`);
  }
}
console.log(echecs.join('\n'));
console.log(`${ok}/${CAS.length + nFaq} cas corrects (${CAS.length} écrits, ${nFaq} questions de la FAQ)`);
process.exit(echecs.length ? 1 : 0);
