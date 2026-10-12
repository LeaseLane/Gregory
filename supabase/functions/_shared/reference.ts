// Référence de paiement d'un logement (« LL-10001 ») retrouvée dans le libellé
// d'un dépôt. Tolère ce que les gens tapent vraiment : minuscules, espace ou
// tiret absent (« ll10001 », « LL 10001 », « réf: LL–10001 »). Une seule
// référence trouvée = fiable; zéro ou plusieurs = rien (l'admin tranche).
const MOTIF = /(?<![A-Z0-9])LL\s*[-–—_.]?\s*(\d{5})(?!\d)/gi;

export function extraireReference(texte: string | null | undefined): string | null {
  const trouvees = new Set([...String(texte ?? "").matchAll(MOTIF)].map((m) => "LL-" + m[1]));
  return trouvees.size === 1 ? [...trouvees][0] : null;
}
