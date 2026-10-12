import { assertEquals } from "jsr:@std/assert@1";
import { montantSigne } from "./fiducie.ts";

Deno.test("le signe suit le type", () => {
  assertEquals(montantSigne("loyer", 1150), 1150);
  assertEquals(montantSigne("versement", "2500.55"), -2500.55);
  assertEquals(montantSigne("fournisseur", 700), -700);
  assertEquals(montantSigne("ajustement", 25), 25);
  assertEquals(montantSigne("ajustement", 25, "debit"), -25);
});

Deno.test("montants et types refusés", () => {
  assertEquals(typeof montantSigne("loyer", -5), "string");
  assertEquals(typeof montantSigne("loyer", 0), "string");
  assertEquals(typeof montantSigne("loyer", "abc"), "string");
  assertEquals(typeof montantSigne("cadeau", 10), "string");
  assertEquals(typeof montantSigne("loyer", 10.005), "string");
});
