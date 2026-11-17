import { assertEquals } from "jsr:@std/assert";
import { texteBrut } from "./index.ts";
Deno.test("texteBrut retire le Markdown", () => {
  assertEquals(texteBrut("**6 %** du loyer — plus taxes."), "6 % du loyer, plus taxes.");
  assertEquals(texteBrut("Inclus :\n- visites\n- *loyers*"), "Inclus :\nvisites\nloyers");
  assertEquals(texteBrut("Call 418-473-3208 at 8 a.m."), "Call 418-473-3208 at 8 a.m.");
});
