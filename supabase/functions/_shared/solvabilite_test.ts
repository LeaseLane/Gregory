import { assert, assertEquals } from "jsr:@std/assert@1";
import { resumePaiements, simuler } from "./solvabilite.ts";

Deno.test("simulateur : déterministe, statuts distincts", () => {
  assertEquals(simuler("emilie@exemple.test", 1350), simuler("Emilie@exemple.test", 1350));
  assertEquals(simuler("dossier-vide@exemple.test", 1000).result, "empty");
  assertEquals(simuler("erreur@exemple.test", 1000).result, "error");
  const r = simuler("gabriel@exemple.test", 1200).report!;
  assert(r.cote >= 1 && r.cote <= 5 && r.paiements.length === 12 && r.recommandation.length > 10);
});
Deno.test("résumé des paiements", () => {
  assertEquals(resumePaiements([0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0], new Date(2026, 9, 14)), "11 à temps · 1 retard de 6 jours (février)");
});
