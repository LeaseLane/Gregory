// Relevé du compte en fidéicommis (export CSV de BMO) : identifiant stable de chaque ligne et continuité des soldes.
// Revue du 18 nov. 2026 : sans identifiant de la banque, deux virements identiques le même jour (deux colocataires à 750 $)
// se confondaient en « doublon », et un relevé qui en chevauchait un autre pouvait compter des lignes deux fois.
// Revue de code du 18 nov. : les lignes nouvelles doivent former un seul bloc à la fin du fichier (sinon une ligne connue dont le
// libellé a changé passerait pour nouvelle); une référence de banque répétée est refusée (elle fusionnerait des dépôts distincts).
export type LigneReleve = { date: string; description: string; amount: number; solde?: number | null; reference?: string };
export type LigneNumerotee = LigneReleve & { externe: string; ordre: number };

const norme = (s: string) => s.replace(/\s+/g, " ").trim().toUpperCase();
const cents = (n: number) => Math.round(n * 100);
const chaine = (l: LigneReleve[]) => l.every((x, i) => i === 0 || x.solde == null || l[i - 1].solde == null || cents(l[i - 1].solde! + x.amount) === cents(x.solde!));

/** Lignes dans l'ordre chronologique, puis identifiant « date|cents|libellé|#n » (n compte les lignes identiques de la journée) ou
 *  « bmo:référence ». Ordre : par les dates si elles diffèrent, sinon par les soldes (un export d'une seule journée, du plus récent au
 *  plus ancien, n'a que ses soldes pour le dire). */
export function numeroter(lignes: LigneReleve[]): LigneNumerotee[] {
  let l = [...lignes];
  if (l.length > 1) {
    if (l[0].date > l[l.length - 1].date) l.reverse();
    else if (l[0].date === l[l.length - 1].date && !chaine(l) && chaine([...l].reverse())) l.reverse();
  }
  const vus = new Map<string, number>(), parJour = new Map<string, number>();
  return l.map((x) => {
    const cle = `${x.date}|${cents(x.amount)}|${norme(x.description)}`;
    const n = (vus.get(cle) ?? 0) + 1; vus.set(cle, n);
    const ordre = (parJour.get(x.date) ?? 0) + 1; parJour.set(x.date, ordre);
    return { ...x, externe: x.reference ? `bmo:${x.reference}` : `csv:${cle}|#${n}`, ordre };
  });
}

/** Rend null si le relevé peut s'importer, sinon la raison du refus :
 *  dates dans l'ordre; références de banque uniques; soldes qui s'enchaînent dans le fichier; lignes nouvelles en un seul bloc à la fin;
 *  la ligne qui précède le bloc (ou le solde de départ) égale le dernier solde déjà importé. */
export function verifierContinuite(lignes: LigneNumerotee[], nouvelles: Set<string>, dernierSolde: number | null): string | null {
  for (let i = 1; i < lignes.length; i++) if (lignes[i].date < lignes[i - 1].date)
    return `Les dates ne sont pas dans l'ordre (${lignes[i - 1].date} puis ${lignes[i].date}) : vérifiez le format des dates (jour/mois ou mois/jour).`;
  const refs = lignes.filter((x) => x.reference).map((x) => x.reference!);
  if (new Set(refs).size !== refs.length) return "La colonne « Référence de la banque » contient des valeurs répétées : ce n'est pas un numéro de transaction. Choisissez « Ignorer la colonne ».";
  const avecSolde = lignes.filter((x) => x.solde != null);
  if (avecSolde.length && avecSolde.length !== lignes.length) return "Certaines lignes n'ont pas de solde : vérifiez la colonne choisie pour le solde.";
  if (avecSolde.length && !chaine(lignes)) {
    const i = lignes.findIndex((x, k) => k > 0 && cents(lignes[k - 1].solde! + x.amount) !== cents(x.solde!));
    return `Les soldes ne s'enchaînent pas à la ligne du ${lignes[i].date} (${lignes[i].description}) : colonnes mal choisies, ou ordre des lignes modifié.`;
  }
  const premiere = lignes.findIndex((x) => nouvelles.has(x.externe));
  if (premiere < 0) return null;   // rien de nouveau
  if (lignes.slice(premiere).some((x) => !nouvelles.has(x.externe)))
    return "Des lignes déjà importées et des lignes nouvelles sont mélangées dans ce relevé : une ligne connue a peut-être changé de libellé. Rien n'est importé; exportez le relevé à partir de la dernière date importée.";
  if (!avecSolde.length || dernierSolde == null) return null;   // export sans solde, ou premier relevé avec soldes
  const avant = premiere > 0 ? cents(lignes[premiere - 1].solde!) : cents(lignes[0].solde! - lignes[0].amount);
  if (avant !== cents(dernierSolde))
    return `Ce relevé ne suit pas le précédent : solde de départ ${(avant / 100).toFixed(2)} $, dernier solde importé ${dernierSolde.toFixed(2)} $. Il manque des lignes entre les deux, ou des lignes déjà importées ont changé.`;
  return null;
}
