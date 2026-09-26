// Vérification exécutable du module partagé : `deno test --allow-env
// supabase/functions/_shared/auth_test.ts`. Le fetch global est remplacé
// par un faux, donc aucun appel réseau ni projet Supabase n'est requis.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ALLOWED_ORIGINS, corsHeadersFor, requireUser, requireUserWithMfa, verifySupabaseJwt } from "./auth.ts";

const realFetch = globalThis.fetch;
function stubFetch(status: number, body: unknown) {
  globalThis.fetch = () =>
    Promise.resolve(new Response(JSON.stringify(body), { status })) as unknown as ReturnType<typeof realFetch>;
}
const req = (auth?: string) =>
  new Request("https://example.test", { headers: auth ? { Authorization: auth } : {} });

Deno.test("origine non autorisée retombe sur l'origine canonique", () => {
  // L'origine canonique se DÉDUIT de la liste plutôt que d'être écrite en
  // dur : ce test figeait l'ancien domaine et a échoué à la bascule
  // du 2026-09-11, alors que le comportement testé n'avait pas changé.
  const canonique = ALLOWED_ORIGINS[0];
  assertEquals(corsHeadersFor("https://evil.test")["Access-Control-Allow-Origin"], canonique);
  assertEquals(corsHeadersFor(null)["Access-Control-Allow-Origin"], canonique);
});

Deno.test("origine autorisée est reflétée, avec Vary: Origin", () => {
  for (const origine of ALLOWED_ORIGINS) {
    const h = corsHeadersFor(origine);
    assertEquals(h["Access-Control-Allow-Origin"], origine, `${origine} devrait être reflétée`);
    assertEquals(h["Vary"], "Origin");
  }
});

Deno.test("seules les origines leaselane.ca sont acceptées", () => {
  // L'ancien domaine a été retiré le 2026-09-26 : il n'héberge plus rien,
  // et le garder ouvrait une origine sans propriétaire actif.
  assert(ALLOWED_ORIGINS.includes("https://leaselane.ca"));
  for (const o of ALLOWED_ORIGINS) assert(/^https:\/\/(www\.)?leaselane\.ca$/.test(o), `origine inattendue : ${o}`);
});

Deno.test("jeton falsifié est rejeté (critère d'acceptation P3)", async () => {
  stubFetch(401, { msg: "invalid JWT" });
  try {
    assertEquals(await verifySupabaseJwt("jeton.falsifie", "https://p.supabase.co"), null);
    const out = await requireUser(req("Bearer jeton.falsifie"), corsHeadersFor(null));
    assertEquals("response" in out && out.response.status, 401);
  } finally {
    globalThis.fetch = realFetch;
  }
});

Deno.test("en-tête Authorization absent est rejeté sans appel réseau", async () => {
  globalThis.fetch = (() => {
    throw new Error("aucun appel réseau ne devrait avoir lieu");
  }) as unknown as typeof realFetch;
  try {
    const out = await requireUser(req(), corsHeadersFor(null));
    assertEquals("response" in out && out.response.status, 401);
  } finally {
    globalThis.fetch = realFetch;
  }
});

Deno.test("réponse Auth 200 sans id est rejetée", async () => {
  stubFetch(200, { email: "a@b.ca" }); // pas de champ id
  try {
    assertEquals(await verifySupabaseJwt("jeton.sans.id", "https://p.supabase.co"), null);
  } finally {
    globalThis.fetch = realFetch;
  }
});

Deno.test("jeton valide renvoie sub = id de l'usager", async () => {
  stubFetch(200, { id: "u-123", email: "a@b.ca" });
  try {
    const out = await requireUser(req("Bearer jeton.valide"), corsHeadersFor(null));
    assertEquals("userId" in out && out.userId, "u-123");
  } finally {
    globalThis.fetch = realFetch;
  }
});

// ---- Deuxième facteur (lot P4) ----

