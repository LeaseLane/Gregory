// Gabarit HTML unique de tous les courriels Lease Lane.
//
// POURQUOI CE MODULE. Les 31 envois partaient en texte brut, chacun rédigé
// dans sa fonction : aucun logo, aucune mise en page, et rien qui
// distingue un courriel Lease Lane d'un pourriel. Chaque envoi garde
// désormais son `text` tel quel (rien ne change pour les clients texte ni
// pour ce qui est dit), et reçoit en plus un `html` produit ICI, à partir
// de ce même texte. Changer l'allure de tous les courriels = modifier ce
// seul fichier.
//
// Contraintes des logiciels de courriel, respectées volontairement :
// - mise en page en tableaux, styles en ligne : Gmail retire les <style>;
// - logo en PNG par URL absolue : ni Gmail ni Outlook n'affichent le SVG;
// - bouton « à l'épreuve des balles » (VML pour Outlook, lien sinon);
// - couleurs de fond explicites partout, pour que le mode sombre ne
//   produise pas de texte marine sur fond noir.
import { MARQUE, PORTAILS, SITE_BASE_URL } from "./branding.ts";

// Servi par GitHub Pages depuis assets/courriel/ du dépôt. Tant que ce
// fichier n'est pas fusionné dans main ET publié, le logo est cassé.
export const LOGO_URL = `${SITE_BASE_URL}/assets/courriel/leaselane-horizontal-marine.png`;

// Pourquoi l'usager reçoit ce courriel — une ligne en pied de page.
export const POURQUOI = {
  defaut: `Vous recevez ce courriel parce qu'un compte ou un dossier à votre nom est géré sur la plateforme ${MARQUE}.`,
  admin: `Vous recevez ce courriel parce que vous êtes administrateur de la plateforme ${MARQUE}.`,
  prospect: `Vous recevez ce courriel parce que vous avez communiqué avec ${MARQUE}.`,
  travailleur: `Vous recevez ce courriel parce que vous êtes inscrit comme travailleur sur ${MARQUE} Pro.`,
} as const;

const C = {
  marine: "#0A2038",
  bleu: "#4581CB",
  bleu025: "#ECF2F9",
  fond: "#F7F9FB",
  gris050: "#EEF1F5",
  filet: "#E1E6EC",
  discret: "#58697F",
  corps: "#3E4A59",
  blanc: "#FFFFFF",
};
const POLICE = "'IBM Plex Sans', Arial, Helvetica, sans-serif";
const POLICE_TITRE = "'Bebas Neue', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";

export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// La marque interdit l'emoji; certains objets et textes rédigés par l'IA
// en contiennent. Retirés du HTML seulement — l'objet et le texte brut
// restent intacts.
const sansEmoji = (s: string) => s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/^\s+/, "");

const URL_RE = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)]/g;

// Échappe un fragment de texte, rend ses liens cliquables et pose l'espace
// fine insécable avant $ et % (« 1 400 $ »). Les URL sont traitées à part
// pour ne jamais insérer d'espace dans un « %20 ».
function enLigne(s: string): string {
  let html = "";
  let i = 0;
  for (const m of s.matchAll(URL_RE)) {
    html += typo(s.slice(i, m.index)) +
      `<a href="${esc(m[0])}" style="color:${C.bleu};text-decoration:underline;word-break:break-all;">${esc(m[0])}</a>`;
    i = m.index! + m[0].length;
  }
  return html + typo(s.slice(i));
}
const typo = (s: string) => esc(s).replace(/(\d) ?([$%])/g, "$1 $2");

