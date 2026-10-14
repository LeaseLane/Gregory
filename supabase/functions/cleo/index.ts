import { corsHeadersFor } from "../_shared/auth.ts";
import { IA_MESSAGES_URL, IA_CLE, MODELE_RAPIDE, avecContexte } from "../_shared/ia.ts";
import { valider, type Fait, type Reponse } from "../_shared/cleo.ts";
// cleo (T8c, e03) : une question en langage courant → réponse structurée qui cite ses sources, et au plus une action proposée.
// Le contexte est lu AVEC LE JETON DE LA PERSONNE (lanceur_cleo_contexte) : Cléo ne voit que ce que la personne voit.
// Cléo n'écrit rien : l'action est une proposition déjà en attente (approuvée par la personne dans le panneau) ou un lien.
// Coût mesuré dans crm.agent_runs (métadonnées seulement).

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const coutCents = (entree: number, sortie: number) => Math.round((entree * 1 + sortie * 5) / 10_000);   // modèle rapide

const SYSTEME = `Tu es Cléo, l'assistante de l'équipe de Lease Lane (gestion immobilière). Tu réponds à une personne de l'équipe, à un propriétaire ou à un locataire (voir « rôle »).
RÈGLES :
- Réponds UNIQUEMENT à partir des faits fournis (JSON). Si les faits ne permettent pas de répondre, dis-le en une phrase et propose où regarder.
- N'invente jamais un nom, un montant, une date ni un article de loi. Les montants et les retards viennent tels quels des faits.
- « constat » : une ou deux phrases qui répondent directement (le chiffre clé d'abord).
- « cartes » : un élément par personne ou dossier concerné (titre = nom, sous = logement et retard ou étape, montant, puce = ce qui est prêt ou à faire; ton « action » si une personne doit décider). 5 au plus.
- « sources » : les objets « source » (libelle, lien) des faits que tu as utilisés, recopiés tels quels.
- « action » : au plus une. Soit {type: "proposition", proposition_id} d'une « Proposition en attente » des faits (la personne l'approuvera), soit {type: "depense", autorisation_id} d'une « Autorisation de dépense en attente » des faits (le propriétaire l'approuvera lui-même), soit {type: "lien", lien} vers une source où la personne agit. Jamais autre chose : tu ne modifies rien.
- Avec un locataire : « action » peut être {type: "intervention", intervention_id} d'une « Intervention à confirmer » des faits (le locataire choisira lui-même : présent, accès autorisé, autre moment), ou {type: "demande", brouillon: {titre, piece, urgence: "normale"|"elevee"|"urgence", description}} quand il décrit un problème dans son logement (il relira et soumettra lui-même). Une demande normale est prise en charge en 48 h; une urgence (fuite, chauffage, électricité, serrure) en tout temps au numéro d'urgence; danger immédiat : 911. Jamais de conseil juridique.
- Avec un propriétaire : les loyers sont payés directement chez lui; Lease Lane facture ses honoraires le 5. Ne parle jamais de « versement » ni de « net ».
- « suggestions » : deux relances courtes (moins de 40 caractères) que la personne pourrait taper ensuite.
Termine en appelant l'outil « repondre ». Vouvoiement, français québécois simple.`;

const OUTIL = { name: "repondre", description: "Réponse structurée de Cléo.", input_schema: { type: "object", required: ["constat", "cartes", "sources", "suggestions"], properties: {
  constat: { type: "string" },
  cartes: { type: "array", items: { type: "object", required: ["titre"], properties: { titre: { type: "string" }, sous: { type: "string" }, montant: { type: "string" }, puce: { type: "string" }, ton: { type: "string", enum: ["action", "neutral"] }, lien: { type: "string" } } } },
  sources: { type: "array", items: { type: "object", required: ["libelle", "lien"], properties: { libelle: { type: "string" }, lien: { type: "string" } } } },
  action: { type: ["object", "null"], properties: { type: { type: "string", enum: ["proposition", "lien", "depense", "intervention", "demande"] }, titre: { type: "string" }, apercu: { type: "string" }, note: { type: "string" }, proposition_id: { type: "string" }, autorisation_id: { type: "string" }, intervention_id: { type: "string" }, lien: { type: "string" },
    brouillon: { type: "object", properties: { titre: { type: "string" }, piece: { type: "string" }, urgence: { type: "string", enum: ["normale", "elevee", "urgence"] }, description: { type: "string" } } } } },
  suggestions: { type: "array", items: { type: "string" } } } } };

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { question, historique } = await req.json().catch(() => ({}));
  if (typeof question !== "string" || question.trim().length < 2 || question.length > 1000) return json({ error: "Posez une question (1 000 caractères au plus)." }, 422);

  // Équipe (Lanceur) d'abord, sinon propriétaire ou locataire (portail) : chacun ne voit que ce que son rôle voit.
  const lire = (nom: string) => fetch(`${url}/rest/v1/rpc/${nom}`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: JSON.stringify({ q: question.slice(0, 80) }) });
  let c = await lire("lanceur_cleo_contexte");
  if (c.status === 403 || c.status === 400) c = await lire("portail_cleo_contexte");
  const ctx = await c.json().catch(() => null);
  if (!c.ok) return json({ error: ctx?.message ?? "Accès refusé." }, c.status === 400 ? 403 : c.status);
  const faits = (ctx.faits ?? []) as Fait[];
  const par = JSON.parse(atob(jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))?.sub ?? null;

  const messages = [...(Array.isArray(historique) ? historique.slice(-6) : []).filter((m: { role?: string; content?: string }) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content.slice(0, 1500) })),
    { role: "user", content: `Faits (lus à ${ctx.aujourdhui}, pour ${ctx.personne}, rôle ${ctx.role}) :\n${JSON.stringify(faits)}\n\nQuestion : ${question}` }];
  const r = await fetch(IA_MESSAGES_URL, { method: "POST", headers: { "x-api-key": IA_CLE, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify(avecContexte({ model: MODELE_RAPIDE, max_tokens: 1200, system: SYSTEME, tools: [OUTIL], tool_choice: { type: "tool", name: "repondre" }, messages })) });
  const d = await r.json().catch(() => null);
  const u = d?.usage ?? {}, mesure = (erreur?: string) => fetch(`${url}/rest/v1/rpc/service_cleo_mesure`, { method: "POST", headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p: { par, faits: faits.length, modele: MODELE_RAPIDE, entree: u.input_tokens ?? 0, sortie: u.output_tokens ?? 0, cout: coutCents(u.input_tokens ?? 0, u.output_tokens ?? 0), erreur } }) }).catch(() => null);
  const appel = d?.content?.find((b: { type: string }) => b.type === "tool_use");
  if (!r.ok || !appel) { await mesure(`ia ${r.status}`); return json({ error: "Cléo ne répond pas pour l’instant. Vos actions restent possibles sans elle." }, 502); }
  await mesure();
  const rep: Reponse = valider(appel.input, faits);
  return json({ ...rep, cout_cents: coutCents(u.input_tokens ?? 0, u.output_tokens ?? 0) });
});
