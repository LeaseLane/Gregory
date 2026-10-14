// T2 · Retours des envois (courriels.md § 1, webhooks) :
//   GET  ?d=<jeton>                     → page de désabonnement (lien du pied des courriels commerciaux)
//   POST ?d=<jeton>                     → désabonnement en un clic (List-Unsubscribe-Post, RFC 8058)
//   POST formulaire Twilio (SMS entrant) → STOP/ARRÊT = suppression permanente; autre texte = réponse (arrête les relances)
// Les rebonds et plaintes de courriel arrivent par resend-inbound (même signature Svix).
import { estArret, lireJeton, signatureTwilioValide } from "../_shared/envois.ts";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const secret = Deno.env.get("INTERNAL_CALL_SECRET") ?? "";

async function rpc(nom: string, args: unknown) {
  const r = await fetch(`${url}/rest/v1/rpc/${nom}`, { method: "POST", headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`${nom} : ${r.status}`);
}

const page = (titre: string, texte: string, statut = 200) => new Response(
  `<!doctype html><html lang="fr-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titre}</title></head>` +
  `<body style="margin:0;background:#F7F9FB;font-family:Poppins,Arial,sans-serif;color:#0C2147;"><div style="max-width:480px;margin:64px auto;padding:32px;background:#fff;border:1px solid #E1E6EC;border-radius:16px;">` +
  `<h1 style="margin:0 0 12px;font-size:22px;">${titre}</h1><p style="margin:0;font-size:15px;line-height:1.6;color:#3E4A59;">${texte}</p></div></body></html>`,
  { status: statut, headers: { "Content-Type": "text/html; charset=utf-8" } },
);

Deno.serve(async (req) => {
  const u = new URL(req.url);
  const d = u.searchParams.get("d");
  if (d) {
    const j = await lireJeton(secret, d);
    if (!j) return page("Lien invalide", "Ce lien de désabonnement n’est pas valide. Écrivez-nous à info@leaselane.ca.", 400);
    await rpc("envois_supprimer", { p_channel: j.canal, p_address: j.adresse, p_reason: "unsubscribe" });
    return page("Vous êtes désabonné", "Vous ne recevrez plus de messages commerciaux de Lease Lane à cette adresse. Les avis liés à votre bail ou à votre dossier continuent d’arriver.");
  }

  if (req.method === "POST" && (req.headers.get("Content-Type") ?? "").includes("application/x-www-form-urlencoded")) {
    const params = Object.fromEntries(new URLSearchParams(await req.text()));
    // Twilio signe l'URL publique configurée sur le numéro (pas l'URL interne vue par la fonction).
    const publique = `${url}/functions/v1/envois-retour`;
    if (!await signatureTwilioValide(Deno.env.get("TWILIO_AUTH_TOKEN") ?? "", publique, params, req.headers.get("X-Twilio-Signature") ?? "")) {
      return new Response("signature invalide", { status: 401 });
    }
    if (params.From) {
      if (estArret(params.Body)) await rpc("envois_supprimer", { p_channel: "sms", p_address: params.From, p_reason: "stop" });
      else await rpc("envois_reponse", { p_channel: "sms", p_address: params.From });
    }
    return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
  }
  return new Response("", { status: 405 });
});
