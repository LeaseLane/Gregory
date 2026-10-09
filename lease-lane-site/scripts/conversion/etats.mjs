import fs from 'node:fs';
import {parse} from '@babel/parser';
import traverseM from '@babel/traverse';
import generateM from '@babel/generator';
const traverse = traverseM.default || traverseM, generate = generateM.default || generateM;
const NAV = /\b(window|document|location|localStorage|sessionStorage|matchMedia|navigator|innerWidth|innerHeight)\b/;
let n = 0, corps = 0;
for (const f of fs.readdirSync('.').filter(f => f.endsWith('.jsx'))) {
  const ast = parse(fs.readFileSync(f, 'utf8'), {sourceType: 'module', plugins: ['jsx']});
  traverse(ast, {CallExpression(p) {
    const c = p.node.callee, nom = c.type === 'Identifier' ? c.name : c.type === 'MemberExpression' ? c.property.name : '';
    if (!/^(useState|uS|useS|useReducer)$/.test(nom) && !(c.type === 'MemberExpression' && c.property.name === 'useState')) return;
    const a = p.node.arguments[0]; if (!a) return;
    const g = generate(a).code;
    if (NAV.test(g)) { n++; console.log(f + ':' + p.node.loc.start.line, g.replace(/\s+/g, ' ').slice(0, 130)); }
  }});
}
console.log('états initialisés depuis le navigateur :', n);
