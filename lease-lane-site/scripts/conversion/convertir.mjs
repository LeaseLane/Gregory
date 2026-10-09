/* Convertit les scripts du prototype (globaux partagés, Babel dans le navigateur) en modules ES pour Next.js.
   Sémantique reproduite (scripts classiques compilés en ES5) :
   - chaque nom déclaré au niveau du script et chaque window.X = … est global; la dernière définition gagne;
   - une lecture faite à l'affichage (dans une fonction) voit la définition finale;
   - une lecture faite au chargement (hors fonction) voit la définition précédente dans l'ordre de chargement.
   Usage : node convertir.mjs <dossier prototype> <dossier sortie> */
import fs from 'node:fs';
import path from 'node:path';
import {parse} from '@babel/parser';
import traverseM from '@babel/traverse';
import generateM from '@babel/generator';
import * as t from '@babel/types';
const traverse = traverseM.default || traverseM;
const generate = generateM.default || generateM;

const [, , SRC, OUT] = process.argv;
const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
const EXCLUS = new Set(['../../_ds_bundle.js', 'image-slot.js', 'langue.js', 'traduction-en.js', 'traducteur.js', 'finition.js', 'carrousels-mobile.js', 'centrage-mobile.js']);
const fichiers = [...html.matchAll(/src="([^"]+\.(?:jsx|js))"/g)].map(m => m[1]).filter(s => !s.startsWith('http') && !EXCLUS.has(s));
const DS_NS = 'LeaseLaneDesignSystem_b7a479';
/* Noms fournis par des modules écrits à la main (remplacent le moteur du prototype). */
const MAIN = {naviguer: '@/lib/routeur', useRoute: '@/lib/routeur', useTete: '@/lib/routeur'};
/* Globaux du prototype absents du site principal (sites alternatifs, admin) : valeur undefined. LL_LANGUE vient du module de langue. */
const ABSENTS = new Set(['LL_VUE_SITE', 'PiedSite', 'PageSite', 'PageSiteCouvre', 'LL_ADM', 'PiedRevue__site']);
MAIN.LL_LANGUE = '@/lib/langue';
MAIN.sessionStorage = '@/lib/memoire';
/* Clés de stockage permises (politique des témoins, SB1) : toutes les autres (options de revue) sont neutralisées. */
const CLES_PERMISES = new Set(['ll-cleo-accroche', 'll-temoins']);
const BUILTINS = new Set(('window document navigator location history localStorage sessionStorage console Math JSON Object Array String Number Boolean Date RegExp Error TypeError Promise Map Set WeakMap WeakSet Symbol Intl URL URLSearchParams ' +
  'setTimeout clearTimeout setInterval clearInterval requestAnimationFrame cancelAnimationFrame queueMicrotask fetch FileReader Blob Image Event CustomEvent KeyboardEvent MouseEvent ' +
  'IntersectionObserver ResizeObserver MutationObserver matchMedia getComputedStyle performance crypto atob btoa encodeURIComponent decodeURIComponent encodeURI decodeURI parseInt parseFloat isNaN isFinite ' +
  'undefined NaN Infinity globalThis React ReactDOM Node HTMLElement Element NodeFilter DOMParser structuredClone alert confirm prompt open scrollTo innerWidth innerHeight devicePixelRatio ' +
  'addEventListener removeEventListener dispatchEvent HashChangeEvent getSelection Reflect Proxy BigInt AbortController TextEncoder TextDecoder FormData Headers Request Response DOMRect CSS screen frames self top parent arguments require module exports process').split(/\s+/));

const rapport = {fichiers: {}, inconnus: {}, dynamiques: [], effets: [], conflits: [], hash: [], ordre: [], gardes: [], css: [], initsClient: []};
const nomModule = f => path.basename(f).replace(/\.(jsx|js)$/, '');
const sufx = s => s.replace(/[^A-Za-z0-9]/g, '_');

