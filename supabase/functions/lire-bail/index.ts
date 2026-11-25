// Lire un bail (Nouveau client › « Importer le bail ») : le bail du TAL en PDF ou en photo → locataires, logement, loyer, dates.
// Rien n'est créé ici : l'équipe vérifie la fiche préremplie avant « Créer le client » (Loi 25 : décision humaine).
// Le logement est choisi parmi les logements libres ou en préavis que la personne a le droit de voir (lanceur_logements, son jeton).
import { aLeDroit, corsHeadersFor, requireUserWithMfa } from "../_shared/auth.ts";
import { IA_MESSAGES_URL, IA_CLE, modelePour, avecContexte } from "../_shared/ia.ts";

const PROMPT_VERSION = "lire-bail-v1";
const TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_B64 = 20 * 1024 * 1024; // ≈ 15 Mo de fichier

import { estUnBail, extraireJson, nettoyer, type Logement } from "./lecture.ts";
import { BUREAUTIQUE, docxDepuisBlocs, texteDe, texteDePdf, type Bloc } from "./bureautique.ts";
import { versBase64 } from "../_shared/ia.ts";

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const auth = await requireUserWithMfa(req, cors);
  if ("response" in auth) return auth.response;
  if (!(await aLeDroit(req, "clients.ecrire"))) return json({ error: "Votre rôle ne permet pas de créer un client." }, 403);

  // action « transcrire » : copie modifiable (.docx) du bail, transcrite par l'IA (demande de Greg, 2026-11-25).
  const { fichier, mime, action } = await req.json().catch(() => ({}));
  if (typeof fichier !== "string" || !(TYPES.includes(mime) || BUREAUTIQUE[mime])) {
    return json({ error: "Déposez le bail en PDF, Word (.docx), PowerPoint (.pptx), OpenDocument (.odt) ou photo (JPG, PNG). Un ancien .doc ou .ppt : enregistrez-le d'abord en .docx ou en PDF." }, 400);
  }
  if (fichier.length > MAX_B64) return json({ error: "Le fichier dépasse 15 Mo." }, 413);
  // Word, PowerPoint, OpenDocument, texte : l'IA lit le texte tiré du fichier (un PDF ou une photo est lu tel quel).
  let texteBureautique: string | null = null;
  if (BUREAUTIQUE[mime]) {
    try { texteBureautique = texteDe(BUREAUTIQUE[mime], Uint8Array.from(atob(fichier), (c) => c.charCodeAt(0))); } catch { texteBureautique = ""; }
    if (texteBureautique.replace(/\s/g, "").length < 40) return json({ error: "Ce fichier ne contient pas de texte lisible (un bail numérisé collé dans Word, par exemple). Déposez plutôt le PDF ou une photo du bail." }, 422);
  } else if (mime === "application/pdf") {
    // PDF rempli à l'ordinateur : on envoie son texte (voir texteDePdf). PDF numérisé : envoyé tel quel.
    const t = await texteDePdf(Uint8Array.from(atob(fichier), (c) => c.charCodeAt(0)));
    if (t.replace(/\s/g, "").length >= 200) texteBureautique = t;
  }

  const url = Deno.env.get("SUPABASE_URL")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lr = await fetch(`${url}/rest/v1/rpc/lanceur_logements`, {
    method: "POST", body: JSON.stringify({ p: {} }),
    headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY")!, Authorization: req.headers.get("Authorization")!, "Content-Type": "application/json" },
  });
  const logements: Logement[] = lr.ok ? ((await lr.json())?.vacants ?? []) : [];

  const bloc = texteBureautique !== null
    ? { type: "document", source: { type: "text", media_type: "text/plain", data: texteBureautique } }
    : mime === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: mime, data: fichier } }
    : { type: "image", source: { type: "base64", media_type: mime, data: fichier } };
  if (action === "transcrire") return await transcrire(bloc, mime, url, service, json);
  const consigne = `Voici un bail résidentiel du Québec (souvent le formulaire obligatoire du Tribunal administratif du logement : section A les parties, B le logement, C la durée, D le loyer).
Lis-le et réponds UNIQUEMENT par un objet JSON, sans texte autour :
{
  "est_un_bail": true seulement si ce document est un bail de logement (le contrat de location lui-même, signé ou à signer, sur le formulaire du TAL ou non); false pour tout autre document, même s'il contient des noms, une adresse ou un montant (facture, lettre, avis de modification ou de renouvellement, reçu, annonce, règlement d'immeuble, menu…),
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
  // Forme de la réponse au journal (jamais son contenu : il contient des noms) pour diagnostiquer une lecture ratée.
  const forme = `fin=${data?.stop_reason ?? "?"} blocs=${(data?.content ?? []).map((b: { type: string }) => b.type).join("+") || "aucun"} texte=${texte.length} car.${texte.trimStart().startsWith("{") ? " json?" : ""}`;
  if (!brut) { await journal(`reponse illisible (${forme})`); return json({ error: mime === "application/pdf" && texteBureautique === null ? "Ce PDF est une numérisation que Cléo n'a pas pu lire. Déposez plutôt une photo nette du bail (JPG ou PNG)." : "Le bail n'a pas pu être lu. Essayez une copie plus nette." }, 422); }
  const bail = nettoyer(brut, logements);
  // Rien qui ressemble à un bail (ni locataire, ni adresse, ni loyer) : on le dit plutôt que de montrer une fiche vide.
  if (!estUnBail(brut) || (!bail.locataires.length && !bail.adresse && !bail.loyer)) { await journal("pas un bail"); return json({ error: "Ce document ne ressemble pas à un bail. Déposez le bail signé (PDF ou photo)." }, 422); }
  await journal(null);
  return json({ bail });
});

// Copie modifiable : l'IA transcrit le bail en blocs (titres, paragraphes, tableaux, cases), puis on écrit un .docx.
async function transcrire(bloc: unknown, mime: string, url: string, service: string, json: (c: unknown, s?: number) => Response): Promise<Response> {
  const consigne = `Transcris fidèlement ce bail pour en faire une copie modifiable. Réponds UNIQUEMENT par un objet JSON, sans texte autour :
{"titre": "titre du document", "blocs": [{"type": "titre", "texte": "…"}, {"type": "paragraphe", "texte": "…"}, {"type": "tableau", "lignes": [["…", "…"]]}, {"type": "case", "texte": "…", "coche": true}]}
Règles : garde l'ordre, le texte exact et la langue du document; n'ajoute, ne résume et ne corrige rien.
Une section ou un en-tête devient un « titre »; un champ du formulaire avec sa valeur devient « Libellé : valeur » (paragraphe) ou une ligne de tableau;
une case à cocher devient une « case » (coche true si elle est cochée); un passage illisible s'écrit [illisible]; une signature s'écrit [signature].`;
  const debut = Date.now(), modele = await modelePour("lire-bail", "claude-opus-5-5");
  const journal = (erreur: string | null) => fetch(`${url}/rest/v1/ai_run_log`, {
    method: "POST", headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
    body: JSON.stringify({ function_name: "lire-bail", trigger_source: "edge_function_call", entity_type: "leases", prompt_version: "transcrire-bail-v1",
      model_version: modele, input_summary: `copie modifiable (${mime})`, duration_ms: Date.now() - debut, error: erreur }),
  }).catch(() => null);
  const res = await fetch(IA_MESSAGES_URL, {
    method: "POST", headers: { "x-api-key": IA_CLE, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify(avecContexte({ model: modele, max_tokens: 16000, messages: [{ role: "user", content: [bloc, { type: "text", text: consigne }] }] })),
  }).catch(() => null);
  const data = res ? await res.json().catch(() => ({})) : {};
  if (!res?.ok) { await journal(`ia ${res?.status ?? "reseau"}: ${String(data?.error?.message ?? "").slice(0, 300)}`); return json({ error: "La copie modifiable n'a pas pu être préparée. Réessayez dans un instant." }, 502); }
  const texte = (data?.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
  const brut = extraireJson(texte) as { titre?: unknown; blocs?: unknown } | null;
  const TYPES_BLOC = ["titre", "paragraphe", "tableau", "case"];
  const blocs: Bloc[] = Array.isArray(brut?.blocs) ? (brut!.blocs as Bloc[]).filter((b) => b && TYPES_BLOC.includes(b.type)).map((b) => ({
    type: b.type, texte: typeof b.texte === "string" ? b.texte : undefined, coche: b.coche === true,
    lignes: Array.isArray(b.lignes) ? b.lignes.filter(Array.isArray).map((l) => l.map((c) => String(c ?? ""))) : undefined,
  })) : [];
  if (!blocs.length) { await journal("transcription vide"); return json({ error: "Le bail n'a pas pu être transcrit. Essayez une copie plus nette." }, 422); }
  await journal(null);
  return json({ docx: versBase64(docxDepuisBlocs(typeof brut?.titre === "string" && brut.titre ? brut.titre : "Bail", blocs)), blocs: blocs.length });
}
