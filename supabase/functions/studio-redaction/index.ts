import { corsHeadersFor } from "../_shared/auth.ts";
import { appelerIA } from "../_shared/ia.ts";
// studio-redaction (TS, prototype AR-05) : Cléo aide à écrire un article en 5 étapes — idées et stratégie → rédaction optimisée → audit SEO / GEO
// → ton naturel → métadonnées. Chaque sortie est une PROPOSITION renvoyée à l'éditeur : rien n'est enregistré ni publié ici; la publication exige
// une relecture humaine (base). Droit vérifié en base avec le jeton de la personne (lanceur_site → peut_ecrire). Toute estimation de volume est qualitative.

const url = Deno.env.get("SUPABASE_URL") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SYSTEME = `Tu es Cléo, rédactrice web de Lease Lane, gestionnaire immobilier à Québec. Tu écris en français du Québec, au vouvoiement, clair et concret.
Tu ne donnes jamais de chiffres de volume de recherche : seulement « faible », « moyen » ou « élevé », présentés comme une estimation.
Tu ne cites que des règles réelles (Code civil du Québec, Tribunal administratif du logement) et tu signales ce qui doit être vérifié par une personne.
Réponds UNIQUEMENT par un objet JSON valide, sans texte autour.`;
const ETAPES: Record<string, (a: Record<string, string>) => { prompt: string; max: number }> = {
  idees: (a) => ({ max: 900, prompt: `Sujet ou mot-clé : « ${a.mot_cle || a.titre} ». Public : ${a.categorie || "propriétaires"}.
Propose 5 angles d'article. JSON : {"idees": [{"titre": "...", "mot_cle": "...", "intention": "informationnelle|transactionnelle|locale|navigation", "volume": "faible|moyen|eleve", "pourquoi": "..."}]}` }),
  redaction: (a) => ({ max: 3500, prompt: `Rédige l'article « ${a.titre} » (mot-clé principal : « ${a.mot_cle} »), 700 à 1 000 mots, en Markdown : intertitres ##, paragraphes courts,
une réponse directe dans les 2 premières phrases, au moins 2 liens internes Markdown vers des pages de leaselane.ca parmi /gestion-immobiliere, /locataires, /blogue, /faq, /nous-joindre.
${a.corps ? `Reprends et améliore ce brouillon :\n${a.corps.slice(0, 6000)}` : ""}
JSON : {"corps": "...markdown...", "a_verifier": ["..."]}` }),
  audit: (a) => ({ max: 1200, prompt: `Audite cet article pour le référencement (SEO) et les moteurs de réponse IA (GEO). Titre : « ${a.titre} ». Mot-clé : « ${a.mot_cle} ». Méta : « ${a.meta} ».
Texte :\n${(a.corps || "").slice(0, 8000)}
JSON : {"constats": [{"gravite": "haute|moyenne|basse", "champ": "titre|meta|slug|corps|mot_cle", "constat": "...", "correction": "..."}]}` }),
  ton: (a) => ({ max: 3500, prompt: `Réécris ce texte pour qu'il sonne naturel et humain (phrases variées, aucune formule creuse, pas de listes inutiles), sans changer les faits ni les liens.
Texte :\n${(a.corps || "").slice(0, 8000)}
JSON : {"corps": "...markdown..."}` }),
  metadonnees: (a) => ({ max: 600, prompt: `Article : « ${a.titre} », mot-clé « ${a.mot_cle} ». Début du texte :\n${(a.corps || "").slice(0, 2500)}
Propose : un titre de 30 à 60 caractères contenant le mot-clé, une méta-description de 120 à 160 caractères contenant le mot-clé, une adresse (slug) courte contenant le mot-clé, un extrait de 2 phrases.
JSON : {"titre": "...", "meta": "...", "slug": "...", "extrait": "..."}` }),
};

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { etape, article } = await req.json().catch(() => ({}));
  const f = ETAPES[String(etape)];
  if (!f || typeof article !== "object" || !article) return json({ error: "Étape ou article invalide." }, 400);
  const droit = await fetch(`${url}/rest/v1/rpc/lanceur_site`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: "{}" });
  const d = await droit.json().catch(() => null);
  if (!droit.ok || d?.peut_ecrire !== true) return json({ error: d?.message ?? "Votre rôle ne permet pas d’écrire dans le Studio." }, 403);
  const a = Object.fromEntries(Object.entries(article).map(([k, v]) => [k, String(v ?? "").slice(0, 12000)]));
  const { prompt, max } = f(a), debut = Date.now();
  const r = await appelerIA({ prompt, systeme: SYSTEME, maxTokens: max });
  const usage = (r.data as { usage?: { input_tokens?: number; output_tokens?: number } } | null)?.usage;
  // journal des appels IA : métadonnées seulement (jamais le contenu)
  await fetch(`${url}/rest/v1/ai_run_log`, { method: "POST", headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ function_name: `studio-redaction:${etape}`, trigger_source: "studio", duration_ms: Date.now() - debut, input_tokens: usage?.input_tokens ?? null, output_tokens: usage?.output_tokens ?? null, error: r.erreur }) }).catch(() => null);
  if (!r.ok) return json({ error: "Cléo n’a pas pu répondre. Réessayez dans un instant." }, 502);
  const m = r.texte.match(/\{[\s\S]*\}/);
  try { return json({ etape, proposition: JSON.parse(m ? m[0] : r.texte) }); } catch { return json({ error: "Réponse de Cléo illisible : réessayez." }, 502); }
});
