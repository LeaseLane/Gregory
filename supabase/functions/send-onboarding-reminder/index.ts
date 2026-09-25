import { EXPEDITEUR } from "../_shared/branding.ts";
import { corsHeadersFor } from "../_shared/auth.ts";
import { appelerIA, MODELE_RAPIDE } from "../_shared/ia.ts";
// Déclenchée par le cron flag_incomplete_onboarding() (ou manuellement
// par l'admin) — jamais par un utilisateur final, donc pas de JWT à
// vérifier ici (même convention que handle-payment-reminder). La liste
// des lacunes vient entièrement de owner_onboarding_checklist (calcul
// SQL déterministe) ; l'IA se limite à rédiger le courriel à partir de
// cette liste, sans jamais inventer une lacune ou une donnée.
// Liste blanche d'origines : évite d'exposer les fonctions à un
// site tiers qui embarquerait un appel authentifié depuis le
// navigateur d'un usager (CSRF via fetch). Les appels serveur à
// serveur (cron, webhooks, autre fonction edge) n'envoient pas
// d'en-tête Origin et ne sont donc pas affectés par ce contrôle.

function describeGaps(c: any): string[] {
  const gaps: string[] = [];
  if (c.missing_phone) gaps.push("Numéro de téléphone manquant sur le profil du compte");
  if (c.missing_buildings) gaps.push("Aucun immeuble ajouté");
  if (c.missing_units) gaps.push("Immeuble(s) ajouté(s) sans aucune unité");
  if (c.units_missing_rent_count > 0) gaps.push(`${c.units_missing_rent_count} unité(s) sans loyer indiqué`);
  if (c.occupied_units_missing_lease_count > 0) gaps.push(`${c.occupied_units_missing_lease_count} unité(s) marquée(s) "occupée" sans bail actif enregistré`);
  if (c.active_leases_missing_tenant_contact_count > 0) gaps.push(`${c.active_leases_missing_tenant_contact_count} bail(aux) actif(s) dont le locataire n'a ni courriel ni téléphone enregistré`);
  if (c.active_leases_missing_bail_doc_count > 0) gaps.push(`${c.active_leases_missing_bail_doc_count} bail(aux) actif(s) sans copie du bail téléversée`);
  return gaps;
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const { owner_id } = await req.json().catch(() => ({}));
    if (!owner_id) {
      return new Response(JSON.stringify({ error: "owner_id manquant" }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminHeaders = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    const ownerRes = await fetch(`${supabaseUrl}/rest/v1/owners?id=eq.${owner_id}&select=id,full_name,user_id,onboarding_reminder_count`, { headers: adminHeaders });
    const [owner] = await ownerRes.json();
    if (!owner) {
      return new Response(JSON.stringify({ error: "Propriétaire introuvable" }), { status: 404, headers: corsHeaders });
    }

    const checklistRes = await fetch(`${supabaseUrl}/rest/v1/owner_onboarding_checklist?owner_id=eq.${owner_id}&select=*`, { headers: adminHeaders });
    const [checklist] = await checklistRes.json();
    const gaps = checklist ? describeGaps(checklist) : [];
    if (!gaps.length) {
      return new Response(JSON.stringify({ ok: true, skipped: "aucune lacune détectée" }), { status: 200, headers: corsHeaders });
    }

    const usersRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${owner.user_id}&select=email`, { headers: adminHeaders });
    const [userRow] = await usersRes.json();
    if (!userRow?.email) {
      return new Response(JSON.stringify({ error: "Aucun courriel pour ce propriétaire" }), { status: 400, headers: corsHeaders });
    }

    const gapsLabel = gaps.map((g) => `- ${g}`).join("\n");
    // Minimisation (Loi 25) : rédiger le rappel n'exige pas le nom du
    // client — le destinataire se sait déjà lui-même.
    const prompt = `Tu es l'assistant de gestion locative de "Lease Lane". Rédige un courriel amical et bref à un client (propriétaire) pour lui rappeler de compléter son dossier dans le portail. Utilise UNIQUEMENT les éléments manquants listés ci-dessous — n'invente rien d'autre et ne donne aucun conseil hors de cette liste.

Éléments manquants dans son dossier :
${gapsLabel}

Réponds UNIQUEMENT avec un objet JSON valide (rien avant, rien après):
{
  "subject": "objet de courriel court et amical en français",
  "body": "corps du courriel en français (4-6 phrases), ton amical et professionnel, qui liste clairement les éléments manquants ci-dessus et invite le client à se connecter à son portail pour les compléter. Signé 'L'équipe Lease Lane'."
}`;

    const aiStartedAt = Date.now();
    const ia = await appelerIA({ prompt, maxTokens: 400 });
    if (!ia.ok) {
      console.error("Service IA", ia.status, ia.erreur);
      await fetch(`${supabaseUrl}/rest/v1/ai_run_log`, {
        method: "POST", headers: adminHeaders,
        body: JSON.stringify({
          function_name: "send-onboarding-reminder", trigger_source: "cron", entity_type: "owners", entity_id: owner_id,
          prompt_version: "onboarding-reminder-v1", model_version: MODELE_RAPIDE, input_summary: gapsLabel,
          duration_ms: Date.now() - aiStartedAt,
          // Le motif du fournisseur est conservé : un 400 peut vouloir
          // dire un modèle inconnu, un solde épuisé ou une requête
          // malformée, et ces cas se corrigent différemment.
          error: `ia_error ${ia.status}: ${ia.erreur ?? ""}`.slice(0, 400),
        }),
      }).catch(() => null);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), { status: 502, headers: corsHeaders });
    }
    const rawText = ia.texte || "{}";
    let parsed: { subject?: string; body?: string };
    try {
      parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    } catch {
      // Une réponse HTTP 200 n'est pas forcément du modèle : Tonia bloque
      // en répondant 200 avec un message texte (« Modèle non disponible… »).
      // Sans cette garde, la fonction plantait en 500 sans rien journaliser,
      // et le motif du blocage — la seule information utile — était perdu.
      await fetch(`${supabaseUrl}/rest/v1/ai_run_log`, {
        method: "POST", headers: adminHeaders,
        body: JSON.stringify({
          function_name: "send-onboarding-reminder", trigger_source: "cron", entity_type: "owners", entity_id: owner_id,
          prompt_version: "onboarding-reminder-v1", model_version: MODELE_RAPIDE, input_summary: gapsLabel,
          duration_ms: Date.now() - aiStartedAt,
          error: `reponse_non_json: ${rawText.slice(0, 380)}`,
        }),
      }).catch(() => null);
      return new Response(JSON.stringify({ error: "Réponse IA inattendue", apercu: rawText.slice(0, 300) }), { status: 502, headers: corsHeaders });
    }

    await fetch(`${supabaseUrl}/rest/v1/ai_run_log`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        function_name: "send-onboarding-reminder",
        trigger_source: "cron",
        entity_type: "owners",
        entity_id: owner_id,
        prompt_version: "onboarding-reminder-v1",
        model_version: MODELE_RAPIDE,
        input_summary: gapsLabel,
        output_summary: parsed.subject ?? null,
        duration_ms: Date.now() - aiStartedAt,
        input_tokens: ia.data?.usage?.input_tokens ?? null,
        output_tokens: ia.data?.usage?.output_tokens ?? null,
        automatic_action_taken: "rappel_onboarding_envoye",
      }),
    }).catch((e) => console.error("Failed to write ai_run_log", e));

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EXPEDITEUR,
        to: [userRow.email],
        subject: parsed.subject,
        text: parsed.body,
      }),
    });

    await fetch(`${supabaseUrl}/rest/v1/owners?id=eq.${owner_id}`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({
        onboarding_reminder_sent_at: new Date().toISOString(),
        onboarding_reminder_count: (owner.onboarding_reminder_count || 0) + 1,
      }),
    });

    await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ actor_type: "system", action: "onboarding.reminder_sent", entity_type: "owners", entity_id: owner_id, details: { gaps } }),
    });

    return new Response(JSON.stringify({ ok: true, gaps }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("send-onboarding-reminder unexpected error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
