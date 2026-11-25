// Moneris Checkout, serveur à serveur (26 nov. 2026). Aucun numéro de carte ne passe ici : le locataire le tape dans la page de Moneris.
// Secrets : MONERIS_ENV (qa | prod), MONERIS_STORE_ID, MONERIS_API_TOKEN, MONERIS_CHECKOUT_ID. Préprod = magasin d'essai public (qa).
export type EnvMoneris = "qa" | "prod";
export const configMoneris = () => {
  const env = Deno.env.get("MONERIS_ENV") === "prod" ? "prod" : "qa" as EnvMoneris;
  const c = { env, store_id: Deno.env.get("MONERIS_STORE_ID") ?? "", api_token: Deno.env.get("MONERIS_API_TOKEN") ?? "", checkout_id: Deno.env.get("MONERIS_CHECKOUT_ID") ?? "" };
  return c.store_id && c.api_token && c.checkout_id ? c : null;
};
const URL_MONERIS = { qa: "https://gatewayt.moneris.com/chktv2/request/request.php", prod: "https://gateway.moneris.com/chktv2/request/request.php" };

async function appel(env: EnvMoneris, corps: Record<string, unknown>): Promise<Record<string, any>> {
  const r = await fetch(URL_MONERIS[env], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps), signal: AbortSignal.timeout(20000) });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d?.response) throw new Error(`Moneris ne répond pas (${r.status}).`);
  return d.response;
}

/** Billet (30 min) pour un montant. order_no unique par tentative : « ll-<id> ». */
export async function precharger(c: NonNullable<ReturnType<typeof configMoneris>>, t: { id: string; montant: number; reference: string | null; langue: string }) {
  const r = await appel(c.env, { store_id: c.store_id, api_token: c.api_token, checkout_id: c.checkout_id, environment: c.env, action: "preload",
    txn_total: t.montant.toFixed(2), order_no: `ll-${t.id}`, ...(t.reference ? { cust_id: t.reference.replace(/[<>$%=?^"{}[\]\\]/g, "").slice(0, 50) } : {}),
    language: t.langue === "en" ? "en" : "fr" });
  if (r.success !== "true" || !r.ticket) throw new Error("Moneris a refusé de préparer le paiement.");
  return String(r.ticket);
}

/** Reçu chez Moneris (jamais celui du navigateur). Renvoie l'objet « response » tel quel; « success: false » = pas terminé. */
export const recu = (c: NonNullable<ReturnType<typeof configMoneris>>, ticket: string) =>
  appel(c.env, { store_id: c.store_id, api_token: c.api_token, checkout_id: c.checkout_id, environment: c.env, action: "receipt", ticket });
