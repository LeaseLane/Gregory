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

Deno.test("revue : une ligne connue dont le libellé a changé, au milieu de lignes connues, fait refuser le relevé", () => {
  const a = numeroter([l("2026-12-01", "A", 100, 100), l("2026-12-02", "B MODIFIE", 50, 150), l("2026-12-03", "C", 25, 175), l("2026-12-04", "D", 10, 185)]);
  const nouvelles = new Set([a[1].externe, a[3].externe]);   // A et C connues, « B MODIFIE » passe pour nouvelle
  assertMatch(verifierContinuite(a, nouvelles, 175)!, /mélangées/);
});

Deno.test("revue : une référence de banque répétée est refusée (elle fusionnerait des dépôts)", () => {
  const a = numeroter([{ ...l("2026-12-01", "A", 100, 100), reference: "1234-5" }, { ...l("2026-12-02", "B", 50, 150), reference: "1234-5" }]);
  assertMatch(verifierContinuite(a, new Set(a.map((x) => x.externe)), null)!, /valeurs répétées/);
});

Deno.test("revue : un relevé d'une seule journée, du plus récent au plus ancien, est remis dans l'ordre par ses soldes", () => {
  const a = numeroter([l("2026-12-01", "B", 50, 150), l("2026-12-01", "A", 100, 100)]);
  assertEquals(a.map((x) => x.description), ["A", "B"]);
  assertEquals(verifierContinuite(a, new Set(a.map((x) => x.externe)), 0), null);
});

Deno.test("revue : dates dans le désordre (jour/mois inversé) refusées", () => {
  const a = numeroter([l("2026-01-12", "A", 10, 10), l("2026-12-01", "B", 10, 20), l("2026-02-12", "C", 10, 30)]);
  assertMatch(verifierContinuite(a, new Set(a.map((x) => x.externe)), null)!, /pas dans l'ordre/);
});
