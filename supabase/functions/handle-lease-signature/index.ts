import { EXPEDITEUR } from "../_shared/branding.ts";
import { corsHeadersFor } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminHeaders = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    const body = await req.json().catch(() => ({}));
    const { lease_id, token, action } = body;
    if (!lease_id || !token) {
      return new Response(JSON.stringify({ error: "lease_id et token requis" }), { status: 400, headers: corsHeaders });
    }

    const leaseRes = await fetch(
      `${supabaseUrl}/rest/v1/leases?id=eq.${lease_id}&select=*,tenants(full_name,email),units(unit_number,buildings(address))`,
      { headers: adminHeaders },
    );
    const [lease] = await leaseRes.json();
    if (!lease || !lease.renewal_signature_token || lease.renewal_signature_token !== token) {
      return new Response(JSON.stringify({ error: "Lien invalide ou expiré" }), { status: 404, headers: corsHeaders });
    }
    if (!lease.renewal_notice_sent_at) {
      return new Response(JSON.stringify({ error: "Aucun avis de renouvellement en attente pour ce bail" }), { status: 404, headers: corsHeaders });
    }
    if (lease.renewal_signed) {
      return new Response(JSON.stringify({ error: "Ce bail a déjà été signé", already_signed: true }), { status: 409, headers: corsHeaders });
    }

    if (action === "get") {
      const factsLabel = lease.renewal_notice_type === "augmentation"
        ? `Augmentation du loyer mensuel de ${lease.monthly_rent} $ à ${lease.renewal_notice_amount} $, à compter du ${lease.end_date}.`
        : lease.renewal_notice_type === "non_renouvellement"
        ? `Le bail ne sera pas renouvelé à son échéance (${lease.end_date}).`
        : `Renouvellement du bail aux mêmes conditions (loyer inchangé à ${lease.monthly_rent} $), à compter du ${lease.end_date}.`;

      return new Response(JSON.stringify({
        tenant_name: lease.tenants?.full_name || "",
        address: lease.units?.buildings?.address || "",
        unit_number: lease.units?.unit_number || "",
        notice_type: lease.renewal_notice_type,
        facts_label: factsLabel,
      }), { status: 200, headers: corsHeaders });
    }

    if (action === "sign") {
      const { signature_image, signer_name } = body;
      if (!signature_image || typeof signature_image !== "string" || !signature_image.startsWith("data:image/png;base64,")) {
        return new Response(JSON.stringify({ error: "Signature manquante ou invalide" }), { status: 400, headers: corsHeaders });
      }
      if (!signer_name || typeof signer_name !== "string" || !signer_name.trim()) {
        return new Response(JSON.stringify({ error: "Nom du signataire requis" }), { status: 400, headers: corsHeaders });
      }

      const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";
      const userAgent = req.headers.get("user-agent") || "";
      const signedAt = new Date().toISOString();

      const insertRes = await fetch(`${supabaseUrl}/rest/v1/lease_signatures`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          lease_id,
          notice_type: lease.renewal_notice_type,
          signature_image,
          signer_name: signer_name.trim(),
          ip_address: ipAddress,
          user_agent: userAgent,
          signed_at: signedAt,
        }),
      });
      if (!insertRes.ok) {
        console.error("Failed to insert lease_signatures", await insertRes.text());
        return new Response(JSON.stringify({ error: "Impossible d'enregistrer la signature, réessaie." }), { status: 500, headers: corsHeaders });
      }

      // La signature confirme l'accord, mais elle ne change RIEN au bail
      // par elle-même si on n'applique pas ses effets : sans mettre à
      // jour end_date/monthly_rent/status ici, generate_monthly_payments()
      // (schema.sql) cesse de générer les loyers dès que l'ancienne
      // end_date est dépassée, et une augmentation acceptée ne serait
      // jamais reflétée dans monthly_rent. Nouvelle échéance = même durée
      // que le bail actuel (cohérent avec term_type dans
      // lease_renewal_tracking) ; non-renouvellement n'a rien à propager,
      // le bail se termine simplement à l'end_date déjà en place.
      const leasePatch: Record<string, unknown> = {
        renewal_signed: true,
        renewal_response: "accepted",
        renewal_signed_at: signedAt,
        renewal_signature_ip: ipAddress,
        renewal_signature_token: null,
      };
      if (lease.renewal_notice_type !== "non_renouvellement" && lease.end_date && lease.start_date) {
        const start = new Date(`${lease.start_date}T00:00:00Z`);
        const oldEnd = new Date(`${lease.end_date}T00:00:00Z`);
        const termMs = oldEnd.getTime() - start.getTime();
        const newEnd = new Date(oldEnd.getTime() + termMs);
        leasePatch.end_date = newEnd.toISOString().slice(0, 10);
        leasePatch.status = "renewed";
        if (lease.renewal_notice_type === "augmentation" && lease.renewal_notice_amount) {
          leasePatch.monthly_rent = lease.renewal_notice_amount;
        }
      }

      // renewal_signature_token remis à null : invalide définitivement ce lien.
      const leasePatchRes = await fetch(`${supabaseUrl}/rest/v1/leases?id=eq.${lease_id}`, {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify(leasePatch),
      });
      if (!leasePatchRes.ok) {
        console.error("Failed to apply lease renewal terms", await leasePatchRes.text());
        return new Response(JSON.stringify({ error: "Signature enregistrée, mais l'application des nouvelles conditions a échoué. Contacte l'équipe Portail." }), { status: 500, headers: corsHeaders });
      }

      await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          actor_type: "tenant",
          actor_id: null,
          action: "lease_renewal.signed_by_tenant",
          entity_type: "leases",
          entity_id: lease_id,
          details: { signer_name: signer_name.trim(), ip_address: ipAddress, notice_type: lease.renewal_notice_type },
        }),
      }).catch((e) => console.error("Failed to write audit_log", e));

      if (lease.tenants?.email && resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: EXPEDITEUR,
            to: [lease.tenants.email],
            subject: "Confirmation de signature — renouvellement de bail",
            text: `Bonjour ${lease.tenants.full_name || ""},\n\nNous confirmons la réception de votre signature électronique concernant le renouvellement de votre bail au ${lease.units?.buildings?.address || ""}, unité ${lease.units?.unit_number || ""}, signée le ${new Date(signedAt).toLocaleString("fr-CA")}.\n\nCeci constitue une confirmation officielle. Conservez ce courriel pour vos dossiers.\n\n— L'équipe Portail`,
          }),
        }).catch((e) => console.error("Failed to send signature confirmation email", e));
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "action inconnue" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error("handle-lease-signature unexpected error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
