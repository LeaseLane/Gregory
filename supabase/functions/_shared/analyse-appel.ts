// Analyse d'un appel avec un prospect propriétaire (crm-api add_call et téléphonie TT).
// L'analyse n'écrit JAMAIS la fiche : intérêt, prochain suivi et prochaine action deviennent une PROPOSITION (T1).
import { IA_CLE, IA_MESSAGES_URL, MODELE_RAPIDE, avecContexte } from "./ia.ts";

export type Analyse = {
  summary?: string; key_quotes?: string[]; objections?: string | null; commitment?: string | null; next_step?: string | null;
  interest_level?: string | null; confidence?: number | null; next_followup_days?: number | null;
};
const NIVEAUX = ["chaud", "tiede", "froid"];

export async function analyserAppel(transcript: string): Promise<Analyse> {
  const prompt = `Tu es l'assistant CRM de "Lease Lane". Voici la transcription/notes d'un appel avec un prospect propriétaire. Analyse-la en détail.

Transcription: "${transcript}"

Réponds UNIQUEMENT avec un objet JSON valide (rien avant, rien après):
{
  "summary": "résumé de l'appel en 1-2 phrases en français",
  "key_quotes": ["jusqu'à 2 citations exactes et importantes tirées de la transcription"],
  "objections": "les objections ou réticences exprimées par le prospect, ou null si aucune",
  "commitment": "un engagement concret pris durant l'appel (ex: 'va envoyer les états financiers d'ici vendredi'), ou null si aucun",
  "next_step": "la prochaine étape concrète à faire avec ce prospect, en une phrase",
  "interest_level": "chaud ou tiede ou froid",
  "confidence": un nombre entre 0 et 100 représentant ta confiance dans cette analyse — baisse-la si la transcription est courte, vague ou ambiguë,
  "next_followup_days": un nombre entier de jours avant le prochain suivi recommandé
}`;
  const aiRes = await fetch(IA_MESSAGES_URL, {
    method: "POST",
    headers: { "x-api-key": IA_CLE, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify(avecContexte({ model: MODELE_RAPIDE, max_tokens: 500, messages: [{ role: "user", content: prompt }] })),
  });
  const aiData = await aiRes.json().catch(() => ({}));
  const raw = String(aiData.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim();
  let p: Analyse = {};
  try { p = JSON.parse(raw); } catch { p = {}; }
  // L'intérêt est affiché tel quel : liste blanche stricte, jamais le texte libre de l'IA.
  p.interest_level = NIVEAUX.includes(String(p.interest_level)) ? p.interest_level : null;
  return p;
}

/** Champs que l'analyse propose de changer sur la fiche (vide = rien à proposer). */
export function changementsProposes(a: Analyse, prospect: { interest_level?: string | null; next_followup_date?: string | null }) {
  const suivi = a.next_followup_days ? new Date(Date.now() + a.next_followup_days * 864e5).toISOString().slice(0, 10) : prospect.next_followup_date;
  const apres: Record<string, unknown> = {};
  if (a.interest_level && a.interest_level !== prospect.interest_level) apres.interest_level = a.interest_level;
  if (suivi && suivi !== prospect.next_followup_date) apres.next_followup_date = suivi;
  if (typeof a.next_step === "string" && a.next_step.trim()) apres.next_action = a.next_step.trim().slice(0, 200);
  return { apres, suivi };
}

/** Crée la proposition « analyse d'appel » (lanceur_proposer, clé de service). Retourne son id, ou null. */
export async function proposerSuivi(o: {
  supabaseUrl: string; headers: Record<string, string>; prospectId: string; apres: Record<string, unknown>; analyse: Analyse;
  transcript: string; sourceRef: string; cle: string;
}): Promise<string | null> {
  if (!Object.keys(o.apres).length) return null;
  const citation = Array.isArray(o.analyse.key_quotes) && o.analyse.key_quotes[0] ? String(o.analyse.key_quotes[0]) : o.transcript.slice(0, 300);
  const pr = await fetch(`${o.supabaseUrl}/rest/v1/rpc/lanceur_proposer`, {
    method: "POST", headers: o.headers,
    body: JSON.stringify({ p: {
      agent: "analyse_appel", operation: "update-prospect-followup", target_id: o.prospectId, after: o.apres,
      reason: String(o.analyse.summary || "Analyse de l'appel : intérêt et suivi mis à jour.").slice(0, 1000).padEnd(10, "."),
      source_type: "appel", source_ref: o.sourceRef, source_excerpt: citation.slice(0, 2000),
      confidence: typeof o.analyse.confidence === "number" ? Math.max(0, Math.min(100, o.analyse.confidence)) : null,
      idempotency_key: o.cle, channel: "api",
    } }),
  });
  if (!pr.ok) { console.error("Proposition d'analyse d'appel refusée", pr.status, await pr.text().catch(() => "")); return null; }
  return (await pr.json().catch(() => ({})))?.id ?? null;
}
