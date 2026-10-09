/* Envois du site vers Supabase : formulaires (handle-public-inquiry) et Cléo
   (handle-public-faq). Mêmes fonctions que l'ancien site; la réponse
   automatique au visiteur et le courriel à l'équipe partent de handle-inquiry.
   Clé publique seulement (publishable) : aucune clé secrète dans le site. */
const FONCTIONS = 'https://kdmwfbcziokygfcmjxeq.supabase.co/functions/v1/';
const CLE_PUBLIQUE = 'sb_publishable_XJTO7hD6WHG9uK7Sg7LNDg_MM46QALR';
const TURNSTILE = '0x4AAAAAAEwdcNdTN1rCC_Jz';

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