// « Libellé : valeur » — une ligne de fiche (Courriel : x, Adresse : y).
const LIGNE_FICHE = /^([A-ZÀ-ÖØ-Ý][\p{L}\s'’()-]{0,30}?) : (.+)$/u;
const fiche = (l: string) => {
  const m = l.match(LIGNE_FICHE);
  return m && (m[1].split("(").length === m[1].split(")").length) ? m : null;
};

export type Bouton = { libelle: string; url: string };

export function boutonHtml({ libelle, url }: Bouton): string {
  const u = esc(url), l = esc(libelle);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr><td align="left">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${u}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="17%" stroke="f" fillcolor="${C.bleu}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${l}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a href="${u}" style="background-color:${C.bleu};border-radius:8px;color:#ffffff;display:inline-block;font-family:${POLICE};font-size:15px;font-weight:600;line-height:48px;padding:0 28px;text-align:center;text-decoration:none;mso-hide:all;">${l}</a><!--<![endif]-->
</td></tr></table>`;
}

const P = `margin:0 0 18px;font-family:${POLICE};font-size:16px;line-height:1.62;color:${C.corps};`;

// Convertit le texte brut d'un courriel en HTML, sans rien réécrire : les
// paragraphes restent les paragraphes, les lignes restent les lignes.
// Si l'URL du bouton figure dans le texte, le bouton prend sa place.
export function texteEnHtml(texte: string, bouton?: Bouton): string {
  const paragraphes = sansEmoji(String(texte ?? "")).replace(/\r/g, "").trim().split(/\n\s*\n/);
  let boutonPose = false;
  const blocs = paragraphes.map((p) => {
    let lignes = p.split("\n").map((l) => l.trimEnd()).filter((l, i, a) => l || (i > 0 && i < a.length - 1));
    let apres = "";
    if (bouton && !boutonPose && p.includes(bouton.url)) {
      boutonPose = true;
      apres = boutonHtml(bouton);
      const der = lignes[lignes.length - 1];
      if (der.trimEnd().endsWith(bouton.url)) {
        // L'URL termine le paragraphe : le bouton la remplace.
        lignes[lignes.length - 1] = der.slice(0, der.lastIndexOf(bouton.url)).trimEnd();
        if (!lignes[lignes.length - 1]) lignes = lignes.slice(0, -1);
      }
    }
    if (!lignes.length) return apres;
    let html = "";
    const titre = lignes[0].match(/^-{2,}\s*(.+?)\s*-{2,}$/);
    if (/^-{3,}$/.test(lignes[0])) {
      // « --- » : un filet; ce qui suit (avis légal) passe en petit.
      html += `<div style="border-top:1px solid ${C.filet};margin:8px 0 18px;line-height:1px;font-size:1px;">&nbsp;</div>`;
      lignes = lignes.slice(1);
      if (lignes.length) return html + `<p style="${P}font-size:13px;color:${C.discret};">${lignes.map(enLigne).join("<br>")}</p>` + apres;
      return html + apres;
    }
    if (titre) {
      html += `<p style="margin:8px 0 8px;font-family:${POLICE};font-size:11px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:${C.bleu};">${enLigne(titre[1])}</p>`;
      lignes = lignes.slice(1);
    }
    if (lignes.length >= 2 && lignes.every((l) => fiche(l))) {
      html += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.fond}" style="background-color:${C.fond};border:1px solid ${C.filet};border-radius:10px;margin:0 0 20px;">` +
        lignes.map((l, i) => {
          const m = fiche(l)!;
          const bord = i ? `border-top:1px solid ${C.filet};` : "";
          return `<tr><td style="${bord}padding:11px 16px;font-family:${POLICE};font-size:12px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:${C.discret};width:38%;vertical-align:top;">${enLigne(m[1])}</td><td style="${bord}padding:10px 16px 10px 0;font-family:${POLICE};font-size:15px;line-height:1.5;color:${C.marine};vertical-align:top;">${enLigne(m[2])}</td></tr>`;
        }).join("") + `</table>`;
    } else if (lignes.length) {
      html += `<p style="${P}">${lignes.map(enLigne).join("<br>")}</p>`;
    }
    return html + apres;
  });
  if (bouton && !boutonPose) blocs.push(boutonHtml(bouton));
  return blocs.join("\n");
}

export type OptionsGabarit = {
  titre: string;
  preentete?: string;
  contenuHtml: string;
  bouton?: Bouton;
  pied?: string;
};

