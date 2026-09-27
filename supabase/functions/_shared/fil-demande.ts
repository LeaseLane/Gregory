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
