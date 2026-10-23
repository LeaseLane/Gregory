import { corsHeadersFor } from "../_shared/auth.ts";
import { estAppelInterneVerifie } from "../_shared/appel-interne.ts";
import { IA_MESSAGES_URL, IA_CLE, MODELE_RAPIDE, modelePour, avecContexte } from "../_shared/ia.ts";
// agent-recrutement (T8b) : cherche des entreprises (spécialité, secteurs de la recherche active), vérifie la licence
// RBQ au registre public de la RBQ, et DÉPOSE des candidats (maint.supplier_candidates). Jamais de fournisseur créé,
// jamais d'invitation : une personne décide dans Lanceur (Maintenance › Recrutement). Coût IA mesuré par recherche.
// Appelée par le cron du soir (clé d'appel interne, seulement si la passe du soir est activée) et par Lanceur
// (relais /api/recrutement : droit maintenance.ecrire et 2FA vérifiés en base avec le jeton de la personne).

const MAX = 6;
const coutCents = (entree: number, sortie: number, recherches: number) => Math.round((entree * 3 + sortie * 15) / 10_000 + recherches * 1);

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const rpc = async (nom: string, args: unknown) => {
    const r = await fetch(`${url}/rest/v1/rpc/${nom}`, { method: "POST", headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
    if (!r.ok) throw new Error(`${nom} : ${r.status} ${await r.text()}`);
    return r.json();
  };
  let run: string | null = null, search: string | null = null;
  try {
    let par: string | null = null;
    if (!estAppelInterneVerifie(req)) {
      const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
      const r = await fetch(`${url}/rest/v1/rpc/lanceur_peut_recruter`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: "{}" });
      if (!r.ok || (await r.json()) !== true) return json({ error: "Accès refusé : droit maintenance et deuxième facteur requis." }, 403);
      par = JSON.parse(atob(jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))?.sub ?? null;
    }
    const debut = await rpc("agent_recrutement_debut", { p_par: par });
    if (!debut?.search) return json({ error: "Aucune recherche active : définissez la spécialité et les secteurs." }, 422);
    run = debut.run; search = debut.search.id;
    const s = debut.search as { specialite: string; secteurs: string; besoin: string | null; documents: string[] };

    const prompt = `Tu es l'agent de recrutement de fournisseurs de "Lease Lane", une entreprise de gestion immobilière au Québec.

Trouve de VRAIES entreprises de « ${s.specialite} » qui servent les secteurs suivants : ${s.secteurs}.${s.besoin ? ` Besoin : ${s.besoin}.` : ""}

Pour chaque entreprise :
1. Trouve son site, sa fiche d'entreprise ou une annonce publique (source_url) et ses coordonnées d'affaires PUBLIÉES (courriel ou téléphone), avec l'extrait exact de la page.
2. Vérifie sa licence au registre public de la Régie du bâtiment du Québec (rbq.gouv.qc.ca, « Registre des détenteurs de licence ») : rbq_statut = "valide", "expiree", "introuvable", ou "non_requise" si le métier n'exige pas de licence RBQ (ex. déneigement seul). Donne rbq_source_url (la page du registre) quand tu l'as consultée.
3. Note l'assurance seulement si elle est DÉCLARÉE publiquement (sinon null), la note des avis si elle est affichée, et le NEQ s'il apparaît.

RÈGLES STRICTES : n'invente JAMAIS une coordonnée, un numéro de licence ou un statut; si tu n'as pas pu consulter le registre, rbq_statut = null.
Ne propose pas d'entreprises de gestion immobilière. Maximum ${MAX} entreprises. Termine en appelant l'outil "soumettre".`;
    const tools = [
      { type: "web_search_20260209", name: "web_search", allowed_callers: ["direct"] },
      { name: "soumettre", description: "Soumet les entreprises réelles trouvées, avec leurs sources et la vérification RBQ.", input_schema: { type: "object", required: ["entreprises"], properties: { entreprises: { type: "array", items: {
        type: "object", required: ["entreprise", "source_url", "extrait", "raison", "pertinence"],
        properties: {
          entreprise: { type: "string" }, specialites: { type: "array", items: { type: "string" } }, secteur: { type: ["string", "null"] },
          courriel: { type: ["string", "null"] }, telephone: { type: ["string", "null"] }, rbq: { type: ["string", "null"] }, neq: { type: ["string", "null"] },
          rbq_statut: { type: ["string", "null"], enum: ["valide", "expiree", "introuvable", "non_requise", null] }, rbq_source_url: { type: ["string", "null"] },
          assurance: { type: ["string", "null"] }, note: { type: ["number", "null"] }, source_url: { type: "string" }, extrait: { type: "string" },
          raison: { type: "string" }, pertinence: { type: "number" },
        } } } } } },
    ];
    const appeler = (model: string) => fetch(IA_MESSAGES_URL, { method: "POST", headers: { "x-api-key": IA_CLE, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(avecContexte({ model, max_tokens: 4096, tools, messages: [{ role: "user", content: prompt }] })) });
    let aiRes = await appeler(await modelePour("recrutement", Deno.env.get("IA_MODELE_RECHERCHE") || "claude-sonnet-5"));
    let ai = await aiRes.json().catch(() => ({}));
    if (!aiRes.ok && /entitlement|model/i.test(JSON.stringify(ai?.error ?? ""))) { aiRes = await appeler(MODELE_RAPIDE); ai = await aiRes.json().catch(() => ({})); }
    const u = ai?.usage ?? {}, recherches = Number(u?.server_tool_use?.web_search_requests ?? 0);
    const cout = coutCents(Number(u.input_tokens ?? 0), Number(u.output_tokens ?? 0), recherches);
    if (!aiRes.ok) {
      await rpc("agent_recrutement_fin", { p_run: run, p_search: search, p_items: null, p_trouves: 0, p_tokens_in: u.input_tokens ?? null, p_tokens_out: u.output_tokens ?? null,
        p_recherches: recherches, p_cout: cout, p_erreur: `${aiRes.status} ${ai?.error?.message ?? JSON.stringify(ai)}`.slice(0, 300) });
      return json({ error: ai?.error?.message || "Échec de la recherche IA" }, 502);
    }
    const bloc = (ai.content || []).find((b: { type: string; name?: string }) => b.type === "tool_use" && b.name === "soumettre");
    const trouves = (Array.isArray(bloc?.input?.entreprises) ? bloc.input.entreprises : []).slice(0, MAX);
    const retenus = await rpc("agent_recrutement_fin", { p_run: run, p_search: search, p_items: trouves, p_trouves: trouves.length, p_tokens_in: u.input_tokens ?? null,
      p_tokens_out: u.output_tokens ?? null, p_recherches: recherches, p_cout: cout, p_erreur: null });
    return json({ ok: true, trouves: trouves.length, candidats: retenus, cout_cents: cout });
  } catch (e) {
    if (run) await rpc("agent_recrutement_fin", { p_run: run, p_search: search, p_items: null, p_trouves: 0, p_tokens_in: null, p_tokens_out: null, p_recherches: null, p_cout: null, p_erreur: String(e).slice(0, 300) }).catch(() => {});
    return json({ error: String(e) }, 500);
  }
});
