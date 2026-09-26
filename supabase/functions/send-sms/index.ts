import { EXPEDITEUR } from "../_shared/branding.ts";
import { avecHtml } from "../_shared/courriel.ts";
import { corsHeadersFor } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const { to_phone, message, entity_type, entity_id, fallback_email, fallback_subject } = await req.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "message requis" }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFromNumber = Deno.env.get("TWILIO_FROM_NUMBER");
    const adminHeaders = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    const logResult = (channel_used: string, status: string, error_detail: string | null) =>
      fetch(`${supabaseUrl}/rest/v1/sms_log`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          recipient_phone: to_phone || null,
          message,
          channel_used, status, error_detail,
          entity_type: entity_type || null,
          entity_id: entity_id || null,
        }),
      }).catch((e) => console.error("Failed to write sms_log", e));

    const twilioConfigured = !!(twilioAccountSid && twilioAuthToken && twilioFromNumber);

    if (twilioConfigured && to_phone) {
      try {
        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ To: to_phone, From: twilioFromNumber, Body: message }).toString(),
          },
        );
        if (!twilioRes.ok) {
          const errText = await twilioRes.text();
          console.error("Twilio send error", twilioRes.status, errText);
          await logResult("twilio", "error", errText.slice(0, 500));
          return new Response(JSON.stringify({ error: "Échec de l'envoi SMS via Twilio" }), { status: 502, headers: corsHeaders });
        }
        await logResult("twilio", "sent", null);
        return new Response(JSON.stringify({ ok: true, channel: "twilio" }), { status: 200, headers: corsHeaders });
      } catch (e) {
        console.error("Twilio send exception", e);
        await logResult("twilio", "error", String(e));
        return new Response(JSON.stringify({ error: "Échec de l'envoi SMS via Twilio" }), { status: 502, headers: corsHeaders });
      }
    }

    // Twilio non configuré (ou aucun numéro de téléphone fourni) :
    // repli silencieux vers le courriel, si disponible.
    if (fallback_email && resendKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(avecHtml({
          from: EXPEDITEUR,
          to: [fallback_email],
          subject: fallback_subject || "Message de Portail",
          text: message,
        })),
      });
      if (!emailRes.ok) {
        console.error("Failed to send SMS email fallback", await emailRes.text());
        await logResult("email_fallback", "error", "resend_api_error");
        return new Response(JSON.stringify({ error: "Échec de l'envoi (SMS et courriel de secours)" }), { status: 502, headers: corsHeaders });
      }
      await logResult("email_fallback", "sent", "Twilio non configuré — envoyé par courriel à la place");
      return new Response(JSON.stringify({ ok: true, channel: "email_fallback" }), { status: 200, headers: corsHeaders });
    }

    await logResult("skipped", "skipped", "Twilio non configuré et aucun courriel de secours fourni");
    return new Response(JSON.stringify({ ok: false, skipped: true, reason: "Twilio non configuré et aucun courriel de secours fourni" }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("send-sms unexpected error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