/* ——— 1. Analyse ——— */
const ana = [];
for (const f of fichiers) {
  const code = fs.readFileSync(path.join(SRC, f), 'utf8');
  let ast;
  try { ast = parse(code, {sourceType: 'script', plugins: ['jsx'], allowReturnOutsideFunction: true}); }
  catch (e) { console.error('ANALYSE', f, e.message); process.exit(1); }
  ana.push({f, code, ast, mod: nomModule(f), fi: ana.length});
}
const estWindow = (n, alias) => t.isIdentifier(n) && (n.name === 'window' || alias.has(n.name));
function estIIFE(st) {
  if (!t.isExpressionStatement(st)) return null;
  let e = st.expression;
  if (t.isUnaryExpression(e) && e.operator === '!') e = e.argument;
  if (!t.isCallExpression(e)) return null;
  const c = e.callee;
  if ((t.isFunctionExpression(c) || t.isArrowFunctionExpression(c)) && t.isBlockStatement(c.body)) return {fn: c, args: e.arguments};
  return null;
}
const estGarde = s => t.isIfStatement(s) && !s.alternate && (t.isReturnStatement(s.consequent) || (t.isBlockStatement(s.consequent) && s.consequent.body.length === 1 && t.isReturnStatement(s.consequent.body[0])));
function aplatir(a) {
  const corps = [], alias = new Set(['W']);
  for (const st of a.ast.program.body) {
    const i = estIIFE(st);
    if (i) {
      i.fn.params.forEach((p, k) => { if (t.isIdentifier(p) && i.args[k] && t.isIdentifier(i.args[k], {name: 'window'})) alias.add(p.name); });
      for (const s of i.fn.body.body) {
        if (t.isReturnStatement(s)) { rapport.conflits.push(a.f + ' : return au niveau IIFE'); continue; }
        /* Garde « dépendance absente → sortir » : inutile avec des imports. */
        if (estGarde(s)) { rapport.gardes.push(a.f + ' : ' + generate(s.test).code.slice(0, 60)); continue; }
        corps.push({s, iife: true});
      }
    } else corps.push({s: st, iife: false});
  }
  for (const {s} of corps) if (t.isVariableDeclaration(s)) for (const d of s.declarations) if (t.isIdentifier(d.init, {name: 'window'}) && t.isIdentifier(d.id)) alias.add(d.id.name);
  return {corps, alias};
}
function nomsDeclares(s) {
  const r = [];
  if (t.isFunctionDeclaration(s) || t.isClassDeclaration(s)) { if (s.id) r.push(s.id.name); }
  else if (t.isVariableDeclaration(s)) for (const d of s.declarations) r.push(...Object.keys(t.getBindingIdentifiers(d.id)));
  return r;
}
const estDS = (n, alias) => t.isMemberExpression(n) && !n.computed && estWindow(n.object, alias) && n.property.name === DS_NS;
/* Affectations window.X (niveau module) d'une expression : [{nom, valeur}] */
function affectations(x, alias) {
  if (t.isAssignmentExpression(x) && x.operator === '=' && t.isMemberExpression(x.left) && !x.left.computed && estWindow(x.left.object, alias) && x.left.property.name !== DS_NS) return [{nom: x.left.property.name, valeur: x.right}];
  if (t.isCallExpression(x) && t.isMemberExpression(x.callee) && t.isIdentifier(x.callee.object, {name: 'Object'}) && x.callee.property.name === 'assign' && estWindow(x.arguments[0], alias) && t.isObjectExpression(x.arguments[1])) {
    const r = [];
    for (const p of x.arguments[1].properties) {
      if (!t.isObjectProperty(p) || p.computed) { rapport.dynamiques.push('Object.assign(window) propriété calculée'); continue; }
      r.push({nom: t.isIdentifier(p.key) ? p.key.name : p.key.value, valeur: p.value});
    }
    return r;
  }
  if (t.isSequenceExpression(x)) { const r = x.expressions.map(e => affectations(e, alias)); return r.every(Boolean) ? r.flat() : null; }
  return null;
}

/* Définitions ordonnées : nom -> [{a, si}] (si = rang de l'instruction; -1 = fonction hissée) */
const defs = new Map();
const ajDef = (nom, a, si) => { if (!defs.has(nom)) defs.set(nom, []); defs.get(nom).push({a, si}); };
for (const a of ana) {
  const {corps, alias} = aplatir(a);
  a.corps = corps; a.alias = alias; a.locaux = new Set(); a.dsNoms = new Set();
  corps.forEach(({s, iife}, si) => {
    s.__idx = si;
    if (t.isVariableDeclaration(s) && s.declarations.length === 1 && estDS(s.declarations[0].init, alias)) return;
    nomsDeclares(s).forEach(n => a.locaux.add(n));
    if (!iife) nomsDeclares(s).forEach(n => { if (!alias.has(n)) ajDef(n, a, t.isFunctionDeclaration(s) ? -1 : si); });
    if (t.isExpressionStatement(s)) { const af = affectations(s.expression, alias); if (af) af.forEach(({nom}) => ajDef(nom, a, si)); }
  });
}
for (const l of defs.values()) l.sort((x, y) => x.a.fi - y.a.fi || x.si - y.si);
const finale = nom => { const l = defs.get(nom); return l ? l[l.length - 1] : null; };
function precedente(nom, a, si) {
  const l = defs.get(nom); if (!l) return null;
  let r = null;
  for (const d of l) if (d.a.fi < a.fi || (d.a === a && d.si < si)) r = d;
  return r;
}

