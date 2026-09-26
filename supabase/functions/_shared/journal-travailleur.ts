// Envoie un courriel à un travailleur ET le garde dans son fil de
// messages (worker_messages), pour que l'équipe voie depuis la fiche ce
// qui lui a été envoyé et quand. Le journal ne doit jamais bloquer
// l'envoi : une erreur d'écriture est avalée, le courriel part quand même.
import { avecHtml } from "./courriel.ts";
import { EXPEDITEUR } from "./branding.ts";

export async function courrielTravailleur(opts: {
  workerId: string;
  to: string;
  sujet: string;
  texte: string;
  origine: "manuel" | "automatique";
  workOrderId?: string | null;
  auteurId?: string | null;
  habillage?: Parameters<typeof avecHtml>[1];
}): Promise<{ ok: boolean; erreur?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const cleService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return { ok: false, erreur: "RESEND_API_KEY absente" };

  // Adresse de réponse propre au travailleur : sa réponse revient dans
  // son fil (fonction resend-inbound). Posée seulement une fois le
  // domaine de réception configuré, sinon les réponses rebondiraient.
  const domaine = Deno.env.get("REPONSES_DOMAINE");
  const reponse = domaine ? { reply_to: `travailleur-${opts.workerId}@${domaine}` } : {};

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(avecHtml({ from: EXPEDITEUR, to: [opts.to], subject: opts.sujet, text: opts.texte, ...reponse }, opts.habillage)),
  }).catch(() => null);
  const data = res ? await res.json().catch(() => ({})) : {};
  if (!res?.ok) return { ok: false, erreur: data?.message ?? `Resend ${res?.status ?? "injoignable"}` };

  await fetch(`${supabaseUrl}/rest/v1/worker_messages`, {
    method: "POST",
    headers: { apikey: cleService, Authorization: `Bearer ${cleService}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      worker_id: opts.workerId, direction: "sortant", origine: opts.origine,
      sujet: opts.sujet, corps: opts.texte, work_order_id: opts.workOrderId ?? null,
      resend_id: data?.id ?? null, author_user_id: opts.auteurId ?? null,
    }),
  }).catch(() => null);
  return { ok: true };
}
