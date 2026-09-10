// Vérification du JWT et en-têtes CORS, partagés par les fonctions
// authentifiées. Avant ce module, ce code était copié à l'identique dans
// 15 fonctions (JWT) et 30 fonctions (CORS) : un correctif de sécurité
// devait donc être appliqué 15 ou 30 fois, et un oubli ne se voyait pas.
//
// Liste blanche d'origines : évite d'exposer les fonctions à un site
// tiers qui embarquerait un appel authentifié depuis le navigateur d'un
// usager (CSRF via fetch). Les appels serveur à serveur (cron, webhooks,
// autre fonction edge) n'envoient pas d'en-tête Origin et ne sont donc
// pas affectés par ce contrôle.
export const ALLOWED_ORIGINS = ["https://portailgestion.ca", "https://www.portailgestion.ca"];

export function corsHeadersFor(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
    // Durcissement (Lot 7 TWIM) : ces en-têtes ne coûtent rien et
    // réduisent la surface d'attaque même si le contenu JSON renvoyé
    // n'est pas du HTML — défense en profondeur, pas une réaction à un
    // vecteur d'attaque identifié ici.
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

// Vérifie le JWT en le faisant valider par le service Auth de Supabase
// lui-même (GET /auth/v1/user) plutôt qu'en réimplémentant la
// cryptographie de vérification. La passerelle Edge Functions a un bug
// connu qui rejette à tort les JWT signés en ES256 quand verify_jwt=true
// est réglé au niveau plateforme (github.com/supabase/supabase/issues/42244)
// — d'où verify_jwt=false dans supabase/config.toml : ce code est la
// seule vérification, et s'appuie sur l'API Auth de Supabase, qui elle
// gère ES256 correctement.
export async function verifySupabaseJwt(
  jwt: string,
  supabaseUrl: string,
): Promise<{ sub: string; [key: string]: unknown } | null> {
  if (!jwt) return null;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      },
    });
    if (!res.ok) return null;
    const user = await res.json().catch(() => null);
    if (!user?.id) return null;
    return { sub: user.id, ...user };
  } catch {
    return null;
  }
}

// Extrait et vérifie le porteur en une étape. Renvoie soit l'identifiant
// de l'usager, soit la réponse 401 à retourner tel quel — les 15 appelants
// produisaient les deux mêmes messages d'erreur, à l'identique.
export async function requireUser(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<{ userId: string; claims: Record<string, unknown> } | { response: Response }> {
  const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  if (!jwt) {
    return {
      response: new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: corsHeaders }),
    };
  }
  const claims = await verifySupabaseJwt(jwt, Deno.env.get("SUPABASE_URL") ?? "");
  if (!claims) {
    return {
      response: new Response(JSON.stringify({ error: "Jeton invalide ou expiré" }), { status: 401, headers: corsHeaders }),
    };
  }
  return { userId: claims.sub as string, claims };
}

// ---- Deuxième facteur (lot P4) ----
//
// L'AAL ("Authenticator Assurance Level") vit dans le corps du JWT, pas
// dans la réponse de GET /auth/v1/user : aal1 = mot de passe seulement,
// aal2 = deuxième facteur vérifié pour CETTE session. On ne peut donc pas
// le déduire de verifySupabaseJwt() seul.
//
// Décoder le corps sans vérifier la signature serait normalement une
// faute. Ici c'est sûr, et seulement parce que l'ordre est imposé :
// verifySupabaseJwt() a DÉJÀ fait valider le jeton par le service Auth
// de Supabase avant qu'on lise quoi que ce soit. Un jeton forgé n'atteint
// jamais ce décodage. Ne jamais appeler decodeAal() sur un jeton non
// vérifié.
function decodeAal(jwt: string): string | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json);
    return typeof claims?.aal === "string" ? claims.aal : null;
  } catch {
    return null;
  }
}

// Exige un deuxième facteur vérifié en plus d'une session valide. À
// utiliser sur toute fonction à privilèges — l'équivalent côté serveur de
// l'écran de défi : sans ça, un mot de passe volé suffit, quel que soit
// ce que l'interface affiche.
//
// MFA_ENFORCE=false permet de déployer le code avant que les comptes
// existants aient inscrit leur facteur (sinon le premier déploiement
// verrouille tout le monde dehors, y compris l'admin qui doit s'inscrire).
// À passer à true dès que l'inscription est faite — c'est ce réglage que
// le critère d'acceptation P4 exige de démontrer.
export async function requireUserWithMfa(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<
  | { userId: string; claims: Record<string, unknown>; aal: string | null; mfaEnrollmentRequired?: boolean }
  | { response: Response }
> {
  const auth = await requireUser(req, corsHeaders);
  if ("response" in auth) return auth;

  const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const aal = decodeAal(jwt);
  const enforce = (Deno.env.get("MFA_ENFORCE") ?? "true").toLowerCase() !== "false";

  // Garde anti-verrouillage. Exiger aal2 d'un compte qui n'a AUCUN facteur
  // inscrit le met dehors définitivement : le mot de passe donne aal1, et
  // aal2 exige un facteur qu'il n'a pas. Avec MFA_ENFORCE=true déployé
  // avant que les admins se soient inscrits, les 9 fonctions à privilèges
  // répondent 403 à tout le monde en même temps — portail admin inclus.
  //
  // GET /auth/v1/user renvoie la liste des facteurs du compte : s'il n'en a
  // aucun de vérifié, on le laisse passer pour qu'il PUISSE s'inscrire, et
  // on le signale dans la réponse. L'inscription elle-même parle
  // directement à Supabase Auth, pas à ces fonctions, mais le portail doit
  // rester utilisable pour y arriver.
  //
  // Ce n'est pas un contournement : un compte sans facteur est exactement
  // aussi protégé qu'avant ce lot. Le durcissement s'applique dès qu'un
  // facteur existe, et devient inévitable une fois tous les comptes
  // inscrits. mfa_enrollment_required dit à l'interface d'exiger
  // l'inscription immédiatement.
  const facteurs = Array.isArray((auth.claims as { factors?: unknown[] }).factors)
    ? ((auth.claims as { factors: { status?: string }[] }).factors)
    : [];
  const aAuMoinsUnFacteur = facteurs.some((f) => f?.status === "verified");

  if (enforce && !aAuMoinsUnFacteur) {
    return {
      userId: auth.userId,
      claims: auth.claims,
      aal,
      mfaEnrollmentRequired: true,
    };
  }

  if (enforce && aal !== "aal2") {
    return {
      response: new Response(
        JSON.stringify({
          error: "Deuxième facteur requis",
          // Le client distingue ce cas d'un 401 : il ne faut pas
          // déconnecter l'usager, mais lui présenter l'écran de défi.
          code: "mfa_required",
          aal,
        }),
        { status: 403, headers: corsHeaders },
      ),
    };
  }
  return { userId: auth.userId, claims: auth.claims, aal };
}
