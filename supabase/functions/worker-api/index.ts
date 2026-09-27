import { EXPEDITEUR } from "../_shared/branding.ts";
import { avecHtml, POURQUOI } from "../_shared/courriel.ts";
import { corsHeadersFor, requireUser } from "../_shared/auth.ts";

// Ce que le travailleur voit d'un travail : jamais les frais de coordination
// ni les coordonnées du locataire.
const CHAMPS_JOB = "id,description,worker_pay,status,created_at,appointment_at,due_by,entry_permission,billing_terms,safety_instructions,is_urgent,worker_response,worker_response_note,worker_response_at,worker_reported_done_at,worker_completion_note,tenant_confirmed,proposed_appointment_at,photo_before_urls,photo_after_urls,worker_paid_at,worker_paid_amount,units(unit_number,buildings(address)),service_requests(description,photo_urls,ai_category,ai_subcategory,ai_video_summary,safety_override)";
const ALLOWED_AVAILABILITY = ["maintenant", "aujourdhui", "semaine", "indisponible"];


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
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const adminHeaders = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    const workerRes = await fetch(`${supabaseUrl}/rest/v1/workers?user_id=eq.${userId}&select=*`, { headers: adminHeaders });
    const [worker] = await workerRes.json().catch(() => [null]);
    if (!worker) {
      return new Response(JSON.stringify({ error: "Accès refusé — aucun profil travailleur associé à ce compte" }), { status: 403, headers: corsHeaders });
    }
    if (worker.active === false) {
      return new Response(JSON.stringify({ error: "Ton compte est désactivé — contacte l'équipe Lease Lane" }), { status: 403, headers: corsHeaders });
    }
    const workerId = worker.id;

    const logAudit = (action: string, entityType: string, entityId: string | null, details: Record<string, unknown>) =>
      fetch(`${supabaseUrl}/rest/v1/audit_log`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ actor_type: "worker", actor_id: userId, action, entity_type: entityType, entity_id: entityId, details }),
      });

    const notifyAdmins = async (subject: string, text: string) => {
      const adminsRes = await fetch(`${supabaseUrl}/rest/v1/users?is_admin=eq.true&select=email`, { headers: adminHeaders });
      const admins = await adminsRes.json().catch(() => []);
      const adminEmails = Array.isArray(admins) ? admins.map((a: any) => a.email).filter(Boolean) : [];
      if (adminEmails.length && resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(avecHtml({ from: EXPEDITEUR, to: adminEmails, subject, text }, { pied: POURQUOI.admin })),
        }).catch(() => null);
      }
    };

    const body = await req.json().catch(() => ({}));
    const action = body.action || "get_my_profile";

    if (action === "get_my_profile") {
      const verifRes = await fetch(`${supabaseUrl}/rest/v1/worker_verification_status?id=eq.${workerId}&select=*`, { headers: adminHeaders });
      const [profile] = await verifRes.json().catch(() => [worker]);
      return new Response(JSON.stringify({ worker: profile || worker }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_my_profile") {
      const { company_name, neq, specialties, zones, hourly_rate, travel_fee, handles_urgent, payout_email, availability_schedule } = body;
      const patch: Record<string, unknown> = {};
      if (company_name !== undefined) patch.company_name = company_name || null;
      if (neq !== undefined) patch.neq = neq || null;
      if (Array.isArray(specialties)) patch.specialties = specialties;
      if (Array.isArray(zones)) patch.zones = zones;
      if (hourly_rate !== undefined) patch.hourly_rate = hourly_rate === "" || hourly_rate === null ? null : Number(hourly_rate);
      if (travel_fee !== undefined) patch.travel_fee = travel_fee === "" || travel_fee === null ? null : Number(travel_fee);
      if (handles_urgent !== undefined) patch.handles_urgent = !!handles_urgent;
      if (payout_email !== undefined) patch.payout_email = payout_email || null;
      if (availability_schedule !== undefined && typeof availability_schedule === "object") patch.availability_schedule = availability_schedule;

      const profileRes = await fetch(`${supabaseUrl}/rest/v1/workers?id=eq.${workerId}`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify(patch) });
      if (!profileRes.ok) {
        return new Response(JSON.stringify({ error: "Impossible de mettre à jour le profil" }), { status: 500, headers: corsHeaders });
      }
      await logAudit("worker.profile_updated", "workers", workerId, { fields: Object.keys(patch) });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    // Bascule rapide (un clic) — distincte de update_my_profile pour ne
    // jamais avoir à repasser par tout le formulaire juste pour se
    // déclarer disponible/indisponible.
    if (action === "set_availability_status") {
      const { availability_status } = body;
      if (!ALLOWED_AVAILABILITY.includes(availability_status)) {
        return new Response(JSON.stringify({ error: "Statut de disponibilité invalide" }), { status: 400, headers: corsHeaders });
      }
      await fetch(`${supabaseUrl}/rest/v1/workers?id=eq.${workerId}`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ availability_status }) });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    // Preuve d'assurance ou référence/photo — réutilise le stockage
    // "documents" déjà en place, avec worker_id plutôt qu'owner_id.
    if (action === "upload_credential_document") {
      const { doc_type, file_base64, filename, content_type } = body;
      if (!["assurance_travailleur", "reference_travailleur"].includes(doc_type) || !file_base64) {
        return new Response(JSON.stringify({ error: "doc_type ou fichier manquant" }), { status: 400, headers: corsHeaders });
      }
      const path = `workers/${workerId}/${Date.now()}-${(filename || "document").replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const bytes = Uint8Array.from(atob(file_base64), (c) => c.charCodeAt(0));
      const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/documents/${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey ?? "", "Content-Type": content_type || "application/octet-stream" },
        body: bytes,
      });
      if (!uploadRes.ok) {
        return new Response(JSON.stringify({ error: "Échec du téléversement" }), { status: 500, headers: corsHeaders });
      }
      const docRes = await fetch(`${supabaseUrl}/rest/v1/documents`, {
        method: "POST",
        headers: { ...adminHeaders, Prefer: "return=representation" },
        body: JSON.stringify({ worker_id: workerId, title: filename || doc_type, doc_type, file_url: path }),
      });
      if (!docRes.ok) {
        console.error("Failed to create document row", await docRes.text());
        return new Response(JSON.stringify({ error: "Fichier téléversé, mais l'enregistrement du document a échoué." }), { status: 500, headers: corsHeaders });
      }
      const [doc] = await docRes.json().catch(() => [null]);
      if (doc_type === "assurance_travailleur" && doc?.id) {
        const linkRes = await fetch(`${supabaseUrl}/rest/v1/workers?id=eq.${workerId}`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ insurance_document_id: doc.id }) });
        if (!linkRes.ok) {
          console.error("Failed to link insurance document to worker", await linkRes.text());
          return new Response(JSON.stringify({ error: "Document enregistré, mais le lien avec le profil a échoué." }), { status: 500, headers: corsHeaders });
        }
      }
      await logAudit("worker.document_uploaded", "workers", workerId, { doc_type });
      return new Response(JSON.stringify({ ok: true, document_id: doc?.id ?? null }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list_my_offers") {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/job_offers?worker_id=eq.${workerId}&status=eq.sent&select=id,tier,score,sent_at,work_orders(id,description,worker_pay,is_urgent,units(unit_number,buildings(address)))&order=sent_at.desc`,
        { headers: adminHeaders },
      );
      const offers = await res.json().catch(() => []);
      return new Response(JSON.stringify({ offers }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "accept_offer") {
      const { offer_id } = body;
      if (!offer_id) {
        return new Response(JSON.stringify({ error: "offer_id requis" }), { status: 400, headers: corsHeaders });
      }
      const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/accept_job_offer`, {
        method: "POST", headers: adminHeaders, body: JSON.stringify({ p_offer_id: offer_id, p_worker_id: workerId }),
      });
      const result = await rpcRes.json().catch(() => ({ ok: false, error: "Erreur inattendue" }));
      if (result?.ok) {
        await logAudit("work_order.worker_accepted_offer", "work_orders", result.work_order_id, { offer_id });
      }
      return new Response(JSON.stringify(result), { status: result?.ok ? 200 : 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "decline_offer") {
      const { offer_id } = body;
      const offerRes = await fetch(`${supabaseUrl}/rest/v1/job_offers?id=eq.${offer_id}&worker_id=eq.${workerId}&select=id,status`, { headers: adminHeaders });
      const [offer] = await offerRes.json().catch(() => [null]);
      if (!offer) {
        return new Response(JSON.stringify({ error: "Offre introuvable" }), { status: 404, headers: corsHeaders });
      }
      if (offer.status !== "sent") {
        return new Response(JSON.stringify({ error: "Cette offre n'est plus active" }), { status: 409, headers: corsHeaders });
      }
      const declineRes = await fetch(`${supabaseUrl}/rest/v1/job_offers?id=eq.${offer_id}`, { method: "PATCH", headers: adminHeaders, body: JSON.stringify({ status: "declined", responded_at: new Date().toISOString() }) });
      if (!declineRes.ok) {
        return new Response(JSON.stringify({ error: "Impossible d'enregistrer le refus" }), { status: 500, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    if (action === "list_my_jobs") {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/work_orders?worker_id=eq.${workerId}&select=${CHAMPS_JOB}&order=created_at.desc`,
        { headers: adminHeaders },
      );
      const jobs = await res.json().catch(() => []);
      return new Response(JSON.stringify({ jobs }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const lire = (chemin: string) => fetch(`${supabaseUrl}/rest/v1/${chemin}`, { headers: adminHeaders }).then((r) => r.ok ? r.json() : []);
    const monJob = async (id: string) => /^[0-9a-f-]{36}$/i.test(String(id)) ? (await lire(`work_orders?id=eq.${id}&worker_id=eq.${workerId}&select=${CHAMPS_JOB},worker_response_token`))[0] ?? null : null;

    // Tableau de bord : les chiffres du travailleur en un appel.
    if (action === "get_dashboard") {
      const [offres, jobs, notes] = await Promise.all([
        lire(`job_offers?worker_id=eq.${workerId}&status=eq.sent&select=id`),
        lire(`work_orders?worker_id=eq.${workerId}&select=id,description,status,worker_response,appointment_at,worker_pay,worker_reported_done_at,worker_paid_at,worker_paid_amount,units(unit_number,buildings(address))&order=appointment_at.asc.nullslast`),
        lire(`worker_ratings?worker_id=eq.${workerId}&select=stars`),
      ]);
      const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const actifs = jobs.filter((j: any) => !["completed", "cancelled"].includes(j.status));
      return json({
        offres_en_attente: offres.length + jobs.filter((j: any) => ["pending", "info_requested", "proposed_other_time"].includes(j.worker_response) && !["completed", "cancelled"].includes(j.status)).length,
        en_cours: actifs.filter((j: any) => j.worker_response === "accepted").length,
        a_payer: jobs.filter((j: any) => j.worker_reported_done_at && !j.worker_paid_at).reduce((t: number, j: any) => t + Number(j.worker_pay || 0), 0),
        gagne_ce_mois: jobs.filter((j: any) => j.worker_paid_at && j.worker_paid_at >= debutMois).reduce((t: number, j: any) => t + Number(j.worker_paid_amount ?? j.worker_pay ?? 0), 0),
        note: notes.length ? Math.round(10 * notes.reduce((t: number, n: any) => t + n.stars, 0) / notes.length) / 10 : null,
        nb_avis: notes.length,
        prochains: actifs.filter((j: any) => j.appointment_at && j.appointment_at >= new Date().toISOString()).slice(0, 5),
      });
    }

    // Fiche d'un travail : détails, pièces jointes (liens signés 1 h), fil.
    if (action === "get_job") {
      const wo = await monJob(body.work_order_id);
      if (!wo) return json({ error: "Travail introuvable" }, 404);
      const chemins: string[] = [...(wo.service_requests?.photo_urls || []).map((p: string) => ["locataire", p]), ...(wo.photo_before_urls || []).map((p: string) => ["avant", p]), ...(wo.photo_after_urls || []).map((p: string) => ["apres", p])].slice(0, 25) as any;
      const pieces = (await Promise.all((chemins as any).map(async ([groupe, chemin]: [string, string]) => {
        const r = await fetch(`${supabaseUrl}/storage/v1/object/sign/service-request-photos/${chemin}`, { method: "POST", headers: adminHeaders, body: JSON.stringify({ expiresIn: 3600 }) }).catch(() => null);
        const d = r?.ok ? await r.json().catch(() => null) : null;
        return d?.signedURL ? { groupe, url: `${supabaseUrl}/storage/v1${d.signedURL}`, video: /\.(mp4|mov|m4v|webm|3gp)$/i.test(chemin) } : null;
      }))).filter(Boolean);
      const [messages, avis] = await Promise.all([
        lire(`worker_messages?worker_id=eq.${workerId}&work_order_id=eq.${wo.id}&select=id,direction,origine,sujet,corps,created_at&order=created_at.asc&limit=300`),
        lire(`worker_ratings?work_order_id=eq.${wo.id}&worker_id=eq.${workerId}&select=stars,comment,rated_by_type,created_at`),
      ]);
      delete (wo as any).worker_response_token;
      // Question ou heure envoyée avant que le fil existe : gardée sur le travail.
      if (wo.worker_response_note && !messages.some((m: any) => m.origine === "lien" || m.origine === "portail")) {
        messages.push({ id: "note", direction: "entrant", origine: "lien", sujet: wo.worker_response === "proposed_other_time" ? "Autre heure proposée" : "Ta question", corps: wo.worker_response_note, created_at: wo.worker_response_at || wo.created_at });
        messages.sort((a: any, b: any) => String(a.created_at).localeCompare(String(b.created_at)));
      }
      return json({ job: wo, pieces, messages, avis });
    }

    // Réponse à un travail assigné directement (même logique que le lien
    // envoyé par courriel : on appelle handle-worker-response avec le jeton).
    if (action === "respond_job") {
      const wo = await monJob(body.work_order_id);
      if (!wo) return json({ error: "Travail introuvable" }, 404);
      if (!["accept", "decline", "propose_time", "request_info"].includes(body.reponse)) return json({ error: "Réponse inconnue" }, 400);
      const r = await fetch(`${supabaseUrl}/functions/v1/handle-worker-response`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey ?? "" },
        body: JSON.stringify({ work_order_id: wo.id, token: wo.worker_response_token, action: body.reponse, message: body.message || undefined, proposed_at: body.proposed_at || undefined }),
      });
      const d = await r.json().catch(() => ({}));
      return json(d, r.status);
    }

    // Message au sujet d'un travail précis, ou message général (sans travail).
    if (action === "send_message") {
      const t = String(body.texte ?? "").trim();
      if (!t || t.length > 10000) return json({ error: "Message vide ou trop long" }, 400);
      let wo = null;
      if (body.work_order_id) { wo = await monJob(body.work_order_id); if (!wo) return json({ error: "Travail introuvable" }, 404); }
      const ins = await fetch(`${supabaseUrl}/rest/v1/worker_messages`, {
        method: "POST", headers: { ...adminHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({ worker_id: workerId, work_order_id: wo?.id ?? null, direction: "entrant", origine: "portail", sujet: wo ? `Au sujet de : ${String(wo.description).slice(0, 80)}` : "Message", corps: t }),
      });
      if (!ins.ok) return json({ error: "Message non enregistré" }, 502);
      await notifyAdmins(
        `${worker.name || "Un travailleur"} vous écrit${wo ? " — " + (wo.units?.buildings?.address || "") : ""}`,
        `${wo ? `Travail : ${wo.description}\n` : ""}Message : ${t}\n\nRéponds depuis le portail admin (fiche du travailleur ou Travaux en cours → Échanges).`,
      ).catch(() => null);
      return json({ ok: true });
    }

    if (action === "list_messages") {
      return json({ messages: await lire(`worker_messages?worker_id=eq.${workerId}&work_order_id=is.null&select=id,direction,origine,sujet,corps,created_at&order=created_at.asc&limit=300`) });
    }

    if (action === "list_payments") {
      return json({ paiements: await lire(`work_orders?worker_id=eq.${workerId}&worker_reported_done_at=not.is.null&select=id,description,worker_pay,worker_reported_done_at,worker_paid_at,worker_paid_amount,worker_paid_note,status,units(unit_number,buildings(address))&order=worker_reported_done_at.desc`), interac: worker.payout_email ?? null });
    }

    if (action === "list_ratings") {
      return json({ avis: await lire(`worker_ratings?worker_id=eq.${workerId}&select=stars,comment,rated_by_type,created_at,work_orders(description,units(unit_number,buildings(address)))&order=created_at.desc`) });
    }

    if (action === "submit_completion") {
      const { work_order_id, message, before_photos, after_photos } = body;
      const woRes = await fetch(`${supabaseUrl}/rest/v1/work_orders?id=eq.${work_order_id}&worker_id=eq.${workerId}&select=id,worker_reported_done_at,description,units(unit_number,buildings(address))`, { headers: adminHeaders });
      const [wo] = await woRes.json().catch(() => [null]);
      if (!wo) {
        return new Response(JSON.stringify({ error: "Ce travail ne t'est pas assigné" }), { status: 403, headers: corsHeaders });
      }
      if (wo.worker_reported_done_at) {
        return new Response(JSON.stringify({ error: "La fin des travaux a déjà été signalée pour ce travail" }), { status: 409, headers: corsHeaders });
      }

      const uploadPhotos = async (photos: Array<{ base64: string; filename?: string; content_type?: string }> | undefined, subfolder: string) => {
        const paths: string[] = [];
        for (const p of (Array.isArray(photos) ? photos : []).slice(0, 5)) {
          if (!p?.base64) continue;
          const path = `work-orders/${work_order_id}/${subfolder}/${Date.now()}-${(p.filename || "photo.jpg").replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
          const bytes = Uint8Array.from(atob(p.base64), (c) => c.charCodeAt(0));
          const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/service-request-photos/${path}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey ?? "", "Content-Type": p.content_type || "application/octet-stream" },
            body: bytes,
          });
          if (uploadRes.ok) paths.push(path);
        }
        return paths;
      };

      const beforeUrls = await uploadPhotos(before_photos, "avant");
      const afterUrls = await uploadPhotos(after_photos, "apres");
      if (!beforeUrls.length && !afterUrls.length) {
        return new Response(JSON.stringify({ error: "Au moins une photo est requise" }), { status: 400, headers: corsHeaders });
      }

      await fetch(`${supabaseUrl}/rest/v1/work_orders?id=eq.${work_order_id}`, {
        method: "PATCH", headers: adminHeaders,
        body: JSON.stringify({ photo_before_urls: beforeUrls, photo_after_urls: afterUrls, worker_reported_done_at: new Date().toISOString(), worker_completion_note: message || null }),
      });

      await logAudit("work_order.worker_reported_done", "work_orders", work_order_id, { photos_before: beforeUrls.length, photos_after: afterUrls.length });
      await notifyAdmins(
        `Travail terminé (signalé par le travailleur) — ${wo.units?.buildings?.address ?? ""}`,
        `${worker.name} a signalé avoir terminé : ${wo.description}\n${message ? "Note : " + message + "\n" : ""}Photos avant : ${beforeUrls.length}, après : ${afterUrls.length}\n\nEntre le coût final dans le portail admin pour clore le dossier et aviser le locataire.`,
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    if (action === "get_my_stats") {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/worker_verification_status?id=eq.${workerId}&select=rating,completed_jobs_count,declined_jobs_count,jobs_offered_count,jobs_accepted_count,jobs_cancelled_count,verification_status`,
        { headers: adminHeaders },
      );
      const [stats] = await res.json().catch(() => [null]);
      return new Response(JSON.stringify({ stats }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "action inconnue" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
