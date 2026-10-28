import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { dateJulienne, fichierCpa005, type Fichier } from "./cpa005.ts";

const base: Fichier = {
  originateur: "0000000001", centre: "00120", numero: 7, creation: "2026-11-13", nomCourt: "LEASE LANE", nomLong: "Solutions Locatives LeaseLane",
  retour: { institution: "001", transit: "00011", compte: "1234567" },
  operations: [
    { sens: "C", code: "450", cents: 30000, date: "2026-11-15", institution: "614", transit: "00152", compte: "4004777777", nom: "Tim Jones", reference: "LL 20261115" },
    { sens: "D", code: "401", cents: 119500, date: "2026-11-15", institution: "815", transit: "20250", compte: "12345", nom: "Gabriel Paquet-Éthier", reference: "LL-10001" },
  ],
};
const champ = (l: string, de: number, a: number) => l.slice(de - 1, a); // positions de la norme, base 1

Deno.test("date julienne 0AAJJJ", () => {
  assertEquals(dateJulienne("2026-01-01"), "026001");
  assertEquals(dateJulienne("2026-11-15"), "026319");
  assertEquals(dateJulienne("2028-12-31"), "028366");
  assertThrows(() => dateJulienne("2026-02-30"));
});

Deno.test("enregistrements de 1 464 caractères, A … Z, comptes suivis", () => {
  const l = fichierCpa005(base).split("\r\n").slice(0, -1);
  assertEquals(l.map((x) => x.length), [1464, 1464, 1464, 1464]);
  assertEquals(l.map((x) => x[0] + champ(x, 2, 10)), ["A000000001", "C000000002", "D000000003", "Z000000004"]);
  assertEquals(champ(l[0], 11, 24) + champ(l[0], 25, 30) + champ(l[0], 31, 35) + champ(l[0], 56, 58), "00000000010007026317" + "00120" + "CAD");
  for (const x of l.slice(1)) assertEquals(champ(x, 11, 24), "00000000010007");
});

Deno.test("segment d'un dépôt, positions de la norme (exemple de la section D)", () => {
  const c = fichierCpa005(base).split("\r\n")[1];
  assertEquals(champ(c, 25, 27), "450");
  assertEquals(champ(c, 28, 37), "0000030000");
  assertEquals(champ(c, 38, 43), "026319");
  assertEquals(champ(c, 44, 52), "061400152");
  assertEquals(champ(c, 53, 64), "4004777777  ");
  assertEquals(champ(c, 65, 89), "0".repeat(25));
  assertEquals(champ(c, 90, 104), "LEASE LANE     ");
  assertEquals(champ(c, 105, 134).trimEnd(), "TIM JONES");
  assertEquals(champ(c, 135, 164).trimEnd(), "SOLUTIONS LOCATIVES LEASELANE");
  assertEquals(champ(c, 175, 193).trimEnd(), "LL 20261115");
  assertEquals(champ(c, 194, 214), "000100011" + "1234567     ");
  assertEquals(champ(c, 254, 264), "00000000000");
  assertEquals(champ(c, 265, 1464).trim(), "");
});

Deno.test("débit : nom sans accents, totaux du Z", () => {
  const l = fichierCpa005(base).split("\r\n");
  assertEquals(champ(l[2], 105, 134).trimEnd(), "GABRIEL PAQUET-ETHIER");
  assertEquals(champ(l[3], 25, 68), "00000000119500" + "00000001" + "00000000030000" + "00000001");
  assertEquals(champ(l[3], 69, 112), "0".repeat(44));
});

Deno.test("refus : émetteur manquant, montant, compte, numéro de fichier", () => {
  assertThrows(() => fichierCpa005({ ...base, originateur: "" }));
  assertThrows(() => fichierCpa005({ ...base, numero: 10000 }));
  assertThrows(() => fichierCpa005({ ...base, operations: [{ ...base.operations[0], cents: 0 }] }));
  assertThrows(() => fichierCpa005({ ...base, operations: [{ ...base.operations[0], compte: "1234567890123" }] }));
  assertThrows(() => fichierCpa005({ ...base, operations: [] }));
});
