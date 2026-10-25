import { assertEquals } from "jsr:@std/assert@1";
import { lire } from "./index.ts";

Deno.test("lit la suggestion JSON, même entourée de texte", () => {
  assertEquals(lire('Voici : {"categorie": "Plomberie", "urgence": "normale", "raison": "fuite au robinet"}'), { categorie: "Plomberie", urgence: "normale", raison: "fuite au robinet" });
});
Deno.test("refuse une catégorie ou une urgence inconnue", () => {
  assertEquals(lire('{"categorie": "Toiture", "urgence": "normale", "raison": "x"}'), null);
  assertEquals(lire('{"categorie": "Plomberie", "urgence": "haute", "raison": "x"}'), null);
  assertEquals(lire("pas de JSON"), null);
});
