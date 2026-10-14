import { REGISTRE } from "./registre.ts";
import { traduireErreur, traduireRetour } from "./erreurs.ts";

Deno.test("registre : noms uniques, écritures journalisées", () => {
  const noms = REGISTRE.map((o) => o.nom);
  if (new Set(noms).size !== noms.length) throw new Error("nom en double");
  for (const o of REGISTRE) if (o.ecriture && !o.journal) throw new Error(`${o.nom} écrit sans journal`);
  for (const o of REGISTRE) if (o.ecriture && o.agents === "direct") throw new Error(`${o.nom} : écriture directe d'agent non approuvée`);
});

Deno.test("erreurs : codes PT traduits", () => {
  if (traduireErreur({ code: "PT409", message: "x" }).code !== 409) throw new Error("409");
  if (traduireErreur({ code: "42501" }).code !== 403) throw new Error("403");
  if (traduireErreur({ code: "XX000" }).code !== 500) throw new Error("500");
});

Deno.test("retour périmé traduit en 409", () => {
  if (traduireRetour({ ok: false, code: "proposition-perimee" })?.code !== 409) throw new Error("perimee");
  if (traduireRetour({ ok: true }) !== null) throw new Error("ok");
});

Deno.test("agents : propositions seulement, jamais d'approbation", () => {
  for (const o of REGISTRE) if (/^(approve|reject)-proposal$/.test(o.nom) && o.agents !== "interdit") throw new Error(o.nom);
});
