// Registre en fidéicommis : le signe d'un mouvement suit son type (la base le
// vérifie aussi, contrainte fiducie_signe). Le montant saisi est toujours positif;
// seul un ajustement choisit son sens.
export const TYPES_FIDUCIE = ["loyer", "honoraires", "coordination", "fournisseur", "debours", "versement", "ajustement"] as const;
export type TypeFiducie = typeof TYPES_FIDUCIE[number];

export function montantSigne(type: string, montant: unknown, sens?: string): number | string {
  if (!(TYPES_FIDUCIE as readonly string[]).includes(type)) return "Type de mouvement invalide";
  const brut = Number(montant), cents = Math.round(brut * 100);
  if (!Number.isFinite(brut) || brut <= 0) return "Montant invalide (positif, en dollars)";
  if (Math.abs(cents - brut * 100) > 1e-6) return "Montant invalide : deux décimales au plus";
  const m = cents / 100;
  if (m > 1_000_000) return "Montant trop élevé";
  if (type === "loyer") return m;
  if (type === "ajustement") return sens === "debit" ? -m : m;
  return -m;
}
