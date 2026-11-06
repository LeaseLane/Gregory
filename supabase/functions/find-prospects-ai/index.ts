import { corsHeadersFor, requireUserWithMfa } from "../_shared/auth.ts";
import { estAppelInterneVerifie } from "../_shared/appel-interne.ts";
import { IA_MESSAGES_URL, IA_CLE, MODELE_RAPIDE, modelePour, avecContexte } from "../_shared/ia.ts";
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

// Prospection par le rôle (étape 3) : coordonnées d'affaires PUBLIÉES par un propriétaire déjà identifié au rôle d'évaluation, et indice
// d'une gestion externe. Chaque élément porte sa page source; rien n'est deviné. Résultat dans crm.role_coordonnees.
const OUTIL_COORDONNEES = { name: "soumettre", description: "Soumet les coordonnées réellement trouvées, avec leurs sources.", input_schema: { type: "object",
  required: ["sources", "refus_sollicitation"], properties: {
    site: { type: ["string", "null"], description: "Site web de l'entreprise propriétaire" },
    telephone: { type: ["string", "null"], description: "Téléphone d'affaires publié par l'entreprise" },
    courriel: { type: ["string", "null"], description: "Courriel publié tel quel sur une page de l'entreprise ou un annuaire d'affaires; jamais déduit" },
    decideur: { type: ["string", "null"], description: "Nom du dirigeant ou propriétaire, s'il est publié" },
    gestionnaire: { type: ["string", "null"], description: "Entreprise de gestion immobilière qui gère ses immeubles, si une page le montre; sinon null" },
    refus_sollicitation: { type: "boolean", description: "Vrai si une page mentionne un refus des sollicitations" },
    a_propos_entreprise: { type: ["string", "null"], description: "Deux phrases au plus : ce qu'est l'entreprise (fondation, parc, secteur, gestion elle-même ou non), d'après les pages" },
    a_propos_personne: { type: ["string", "null"], description: "Une ou deux phrases sur le décideur : titre, depuis quand, autres entreprises qu'il dirige. Renseignements d'affaires publiés seulement" },
    remarque: { type: ["string", "null"], description: "Un fait utile pour Lease Lane vu sur les pages (logements annoncés à louer depuis longtemps, acquisition récente, croissance, avis de locataires); null sinon" },
    sources: { type: "array", items: { type: "object", required: ["url", "extrait"], properties: { url: { type: "string" }, extrait: { type: "string", description: "Passage exact de la page" } } } },
  } } };

// Recherche en langage naturel (Ventes › Prospection IA) : la phrase de la personne → filtres sur le rôle d'évaluation. Aucune recherche web.
const OUTIL_FILTRES = { name: "filtres", description: "Filtres de recherche dans le rôle d'évaluation foncière du Québec.", input_schema: { type: "object", properties: {
  villes: { type: "array", items: { type: "string" }, description: "Municipalités nommées (ex. Québec, Lévis); vide si aucune" },
  min: { type: ["integer", "null"], description: "Logements par immeuble, minimum" }, max: { type: ["integer", "null"], description: "Logements par immeuble, maximum" },
  annee_min: { type: ["integer", "null"], description: "Construit en ou après" }, annee_max: { type: ["integer", "null"], description: "Construit en ou avant (« avant 1990 » → 1989)" },
  statut: { type: ["string", "null"], enum: ["morale", "physique", null], description: "morale = entreprise, physique = particulier" },
  pres_de: { type: ["object", "null"], properties: { adresse: { type: "string", description: "Adresse complète avec la ville" }, km: { type: "number" } }, description: "Rayon autour d'une adresse (2 km par défaut)" },
  q: { type: ["string", "null"], description: "Nom de propriétaire ou de rue recherché, s'il est donné" },
  coordonnees: { type: ["string", "null"], enum: ["avec", "sans", null], description: "Seulement ceux dont on a (avec) ou n'a pas (sans) les coordonnées" },
} } };

// Adresses Québec (iCherche, gouvernement du Québec, gratuit, sans clé) : adresse → point. Le rôle abrège le type de voie (RU, BO…).
const VOIES: Record<string, string> = { RU: "rue", BO: "boulevard", AV: "avenue", CH: "chemin", RO: "route", PL: "place", CR: "croissant", MO: "montée", RG: "rang",
  TE: "terrasse", CA: "carré", AL: "allée", PR: "promenade", CO: "côte", IM: "impasse", RL: "ruelle", QU: "quai", SE: "sentier", AU: "autoroute", CV: "cour" };
