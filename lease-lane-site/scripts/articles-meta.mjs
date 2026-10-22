/* src/lib/articles-meta.js : les seuls champs des articles du blogue dont la liste des adresses (proto/routes.jsx) a besoin,
   tirés de src/proto/articles-blogue.jsx. Le texte complet des articles (≈ 100 Ko) n'est ainsi chargé que sur les pages du
   blogue, au lieu de chaque page du site (PageSpeed, 22 oct. 2026). Relancé avant chaque construction (npm run build). */
import fs from 'node:fs';
import vm from 'node:vm';
const src = fs.readFileSync(new URL('../src/proto/articles-blogue.jsx', import.meta.url), 'utf8').replace(/^export \{[^}]*\};?\s*$/m, '');
const ctx = {}; vm.createContext(ctx); vm.runInContext(src + '\n;globalThis.__A = LL_ARTICLES;', ctx);
const meta = ctx.__A.map((x) => ({ slug: x.slug, d: x.d, m: x.m, couv: x.couv, fr: { requete: x.fr.requete, titre: x.fr.titre, description: x.fr.description, fil: x.fr.fil } }));
fs.writeFileSync(new URL('../src/lib/articles-meta.js', import.meta.url),
  '/* Généré par scripts/articles-meta.mjs depuis src/proto/articles-blogue.jsx : ne pas modifier à la main. */\nexport const LL_ARTICLES = ' + JSON.stringify(meta, null, 1) + ';\n');
console.log('articles-meta :', meta.length, 'articles');
