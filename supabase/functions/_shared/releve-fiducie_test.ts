import { assertEquals, assertMatch } from "jsr:@std/assert@1";
import { numeroter, verifierContinuite, type LigneReleve } from "./releve-fiducie.ts";

const l = (date: string, description: string, amount: number, solde?: number): LigneReleve => ({ date, description, amount, solde });

Deno.test("deux virements identiques le même jour restent deux lignes; un réimport redonne les mêmes identifiants", () => {
  const a = numeroter([l("2026-12-01", "INTERAC COLOC A", 750, 750), l("2026-12-01", "INTERAC COLOC A", 750, 1500)]);
  assertEquals(new Set(a.map((x) => x.externe)).size, 2);
  assertEquals(numeroter([l("2026-12-01", "INTERAC COLOC A", 750, 750), l("2026-12-01", "INTERAC COLOC A", 750, 1500)]).map((x) => x.externe), a.map((x) => x.externe));
});

Deno.test("un export du plus récent au plus ancien est remis dans l'ordre", () => {
  const a = numeroter([l("2026-12-02", "B", 10, 30), l("2026-12-01", "A", 20, 20)]);
  assertEquals(a.map((x) => x.description), ["A", "B"]);
});

Deno.test("soldes : un relevé qui suit le précédent passe; un trou est refusé", () => {
  const a = numeroter([l("2026-12-03", "C", 100, 1100), l("2026-12-04", "D", -50, 1050)]);
  const n = new Set(a.map((x) => x.externe));
  assertEquals(verifierContinuite(a, n, 1000), null);
  assertMatch(verifierContinuite(a, n, 900)!, /ne suit pas le précédent/);
});

Deno.test("soldes : lignes incohérentes dans le fichier (mauvaise colonne) refusées", () => {
  const a = numeroter([l("2026-12-03", "C", 100, 1100), l("2026-12-04", "D", -50, 999)]);
  assertMatch(verifierContinuite(a, new Set(a.map((x) => x.externe)), null)!, /ne s'enchaînent pas/);
});

Deno.test("chevauchement : les lignes déjà importées sont reconnues, la suite est vérifiée dans le fichier", () => {
  const a = numeroter([l("2026-12-01", "A", 100, 100), l("2026-12-02", "B", 50, 150)]);
  assertEquals(verifierContinuite(a, new Set([a[1].externe]), 100), null);   // A déjà importé, B nouveau
});

Deno.test("sans colonne de solde : rien à vérifier", () => {
  const a = numeroter([l("2026-12-01", "A", 100), l("2026-12-02", "B", 50)]);
  assertEquals(verifierContinuite(a, new Set(a.map((x) => x.externe)), 999), null);
});
