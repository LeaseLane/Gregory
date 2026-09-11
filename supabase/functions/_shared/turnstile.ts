// Vérification Cloudflare Turnstile pour les formulaires publics — lot P5.
//
// POURQUOI. Le champ piège et la limite par adresse IP arrêtent les robots
// naïfs et les envois répétés depuis une même machine. Ils n'arrêtent pas
// une campagne qui remplit correctement le formulaire depuis des centaines
// d'adresses différentes — chacune reste alors sous le seuil horaire.
// Turnstile ajoute la couche manquante : « est-ce un navigateur piloté par
// un humain ? », question à laquelle ni le piège ni le compteur ne
// répondent.
//
// Mode « Managed » : invisible pour un visiteur normal, case à cocher
// seulement si le comportement paraît suspect. « Non-interactive » ne
// défie jamais personne, « Invisible » peut bloquer de vraies personnes
// sans qu'elles comprennent pourquoi — d'où Managed.
//
// ⚠️  INACTIF SANS SECRET. Si TURNSTILE_SECRET_KEY n'est pas défini, la
// vérification laisse passer et le signale dans les journaux. C'est le
// même choix que pour appel-interne.ts, et pour la même raison : le
// 2026-08-17, HEALTH_ALERT_SECRET désaligné a coupé les alertes pendant
// 25 jours sans que personne le voie. Refuser par défaut ici bloquerait
// TOUS les formulaires publics — demandes de visite, mandats, inscriptions
// de travailleurs — sur une simple erreur de configuration.
//
// Le durcissement vient de la présence du secret, pas d'un refus aveugle.

const ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Retourne `null` si la soumission peut continuer, ou une `Response` à
 * renvoyer telle quelle si le jeton est absent ou invalide.
 *
 * @param token  Jeton posé par le widget (champ `cf-turnstile-response`).
 * @param ip     Adresse du visiteur, transmise à Cloudflare pour l'analyse.
 */
export async function refuserSiRobot(
  token: unknown,
  ip: string | null,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");

  if (!secret) {
    console.warn(
      "TURNSTILE_SECRET_KEY absent — vérification anti-robot INACTIVE. " +
        "Les formulaires publics ne sont protégés que par le champ piège et la limite par IP.",
    );
    return null;
  }

  const jeton = typeof token === "string" ? token.trim() : "";
  if (!jeton) {
    return refus(corsHeaders, "jeton_absent");
  }

  const params = new URLSearchParams({ secret, response: jeton });
  if (ip) params.set("remoteip", ip);

  let data: { success?: boolean; "error-codes"?: string[] };
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    data = await res.json();
  } catch (e) {
    // Cloudflare injoignable. On laisse passer plutôt que de bloquer un
    // client légitime à cause d'une panne chez un tiers : le champ piège
    // et la limite par IP restent en place derrière.
    console.error("Turnstile injoignable, soumission acceptée sans vérification :", e);
    return null;
  }

  if (!data.success) {
    console.warn("Turnstile a refusé la soumission :", data["error-codes"]);
    return refus(corsHeaders, "jeton_invalide");
  }

  return null;
}

/**
 * Message volontairement identique dans les deux cas : un robot ne doit
 * pas pouvoir distinguer « jeton absent » de « jeton refusé », sous peine
 * de pouvoir sonder la protection.
 */
function refus(corsHeaders: Record<string, string>, raison: string): Response {
  console.warn("Soumission refusée par Turnstile :", raison);
  return new Response(
    JSON.stringify({
      error: "Vérification de sécurité échouée. Recharge la page et réessaie.",
    }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
