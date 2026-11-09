// Lire un bail (Nouveau client › « Importer le bail ») : le bail du TAL en PDF ou en photo → locataires, logement, loyer, dates.
// Rien n'est créé ici : l'équipe vérifie la fiche préremplie avant « Créer le client » (Loi 25 : décision humaine).
// Le logement est choisi parmi les logements libres ou en préavis que la personne a le droit de voir (lanceur_logements, son jeton).
import { aLeDroit, corsHeadersFor, requireUserWithMfa } from "../_shared/auth.ts";
import { IA_MESSAGES_URL, IA_CLE, modelePour, avecContexte } from "../_shared/ia.ts";

const PROMPT_VERSION = "lire-bail-v1";
const TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_B64 = 20 * 1024 * 1024; // ≈ 15 Mo de fichier

import { extraireJson, nettoyer, type Logement } from "./lecture.ts";

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const auth = await requireUserWithMfa(req, cors);
  if ("response" in auth) return auth.response;
  if (!(await aLeDroit(req, "clients.ecrire"))) return json({ error: "Votre rôle ne permet pas de créer un client." }, 403);

  const { fichier, mime } = await req.json().catch(() => ({}));
  if (typeof fichier !== "string" || !TYPES.includes(mime)) return json({ error: "Déposez le bail en PDF, JPG ou PNG." }, 400);
  if (fichier.length > MAX_B64) return json({ error: "Le fichier dépasse 15 Mo." }, 413);

  const url = Deno.env.get("SUPABASE_URL")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lr = await fetch(`${url}/rest/v1/rpc/lanceur_logements`, {
    method: "POST", body: JSON.stringify({ p: {} }),
    headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY")!, Authorization: req.headers.get("Authorization")!, "Content-Type": "application/json" },
  });
  const logements: Logement[] = lr.ok ? ((await lr.json())?.vacants ?? []) : [];

  const bloc = mime === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: mime, data: fichier } }
    : { type: "image", source: { type: "base64", media_type: mime, data: fichier } };
  const consigne = `Voici un bail résidentiel du Québec (souvent le formulaire obligatoire du Tribunal administratif du logement : section A les parties, B le logement, C la durée, D le loyer).
Lis-le et réponds UNIQUEMENT par un objet JSON, sans texte autour :
{
  "locataires": [{"nom": "Prénom Nom", "courriel": "… ou null", "telephone": "… ou null"}],
  "adresse": "numéro, rue, ville du logement loué, ou null",
  "logement": "numéro d'appartement, ou null",
  "loyer": loyer mensuel de base en dollars (nombre), ou null,
  "debut": "AAAA-MM-JJ", ou null,
  "fin": "AAAA-MM-JJ", ou null (bail à durée indéterminée),
  "unit_id": "l'id du logement de la liste ci-dessous qui correspond à cette adresse et à ce numéro, ou null si aucun ne correspond clairement",
  "remarques": "ce que l'équipe doit vérifier (champ illisible, montant ambigu, services inclus…), ou null"
}
Les locataires sont les personnes de la section « locataire », jamais le locateur ni son mandataire.
Ne devine rien : un champ absent ou illisible vaut null.
Logements libres ou en préavis :
${logements.map((l) => `- ${l.id} : ${l.libelle}`).join("\n") || "(aucun)"}`;

  const debut = Date.now();
  const modele = await modelePour("lire-bail", "claude-opus-5-5");
  const journal = (erreur: string | null) => fetch(`${url}/rest/v1/ai_run_log`, {
    method: "POST", headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
    body: JSON.stringify({ function_name: "lire-bail", trigger_source: "edge_function_call", entity_type: "leases", prompt_version: PROMPT_VERSION,
      model_version: modele, input_summary: `bail importé (${mime})`, duration_ms: Date.now() - debut, error: erreur }),
  }).catch(() => null);

  let res: Response;
  try {
    res = await fetch(IA_MESSAGES_URL, {
      method: "POST", headers: { "x-api-key": IA_CLE, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(avecContexte({ model: modele, max_tokens: 8000, messages: [{ role: "user", content: [bloc, { type: "text", text: consigne }] }] })),
    });
  } catch (e) {
    await journal(`reseau: ${String(e)}`);
    return json({ error: "La lecture du bail n'a pas abouti. Réessayez dans un instant." }, 502);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    await journal(`ia ${res.status}: ${String(data?.error?.message ?? "").slice(0, 300)}`);
    return json({ error: "La lecture du bail n'a pas abouti. Réessayez dans un instant." }, 502);
  }
  // Les modèles récents rendent des blocs de réflexion avant le texte : on prend le bloc texte.
  const texte = (data?.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
  const brut = extraireJson(texte);
  if (!brut) { await journal("reponse illisible"); return json({ error: "Le bail n'a pas pu être lu. Essayez une copie plus nette." }, 422); }
  await journal(null);
  return json({ bail: nettoyer(brut, logements) });
});
