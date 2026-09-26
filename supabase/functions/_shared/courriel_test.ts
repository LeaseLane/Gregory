// Vérification exécutable du gabarit courriel : `deno test --allow-env
// --allow-net supabase/functions/_shared/courriel_test.ts`.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { avecHtml, LOGO_URL } from "./courriel.ts";
import { PORTAILS } from "./branding.ts";

const courriel = avecHtml({
  from: "x",
  to: ["y"],
  subject: "⚠️ Alerte <b>test</b>",
  text: `Bonjour <script>alert(1)</script>,\n\nMessage du locataire : "Fuite" & dégât 🚰\nMontant : 1400 $\n\nPortail : ${PORTAILS.locataire}`,
});

Deno.test("les données de l'usager sont échappées", () => {
  // Un nom ou un message de locataire est injecté tel quel dans le HTML :
  // sans échappement, n'importe qui insère du code dans nos courriels.
  assert(!courriel.html.includes("<script>"));
  assert(courriel.html.includes("&lt;script&gt;"));
  assert(!courriel.html.includes("<b>test</b>"));
});

Deno.test("le logo est un PNG par URL absolue, jamais un SVG", () => {
  // Gmail et Outlook n'affichent pas le SVG : le logo serait un carré vide.
  assert(courriel.html.includes(`src="${LOGO_URL}"`));
  assert(LOGO_URL.startsWith("https://") && LOGO_URL.endsWith(".png"));
  assert(!/\.svg/i.test(courriel.html));
});

Deno.test("aucun emoji dans le HTML, objet et texte intacts", () => {
  assert(!/\p{Extended_Pictographic}/u.test(courriel.html));
  // Le gabarit ne réécrit rien de ce qui est envoyé.
  assertEquals(courriel.subject, "⚠️ Alerte <b>test</b>");
  assert(courriel.text.includes("🚰"));
});

Deno.test("un lien de portail devient le bouton d'action", () => {
  assert(courriel.html.includes(`href="${PORTAILS.locataire}"`));
  assert(courriel.html.includes("Ouvrir mon portail"));
  assert(courriel.html.includes("1400 $"));
});
