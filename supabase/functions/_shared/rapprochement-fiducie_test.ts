import { assertEquals } from "jsr:@std/assert@1";
import { classer, type Bail } from "./rapprochement-fiducie.ts";

const baux: Bail[] = [
  { lease_id: "a", reference: "LL-10001", locataire: "Julie Côté", loyer: 1150, du_ouvert: [1150] },
  { lease_id: "b", reference: "LL-10002", locataire: "Marc-André Roy", loyer: 1195, du_ouvert: [] },
  { lease_id: "c", reference: "LL-10003", locataire: "Chloé Morin", loyer: 1330, du_ouvert: [730] },
  { lease_id: "d", reference: "LL-10004", locataire: "Julie Tremblay", loyer: 1150, du_ouvert: [1150] },
];

Deno.test("référence trouvée : appliqué automatiquement, même si le montant diffère", () => {
  assertEquals(classer({ description: "VIREMENT INTERAC ll10002", amount: 500 }, baux), { type: "auto", lease_id: "b", reference: "LL-10002" });
});

Deno.test("référence d'un logement sans bail actif : rien d'automatique", () => {
  assertEquals(classer({ description: "LL-10099", amount: 1150 }, baux).type, "aucun");
});

Deno.test("sans référence : suggestion seulement si montant ET nom concordent pour un seul bail", () => {
  assertEquals(classer({ description: "INTERAC CHLOE MORIN", amount: 730 }, baux), { type: "suggestion", lease_id: "c", raison: "Montant et nom correspondent (Chloé Morin), sans référence" });
  assertEquals(classer({ description: "INTERAC MORIN", amount: 1330 }, baux).type, "suggestion");
});

Deno.test("sans référence et ambigu ou incomplet : aucun", () => {
  assertEquals(classer({ description: "INTERAC JULIE", amount: 1150 }, baux).type, "aucun");      // deux Julie à 1 150 $
  assertEquals(classer({ description: "INTERAC CHLOE MORIN", amount: 999 }, baux).type, "aucun");  // nom sans montant
  assertEquals(classer({ description: "DEPOT MOBILE", amount: 1150 }, baux).type, "aucun");        // montant sans nom
  assertEquals(classer({ description: "INTERAC ROY", amount: 1195 }, baux).type, "suggestion");    // nom court mais exact
});
