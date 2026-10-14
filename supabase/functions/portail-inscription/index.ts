import { corsHeadersFor } from "../_shared/auth.ts";
// portail-inscription (TP, A2) : création d'un compte de portail avec un code d'invitation. Appelée sans session (verify_jwt = false) :
// le code (LL-XXXX-XXXX, 14 jours, une seule fois) n'est valable qu'avec le courriel invité; tout est vérifié en base (service_invitation).
// Le compte est créé avec la clé de service (courriel confirmé : le code a été reçu à cette adresse), puis relié (service_invitation_utiliser).
// Si le lien échoue, le compte créé est supprimé : jamais de compte orphelin.

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const H = { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" };
const rpc = (nom: string, corps: unknown) => fetch(`${url}/rest/v1/rpc/${nom}`, { method: "POST", headers: H, body: JSON.stringify(corps) });

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "Méthode non permise." }, 405);
  const b = await req.json().catch(() => ({}));
  const courriel = String(b.courriel ?? "").trim().toLowerCase(), mdp = String(b.mdp ?? ""), code = String(b.code ?? "").trim().toUpperCase();
  const prenom = String(b.prenom ?? "").trim().slice(0, 60), nom = String(b.nom ?? "").trim().slice(0, 60);
  if (!prenom || !nom) return json({ error: "Indiquez votre prénom et votre nom." }, 422);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(courriel)) return json({ error: "Courriel invalide." }, 422);
  if (mdp.length < 12) return json({ error: "Le mot de passe doit compter 12 caractères au moins." }, 422);
  if (!/^LL-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return json({ error: "Code d’invitation au format LL-XXXX-XXXX." }, 422);
  if (b.conditions !== true) return json({ error: "Acceptez les conditions d’utilisation pour créer votre compte." }, 422);

  const v = await rpc("service_invitation", { p_code: code, p_courriel: courriel });
  const inv = await v.json().catch(() => null);
  if (!v.ok) return json({ error: inv?.message ?? "Invitation non valide." }, v.status === 400 ? 422 : v.status);

  const c = await fetch(`${url}/auth/v1/admin/users`, { method: "POST", headers: H,
    body: JSON.stringify({ email: courriel, password: mdp, email_confirm: true, user_metadata: { full_name: `${prenom} ${nom}` } }) });
  const u = await c.json().catch(() => null);
  if (!c.ok) {
    const existe = /already|registered|exists/i.test(JSON.stringify(u ?? {}));
    return json({ error: existe ? "Un compte existe déjà avec ce courriel : connectez-vous." : /password|weak/i.test(JSON.stringify(u ?? {})) ? "Mot de passe trop faible : choisissez-en un plus long ou moins courant." : "Le compte n’a pas pu être créé." }, existe ? 409 : 422);
  }
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const l = await rpc("service_invitation_utiliser", { p: { code, user_id: u.id, prenom, nom, infolettre: b.infolettre === true, ip } });
  if (!l.ok) {
    await fetch(`${url}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: H });
    const e = await l.json().catch(() => null);
    return json({ error: e?.message ?? "L’invitation n’a pas pu être utilisée." }, 409);
  }
  const r = await l.json();
  return json({ ok: true, espace: r.kind === "locataire" ? "locataire" : "proprietaire" });
});
