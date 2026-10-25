import { appelerIA, MODELE_RAPIDE, modelePour } from "../_shared/ia.ts";
// classer-demande (e08) : pendant que l'équipe tape une nouvelle demande, Cléo suggère la catégorie et l'urgence d'après la description.
// Suggestion seulement : la personne garde la main sur les champs; la demande créée repasse ensuite par handle-service-request.
// Réservé à l'équipe (jeton de la personne, vérifié par lanceur_moi). Appel tracé dans ai_run_log (sans confiance : pas une décision automatisée).

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
export const CATEGORIES = ["Plomberie", "Électricité", "Chauffage", "Serrurerie", "Électroménagers", "Portes et fenêtres", "Structure", "Extermination", "Autre"];
const URGENCES = ["normale", "elevee", "urgence"];
const SYSTEME = `Tu classes une demande d'entretien d'un logement locatif au Québec.
Réponds UNIQUEMENT par un objet JSON : {"categorie": une de ${JSON.stringify(CATEGORIES)}, "urgence": "normale" | "elevee" | "urgence", "raison": une phrase de 12 mots au plus}.
« urgence » : danger pour les personnes ou le bâtiment (inondation active, gaz, fumée, pas de chauffage l'hiver, porte extérieure qui ne ferme pas). « elevee » : à régler sous 48 h. Sinon « normale ».
La raison cite ce qui, dans la description, justifie le choix. N'invente rien.`;

export function lire(texte: string): { categorie: string; urgence: string; raison: string } | null {
  const m = texte.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]);
    if (!CATEGORIES.includes(o.categorie) || !URGENCES.includes(o.urgence)) return null;
    return { categorie: o.categorie, urgence: o.urgence, raison: String(o.raison ?? "").slice(0, 160) };
  } catch { return null; }
}

if (import.meta.main) Deno.serve(async (req) => {
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "POST seulement." }, 405);
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const moi = await fetch(`${url}/rest/v1/rpc/lanceur_moi`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: "{}" });
  const role = moi.ok ? (await moi.json().catch(() => null))?.role : null;
  if (!role) return json({ error: "Réservé à l'équipe." }, 403);
  const { description } = await req.json().catch(() => ({}));
  if (typeof description !== "string" || description.trim().length < 15 || description.length > 2000) return json({ error: "Description de 15 à 2 000 caractères." }, 422);

  const debut = Date.now(), modele = await modelePour("classer-demande", MODELE_RAPIDE);
  const r = await appelerIA({ prompt: description.trim(), systeme: SYSTEME, maxTokens: 150, modele });
  const s = r.ok ? lire(r.texte) : null;
  await fetch(`${url}/rest/v1/ai_run_log`, { method: "POST", headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ function_name: "classer-demande", trigger_source: "lanceur:nouvelle_demande", prompt_version: "e08-v1", model_version: modele,
      input_summary: description.slice(0, 300), output_summary: s ? `${s.categorie} / ${s.urgence}` : null, duration_ms: Date.now() - debut,
      input_tokens: r.data?.usage?.input_tokens ?? null, output_tokens: r.data?.usage?.output_tokens ?? null, automatic_action_taken: "suggestion_affichee",
      error: r.ok ? (s ? null : "réponse illisible") : `ia ${r.status} : ${r.erreur}` }) }).catch(() => null);
  if (!s) return json({ error: "Cléo n’a pas pu suggérer de catégorie." }, 502);
  return json(s);
});
