// Échoue si l'ancien domaine réapparaît dans le code.
//
// Constaté le 2026-09-26 : trois semaines après la bascule vers
// leaselane.ca, des liens de courriel (offres aux travailleurs,
// confirmations de visite et de réparation) pointaient encore vers
// l'ancien domaine, et « Voir son portail » y renvoyait l'administrateur.
// Rien ne le signalait.
//
// Le motif est assemblé en deux morceaux pour que ce fichier ne se
// détecte pas lui-même. Aucun accès réseau.
import { execSync } from "node:child_process";

const MOTIF = ["portail", "gestion"].join("");
const EXCLUS = [
  "Lease Lane Design System/", // sources fournies par le client, non servies
  "site-vitrine.html",         // vitrine archivée, hors ligne
  "scripts/check-ancien-domaine.mjs",
];

let sortie = "";
try {
  sortie = execSync(`git grep -n -i ${MOTIF}`, { encoding: "utf8" });
} catch (e) {
  if (e.status === 1) { console.log("✅ Aucune mention de l'ancien domaine."); process.exit(0); }
  throw e;
}

const lignes = sortie.split("\n").filter((l) => l && !EXCLUS.some((x) => l.startsWith(x)));
if (!lignes.length) { console.log("✅ Aucune mention de l'ancien domaine."); process.exit(0); }
console.error(`❌ L'ancien domaine réapparaît (${lignes.length}) :\n` + lignes.join("\n"));
process.exit(1);
