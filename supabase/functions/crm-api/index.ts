import { analyserAppel, changementsProposes, proposerSuivi } from "../_shared/analyse-appel.ts";
import { corsHeadersFor, requireUserWithMfa } from "../_shared/auth.ts";


Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const auth = await requireUserWithMfa(req, corsHeaders);
    if ("response" in auth) return auth.response;
    const userId = auth.userId;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const adminHeaders = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    const userRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=is_admin`, { headers: adminHeaders });
    const userRows = await userRes.json();
    if (!userRows?.[0]?.is_admin) {
      return new Response(JSON.stringify({ error: "Accès refusé — compte non admin" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "list";

    if (action === "list") {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/prospects?select=*,cold_callers(id,full_name)&order=potential_monthly_revenue.desc.nullslast`,
        { headers: adminHeaders },
      );
      const prospects = await res.json();
      return new Response(JSON.stringify({ prospects }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list_callers") {
      const callersRes = await fetch(`${supabaseUrl}/rest/v1/cold_callers?select=id,full_name,phone,email,active&order=full_name.asc`, { headers: adminHeaders });
      const callers = await callersRes.json();
      const prospRes = await fetch(`${supabaseUrl}/rest/v1/prospects?assigned_caller_id=not.is.null&select=assigned_caller_id,stage,call_history`, { headers: adminHeaders });
      const prospects = await prospRes.json();
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const stats: Record<string, { total_assigned: number; by_stage: Record<string, number>; calls_this_week: number }> = {};
      for (const p of prospects) {
        const s = (stats[p.assigned_caller_id] ??= { total_assigned: 0, by_stage: {}, calls_this_week: 0 });
        s.total_assigned++;
        s.by_stage[p.stage] = (s.by_stage[p.stage] || 0) + 1;
        const history = Array.isArray(p.call_history) ? p.call_history : [];
        for (const c of history) {
          if (String(c.date || "").slice(0, 10) >= weekAgo) s.calls_this_week++;
        }
      }
      const callersWithStats = callers.map((c: any) => ({ ...c, stats: stats[c.id] || { total_assigned: 0, by_stage: {}, calls_this_week: 0 } }));
      return new Response(JSON.stringify({ callers: callersWithStats }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "assign_caller") {
      const { prospect_id, caller_id } = body;
      if (!prospect_id) {
        return new Response(JSON.stringify({ error: "prospect_id manquant" }), { status: 400, headers: corsHeaders });
      }
      await fetch(`${supabaseUrl}/rest/v1/prospects?id=eq.${prospect_id}`, {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ assigned_caller_id: caller_id || null }),
      });
      await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ actor_type: "admin", actor_id: userId, action: "prospect.caller_assigned", entity_type: "prospects", entity_id: prospect_id, details: { caller_id: caller_id || null } }),
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    if (action === "toggle_caller_active") {
      const { caller_id, active } = body;
      if (!caller_id) {
        return new Response(JSON.stringify({ error: "caller_id manquant" }), { status: 400, headers: corsHeaders });
      }
      await fetch(`${supabaseUrl}/rest/v1/cold_callers?id=eq.${caller_id}`, {
        method: "PATCH", headers: adminHeaders, body: JSON.stringify({ active: !!active }),
      });
      await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ actor_type: "admin", actor_id: userId, action: active ? "cold_caller.reactivated" : "cold_caller.deactivated", entity_type: "cold_callers", entity_id: caller_id, details: {} }),
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    if (action === "create") {
      const { full_name, email, phone, company_name, num_doors, avg_rent, lead_source, acquisition_cost } = body;
      const potential = num_doors && avg_rent ? Math.round(num_doors * avg_rent * 0.06 * 100) / 100 : null;
      await fetch(`${supabaseUrl}/rest/v1/prospects`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          full_name, email, phone, company_name,
          num_doors: num_doors || null,
          avg_rent: avg_rent || null,
          potential_monthly_revenue: potential,
          stage: "new",
          lead_source: lead_source || "manuel",
          acquisition_cost: acquisition_cost || null,
        }),
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    // Archiver (réversible) ou supprimer (définitif) un prospect.
    if (action === "archive_prospect" || action === "delete_prospect") {
      const { prospect_id, archiver } = body;
      if (!prospect_id || !/^[0-9a-f-]{36}$/i.test(prospect_id)) return new Response(JSON.stringify({ error: "Prospect invalide" }), { status: 400, headers: corsHeaders });
      const r = action === "delete_prospect"
        ? await fetch(`${supabaseUrl}/rest/v1/prospects?id=eq.${prospect_id}`, { method: "DELETE", headers: adminHeaders })
        : await fetch(`${supabaseUrl}/rest/v1/prospects?id=eq.${prospect_id}`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ archived_at: archiver ? new Date().toISOString() : null }) });
      if (!r.ok) {
        const detail = await r.text().catch(() => "");
        return new Response(JSON.stringify({ error: action === "delete_prospect" && detail.includes("foreign key") ? "Ce prospect est lié à d'autres données (client signé, appels…). Archivez-le plutôt." : "Non enregistré" }), { status: 409, headers: corsHeaders });
      }
      await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
        method: "POST", headers: adminHeaders,
        body: JSON.stringify({ actor_type: "admin", actor_id: userId, action: action === "delete_prospect" ? "prospect.deleted" : archiver ? "prospect.archived" : "prospect.restored", entity_type: "prospects", entity_id: prospect_id, details: {} }),
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // T1 : même opération que les propositions approuvées (crm.move_prospect_stage) : règles (« perdu »
    // exige une raison, étape connue), journal avant/après. Canal hérité : crm-api a vérifié la personne.
    if (action === "update_stage") {
      const { prospect_id, stage, loss_reason } = body;
      const r = await fetch(`${supabaseUrl}/rest/v1/rpc/lanceur_herite_deplacer_prospect`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ p: { id: prospect_id, stage, loss_reason: loss_reason || null }, p_user: userId }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        return new Response(JSON.stringify({ error: e.message || "Étape non modifiée." }), { status: r.status === 401 ? 403 : r.status, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    if (action === "update_acquisition_cost") {
      const { prospect_id, acquisition_cost } = body;
      if (!prospect_id) {
        return new Response(JSON.stringify({ error: "prospect_id manquant" }), { status: 400, headers: corsHeaders });
      }
      await fetch(`${supabaseUrl}/rest/v1/prospects?id=eq.${prospect_id}`, {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ acquisition_cost: acquisition_cost === "" ? null : Number(acquisition_cost) }),
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    if (action === "add_call") {
      const { prospect_id, transcript } = body;
      const prospRes = await fetch(`${supabaseUrl}/rest/v1/prospects?id=eq.${prospect_id}&select=*`, { headers: adminHeaders });
      const [prospect] = await prospRes.json();
      if (!prospect) {
        return new Response(JSON.stringify({ error: "prospect introuvable" }), { status: 404, headers: corsHeaders });
      }

      const parsed = await analyserAppel(String(transcript ?? ""));
      const { apres: apresAnalyse, suivi: followupDate } = changementsProposes(parsed, prospect);
      const interestLevel = parsed.interest_level ?? null;
      const callHistory = Array.isArray(prospect.call_history) ? prospect.call_history : [];
      // Note : cette fonction ne touche JAMAIS "stage" — l'IA ne peut pas
      // classer un prospect "perdu" ni bloquer une relance ; seule
      // l'action "update_stage" (déclenchée par un humain) le peut.
      callHistory.push({
        date: new Date().toISOString(),
        transcript,
        summary: parsed.summary ?? transcript,
        key_quotes: Array.isArray(parsed.key_quotes) ? parsed.key_quotes : [],
        objections: parsed.objections ?? null,
        commitment: parsed.commitment ?? null,
        next_step: parsed.next_step ?? null,
        interest_level: interestLevel,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
        corrected: false,
      });

      // T1 : l'historique d'appel s'écrit directement (trace de l'appel); l'intérêt, le prochain suivi et la
      // prochaine action deviennent une PROPOSITION de l'analyse d'appel, à approuver dans Lanceur.
      // Activé partout sauf en production tant que Lanceur n'y est pas en ligne (PROPOSITIONS_ACTIVES=true l'active).
      const propositions = Deno.env.get("PROPOSITIONS_ACTIVES") === "true" || !(supabaseUrl ?? "").includes("kdmwfbcziokygfcmjxeq");
      await fetch(`${supabaseUrl}/rest/v1/prospects?id=eq.${prospect_id}`, {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify(propositions ? { call_history: callHistory } : {
          call_history: callHistory,
          interest_level: interestLevel ?? prospect.interest_level,
          next_followup_date: followupDate,
        }),
      });
      if (propositions) {
        await proposerSuivi({ supabaseUrl: supabaseUrl!, headers: adminHeaders, prospectId: prospect_id, apres: apresAnalyse, analyse: parsed,
          transcript: String(transcript ?? ""), sourceRef: "Appel du " + new Date().toLocaleDateString("fr-CA", { timeZone: "America/Toronto" }),
          cle: `appel:${prospect_id}:${callHistory.length - 1}` });
      }
      return new Response(JSON.stringify({ ok: true, proposition: propositions }), { status: 200, headers: corsHeaders });
    }

    // Un vendeur peut corriger une analyse d'appel que l'IA a mal
    // évaluée. La correction est conservée (avec l'original) dans
    // l'historique et journalisée pour permettre, plus tard, une revue
    // des écarts et l'amélioration du prompt.
    if (action === "correct_call") {
      const { prospect_id, call_index, corrections, correction_note } = body;
      const prospRes = await fetch(`${supabaseUrl}/rest/v1/prospects?id=eq.${prospect_id}&select=call_history`, { headers: adminHeaders });
      const [prospect] = await prospRes.json();
      const callHistory = Array.isArray(prospect?.call_history) ? prospect.call_history : [];
      if (!prospect || call_index == null || !callHistory[call_index]) {
        return new Response(JSON.stringify({ error: "appel introuvable" }), { status: 404, headers: corsHeaders });
      }

      const original = { ...callHistory[call_index] };
      callHistory[call_index] = { ...original, ...corrections, corrected: true, correction_note: correction_note || null };

      await fetch(`${supabaseUrl}/rest/v1/prospects?id=eq.${prospect_id}`, {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ call_history: callHistory }),
      });
      await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          actor_type: "admin", actor_id: userId, action: "prospect.call_corrected",
          entity_type: "prospects", entity_id: prospect_id,
          details: { call_index, original, corrections, correction_note: correction_note || null },
        }),
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "action inconnue" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
