/* Liste des adresses du site (scripts/routes.json) tirée du prototype : articles-blogue.js puis routes.js, évalués comme dans le navigateur.
   Sert à generer-pages.py (pages Next.js), aux vérifications et au plan du site. Usage : node routes-json.mjs <dossier du prototype> <fichier de sortie> */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const [P, SORTIE] = process.argv.slice(2);
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['articles-blogue.js', 'localites-routes.js', 'routes.js']) vm.runInContext(fs.readFileSync(path.join(P, f), 'utf8'), ctx, { filename: f });
const liste = ctx.LL_ROUTES.map(r => ({ path: r.path, page: r.page }));
const texte = JSON.stringify(liste, null, 0).replace(/\},\{/g, '},\n{') + '\n';
if (!fs.existsSync(SORTIE) || fs.readFileSync(SORTIE, 'utf8') !== texte) fs.writeFileSync(SORTIE, texte);
console.log('Adresses : ' + liste.length);