/* ——— 2. Réécriture ——— */
fs.mkdirSync(OUT, {recursive: true});
const dossierStyles = path.join(path.dirname(OUT), 'styles');
fs.mkdirSync(dossierStyles, {recursive: true});
for (const a of ana) {
  const imports = new Map(); // module -> Map(nomImporte -> local)
  const ajImport = (mod, nom, local = nom) => { if (!imports.has(mod)) imports.set(mod, new Map()); imports.get(mod).set(local, nom); };
  let dsNamespace = false;
  const exportsLocaux = new Map(); // local|export -> [local, export]
  const ajExp = (l, e) => exportsLocaux.set(l + '|' + e, [l, e]);
  const defsLocaux = new Map(); // nom global -> [{si, local}]
  const ajDefLocal = (nom, si, local) => { if (!defsLocaux.has(nom)) defsLocaux.set(nom, []); defsLocaux.get(nom).push({si, local}); ajExp(local, nom); };
  let compteur = 0;
  const corps = [];
  for (const {s: s0, iife} of a.corps) {
    let s = s0; const si = s0.__idx;
    if (t.isVariableDeclaration(s)) {
      const garde = s.declarations.filter(d => !(t.isIdentifier(d.id) && a.alias.has(d.id.name) && t.isIdentifier(d.init, {name: 'window'})));
      if (!garde.length) continue;
      if (garde.length !== s.declarations.length) { s = t.variableDeclaration(s.kind, garde); s.__idx = si; }
      /* Déstructuration du système de design (éventuellement mêlée à d'autres déclarateurs). */
      const reste = [];
      for (const d of s.declarations) {
        if (estDS(d.init, a.alias) && t.isObjectPattern(d.id)) {
          for (const p of d.id.properties) {
            if (t.isObjectProperty(p) && t.isIdentifier(p.key) && t.isIdentifier(p.value)) { ajImport('@/components/ds', p.key.name, p.value.name); a.dsNoms.add(p.value.name); a.locaux.delete(p.value.name); }
            else if (t.isObjectProperty(p) && t.isIdentifier(p.key) && t.isAssignmentPattern(p.value)) { ajImport('@/components/ds', p.key.name, p.value.left.name); a.dsNoms.add(p.value.left.name); a.locaux.delete(p.value.left.name); }
            else rapport.dynamiques.push(a.f + ' : motif DS non géré');
          }
        } else reste.push(d);
      }
      if (!reste.length) continue;
      if (reste.length !== s.declarations.length) { s = t.variableDeclaration(s.kind, reste); s.__idx = si; }
    }
    /* Déclarations de niveau script : exportées; renommées si un fichier plus loin les écrase. */
    if (!iife) for (const n of nomsDeclares(s)) {
      const fin = finale(n);
      if (fin && fin.a !== a) {
        const nouveau = n + '__ecrase';
        if (t.isFunctionDeclaration(s) && s.id.name === n) s.id.name = nouveau;
        else if (t.isVariableDeclaration(s)) s.declarations.forEach(d => { if (t.isIdentifier(d.id, {name: n})) d.id.name = nouveau; });
        a.locaux.delete(n); a.locaux.add(nouveau);
        ajDefLocal(n, t.isFunctionDeclaration(s) ? -1 : si, nouveau);
        rapport.conflits.push(a.f + ' : ' + n + ' écrasé par ' + fin.a.f + ' (gardé sous ' + nouveau + ')');
      } else ajDefLocal(n, t.isFunctionDeclaration(s) ? -1 : si, n);
    }
    if (t.isExpressionStatement(s)) {
      const af = affectations(s.expression, a.alias);
      if (af) {
        for (const {nom, valeur} of af) {
          if (t.isIdentifier(valeur) && a.locaux.has(valeur.name)) { ajDefLocal(nom, si, valeur.name); continue; }
          const loc = a.locaux.has(nom) || defsLocaux.has(nom) ? '__exp_' + nom + '_' + (compteur++) : nom;
          const d = t.variableDeclaration('let', [t.variableDeclarator(t.identifier(loc), valeur)]); d.__idx = si;
          corps.push(d); a.locaux.add(loc); ajDefLocal(nom, si, loc);
        }
        continue;
      }
    }
    corps.push(s);
  }

  /* Feuilles de style injectées au chargement (document.createElement('style')) : extraites en fichiers CSS globaux. */
  const constTxt = new Map();
  for (const s of corps) if (t.isVariableDeclaration(s)) for (const d of s.declarations) {
    if (t.isIdentifier(d.id) && t.isTemplateLiteral(d.init) && !d.init.expressions.length) constTxt.set(d.id.name, d.init.quasis.map(q => q.value.cooked).join(''));
    if (t.isIdentifier(d.id) && t.isStringLiteral(d.init)) constTxt.set(d.id.name, d.init.value);
  }
  const corps2 = [];
  let nCss = 0;
  for (const s of corps) {
    const g = (t.isFunctionDeclaration(s) || t.isVariableDeclaration(s)) ? '' : generate(s).code;
    if (g && /createElement\(['"]style['"]\)/.test(g)) {
      let css = null;
      traverse(t.file(t.program([t.cloneNode(s, true)])), {AssignmentExpression(q) {
        const n = q.node;
        if (t.isMemberExpression(n.left) && !n.left.computed && n.left.property.name === 'textContent') {
          const r = n.right;
          if (t.isTemplateLiteral(r)) {
            let ok = true, out = '';
            r.quasis.forEach((qq, i) => { out += qq.value.cooked; const e = r.expressions[i]; if (e) { if (t.isIdentifier(e) && constTxt.has(e.name)) out += constTxt.get(e.name); else if (t.isStringLiteral(e)) out += e.value; else ok = false; } });
            if (ok) css = (css || '') + out + '\n';
          } else if (t.isIdentifier(r) && constTxt.has(r.name)) css = (css || '') + constTxt.get(r.name) + '\n';
        }
      }});
      if (css) { const nom = a.mod + (nCss ? '-' + nCss : '') + '.css'; nCss++; fs.writeFileSync(path.join(dossierStyles, nom), css.split('../../assets/').join('/assets/')); rapport.css.push(nom); continue; }
      (rapport.cssNonExtrait ||= []).push(a.f);
    }
    corps2.push(s);
  }
  const prog = t.program(corps2, [], 'module');
  const file = t.file(prog);
  /* Effets de bord au niveau module qui touchent au navigateur : exécutés seulement côté client. */
  const effets = [];
  prog.body = prog.body.map(s => {
    if (t.isFunctionDeclaration(s) || t.isClassDeclaration(s) || t.isVariableDeclaration(s) || t.isEmptyStatement(s)) return s;
    const g = generate(s).code;
    if (!/\b(document|window|navigator|localStorage|sessionStorage|matchMedia|location|addEventListener|requestAnimationFrame|MutationObserver)\b/.test(g) && ![...a.alias].some(al => new RegExp('\\b' + al + '\\.').test(g))) return s;
    effets.push(g.slice(0, 160));
    const w = t.ifStatement(t.binaryExpression('!==', t.unaryExpression('typeof', t.identifier('window')), t.stringLiteral('undefined')), t.blockStatement([s]));
    w.__idx = s.__idx;
    return w;
  });
  if (effets.length) rapport.effets.push({f: a.f, effets});

  /* Résolution d'un nom global depuis un chemin AST. */
  const rangDe = p => { const top = p.findParent(pp => pp.parentPath && pp.parentPath.isProgram()) || p; return top.node.__idx ?? 1e9; };
  function resoudre(nom, p) {
    const chargement = !p.getFunctionParent();
    const si = rangDe(p);
    const d = chargement ? precedente(nom, a, si) : finale(nom);
    if (!d) return null;
    if (d.a === a) {
      const l = defsLocaux.get(nom) || [];
      const ok = chargement ? l.filter(x => x.si < si) : l;
      const loc = ok.length ? ok[ok.length - 1].local : null;
      if (loc) return {local: loc};
      return null;
    }
    const masque = p.scope.hasBinding(nom) && p.scope.getBinding(nom).kind !== 'module';
    let local = chargement && d !== finale(nom) ? nom + '__' + sufx(d.a.mod) : (masque || a.locaux.has(nom) ? '__g_' + nom : nom);
    if (chargement && d !== finale(nom)) rapport.ordre.push(a.f + ' : ' + nom + ' lu au chargement → version de ' + d.a.f);
    ajImport('@/proto/' + d.a.mod, nom, local);
    return {local};
  }
  const estRefLibre = (p, nom) => !p.scope.hasBinding(nom);

  let usesJSX = false;
  traverse(file, {
    JSXElement() { usesJSX = true; },
    JSXFragment() { usesJSX = true; },
    MemberExpression(p) {
      const n = p.node;
      if (estDS(n, a.alias)) { dsNamespace = true; p.replaceWith(t.identifier('__DS')); return; }
      if (n.computed || !estWindow(n.object, a.alias)) return;
      if (t.isAssignmentExpression(p.parent) && p.parent.left === n) { if (a.alias.has(n.object.name)) n.object = t.identifier('window'); return; }
      if (p.parentPath.isUnaryExpression({operator: 'delete'})) return;
      const nom = n.property.name;
      if (ABSENTS.has(nom)) { p.replaceWith(t.identifier('undefined')); return; }
      if (MAIN[nom]) { ajImport(MAIN[nom], nom); p.replaceWith(t.identifier(nom)); return; }
      const r = defs.has(nom) ? resoudre(nom, p) : null;
      if (r) { p.replaceWith(t.identifier(r.local)); return; }
      if (a.alias.has(n.object.name)) n.object = t.identifier('window');
    },
    JSXMemberExpression(p) {
      const n = p.node;
      if (!t.isJSXIdentifier(n.object) || !(n.object.name === 'window' || a.alias.has(n.object.name))) return;
      const nom = n.property.name;
      const r = defs.has(nom) ? resoudre(nom, p) : null;
      if (r) { p.replaceWith(t.jsxIdentifier(r.local)); return; }
      (rapport.inconnus['window.' + nom] ||= new Set()).add(a.f);
    },
    JSXIdentifier(p) {
      const nom = p.node.name;
      if (!/^[A-Z_$]/.test(nom)) return;
      const par = p.parent;
      const estNom = (t.isJSXOpeningElement(par) || t.isJSXClosingElement(par)) && par.name === p.node;
      const estObj = t.isJSXMemberExpression(par) && par.object === p.node;
      if (!estNom && !estObj) return;
      if (!estRefLibre(p, nom) || BUILTINS.has(nom) || a.dsNoms.has(nom) || nom.includes('__')) return;
      if (MAIN[nom]) { ajImport(MAIN[nom], nom); return; }
      const r = defs.has(nom) ? resoudre(nom, p) : null;
      if (r) { if (r.local !== nom) p.node.name = r.local; return; }
      (rapport.inconnus[nom] ||= new Set()).add(a.f);
    },
    Identifier(p) {
      if (!p.isReferencedIdentifier()) return;
      const nom = p.node.name;
      if (!estRefLibre(p, nom)) return;
      if (a.alias.has(nom) && nom !== 'window') { p.replaceWith(t.identifier('window')); return; }
      if (BUILTINS.has(nom) || a.dsNoms.has(nom) || nom.includes('__')) return;
      if (MAIN[nom]) { ajImport(MAIN[nom], nom); return; }
      const r = defs.has(nom) ? resoudre(nom, p) : null;
      if (r) { if (r.local !== nom) p.replaceWith(t.identifier(r.local)); return; }
      (rapport.inconnus[nom] ||= new Set()).add(a.f);
    },
    StringLiteral(p) {
      const v = p.node.value;
      if (v.startsWith('../../assets/')) p.node.value = v.replace('../../assets/', '/assets/');
      else if (v === '../authentification/index.html') p.node.value = '/connexion';
      else if (/^#\//.test(v)) p.node.value = v.slice(1);
      else if (v === '#' && t.isBinaryExpression(p.parent, {operator: '+'}) && p.parent.left === p.node) {
        const r = p.parent.right;
        const ancre = (t.isIdentifier(r) && /^(id|ancre|h)$/.test(r.name)) || (t.isMemberExpression(r) && !r.computed && r.property.name === 'id');
        if (!ancre) { rapport.hash.push(a.f + ' : ' + generate(p.parent).code.slice(0, 80)); p.parentPath.replaceWith(r); }
      }
    },
    TemplateLiteral(p) { for (const q of p.node.quasis) if (q.value.raw.includes('../../assets/')) { q.value.raw = q.value.raw.split('../../assets/').join('/assets/'); q.value.cooked = q.value.raw; } },
    JSXAttribute(p) {
      if (t.isStringLiteral(p.node.value)) {
        const v = p.node.value.value;
        if (v.startsWith('../../assets/')) p.node.value = t.stringLiteral(v.replace('../../assets/', '/assets/'));
        else if (v === '../authentification/index.html') p.node.value = t.stringLiteral('/connexion');
        else if (/^#\//.test(v)) p.node.value = t.stringLiteral(v.slice(1));
      }
    },
  });

  /* Lectures au chargement de valeurs importées (alias, déstructuration, membre) : remplacées par l'accès direct à l'usage,
     pour qu'un cycle d'imports ne provoque pas d'accès avant initialisation (le prototype comptait sur l'ordre des scripts). */
  const importLocaux = new Set();
  for (const [mod, m] of imports) if (mod.startsWith('@/proto/')) for (const [l] of m) importLocaux.add(l);
  const racineImportee = e => { while (t.isMemberExpression(e) && !e.computed) e = e.object; return t.isIdentifier(e) && importLocaux.has(e.name); };
  for (let tour = 0; tour < 6; tour++) {
    let change = false;
    traverse(file, {Program(pp) {
      for (const st of pp.get('body')) {
        if (!st.isVariableDeclaration()) continue;
        for (const dp of st.get('declarations')) {
          const d = dp.node;
          /* « X || {} » : le module importé définit toujours X. */
          if (d.init && t.isLogicalExpression(d.init, {operator: '||'}) && t.isObjectExpression(d.init.right) && !d.init.right.properties.length && racineImportee(d.init.left)) d.init = d.init.left;
          if (!d.init || !racineImportee(d.init)) continue;
          const subst = new Map(); let ok = true;
          if (t.isIdentifier(d.id)) subst.set(d.id.name, () => t.cloneNode(d.init, true));
          else if (t.isObjectPattern(d.id)) {
            for (const pr of d.id.properties) {
              if (t.isObjectProperty(pr) && !pr.computed && t.isIdentifier(pr.key) && t.isIdentifier(pr.value)) subst.set(pr.value.name, () => t.memberExpression(t.cloneNode(d.init, true), t.identifier(pr.key.name)));
              else ok = false;
            }
          } else ok = false;
          if (!ok) { (rapport.differes ||= []).push(a.f + ' : NON différé ' + generate(d.id).code.slice(0, 50)); continue; }
          const exportes = new Set([...exportsLocaux.values()].map(([l]) => l));
          if ([...subst.keys()].some(x => exportes.has(x))) { (rapport.differes ||= []).push(a.f + ' : NON différé (exporté) ' + generate(d.id).code.slice(0, 50)); continue; }
          for (const [nom] of subst) { const b = pp.scope.getBinding(nom); if (!b || b.constantViolations.length) { ok = false; break; } }
          if (!ok) { (rapport.differes ||= []).push(a.f + ' : NON différé (réaffecté) ' + generate(d.id).code.slice(0, 50)); continue; }
          for (const [nom, fab] of subst) {
            const b = pp.scope.getBinding(nom);
            for (const rp of b.referencePaths) {
              const r = fab();
              if (rp.isJSXIdentifier()) {
                const vers = e => t.isIdentifier(e) ? t.jsxIdentifier(e.name) : t.jsxMemberExpression(vers(e.object), t.jsxIdentifier(e.property.name));
                rp.replaceWith(vers(r));
              } else if (rp.parentPath.isObjectProperty() && rp.parent.shorthand && rp.parent.value === rp.node) {
                rp.parent.shorthand = false; rp.replaceWith(r);
              } else rp.replaceWith(r);
            }
          }
          (rapport.differes ||= []).push(a.f + ' : ' + [...subst.keys()].join(',').slice(0, 80));
          dp.remove(); change = true;
        }
      }
      pp.stop();
    }});
    if (!change) break;
  }
  /* Stockage local : seules les clés permises restent; lecture d'une autre clé → null, écriture → rien. */
  traverse(file, {CallExpression(p) {
    const c = p.node.callee;
    if (!t.isMemberExpression(c) || c.computed || !t.isIdentifier(c.object, {name: 'localStorage'}) || p.scope.hasBinding('localStorage')) return;
    const m = c.property.name; if (!['getItem', 'setItem', 'removeItem'].includes(m)) return;
    const arg = p.node.arguments[0];
    const permis = (t.isStringLiteral(arg) && CLES_PERMISES.has(arg.value)) || (t.isIdentifier(arg, {name: 'CLE'}) && a.f === 'cleo-temoins.jsx');
    if (permis) return;
    (rapport.stockageRetire ||= []).push(a.f + ' : ' + m + '(' + generate(arg).code.slice(0, 30) + ')');
    p.replaceWith(m === 'getItem' ? t.nullLiteral() : t.unaryExpression('void', t.numericLiteral(0)));
  }});
  /* Tests de présence d'un composant (« X ? <X/> : repli », « X && … ») : toujours vrais une fois X importé; idem undefined → faux. */
  const estComposantSur = (p, n) => {
    if (!t.isIdentifier(n) || !/^[A-Z]/.test(n.name)) return false;
    const b = p.scope.getBinding(n.name);
    if (!b) return importLocaux.has(n.name) || [...(imports.get('@/components/ds') || new Map()).keys()].includes(n.name) || a.dsNoms.has(n.name);
    return b.scope.path.isProgram() && (b.path.isFunctionDeclaration() || (b.path.isVariableDeclarator() && (t.isArrowFunctionExpression(b.path.node.init) || t.isFunctionExpression(b.path.node.init))));
  };
  let simplifies = 0;
  traverse(file, {
    ConditionalExpression: {exit(p) {
      const te = p.node.test;
      if (t.isIdentifier(te, {name: 'undefined'})) { p.replaceWith(p.node.alternate); simplifies++; return; }
      if (estComposantSur(p, te)) { p.replaceWith(p.node.consequent); simplifies++; }
    }},
    LogicalExpression: {exit(p) {
      const l = p.node.left;
      if (p.node.operator === '&&' && estComposantSur(p, l)) { p.replaceWith(p.node.right); simplifies++; }
      else if (p.node.operator === '||' && estComposantSur(p, l)) { p.replaceWith(l); simplifies++; }
      else if (p.node.operator === '&&' && t.isIdentifier(l, {name: 'undefined'})) { p.replaceWith(t.identifier('undefined')); simplifies++; }
      else if (p.node.operator === '||' && t.isIdentifier(l, {name: 'undefined'})) { p.replaceWith(p.node.right); simplifies++; }
    }},
  });
  if (simplifies) (rapport.simplifies ||= []).push(a.f + ' : ' + simplifies);
  /* Lectures du navigateur (window, document, location, matchMedia…) : protégées pour le rendu serveur.
     L'expression complète (chaîne d'accès et d'appels) est évaluée côté client seulement; côté serveur elle vaut undefined
     (matchMedia rend un résultat « ne correspond pas »). */
  const NAV = new Set(['window', 'document', 'location', 'navigator', 'history', 'localStorage', 'sessionStorage', 'matchMedia', 'getComputedStyle', 'innerWidth', 'innerHeight', 'scrollY', 'scrollX', 'devicePixelRatio', 'requestAnimationFrame', 'cancelAnimationFrame']);
  const gardeType = nom => t.binaryExpression('!==', t.unaryExpression('typeof', t.identifier(nom === 'matchMedia' || nom === 'getComputedStyle' || nom === 'innerWidth' || nom === 'innerHeight' || nom === 'scrollY' || nom === 'scrollX' || nom === 'devicePixelRatio' || nom === 'requestAnimationFrame' || nom === 'cancelAnimationFrame' ? 'window' : nom)), t.stringLiteral('undefined'));
  const MM_FAUX = () => t.objectExpression([t.objectProperty(t.identifier('matches'), t.booleanLiteral(false)),
    ...['addEventListener', 'removeEventListener', 'addListener', 'removeListener'].map(k => t.objectMethod('method', t.identifier(k), [], t.blockStatement([])))]);
  let gardes = 0;
  traverse(file, {Identifier(p) {
    const nom = p.node.name;
    if (!NAV.has(nom) || !p.isReferencedIdentifier() || p.scope.hasBinding(nom)) return;
    if (p.parentPath.isUnaryExpression({operator: 'typeof'})) return;
    /* Remonter la chaîne d'accès / d'appels. */
    let haut = p;
    while (true) {
      const par = haut.parentPath;
      if ((par.isMemberExpression() || par.isOptionalMemberExpression()) && par.node.object === haut.node) { haut = par; continue; }
      if ((par.isCallExpression() || par.isOptionalCallExpression()) && par.node.callee === haut.node) { haut = par; continue; }
      break;
    }
    if (haut === p && nom === 'window') return; // window seul (ex. === window) : laissé
    const par = haut.parentPath;
    if ((par.isAssignmentExpression() && par.node.left === haut.node) || par.isUpdateExpression() || par.isUnaryExpression({operator: 'delete'})) return;
    if (par.isExpressionStatement()) return; // instruction seule (dans un effet ou un gestionnaire) : rien à protéger au rendu
    if (haut.findParent(q => q.isConditionalExpression() && t.isBinaryExpression(q.node.test) && t.isUnaryExpression(q.node.test.left, {operator: 'typeof'}))) return;
    if (haut.node.__garde) return;
    const hn = haut.node, estMM = t.isCallExpression(hn) && (t.isIdentifier(hn.callee, {name: 'matchMedia'}) || (t.isMemberExpression(hn.callee) && t.isIdentifier(hn.callee.object, {name: 'window'}) && t.isIdentifier(hn.callee.property, {name: 'matchMedia'})));
    const repli = estMM ? MM_FAUX() : t.identifier('undefined');
    const n = t.conditionalExpression(gardeType(nom), haut.node, repli);
    n.__garde = true; haut.node.__garde = true;
    haut.replaceWith(n); haut.skip(); gardes++;
  }});
  if (gardes) (rapport.gardesNavigateur ||= []).push(a.f + ' : ' + gardes);
  /* Hydratation : (1) useState dont l'initialisation lit le navigateur → useEtatClient (valeur du serveur pendant l'hydratation);
     (2) typeof <global du navigateur> → « undefined » en mode serveur, pour que ces initialisations rendent la valeur du serveur. */
  const GLOB = new Set(['window', 'document', 'navigator', 'location', 'localStorage', 'IntersectionObserver', 'ResizeObserver', 'MutationObserver', 'matchMedia', 'requestAnimationFrame', 'getComputedStyle', 'innerWidth', 'innerHeight']);
  /* Fonctions de niveau module qui lisent le navigateur (directement ou par une autre fonction du module). */
  const fnsModule = new Map();
  for (const st of prog.body) {
    if (t.isFunctionDeclaration(st) && st.id) fnsModule.set(st.id.name, st);
    if (t.isVariableDeclaration(st)) for (const d of st.declarations) if (t.isIdentifier(d.id) && (t.isArrowFunctionExpression(d.init) || t.isFunctionExpression(d.init))) fnsModule.set(d.id.name, d.init);
  }
  const fnLit = new Map();
  const litNavigateur = (n, vus = new Set()) => { let r = false; traverse(t.file(t.program([t.isStatement(n) ? t.cloneNode(n, true) : t.expressionStatement(t.cloneNode(n, true))])), {
    Identifier(q) {
      const nm = q.node.name;
      if (GLOB.has(nm) && !q.scope.hasBinding(nm) && (q.isReferencedIdentifier())) r = true;
      else if (fnsModule.has(nm) && q.isReferencedIdentifier() && !q.scope.hasBinding(nm) && !vus.has(nm)) {
        if (!fnLit.has(nm)) { vus.add(nm); fnLit.set(nm, litNavigateur(fnsModule.get(nm), vus)); }
        if (fnLit.get(nm)) r = true;
      }
    },
    CallExpression(q) { if (t.isIdentifier(q.node.callee, {name: '__maintenant'})) r = true; },
  }); return r; };
  const estUseState = (p, c) => {
    if (t.isMemberExpression(c) && t.isIdentifier(c.object, {name: 'React'}) && t.isIdentifier(c.property, {name: 'useState'})) return true;
    if (!t.isIdentifier(c)) return false;
    if (c.name === 'useState' && !p.scope.hasBinding('useState')) return false;
    const b = p.scope.getBinding(c.name); if (!b) return false;
    if (b.path.isVariableDeclarator()) {
      const i = b.path.node.init;
      if (t.isMemberExpression(i) && t.isIdentifier(i.object, {name: 'React'}) && t.isIdentifier(i.property, {name: 'useState'})) return true;
      if (t.isObjectPattern(b.path.node.id) && t.isIdentifier(i, {name: 'React'})) return b.path.node.id.properties.some(pr => t.isObjectProperty(pr) && t.isIdentifier(pr.key, {name: 'useState'}) && t.isIdentifier(pr.value, {name: c.name}));
    }
    return false;
  };
  /* Heure courante : new Date() / Date.now() → date de référence fixe côté serveur (pré-rendu stable), vraie date dans le navigateur. */
  let maintenant = 0;
  traverse(file, {
    NewExpression(p) { if (t.isIdentifier(p.node.callee, {name: 'Date'}) && !p.node.arguments.length && !p.scope.getBinding('Date')) { p.replaceWith(t.callExpression(t.identifier('__maintenant'), [])); maintenant++; } },
    CallExpression(p) { const c = p.node.callee; if (t.isMemberExpression(c) && t.isIdentifier(c.object, {name: 'Date'}) && t.isIdentifier(c.property, {name: 'now'}) && !p.scope.getBinding('Date')) { p.replaceWith(t.callExpression(t.identifier('__maintenantMs'), [])); maintenant++; } },
  });
  if (maintenant) { ajImport('@/lib/hydratation', '__maintenant'); ajImport('@/lib/hydratation', '__maintenantMs'); }
  let etatsClient = 0, typeofs = 0;
  traverse(file, {CallExpression(p) {
    const c = p.node.callee, a0 = p.node.arguments[0];
    if (!a0 || !estUseState(p, c) || !litNavigateur(a0)) return;
    p.node.callee = t.identifier('useEtatClient'); etatsClient++;
  }});
  traverse(file, {UnaryExpression(p) {
    if (p.node.operator !== 'typeof' || !t.isIdentifier(p.node.argument) || !GLOB.has(p.node.argument.name) || p.scope.hasBinding(p.node.argument.name)) return;
    if (p.node.__ssr) return;
    const u = t.unaryExpression('typeof', t.identifier(p.node.argument.name)); u.__ssr = true;
    p.replaceWith(t.conditionalExpression(t.callExpression(t.identifier('__ssr'), []), t.stringLiteral('undefined'), u)); p.skip(); typeofs++;
  }});
  if (etatsClient) ajImport('@/lib/hydratation', 'useEtatClient');
  if (typeofs) ajImport('@/lib/hydratation', '__ssr');
  if (etatsClient) (rapport.etatsClient ||= []).push(a.f + ' : ' + etatsClient);
  /* Initialiseurs de niveau module qui lisent le navigateur (hors fonctions) : évalués seulement côté client. */
  const DOMN = new Set(['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'location', 'matchMedia', 'getComputedStyle']);
  for (const s of prog.body) if (t.isVariableDeclaration(s)) for (const d of s.declarations) {
    if (!d.init || t.isFunction(d.init)) continue;
    let lit = false;
    traverse(t.file(t.program([t.expressionStatement(t.cloneNode(d.init, true))])), {
      Function(q) { q.skip(); },
      Identifier(q) { if (DOMN.has(q.node.name) && q.isReferencedIdentifier() && !q.scope.hasBinding(q.node.name)) lit = true; },
    });
    if (!lit) continue;
    d.init = t.conditionalExpression(t.binaryExpression('!==', t.unaryExpression('typeof', t.identifier('window')), t.stringLiteral('undefined')), d.init, t.identifier('undefined'));
    rapport.initsClient.push(a.f + ' : ' + generate(d.id).code);
  }

  const lignes = [];
  /* Runtime JSX traduisant (version anglaise) : voir src/lib/i18n. */
  if (usesJSX) lignes.push('/** @jsxImportSource @/lib/i18n */');
  const client = usesJSX || /\buse(State|Effect|Ref|Reducer|Memo|Callback|LayoutEffect|Context|Id)\b/.test(a.code);
  if (client) lignes.push("'use client';");
  lignes.push(`/* Converti depuis ui_kits/site-public/${a.f} (prototype) — ne pas réintroduire de globaux window. */`);
  if (/\bReact\b/.test(a.code) || usesJSX) lignes.push("import React from 'react';");
  if (/\bReactDOM\b/.test(a.code)) lignes.push("import ReactDOM from 'react-dom';");
  if (dsNamespace) lignes.push("import * as __DS from '@/components/ds';");
  for (const [mod, m] of imports) {
    if (mod === '@/proto/' + a.mod) continue;
    const specs = [...m].map(([l, n]) => n === l ? n : `${n} as ${l}`);
    lignes.push(`import { ${specs.join(', ')} } from '${mod}';`);
  }
  const code = generate(file, {comments: true, jsescOption: {minimal: true}}).code;
  const exp = [...exportsLocaux.values()].filter(([l]) => a.locaux.has(l)).map(([l, n]) => l === n ? n : `${l} as ${n}`);
  const vus = new Set(), expU = exp.slice().reverse().filter(x => { const k = x.split(' as ').pop(); if (vus.has(k)) return false; vus.add(k); return true; }).reverse();
  fs.writeFileSync(path.join(OUT, a.mod + '.jsx'), lignes.join('\n') + '\n\n' + code + (expU.length ? `\n\nexport { ${expU.join(', ')} };\n` : '\n'));
  rapport.fichiers[a.f] = {exports: expU.length, imports: imports.size, client};
}
for (const k in rapport.inconnus) rapport.inconnus[k] = [...rapport.inconnus[k]];
fs.writeFileSync(path.join(path.dirname(OUT), 'rapport-conversion.json'), JSON.stringify(rapport, null, 1));
console.log('Fichiers :', Object.keys(rapport.fichiers).length, '· conflits :', rapport.conflits.length, '· inconnus :', Object.keys(rapport.inconnus).length, '· effets :', rapport.effets.length, '· lectures au chargement :', rapport.ordre.length, '· CSS :', rapport.css.length);
