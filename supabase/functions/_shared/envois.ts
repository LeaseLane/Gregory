// Jeton de désabonnement (LCAP) : « canal:adresse » signé HMAC-SHA256 avec INTERNAL_CALL_SECRET.
// Sans base de données : le lien reste valable même si l'envoi d'origine est purgé.
const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data)));
}

export async function jetonDesabonnement(secret: string, canal: string, adresse: string): Promise<string> {
  const charge = `${canal}:${adresse.trim().toLowerCase()}`;
  return `${b64u(new TextEncoder().encode(charge))}.${b64u(await hmac(secret, charge))}`;
}

export async function lireJeton(secret: string, jeton: string): Promise<{ canal: string; adresse: string } | null> {
  const [c, s] = String(jeton ?? "").split(".");
  if (!c || !s || !secret) return null;
  let charge: string;
  try { charge = new TextDecoder().decode(deB64u(c)); } catch { return null; }
  const attendu = b64u(await hmac(secret, charge));
  if (attendu.length !== s.length) return null;
  let diff = 0;
  for (let i = 0; i < s.length; i++) diff |= attendu.charCodeAt(i) ^ s.charCodeAt(i);
  const m = charge.match(/^(email|sms):(.+)$/);
  return diff === 0 && m ? { canal: m[1], adresse: m[2] } : null;
}

// Signature Twilio (X-Twilio-Signature) : HMAC-SHA1 de l'URL suivie des paramètres triés (clé + valeur), en base64.
export async function signatureTwilioValide(authToken: string, url: string, params: Record<string, string>, signature: string): Promise<boolean> {
  if (!authToken || !signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(authToken), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const attendu = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data)))));
  if (attendu.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < attendu.length; i++) diff |= attendu.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

// Mots d'arrêt SMS (Twilio et usage québécois), comparés sans accents ni casse.
const ARRET = new Set(["STOP", "ARRET", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "DESABONNER", "DESABONNEMENT"]);
export const estArret = (texte: string) => ARRET.has(String(texte ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase());
