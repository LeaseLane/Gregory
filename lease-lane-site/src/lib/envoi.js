/* Envois du site vers Supabase : formulaires (handle-public-inquiry) et Cléo
   (handle-public-faq). Mêmes fonctions que l'ancien site; la réponse
   automatique au visiteur et le courriel à l'équipe partent de handle-inquiry.
   Clé publique seulement (publishable) : aucune clé secrète dans le site. */
/* Production par défaut; une version d'essai locale peut viser la préproduction (NEXT_PUBLIC_LL_*, lus au moment du build). */
const FONCTIONS = (process.env.NEXT_PUBLIC_LL_FONCTIONS || 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1').replace(/\/?$/, '/');
const CLE_PUBLIQUE = process.env.NEXT_PUBLIC_LL_CLE_PUBLIQUE || 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR';
const TURNSTILE = process.env.NEXT_PUBLIC_LL_TURNSTILE || '0x4AAAAAAEwdcNdTN1rCC_Jz';

let script = null;
const chargerTurnstile = () => script || (script = new Promise((ok, ko) => {
  const s = document.createElement('script');
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  s.async = true;
  s.onload = () => ok(window.turnstile);
  s.onerror = () => { script = null; ko(new Error('Vérification anti-robot indisponible. Réessayez dans un instant.')); };
  document.head.appendChild(s);
}));

/* Jeton Turnstile à usage unique. Invisible pour un visiteur normal; une case
   à cocher apparaît en bas à droite seulement si Cloudflare a un doute. */
async function jetonRobot() {
  const ts = await chargerTurnstile();
  const boite = document.createElement('div');
  boite.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647';
  document.body.appendChild(boite);
  try {
    return await new Promise((ok, ko) => ts.render(boite, {
      sitekey: TURNSTILE, language: 'fr', appearance: 'interaction-only',
      callback: ok,
      'error-callback': () => ko(new Error('La vérification anti-robot a échoué. Réessayez.')),
    }));
  } finally {
    boite.remove();
  }
}

async function appeler(fonction, corps) {
  const res = await fetch(FONCTIONS + fonction, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: CLE_PUBLIQUE, Authorization: 'Bearer ' + CLE_PUBLIQUE },
    body: JSON.stringify({ ...corps, 'cf-turnstile-response': await jetonRobot() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Envoi impossible pour le moment. Réessayez dans un instant.');
  return data;
}

/* type : 'mandat' (évaluation propriétaire) ou 'contact' (tout le reste).
   lignes : [libellé, valeur] ajoutés au message, pour que l'équipe voie tout. */
export function envoyerDemande({ type, nom, courriel, tel, sujet, message, lignes = [], ...extra }) {
  const corps = [sujet && 'Sujet : ' + sujet, message, ...lignes.filter(([, v]) => v !== undefined && v !== '' && v !== null).map(([k, v]) => k + ' : ' + v)]
    .filter(Boolean).join('\n');
  return appeler('handle-public-inquiry', {
    type, full_name: nom, email: courriel, phone: tel || undefined,
    message: corps || undefined, consent: true, ...extra,
  });
}

export async function demanderCleo(question) {
  /* Le serveur refuse au-delà de 500 caractères : on coupe plutôt que d'échouer. */
  return (await appeler('handle-public-faq', { question: String(question).slice(0, 500) })).answer;
}

/* Inscription d'entreprise (inscription-entreprise) : multipart avec le document, sans Content-Type (le navigateur pose la frontière).
   Ne lève pas sur un refus du serveur : renvoie sa réponse ({ ok, id } ou { ok:false, code, champ?, error }) pour que la page
   montre le bon état. Lève seulement si l'envoi n'a pas pu partir (réseau, vérification anti-robot). */
export async function envoyerInscription(formData) {
  formData.set('cf-turnstile-response', await jetonRobot());
  const res = await fetch(FONCTIONS + 'inscription-entreprise', {
    method: 'POST',
    headers: { apikey: CLE_PUBLIQUE, Authorization: 'Bearer ' + CLE_PUBLIQUE },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  return res.ok && data.ok !== false ? { ...data, ok: true } : { code: 'transmission', ...data, ok: false };
}
