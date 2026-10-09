/* Élagage des modules convertis : ne garde que les déclarations atteignables depuis les racines (pages retenues + gabarit).
   Usage : node elaguer.mjs <dossier proto> <racines.json>
   racines.json : [["module", "nomExporté"], …] ; les instructions à effet de bord d'un module atteint sont gardées. */
import fs from 'node:fs';
import path from 'node:path';
import {parse} from '@babel/parser';
import traverseM from '@babel/traverse';
import generateM from '@babel/generator';
import * as t from '@babel/types';
const traverse = traverseM.default || traverseM;
const generate = generateM.default || generateM;

const [, , DIR, RAC] = process.argv;
const racines = JSON.parse(fs.readFileSync(RAC, 'utf8'));
const mods = new Map();
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.jsx'))) {
  const code = fs.readFileSync(path.join(DIR, f), 'utf8');
  const ast = parse(code, {sourceType: 'module', plugins: ['jsx']});
  mods.set(f.replace(/\.jsx$/, ''), {f, code, ast});
}
/* Analyse : déclarations de niveau module, références, imports, exports. */
for (const [nom, m] of mods) {
  m.decl = new Map();      // local -> {stmt, refs:Set(local)}
  m.imports = new Map();   // local -> {mod, nom}
  m.exports = new Map();   // nomExporté -> local
  m.effets = [];           // instructions à effet de bord : {stmt, refs}
  traverse(m.ast, {Program(pp) {
    const refsDe = p => { const r = new Set(); p.traverse({
      Identifier(q) { if (q.isReferencedIdentifier() || q.parentPath.isExportSpecifier()) { const b = q.scope.getBinding(q.node.name); if (b && b.scope === pp.scope) r.add(q.node.name); } },
      JSXIdentifier(q) { const b = q.scope.getBinding(q.node.name); if (b && b.scope === pp.scope) r.add(q.node.name); },
    }); return r; };
    for (const st of pp.get('body')) {
      const n = st.node;
      if (st.isImportDeclaration()) {
        const src = n.source.value;
        for (const sp of n.specifiers) {
          if (t.isImportSpecifier(sp)) m.imports.set(sp.local.name, {mod: src, nom: sp.imported.name});
          else if (t.isImportDefaultSpecifier(sp)) m.imports.set(sp.local.name, {mod: src, nom: 'default'});
          else if (t.isImportNamespaceSpecifier(sp)) m.imports.set(sp.local.name, {mod: src, nom: '*'});
        }
        continue;
      }
      if (st.isExportNamedDeclaration() && !n.declaration) { for (const sp of n.specifiers) m.exports.set(t.isIdentifier(sp.exported) ? sp.exported.name : sp.exported.value, sp.local.name); continue; }
      if (st.isFunctionDeclaration() || st.isClassDeclaration()) { m.decl.set(n.id.name, {stmt: n, refs: refsDe(st)}); continue; }
      if (st.isVariableDeclaration()) {
        const ds = st.get('declarations');
        /* Un déclarateur = une entrée; une déclaration à plusieurs déclarateurs est découpée à l'écriture. */
        for (const dp of ds) {
          const noms = Object.keys(t.getBindingIdentifiers(dp.node.id));
          const refs = refsDe(dp);
          const info = {stmt: n, dec: dp.node, refs, noms};
          noms.forEach(x => m.decl.set(x, info));
        }
        continue;
      }
      if (st.isExpressionStatement() && t.isStringLiteral(n.expression)) continue; // directive
      m.effets.push({stmt: n, refs: refsDe(st)});
    }
    pp.stop();
  }});
}
const modDe = src => src.startsWith('@/proto/') ? src.slice(8) : null;
/* Parcours. */
const vivants = new Map(); // mod -> Set(local)
const modsVivants = new Set();
const file = [];
const marquerLocal = (mod, local) => {
  const m = mods.get(mod); if (!m) return;
  if (!vivants.has(mod)) vivants.set(mod, new Set());
  const s = vivants.get(mod);
  if (s.has(local)) return; s.add(local);
  file.push([mod, local]);
};
const marquerModule = mod => {
  if (modsVivants.has(mod) || !mods.has(mod)) return;
  modsVivants.add(mod);
  for (const e of mods.get(mod).effets) for (const r of e.refs) marquerLocal(mod, r);
};
const marquerExport = (mod, nom) => {
  const m = mods.get(mod); if (!m) return;
  marquerModule(mod);
  if (nom === '*') { for (const [, l] of m.exports) marquerLocal(mod, l); return; }
  const l = m.exports.get(nom);
  if (l) marquerLocal(mod, l); else console.warn('export introuvable', mod, nom);
};
for (const [mod, nom] of racines) marquerExport(mod, nom);
while (file.length) {
  const [mod, local] = file.pop();
  const m = mods.get(mod);
  if (m.imports.has(local)) { const im = m.imports.get(local); const dm = modDe(im.mod); if (dm) marquerExport(dm, im.nom); continue; }
  const d = m.decl.get(local);
  if (!d) continue;
  for (const r of d.refs) marquerLocal(mod, r);
  if (d.noms) d.noms.forEach(x => marquerLocal(mod, x));
}
/* Réécriture. */
let suppr = 0, gardes = 0, retires = [];
for (const [mod, m] of mods) {
  if (!modsVivants.has(mod)) { fs.unlinkSync(path.join(DIR, m.f)); retires.push(mod); continue; }
  const s = vivants.get(mod) || new Set();
  traverse(m.ast, {Program(pp) {
    for (const st of pp.get('body')) {
      const n = st.node;
      if (st.isImportDeclaration()) {
        const sp = n.specifiers.filter(x => s.has(x.local.name));
        const src = n.source.value;
        if (!sp.length && src !== 'react') { st.remove(); continue; }
        if (src === 'react' && !sp.length) continue;
        n.specifiers = sp; continue;
      }
      if (st.isExportNamedDeclaration() && !n.declaration) {
        n.specifiers = n.specifiers.filter(x => s.has(x.local.name));
        if (!n.specifiers.length) st.remove();
        continue;
      }
      if (st.isFunctionDeclaration() || st.isClassDeclaration()) { if (!s.has(n.id.name)) { st.remove(); suppr++; } else gardes++; continue; }
      if (st.isVariableDeclaration()) {
        n.declarations = n.declarations.filter(dc => { const noms = Object.keys(t.getBindingIdentifiers(dc.id)); const ok = noms.some(x => s.has(x)); if (!ok) suppr++; else gardes++; return ok; });
        if (!n.declarations.length) st.remove();
        continue;
      }
    }
    pp.stop();
  }});
  const out = generate(m.ast, {comments: true, jsescOption: {minimal: true}}).code;
  fs.writeFileSync(path.join(DIR, m.f), out + '\n');
}
console.log('Modules gardés :', modsVivants.size, '· retirés :', retires.length, '· déclarations gardées :', gardes, '· supprimées :', suppr);
fs.writeFileSync(path.join(path.dirname(RAC), 'elagage.json'), JSON.stringify({gardes: [...modsVivants], retires}, null, 1));
