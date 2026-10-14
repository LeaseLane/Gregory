import { corsHeadersFor } from "../_shared/auth.ts";
import { simuler, type Resultat } from "../_shared/solvabilite.ts";
// enquetes-credit (T5) : approuve une liste EXPLICITE d'enquêtes avec le jeton de la personne (droit, 2FA, consentement
// valide, une seule en cours, budget : tout est vérifié en base par lanceur_approuver_enquetes), puis interroge le
// fournisseur pour cette liste seulement et enregistre chaque résultat (service_resultat_enquete).
//   hors production : simulateur (coût simulé);  production : « unconfigured » sans frais tant qu'Ozeille n'est pas branché.

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const PROD = url.includes("kdmwfbcziokygfcmjxeq");

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { ids } = await req.json().catch(() => ({ ids: null }));
  if (!Array.isArray(ids) || !ids.length) return json({ error: "Aucune enquête choisie." }, 422);

  const a = await fetch(`${url}/rest/v1/rpc/lanceur_approuver_enquetes`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: JSON.stringify({ p_ids: ids }) });
  const ok = await a.json().catch(() => null);
  if (!a.ok) return json({ error: ok?.message ?? "Approbation refusée.", code: ok?.code }, a.status === 400 ? 422 : a.status);

  const sortie = [];
  for (const e of ok.enquetes as { id: string; courriel: string; loyer: number | null }[]) {
    // ponytail: pas encore d'API Ozeille (contrat à signer); la brancher ici, même forme de résultat.
    const r: Resultat = PROD ? { result: "unconfigured" } : simuler(e.courriel, e.loyer);
    const res = await fetch(`${url}/rest/v1/rpc/service_resultat_enquete`, { method: "POST", headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p: { id: e.id, result: r.result, report: r.report ?? null, provider: PROD ? ok.fournisseur : "simulateur", simulated: !PROD, cost: ok.cout_unitaire } }) });
    sortie.push({ id: e.id, result: res.ok ? r.result : "error", erreur: res.ok ? undefined : await res.text() });
  }
  return json({ enquetes: sortie, simule: !PROD });
});
