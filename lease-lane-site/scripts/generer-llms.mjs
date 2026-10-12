/* Génère public/llms.txt (résumé du site pour les moteurs de réponse IA) à partir des routes du prototype et des adresses anglaises.
   Aucune adresse civique (décision du 11 oct. 2026). Usage : node scripts/generer-llms.mjs */
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const ICI = path.dirname(fileURLToPath(import.meta.url)), PROTO = path.join(ICI, '../../lease-lane-design-system/project/ui_kits/site-public');
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['articles-blogue.js', 'localites-routes.js', 'routes.js']) vm.runInContext(fs.readFileSync(path.join(PROTO, f), 'utf8'), ctx);
const { ROUTES_EN } = await import(path.join(ICI, '../src/lib/i18n/adresses.js'));
const W = ctx.window, S = W.LL_SITE, D = S.domaine, R = W.LL_ROUTES.filter(r => r.index !== false);
const nett = s => String(s || '').replace(/\s*\|\s*Lease Lane$/, '');
const ligne = (r, en) => { const e = ROUTES_EN[r.path] || {}; return en ? `- [${nett(e.titre)}](${D}${e.en}): ${e.description || ''}` : `- [${nett(r.titre)}](${D}${r.path === '/' ? '/' : r.path}): ${r.description || ''}`; };
const groupe = (t, f, en) => { const l = R.filter(f); return l.length ? `\n## ${t}\n\n` + l.map(r => ligne(r, en)).join('\n') + '\n' : ''; };
const G = [
  ['Propriétaires', 'Owners', r => /^(gestion|location|expertise|changer|offre|levis)$/.test(r.page)],
  ['Gestion immobilière par secteur', 'Property management by area', r => /^(region|locale)$/.test(r.page)],
  ['Locataires et futurs locataires', 'Tenants and future tenants', r => /^(locataires|logements|fiche|formulaire|cleo|faq|glossaire)$/.test(r.page)],
  ['Guides de quartier et de ville', 'Neighbourhood and town guides', r => /^(quartiers|quartier)$/.test(r.page)],
  ['Blogue', 'Blog', r => /^(blogue|article)$/.test(r.page)],
  ['Entreprise et confidentialité', 'Company and privacy', r => /^(apropos|contact|legal)$/.test(r.page) || /temoins|conditions|confidentialite|gouvernance/.test(r.path)]];
let t = `# Lease Lane

> Lease Lane (${S.raison}) est une entreprise de gestion immobilière résidentielle de la grande région de Québec et de Lévis. Elle gère des immeubles locatifs pour leurs propriétaires : location, perception des loyers, entretien et rapports en ligne, avec Cléo, un agent IA qui répond 24/7 aux propriétaires, aux locataires et aux locataires potentiels, explique les règles générales du Code civil du Québec et du Tribunal administratif du logement (TAL), puis passe la main à une personne pour toute décision.

- Langue principale : français (fr-CA); version anglaise complète sous /en.
- Territoire : ville de Québec, Lévis et 50 km autour de Québec (Rive-Nord, Rive-Sud, Portneuf).
- Logements à louer et demande de location en ligne : bientôt disponibles sur le site.
- Les renseignements juridiques publiés sont de l’information générale, pas un avis juridique.
- Contact : ${S.courriel} · ${S.telephone}
- Heures : ${S.heures || ''}
- Réseaux : ${(S.reseaux || []).join(' · ')}
`;
for (const [fr, , f] of G) t += groupe(fr, f, false);
t += `\n# English\n`;
for (const [, en, f] of G) t += groupe(en, f, true);
fs.writeFileSync(path.join(ICI, '../public/llms.txt'), t);
console.log('llms.txt :', R.length, 'pages ×2,', t.length, 'caractères');
