// DocuSeal (code ouvert, hébergé sur le Coolify de TWIM) : remplace eZsign pour les baux, mandats et avis (2026-11-09).
// Aucun courriel de DocuSeal (send_email: false) : Lease Lane envoie LOC-11 avec un lien vers sa propre page (/signer/<slug>),
// où le formulaire DocuSeal est intégré à ses couleurs. Les statuts se relisent toujours dans l'API de DocuSeal (jamais dans un webhook).
export const DOCUSEAL_URL = (Deno.env.get("DOCUSEAL_URL") ?? "").replace(/\/$/, "");
const CLE = Deno.env.get("DOCUSEAL_API_KEY") ?? "";
export const docusealActif = () => !!(DOCUSEAL_URL && CLE);

export async function docuseal<T>(chemin: string, corps?: unknown): Promise<T> {
  const r = await fetch(`${DOCUSEAL_URL}/api${chemin}`, {
    method: corps === undefined ? "GET" : "POST",
    headers: { "X-Auth-Token": CLE, "Content-Type": "application/json" },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`DocuSeal ${r.status} : ${d?.error ?? d?.message ?? "réponse illisible"}`);
  return d as T;
}

type Soumetteur = { id: number; submission_id: number; email: string; status: string; external_id: string | null; opened_at: string | null; completed_at: string | null; declined_at: string | null };

// Relit une soumission et rejoue ses étapes dans service_evenement_signature (idempotent : un event_id par signataire et par étape).
export async function synchroniserSoumission(submissionId: string | number, evenement: (p: Record<string, unknown>) => Promise<unknown>) {
  const s = await docuseal<{ id: number; submitters: Soumetteur[] }>(`/submissions/${submissionId}`);
  const faits: string[] = [];
  for (const x of s.submitters ?? []) {
    const ord = Number(String(x.external_id ?? "").split(":")[1]) || undefined;
    const types = [x.opened_at || x.completed_at || x.declined_at ? "opened" : null, x.status === "completed" ? "signed" : null, x.status === "declined" ? "declined" : null].filter(Boolean) as string[];
    for (const type of types) {
      await evenement({ folder_id: String(s.id), event_id: `docuseal:${x.id}:${type}`, ord, email: x.email, type });
      faits.push(`${x.email}:${type}`);
    }
  }
  return faits;
}
