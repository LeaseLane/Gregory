import { assertEquals } from "jsr:@std/assert@1";
import { extraireReference } from "./reference.ts";

Deno.test("références trouvées dans les libellés bancaires", () => {
  for (const t of ["VIREMENT INTERAC LL-10023", "Loyer octobre ll10023", "réf: LL 10023 merci", "LL–10023", "LL_10023", "e-Transfer LL.10023 Julie"]) {
    assertEquals(extraireReference(t), "LL-10023", t);
  }
});

Deno.test("pas de fausse référence", () => {
  for (const t of ["VIREMENT INTERAC J COTE", "MALL-10023", "LL-1002", "LL-100231", "", null, "BILL 10023"]) {
    assertEquals(extraireReference(t as string), null, String(t));
  }
});

Deno.test("deux références différentes : ambigu, rien n'est choisi", () => {
  assertEquals(extraireReference("LL-10023 et LL-10024"), null);
  assertEquals(extraireReference("LL-10023 / ll10023"), "LL-10023");
});
