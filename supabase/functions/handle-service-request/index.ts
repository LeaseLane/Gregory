import { EXPEDITEUR } from "../_shared/branding.ts";
import { ajouterMessageDemande, courrielDemande } from "../_shared/fil-demande.ts";
import { avecHtml, POURQUOI } from "../_shared/courriel.ts";
import { IA_MESSAGES_URL, IA_CLE, MODELE_RAPIDE, MODELE_VIDEO, decrireVideo, decrireMedias, versBase64, type PartieGemini, avecContexte } from "../_shared/ia.ts";
// Règles de sécurité déterministes : ne dépendent JAMAIS de l'IA.
// Si l'une de ces situations est détectée dans la description du
// locataire, l'urgence est forcée à "urgence" même si Claude évalue
// autrement, et les admins sont alertés par courriel immédiatement.
const SAFETY_RULES: { code: string; label: string; pattern: RegExp }[] = [
  { code: "gaz", label: "Possible odeur ou fuite de gaz", pattern: /\bgaz\b|\bgas\b/i },
  { code: "feu", label: "Feu, fumée ou incendie", pattern: /\bfeu\b|fum[ée]e|incendie|\bfire\b|\bsmoke\b/i },
  { code: "fuite_eau", label: "Fuite d'eau active ou inondation", pattern: /fuite[^.]{0,15}eau|inonda|d[ée]g[aâ]t[^.]{0,10}eau|water\s*leak|flooding/i },
  { code: "chauffage", label: "Absence de chauffage (situation critique)", pattern: /pas de chauffage|sans chauffage|chauffage[^.]{0,20}(bris[ée]|en panne|ne fonctionne pas)|no heat/i },
  { code: "electrique", label: "Problème électrique avec étincelles", pattern: /[ée]tincelle|choc [ée]lectrique|fils? (d[ée]nud[ée]s?|[àa] nu)|\bspark/i },
  { code: "enferme", label: "Personne enfermée", pattern: /enferm[ée]e?|\btrapped\b|locked in/i },
  { code: "egout", label: "Refoulement d'égout majeur", pattern: /refoulement|[ée]gout[^.]{0,15}d[ée]borde|sewage backup|sewer overflow/i },
];

function checkSafetyOverride(description: string) {
  const text = description || "";
  return SAFETY_RULES.filter((r) => r.pattern.test(text));
}

