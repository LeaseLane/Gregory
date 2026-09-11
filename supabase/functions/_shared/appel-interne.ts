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
// ⚠️  POURQUOI LA VÉRIFICATION EST INACTIVE SANS SECRET.
//
// Si INTERNAL_CALL_SECRET n'est pas défini, cette fonction laisse passer
// l'appel. C'est délibéré, et c'est la leçon de HEALTH_ALERT_SECRET :
// quand ce secret-là a divergé du vault le 2026-08-17, l'alerte de santé
// a cessé de livrer — en silence, pendant des semaines, parce que le
// refus ressemblait à « pas d'alerte à envoyer ».
//
// Refuser par défaut ici casserait d'un coup les paiements, le dispatch
// des travaux, les rappels de loyer et les relances d'onboarding — sans
// message d'erreur visible, puisque personne ne lit les journaux du cron.
//
// L'ordre de déploiement sûr est donc :
//
//   1. Déployer les fonctions (la vérification dort, rien ne change).
//   2. Appliquer la migration qui fait passer le secret aux appels SQL.
//   3. Définir INTERNAL_CALL_SECRET dans le tableau de bord Supabase.
//      La vérification s'active à cet instant, des deux côtés à la fois.
//
// Inverser 2 et 3 coupe l'automatisation. La migration porte le même
// avertissement.

/**
 * Retourne une réponse 403 si l'appel n'est pas authentifié comme interne,
 * ou `null` si l'appel peut continuer.
 *
 * Tant que INTERNAL_CALL_SECRET n'est pas défini, retourne toujours `null`
 * et le signale dans les journaux — voir l'avertissement ci-dessus.
 */
export function refuserSiAppelExterne(
  req: Request,
  corsHeaders: Record<string, string>,
): Response | null {
  const secret = Deno.env.get("INTERNAL_CALL_SECRET");

  if (!secret) {
    console.warn(
      "INTERNAL_CALL_SECRET absent — vérification d'appel interne INACTIVE. " +
        "Cette fonction est appelable publiquement tant que le secret n'est pas défini.",
    );
    return null;
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
