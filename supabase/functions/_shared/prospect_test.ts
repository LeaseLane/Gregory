import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { nouveauProspect } from "./prospect.ts";

Deno.test("nom requis, courriel vérifié", () => {
  assertEquals(nouveauProspect({ full_name: "  " }), { erreur: "Le nom du prospect est requis." });
  assertEquals(nouveauProspect({ full_name: "Essai", email: "pas-un-courriel" }), { erreur: "Courriel invalide." });
});

Deno.test("revenu potentiel = portes × loyer × 6 %, source par défaut", () => {
  const r = nouveauProspect({ full_name: " Gestion Essai ", num_doors: "12", avg_rent: 1000, notes: "  " }, "prospecteur");
  if (!("ligne" in r)) throw new Error(r.erreur);
  assertEquals(r.ligne.full_name, "Gestion Essai");
  assertEquals(r.ligne.potential_monthly_revenue, 720);
  assertEquals(r.ligne.lead_source, "prospecteur");
  assertEquals(r.ligne.notes, null);
  assertEquals(r.ligne.stage, "new");
});