const MODEL_VERSION = MODELE_RAPIDE;
const PROMPT_VERSION = "service-request-v4-video";
const MAX_VIDEOS = 2;
// Envoi en ligne à la passerelle : au-delà, la vidéo est gardée pour
// l'équipe mais pas analysée.
const MAX_OCTETS_VIDEO = 18 * 1024 * 1024;
const MAX_PHOTOS = 5;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminHeaders = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    // 1. Sécurité déterministe — s'exécute toujours, même si l'IA échoue.
    const matchedRules = checkSafetyOverride(record.description);
    const safetyOverride = matchedRules.length > 0;

    if (safetyOverride) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
          method: "POST",
          headers: adminHeaders,
          body: JSON.stringify({
            actor_type: "system",
            action: "safety_override_triggered",
            entity_type: "service_requests",
            entity_id: record.id,
            details: { flags: matchedRules.map((r) => r.code), description: record.description },
          }),
        });
      } catch (e) {
        console.error("Failed to write safety audit log", e);
      }

      try {
        const adminsRes = await fetch(`${supabaseUrl}/rest/v1/users?is_admin=eq.true&select=email`, { headers: adminHeaders });
        const admins = await adminsRes.json().catch(() => []);
        const adminEmails = Array.isArray(admins) ? admins.map((a: any) => a.email).filter(Boolean) : [];
        if (adminEmails.length && resendKey) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(avecHtml({
              from: EXPEDITEUR,
              to: adminEmails,
              subject: `URGENCE SÉCURITÉ — demande de service #${String(record.id).slice(0, 8)}`,
              text: `Une demande de service a déclenché une alerte de sécurité automatique (règle déterministe, indépendante de l'IA).\n\nMotif(s) : ${matchedRules.map((r) => r.label).join(", ")}\n\nDescription du locataire : ${record.description}\n\nCette demande a été marquée "urgence" automatiquement. Veuillez intervenir immédiatement.`,
            }, { pied: POURQUOI.admin })),
          });
        }
      } catch (e) {
        console.error("Failed to send safety alert email", e);
      }
    }

    // 2. Catégorisation IA — best effort, ne bloque jamais le drapeau de sécurité ci-dessus.
    let aiCategory: string | null = null;
    let aiSubcategory: string | null = null;
    let aiCostMin: number | null = null;
    let aiCostMax: number | null = null;
    let aiCost: number | null = null;
    let aiConfidence: number | null = null;
    let aiMissingInfo: string | null = null;
    let aiPhotosNeeded: boolean | null = null;
    let aiRecommendedTrade: string | null = null;
    let aiImmediateAction: string | null = null;
    let aiRiskIfNoAction: string | null = null;
    let aiUrgency: string | null = safetyOverride ? "urgence" : null;
    let aiError: string | null = null;
    let aiUsage: { input_tokens?: number; output_tokens?: number } | null = null;
    const aiStartedAt = Date.now();

    // Récupère les photos jointes par le locataire (si présentes) pour les
    // envoyer à l'IA en plus du texte — c'est ce qui manquait pour que
    // l'analyse porte vraiment sur "texte ET photos", pas juste le texte.
    // Les vidéos sont gardées pour l'équipe et le travailleur, mais l'IA
    // n'analyse que les images : on ne télécharge pas les vidéos ici.
    const estImage = (p: string) => /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(p);
    const photoPaths: string[] = Array.isArray(record.photo_urls) ? record.photo_urls.filter(estImage).slice(0, MAX_PHOTOS) : [];
    const photoBlocks: Record<string, unknown>[] = [];
    for (const path of photoPaths) {
      try {
        const fileRes = await fetch(`${supabaseUrl}/storage/v1/object/service-request-photos/${path}`, {
          headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey ?? "" },
        });
        if (!fileRes.ok) continue;
        const mediaType = fileRes.headers.get("content-type") || "image/jpeg";
        const bytes = new Uint8Array(await fileRes.arrayBuffer());
        let binary = "";
        for (const b of bytes) binary += String.fromCharCode(b);
        photoBlocks.push({ type: "image", source: { type: "base64", media_type: mediaType, data: btoa(binary) } });
      } catch (e) {
        console.error("Failed to fetch service request photo", path, e);
      }
    }

    // Vidéos : Gemini (via Tonia) les décrit — image ET son — et ce texte
    // est donné à Claude avec le reste. Claude ne lit pas la vidéo.
    const estVideo = (p: string) => /\.(mp4|mov|m4v|webm|3gp)$/i.test(p);
    const CONSIGNE_VIDEO = "Un locataire au Québec (Canada) a filmé un problème dans son logement. Décris objectivement, en français, en 3 à 5 phrases : ce qu'on voit (pièce, appareil, dégât, étendue, eau, fumée, étincelles…) et ce qu'on entend (bruits, et ce que dit le locataire). Pas de diagnostic ni de coût.";
    const lireStockage = async (chemin: string) => {
      const f = await fetch(`${supabaseUrl}/storage/v1/object/service-request-photos/${chemin}`, {
        headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey ?? "" },
      });
      return f.ok ? { octets: new Uint8Array(await f.arrayBuffer()), type: f.headers.get("content-type") || "" } : null;
    };
    // Vidéos longues (> 18 Mo) : le portail locataire en a extrait une image
    // toutes les quelques secondes et la bande son (video_analysis). Gemini
    // reçoit ces images + le son — c'est ce qu'il échantillonne de toute
    // façon dans une vraie vidéo (~1 image/s + audio).
    type Extrait = { video: string | null; images: string[]; audio: string | null; pas: number; duree: number; nom?: string };
    const extraits: Extrait[] = Array.isArray(record.video_analysis) ? record.video_analysis.slice(0, MAX_VIDEOS) : [];
    const couvertes = new Set(extraits.map((e) => e.video).filter(Boolean));
    const directes: string[] = (Array.isArray(record.photo_urls) ? record.photo_urls.filter(estVideo) : [])
      .filter((p: string) => !couvertes.has(p)).slice(0, Math.max(0, MAX_VIDEOS - extraits.length));
    const resumesVideo: string[] = [];
    const journaliser = (source: string, debut: number, erreur: string | null) => fetch(`${supabaseUrl}/rest/v1/ai_run_log`, {
      method: "POST", headers: adminHeaders,
      body: JSON.stringify({
        function_name: "handle-service-request", trigger_source: "db_webhook", entity_type: "service_requests", entity_id: record.id,
        prompt_version: "service-request-video-v2", model_version: MODELE_VIDEO, input_summary: source.slice(0, 300),
        output_summary: erreur ? null : resumesVideo.at(-1)?.slice(0, 300) ?? null, duration_ms: Date.now() - debut,
        error: erreur ? `video: ${erreur}`.slice(0, 400) : null,
      }),
    }).catch(() => null);

    for (const chemin of directes) {
      const debut = Date.now();
      let erreur: string | null = null;
      try {
        const f = await lireStockage(chemin);
        if (!f) erreur = "lecture stockage impossible";
        else if (f.octets.length > MAX_OCTETS_VIDEO) erreur = `vidéo trop lourde (${Math.round(f.octets.length / 1048576)} Mo) et sans extrait`;
        else {
          const r = await decrireVideo({ base64: versBase64(f.octets), mime: f.type.startsWith("video/") ? f.type : "video/mp4", consigne: CONSIGNE_VIDEO });
          if (r.ok) resumesVideo.push(r.texte); else erreur = r.erreur;
        }
      } catch (e) { erreur = String(e); }
      await journaliser(`vidéo ${chemin}`, debut, erreur);
    }

    for (const ex of extraits) {
      const debut = Date.now();
      let erreur: string | null = null;
      try {
        const parties: PartieGemini[] = [{ type: "text", text: `${CONSIGNE_VIDEO}\n\nLa vidéo (${Math.round(ex.duree)} s) t'est fournie sous forme d'images extraites toutes les ${Math.round(ex.pas)} secondes, dans l'ordre${ex.audio ? ", et de sa bande son" : " (pas de son disponible)"}.` }];
        for (const img of (ex.images || []).slice(0, 80)) {
          const f = await lireStockage(img);
          if (f) parties.push({ type: "image", data: versBase64(f.octets), mime_type: "image/jpeg" });
        }
        if (ex.audio) {
          const a = await lireStockage(ex.audio);
          if (a) parties.push({ type: "audio", data: versBase64(a.octets), mime_type: "audio/wav" });
        }
        if (parties.length < 2) erreur = "extrait vide";
        else {
          const r = await decrireMedias(parties);
          if (r.ok) resumesVideo.push(r.texte); else erreur = r.erreur;
        }
      } catch (e) { erreur = String(e); }
      await journaliser(`extrait ${ex.nom || ex.video || ""} (${ex.images?.length || 0} images${ex.audio ? " + son" : ""})`, debut, erreur);
    }

    try {
      const prompt = `Tu es l'assistant technique d'une entreprise de gestion immobilière résidentielle au Québec. Un locataire vient de soumettre une demande de service pour son logement.

Description du problème: ${record.description}
${resumesVideo.length ? `\nLe locataire a aussi envoyé ${resumesVideo.length} vidéo(s). Voici ce qu'elles montrent (description faite par un autre modèle à partir de l'image et du son) :\n${resumesVideo.map((t, i) => `Vidéo ${i + 1} : ${t}`).join("\n")}\nTiens-en compte dans ton diagnostic.` : ""}
${photoBlocks.length ? `\n${photoBlocks.length} photo(s) du problème sont jointes ci-dessus — utilise-les pour affiner ton diagnostic (gravité, étendue, type d'appareil ou de matériau visible, etc.), pas seulement le texte.` : "Aucune photo n'a été jointe."}

Réponds UNIQUEMENT avec un objet JSON valide (rien avant, rien après), avec exactement ces champs:
{
  "category": "la catégorie du problème parmi: Plomberie, Électricité, CVC (chauffage/climatisation), Électroménager, Structure/menuiserie, Autre",
  "subcategory": "une sous-catégorie plus précise en français (ex: 'fuite sous l'évier', 'prise électrique défectueuse')",
  "urgency": "le niveau d'urgence parmi: faible, normal, élevé, urgence",
  "cost_min": un nombre représentant l'estimation basse du coût de réparation en dollars canadiens, basée sur les tarifs typiques au Québec,
  "cost_max": un nombre représentant l'estimation haute du coût de réparation en dollars canadiens,
  "confidence": un nombre entre 0 et 100 représentant ta confiance dans cette évaluation (sois honnête — une description vague sans photo doit donner une confiance basse ; des photos claires peuvent la justifier plus haute),
  "missing_info": "ce qui manque pour évaluer avec certitude (ex: 'photo du bris', 'âge de l'appareil') — ne redemande jamais une photo déjà fournie ci-dessus, ou null si rien ne manque",
  "photos_needed": true ou false selon si des photos additionnelles aideraient à confirmer le diagnostic (toujours false si des photos suffisantes sont déjà jointes),
  "recommended_trade": "le métier à contacter en priorité (plombier, électricien, technicien CVC, ébéniste, etc.)",
  "immediate_action": "une action simple et sécuritaire que le locataire peut faire tout de suite en attendant l'intervention (ex: 'fermer le robinet d'arrêt sous l'évier'), ou null si aucune action n'est nécessaire ou sécuritaire",
  "risk_if_no_action": "le risque concret en une phrase si la situation n'est pas traitée rapidement"
}`;

      const appelIA = (avecPhotos: boolean) => fetch(IA_MESSAGES_URL, {
        method: "POST",
        headers: {
          "x-api-key": IA_CLE,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify(avecContexte({
          model: MODEL_VERSION,
          max_tokens: 800,
          messages: [{ role: "user", content: avecPhotos && photoBlocks.length ? [...photoBlocks, { type: "text", text: prompt }] : prompt }],
        })),
      });
      let aiRes = await appelIA(true);
      // Photo refusée (trop grande, format non lu…) : on analyse le texte
      // seul plutôt que de laisser la demande sans diagnostic. Le 2026-09-27,
      // une photo de téléphone > 8000 px a fait échouer tout le triage.
      if (aiRes.status === 400 && photoBlocks.length) {
        console.error("Photo refusée par l'IA, nouvel essai sans photo", await aiRes.clone().text());
        aiRes = await appelIA(false);
      }

      const aiData = await aiRes.json();
      aiUsage = aiData?.usage ?? null;
      if (!aiRes.ok) {
        throw new Error(`anthropic_api_error ${aiRes.status}: ${JSON.stringify(aiData)}`);
      }

      const rawText = aiData.content?.[0]?.text ?? "{}";
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      aiCategory = parsed.category ?? null;
      aiSubcategory = parsed.subcategory ?? null;
      aiCostMin = typeof parsed.cost_min === "number" ? parsed.cost_min : null;
      aiCostMax = typeof parsed.cost_max === "number" ? parsed.cost_max : null;
      aiCost = aiCostMin !== null && aiCostMax !== null ? Math.round(((aiCostMin + aiCostMax) / 2) * 100) / 100 : null;
      aiConfidence = typeof parsed.confidence === "number" ? parsed.confidence : null;
      aiMissingInfo = parsed.missing_info ?? null;
      aiPhotosNeeded = typeof parsed.photos_needed === "boolean" ? parsed.photos_needed : null;
      aiRecommendedTrade = parsed.recommended_trade ?? null;
      aiImmediateAction = parsed.immediate_action ?? null;
      aiRiskIfNoAction = parsed.risk_if_no_action ?? null;
      // La sécurité déterministe l'emporte toujours sur l'IA : jamais l'inverse.
      aiUrgency = safetyOverride ? "urgence" : (parsed.urgency ?? null);
    } catch (e) {
      aiError = String(e);
      console.error("AI categorization failed", aiError);
    }

    // Un humain doit valider si l'IA manque de confiance ou signale des infos manquantes.
    const needsReview = safetyOverride || (aiConfidence !== null && aiConfidence < 70) || aiMissingInfo !== null;

    // 3. Mise à jour DB — toujours tentée, même si l'IA a échoué (au minimum le drapeau de sécurité).
    const patchBody: Record<string, unknown> = {
      safety_override: safetyOverride,
      safety_flags: matchedRules.map((r) => r.code),
      ai_needs_review: needsReview,
    };
    if (aiCategory !== null) patchBody.ai_category = aiCategory;
    if (aiSubcategory !== null) patchBody.ai_subcategory = aiSubcategory;
    if (aiCost !== null) patchBody.ai_estimated_cost = aiCost;
    if (aiCostMin !== null) patchBody.ai_cost_min = aiCostMin;
    if (aiCostMax !== null) patchBody.ai_cost_max = aiCostMax;
    if (aiConfidence !== null) patchBody.ai_confidence = aiConfidence;
    if (aiMissingInfo !== null) patchBody.ai_missing_info = aiMissingInfo;
    if (aiPhotosNeeded !== null) patchBody.ai_photos_needed = aiPhotosNeeded;
    if (aiRecommendedTrade !== null) patchBody.ai_recommended_trade = aiRecommendedTrade;
    if (aiImmediateAction !== null) patchBody.ai_immediate_action = aiImmediateAction;
    if (aiRiskIfNoAction !== null) patchBody.ai_risk_if_no_action = aiRiskIfNoAction;
    if (aiUrgency !== null) patchBody.ai_urgency = aiUrgency;
    if (resumesVideo.length) patchBody.ai_video_summary = resumesVideo.join("\n\n");

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/service_requests?id=eq.${record.id}`, {
      method: "PATCH",
      headers: { ...adminHeaders, Prefer: "return=representation" },
      body: JSON.stringify(patchBody),
    });

    const patchData = await patchRes.json().catch(() => null);
    if (!patchRes.ok || !patchData || patchData.length === 0) {
      console.error("Failed to update service_requests", record.id, patchRes.status, JSON.stringify(patchData));
      return new Response(JSON.stringify({ ok: false, error: "db_update_failed", status: patchRes.status, detail: patchData }), { status: 500 });
    }

    // Suivi automatique au locataire : instruction de sécurité temporaire
    // et/ou demande d'information manquante — jusqu'ici ces champs étaient
    // calculés mais seulement visibles par l'admin, jamais transmis au
    // locataire qui en a pourtant besoin en premier.
    if ((aiImmediateAction || aiMissingInfo) && resendKey) {
      try {
        const tenantRes = await fetch(`${supabaseUrl}/rest/v1/tenants?id=eq.${record.tenant_id}&select=email,full_name`, { headers: adminHeaders });
        const [tenant] = await tenantRes.json().catch(() => [null]);
        if (tenant?.email) {
          const lines = [`Bonjour ${tenant.full_name?.split(" ")[0] || ""},`, "", "Merci pour ta demande de service — voici où ça en est."];
          if (aiImmediateAction) {
            lines.push("", `En attendant l'intervention, voici ce que tu peux faire dès maintenant : ${aiImmediateAction}`);
          }
          if (aiMissingInfo) {
            lines.push("", `Pour traiter ta demande plus rapidement, pourrais-tu nous fournir : ${aiMissingInfo} ? Tu peux répondre directement à ce courriel, ou ajouter un message et des photos à ta demande dans ton portail locataire (onglet « Mes demandes »).`);
          }
          lines.push("", "L'équipe Lease Lane");
          await courrielDemande({ demandeId: record.id, to: tenant.email, sujet: "Ta demande de service — suivi", texte: lines.join("\n") });
        } else {
          // Pas de courriel : le suivi reste visible dans le portail.
          const conseil = [aiImmediateAction && `En attendant l'intervention : ${aiImmediateAction}`, aiMissingInfo && `Pour traiter ta demande plus vite, pourrais-tu nous fournir : ${aiMissingInfo} ?`].filter(Boolean).join("\n\n");
          await ajouterMessageDemande({ demandeId: record.id, sender: "system", corps: conseil });
        }
      } catch (e) {
        console.error("Failed to send tenant follow-up email", e);
      }
    }

    // Traçabilité de cet appel IA — indépendante du drapeau ai_needs_review
    // propre à cette table, pour une vue technique uniforme entre toutes
    // les automatisations (voir centre de commandement).
    await fetch(`${supabaseUrl}/rest/v1/ai_run_log`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        function_name: "handle-service-request",
        trigger_source: "db_trigger:service_requests_insert",
        entity_type: "service_requests",
        entity_id: record.id,
        prompt_version: PROMPT_VERSION,
        model_version: MODEL_VERSION,
        input_summary: (record.description ?? "").slice(0, 300),
        output_summary: aiCategory ? `${aiCategory}${aiSubcategory ? " / " + aiSubcategory : ""} / ${aiUrgency ?? "?"} / ${aiCost ?? "?"}$` : null,
        confidence: aiConfidence,
        needs_escalation: needsReview,
        duration_ms: Date.now() - aiStartedAt,
        input_tokens: aiUsage?.input_tokens ?? null,
        output_tokens: aiUsage?.output_tokens ?? null,
        automatic_action_taken: safetyOverride ? "urgence_forcee_alerte_admin" : "categorisation_appliquee",
        error: aiError,
      }),
    }).catch((e) => console.error("Failed to write ai_run_log", e));

    if (aiError) {
      return new Response(JSON.stringify({ ok: true, warning: "ai_categorization_failed", detail: aiError, safety_override: safetyOverride, updated: patchData[0] }), { status: 200 });
    }

    return new Response(JSON.stringify({ ok: true, safety_override: safetyOverride, updated: patchData[0] }), { status: 200 });
  } catch (err) {
    console.error("handle-service-request unexpected error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
