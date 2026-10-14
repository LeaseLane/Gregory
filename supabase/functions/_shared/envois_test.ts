import { assert, assertEquals } from "jsr:@std/assert@1";
import { createHmac } from "node:crypto";
import { estArret, jetonDesabonnement, lireJeton, signatureTwilioValide } from "./envois.ts";

Deno.test("jeton de désabonnement : aller-retour, falsification refusée", async () => {
  const j = await jetonDesabonnement("s3cret", "email", " Lea@Exemple.ca ");
  assertEquals(await lireJeton("s3cret", j), { canal: "email", adresse: "lea@exemple.ca" });
  assertEquals(await lireJeton("autre", j), null);
  const [c, s] = j.split(".");
  const autre = btoa("email:victime@exemple.ca").replace(/=+$/, "");
  assertEquals(await lireJeton("s3cret", `${autre}.${s}`), null);
  assertEquals(await lireJeton("", j), null);
  assertEquals(await lireJeton("s3cret", c), null);
});

Deno.test("signature Twilio : même calcul que la bibliothèque officielle", async () => {
  const url = "https://x.supabase.co/functions/v1/envois-retour", p = { From: "+14185550000", Body: "STOP", To: "+14185551111" };
  const sig = createHmac("sha1", "jeton").update(url + "Body" + "STOP" + "From" + "+14185550000" + "To" + "+14185551111").digest("base64");
  assert(await signatureTwilioValide("jeton", url, p, sig));
  assert(!await signatureTwilioValide("jeton", url, { ...p, Body: "Bonjour" }, sig));
  assert(!await signatureTwilioValide("", url, p, sig));
});

Deno.test("mots d'arrêt SMS", () => {
  for (const m of ["STOP", "stop", " Arrêt ", "ARRET", "désabonner"]) assert(estArret(m), m);
  for (const m of ["Stop le chauffage svp", "ok", ""]) assert(!estArret(m), m);
});
