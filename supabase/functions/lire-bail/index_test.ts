import { assertEquals } from "jsr:@std/assert@1";
import { estUnBail, extraireJson, nettoyer } from "./lecture.ts";

const L = [{ id: "u1", libelle: "2880, chemin Sainte-Foy, Québec — 3", loyer: 1100 }];

Deno.test("nettoyer : garde les champs valides, écarte le logement hors liste et les courriels invalides", () => {
  const b = nettoyer({ locataires: [{ nom: "Zoé Martin", courriel: "ZOE@Ex.ca", telephone: "418 555-0101" }, { nom: "X" }, { nom: "Léo Roy", courriel: "pas-un-courriel" }],
    adresse: "2880 ch. Sainte-Foy", logement: "3", loyer: 1100.004, debut: "2026-07-01", fin: "30/06/2027", unit_id: "inconnu", remarques: "" }, L);
  assertEquals(b.locataires, [{ nom: "Zoé Martin", courriel: "zoe@ex.ca", telephone: "418 555-0101" }, { nom: "Léo Roy", courriel: null, telephone: null }]);
  assertEquals([b.unit_id, b.loyer, b.debut, b.fin, b.remarques], [null, 1100, "2026-07-01", null, null]);
  assertEquals(nettoyer({ unit_id: "u1", loyer: -5 }, L).unit_id, "u1");
  assertEquals(nettoyer({ loyer: -5 }, L).loyer, null);
  assertEquals(nettoyer(null, L).locataires, []);
});

Deno.test("extraireJson : JSON entouré de texte, ou rien", () => {
  assertEquals(extraireJson('Voici :\n{"loyer": 900}\nFin.'), { loyer: 900 });
  assertEquals(extraireJson("aucun objet"), null);
  assertEquals(extraireJson("{ cassé"), null);
});

Deno.test("estUnBail : seul un true explicite passe", () => {
  assertEquals([estUnBail({ est_un_bail: true }), estUnBail({ est_un_bail: false }), estUnBail({ est_un_bail: "oui" }), estUnBail({}), estUnBail(null)], [true, false, false, false, false]);
});
