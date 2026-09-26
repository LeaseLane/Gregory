import { assert, assertEquals } from "jsr:@std/assert";
import { sansCitation, signatureValide } from "./index.ts";

const cle = "whsec_" + btoa("cle-de-test-32-octets-exactement!");
async function signer(corps: string, id: string, ts: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode("cle-de-test-32-octets-exactement!"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${id}.${ts}.${corps}`)));
  return "v1," + btoa(String.fromCharCode(...s));
}

Deno.test("signature Svix : valide acceptée, altérée ou périmée refusée", async () => {
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = await signer('{"a":1}', "msg_1", ts);
  assert(await signatureValide('{"a":1}', "msg_1", ts, sig, cle));
  assert(!(await signatureValide('{"a":2}', "msg_1", ts, sig, cle)));
  assert(!(await signatureValide('{"a":1}', "msg_1", ts, sig, cle, Date.now() + 10 * 60_000)));
});

Deno.test("la citation du message d'origine est retirée", () => {
  assertEquals(sansCitation("Oui je passe demain.\n\nLe 26 sept. 2026 à 10:00, Lease Lane a écrit :\n> Nouveau mandat"), "Oui je passe demain.");
  assertEquals(sansCitation("OK\n> ancien"), "OK");
});
