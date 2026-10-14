// TT · Téléphonie (Twilio Voice) : une seule fonction, routée par ?r=.
//
// Routes de Twilio (signature X-Twilio-Signature vérifiée sur l'URL publique exacte) :
//   entrant          appel reçu sur le numéro Lease Lane → menu (locataire 1, propriétaire 2, autre 3, urgence 9)
//   menu             choix du menu → urgence : personne de garde (24/7); sinon ligne principale aux heures, sinon messagerie
//   pont             appel sortant : la personne de l'équipe a répondu sur son cellulaire → on compose le numéro cible
//   avis             joué à la personne appelée AVANT la mise en relation (avis d'enregistrement) → consent_announced
//   statut           fin d'appel (durée, statut)
//   enregistrement   enregistrement prêt → transcription → message vocal dans l'Inbox, ou analyse → proposition (T1)
// Routes de l'équipe (jeton de la personne; Lanceur passe par /api/telephonie) :
//   demarrer         appel sortant : réel en production une fois TELEPHONIE_ACTIVE=true (refusé avant), SIMULÉ ailleurs
//   simuler_entrant  hors production seulement : appel entrant fictif (urgence ou message vocal)
// Route interne (cron) : purger — efface chez Twilio les enregistrements échus (90 jours).
//
// Invariants (spec TT) : aucun enregistrement sans avis (contrainte en base, et l'enregistrement est effacé chez
// Twilio si la base le refuse); une ligne par CallSid; l'analyse ne fait que proposer.
import { signatureTwilioValide } from "../_shared/envois.ts";
import { estAppelInterneVerifie } from "../_shared/appel-interne.ts";
import { analyserAppel, changementsProposes, proposerSuivi } from "../_shared/analyse-appel.ts";
import { decrireMedias, versBase64 } from "../_shared/ia.ts";
import { ouvert } from "../_shared/telephonie.ts";

const url = Deno.env.get("SUPABASE_URL") ?? "";
const cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "", JETON = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "", NUMERO = Deno.env.get("TWILIO_VOICE_NUMBER") ?? Deno.env.get("TWILIO_FROM_NUMBER") ?? "";
const PROD = url.includes("kdmwfbcziokygfcmjxeq");
const REEL = PROD && Deno.env.get("TELEPHONIE_ACTIVE") === "true";   // ponytail: activée explicitement, même en production
const ADMIN = { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" };
const BASE = `${url}/functions/v1/telephonie`;
const VOIX = 'language="fr-CA" voice="Polly.Gabrielle"';

export const AVIS = "Bonjour, ici Lease Lane. Cet appel peut être enregistré et transcrit pour assurer le suivi de votre dossier.";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const twiml = (corps: string) => new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${corps}</Response>`, { headers: { "Content-Type": "text/xml" } });
const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { "Content-Type": "application/json" } });

async function rpc(nom: string, args: unknown, jeton?: string) {
  const r = await fetch(`${url}/rest/v1/rpc/${nom}`, { method: "POST", headers: jeton ? { apikey: anon, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" } : ADMIN, body: JSON.stringify(args) });
  const d = await r.json().catch(() => null);
  if (!r.ok) throw Object.assign(new Error(d?.message ?? `${nom} : ${r.status}`), { status: r.status, code: d?.code });
  return d;
}
const enregistrer = (p: Record<string, unknown>) => rpc("tel_enregistrer", { p });

// Message vocal (ou appel sortant) enregistré → transcription → Inbox ou proposition.
async function traiterEnregistrement(appel: Record<string, any>, audio: Uint8Array | null, transcriptFourni?: string) {
  let transcript = transcriptFourni ?? "";
  if (!transcript && audio) {
    const r = await decrireMedias([{ type: "text", text: "Transcris mot à mot cet enregistrement téléphonique en français québécois. Réponds seulement avec la transcription." },
      { type: "audio", data: versBase64(audio), mime_type: "audio/mpeg" }]);
    transcript = r.ok ? r.texte : `(transcription indisponible : ${r.erreur ?? "erreur"})`;
  }
  const maj: Record<string, unknown> = { provider_call_id: appel.provider_call_id, transcript };
  if (appel.voicemail) {
    maj.conversation_id = await rpc("inbox_recevoir", { p_channel: "voice", p_address: appel.from_e164, p_body: `Message vocal : ${transcript}`, p_provider_id: `voix:${appel.provider_call_id}` });
  } else if (appel.direction === "out" && appel.prospect_id && transcript && !transcript.startsWith("(transcription")) {
    const p = (await (await fetch(`${url}/rest/v1/prospects?id=eq.${appel.prospect_id}&select=id,interest_level,next_followup_date`, { headers: ADMIN })).json())?.[0];
    if (p) {
      const analyse = await analyserAppel(transcript);
      const { apres } = changementsProposes(analyse, p);
      maj.analysis = analyse;
      maj.proposal_id = await proposerSuivi({ supabaseUrl: url, headers: ADMIN, prospectId: p.id, apres, analyse, transcript,
        sourceRef: "Appel du " + new Date().toLocaleDateString("fr-CA", { timeZone: "America/Toronto" }), cle: `appel-tel:${appel.provider_call_id}` });
    }
  }
  return await enregistrer(maj);
}

async function twilio(chemin: string, init: RequestInit = {}) {
  return fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}${chemin}`, { ...init, headers: { Authorization: `Basic ${btoa(`${SID}:${JETON}`)}`, ...(init.headers ?? {}) } });
}

