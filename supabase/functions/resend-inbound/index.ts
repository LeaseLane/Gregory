// Réception des réponses des travailleurs (Resend Inbound).
//
// Chaque courriel envoyé à un travailleur porte l'adresse de réponse
// travailleur-<id>@<REPONSES_DOMAINE>. Quand il clique « Répondre »,
// Resend reçoit le message et appelle ce webhook (événement
// email.received). Le webhook ne contient pas le corps : on le récupère
// par l'API, puis on l'ajoute au fil de messages du travailleur.
//
// Appelé par Resend, pas par un navigateur : pas de JWT, l'authenticité
// est prouvée par la signature Svix (secret RESEND_INBOUND_SECRET).

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const cleService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
const secret = Deno.env.get("RESEND_INBOUND_SECRET") ?? "";
const adminHeaders = { apikey: cleService, Authorization: `Bearer ${cleService}`, "Content-Type": "application/json" };
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export async function signatureValide(corps: string, id: string, horodatage: string, signatures: string, cle: string, maintenant = Date.now()): Promise<boolean> {
  if (!cle.startsWith("whsec_") || !id || !horodatage || !signatures) return false;
  // Au-delà de 5 minutes, on refuse : empêche de rejouer une vieille requête interceptée.
  if (Math.abs(maintenant / 1000 - Number(horodatage)) > 300) return false;
  const octets = Uint8Array.from(atob(cle.slice(6)), (c) => c.charCodeAt(0));
  const k = await crypto.subtle.importKey("raw", octets, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${id}.${horodatage}.${corps}`)));
  const attendu = btoa(String.fromCharCode(...sig));
  return signatures.split(" ").some((s) => {
    const v = s.split(",")[1] ?? "";
    if (v.length !== attendu.length) return false;
    let diff = 0;
    for (let i = 0; i < v.length; i++) diff |= v.charCodeAt(i) ^ attendu.charCodeAt(i);
    return diff === 0;
  });
}

// Garde la réponse, pas tout l'historique cité en dessous (« Le … a écrit : », lignes « > »).
export function sansCitation(texte: string): string {
  const lignes = texte.replace(/\r\n/g, "\n").split("\n");
  // Gmail coupe souvent l'en-tête de citation sur deux lignes
  // (« On Sun, … <adresse> » puis « wrote: ») : on teste aussi chaque
  // ligne jointe à la suivante.
  const entete = (l: string) => /^(Le|On) .{5,250}(a écrit|wrote)\s*:?\s*$/i.test(l);
  const fin = lignes.findIndex((l, i) =>
    /^>/.test(l.trim()) || entete(l.trim()) || entete(`${l.trim()} ${(lignes[i + 1] ?? "").trim()}`) ||
    /^-{2,}\s*(Original|Message d'origine)/i.test(l.trim()) || /^(De|From)\s*:/.test(l.trim())
  );
  return (fin === -1 ? lignes : lignes.slice(0, fin)).join("\n").trim();
}

// Démarré seulement comme point d'entrée : les tests importent les fonctions ci-dessus.
if (import.meta.main) Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("", { status: 405 });
  const corps = await req.text();
  const ok = await signatureValide(corps, req.headers.get("svix-id") ?? "", req.headers.get("svix-timestamp") ?? "", req.headers.get("svix-signature") ?? "", secret);
  if (!ok) return new Response(JSON.stringify({ error: "signature invalide" }), { status: 401 });

  const evt = JSON.parse(corps);
  if (evt?.type !== "email.received") return new Response(JSON.stringify({ ok: true, ignore: evt?.type }), { status: 200 });
  const d = evt.data ?? {};

  const destinataires: string[] = [...(d.to ?? []), ...(d.received_for ?? [])];

  // Réponse d'un locataire à un courriel de suivi : elle va dans le fil de la demande.
  let demandeId = destinataires.map((a) => a.match(/demande-([0-9a-f-]{36})@/i)?.[1]).find(Boolean) ?? null;
  const expediteurCourriel = String(d.from ?? "").match(/<([^>]+)>/)?.[1] ?? String(d.from ?? "");
  // Courriel sans adresse de demande (envoyé avant son ajout, ou écrit à
  // neuf) mais venant d'un locataire connu : sa demande ouverte la plus
  // récente. Un travailleur n'est cherché qu'ensuite.
  if (!demandeId && expediteurCourriel && !destinataires.some((a) => /travailleur-[0-9a-f-]{36}@/i.test(a))) {
    const t = await fetch(`${supabaseUrl}/rest/v1/tenants?email=ilike.${encodeURIComponent(expediteurCourriel)}&select=id&limit=1`, { headers: adminHeaders });
    const locId = (await t.json().catch(() => []))?.[0]?.id;
    if (locId) {
      const dm = await fetch(`${supabaseUrl}/rest/v1/service_requests?tenant_id=eq.${locId}&status=neq.closed&select=id&order=created_at.desc&limit=1`, { headers: adminHeaders });
      demandeId = (await dm.json().catch(() => []))?.[0]?.id ?? null;
    }
  }
  if (demandeId && UUID.test(demandeId)) {
    const recuD = await fetch(`https://api.resend.com/emails/receiving/${d.email_id}`, { headers: { Authorization: `Bearer ${resendKey}` } });
    const courrielD = await recuD.json().catch(() => ({}));
    const texteD = sansCitation(String(courrielD.text ?? "")) || "(message sans texte)";
    const nbPJ = Array.isArray(courrielD.attachments) ? courrielD.attachments.length : 0;
    const insD = await fetch(`${supabaseUrl}/rest/v1/service_request_messages`, {
      method: "POST",
      headers: { ...adminHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ service_request_id: demandeId, sender: "tenant", via: "courriel",
        body: (texteD + (nbPJ ? `\n\n(${nbPJ} pièce(s) jointe(s) au courriel : à ajouter depuis le portail pour qu'on les voie ici)` : "")).slice(0, 10000) }),
    });
    if (!insD.ok) return new Response(JSON.stringify({ error: "enregistrement impossible" }), { status: 500 });
    return new Response(JSON.stringify({ ok: true, fil: "demande" }), { status: 200 });
  }

  // Le travailleur est identifié par l'adresse de réponse ; à défaut, par l'expéditeur.
  let workerId = destinataires.map((a) => a.match(/travailleur-([0-9a-f-]{36})@/i)?.[1]).find(Boolean) ?? null;
  const expediteur = String(d.from ?? "").match(/<([^>]+)>/)?.[1] ?? String(d.from ?? "");
  if (!workerId && expediteur) {
    const r = await fetch(`${supabaseUrl}/rest/v1/workers?email=ilike.${encodeURIComponent(expediteur)}&select=id&limit=1`, { headers: adminHeaders });
    workerId = (await r.json().catch(() => []))?.[0]?.id ?? null;
  }
  if (!workerId || !UUID.test(workerId)) {
    // Réponse 200 : Resend ne doit pas réessayer un message qu'on ne saura jamais classer.
    return new Response(JSON.stringify({ ok: true, ignore: "travailleur introuvable" }), { status: 200 });
  }

  const recu = await fetch(`https://api.resend.com/emails/receiving/${d.email_id}`, { headers: { Authorization: `Bearer ${resendKey}` } });
  const courriel = await recu.json().catch(() => ({}));
  const texte = sansCitation(String(courriel.text ?? "")) || "(message sans texte — voir la boîte de réception)";

  const ins = await fetch(`${supabaseUrl}/rest/v1/worker_messages`, {
    method: "POST",
    headers: { ...adminHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({ worker_id: workerId, direction: "entrant", origine: "courriel_entrant", sujet: d.subject ?? courriel.subject ?? null, corps: texte.slice(0, 10000), resend_id: d.email_id ?? null }),
  });
  if (!ins.ok) return new Response(JSON.stringify({ error: "enregistrement impossible" }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
