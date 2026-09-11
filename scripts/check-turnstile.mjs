// Vérifie la garde anti-robot des formulaires publics (lot P5).
//
// Deux comportements comptent, et se trompent dans des directions
// opposées :
//
//   Trop strict  → les demandes de visite, de mandat et les inscriptions
//                  de travailleurs sont TOUTES bloquées. Panne visible,
//                  mais qui coûte des prospects le temps qu'on la voie.
//   Trop laxiste → la protection ne sert à rien, et personne ne s'en
//                  aperçoit avant une campagne de spam.
//
// Aucun accès réseau. Exécution : node scripts/check-turnstile.mjs

import assert from 'node:assert/strict';

// Reproduit refuserSiRobot() de _shared/turnstile.ts.
// Retourne null si la soumission passe, ou un motif de refus.
function refuserSiRobot({ secret, token, reponseCloudflare }) {
  // Pas de secret configuré : la garde dort (voir le commentaire du module).
  if (!secret) return null;

  const jeton = typeof token === 'string' ? token.trim() : '';
  if (!jeton) return 'jeton_absent';

  // Cloudflare injoignable : on laisse passer plutôt que de bloquer un
  // client légitime à cause d'une panne chez un tiers.
  if (reponseCloudflare === 'panne') return null;

  if (!reponseCloudflare?.success) return 'jeton_invalide';
  return null;
}

const SECRET = 'cle-secrete';
const OK = { success: true };
const KO = { success: false, 'error-codes': ['invalid-input-response'] };

// --- Sans secret : rien n'est bloqué (déploiement en deux temps) ---
assert.equal(refuserSiRobot({ secret: undefined, token: '', reponseCloudflare: KO }), null,
  'sans secret configuré, aucun formulaire ne doit être bloqué');
assert.equal(refuserSiRobot({ secret: '', token: 'peu-importe', reponseCloudflare: KO }), null);

// --- Avec secret : un jeton valide passe ---
assert.equal(refuserSiRobot({ secret: SECRET, token: 'jeton-valide', reponseCloudflare: OK }), null);

// --- Avec secret : jeton absent ou vide est refusé ---
assert.equal(refuserSiRobot({ secret: SECRET, token: '', reponseCloudflare: OK }), 'jeton_absent');
assert.equal(refuserSiRobot({ secret: SECRET, token: '   ', reponseCloudflare: OK }), 'jeton_absent',
  'un jeton fait uniquement d\'espaces ne doit pas passer');
assert.equal(refuserSiRobot({ secret: SECRET, token: undefined, reponseCloudflare: OK }), 'jeton_absent');
assert.equal(refuserSiRobot({ secret: SECRET, token: null, reponseCloudflare: OK }), 'jeton_absent');

// Un robot pourrait envoyer autre chose qu'une chaîne pour contourner
// une vérification naïve du genre `if (!token)`.
assert.equal(refuserSiRobot({ secret: SECRET, token: 123, reponseCloudflare: OK }), 'jeton_absent');
assert.equal(refuserSiRobot({ secret: SECRET, token: true, reponseCloudflare: OK }), 'jeton_absent');
assert.equal(refuserSiRobot({ secret: SECRET, token: {}, reponseCloudflare: OK }), 'jeton_absent');

// --- Cloudflare refuse le jeton ---
assert.equal(refuserSiRobot({ secret: SECRET, token: 'jeton-rejoué', reponseCloudflare: KO }), 'jeton_invalide');

// --- LE CAS QUI COMPTE : Cloudflare en panne ---
// Bloquer tous les formulaires parce qu'un tiers est indisponible serait
// pire que le spam qu'on cherche à éviter. Le champ piège et la limite
// par IP restent en place derrière.
assert.equal(refuserSiRobot({ secret: SECRET, token: 'jeton-valide', reponseCloudflare: 'panne' }), null,
  'une panne Cloudflare ne doit pas bloquer les formulaires');

// Mais une panne ne dispense pas de fournir un jeton : un robot qui n'en
// envoie aucun reste refusé, même si Cloudflare est injoignable.
assert.equal(refuserSiRobot({ secret: SECRET, token: '', reponseCloudflare: 'panne' }), 'jeton_absent');

console.log('check-turnstile : 13/13 OK');