Deno.serve(async (req) => {
  const u = new URL(req.url), r = u.searchParams.get("r") ?? "";

  // ── Routes de l'équipe ──
  if (r === "demarrer" || r === "simuler_entrant") {
    const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
    const b = await req.json().catch(() => ({}));
    try {
      if (r === "simuler_entrant") {
        if (PROD) return json({ error: "Simulation interdite en production." }, 403);
        await rpc("lanceur_appels", { p_jours: 1 }, jeton);    // vérifie que la personne a accès aux appels
        const reg = await rpc("tel_reglages", {});
        const id = `SIM-IN-${crypto.randomUUID()}`, de = String(b.from ?? "+14185550164");
        const qui = await rpc("tel_identifier", { p_tel: de });
        let appel = await enregistrer({ provider_call_id: id, direction: "in", from_e164: de, to_e164: NUMERO || "+14185550000", simulated: true,
          tenant_id: qui?.tenant?.id, prospect_id: qui?.prospect?.id, status: "in_progress", menu_choice: b.choix === "urgence" ? "urgence" : "locataire" });
        if (b.choix === "urgence") {
          const garde = reg?.garde?.telephone ?? null;
          appel = await enregistrer({ provider_call_id: id, forwarded_to: garde ?? "messagerie", status: garde ? "completed" : "voicemail", voicemail: !garde,
            consent_announced: !garde, duration_s: 95, ended_at: new Date().toISOString() });
          if (!garde) appel = await traiterEnregistrement(appel, null, String(b.message ?? "Urgence : il y a de l'eau qui coule du plafond de la salle de bain."));
          return json({ appel, garde });
        }
        appel = await enregistrer({ provider_call_id: id, status: "voicemail", voicemail: true, consent_announced: true, recording_ref: `SIM-REC-${id}`, duration_s: 42, ended_at: new Date().toISOString() });
        appel = await traiterEnregistrement(appel, null, String(b.message ?? "Bonjour, c'est au sujet du chauffage, il ne fonctionne plus depuis hier soir. Merci de me rappeler."));
        return json({ appel });
      }

      const prep = await rpc("lanceur_preparer_appel", { p: b }, jeton);
      if (!REEL && PROD) return json({ error: "La téléphonie n’est pas encore activée en production." }, 422);
      if (!REEL) {
        const id = `SIM-OUT-${crypto.randomUUID()}`;
        let appel = await enregistrer({ provider_call_id: id, direction: "out", from_e164: NUMERO || "+14185550000", to_e164: prep.vers, caller_user_id: prep.user_id,
          cold_caller_id: prep.cold_caller_id, prospect_id: prep.prospect_id, tenant_id: prep.tenant_id, simulated: true, status: "in_progress" });
        appel = await enregistrer({ provider_call_id: id, consent_announced: true, recording_ref: `SIM-REC-${id}`, status: "completed", duration_s: 184, ended_at: new Date().toISOString() });
        appel = await traiterEnregistrement(appel, null, String(b.transcript_simule ?? "Oui, ça m'intéresse. Rappelez-moi le 20 pour qu'on regarde l'offre ensemble."));
        return json({ appel, simule: true });
      }
      if (!prep.cellulaire) return json({ error: "Ajoutez votre cellulaire dans la téléphonie : Lease Lane vous appelle d'abord, puis compose le numéro." }, 422);
      // Réel : Lease Lane appelle d'abord le cellulaire de la personne; à sa réponse, « pont » compose la cible.
      const id = crypto.randomUUID();
      const res = await twilio("/Calls.json", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({
        To: prep.cellulaire, From: NUMERO, Url: `${BASE}?r=pont&ref=${id}`, StatusCallback: `${BASE}?r=statut&ref=${id}`, StatusCallbackEvent: "completed" }).toString() });
      const tw = await res.json().catch(() => ({}));
      if (!res.ok) return json({ error: `Twilio : ${tw.message ?? res.status}` }, 502);
      const appel = await enregistrer({ provider_call_id: tw.sid, direction: "out", from_e164: NUMERO, to_e164: prep.vers, caller_user_id: prep.user_id,
        cold_caller_id: prep.cold_caller_id, prospect_id: prep.prospect_id, tenant_id: prep.tenant_id, status: "ringing" });
      return json({ appel });
    } catch (e) {
      const err = e as Error & { status?: number };
      return json({ error: err.message }, err.status && err.status < 500 ? err.status : 500);
    }
  }

  // ── Route interne : purge des enregistrements échus ──
  if (r === "purger") {
    if (!estAppelInterneVerifie(req)) return json({ error: "non autorisé" }, 401);
    const refs: string[] = await rpc("tel_purger", {});
    let effaces = 0;
    for (const ref of refs ?? []) if (REEL && !ref.startsWith("SIM-") && (await twilio(`/Recordings/${ref}.json`, { method: "DELETE" })).ok) effaces++;
    return json({ purges: refs?.length ?? 0, effaces_chez_twilio: effaces });
  }

  // ── Routes de Twilio : signature obligatoire ──
  if (req.method !== "POST") return new Response("", { status: 405 });
  const params = Object.fromEntries(new URLSearchParams(await req.text()));
  if (!await signatureTwilioValide(JETON, `${BASE}${u.search}`, params, req.headers.get("X-Twilio-Signature") ?? "")) return new Response("signature invalide", { status: 401 });
  const sid = params.CallSid;
  const reg = await rpc("tel_reglages", {});

  if (r === "entrant") {
    const qui = await rpc("tel_identifier", { p_tel: params.From });
    await enregistrer({ provider_call_id: sid, direction: "in", from_e164: params.From, to_e164: params.To, tenant_id: qui?.tenant?.id, prospect_id: qui?.prospect?.id, status: "in_progress" });
    const heures = ouvert(reg.heures);
    const menu = heures ? "Locataire, faites le 1. Propriétaire, faites le 2. Pour toute autre demande, faites le 3. Pour une urgence, faites le 9."
      : "Nos bureaux sont fermés. Pour une urgence dans votre logement, faites le 9. Sinon, restez en ligne pour laisser un message.";
    return twiml(`<Gather numDigits="1" timeout="6" action="${esc(`${BASE}?r=menu`)}"><Say ${VOIX}>Bonjour, vous avez joint Lease Lane. ${menu}</Say></Gather>`
      + `<Redirect>${esc(`${BASE}?r=menu&defaut=1`)}</Redirect>`);
  }

  if (r === "menu") {
    const choix = ({ "1": "locataire", "2": "proprietaire", "3": "autre", "9": "urgence" } as Record<string, string>)[params.Digits ?? ""] ?? "autre";
    const garde = reg?.garde?.telephone, ligne = reg?.ligne_principale;
    await enregistrer({ provider_call_id: sid, menu_choice: choix });
    if (choix === "urgence" && garde) {
      await enregistrer({ provider_call_id: sid, forwarded_to: garde });
      return twiml(`<Say ${VOIX}>Nous vous transférons à la personne de garde.</Say><Dial timeout="25" action="${esc(`${BASE}?r=messagerie`)}">${esc(garde)}</Dial>`);
    }
    if (choix !== "urgence" && ligne && ouvert(reg.heures)) {
      return twiml(`<Dial timeout="20" action="${esc(`${BASE}?r=messagerie`)}">${esc(ligne)}</Dial>`);
    }
    return twiml(`<Redirect>${esc(`${BASE}?r=messagerie&force=1`)}</Redirect>`);
  }

  if (r === "messagerie") {
    // Après un <Dial> : si la personne a répondu, on raccroche; sinon, message vocal (avis joué avant l'enregistrement).
    if (params.DialCallStatus === "completed" && !u.searchParams.get("force")) return twiml("<Hangup/>");
    await enregistrer({ provider_call_id: sid, consent_announced: true, voicemail: true, status: "voicemail" });
    return twiml(`<Say ${VOIX}>Laissez votre message après le signal. Il sera enregistré et transcrit pour notre équipe.</Say>`
      + `<Record maxLength="120" playBeep="true" recordingStatusCallback="${esc(`${BASE}?r=enregistrement`)}" recordingStatusCallbackEvent="completed"/>`);
  }

  if (r === "pont") {
    const appel = await enregistrer({ provider_call_id: sid, status: "in_progress" });
    return twiml(`<Say ${VOIX}>Connexion en cours.</Say><Dial callerId="${esc(NUMERO)}" record="record-from-answer" recordingStatusCallback="${esc(`${BASE}?r=enregistrement&parent=${sid}`)}">`
      + `<Number url="${esc(`${BASE}?r=avis&parent=${sid}`)}">${esc(appel.to_e164)}</Number></Dial>`);
  }

  if (r === "avis") {
    await enregistrer({ provider_call_id: u.searchParams.get("parent") ?? sid, consent_announced: true });
    return twiml(`<Say ${VOIX}>${AVIS}</Say>`);
  }

  if (r === "statut") {
    await enregistrer({ provider_call_id: sid, status: ({ completed: "completed", "no-answer": "no_answer", busy: "busy", failed: "failed", canceled: "failed" } as Record<string, string>)[params.CallStatus] ?? undefined,
      duration_s: params.CallDuration ? Number(params.CallDuration) : undefined, ended_at: new Date().toISOString() });
    return twiml("");
  }

  if (r === "enregistrement") {
    const parent = u.searchParams.get("parent") ?? sid;
    let appel;
    try {
      appel = await enregistrer({ provider_call_id: parent, recording_ref: params.RecordingSid });
    } catch {
      // Base refuse : aucun avis joué. L'enregistrement est effacé chez Twilio, rien n'est gardé.
      await twilio(`/Recordings/${params.RecordingSid}.json`, { method: "DELETE" });
      return twiml("");
    }
    const audio = await twilio(`/Recordings/${params.RecordingSid}.mp3`).then((x) => x.ok ? x.arrayBuffer() : null).catch(() => null);
    await traiterEnregistrement(appel, audio ? new Uint8Array(audio) : null);
    return twiml("");
  }

  return new Response("route inconnue", { status: 404 });
});
