// Point d'entrée unique vers le service d'IA.
//
// POURQUOI CE MODULE. Dix-huit fonctions appelaient api.anthropic.com
// directement, chacune avec son URL et son identifiant de modèle écrits
// en dur. Changer de fournisseur ou de modèle demandait donc dix-huit
// modifications — et un oubli ne se voit pas : la fonction concernée
// continue d'appeler l'ancienne adresse jusqu'à ce que quelqu'un
// remarque qu'elle ne répond plus.
//
// LOI 25. Les données envoyées ici sont celles de tiers : descriptions
// de demandes de service, montants, coordonnées. Les router par une
// passerelle hébergée au Canada (Tonia) plutôt que directement vers les
// États-Unis est ce qui rend ce flux documentable dans le registre des
// transferts hors Québec.
//
// BASCULE. `IA_BASE_URL` absent → appel direct à Anthropic, comportement
// d'avant. Posé → tout passe par la passerelle. Aucune fonction n'a
// besoin d'être modifiée pour basculer d'un côté ou de l'autre, et le
// retour arrière consiste à retirer une variable.

const BASE_URL = Deno.env.get("IA_BASE_URL") || "https://api.anthropic.com";
const CLE = Deno.env.get("IA_API_KEY") || Deno.env.get("ANTHROPIC_API_KEY") || "";

// Pour les fonctions qui construisent elles-mêmes leur requête (images,
// documents PDF, prompt système) : elles gardent leur corps tel quel et
// n'empruntent au module que l'adresse et la clé. Réécrire dix-sept
// requêtes différentes pour les faire passer par appelerIA aurait
// multiplié les occasions d'en casser une.
export const IA_MESSAGES_URL = `${BASE_URL}/v1/messages`;
export const IA_CLE = CLE;

// Identifiant sans suffixe de date : c'est la forme acceptée par l'API
// d'Anthropic comme par Tonia en mode `x-api-key`. Les formes datées
// (claude-haiku-4-5-20251001) sont refusées par un 400 dont le message
// ne dit pas toujours lequel des paramètres pose problème.
export const MODELE_RAPIDE = Deno.env.get("IA_MODELE") || "claude-haiku-4-5";

export type ReponseIA = {
  ok: boolean;
  status: number;
  texte: string;
  /** Message du fournisseur en cas de refus — à journaliser tel quel. */
  erreur: string | null;
  data: any;
};

/**
 * Appelle le service d'IA et rend une réponse uniforme.
 *
 * L'erreur du fournisseur est REMONTÉE, pas avalée : un 400 peut vouloir
 * dire un modèle inconnu, un solde épuisé ou une requête malformée, et
 * ces trois cas se corrigent différemment. Vingt-cinq échecs consécutifs
 * de send-onboarding-reminder sont restés indiagnostiquables parce que
 * ce message partait dans console.error.
 */
export async function appelerIA(opts: {
  prompt: string;
  maxTokens?: number;
  modele?: string;
  systeme?: string;
}): Promise<ReponseIA> {
  const corps: Record<string, unknown> = {
    model: opts.modele || MODELE_RAPIDE,
    max_tokens: opts.maxTokens ?? 800,
    messages: [{ role: "user", content: opts.prompt }],
  };
  if (opts.systeme) corps.system = opts.systeme;
  Object.assign(corps, avecContexte(corps));

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": CLE,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(corps),
    });
  } catch (e) {
    // Réseau injoignable : on le distingue d'un refus du fournisseur,
    // sinon on cherche une erreur de requête là où il n'y a qu'une panne.
    return { ok: false, status: 0, texte: "", erreur: `reseau: ${String(e)}`, data: null };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const motif = data?.error?.message ?? JSON.stringify(data ?? {});
    return { ok: false, status: res.status, texte: "", erreur: String(motif).slice(0, 400), data };
  }
  return { ok: true, status: res.status, texte: data?.content?.[0]?.text ?? "", erreur: null, data };
}

// Gemini (via la passerelle Tonia, route /v1/interactions) : seul modèle
// de la passerelle qui lit une VIDÉO, image et son. Sert à transformer la
// vidéo d'un locataire en texte, que Claude analyse ensuite comme le reste.
// Exige IA_BASE_URL (Tonia) et l'option audio de l'espace de travail :
// sans elle, Tonia répond 200 avec un blocage « audio_not_in_plan ».
export const MODELE_VIDEO = Deno.env.get("IA_MODELE_VIDEO") || "gemini/gemini-3.5-flash-lite";

