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
