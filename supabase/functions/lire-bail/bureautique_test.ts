import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { strToU8, unzipSync, strFromU8, zipSync } from "npm:fflate@0.8.2";
import { BUREAUTIQUE, docxDepuisBlocs, texteDe } from "./bureautique.ts";

Deno.test("Word : copie modifiable puis relecture (aller-retour), tableau, case, accents, caractères spéciaux", () => {
  const docx = docxDepuisBlocs("Bail de logement", [
    { type: "titre", texte: "A — Entre le locateur et le locataire" },
    { type: "paragraphe", texte: "Locataire : Léa Bouchard\n2880, chemin Sainte-Foy <app. 1> & co" },
    { type: "tableau", lignes: [["Loyer", "1 450 $"], ["Début", "1er juillet 2026"]] },
    { type: "case", texte: "Chauffage inclus", coche: true },
  ]);
  const xml = strFromU8(unzipSync(docx)["word/document.xml"]);
  assertStringIncludes(xml, "&lt;app. 1&gt; &amp; co");
  const t = texteDe("docx", docx);
  for (const x of ["Bail de logement", "Léa Bouchard", "2880, chemin Sainte-Foy <app. 1> & co", "Loyer | 1 450 $", "☒ Chauffage inclus"]) assertStringIncludes(t, x);
});

Deno.test("PowerPoint : diapositives dans l'ordre (2 avant 10), texte des zones", () => {
  const diapo = (txt: string) => strToU8(`<p:sld xmlns:a="a" xmlns:p="p"><p:txBody><a:p><a:r><a:t>${txt}</a:t></a:r></a:p><a:p><a:r><a:t>suite</a:t></a:r><a:br/><a:r><a:t>ligne</a:t></a:r></a:p></p:txBody></p:sld>`);
  const pptx = zipSync({ "ppt/slides/slide10.xml": diapo("Dixième"), "ppt/slides/slide2.xml": diapo("Deuxième &amp; loyer"), "ppt/slides/slide1.xml": diapo("Première") });
  const t = texteDe("pptx", pptx);
  assert(t.indexOf("Première") < t.indexOf("Deuxième & loyer") && t.indexOf("Deuxième") < t.indexOf("Dixième"), t);
  assertStringIncludes(t, "— Diapositive 3 —"); assertStringIncludes(t, "suite\nligne");
});

Deno.test("OpenDocument et texte brut", () => {
  const odt = zipSync({ "content.xml": strToU8(`<office:text><text:h>Bail</text:h><text:p>Loyer<text:s text:c="2"/>: <text:span>1 450 $</text:span></text:p><text:p>Fin&#233;</text:p></office:text>`) });
  assertEquals(texteDe("odt", odt), "Bail\nLoyer  : 1 450 $\nFiné");
  assertEquals(texteDe("txt", new TextEncoder().encode("Bail\nLoyer")), "Bail\nLoyer");
  assertEquals(BUREAUTIQUE["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], "docx");
});