export type PartieGemini = { type: "text"; text: string } | { type: "video" | "image" | "audio"; data: string; mime_type: string };

export async function decrireMedias(parties: PartieGemini[]): Promise<ReponseIA> {
  if (!Deno.env.get("IA_BASE_URL")) {
    return { ok: false, status: 0, texte: "", erreur: "passerelle absente (IA_BASE_URL) : lecture vidéo indisponible", data: null };
  }
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/v1/interactions`, {
      method: "POST",
      headers: { "x-api-key": CLE, Authorization: `Bearer ${CLE}`, "content-type": "application/json" },
      body: JSON.stringify({ model: MODELE_VIDEO, input: parties }),
    });
  } catch (e) {
    return { ok: false, status: 0, texte: "", erreur: `reseau: ${String(e)}`, data: null };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?._tonia_entitlement_block) {
    const motif = data?._tonia_entitlement_block?.code ?? data?.error?.message ?? JSON.stringify(data ?? {});
    return { ok: false, status: res.status, texte: "", erreur: String(motif).slice(0, 400), data };
  }
  const texte = (data?.steps ?? []).flatMap((s: any) => s?.content ?? []).map((p: any) => p?.text ?? "").join("").trim();
  return { ok: !!texte, status: res.status, texte, erreur: texte ? null : "reponse vide", data };
}

/** Vidéo envoyée telle quelle (limite pratique : ~18 Mo, voir handle-service-request). */
export function decrireVideo(opts: { base64: string; mime: string; consigne: string }): Promise<ReponseIA> {
  return decrireMedias([{ type: "text", text: opts.consigne }, { type: "video", data: opts.base64, mime_type: opts.mime }]);
}

/** Base64 d'un gros fichier sans dépasser la pile (String.fromCharCode par blocs). */
export function versBase64(octets: Uint8Array): string {
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

// Contexte commun à TOUS les appels IA : l'entreprise, ses locataires et ses
// immeubles sont au Québec. Sans lui, un modèle raisonne par défaut en
// dollars américains, avec des lois, des métiers et des numéros d'urgence
// américains. Ajouté automatiquement par appelerIA() et avecContexte().
export const CONTEXTE_QUEBEC = `Contexte fixe : tout ce travail se déroule au Québec, au Canada (gestion immobilière résidentielle). Les immeubles, locataires, propriétaires et travailleurs sont au Québec.
- Langue : français québécois, clair et simple ; tutoiement avec les locataires et travailleurs, sauf indication contraire.
- Argent : dollars canadiens ($). Estime les coûts selon le marché québécois (main-d'œuvre, pièces, déplacement). Les taxes (TPS 5 % et TVQ 9,975 %) sont en sus sauf mention contraire.
- Droit applicable : Code civil du Québec (le locateur doit maintenir le logement en bon état d'habitabilité et faire les réparations nécessaires ; réparations urgentes, art. 1865) ; litiges locatifs devant le Tribunal administratif du logement (TAL) ; travaux de construction, plomberie, électricité et gaz par des entreprises détenant une licence de la Régie du bâtiment du Québec (RBQ) ; renseignements personnels protégés par la Loi 25. N'invente jamais un article de loi : si tu n'es pas sûr, dis-le.
- Climat : hivers rigoureux (gel des tuyaux, perte de chauffage = situation urgente, condensation et moisissure).
- Urgences : danger immédiat → 911 ; odeur de gaz → sortir du logement puis appeler Énergir (1 800 361-8003) ou le 911 ; panne ou fils électriques endommagés → Hydro-Québec (1 800 790-2424) ; question de santé → Info-Santé 811.`;

/** Ajoute le contexte québécois au prompt système d'une requête Messages. */
export function avecContexte<T extends Record<string, unknown>>(corps: T): T {
  const s = corps.system;
  if (Array.isArray(s)) return { ...corps, system: [{ type: "text", text: CONTEXTE_QUEBEC }, ...s] };
  return { ...corps, system: typeof s === "string" && s ? `${CONTEXTE_QUEBEC}\n\n${s}` : CONTEXTE_QUEBEC };
}
