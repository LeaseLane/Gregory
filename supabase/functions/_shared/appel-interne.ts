// Vérifie qu'un appel provient bien du cron ou d'un déclencheur Postgres,
// et non de n'importe qui sur Internet (lot G11.7).
//
// LE PROBLÈME. Une quinzaine de fonctions ont `verify_jwt = false` dans
// config.toml — nécessaire, parce qu'elles sont appelées par pg_cron et
// par des déclencheurs, pas par un usager connecté. Mais plusieurs ne
// vérifiaient ensuite rien du tout : un POST sans aucune clé traversait
// jusqu'à la logique applicative (constaté en production le 2026-09-09,
// HTTP 400 « action inconnue » et non 401). Elles envoient de vrais
// courriels et appellent l'API Anthropic : la facture et la réputation
// sont exposées, même si les données ne le sont pas.
//
// LE MOTIF repris de send-health-alert, qui faisait déjà ça correctement :
// un secret partagé dans un en-tête, comparé à une variable
// d'environnement.
//
// ÉCHEC FERMÉ (audit 2026-11). Si INTERNAL_CALL_SECRET n'est pas défini,
// l'appel est REFUSÉ (403) : un secret oublié ne doit jamais rendre ces
// fonctions publiques. Le secret doit donc être défini dans Supabase (et
// dans app.internal_call_secret / le vault côté SQL) AVANT de déployer.

/**
 * Retourne une réponse 403 si l'appel n'est pas authentifié comme interne,
 * ou `null` si l'appel peut continuer.
 *
 * Sans INTERNAL_CALL_SECRET défini, refuse toujours (échec fermé).
 */
export function refuserSiAppelExterne(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  const secret = Deno.env.get("INTERNAL_CALL_SECRET");

  if (!secret) {
    console.error("INTERNAL_CALL_SECRET absent — appel interne refusé (échec fermé).");
    return new Response(
      JSON.stringify({ error: "Non autorisé" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const fourni = req.headers.get("x-internal-call-key") || "";

  // Comparaison à temps constant : une comparaison ordinaire s'arrête au
  // premier caractère différent, ce qui laisse deviner le secret octet
  // par octet en mesurant le temps de réponse.
  if (!egalTempsConstant(fourni, secret)) {
    return new Response(
      JSON.stringify({ error: "Non autorisé" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return null;
}

/**
 * Pour les fonctions appelées seulement par le cron, les déclencheurs ou
 * une autre fonction edge (T0) : accepte la clé service_role (appels edge
 * qui l'utilisent déjà) ou la clé d'appel interne. Échec fermé sans
 * INTERNAL_CALL_SECRET, comme refuserSiAppelExterne.
 */
export function refuserSiNonInterne(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  const cleServeur = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (cleServeur && (req.headers.get("Authorization") || "") === `Bearer ${cleServeur}`) return null;
  return refuserSiAppelExterne(req, corsHeaders);
}

/**
 * Version stricte : vrai seulement si INTERNAL_CALL_SECRET est défini ET
 * que l'en-tête le présente. Pour les fonctions coûteuses (IA, SMS) où
 * laisser passer par défaut n'est pas acceptable : sans secret, l'appel
 * interne est simplement refusé (le cron s'arrête, rien d'autre ne casse).
 */
export function estAppelInterneVerifie(req: Request): boolean {
  const secret = Deno.env.get("INTERNAL_CALL_SECRET");
  if (!secret) return false;
  return egalTempsConstant(req.headers.get("x-internal-call-key") || "", secret);
}

/**
 * En-têtes à utiliser quand UNE fonction edge en appelle une autre
 * (ops-api → dispatch-work-order, admin-api → send-onboarding-reminder,
 * handle-tenant-confirmation → analyze-satisfaction-signal).
 *
 * Sans ces en-têtes, ces appels seraient refusés dès que le secret est
 * défini — l'équivalent côté edge de internal_call_headers() en SQL.
 */
export function enTetesAppelInterne(anonKey: string): Record<string, string> {
  const secret = Deno.env.get("INTERNAL_CALL_SECRET");
  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    ...(secret ? { "x-internal-call-key": secret } : {}),
  };
}

function egalTempsConstant(a: string, b: string): boolean {
  const encodeur = new TextEncoder();
  const octetsA = encodeur.encode(a);
  const octetsB = encodeur.encode(b);
  // La longueur reste observable, mais elle ne révèle pas le contenu.
  if (octetsA.length !== octetsB.length) return false;
  let difference = 0;
  for (let i = 0; i < octetsA.length; i++) difference |= octetsA[i] ^ octetsB[i];
  return difference === 0;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Vrai seulement pour un UUID : à vérifier avant d'interpoler un id dans une URL PostgREST. */
export function estUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}
