import { corsHeadersFor } from "../_shared/auth.ts";
// portail-fichiers (TP) : lien signé de 10 minutes vers un document ou une photo, après vérification de l'accès EN BASE avec le jeton
// de la personne (portail_document_chemin / portail_photo_chemin). Aucun chemin n'est accepté du client.

const url = Deno.env.get("SUPABASE_URL") ?? "", cle = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...cors, "Content-Type": "application/json" } });
  const jeton = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const { type, id, index, telecharger } = await req.json().catch(() => ({}));
  const rpc = ({ document: ["portail_document_chemin", { p_id: id }], photo: ["portail_photo_chemin", { p_building: id }], photo_demande: ["portail_photo_demande", { p_id: id, p_index: Number(index) || 0 }] } as Record<string, [string, unknown]>)[type];
  if (!id || !rpc) return json({ error: "Requête invalide." }, 400);
  const r = await fetch(`${url}/rest/v1/rpc/${rpc[0]}`, { method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: JSON.stringify(rpc[1]) });
  const d = await r.json().catch(() => null);
  if (!r.ok) return json({ error: d?.message ?? "Accès refusé." }, r.status === 400 ? 403 : r.status);
  const chemin = String(d.chemin ?? "").split("/").map(encodeURIComponent).join("/");
  const s = await fetch(`${url}/storage/v1/object/sign/${d.bucket}/${chemin}`, { method: "POST", headers: { apikey: cle, Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 600 }) });
  const sd = await s.json().catch(() => ({}));
  if (!s.ok || !sd.signedURL) return json({ error: "Fichier indisponible." }, 404);
  return json({ url: `${url}/storage/v1${sd.signedURL}${telecharger ? `&download=${encodeURIComponent(d.titre ?? "document")}` : ""}` });
});
