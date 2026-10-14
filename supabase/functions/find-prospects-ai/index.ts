import { corsHeadersFor, requireUserWithMfa } from "../_shared/auth.ts";
import { estAppelInterneVerifie } from "../_shared/appel-interne.ts";
import { IA_MESSAGES_URL, IA_CLE, MODELE_RAPIDE, avecContexte } from "../_shared/ia.ts";
// find-prospects-ai : l'agent de prospection (T3b). Recherche web RÉELLE (jamais inventée) de propriétaires qui gèrent
// eux-mêmes des immeubles à logements au Québec, via Claude + l'outil serveur web_search.
//
// T3b : l'agent ne crée PLUS de prospect ni d'assignation. Il dépose des SUGGESTIONS (crm.prospect_suggestions) avec
// la source, l'extrait trouvé, la raison et une pertinence; une personne les révise dans Lanceur (Ventes › Prospection
// IA). Les doublons (contacts, prospects, suggestions) sont écartés en base. Le coût IA de chaque recherche est mesuré.
//
// Appelée par le cron (clé d'appel interne), par le bouton de l'admin actuel (admin, 2FA) et par Lanceur
// (relais /api/prospection, jeton de la personne : droit ventes.prospection.ecrire et 2FA vérifiés en base).

const MAX_PAR_RECHERCHE = 5;
// Prix publics approximatifs (USD) : entrée 3 $/M jetons, sortie 15 $/M, recherche web 10 $/1 000. Pour l'ordre de grandeur.
const coutCents = (entree: number, sortie: number, recherches: number) => Math.round((entree * 3 + sortie * 15) / 10_000 + recherches * 1);

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const adminHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" };
  const rpc = async (nom: string, args: unknown) => {
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/${nom}`, { method: "POST", headers: adminHeaders, body: JSON.stringify(args) });
    if (!r.ok) throw new Error(`${nom} : ${r.status} ${await r.text()}`);
    return r.json();
  };
  let run: string | null = null;
  try {
    let par: string | null = null;
    if (!estAppelInterneVerifie(req)) {
      const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
      // Lanceur : la base vérifie le droit et la 2FA avec le jeton de la personne.
      const r = await fetch(`${supabaseUrl}/rest/v1/rpc/lanceur_peut_prospecter`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: "{}" });
      if (r.ok && (await r.json()) === true) {
        par = JSON.parse(atob(jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))?.sub ?? null;
      } else {
        // Admin actuel : admin + 2FA (comme avant).
        const auth = await requireUserWithMfa(req, corsHeaders);
        if ("response" in auth) return auth.response;
        const adminRows = await (await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${auth.userId}&select=is_admin`, { headers: adminHeaders })).json().catch(() => []);
        if (!adminRows?.[0]?.is_admin) return json({ error: "Accès refusé" }, 403);
        par = auth.userId;
      }
    }

    const body = await req.json().catch(() => ({}));
    if ((body.action || "run") !== "run") return json({ error: "Action inconnue" }, 400);
    const territoire = String(body.territoire || "Québec et Lévis").slice(0, 80);
    const portesMin = Math.max(2, Math.min(100, Number(body.portes_min) || 4));
    run = await rpc("agent_prospection_debut", { p_par: par, p_criteres: { territoire, portes_min: portesMin } });

    const prompt = `Tu es l'agent de prospection de "Lease Lane", une entreprise québécoise de gestion immobilière qui offre ses services à des propriétaires qui gèrent eux-mêmes leurs immeubles à logements.

Utilise l'outil de recherche web pour trouver de VRAIS propriétaires dans le secteur « ${territoire} » qui possèdent et gèrent eux-mêmes au moins un immeuble de ${portesMin} logements ou plus, et qui ne semblent pas déjà faire affaire avec une entreprise de gestion.

RÈGLES STRICTES :
- Ne cible JAMAIS une entreprise de gestion immobilière, une agence de location, un courtier : ce sont des concurrents.
- Ne cible que des propriétaires individuels, des sociétés à numéro ou de petites entreprises familiales qui gèrent LEURS PROPRES immeubles.
- N'invente JAMAIS un nom, un numéro, un courriel ou une adresse. Si une information n'apparaît pas dans les résultats, laisse le champ à null ou omets ce propriétaire.
- Chaque suggestion inclut "source_url" (page réelle) et "extrait" : le passage exact de la page qui montre la coordonnée et l'immeuble.
- Une suggestion a au moins un téléphone OU un courriel trouvé réellement — sinon ne la soumets pas.
- Indique si la coordonnée est publiée comme coordonnée d'affaires ET si la page contient une mention de refus des sollicitations ("pas de sollicitation", etc.) dans "raison".
- "pertinence" (0 à 100) : nombre de logements, gestion par le propriétaire lui-même, proximité du secteur.
- Maximum ${MAX_PAR_RECHERCHE} propriétaires.

Une fois ta recherche terminée, appelle l'outil "soumettre" avec ce que tu as trouvé.`;
    const tools = [
      { type: "web_search_20260209", name: "web_search" },
      { name: "soumettre", description: "Soumet les propriétaires réels trouvés, avec leur source.", input_schema: { type: "object", required: ["proprietaires"], properties: { proprietaires: { type: "array", items: {
        type: "object", required: ["nom", "source_url", "extrait", "raison", "pertinence"],
        properties: {
          nom: { type: "string" }, entreprise: { type: ["string", "null"] }, telephone: { type: ["string", "null"] }, courriel: { type: ["string", "null"] },
          ville: { type: ["string", "null"], description: "Ville ou quartier de l'immeuble" }, portes: { type: ["number", "null"] }, immeubles: { type: ["number", "null"] },
          source_url: { type: "string" }, extrait: { type: "string" }, raison: { type: "string", description: "Pourquoi ce propriétaire est un bon prospect, en une phrase" },
          pertinence: { type: "number" },
        } } } } } },
    ];
    const appeler = (model: string) => fetch(IA_MESSAGES_URL, {
      method: "POST",
      headers: { "x-api-key": IA_CLE, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(avecContexte({ model, max_tokens: 4096, tools, messages: [{ role: "user", content: prompt }] })),
    });
    let aiRes = await appeler(Deno.env.get("IA_MODELE_RECHERCHE") || "claude-sonnet-5");
    let ai = await aiRes.json().catch(() => ({}));
    // Passerelle sans prix pour ce modèle (Tonia : managed_model_price_missing) : on reprend avec le modèle rapide.
    if (!aiRes.ok && /entitlement|model/i.test(JSON.stringify(ai?.error ?? ""))) {
      aiRes = await appeler(MODELE_RAPIDE);
      ai = await aiRes.json().catch(() => ({}));
    }
    const u = ai?.usage ?? {}, recherches = Number(u?.server_tool_use?.web_search_requests ?? 0);
    const cout = coutCents(Number(u.input_tokens ?? 0), Number(u.output_tokens ?? 0), recherches);
    if (!aiRes.ok) {
      await rpc("agent_prospection_fin", { p_run: run, p_items: null, p_trouves: 0, p_tokens_in: u.input_tokens ?? null, p_tokens_out: u.output_tokens ?? null, p_recherches: recherches, p_cout: cout, p_erreur: `${aiRes.status} ${ai?.error?.message ?? JSON.stringify(ai)}`.slice(0, 300) });
      return json({ error: ai?.error?.message || "Échec de la recherche IA" }, 502);
    }
    // Résultat structuré seulement par l'outil « soumettre », jamais lu dans le texte libre.
    const bloc = (ai.content || []).find((b: { type: string; name?: string }) => b.type === "tool_use" && b.name === "soumettre");
    const trouves = (Array.isArray(bloc?.input?.proprietaires) ? bloc.input.proprietaires : []).slice(0, MAX_PAR_RECHERCHE);
    const retenus = await rpc("agent_prospection_fin", { p_run: run, p_items: trouves, p_trouves: trouves.length, p_tokens_in: u.input_tokens ?? null,
      p_tokens_out: u.output_tokens ?? null, p_recherches: recherches, p_cout: cout, p_erreur: null });
    // Production sans Lanceur : mode hérité, les suggestions deviennent des prospects (aucun envoi, comme avant).
    const revision = Deno.env.get("PROPOSITIONS_ACTIVES") === "true" || !supabaseUrl.includes("kdmwfbcziokygfcmjxeq");
    const crees = revision ? 0 : await rpc("agent_prospection_approuver_systeme", { p_run: run });
    // « inserted » gardé pour le bouton de l'admin actuel.
    return json({ ok: true, run, trouves: trouves.length, suggestions: retenus, a_reviser: revision, inserted: revision ? retenus : crees, cout_cents: cout });
  } catch (e) {
    if (run) await rpc("agent_prospection_fin", { p_run: run, p_items: null, p_trouves: 0, p_tokens_in: null, p_tokens_out: null, p_recherches: null, p_cout: null, p_erreur: String(e).slice(0, 300) }).catch(() => {});
    return json({ error: String(e) }, 500);
  }
});
