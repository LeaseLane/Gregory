// Rapprochement d'un dépôt du compte en fidéicommis avec un bail.
//   auto       : la référence LL-xxxxx du message désigne un logement avec bail actif.
//   suggestion : pas de référence, mais un seul bail correspond au montant ET au nom
//                du locataire dans le libellé. L'admin confirme; jamais appliqué seul.
//   aucun      : l'admin choisit le bail à la main (ou ignore le dépôt).
import { extraireReference } from "./reference.ts";

export type Bail = { lease_id: string; reference: string; locataire: string; loyer: number; du_ouvert: number[] };
export type Classement =
  | { type: "auto"; lease_id: string; reference: string }
  | { type: "suggestion"; lease_id: string; raison: string }
  | { type: "aucun"; raison: string; reference?: string };

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Au moins un mot du nom de 3 lettres ou plus présent tel quel dans le libellé.
const nomPresent = (nom: string, libelle: string) => {
  const l = ` ${sansAccents(libelle).replace(/[^a-z0-9]+/g, " ")} `;
  return sansAccents(nom).split(/[^a-z0-9]+/).filter((m) => m.length >= 3).some((m) => l.includes(` ${m} `));
};

export function classer(depot: { description: string; amount: number }, baux: Bail[]): Classement {
  const ref = extraireReference(depot.description);
  if (ref) {
    const b = baux.find((x) => x.reference === ref);
    return b ? { type: "auto", lease_id: b.lease_id, reference: ref } : { type: "aucun", reference: ref, raison: `Référence ${ref} : aucun bail actif pour ce logement` };
  }
  const montant = Math.round(depot.amount * 100);
  const candidats = baux.filter((b) =>
    nomPresent(b.locataire, depot.description) &&
    (Math.round(b.loyer * 100) === montant || b.du_ouvert.some((d) => Math.round(d * 100) === montant))
  );
  if (candidats.length === 1) return { type: "suggestion", lease_id: candidats[0].lease_id, raison: `Montant et nom correspondent (${candidats[0].locataire}), sans référence` };
  return { type: "aucun", raison: candidats.length > 1 ? "Plusieurs baux possibles : à choisir" : "Aucune référence ni correspondance montant + nom" };
}