const nettoyerAdresse = (a: string) => a.replace(/^(\d+)[A-Z]?-\d+[A-Z]?\b/, "$1").replace(/^(\S+)\s+([A-Z]{2})\s/, (m, no, c) => `${no} ${VOIES[c] ?? ""} `).replace(/\s+/g, " ").trim();
const sansAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
// null = adresse introuvable; undefined = service indisponible (503 au-delà d'environ 150 requêtes rapprochées) : à refaire plus tard.
async function geocoder(adresse: string, ville?: string): Promise<{ lat: number; lon: number; libelle: string } | null | undefined> {
  const u = new URL("https://geoegl.msp.gouv.qc.ca/apis/icherche/geocode");
  u.searchParams.set("type", "adresses"); u.searchParams.set("limit", "1"); u.searchParams.set("geometry", "1"); u.searchParams.set("q", ville ? `${adresse}, ${ville}` : adresse);
  let r: Response | null = null;
  for (let essai = 0; essai < 3; essai++) {
    r = await fetch(u, { signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (r?.ok) break;
    await new Promise((ok) => setTimeout(ok, 1500 * (essai + 1)));
  }
  if (!r?.ok) return undefined;
  const f = (await r.json().catch(() => ({})))?.features?.[0];
  const c = f?.geometry?.coordinates, nom = String(f?.properties?.nom ?? "");
  if (!Array.isArray(c) || (ville && !sansAccents(nom).includes(sansAccents(ville)))) return null;   // autre ville : faux positif
  return { lon: Number(c[0]), lat: Number(c[1]), libelle: nom };
}

const OUTIL_PROPRIETAIRE = { name: "soumettre", description: "Soumet le propriétaire trouvé, avec ses sources.", input_schema: { type: "object",
  required: ["proprietaire", "sources", "confiance", "raison"], properties: {
    proprietaire: { type: ["string", "null"], description: "Nom de l'entreprise ou de la personne propriétaire, tel qu'écrit sur la page; null si non trouvé" },
    neq: { type: ["string", "null"], description: "NEQ (10 chiffres) s'il est publié" },
    confiance: { type: "string", enum: ["élevée", "moyenne", "faible"] },
    raison: { type: "string", description: "Une phrase : ce qui relie l'adresse à ce propriétaire, et le gestionnaire s'il est mentionné" },
    sources: { type: "array", items: { type: "object", required: ["url", "extrait"], properties: { url: { type: "string" }, extrait: { type: "string" } } } },
  } } };

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
    const texte = await r.text();
    if (!r.ok) throw new Error(`${nom} : ${r.status} ${texte}`);
    return texte ? JSON.parse(texte) : null;   // fonction « returns void » : corps vide
  };
  // Recherche web de l'agent, résultat structuré par l'outil « soumettre » seulement : laisse finir une recherche suspendue (pause_turn),
  // puis exige la soumission (null si rien de vérifiable). Coût mesuré sur tous les tours.
  async function rechercher(prompt: string, outilSoumettre: unknown) {
    const outils = [{ type: "web_search_20260209", name: "web_search", allowed_callers: ["direct"], max_uses: 5 }, outilSoumettre];   // 5 recherches : moins d’une minute, quelques cents
    const appeler = (model: string, messages: unknown[], forcer = false) => fetch(IA_MESSAGES_URL, { method: "POST", headers: { "x-api-key": IA_CLE, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(avecContexte({ model, max_tokens: 2048, tools: outils, ...(forcer ? { tool_choice: { type: "tool", name: "soumettre" } } : {}), messages })) });
    let modele = await modelePour("prospection", Deno.env.get("IA_MODELE_RECHERCHE") || "claude-sonnet-5");
    const messages: unknown[] = [{ role: "user", content: prompt }];
    let brut = "";
    const lire = async (r: Response) => { brut = await r.text().catch(() => ""); try { return JSON.parse(brut); } catch { return {}; } };
    let res = await appeler(modele, messages), ai = await lire(res);
    // Modèle refusé par la passerelle (en erreur, ou en « 200 » msg-tonia-entitlement : prix manquant en mode Géré) : modèle rapide.
    const refuse = (r: Response, x: any) => (!r.ok && /entitlement|model/i.test(JSON.stringify(x?.error ?? ""))) || (r.ok && /^msg-tonia-entitlement/.test(String(x?.id ?? "")));
    if (refuse(res, ai) && modele !== MODELE_RAPIDE) { modele = MODELE_RAPIDE; res = await appeler(modele, messages); ai = await lire(res); }
    const usage = { in: 0, out: 0, rech: 0 };
    const compter = (x: any) => { usage.in += Number(x?.usage?.input_tokens ?? 0); usage.out += Number(x?.usage?.output_tokens ?? 0); usage.rech += Number(x?.usage?.server_tool_use?.web_search_requests ?? 0); };
    const outil = (x: any) => (x?.content || []).find((b: { type: string; name?: string }) => b.type === "tool_use" && b.name === "soumettre");
    compter(ai);
    // Recherche suspendue (pause_turn) : on la laisse finir; terminée sans l'outil : on exige la soumission (null si rien de vérifiable).
    for (let tour = 0; res.ok && Array.isArray(ai.content) && !outil(ai) && tour < 3; tour++) {
      messages.push({ role: "assistant", content: ai.content });
      if (ai.stop_reason !== "pause_turn") messages.push({ role: "user", content: "Appelle maintenant l'outil « soumettre » avec ce que tu as trouvé et vérifié (null pour ce qui manque, sources vides si rien)." });
      res = await appeler(modele, messages, ai.stop_reason !== "pause_turn"); ai = await lire(res); compter(ai);
    }
    const u = { input_tokens: usage.in, output_tokens: usage.out }, recherches = usage.rech, cout = coutCents(usage.in, usage.out, recherches);
    // Passerelle Tonia : un refus (quota, forfait) arrive en « 200 » avec un message msg-tonia-entitlement-… : c'est une erreur.
    if (res.ok && /^msg-tonia-entitlement/.test(String(ai?.id ?? ""))) ai = { ...ai, error: { message: `Passerelle IA : ${(ai.content ?? []).map((x: { text?: string }) => x.text ?? "").join(" ").slice(0, 200)}` } };
    // Réponse « 200 » sans contenu (passerelle) : le corps brut va au journal de la recherche.
    if (res.ok && !Array.isArray(ai.content)) ai = { error: { message: `Réponse sans contenu : ${brut.slice(0, 200) || "(vide)"}` } };
    const trace = `stop=${ai?.stop_reason ?? "?"} · contenu=${(Array.isArray(ai?.content) ? ai.content : []).map((b: { type: string }) => b.type).join(",") || "vide"} · tours=${messages.length} · ${(Array.isArray(ai?.content) ? ai.content : []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join(" ").slice(0, 200)}`;
    return { res, ai, u, recherches, cout, bloc: res.ok ? outil(ai) : null, trace };
  }
  async function coordonnees(cle: string, par: string | null) {
    if (!par) return json({ error: "Réservé à une personne de l'équipe." }, 403);
    const g = await rpc("service_role_groupe", { p_cle: cle });
    if (!g) return json({ error: "Propriétaire introuvable au rôle." }, 404);
    const idRun = await rpc("agent_prospection_debut", { p_par: par, p_criteres: { mode: "coordonnees", cle } });
    const prompt = `Tu aides "Lease Lane", une entreprise québécoise de gestion immobilière, à joindre un propriétaire d'immeubles locatifs.

Propriétaire inscrit au rôle d'évaluation : ${JSON.stringify(g.noms)}${g.neq ? ` (NEQ ${g.neq})` : ""}.
Immeubles : ${(g.adresses ?? []).join("; ")} — ${g.logements} logements au total (${g.villes}).

Avec l'outil de recherche web, trouve :
1. les coordonnées d'AFFAIRES que cette entreprise publie elle-même (site web, téléphone, courriel) et le nom de son dirigeant s'il est publié;
2. si une entreprise de gestion immobilière gère ses immeubles (page d'un gestionnaire, annonce de location à ces adresses, témoignage).

RÈGLES STRICTES :
- N'invente et ne déduis JAMAIS une coordonnée (pas de courriel construit comme prenom.nom@…). Absente des pages : null.
- Attention aux homonymes : ne garde une coordonnée que si la page la relie clairement à cette entreprise ou à ces adresses.
- Chaque élément retenu doit apparaître dans "sources" (url réelle + passage exact).
- Indique refus_sollicitation = true si une page mentionne un refus des sollicitations.
- Rédige aussi une courte présentation pour la personne qui appellera : a_propos_entreprise, a_propos_personne, remarque. Seulement des
  renseignements d'AFFAIRES publiés (rôle, entreprises dirigées, parc immobilier). JAMAIS la vie privée : âge, famille, adresse personnelle,
  santé, opinions. Rien de trouvé : null.

Une fois la recherche terminée, appelle l'outil "soumettre".`;
    const { res, ai, u, recherches, cout, bloc, trace } = await rechercher(prompt, OUTIL_COORDONNEES);
    await rpc("agent_prospection_fin", { p_run: idRun, p_items: null, p_trouves: bloc ? 1 : 0, p_tokens_in: u.input_tokens ?? null, p_tokens_out: u.output_tokens ?? null,
      p_recherches: recherches, p_cout: cout, p_erreur: res.ok ? (bloc ? null : `Aucun résultat soumis · ${trace}`.slice(0, 300)) : `${res.status} ${ai?.error?.message ?? ""}`.slice(0, 300) });
    if (!res.ok) return json({ error: ai?.error?.message || "Échec de la recherche IA" }, 502);
    if (!bloc) return json({ error: "La recherche n'a rien donné de vérifiable." }, 422);
    await rpc("service_role_coordonnees", { p_cle: cle, p_run: idRun, p: { ...bloc.input, nom: g.nom } });
    return json({ ok: true, coordonnees: bloc.input, cout_cents: cout });
  }
  // Prospection par le rôle : QUI possède cet immeuble, d'après le web public (jamais les sites municipaux ni le Registre foncier).
  async function proprietaire(id: string, par: string | null) {
    if (!par) return json({ error: "Réservé à une personne de l'équipe." }, 403);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Immeuble invalide." }, 400);
    const im = await rpc("service_role_immeuble", { p_id: id });
    if (!im) return json({ error: "Immeuble introuvable." }, 404);
    if (im.deja) return json({ error: "Immeuble déjà cherché ou identifié." }, 409);
    const idRun = await rpc("agent_prospection_debut", { p_par: par, p_criteres: { mode: "proprietaire", immeuble: id } });
    const prompt = `Tu aides "Lease Lane", une entreprise québécoise de gestion immobilière, à savoir QUI possède un immeuble locatif.

Immeuble : ${im.adresse}, ${im.municipalite} (Québec). ${im.logements} logements${im.annee ? `, construit en ${im.annee}` : ""}. Propriétaire actuel inscrit depuis ${im.inscrit_le ?? "date inconnue"}; ${im.statut === "morale" ? "c'est une entreprise" : im.statut === "physique" ? "c'est un particulier" : "statut inconnu"}.
(Le numéro civique peut être une plage, ex. « 1245-1285 » : une page peut citer un seul numéro de la plage.)

Avec l'outil de recherche web, trouve le propriétaire ACTUEL : nouvelles de vente ou d'acquisition, site d'une entreprise qui liste cet immeuble dans son parc, annonce commerciale (Centris, courtiers), permis ou projet municipal, communiqué.

RÈGLES STRICTES :
- N'invente JAMAIS un nom. Si aucune page ne relie clairement cette adresse à un propriétaire, mets proprietaire à null.
- Une entreprise de gestion ou une agence de location n'est PAS le propriétaire (note-la dans raison si tu la vois).
- Une vente plus ancienne que ${im.inscrit_le ?? "la date d'inscription"} peut viser un ancien propriétaire : vérifie la date.
- Chaque source : url réelle + passage exact qui nomme l'adresse et le propriétaire.
- confiance : « élevée » (page récente et explicite), « moyenne » (indirect), « faible ».

Une fois la recherche terminée, appelle l'outil "soumettre".`;
    const { res, ai, u, recherches, cout, bloc, trace } = await rechercher(prompt, OUTIL_PROPRIETAIRE);
    await rpc("agent_prospection_fin", { p_run: idRun, p_items: null, p_trouves: bloc?.input?.proprietaire ? 1 : 0, p_tokens_in: u.input_tokens ?? null, p_tokens_out: u.output_tokens ?? null,
      p_recherches: recherches, p_cout: cout, p_erreur: res.ok && !ai?.error ? (bloc ? null : `Aucun résultat soumis · ${trace}`.slice(0, 300)) : `${res.status} ${ai?.error?.message ?? ""}`.slice(0, 300) });
    if (!res.ok || ai?.error) return json({ error: ai?.error?.message || "Échec de la recherche IA" }, 502);
    // Rien de vérifiable : l'immeuble est quand même marqué « cherché » (pas de seconde recherche payante).
    await rpc("service_role_immeuble_propose", { p_id: id, p: bloc?.input ?? { proprietaire: null, sources: [], raison: "Aucun résultat soumis" } });
    return json({ ok: true, proprietaire: bloc?.input?.proprietaire ?? null, confiance: bloc?.input?.confiance ?? null, cout_cents: cout });
  }
  // La phrase → filtres (modèle rapide, outil forcé), puis l'adresse « près de » géocodée.
  async function comprendre(texte: string, par: string | null) {
    if (!par) return json({ error: "Réservé à une personne de l'équipe." }, 403);
    texte = texte.trim().slice(0, 500);
    if (!texte) return json({ error: "Écrivez ce que vous cherchez." }, 400);
    const idRun = await rpc("agent_prospection_debut", { p_par: par, p_criteres: { mode: "comprendre", texte } });
    const r = await fetch(IA_MESSAGES_URL, { method: "POST", headers: { "x-api-key": IA_CLE, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(avecContexte({ model: MODELE_RAPIDE, max_tokens: 600, tools: [OUTIL_FILTRES], tool_choice: { type: "tool", name: "filtres" },
        messages: [{ role: "user", content: `Traduis cette demande de prospection immobilière (Québec) en filtres. Ne mets que ce qui est demandé.\n\nDemande : « ${texte} »` }] })) });
    const ai = await r.json().catch(() => ({}));
    const u = ai?.usage ?? {}, cout = coutCents(Number(u.input_tokens ?? 0), Number(u.output_tokens ?? 0), 0);
    const f = (ai?.content ?? []).find((b: { type: string }) => b.type === "tool_use")?.input;
    await rpc("agent_prospection_fin", { p_run: idRun, p_items: null, p_trouves: f ? 1 : 0, p_tokens_in: u.input_tokens ?? null, p_tokens_out: u.output_tokens ?? null,
      p_recherches: 0, p_cout: cout, p_erreur: f ? null : `${r.status} ${ai?.error?.message ?? "aucun filtre"}`.slice(0, 300) });
    if (!f) return json({ error: ai?.error?.message || "La demande n'a pas été comprise." }, 502);
    if (f.pres_de?.adresse) {
      const pt = await geocoder(String(f.pres_de.adresse));
      if (!pt) return json({ error: pt === undefined ? "Le service d'adresses du Québec ne répond pas; réessayez dans une minute." : `Adresse introuvable : ${f.pres_de.adresse}`, filtres: { ...f, pres_de: null } }, pt === undefined ? 503 : 422);
      f.pres_de = { ...f.pres_de, ...pt, km: Number(f.pres_de.km) || 2 };
    }
    return json({ ok: true, filtres: f });
  }
  // Géocode un lot d'immeubles du rôle (gratuit). Appelé en boucle jusqu'à « restants : 0 ».
  async function geocoderLot(villes: string[] | null, n: number, par: string | null) {
    if (!par) return json({ error: "Réservé à une personne de l'équipe." }, 403);
    const lot: { id: string; adresse: string; municipalite: string }[] = await rpc("service_role_a_geocoder", { p_n: n, p_villes: villes });
    const faits: { id: string; lat: number | null; lon: number | null }[] = [];
    let indisponibles = 0;
    for (let k = 0; k < lot.length; k += 4) {   // 4 à la fois : le service public limite les requêtes rapprochées
      for (const [i, pt] of await Promise.all(lot.slice(k, k + 4).map(async (i) => [i, await geocoder(nettoyerAdresse(i.adresse), i.municipalite)] as const))) {
        if (pt === undefined) indisponibles++;   // pas marqué : refait au prochain lot
        else faits.push({ id: i.id, lat: pt?.lat ?? null, lon: pt?.lon ?? null });
      }
    }
    if (faits.length) await rpc("service_role_geocode", { p: faits });
    return json({ ok: true, faits: faits.length, trouves: faits.filter((x) => x.lat != null).length, indisponibles, restants: await rpc("service_role_geocode_restants", { p_villes: villes }) });
  }
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
    if (body.action === "coordonnees") return await coordonnees(String(body.cle || ""), par);
    if (body.action === "proprietaire") return await proprietaire(String(body.id || ""), par);
    if (body.action === "comprendre") return await comprendre(String(body.texte || ""), par);
    if (body.action === "geocoder") return await geocoderLot(Array.isArray(body.villes) && body.villes.length ? body.villes.map(String).slice(0, 20) : null,
      Math.max(1, Math.min(200, Number(body.n) || 100)), par);
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
      { type: "web_search_20260209", name: "web_search", allowed_callers: ["direct"] },
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
    let aiRes = await appeler(await modelePour("prospection", Deno.env.get("IA_MODELE_RECHERCHE") || "claude-sonnet-5"));
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
