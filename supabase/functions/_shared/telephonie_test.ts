import { assert } from "jsr:@std/assert@1";
import { ouvert } from "./telephonie.ts";
const H = { debut: "08:00", fin: "17:00", jours: [1, 2, 3, 4, 5] };
Deno.test("heures d'ouverture (America/Toronto)", () => {
  assert(ouvert(H, new Date("2026-10-14T14:00:00Z")), "mercredi 10 h");
  assert(!ouvert(H, new Date("2026-10-14T22:30:00Z")), "mercredi 18 h 30");
  assert(!ouvert(H, new Date("2026-10-17T14:00:00Z")), "samedi 10 h");
  assert(!ouvert(H, new Date("2026-10-14T11:59:00Z")), "mercredi 7 h 59");
});
