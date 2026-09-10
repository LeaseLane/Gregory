import { corsHeadersFor, requireUser } from "../_shared/auth.ts";


Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const auth = await requireUser(req, corsHeaders);
    if ("response" in auth) return auth.response;
    const userId = auth.userId;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminHeaders = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    const [ownerRes, tenantRes, workerRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/owners?user_id=eq.${userId}&select=id`, { headers: adminHeaders }),
      fetch(`${supabaseUrl}/rest/v1/tenants?user_id=eq.${userId}&select=id`, { headers: adminHeaders }),
      fetch(`${supabaseUrl}/rest/v1/workers?user_id=eq.${userId}&select=id`, { headers: adminHeaders }),
    ]);
    const [[owner], [tenant], [worker]] = await Promise.all([
      ownerRes.json().catch(() => [null]),
      tenantRes.json().catch(() => [null]),
      workerRes.json().catch(() => [null]),
    ]);

    const role = owner?.id ? "owner" : tenant?.id ? "tenant" : worker?.id ? "worker" : null;
    if (!role) {
      return new Response(JSON.stringify({ error: "Aucun portail associé à ce compte." }), { status: 403, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ role }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
