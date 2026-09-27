// Fil d'échange d'une demande de service (table service_request_messages).
// Les courriels au locataire portent une adresse de réponse propre à la
// demande : sa réponse revient dans le fil via resend-inbound.

export function adresseReponseDemande(demandeId: string): string | undefined {
  const domaine = Deno.env.get("REPONSES_DOMAINE");
  return domaine ? `demande-${demandeId}@${domaine}` : undefined;
}

export async function ajouterMessageDemande(opts: {
  demandeId: string;
  sender: "tenant" | "team" | "system";
  corps: string;
  via?: "portail" | "courriel" | "systeme";
  piecesJointes?: string[];
}): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const r = await fetch(`${url}/rest/v1/service_request_messages`, {
    method: "POST",
    headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      service_request_id: opts.demandeId, sender: opts.sender, body: opts.corps.slice(0, 10000),
      via: opts.via ?? (opts.sender === "system" ? "systeme" : "portail"), attachments: opts.piecesJointes ?? [],
    }),
  }).catch((e) => { console.error("fil demande", e); return null; });
  return !!r?.ok;
}

/**
 * Courriel au locataire au sujet d'une demande : envoyé avec une adresse de
 * réponse propre à la demande, puis copié dans le fil (onglet Échanges du
 * portail), pour que le locataire et l'équipe voient tout ce qui a été
 * envoyé au sujet du dossier. Rend true si le courriel est parti.
 */
export async function courrielDemande(opts: {
  demandeId: string | null | undefined;
  to: string;
  sujet: string;
  texte: string;
  sender?: "team" | "system";
  bouton?: { libelle: string; url: string };
}): Promise<boolean> {
  const { avecHtml } = await import("./courriel.ts");
  const { EXPEDITEUR } = await import("./branding.ts");
  const repondre = opts.demandeId ? adresseReponseDemande(opts.demandeId) : undefined;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify(avecHtml({
      from: EXPEDITEUR, to: [opts.to], subject: opts.sujet, text: opts.texte,
      ...(repondre ? { reply_to: repondre } : {}),
    }, opts.bouton ? { bouton: opts.bouton } : undefined)),
  }).catch((e) => { console.error("courrielDemande", e); return null; });
  const parti = !!res?.ok;
  if (parti && opts.demandeId) {
    const url = Deno.env.get("SUPABASE_URL");
    const cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    await fetch(`${url}/rest/v1/service_request_messages`, {
      method: "POST",
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ service_request_id: opts.demandeId, sender: opts.sender ?? "system", via: "courriel", sujet: opts.sujet, body: opts.texte.slice(0, 10000) }),
    }).catch((e) => console.error("courrielDemande fil", e));
  }
  return parti;
}
