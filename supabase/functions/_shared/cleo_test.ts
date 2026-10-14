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
