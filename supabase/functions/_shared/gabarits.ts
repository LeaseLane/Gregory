// Rendu des gabarits de la Phase 2 (comms.email_templates.contenu) en courriel HTML, texte brut et SMS.
//
// Dessin repris de la maquette (penpot-sources/penpot/mail.js, B.mail et MB) : carte de 600 px, logo et
// libellé, filet de 4 px (rouge si urgent), tuile d'icône, surtitre, titre, intro, blocs, bouton, signature,
// pied. Le contenu a la forme des définitions de gen/c_loc.py et c_autres.py; les {variables} y sont
// remplacées, toujours échappées.
//
// Contraintes des logiciels de courriel (comme courriel.ts) : tableaux, styles en ligne, images PNG par URL
// absolue, bouton VML pour Outlook, fonds explicites. Aucun pixel de suivi (Loi 25).
import { esc } from "./courriel.ts";
import { SITE_BASE_URL } from "./branding.ts";

const K = {
  m900: "#0C2147", m500: "#1C3053", g025: "#F7F9FB", g050: "#EEF1F5", g100: "#E1E6EC", g200: "#D1D6DB", g300: "#C8CDD4",
  g400: "#A6B1BE", g600: "#58697F", g700: "#3E4A59", b025: "#ECF2F9", b050: "#C8DAF0", b200: "#91B5E0", b500: "#4581CB",
  b700: "#2E5788", ok: "#12694F", red: "#9B2E28", redL: "#F8E4E2", W: "#FFFFFF",
};
const F = "Poppins, 'Helvetica Neue', Arial, sans-serif";
const ASSETS = `${SITE_BASE_URL}/assets/courriel`;
const ico = (nom: string, couleur: "" | "-rouge" | "-blanc" = "", taille = 24) =>
  `<img src="${ASSETS}/icones/${esc(nom)}${couleur}.png" width="${taille}" height="${taille}" alt="" style="display:block;border:0;width:${taille}px;height:${taille}px;">`;

// Adresse postale du bureau : exigée par la LCAP dans tout message commercial (spécimen de chèque BMO de
// Solutions Locatives LeaseLane inc., 28 oct. 2026).
export const ADRESSE_BUREAU = "1516, rue du Layon, Lévis (Québec) G7A 0E6";

export type Signature = { ini?: string; cleo?: boolean; name: string; role: string };
export type Contenu = {
  subject: string; pre?: string; label?: string; icon?: string; eyebrow?: string; title: string; intro?: string;
  accent?: "urgent"; blocks?: [string, Record<string, unknown>][]; cta?: { l: string; href?: string; link?: string; linkHref?: string; red?: boolean };
  sign?: Signature; foot?: { reason?: string; commercial?: boolean }; sms?: string;
};
export type Liens = { desabonnement?: string; preferences?: string; confidentialite?: string };

// {variable} → valeur. Une variable absente reste visible ({nom}) pour qu'un essai la révèle au lieu de l'effacer.
export function remplir(s: string, vars: Record<string, unknown>): string {
  return String(s ?? "").replace(/\{([a-z_]+)\}/g, (m, k) => (vars[k] ?? "") === "" ? m : String(vars[k]));
}
const typo = (s: string) => esc(s).replace(/(\d) (?=\d{3}(?!\d))/g, "$1&nbsp;").replace(/ ([$%])/g, "&nbsp;$1");
const tx = (s: unknown, v: Record<string, unknown>) => typo(remplir(String(s ?? ""), v));
// Lien dont une variable manque : le portail plutôt qu'une adresse cassée.
const url = (s: unknown, v: Record<string, unknown>) => { const u = remplir(String(s ?? ""), v); return esc(/\{[a-z_]+\}/.test(u) ? SITE_BASE_URL : u); };