export function gabaritCourriel({ titre, preentete = "", contenuHtml, bouton, pied = POURQUOI.defaut }: OptionsGabarit): string {
  const t = esc(sansEmoji(titre ?? ""));
  return `<!DOCTYPE html>
<html lang="fr-CA" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${t}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
  @media (max-width:620px){ .ll-pad{padding-left:24px!important;padding-right:24px!important;} .ll-titre{font-size:30px!important;} }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.fond};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.fond};">${esc(sansEmoji(preentete))}${"&#8199;&#65279;&#847; ".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.fond}" style="background-color:${C.fond};">
<tr><td align="center" style="padding:32px 12px;">
  <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
    <tr><td bgcolor="${C.marine}" class="ll-pad" style="background-color:${C.marine};border-radius:14px 14px 0 0;padding:24px 44px;">
      <a href="${SITE_BASE_URL}" style="text-decoration:none;"><img src="${LOGO_URL}" width="200" height="62" alt="${esc(MARQUE)}" style="display:block;border:0;outline:none;width:200px;height:auto;color:#ffffff;font-family:${POLICE};font-size:20px;font-weight:600;"></a>
    </td></tr>
    <tr><td bgcolor="${C.bleu}" style="background-color:${C.bleu};height:3px;line-height:3px;font-size:3px;">&nbsp;</td></tr>
    <tr><td bgcolor="${C.blanc}" class="ll-pad" style="background-color:${C.blanc};border:1px solid ${C.filet};border-top:0;border-radius:0 0 14px 14px;padding:40px 44px 28px;">
      <h1 class="ll-titre" style="margin:0 0 24px;font-family:${POLICE_TITRE};font-size:34px;font-weight:400;line-height:1.05;letter-spacing:.5px;text-transform:uppercase;color:${C.marine};mso-line-height-rule:exactly;">${t}</h1>
      ${contenuHtml}
      ${bouton ? boutonHtml(bouton) : ""}
    </td></tr>
    <tr><td align="center" class="ll-pad" style="padding:28px 44px 8px;">
      <p style="margin:0 0 6px;font-family:${POLICE_TITRE};font-size:20px;letter-spacing:1px;text-transform:uppercase;color:${C.marine};">Une clé <span style="color:${C.bleu};">d'avance</span></p>
      <p style="margin:0 0 14px;font-family:${POLICE};font-size:13px;line-height:1.5;color:${C.corps};">Solutions locatives ${esc(MARQUE)} · Lévis, Québec</p>
      <p style="margin:0;font-family:${POLICE};font-size:12px;line-height:1.55;color:${C.discret};">${esc(pied)}</p>
    </td></tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}

// Préentête par défaut : le premier paragraphe qui n'est pas la salutation.
function preenteteDe(texte: string): string {
  const p = String(texte ?? "").split(/\n\s*\n/).map((s) => s.trim()).find((s) => s && !/^bonjour\b/i.test(s)) ?? "";
  const net = p.replace(URL_RE, "").replace(/\s+/g, " ").trim();
  return net.length > 120 ? net.slice(0, 117).trimEnd() + "…" : net;
}

// Le bouton implicite : un lien vers un portail présent dans le texte.
function boutonPortail(texte: string): Bouton | undefined {
  const url = String(texte ?? "").match(URL_RE)?.find((u) => Object.values(PORTAILS).includes(u as never));
  return url ? { libelle: "Ouvrir mon portail", url } : undefined;
}

// Point d'entrée des fonctions : prend la charge utile Resend telle
// qu'elle était (from, to, subject, text…) et y ajoute le `html`. Rien
// d'autre n'est modifié — ni l'objet, ni les destinataires, ni le texte.
export function avecHtml<T extends { subject?: unknown; text?: unknown }>(
  charge: T,
  options: { bouton?: Bouton; pied?: string; titre?: string } = {},
): T & { html: string } {
  const texte = String(charge.text ?? "");
  const bouton = options.bouton ?? boutonPortail(texte);
  return {
    ...charge,
    html: gabaritCourriel({
      titre: options.titre ?? String(charge.subject ?? MARQUE),
      preentete: preenteteDe(texte),
      contenuHtml: texteEnHtml(texte, bouton),
      pied: options.pied,
    }),
  };
}
