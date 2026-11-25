import { corsHeadersFor } from "../_shared/auth.ts";
import { configMoneris, precharger, recu } from "../_shared/moneris.ts";
// paiement-carte (26 nov. 2026) : le locataire paie son loyer par carte dans la page de Moneris.
//  preparer : tentative (base, jeton du locataire) → billet Moneris → { ticket, mode }.
//  conclure : reçu demandé à Moneris par NOTRE serveur, puis carte_conclure (base). Le navigateur ne fait que dire « c'est fini ».
// Avant chaque préparation, les tentatives ouvertes du locataire sont revérifiées (navigateur fermé juste après avoir payé).

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
type Tentative = { id: string; statut: string; ticket: string | null; environnement: string | null; montant: number; created_at: string };

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { action, id } = await req.json().catch(() => ({}));
  const c = configMoneris();
  if (!c) return json({ error: "Le paiement par carte n'est pas configuré." }, 503);

  const rpc = async (nom: string, args: unknown, service = false) => {
    const r = await fetch(`${url}/rest/v1/rpc/${nom}`, { method: "POST", body: JSON.stringify(args ?? {}),
      headers: { apikey: service ? cle : anon, Authorization: `Bearer ${service ? cle : jeton}`, "Content-Type": "application/json" } });
    const d = await r.json().catch(() => null);
    if (!r.ok) throw Object.assign(new Error(d?.message ?? "Opération refusée."), { status: r.status });
    return d;
  };
  const conclure = async (t: Tentative) => {
    if (!t.ticket || t.environnement !== c.env) return t.statut;   // billet d'un autre environnement : laissé à l'équipe
    const r = await recu(c, t.ticket);
    return (await rpc("carte_conclure", { p_id: t.id, p_recu: r }, true))?.statut as string;
  };

  try {
    const mes: Tentative[] = await rpc("carte_mes_tentatives", {});   // vérifie aussi que c'est un locataire connecté
    if (action === "conclure") {
      const t = mes.find((x) => x.id === id);
      if (!t) return json({ error: "Paiement introuvable." }, 404);
      return json({ statut: t.statut === "ouvert" ? await conclure(t) : t.statut });
    }
    if (action === "verifier" || action === "preparer") {
      for (const t of mes.filter((x) => x.statut === "ouvert" && x.ticket)) await conclure(t).catch(() => null);
      if (action === "verifier") return json({ ok: true });
      const p = await rpc("carte_preparer", {});
      let ticket: string | null = p.ticket && p.environnement === c.env ? p.ticket : null;
      if (!ticket) {
        if (p.ticket) return json({ error: "Un paiement est déjà en cours. Réessayez dans 30 minutes." }, 409);
        ticket = await precharger(c, { id: p.id, montant: Number(p.montant), reference: p.reference, langue: p.langue });
        await rpc("carte_ticket", { p_id: p.id, p_ticket: ticket, p_env: c.env }, true);
      }
      return json({ id: p.id, montant: Number(p.montant), echeance: p.echeance, ticket, mode: c.env });
    }
    return json({ error: "Requête invalide." }, 400);
  } catch (e) {
    const s = (e as { status?: number }).status;
    return json({ error: (e as Error).message }, s === 401 || s === 403 ? s : s && s < 500 ? 409 : 502);
  }
});