const td = (style: string, html: string) => `<td style="font-family:${F};${style}">${html}</td>`;
const table = (style: string, rows: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${style}">${rows}</table>`;

type Bloc = (o: any, v: Record<string, unknown>) => string;
const BLOCS: Record<string, Bloc> = {
  p: (o, v) => `<p style="margin:0;white-space:pre-line;font-family:${F};font-size:15px;line-height:1.6;color:${o.c ?? K.g700};font-weight:${o.wt ?? 400};">${tx(o.t, v)}</p>`,
  kv: (o, v) => table(`background:${K.g025};border:1px solid ${K.g100};border-radius:12px;`,
    (o.rows as [string, string, string?][]).map(([k, val, em], i) =>
      `<tr>${td(`padding:${i ? 10 : 16}px 20px ${i === o.rows.length - 1 ? 16 : 10}px;font-size:14px;color:${K.g600};${i ? `border-top:1px solid ${K.g100};` : ""}`, tx(k, v))}` +
      `${td(`padding:${i ? 10 : 16}px 20px ${i === o.rows.length - 1 ? 16 : 10}px;font-size:14px;font-weight:600;text-align:right;color:${em === "red" ? K.red : K.m900};${i ? `border-top:1px solid ${K.g100};` : ""}`, tx(val, v))}</tr>`).join("")),
  notice: (o, v) => {
    const rouge = o.k === "urgent", legal = o.k === "legal";
    return table(`background:${rouge ? K.redL : legal ? K.g050 : K.b025};border-radius:12px;`, `<tr>
      <td width="36" valign="top" style="padding:20px 16px 20px 20px;">${ico(o.ic ?? (rouge ? "alert" : legal ? "scale" : "info"), rouge ? "-rouge" : "", 20)}</td>
      ${td("padding:20px 20px 20px 0;", `<p style="margin:0 0 4px;font-family:${F};font-size:15px;font-weight:600;color:${rouge ? K.red : K.m900};">${tx(o.title, v)}</p><p style="margin:0;font-family:${F};font-size:14px;line-height:1.5;color:${K.g700};">${tx(o.t, v)}</p>`)}</tr>`);
  },
  steps: (o, v) => table("", (o.rows as [number, string, string?][]).map(([st, t, s], i) => {
    const pastille = st === 1
      ? `<div style="width:24px;height:24px;border-radius:12px;background:${K.ok};">${ico("check", "-blanc", 24)}</div>`
      : `<div style="width:${st === 2 ? 18 : 20}px;height:${st === 2 ? 18 : 20}px;border-radius:12px;background:${K.W};border:${st === 2 ? 3 : 2}px solid ${st === 2 ? K.b500 : K.g300};"></div>`;
    const fil = i < o.rows.length - 1 ? `<div style="width:2px;height:30px;margin:2px 0 0 11px;background:${st === 1 ? K.m900 : K.g200};"></div>` : "";
    return `<tr><td width="40" valign="top">${pastille}${fil}</td>${td("vertical-align:top;padding-bottom:8px;",
      `<p style="margin:0;font-family:${F};font-size:15px;font-weight:600;color:${st === 0 ? K.g600 : K.m900};">${tx(t, v)}</p>${s ? `<p style="margin:2px 0 0;font-family:${F};font-size:13px;color:${K.g600};">${tx(s, v)}</p>` : ""}`)}</tr>`;
  }).join("")),
  doc: (o, v) => table(`background:${K.W};border:1px solid ${K.g200};border-radius:12px;`, `<tr>
    <td width="64" style="padding:16px 0 16px 16px;"><div style="width:48px;height:48px;border-radius:10px;background:${K.b025};"><div style="padding:12px;">${ico(o.ic ?? "file")}</div></div></td>
    ${td("padding:16px;", `<p style="margin:0;font-family:${F};font-size:15px;font-weight:600;color:${K.m900};">${tx(o.name, v)}</p><p style="margin:4px 0 0;font-family:${F};font-size:13px;color:${K.g600};">${tx(o.meta, v)}</p>`)}
    ${td("padding:16px;text-align:right;", `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${K.g050};font-size:12px;font-weight:600;color:${K.g700};">${tx(o.kind ?? "PDF", v)}</span>`)}</tr>`),
  event: (o, v) => table(`background:${K.g025};border:1px solid ${K.g100};border-radius:12px;`, `<tr>
    <td width="80" style="padding:16px 0 16px 16px;"><div style="width:64px;height:64px;border-radius:12px;background:${K.m900};text-align:center;">
      <p style="margin:0;padding-top:8px;font-family:${F};font-size:12px;font-weight:600;letter-spacing:1px;color:${K.b200};">${tx(o.mon, v)}</p>
      <p style="margin:0;font-family:${F};font-size:24px;line-height:30px;font-weight:700;color:${K.W};">${tx(o.day, v)}</p></div></td>
    ${td("padding:16px;", `<p style="margin:0;font-family:${F};font-size:16px;font-weight:600;color:${K.m900};">${tx(o.time, v)}</p><p style="margin:6px 0 0;font-family:${F};font-size:14px;color:${K.g700};">${tx(o.place, v)}</p>`)}</tr>`),
  table: (o, v) => table("", `<tr>${td(`background:${K.g050};padding:12px 16px;font-size:12px;font-weight:600;letter-spacing:1.2px;color:${K.g600};border-radius:8px 0 0 8px;`, tx(String(o.head[0]).toUpperCase(), v))}` +
    `${td(`background:${K.g050};padding:12px 16px;font-size:12px;font-weight:600;letter-spacing:1.2px;color:${K.g600};text-align:right;border-radius:0 8px 8px 0;`, tx(String(o.head[1]).toUpperCase(), v))}</tr>` +
    (o.rows as [string, string][]).map(([d, a], i) => `<tr>${td(`padding:11px 16px;font-size:14px;color:${K.g700};${i ? `border-top:1px solid ${K.g100};` : ""}`, tx(d, v))}${td(`padding:11px 16px;font-size:14px;color:${K.m900};text-align:right;${i ? `border-top:1px solid ${K.g100};` : ""}`, tx(a, v))}</tr>`).join("") +
    (o.total ? `<tr>${td(`padding:14px 16px;font-size:15px;font-weight:700;color:${K.m900};border-top:2px solid ${K.m900};`, tx(o.total[0], v))}${td(`padding:14px 16px;font-size:15px;font-weight:700;color:${K.m900};text-align:right;border-top:2px solid ${K.m900};`, tx(o.total[1], v))}</tr>` : "")),
  meter: (o, v) => {
    const r = Math.max(0, Math.min(1, Number(remplir(String(o.r ?? 0), v)) || 0));
    return table("", `<tr>${td(`font-size:14px;font-weight:600;color:${K.m900};`, tx(o.label, v))}${td(`font-size:14px;font-weight:600;color:${K.m900};text-align:right;`, tx(o.value, v))}</tr>
      <tr><td colspan="2" style="padding:12px 0 8px;"><div style="height:8px;border-radius:4px;background:${K.g100};"><div style="height:8px;width:${Math.round(r * 100)}%;border-radius:4px;background:${o.red ? K.red : K.b500};"></div></div></td></tr>
      <tr><td colspan="2" style="font-family:${F};font-size:12px;color:${K.g600};">${tx(o.cap, v)}</td></tr>`);
  },
  quote: (o, v) => table("", `<tr><td width="3" style="background:${K.b500};border-radius:2px;"></td>${td("padding-left:17px;",
    `<p style="margin:0;font-family:${F};font-size:15px;line-height:1.6;color:${K.m900};">${tx(o.t, v)}</p>${o.by ? `<p style="margin:6px 0 0;font-family:${F};font-size:13px;color:${K.g600};">${tx(o.by, v)}</p>` : ""}`)}</tr>`),
  bullets: (o, v) => table("", (o.items as string[]).map((t) => `<tr><td width="24" valign="top" style="padding:9px 0 8px 4px;"><div style="width:7px;height:7px;border-radius:4px;background:${K.b500};"></div></td>${td(`padding-bottom:8px;font-size:15px;line-height:1.55;color:${K.g700};`, tx(t, v))}</tr>`).join("")),
  code: (o, v) => `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr>${[...remplir(String(o.v), v)].map((d) =>
    `<td style="padding:0 5px;"><div style="width:56px;height:72px;border-radius:12px;background:${K.g025};border:1px solid ${K.g200};text-align:center;font-family:${F};font-size:28px;line-height:72px;font-weight:700;color:${K.m900};">${esc(d)}</div></td>`).join("")}</tr></table>`,
  compare: (o, v) => {
    const mx = Math.max(...(o.rows as [string, number][]).map((r) => r[1]));
    return `<p style="margin:0 0 16px;font-family:${F};font-size:13px;color:${K.g600};">${tx(o.head, v)}</p>` + table("", (o.rows as [string, number, string, boolean?][]).map(([n, val, lab, em]) =>
      `<tr>${td(`width:190px;padding:6px 10px 6px 0;font-size:14px;font-weight:${em ? 600 : 400};color:${K.m900};`, tx(n, v))}<td style="padding:6px 0;"><div style="height:16px;width:${Math.max(3, Math.round(100 * val / mx))}%;border-radius:0 4px 4px 0;background:${em ? K.b500 : K.g400};"></div></td>${td(`width:96px;padding:6px 0 6px 16px;font-size:14px;font-weight:600;color:${K.m900};text-align:right;`, tx(lab, v))}</tr>`).join("")) +
      (o.ref ? `<p style="margin:8px 0 0;font-family:${F};font-size:12px;font-weight:600;color:${K.m900};">${tx(o.ref[1], v)}</p>` : "");
  },
  bars: (o, v) => {
    const mx = Math.max(...(o.v as number[])), n = o.v.length;
    return `<p style="margin:0 0 4px;font-family:${F};font-size:12px;font-weight:600;color:${K.m900};text-align:right;">${tx(o.top, v)}</p>` +
      table(`border-bottom:1px solid ${K.g300};`, `<tr>${(o.v as number[]).map((x, i) => `<td valign="bottom" align="center" style="height:96px;"><div style="width:24px;height:${Math.round(96 * x / mx)}px;border-radius:4px 4px 0 0;background:${i === n - 1 ? K.b500 : K.g400};"></div></td>`).join("")}</tr>`) +
      table("", `<tr>${(o.lab as string[]).map((l, i) => td(`padding-top:8px;text-align:center;font-size:12px;color:${i === n - 1 ? K.m900 : K.g600};font-weight:${i === n - 1 ? 600 : 400};`, tx(l, v))).join("")}</tr>`);
  },
  photo: (o, v) => o.src ? `<img src="${url(o.src, v)}" width="520" alt="" style="display:block;width:100%;height:auto;border-radius:12px;">` : "",
  divider: () => `<div style="height:1px;line-height:1px;font-size:1px;background:${K.g100};">&nbsp;</div>`,
  cta: (o, v) => {
    const fond = o.red ? K.red : K.m900, l = tx(o.l, v), href = url(o.href ?? SITE_BASE_URL, v);
    return `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:52px;v-text-anchor:middle;width:240px;" arcsize="23%" stroke="f" fillcolor="${fond}"><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${l}</center></v:roundrect><![endif]-->` +
      `<!--[if !mso]><!--><a href="${href}" style="display:inline-block;min-width:144px;padding:0 28px;line-height:52px;border-radius:12px;background:${fond};color:${K.W};font-family:${F};font-size:15px;font-weight:600;text-align:center;text-decoration:none;">${l}</a><!--<![endif]-->` +
      (o.link ? `<p style="margin:14px 0 0;font-family:${F};font-size:14px;font-weight:600;color:${K.b700};">${o.linkHref ? `<a href="${url(o.linkHref, v)}" style="color:${K.b700};text-decoration:none;">${tx(o.link, v)}</a>` : tx(o.link, v)}</p>` : "");
  },
  sign: (o: Signature, v) => table("", `<tr><td width="60" valign="top">${o.cleo
    ? `<img src="${ASSETS}/cleo.png" width="44" height="44" alt="Cléo" style="display:block;border:0;border-radius:22px;background:#1E3A70;">`
    : `<div style="width:44px;height:44px;border-radius:22px;background:${K.m500};background-image:linear-gradient(135deg,${K.m500},${K.b500});text-align:center;font-family:${F};font-size:14px;line-height:44px;font-weight:600;color:${K.W};">${tx(o.ini ?? "LL", v)}</div>`}</td>
    ${td("vertical-align:top;padding-top:2px;", `<p style="margin:0;font-family:${F};font-size:15px;font-weight:600;color:${K.m900};">${tx(o.name, v)}</p><p style="margin:4px 0 0;font-family:${F};font-size:13px;color:${K.g600};">${tx(o.role, v)}</p>`)}</tr>`),
};

export function rendreCourriel(c: Contenu, vars: Record<string, unknown>, liens: Liens = {}): { subject: string; html: string; text: string } {
  const urgent = c.accent === "urgent";
  const blocs: [string, any][] = [...(c.blocks ?? []), ...(c.cta ? [["cta", c.cta] as [string, any]] : []), ...(c.sign ? [["divider", {}], ["sign", c.sign]] as [string, any][] : [])];
  const inconnu = blocs.find(([k]) => !BLOCS[k]);
  if (inconnu) throw new Error(`Bloc de gabarit inconnu : ${inconnu[0]}`);
  const foot = c.foot ?? {};
  const pied = [foot.reason ?? "", "Lease Lane · gestion immobilière · Québec et Lévis",
    [ADRESSE_BUREAU && `Adresse du bureau : ${ADRESSE_BUREAU}`, "info@leaselane.ca", "leaselane.ca"].filter(Boolean).join(" · ")].filter(Boolean);
  const liensPied: [string, string][] = [
    ...(foot.commercial && liens.desabonnement ? [["Se désabonner", liens.desabonnement] as [string, string]] : []),
    ["Gérer mes préférences", liens.preferences ?? SITE_BASE_URL],
    ["Confidentialité (Loi 25)", liens.confidentialite ?? "https://leaselane.ca/confidentialite"],
  ];
  const sujet = remplir(c.subject, vars);
  const html = `<!DOCTYPE html>
<html lang="fr-CA" xmlns:v="urn:schemas-microsoft-com:vml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${esc(sujet)}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>@media (max-width:620px){.ll-p{padding-left:24px!important;padding-right:24px!important}}</style></head>
<body style="margin:0;padding:0;background:${K.g025};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${tx(c.pre ?? "", vars)}${"&#8199;&#65279;&#847; ".repeat(30)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${K.g025}" style="background:${K.g025};"><tr><td align="center" style="padding:32px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${K.W};border:1px solid ${K.g100};border-radius:16px;">
<tr><td class="ll-p" style="padding:24px 40px 0;height:60px;">${table("", `<tr><td><img src="${ASSETS}/leaselane-fond-clair.png" width="132" alt="Lease Lane" style="display:block;border:0;width:132px;height:auto;font-family:${F};font-size:16px;font-weight:600;color:${K.m900};"></td>
  ${td(`text-align:right;font-size:12px;font-weight:600;letter-spacing:1.2px;color:${K.g600};`, tx(String(c.label ?? "").toUpperCase(), vars))}</tr>`)}</td></tr>
<tr><td style="height:4px;line-height:4px;font-size:4px;background:${urgent ? K.red : K.m900};">&nbsp;</td></tr>
<tr><td class="ll-p" style="padding:32px 40px 16px;">
  <div style="width:48px;height:48px;border-radius:12px;background:${urgent ? K.redL : K.b025};"><div style="padding:12px;">${ico(c.icon ?? "mail", urgent ? "-rouge" : "")}</div></div>
  <p style="margin:16px 0 8px;font-family:${F};font-size:12px;font-weight:600;letter-spacing:1.2px;color:${urgent ? K.red : K.b700};">${tx(String(c.eyebrow ?? "").toUpperCase(), vars)}</p>
  <h1 style="margin:0;font-family:${F};font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.3px;color:${K.m900};">${tx(c.title, vars)}</h1>
  ${c.intro ? `<p style="margin:16px 0 0;font-family:${F};font-size:15px;line-height:1.6;color:${K.g700};">${tx(c.intro, vars)}</p>` : ""}
</td></tr>
${blocs.map(([k, o]) => `<tr><td class="ll-p" style="padding:16px 40px 8px;">${BLOCS[k](o, vars)}</td></tr>`).join("\n")}
<tr><td style="height:24px;"></td></tr>
<tr><td class="ll-p" style="padding:32px 40px;background:${K.g050};border-radius:0 0 16px 16px;">
  ${pied.map((t, i) => `<p style="margin:0 0 6px;font-family:${F};font-size:12px;line-height:1.5;color:${i ? K.g600 : K.g700};">${tx(t, vars)}</p>`).join("")}
  <p style="margin:14px 0 0;font-family:${F};font-size:12px;font-weight:600;">${liensPied.map(([l, h]) => `<a href="${esc(h)}" style="color:${K.b700};text-decoration:none;margin-right:24px;">${esc(l)}</a>`).join("")}</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  return { subject: sujet, html, text: texteBrut(c, vars, pied, liensPied) };
}

// Version texte brut (multipart) : le même contenu, sans mise en forme.
function texteBrut(c: Contenu, v: Record<string, unknown>, pied: string[], liens: [string, string][]): string {
  const r = (s: unknown) => remplir(String(s ?? ""), v);
  const out: string[] = [r(c.title)];
  if (c.intro) out.push(r(c.intro));
  for (const [k, o] of (c.blocks ?? []) as [string, any][]) {
    if (k === "p" || k === "quote") out.push(r(o.t) + (o.by ? `\n— ${r(o.by)}` : ""));
    else if (k === "kv") out.push(o.rows.map(([a, b]: string[]) => `${r(a)} : ${r(b)}`).join("\n"));
    else if (k === "notice") out.push(`${r(o.title)}\n${r(o.t)}`);
    else if (k === "bullets") out.push(o.items.map((t: string) => `- ${r(t)}`).join("\n"));
    else if (k === "steps") out.push(o.rows.map(([st, t, s]: [number, string, string]) => `${st === 1 ? "[x]" : "[ ]"} ${r(t)}${s ? ` (${r(s)})` : ""}`).join("\n"));
    else if (k === "doc") out.push(`${r(o.name)} · ${r(o.meta)}`);
    else if (k === "event") out.push(`${r(o.time)}\n${r(o.place)}`);
    else if (k === "table") out.push([...o.rows, ...(o.total ? [o.total] : [])].map(([a, b]: string[]) => `${r(a)} : ${r(b)}`).join("\n"));
    else if (k === "meter") out.push(`${r(o.label)} : ${r(o.value)}\n${r(o.cap)}`);
    else if (k === "code") out.push(r(o.v));
    else if (k === "compare") out.push(r(o.head) + "\n" + o.rows.map(([n, , lab]: [string, number, string]) => `${r(n)} : ${r(lab)}`).join("\n"));
    else if (k === "bars") out.push(r(o.top));
  }
  if (c.cta) out.push(`${r(c.cta.l)} : ${c.cta.href ? r(c.cta.href) : SITE_BASE_URL}` + (c.cta.link ? `\n${r(c.cta.link)}${c.cta.linkHref ? ` : ${r(c.cta.linkHref)}` : ""}` : ""));
  if (c.sign) out.push(`${r(c.sign.name)}\n${r(c.sign.role)}`);
  out.push("---\n" + pied.map(r).join("\n") + "\n" + liens.map(([l, h]) => `${l} : ${h}`).join("\n"));
  return out.join("\n\n");
}

export const rendreSms = (sms: string, vars: Record<string, unknown>) => remplir(sms, vars);