// Fabrique un JWT non signé portant l'aal voulu. La signature n'a pas
// d'importance ici : le faux fetch tient le rôle du service Auth, et
// c'est précisément ce que le code de production exige — signature
// validée d'abord, corps lu ensuite.
function jwtWithAal(aal: string | null) {
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(aal ? { sub: "u-1", aal } : { sub: "u-1" })}.sig`;
}

Deno.test("session aal1 (mot de passe seul) est refusée quand MFA exigé", async () => {
  Deno.env.set("MFA_ENFORCE", "true");
  // Compte DÉJÀ inscrit (facteur vérifié) : la garde
  // anti-verrouillage ne s'applique pas, c'est bien le
  // durcissement aal1 -> refus qui est vérifié ici.
  stubFetch(200, { id: "u-1", factors: [{ status: "verified" }] });
  try {
    const out = await requireUserWithMfa(req(`Bearer ${jwtWithAal("aal1")}`), corsHeadersFor(null));
    assertEquals("response" in out && out.response.status, 403);
    const body = "response" in out ? await out.response.json() : null;
    assertEquals(body?.code, "mfa_required");
  } finally {
    globalThis.fetch = realFetch;
    Deno.env.delete("MFA_ENFORCE");
  }
});

Deno.test("session aal2 est acceptée", async () => {
  Deno.env.set("MFA_ENFORCE", "true");
  stubFetch(200, { id: "u-1" });
  try {
    const out = await requireUserWithMfa(req(`Bearer ${jwtWithAal("aal2")}`), corsHeadersFor(null));
    assertEquals("userId" in out && out.userId, "u-1");
    assertEquals("aal" in out && out.aal, "aal2");
  } finally {
    globalThis.fetch = realFetch;
    Deno.env.delete("MFA_ENFORCE");
  }
});

Deno.test("jeton sans claim aal est refusé quand MFA exigé", async () => {
  Deno.env.set("MFA_ENFORCE", "true");
  // Compte DÉJÀ inscrit (facteur vérifié) : la garde
  // anti-verrouillage ne s'applique pas, c'est bien le
  // durcissement aal1 -> refus qui est vérifié ici.
  stubFetch(200, { id: "u-1", factors: [{ status: "verified" }] });
  try {
    const out = await requireUserWithMfa(req(`Bearer ${jwtWithAal(null)}`), corsHeadersFor(null));
    assertEquals("response" in out && out.response.status, 403);
  } finally {
    globalThis.fetch = realFetch;
    Deno.env.delete("MFA_ENFORCE");
  }
});

Deno.test("MFA_ENFORCE=false laisse passer aal1 (fenêtre d'inscription)", async () => {
  Deno.env.set("MFA_ENFORCE", "false");
  stubFetch(200, { id: "u-1" });
  try {
    const out = await requireUserWithMfa(req(`Bearer ${jwtWithAal("aal1")}`), corsHeadersFor(null));
    assertEquals("userId" in out && out.userId, "u-1");
  } finally {
    globalThis.fetch = realFetch;
    Deno.env.delete("MFA_ENFORCE");
  }
});

Deno.test("MFA est exigé par défaut, sans réglage explicite", async () => {
  Deno.env.delete("MFA_ENFORCE");
  // Compte DÉJÀ inscrit (facteur vérifié) : la garde
  // anti-verrouillage ne s'applique pas, c'est bien le
  // durcissement aal1 -> refus qui est vérifié ici.
  stubFetch(200, { id: "u-1", factors: [{ status: "verified" }] });
  try {
    const out = await requireUserWithMfa(req(`Bearer ${jwtWithAal("aal1")}`), corsHeadersFor(null));
    assertEquals("response" in out && out.response.status, 403);
  } finally {
    globalThis.fetch = realFetch;
  }
});

Deno.test("un jeton falsifié est rejeté AVANT toute lecture de l'aal", async () => {
  // Le risque de conception : décoder le corps d'un jeton non vérifié.
  // Un jeton forgé qui se déclare aal2 doit échouer en 401 (signature),
  // jamais réussir sur la foi de son propre corps.
  Deno.env.set("MFA_ENFORCE", "true");
  stubFetch(401, { msg: "invalid JWT" });
  try {
    const out = await requireUserWithMfa(req(`Bearer ${jwtWithAal("aal2")}`), corsHeadersFor(null));
    assertEquals("response" in out && out.response.status, 401);
  } finally {
    globalThis.fetch = realFetch;
    Deno.env.delete("MFA_ENFORCE");
  }
});

// ---- Garde anti-verrouillage (lot P4) ----

Deno.test("compte SANS facteur inscrit n'est pas verrouillé dehors", async () => {
  // Le cas qui verrouillait tout le monde : MFA_ENFORCE=true déployé avant
  // que les admins se soient inscrits. Le compte doit passer, et
  // l'interface doit être prévenue qu'une inscription est requise.
  Deno.env.set("MFA_ENFORCE", "true");
  stubFetch(200, { id: "u-1", factors: [] });
  try {
    const out = await requireUserWithMfa(req(`Bearer ${jwtWithAal("aal1")}`), corsHeadersFor(null));
    assertEquals("userId" in out && out.userId, "u-1");
    assertEquals("mfaEnrollmentRequired" in out && out.mfaEnrollmentRequired, true);
  } finally {
    globalThis.fetch = realFetch;
    Deno.env.delete("MFA_ENFORCE");
  }
});

Deno.test("facteur inscrit mais NON vérifié ne suffit pas à contourner", async () => {
  // Une inscription abandonnée en cours de route laisse un facteur
  // 'unverified'. Il ne doit pas compter, sinon la garde devient une porte
  // ouverte permanente : il suffirait de commencer une inscription.
  Deno.env.set("MFA_ENFORCE", "true");
  stubFetch(200, { id: "u-1", factors: [{ status: "unverified" }] });
  try {
    const out = await requireUserWithMfa(req(`Bearer ${jwtWithAal("aal1")}`), corsHeadersFor(null));
    assertEquals("userId" in out && out.userId, "u-1");
    assertEquals("mfaEnrollmentRequired" in out && out.mfaEnrollmentRequired, true);
  } finally {
    globalThis.fetch = realFetch;
    Deno.env.delete("MFA_ENFORCE");
  }
});

Deno.test("facteur VÉRIFIÉ + session aal1 est refusé (la garde ne s'applique plus)", async () => {
  // Le durcissement réel : dès qu'un facteur vérifié existe, un mot de
  // passe seul ne passe plus. C'est l'état visé après inscription.
  Deno.env.set("MFA_ENFORCE", "true");
  stubFetch(200, { id: "u-1", factors: [{ status: "verified" }] });
  try {
    const out = await requireUserWithMfa(req(`Bearer ${jwtWithAal("aal1")}`), corsHeadersFor(null));
    assertEquals("response" in out && out.response.status, 403);
    const body = "response" in out ? await out.response.json() : null;
    assertEquals(body?.code, "mfa_required");
  } finally {
    globalThis.fetch = realFetch;
    Deno.env.delete("MFA_ENFORCE");
  }
});

Deno.test("facteur vérifié + session aal2 passe sans drapeau d'inscription", async () => {
  Deno.env.set("MFA_ENFORCE", "true");
  stubFetch(200, { id: "u-1", factors: [{ status: "verified" }] });
  try {
    const out = await requireUserWithMfa(req(`Bearer ${jwtWithAal("aal2")}`), corsHeadersFor(null));
    assertEquals("userId" in out && out.userId, "u-1");
    // Le drapeau doit être absent : `in` renvoie false, pas undefined.
    assertEquals("mfaEnrollmentRequired" in out, false);
  } finally {
    globalThis.fetch = realFetch;
    Deno.env.delete("MFA_ENFORCE");
  }
});
