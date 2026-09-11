import { corsHeadersFor } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminHeaders = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    const healthRes = await fetch(`${supabaseUrl}/rest/v1/rpc/check_system_health`, {
      method: "POST",
      headers: adminHeaders,
      body: "{}",
    });
    if (!healthRes.ok) {
      return new Response(JSON.stringify({ healthy: false, error: "Impossible de joindre la base de données" }), { status: 503, headers: corsHeaders });
    }
    const health = await healthRes.json();

    return new Response(JSON.stringify(health), {
      status: health.healthy ? 200 : 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("health-check unexpected error", err);
    return new Response(JSON.stringify({ healthy: false, error: String(err) }), { status: 503, headers: corsHeaders });
  }
});
