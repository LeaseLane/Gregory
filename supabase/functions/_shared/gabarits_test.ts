import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { remplir, rendreCourriel, rendreSms, type Contenu, versAnglais } from "./gabarits.ts";

// Les 58 gabarits tels que la plus récente migration générée les écrit (scripts/gabarits-maquettes.py).
const dossier = new URL("../../migrations/", import.meta.url);
const derniere = [...Deno.readDirSync(dossier)].map((f) => f.name).filter((n) => /_t2_gabarits/.test(n)).sort().at(-1)!;
const sql = await Deno.readTextFile(new URL(derniere, dossier));
const gabarits = [...sql.matchAll(/values \('([A-Z]{3}-\d{2})'.*?, '(\{.*?\})'::jsonb/g)]
  .map((m) => ({ code: m[1], c: JSON.parse(m[2].replaceAll("''", "'")) as Contenu }));

Deno.test("les 58 gabarits se rendent sans bloc inconnu", () => {
  assertEquals(gabarits.length, 58);
  for (const { code, c } of gabarits) {
    const r = rendreCourriel(c, {});
    assert(r.html.includes("leaselane-fond-clair.png"), code);
    assert(r.text.length > 50, code);
  }
});

Deno.test("LOC-05 : variables remplies et échappées, rien de la maquette ne reste", () => {
  const { c } = gabarits.find((g) => g.code === "LOC-05")!;
  const r = rendreCourriel(c, { prenom: "<b>Léa</b>", montant: "1 195 $", de_mois: "d’octobre", echeance: "1er octobre 2026", adresse_logement: "640, 3e Avenue — 7", lien_paiement: "https://app.leaselane.ca/p/7Q", gestionnaire: "Julie N.", initiales_gestionnaire: "JN" });
  assertEquals(r.subject, "Rappel : loyer d’octobre");
  assertStringIncludes(r.html, "&lt;b&gt;Léa&lt;/b&gt;");
  assertStringIncludes(r.html, 'href="https://app.leaselane.ca/p/7Q"');
  assertStringIncludes(r.html, "1&nbsp;195&nbsp;$");
  assert(!r.html.includes("Gabriel") && !/\{[a-z_]+\}/.test(r.html + r.text), "exemple ou variable restante");
  assertStringIncludes(r.text, "Payer maintenant : https://app.leaselane.ca/p/7Q");
});

Deno.test("lien sans valeur : le portail, jamais une adresse cassée", () => {
  const r = rendreCourriel({ subject: "s", title: "t", cta: { l: "Ouvrir", href: "{lien}" } }, {});
  assertStringIncludes(r.html, 'href="https://app.leaselane.ca"');
});

Deno.test("désabonnement seulement pour un message commercial, avec son lien", () => {
  const base: Contenu = { subject: "s", title: "t" };
  assert(!rendreCourriel(base, {}, { desabonnement: "https://x/d" }).html.includes("Se désabonner"));
  assertStringIncludes(rendreCourriel({ ...base, foot: { commercial: true } }, {}, { desabonnement: "https://x/d" }).html, 'href="https://x/d"');
});

Deno.test("SMS et variable manquante visible", () => {
  assertEquals(rendreSms("Loyer de {montant}", { montant: "10 $" }), "Loyer de 10 $");
  assertEquals(remplir("Bonjour {prenom}", {}), "Bonjour {prenom}");
});

Deno.test("anglais : montants, dates, mois, heures et durées venus de la base", () => {
  const c: [string, string][] = [["1 195 $", "$1,195"], ["2 460,90 $", "$2,460.90"], ["0 $", "$0"], ["1er novembre 2026", "November 1, 2026"], ["14 octobre", "October 14"],
    ["d’octobre 2026", "October 2026"], ["de novembre", "November"], ["septembre 2026", "September 2026"], ["04/11/2026", "November 4, 2026"],
    ["9 h 09", "9:09 a.m."], ["14 h", "2:00 p.m."], ["10 jours", "10 days"], ["1 jour", "1 day"], ["15 jours restants", "15 days left"]];
  for (const [fr, en] of c) assertEquals(versAnglais(fr), en);
  for (const libre of ["Léa Bouchard", "2880, chemin Sainte-Foy", "PORT-2026-0001", "Mai Tran", "Robinet qui fuit"]) assertEquals(versAnglais(libre), libre);
  assertEquals(versAnglais(12), 12);
});

Deno.test("anglais : cadre du courriel et variables; le français ne change pas", () => {
  const c = { subject: "Reminder: {de_mois} rent", title: "Rent of {montant}", foot: { commercial: true } };
  const en = rendreCourriel(c, { de_mois: "d’octobre", montant: "1 195 $" }, { desabonnement: "https://x/d" }, "en");
  assertEquals(en.subject, "Reminder: October rent");
  assertStringIncludes(en.html, 'lang="en-CA"'); assertStringIncludes(en.html, "Unsubscribe"); assertStringIncludes(en.html, "Privacy (Law 25)");
  assertStringIncludes(en.text, "$1,195");
  const fr = rendreCourriel(c, { de_mois: "d’octobre", montant: "1 195 $" }, { desabonnement: "https://x/d" });
  assertEquals(fr.subject, "Reminder: d’octobre rent"); assertStringIncludes(fr.html, "Se désabonner"); assertStringIncludes(fr.html, 'lang="fr-CA"');
  assertEquals(rendreSms("Rent {montant}", { montant: "10 $" }, "en"), "Rent $10");
});
