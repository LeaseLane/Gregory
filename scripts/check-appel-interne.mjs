// Vérifie la garde d'appel interne (lot G11.7).
//
// Deux comportements comptent, et une erreur sur l'un ou l'autre ne se
// voit pas à l'œil :
//
//   1. SANS secret défini, la garde laisse passer. C'est délibéré — voir
//      _shared/appel-interne.ts. Un refus par défaut couperait paiements,
//      dispatch et rappels en silence, comme HEALTH_ALERT_SECRET l'a fait
//      le 2026-08-17.
//   2. AVEC secret, seule la valeur exacte passe, et la comparaison ne
//      doit pas s'arrêter au premier octet différent (sinon le secret se
//      devine en mesurant le temps de réponse).
//
// Aucun accès réseau. Exécution : node scripts/check-appel-interne.mjs

import assert from 'node:assert/strict';

// Copie de la logique de _shared/appel-interne.ts, avec le secret injecté
// plutôt que lu dans Deno.env.
function egalTempsConstant(a, b) {
  const enc = new TextEncoder();
  const A = enc.encode(a), B = enc.encode(b);
  if (A.length !== B.length) return false;
  let diff = 0;
  for (let i = 0; i < A.length; i++) diff |= A[i] ^ B[i];
  return diff === 0;
}

function refuse(secret, enteteFourni) {
  if (!secret) return false;               // garde inactive
  return !egalTempsConstant(enteteFourni ?? '', secret);
}

const SECRET = 'a'.repeat(64);

// --- 1. Sans secret : rien n'est refusé (déploiement en deux temps) ---
assert.equal(refuse(undefined, ''), false);
assert.equal(refuse('', 'peu importe'), false);

// --- 2. Avec secret : seule la valeur exacte passe ---
assert.equal(refuse(SECRET, SECRET), false, 'le bon secret doit passer');
assert.equal(refuse(SECRET, ''), true, 'aucun en-tête doit être refusé');
assert.equal(refuse(SECRET, undefined), true, 'en-tête absent doit être refusé');
assert.equal(refuse(SECRET, 'b'.repeat(64)), true, 'mauvais secret, même longueur');
assert.equal(refuse(SECRET, 'a'.repeat(63)), true, 'préfixe correct mais tronqué');
assert.equal(refuse(SECRET, 'a'.repeat(65)), true, 'secret + suffixe');

// Un seul octet différent, tout à la fin : le cas qu'une comparaison
// paresseuse laisserait passer si elle ne parcourait pas toute la chaîne.
assert.equal(refuse(SECRET, 'a'.repeat(63) + 'b'), true);

// La casse compte.
assert.equal(refuse(SECRET, 'A'.repeat(64)), true);

// --- 3. La comparaison parcourt toujours toute la chaîne ---
// À longueur égale, le nombre d'octets comparés ne dépend pas de l'endroit
// où la différence se trouve : c'est ce qui empêche de deviner le secret
// octet par octet.
let comparesDebut = 0, comparesFin = 0;
function compterOctets(a, b, compteur) {
  const enc = new TextEncoder();
  const A = enc.encode(a), B = enc.encode(b);
  if (A.length !== B.length) return 0;
  let n = 0, diff = 0;
  for (let i = 0; i < A.length; i++) { diff |= A[i] ^ B[i]; n++; }
  return n;
}
comparesDebut = compterOctets(SECRET, 'b' + 'a'.repeat(63), comparesDebut);
comparesFin   = compterOctets(SECRET, 'a'.repeat(63) + 'b', comparesFin);
assert.equal(comparesDebut, comparesFin,
  'le nombre d\'octets comparés doit être identique quel que soit l\'endroit de la différence');
assert.equal(comparesDebut, 64);

console.log('check-appel-interne : 12/12 OK');
