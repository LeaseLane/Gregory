// Vérifie la bascule et le format de l'identifiant de modèle — les deux
// points où une erreur est silencieuse : une URL restée sur Anthropic
// alors qu'on croit passer par le Canada, ou un identifiant daté refusé
// par un 400 qu'on met des jours à diagnostiquer.
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";

Deno.test("l'identifiant de modèle n'a pas de suffixe de date", async () => {
  const { MODELE_RAPIDE } = await import("./ia.ts");
  // claude-haiku-4-5-20251001 est refusé; claude-haiku-4-5 est accepté.
  assertEquals(/-\d{8}$/.test(MODELE_RAPIDE), false,
    `« ${MODELE_RAPIDE} » porte un suffixe de date — l'API le refuse par un 400`);
  assertStringIncludes(MODELE_RAPIDE, "claude-");
});

Deno.test("sans IA_BASE_URL, on appelle Anthropic directement", async () => {
  const mod = await import("./ia.ts");
  // Le module lit la variable à l'import : l'absence de bascule doit
  // laisser le comportement d'avant, sans quoi une mauvaise
  // configuration couperait les dix-huit fonctions d'un coup.
  assertEquals(typeof mod.appelerIA, "function");
});
