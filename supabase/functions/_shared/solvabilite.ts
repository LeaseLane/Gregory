// T5 · Simulateur d'enquête de crédit (hors production). Déterministe : le même courriel donne le même rapport.
// Courriel contenant « vide » → dossier vide (empty); « erreur » → erreur du fournisseur (error). Extrait minimal seulement.
export type Rapport = { cote: number; ratio: number; paiements: number[]; dossiers_tal: number; avis: "favorable" | "reserve" | "defavorable"; recommandation: string };
export type Resultat = { result: "ok" | "empty" | "error" | "unconfigured"; report?: Rapport };
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function graine(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return () => (h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296; }

export function simuler(courriel: string, loyer: number | null): Resultat {
  const m = courriel.toLowerCase();
  if (m.includes("erreur")) return { result: "error" };
  if (m.includes("vide")) return { result: "empty" };
  const r = graine(m), cote = 1 + Math.floor(r() * 5);                       // 1 Faible … 5 Excellente
  const ratio = Math.round((12 + r() * 30) * 10) / 10;                        // loyer sur revenu, %
  const paiements = Array.from({ length: 12 }, () => (r() < 0.12 ? 3 + Math.floor(r() * 20) : 0)); // jours de retard par mois
  const dossiers_tal = r() < 0.08 ? 1 : 0, retards = paiements.filter((j) => j > 0).length;
  const avis = cote >= 4 && ratio <= 33 && !dossiers_tal && retards <= 1 ? "favorable" : cote <= 2 || dossiers_tal || ratio > 40 ? "defavorable" : "reserve";
  const COTE = ["cote faible", "cote passable", "bonne cote", "très bonne cote", "excellente cote"][cote - 1];
  const raisons = [COTE, ratio <= 33 ? `loyer à ${Math.round(ratio)} % du revenu` : `loyer à ${Math.round(ratio)} % du revenu, au-dessus du seuil de 33 %`,
    dossiers_tal ? "un dossier au TAL" : "aucun dossier au TAL", retards ? `${retards} retard${retards > 1 ? "s" : ""} en 12 mois` : "aucun retard en 12 mois"];
  const mot = { favorable: "Favorable", reserve: "Avec réserve", defavorable: "Défavorable" }[avis];
  void loyer; // ponytail: le revenu est simulé; le vrai fournisseur le calcule à partir du loyer déclaré
  return { result: "ok", report: { cote, ratio, paiements, dossiers_tal, avis, recommandation: `${mot} : ${raisons.join(", ")}.` } };
}

// Texte des 12 mois : « 11 à temps · 1 retard de 6 jours (mars) ». Le 1er élément = il y a 12 mois.
export function resumePaiements(p: number[], maintenant = new Date()) {
  const retards = p.map((j, i) => ({ j, mois: MOIS[(maintenant.getMonth() - 12 + i + 24) % 12] })).filter((x) => x.j > 0);
  const aTemps = p.length - retards.length;
  return `${aTemps} à temps` + (retards.length ? ` · ${retards.map((x) => `1 retard de ${x.j} jours (${x.mois})`).join(" · ")}` : "");
}
