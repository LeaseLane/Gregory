import { EXPEDITEUR } from "../_shared/branding.ts";
import { avecHtml, POURQUOI } from "../_shared/courriel.ts";
import { corsHeadersFor } from "../_shared/auth.ts";

const severityLabel: Record<string, string> = {
  critical: "🔴 CRITIQUE",
  warning: "🟠 Avertissement",
};

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const healthAlertSecret = Deno.env.get("HEALTH_ALERT_SECRET");
    const adminHeaders = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    const systemKey = req.headers.get("x-health-alert-key") || "";
    if (!healthAlertSecret || systemKey !== healthAlertSecret) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 403, headers: corsHeaders });
    }

    const { issues } = await req.json().catch(() => ({ issues: [] }));
    const issueList = Array.isArray(issues) ? issues : [];
    if (issueList.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_issues" }), { status: 200, headers: corsHeaders });
    }

    const adminsRes = await fetch(`${supabaseUrl}/rest/v1/users?is_admin=eq.true&select=email`, { headers: adminHeaders });
    const admins = await adminsRes.json().catch(() => []);
    const adminEmails = Array.isArray(admins) ? admins.map((a: any) => a.email).filter(Boolean) : [];
    if (!adminEmails.length) {
      return new Response(JSON.stringify({ ok: false, error: "Aucun admin à notifier" }), { status: 200, headers: corsHeaders });
    }

    const bodyLines = issueList.map((i: any) => `${severityLabel[i.severity] || i.severity} — ${i.detail}`).join("\n");

    // La réponse de Resend DOIT être vérifiée. Avant ce correctif, l'appel
    // était bien attendu mais son statut ignoré : une clé d'API invalide,
    // un domaine non vérifié ou un destinataire refusé renvoyaient 4xx et
    // la fonction répondait quand même {ok:true, notified:N}. Une alerte
    // qui échoue en prétendant avoir réussi est pire que pas d'alerte — le
    // critère P8 exige qu'elle soit « reçue et constatée ».
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(avecHtml({
        from: EXPEDITEUR,
        to: adminEmails,
        subject: `⚠️ Lease Lane — ${issueList.length} problème(s) détecté(s) par la surveillance système`,
        text: `La vérification automatique de santé du système a détecté ${issueList.length} problème(s) :\n\n${bodyLines}\n\nCette alerte ne se répétera pas avant 2h tant que le problème persiste. Vérifie le tableau de bord admin (section « État du système ») pour plus de détails.`,
      }, { pied: POURQUOI.admin })),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text().catch(() => "");
      console.error("send-health-alert: envoi Resend échoué", resendRes.status, detail);
      // Journalisé dans audit_log : c'est la seule trace durable qu'une
      // alerte n'est pas partie, et elle permet à
      // check_system_health() de le remonter au passage suivant.
      await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          actor_type: "system",
          action: "health_alert.delivery_failed",
          entity_type: "send-health-alert",
          details: { status: resendRes.status, detail: detail.slice(0, 500), recipients: adminEmails.length },
        }),
      }).catch(() => {});
      // 502 plutôt que 200 : l'appelant (trigger_health_check_alert via
      // net.http_post) ne lit pas ce statut, mais check_recent_http_failures()
      // le verra et le journalisera.
      return new Response(
        JSON.stringify({ ok: false, error: "Envoi de l'alerte échoué", status: resendRes.status }),
        { status: 502, headers: corsHeaders },
      );
    }

    return new Response(JSON.stringify({ ok: true, notified: adminEmails.length }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("send-health-alert unexpected error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
