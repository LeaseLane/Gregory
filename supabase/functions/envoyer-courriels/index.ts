// T2 · Envoyeur unique (courriels.md § 1). Appelé chaque minute par le cron (comms.declencher_envois).
// Toutes les décisions (coupe-circuit, fenêtre, suppression, consentement, séquence) sont prises en SQL par
// envois_preparer_lot; cette fonction rend le gabarit, l'envoie et rapporte le résultat (envois_marquer).
// Hors production, les adaptateurs sont SIMULÉS : rien ne part, l'envoi est marqué « simule-… ».
import { estAppelInterneVerifie } from "../_shared/appel-interne.ts";
import { rendreCourriel, rendreSms, type Contenu } from "../_shared/gabarits.ts";
import { EXPEDITEUR } from "../_shared/branding.ts";
import { jetonDesabonnement } from "../_shared/envois.ts";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const secret = Deno.env.get("INTERNAL_CALL_SECRET") ?? "";
const REEL = url.includes("kdmwfbcziokygfcmjxeq") || Deno.env.get("ENVOIS_REELS") === "true";

async function rpc(nom: string, args: unknown) {
  const r = await fetch(`${url}/rest/v1/rpc/${nom}`, { method: "POST", headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`${nom} : ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

type Envoi = { id: string; channel: "email" | "sms"; recipient: string; vars: Record<string, unknown>; template_code: string; contenu: Contenu; sms_text: string | null; unsubscribe_required: boolean };

async function courriel(e: Envoi): Promise<string> {
  // LCAP : pas de message commercial sans lien de désabonnement fonctionnel.
  if (e.unsubscribe_required && !secret) throw new Error("INTERNAL_CALL_SECRET absent : lien de désabonnement impossible");
  const lien = e.unsubscribe_required ? `${url}/functions/v1/envois-retour?d=${await jetonDesabonnement(secret, "email", e.recipient)}` : undefined;
  const r = rendreCourriel(e.contenu, e.vars, { desabonnement: lien });
  if (!REEL) return `simule-${crypto.randomUUID()}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json", "Idempotency-Key": e.id },
    body: JSON.stringify({ from: EXPEDITEUR, to: [e.recipient], subject: r.subject, html: r.html, text: r.text,
      ...(lien ? { headers: { "List-Unsubscribe": `<${lien}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
      tags: [{ name: "gabarit", value: e.template_code.replace("-", "_") }] }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j.id;
}

async function sms(e: Envoi): Promise<string> {
  const corps = rendreSms(e.sms_text ?? "", e.vars) + (e.unsubscribe_required ? " Répondez STOP pour ne plus recevoir ces messages." : "");
  if (!REEL) return `simule-${crypto.randomUUID()}`;
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID"), jeton = Deno.env.get("TWILIO_AUTH_TOKEN"), de = Deno.env.get("TWILIO_FROM_NUMBER");
  if (!sid || !jeton || !de) throw new Error("Twilio non configuré");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST", headers: { Authorization: `Basic ${btoa(`${sid}:${jeton}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: e.recipient, From: de, Body: corps }).toString(),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Twilio ${res.status} ${j.message ?? ""}`.trim());
  return j.sid;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("", { status: 405 });
  if (!estAppelInterneVerifie(req) && req.headers.get("Authorization") !== `Bearer ${cle}`) return new Response(JSON.stringify({ error: "non autorisé" }), { status: 401 });
  const lot: Envoi[] = await rpc("envois_preparer_lot", { p_taille: 50 });
  let envoyes = 0, echecs = 0;
  for (const e of lot) {
    try {
      const id = e.channel === "sms" ? await sms(e) : await courriel(e);
      await rpc("envois_marquer", { p_id: e.id, p_ok: true, p_provider_id: id });
      envoyes++;
    } catch (err) {
      await rpc("envois_marquer", { p_id: e.id, p_ok: false, p_erreur: String(err) });
      echecs++;
    }
  }
  return new Response(JSON.stringify({ ok: true, reel: REEL, envoyes, echecs }), { headers: { "Content-Type": "application/json" } });
});
