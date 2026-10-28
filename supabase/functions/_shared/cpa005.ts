// Fichier de paiements BMO au format CPA 005 (Paiements Canada, Norme 005) : enregistrements fixes de 1 464 caractères,
// « A » (en-tête), un « C » par dépôt (versement à un propriétaire) ou un « D » par débit préautorisé (loyer), « Z » (totaux).
// Une opération par enregistrement : les segments 2 à 6 restent en blanc. Ce que la banque remplit (numéro de trace, code
// d'invalidité) est à zéro. Codes d'opération (Norme 007) : 401 loyer résidentiel, 450 paiement divers.
// ponytail: ID d'émetteur, centre de traitement et séparateur de lignes suivent la norme; les écarts propres à BMO
// (guide remis à l'adhésion au service TFE) se corrigent ici.

export type Operation = {
  sens: "C" | "D"; code: string; cents: number; date: string; // date : AAAA-MM-JJ (fonds disponibles pour C, échéance pour D)
  institution: string; transit: string; compte: string; nom: string; reference: string;
};
export type Fichier = {
  originateur: string; centre: string; numero: number; creation: string; // creation : AAAA-MM-JJ
  nomCourt: string; nomLong: string; retour: { institution: string; transit: string; compte: string };
  operations: Operation[]; separateur?: string;
};

const LONGUEUR = 1464;
// Majuscules ASCII sans accents : les banques lisent les noms en ASCII (ou EBCDIC).
const ascii = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7E]/g, " ").toUpperCase();
const alpha = (s: string, n: number) => ascii(s).slice(0, n).padEnd(n, " ");
const num = (v: string | number, n: number, champ: string) => {
  const s = String(v);
  if (!/^\d+$/.test(s) || s.length > n) throw new Error(`CPA 005 : ${champ} invalide (${n} chiffres au plus)`);
  return s.padStart(n, "0");
};
// 0AAJJJ : zéro, année sur 2 chiffres, jour de l'année.
export function dateJulienne(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`CPA 005 : date invalide (${iso})`);
  const d = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  if (new Date(d).toISOString().slice(0, 10) !== iso) throw new Error(`CPA 005 : date invalide (${iso})`);
  const jour = (d - Date.UTC(+m[1], 0, 1)) / 86400000 + 1;
  return "0" + m[1].slice(2) + String(jour).padStart(3, "0");
}
const routage = (institution: string, transit: string) => "0" + num(institution, 3, "institution") + num(transit, 5, "transit");
const enregistrement = (s: string) => {
  if (s.length > LONGUEUR) throw new Error("CPA 005 : enregistrement trop long");
  return s.padEnd(LONGUEUR, " ");
};

export function fichierCpa005(f: Fichier): string {
  if (!/^[A-Za-z0-9]{1,10}$/.test(f.originateur)) throw new Error("CPA 005 : ID d'émetteur BMO manquant ou invalide");
  if (!Number.isInteger(f.numero) || f.numero < 1 || f.numero > 9999) throw new Error("CPA 005 : numéro de fichier entre 1 et 9999");
  if (!f.operations.length) throw new Error("CPA 005 : aucune opération");
  const controle = alpha(f.originateur, 10) + num(f.numero, 4, "numéro de fichier");
  const lignes = ["A" + "000000001" + controle + dateJulienne(f.creation) + num(f.centre, 5, "centre de traitement") + " ".repeat(20) + "CAD"];
  const totaux = { C: [0, 0], D: [0, 0] };
  for (const o of f.operations) {
    if (!Number.isInteger(o.cents) || o.cents <= 0) throw new Error(`CPA 005 : montant invalide pour ${o.nom}`);
    if (!/^\d{1,12}$/.test(o.compte)) throw new Error(`CPA 005 : compte invalide pour ${o.nom}`);
    if (!o.nom.trim()) throw new Error("CPA 005 : nom du titulaire manquant");
    totaux[o.sens][0] += o.cents; totaux[o.sens][1]++;
    lignes.push(o.sens + num(lignes.length + 1, 9, "compte d'enregistrements") + controle +
      num(o.code, 3, "code d'opération") + num(o.cents, 10, "montant") + dateJulienne(o.date) + routage(o.institution, o.transit) +
      alpha(o.compte, 12) + "0".repeat(22) + "000" + alpha(f.nomCourt, 15) + alpha(o.nom, 30) + alpha(f.nomLong, 30) +
      " ".repeat(10) + alpha(o.reference, 19) + routage(f.retour.institution, f.retour.transit) + alpha(f.retour.compte, 12) +
      " ".repeat(15) + " ".repeat(22) + "  " + "0".repeat(11));
  }
  lignes.push("Z" + num(lignes.length + 1, 9, "compte d'enregistrements") + controle +
    num(totaux.D[0], 14, "total des débits") + num(totaux.D[1], 8, "nombre de débits") +
    num(totaux.C[0], 14, "total des crédits") + num(totaux.C[1], 8, "nombre de crédits") + "0".repeat(44));
  const sep = f.separateur ?? "\r\n";
  return lignes.map(enregistrement).join(sep) + sep;
}
