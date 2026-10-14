// Icônes des gabarits de courriels (Phase 2) en PNG : Gmail et Outlook n'affichent pas le SVG.
// Source : le jeu d'icônes des maquettes Penpot (load.js, storage.ICONS). Rendu 48 px (affiché en 24 px), trois couleurs.
// Usage : node scripts/icones-courriel.mjs "<chemin de load.js>"   (sharp, déjà installé dans lanceur/)
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const sharp = createRequire(new URL("../lanceur/package.json", import.meta.url))("sharp");

const src = readFileSync(process.argv[2], "utf8");
const icones = Object.fromEntries([...src.matchAll(/^\s*([a-z][a-z0-9]*): '(<[^']*)',?\s*$/gm)].map((m) => [m[1], m[2]]));
const COULEURS = { "": "#0C2147", "-rouge": "#9B2E28", "-blanc": "#FFFFFF" };
const sortie = new URL("../assets/courriel/icones/", import.meta.url).pathname;
for (const [nom, chemins] of Object.entries(icones)) {
  for (const [suffixe, c] of Object.entries(COULEURS)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${chemins}</svg>`;
    await sharp(Buffer.from(svg)).png().toFile(decodeURIComponent(sortie) + nom + suffixe + ".png");
  }
}
console.log(Object.keys(icones).length, "icônes");
