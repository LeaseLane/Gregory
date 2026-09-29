import { assertEquals } from "jsr:@std/assert@1";
import { dimensionsImage } from "./image.ts";

Deno.test("PNG : largeur et hauteur de l'en-tête IHDR", () => {
  const o = new Uint8Array(33); o.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  new DataView(o.buffer).setUint32(16, 9000); new DataView(o.buffer).setUint32(20, 6000);
  assertEquals(dimensionsImage(o), { l: 9000, h: 6000 });
});

Deno.test("JPEG : saute APP0 et lit SOF0", () => {
  const o = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 17, 8, 0x1f, 0x80, 0x0f, 0xa0, 3, 0, 0, 0, 0, 0]);
  assertEquals(dimensionsImage(o), { l: 4000, h: 8064 });
});

Deno.test("format inconnu : null", () => {
  assertEquals(dimensionsImage(new Uint8Array(40)), null);
});
