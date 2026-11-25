// Bail en Word, PowerPoint ou OpenDocument (demande de Greg, 2026-11-25) : on en tire le texte pour que l'IA le lise comme un PDF.
// Et l'inverse : une copie modifiable (.docx) d'un bail transcrit par l'IA. Les fichiers .docx/.pptx/.odt sont des archives ZIP de XML.
// ponytail: extraction du texte par expressions régulières sur le XML (paragraphes, cellules, diapositives), sans mise en page;
// les vieux formats binaires (.doc, .ppt) demandent LibreOffice : on demande plutôt un .docx ou un PDF.
import { strFromU8, strToU8, unzipSync, zipSync } from "npm:fflate@0.8.2";
import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";

// Texte d'un PDF rempli à l'ordinateur (2026-11-25) : la passerelle d'IA (Tonia) ne transmet plus les PDF au modèle, alors qu'elle
// laisse passer le texte et les images. Un PDF numérisé (une image) n'a presque pas de texte : il part tel quel, comme avant.
export async function texteDePdf(octets: Uint8Array): Promise<string> {
  try {
    const { text } = await extractText(await getDocumentProxy(octets), { mergePages: false });
    return (text as string[]).map((p, i) => `— Page ${i + 1} —\n${p.trim()}`).join("\n\n");
  } catch { return ""; }
}

export const BUREAUTIQUE: Record<string, "docx" | "pptx" | "odt" | "txt"> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.oasis.opendocument.text": "odt",
  "text/plain": "txt",
};

const ENTITES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decoder = (s: string) => s.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (m, e: string) =>
  e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(e[1] === "x" || e[1] === "X" ? 2 : 1), e[1] === "x" || e[1] === "X" ? 16 : 10)) : ENTITES[e.toLowerCase()] ?? m);

// Un paragraphe XML → son texte : tabulations et sauts gardés, balises retirées.
function texteParagraphe(xml: string, balise: string): string {
  // Tabulation et saut de ligne sont hors des zones de texte : on les change en zones de texte pour les garder.
  // « <w:t » seul, suivi d'un espace ou de « > » (sinon <w:tbl>, <w:tc>, <w:tr>… seraient pris pour du texte).
  return decoder(xml.replace(/<(?:w|a):tab\/>/g, `<${balise}>\t</${balise}>`).replace(/<(?:w|a):br\/>/g, `<${balise}>\n</${balise}>`)
    .replace(new RegExp(`<${balise}(?:\\s[^>]*)?>([\\s\\S]*?)</${balise}>`, "g"), "\u0000$1\u0000").split("\u0000").filter((_, i) => i % 2 === 1).join(""));
}
const paragraphes = (xml: string, fin: RegExp, run: string) =>
  xml.split(fin).map((p) => texteParagraphe(p, run)).map((s) => s.replace(/[ \t]+\n/g, "\n").trimEnd());

export function texteDe(type: "docx" | "pptx" | "odt" | "txt", octets: Uint8Array): string {
  if (type === "txt") return new TextDecoder().decode(octets);
  const zip = unzipSync(octets);
  const lire = (nom: string) => (zip[nom] ? strFromU8(zip[nom]) : "");
  let lignes: string[] = [];
  if (type === "docx") {
    // Corps, puis en-têtes et pieds (souvent l'adresse ou le numéro du formulaire). Cellules d'un tableau séparées par « | ».
    const parties = ["word/document.xml", ...Object.keys(zip).filter((n) => /^word\/(header|footer)\d*\.xml$/.test(n)).sort()];
    // Une rangée de tableau devient une seule ligne « cellule | cellule » (chaque cellule contient ses propres paragraphes).
    const rangee = (tr: string) => `<w:p><w:r><w:t>${(tr.match(/<w:tc[\s>][\s\S]*?<\/w:tc>/g) ?? [])
      .map((tc) => paragraphes(tc, /<\/w:p>/, "w:t").filter(Boolean).join(" ").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).join(" | ")}</w:t></w:r></w:p>`;
    for (const p of parties) lignes.push(...paragraphes(lire(p).replace(/<w:tr[\s>][\s\S]*?<\/w:tr>/g, rangee), /<\/w:p>/, "w:t"));
  } else if (type === "pptx") {
    const diapos = Object.keys(zip).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
    diapos.forEach((d, i) => lignes.push(`— Diapositive ${i + 1} —`, ...paragraphes(lire(d), /<\/a:p>/, "a:t")));
  } else {
    lignes = lire("content.xml").split(/<\/text:(?:p|h)>/).map((p) => decoder(p.replace(/<text:s(?: text:c="(\d+)")?\/>/g, (_m, n) => " ".repeat(Number(n ?? 1)))
      .replace(/<text:tab\/>/g, "\t").replace(/<text:line-break\/>/g, "\n").replace(/<[^>]+>/g, "")).trimEnd());
  }
  return lignes.filter((l, i, t) => l.trim() || (i > 0 && t[i - 1].trim())).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ── Copie modifiable : blocs transcrits par l'IA → .docx (Word, LibreOffice, Google Docs) ──
export type Bloc = { type: "titre" | "paragraphe" | "tableau" | "case"; texte?: string; lignes?: string[][]; coche?: boolean };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const run = (texte: string, gras = false, taille = 22) =>
  `<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>${gras ? "<w:b/>" : ""}<w:sz w:val="${taille}"/></w:rPr>` +
  texte.split("\n").map((l, i) => `${i ? "<w:br/>" : ""}<w:t xml:space="preserve">${esc(l)}</w:t>`).join("") + "</w:r>";
const para = (texte: string, gras = false, taille = 22, avant = 0) =>
  `<w:p><w:pPr><w:spacing w:before="${avant}" w:after="120"/></w:pPr>${run(texte, gras, taille)}</w:p>`;

export function docxDepuisBlocs(titre: string, blocs: Bloc[]): Uint8Array {
  // L'IA répète souvent le titre en premier bloc : on ne l'écrit qu'une fois.
  if (blocs[0]?.texte?.trim() === titre.trim()) blocs = blocs.slice(1);
  const corps = [para(titre, true, 32, 0), ...blocs.map((b) => {
    if (b.type === "titre") return para(b.texte ?? "", true, 26, 240);
    if (b.type === "case") return para(`${b.coche ? "☒" : "☐"} ${b.texte ?? ""}`);
    if (b.type === "tableau" && b.lignes?.length) {
      const n = Math.max(...b.lignes.map((l) => l.length)), larg = Math.floor(9360 / n);
      const bord = (c: string) => `<w:${c} w:val="single" w:sz="4" w:space="0" w:color="999999"/>`;
      return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(bord).join("")}</w:tblBorders></w:tblPr>` +
        `<w:tblGrid>${`<w:gridCol w:w="${larg}"/>`.repeat(n)}</w:tblGrid>` +
        b.lignes.map((l) => `<w:tr>${Array.from({ length: n }, (_, i) => `<w:tc><w:tcPr><w:tcW w:w="${larg}" w:type="dxa"/></w:tcPr>${para(l[i] ?? "")}</w:tc>`).join("")}</w:tr>`).join("") +
        `</w:tbl>${para("")}`;
    }
    return para(b.texte ?? "");
  })].join("");
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${corps}` +
    `<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  return zipSync({
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`),
    "word/document.xml": strToU8(document),
  });
}
