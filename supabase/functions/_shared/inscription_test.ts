import { assertEquals } from "jsr:@std/assert@1";
import { chiffresTelephone, MESSAGES, TAILLE_MAX, telephoneFormate, texteAvisEquipe, typeFichier, validerInscription } from "./inscription.ts";

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
const ok = { courriel: " Vous@Entreprise.ca ", telephone: "(418) 555-0142", poste: "", octets: PDF };

Deno.test("type réel du fichier par ses premiers octets", () => {
  assertEquals(typeFichier(PDF)?.ext, "pdf");
  assertEquals(typeFichier(JPG)?.mime, "image/jpeg");
  assertEquals(typeFichier(PNG)?.ext, "png");
  for (const b of [new Uint8Array([0x47, 0x49, 0x46, 0x38]), new TextEncoder().encode("<svg"), new Uint8Array([0x25, 0x50]), new Uint8Array()]) {
    assertEquals(typeFichier(b), null);
  }
});

Deno.test("téléphone : 10 chiffres, ou 11 commençant par 1", () => {
  for (const t of ["418 555-0142", "(418) 555-0142", "418.555.0142", "+1 418 555 0142", "1-418-555-0142", "4185550142"]) assertEquals(chiffresTelephone(t), "4185550142", t);
  for (const t of ["555-0142", "2 418 555 0142", "418 555 01424", "418-555-0142 x12", "418 555 O142"]) assertEquals(chiffresTelephone(t), null, t);
  assertEquals(telephoneFormate("4185550142"), "418 555-0142");
});

Deno.test("demande valide : courriel normalisé, téléphone en chiffres", () => {
  const r = validerInscription({ ...ok, poste: " 123456 " });
  assertEquals(r.ok && [r.demande.courriel, r.demande.telephone, r.demande.poste, r.demande.type.ext], ["vous@entreprise.ca", "4185550142", "123456", "pdf"]);
  const sans = validerInscription(ok);
  assertEquals(sans.ok && sans.demande.poste, null);
});

Deno.test("premier champ en erreur et message exact", () => {
  const cas: [Record<string, unknown>, string, string][] = [
    [{ ...ok, octets: null }, "document", MESSAGES.document_manquant],
    [{ ...ok, octets: new Uint8Array(TAILLE_MAX + 1).fill(0x25) }, "document", MESSAGES.document_taille],
    [{ ...ok, octets: new TextEncoder().encode("GIF89a") }, "document", MESSAGES.document_format],
    [{ ...ok, telephone: "  " }, "telephone", MESSAGES.telephone_vide],
    [{ ...ok, telephone: "555-0142" }, "telephone", MESSAGES.telephone_invalide],
    [{ ...ok, poste: "12a" }, "poste", MESSAGES.poste],
    [{ ...ok, poste: "1234567" }, "poste", MESSAGES.poste],
    [{ ...ok, courriel: "" }, "courriel", MESSAGES.courriel_vide],
    [{ ...ok, courriel: "vous@entreprise" }, "courriel", MESSAGES.courriel_invalide],
    [{ ...ok, courriel: "a".repeat(196) + "@b.ca" }, "courriel", MESSAGES.courriel_invalide],
    [{ ...ok, courriel: 'a"onload="x@b.ca' }, "courriel", MESSAGES.courriel_invalide],
    [{ ...ok, courriel: "<b>@b.ca" }, "courriel", MESSAGES.courriel_invalide],
  ];
  for (const [f, champ, error] of cas) {
    const r = validerInscription(f as never);
    assertEquals(r.ok ? null : [r.champ, r.error], [champ, error], champ);
  }
  // 10 Mo pile : accepté.
  const pile = new Uint8Array(TAILLE_MAX); pile.set(PDF);
  assertEquals(validerInscription({ ...ok, octets: pile }).ok, true);
});

Deno.test("avis à l'équipe : coordonnées et lien vers l'onglet privé, jamais un lien de stockage", () => {
  const t = texteAvisEquipe({ id: "x", courriel: "vous@entreprise.ca", telephone: "4185550142", poste: "12", created_at: "2026-10-20T18:05:00Z" });
  for (const s of ["Téléphone : 418 555-0142", "Poste : 12", "Courriel : vous@entreprise.ca", "Reçue le : ", "https://app.leaselane.ca/portail-admin"]) assertEquals(t.includes(s), true, s);
  assertEquals(/storage|sign/.test(t), false);
});
