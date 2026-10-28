import { corsHeadersFor } from "../_shared/auth.ts";
import { fichierCpa005 } from "../_shared/cpa005.ts";
// prelevements : fichier BMO (CPA 005, enregistrements « D », code 401 loyer résidentiel) d'un lot de prélèvements.
//   fichier { lot } : droit et 2FA vérifiés en base avec le jeton de la personne (lanceur_prelevement_fichier), numéro de fichier stable par lot.

const url = Deno.env.get("SUPABASE_URL") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const { action, lot } = await req.json().catch(() => ({}));
  if (action !== "fichier") return json({ error: "Action inconnue." }, 400);
  const r = await fetch(`${url}/rest/v1/rpc/lanceur_prelevement_fichier`, {
    method: "POST", body: JSON.stringify({ p_lot: lot }),
    headers: { apikey: anon, Authorization: req.headers.get("Authorization") ?? "", "Content-Type": "application/json" },
  });
  const d = await r.json().catch(() => null);
  if (!r.ok) return json({ error: d?.message ?? "Fichier refusé." }, r.status === 400 ? 422 : r.status);
  try {
    const contenu = fichierCpa005({
      originateur: d.originateur, centre: d.centre, numero: d.numero, creation: new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" }),
      nomCourt: "LEASE LANE", nomLong: "Solutions Locatives LeaseLane", retour: d.retour,
      operations: (d.lignes ?? []).map((l: { montant: number; institution: string; transit: string; compte: string; nom: string; reference: string }) => ({
        sens: "D" as const, code: "401", cents: Math.round(Number(l.montant) * 100), date: d.echeance, institution: l.institution, transit: l.transit, compte: l.compte, nom: l.nom, reference: l.reference })),
    });
    return json({ nom: `prelevements-${d.echeance}-cpa005-${String(d.numero).padStart(4, "0")}.txt`, contenu });
  } catch (e) {
    return json({ error: (e as Error).message }, 422);
  }
});
