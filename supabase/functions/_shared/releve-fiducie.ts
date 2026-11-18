// Relevé du compte en fidéicommis (export CSV de BMO) : identifiant stable de chaque ligne et continuité des soldes.
// Revue du 18 nov. 2026 : sans identifiant de la banque, deux virements identiques le même jour (deux colocataires à 750 $)
// se confondaient en « doublon », et un relevé qui en chevauchait un autre pouvait compter des lignes deux fois.
export type LigneReleve = { date: string; description: string; amount: number; solde?: number | null; reference?: string };
export type LigneNumerotee = LigneReleve & { externe: string; ordre: number };

const norme = (s: string) => s.replace(/\s+/g, " ").trim().toUpperCase();
const cents = (n: number) => Math.round(n * 100);

/** Lignes dans l'ordre chronologique (un export du plus récent au plus ancien est renversé), puis identifiant
 *  « date|montant|libellé|#n » où n compte les lignes identiques de la journée : un même relevé réimporté redonne les mêmes. */
export function numeroter(lignes: LigneReleve[]): LigneNumerotee[] {
  const l = lignes.length > 1 && lignes[0].date > lignes[lignes.length - 1].date ? [...lignes].reverse() : [...lignes];
  const vus = new Map<string, number>(), parJour = new Map<string, number>();
  return l.map((x) => {
    const cle = `${x.date}|${cents(x.amount)}|${norme(x.description)}`;
    const n = (vus.get(cle) ?? 0) + 1; vus.set(cle, n);
    const ordre = (parJour.get(x.date) ?? 0) + 1; parJour.set(x.date, ordre);
    return { ...x, externe: x.reference ? `bmo:${x.reference}` : `csv:${cle}|#${n}`, ordre };
  });
}

/** Les soldes doivent s'enchaîner : dans le fichier (solde = solde précédent + montant), et avec le dernier solde déjà
 *  importé pour la première ligne nouvelle. Rend null si tout s'enchaîne, sinon la raison du refus. */
export function verifierContinuite(lignes: LigneNumerotee[], nouvelles: Set<string>, dernierSolde: number | null): string | null {
  const avecSolde = lignes.filter((x) => x.solde != null);
  if (!avecSolde.length) return null;   // export sans colonne de solde : rien à vérifier (le rapprochement mensuel reste la garde)
  if (avecSolde.length !== lignes.length) return "Certaines lignes n'ont pas de solde : vérifiez la colonne choisie pour le solde.";
  for (let i = 1; i < lignes.length; i++) {
    if (cents(lignes[i - 1].solde! + lignes[i].amount) !== cents(lignes[i].solde!))
      return `Les soldes ne s'enchaînent pas à la ligne du ${lignes[i].date} (${lignes[i].description}) : colonnes mal choisies, ou ordre des lignes modifié.`;
  }
  const premiere = lignes.findIndex((x) => nouvelles.has(x.externe));
  if (premiere < 0 || dernierSolde == null) return null;   // rien de nouveau, ou premier relevé importé
  const avant = cents(lignes[premiere].solde! - lignes[premiere].amount);
  if (premiere > 0) return null;   // la première ligne nouvelle suit une ligne déjà connue du même fichier : déjà vérifié ci-dessus
  if (avant !== cents(dernierSolde))
    return `Ce relevé ne suit pas le précédent : solde de départ ${(avant / 100).toFixed(2)} $, dernier solde importé ${dernierSolde.toFixed(2)} $. Il manque des lignes entre les deux, ou des lignes déjà importées ont changé.`;
  return null;
}
