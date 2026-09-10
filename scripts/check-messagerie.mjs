// Vérifie la règle « un message appartient à un seul fil » (lot G4.3).
//
// La table `messages` sert maintenant deux conversations distinctes :
// propriétaire ↔ équipe (owner_id) et locataire ↔ équipe (tenant_id).
// La contrainte messages_un_seul_fil impose exactement un des deux.
//
// Pourquoi ça mérite un test : un message sans destinataire n'apparaît
// dans AUCUN portail. Il ne provoque pas d'erreur, il disparaît — et
// personne ne s'en aperçoit avant qu'un locataire se plaigne d'être resté
// sans réponse. Un message portant les deux apparaîtrait dans deux fils à
// la fois, ce qui est pire côté vie privée.
//
// Aucun accès réseau. Exécution : node scripts/check-messagerie.mjs

import assert from 'node:assert/strict';

/** Reproduit `num_nonnulls(owner_id, tenant_id) = 1` de Postgres. */
function filValide(msg) {
  const remplis = [msg.owner_id, msg.tenant_id].filter((v) => v !== null && v !== undefined);
  return remplis.length === 1;
}

/** Reproduit la politique RLS d'insertion côté locataire. */
function insertionLocataireAutorisee(msg, tenantIdConnecte) {
  return msg.tenant_id === tenantIdConnecte && msg.sender === 'tenant';
}

const T = 'tenant-uuid';
const O = 'owner-uuid';

// --- Contrainte de fil ---
assert.equal(filValide({ owner_id: O, tenant_id: null }), true, 'message propriétaire');
assert.equal(filValide({ owner_id: null, tenant_id: T }), true, 'message locataire');
assert.equal(filValide({ owner_id: null, tenant_id: null }), false, 'orphelin : invisible partout');
assert.equal(filValide({ owner_id: O, tenant_id: T }), false, 'les deux : fuite entre fils');

// Les messages déjà en base (owner_id seul, tenant_id absent de l'objet)
// restent valides après la migration.
assert.equal(filValide({ owner_id: O }), true, 'ligne existante avant migration');

// --- Politique d'insertion ---
assert.equal(
  insertionLocataireAutorisee({ tenant_id: T, sender: 'tenant' }, T),
  true,
  'son propre message',
);

// Le cas qui compte : un locataire ne doit pas pouvoir fabriquer une
// réponse signée « équipe » dans son propre fil.
assert.equal(
  insertionLocataireAutorisee({ tenant_id: T, sender: 'team' }, T),
  false,
  'usurpation de l\'équipe',
);
assert.equal(
  insertionLocataireAutorisee({ tenant_id: T, sender: 'owner' }, T),
  false,
  'usurpation du propriétaire',
);

// Écrire dans le fil de quelqu'un d'autre.
assert.equal(
  insertionLocataireAutorisee({ tenant_id: 'autre-locataire', sender: 'tenant' }, T),
  false,
  'fil d\'un autre locataire',
);

// Un locataire ne peut pas écrire dans un fil de propriétaire.
assert.equal(
  insertionLocataireAutorisee({ owner_id: O, tenant_id: null, sender: 'tenant' }, T),
  false,
  'fil propriétaire',
);

console.log('check-messagerie : 10/10 OK');
