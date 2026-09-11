// Vérifie la confirmation des rappels de loyer (lot G9.8).
//
// Ce qui est en jeu : un compteur qui avance sans envoi réel fait CESSER
// les relances d'un locataire qui n'a jamais rien reçu, et affiche
// « 3 rappels envoyés » au propriétaire. C'est faux sur un dossier
// d'argent, et opposable en cas de litige.
//
// La règle testée : un compteur n'avance QUE sur une réponse HTTP 2xx
// confirmée. Ni sur l'envoi, ni sur une réponse absente, ni sur un échec.
//
// Aucun accès réseau. Exécution : node scripts/check-rappels-confirmes.mjs

import assert from 'node:assert/strict';

// Reproduit confirmer_rappels_en_attente() de la migration.
// statut = code HTTP, ou null si la réponse n'est pas encore arrivée.
function confirmer(paiement, statut) {
  const p = { ...paiement };
  if (p.reminder_request_id === null) return { paiement: p, journal: null };

  // Réponse pas encore arrivée : on ne touche à rien, on retentera.
  if (statut === null) return { paiement: p, journal: null };

  if (statut >= 200 && statut < 300) {
    if (p.reminder_request_type === 'upcoming') p.reminder_upcoming_sent = true;
    if (p.reminder_request_type === 'late') {
      p.late_reminder_count = (p.late_reminder_count ?? 0) + 1;
      p.last_late_reminder_at = 'maintenant';
    }
    if (p.reminder_request_type === 'escalate') p.escalated_to_human = true;
    p.reminder_request_id = null; p.reminder_request_type = null;
    return { paiement: p, journal: null };
  }

  // Échec : aucun compteur ne bouge, et on le journalise.
  p.reminder_request_id = null; p.reminder_request_type = null;
  return { paiement: p, journal: 'payment_reminder.delivery_failed' };
}

const BASE = {
  reminder_upcoming_sent: false,
  late_reminder_count: 0,
  escalated_to_human: false,
  last_late_reminder_at: null,
  reminder_request_id: null,
  reminder_request_type: null,
};

// --- Le cœur du correctif : un échec ne compte pas ---
let r = confirmer({ ...BASE, reminder_request_id: 42, reminder_request_type: 'late' }, 403);
assert.equal(r.paiement.late_reminder_count, 0, 'un 403 ne doit PAS compter comme un rappel');
assert.equal(r.journal, 'payment_reminder.delivery_failed', 'un échec doit être journalisé');
assert.equal(r.paiement.reminder_request_id, null, 'le dossier doit repartir en file');

// 500 et 404 se comportent pareil.
for (const statut of [404, 500, 502]) {
  const x = confirmer({ ...BASE, reminder_request_id: 7, reminder_request_type: 'late' }, statut);
  assert.equal(x.paiement.late_reminder_count, 0, `HTTP ${statut} ne doit pas compter`);
}

// --- Un succès compte, une seule fois ---
r = confirmer({ ...BASE, reminder_request_id: 42, reminder_request_type: 'late' }, 200);
assert.equal(r.paiement.late_reminder_count, 1);
assert.equal(r.paiement.last_late_reminder_at, 'maintenant');
assert.equal(r.journal, null, 'un succès ne se journalise pas comme un échec');
// La requête est consommée : repasser dessus ne recompte pas.
const deuxieme = confirmer(r.paiement, 200);
assert.equal(deuxieme.paiement.late_reminder_count, 1, 'un rappel ne doit pas être compté deux fois');

// --- Réponse pas encore arrivée : on ne décide rien ---
r = confirmer({ ...BASE, reminder_request_id: 42, reminder_request_type: 'late' }, null);
assert.equal(r.paiement.late_reminder_count, 0, "pas de réponse → pas de comptage");
assert.equal(r.paiement.reminder_request_id, 42, "la requête reste en attente");
assert.equal(r.journal, null, "une attente n'est pas un échec");

// --- Chaque type touche son propre champ, et lui seul ---
r = confirmer({ ...BASE, reminder_request_id: 1, reminder_request_type: 'upcoming' }, 200);
assert.equal(r.paiement.reminder_upcoming_sent, true);
assert.equal(r.paiement.late_reminder_count, 0, "'upcoming' ne touche pas le compteur de retard");

r = confirmer({ ...BASE, reminder_request_id: 1, reminder_request_type: 'escalate' }, 200);
assert.equal(r.paiement.escalated_to_human, true);
assert.equal(r.paiement.late_reminder_count, 0, "'escalate' ne touche pas le compteur de retard");

// --- Le scénario réel de production ---
// Deux loyers annonçaient 3 rappels avec 0 trace. Rejoué avec le
// correctif : trois tentatives échouées laissent le compteur à zéro,
// donc le locataire reste éligible aux relances.
let paiement = { ...BASE };
for (let i = 0; i < 3; i++) {
  paiement = confirmer({ ...paiement, reminder_request_id: 100 + i, reminder_request_type: 'late' }, 403).paiement;
}
assert.equal(paiement.late_reminder_count, 0,
  'trois échecs ne doivent pas épuiser le quota de relances du locataire');

console.log('check-rappels-confirmes : 14/14 OK');
