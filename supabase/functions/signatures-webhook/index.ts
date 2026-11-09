// Webhook DocuSeal (Réglages › Webhooks de DocuSeal → https://<projet>.supabase.co/functions/v1/signatures-webhook).
// On ne croit pas le contenu : seul le numéro de soumission sert, et les statuts sont relus dans l'API de DocuSeal avec notre clé.
// Une soumission inconnue (ex. préproduction qui partage la même instance) est ignorée sans erreur.
import { docusealActif, synchroniserSoumission } from "../_shared/docuseal.ts";

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
Deno.serve(async (req) => {
  if (req.method !== "POST" || !docusealActif()) return new Response("ok");
  const b = await req.json().catch(() => null);
  const sid = b?.data?.submission_id ?? b?.data?.submission?.id ?? (String(b?.event_type ?? "").startsWith("submission.") ? b?.data?.id : null);
  if (!/^\d+$/.test(String(sid ?? ""))) return new Response("ignoré");
  try {
    const faits = await synchroniserSoumission(sid, async (p) => {
      const r = await fetch(`${url}/rest/v1/rpc/service_evenement_signature`, { method: "POST", headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" }, body: JSON.stringify({ p }) });
      if (!r.ok && r.status !== 404) throw new Error(`service_evenement_signature ${r.status}`);
    });
    return Response.json({ ok: true, faits });
  } catch (e) {
    console.error("signatures-webhook", sid, (e as Error).message);
    return new Response("erreur", { status: 500 });   // DocuSeal réessaiera
  }
});
