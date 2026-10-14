import { assertEquals } from "jsr:@std/assert@1";
import { valider } from "./cleo.ts";

const faits = [{ fait: "Loyer en retard", source: { libelle: "Dossier JUR-1", lien: "/juridique?d=1" } }, { fait: "Proposition en attente", proposition_id: "p1", operation: "approve-formal-notice", source: { libelle: "À approuver", lien: "/operations/a-approuver" } }];

Deno.test("cleo : sources inventées retirées, libellé de la base gardé", () => {
  const r = valider({ constat: "x", sources: [{ libelle: "autre", lien: "/juridique?d=1" }, { libelle: "Inventée", lien: "https://exemple.com" }] }, faits);
  assertEquals(r.sources, [{ libelle: "Dossier JUR-1", lien: "/juridique?d=1" }]);
});
Deno.test("cleo : action seulement sur une proposition ou un lien du contexte", () => {
  assertEquals(valider({ constat: "x", action: { type: "proposition", titre: "t", proposition_id: "p1" } }, faits).action?.proposition_id, "p1");
  assertEquals(valider({ constat: "x", action: { type: "proposition", titre: "t", proposition_id: "inventee" } }, faits).action, null);
  assertEquals(valider({ constat: "x", action: { type: "lien", titre: "t", lien: "/ailleurs" } }, faits).action, null);
});
Deno.test("cleo : l'opération et le lien d'une proposition viennent des faits", () => {
  const a = valider({ constat: "x", action: { type: "proposition", titre: "t", proposition_id: "p1", lien: "/inventé", operation: "autre" } }, faits).action!;
  assertEquals([a.operation, a.lien], ["approve-formal-notice", "/operations/a-approuver"]);
});
Deno.test("cleo : action sans titre → titre tiré de la source", () => {
  assertEquals(valider({ constat: "x", action: { type: "lien", titre: "", lien: "/juridique?d=1" } }, faits).action?.titre, "Ouvrir : Dossier JUR-1");
});
Deno.test("cleo : autorisation de dépense seulement si elle est dans les faits; montant de la base", () => {
  const f = [{ fait: "Autorisation de dépense en attente", autorisation_id: "a1", montant: 1250, source: { libelle: "Demande", lien: "/proprietaire/demandes?d=1" } }];
  assertEquals(valider({ constat: "x", action: { type: "depense", titre: "Approuver", autorisation_id: "a1", montant: 1 } }, f).action?.montant, 1250);
  assertEquals(valider({ constat: "x", action: { type: "depense", titre: "Approuver", autorisation_id: "inventee" } }, f).action, null);
});
Deno.test("cleo : intervention seulement si elle est dans les faits; fournisseur et moment de la base", () => {
  const f = [{ fait: "Intervention à confirmer", intervention_id: "w1", fournisseur: "Menuiserie", quand: "2026-10-14 09:00", source: { libelle: "Demande", lien: "/locataire/demandes?d=1" } }];
  const a = valider({ constat: "x", action: { type: "intervention", titre: "t", intervention_id: "w1", fournisseur: "Inventé" } }, f).action!;
  assertEquals([a.fournisseur, a.quand, a.lien], ["Menuiserie", "2026-10-14 09:00", "/locataire/demandes?d=1"]);
  assertEquals(valider({ constat: "x", action: { type: "intervention", titre: "t", intervention_id: "inventee" } }, f).action, null);
});
Deno.test("cleo : brouillon de demande nettoyé (urgence connue, textes bornés)", () => {
  const a = valider({ constat: "x", action: { type: "demande", titre: "", brouillon: { titre: "Robinet qui goutte", urgence: "extreme" as never, description: "Le robinet de la salle de bain goutte." } } }, []).action!;
  assertEquals([a.titre, a.brouillon?.urgence], ["Demande prête", "normale"]);
  assertEquals(valider({ constat: "x", action: { type: "demande", titre: "t", brouillon: { titre: "x", urgence: "normale", description: "" } } }, []).action, null);
});
