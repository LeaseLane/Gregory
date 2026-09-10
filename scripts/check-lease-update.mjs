// Vérifie les règles de validation de update_lease (lot G2.1b).
//
// La modification d'un bail touche à l'argent (le loyer sert à générer
// les paiements mensuels) et au suivi légal (un bail actif sans échéance
// sort de lease_renewal_tracking et se reconduit sans avis). Les règles
// ci-dessous sont donc testées en dehors de l'appel réseau.
//
// La subtilité que ce test protège : la validation porte sur l'état FINAL
// du bail, pas sur les seuls champs envoyés. Modifier uniquement
// `start_date` doit être refusé si la date de fin déjà en base devient
// antérieure — un test qui ne regarderait que le patch laisserait passer.
//
// Aucun accès réseau. Exécution : node scripts/check-lease-update.mjs

import assert from 'node:assert/strict';

// Copie des règles de onboarding-api/index.ts, action update_lease.
// Retourne un message d'erreur, ou null si la modification est acceptée.
function validerModificationBail(avant, patch) {
  const finalStart = patch.start_date ?? avant.start_date;
  const finalEnd = patch.end_date !== undefined ? patch.end_date : avant.end_date;
  const finalStatus = patch.status ?? avant.status;

  if (patch.monthly_rent !== undefined) {
    const rent = Number(patch.monthly_rent);
    if (!Number.isFinite(rent) || rent <= 0) return 'loyer_invalide';
  }
  if (patch.status !== undefined && !['active', 'renewed', 'ended'].includes(patch.status)) {
    return 'statut_invalide';
  }
  if (finalEnd && finalStart && finalEnd <= finalStart) return 'dates_incoherentes';
  if (finalStatus === 'active' && !finalEnd) return 'actif_sans_echeance';
  return null;
}

const BAIL = {
  start_date: '2026-09-01',
  end_date: '2027-08-31',
  monthly_rent: 950,
  status: 'active',
};

// Cas nominal : ajuster le loyer.
assert.equal(validerModificationBail(BAIL, { monthly_rent: 1000 }), null);

// Le loyer doit rester un montant positif — il génère les paiements.
assert.equal(validerModificationBail(BAIL, { monthly_rent: 0 }), 'loyer_invalide');
assert.equal(validerModificationBail(BAIL, { monthly_rent: -50 }), 'loyer_invalide');
assert.equal(validerModificationBail(BAIL, { monthly_rent: 'abc' }), 'loyer_invalide');

// Statut hors de la contrainte CHECK de la table.
assert.equal(validerModificationBail(BAIL, { status: 'resilie' }), 'statut_invalide');

// LE CAS QUI COMPTE : on ne modifie QUE la date de début, et elle passe
// après la date de fin déjà en base. Une validation qui ne regarderait
// que le patch ne verrait aucune date de fin et laisserait passer.
assert.equal(validerModificationBail(BAIL, { start_date: '2027-12-01' }), 'dates_incoherentes');

// Symétrique : on ne modifie que la date de fin, avant le début en base.
assert.equal(validerModificationBail(BAIL, { end_date: '2026-01-01' }), 'dates_incoherentes');

// Un bail actif ne peut pas perdre son échéance : il disparaîtrait du
// suivi des renouvellements sans que personne le remarque.
assert.equal(validerModificationBail(BAIL, { end_date: null }), 'actif_sans_echeance');

// Mais un bail terminé peut rester sans échéance — le suivi ne le
// concerne plus.
assert.equal(
  validerModificationBail(BAIL, { end_date: null, status: 'ended' }),
  null,
);

// Compléter un bail existant qui n'avait pas d'échéance : c'est
// exactement la correction des 2 baux de production.
const BAIL_SANS_FIN = { ...BAIL, end_date: null };
assert.equal(validerModificationBail(BAIL_SANS_FIN, { end_date: '2027-08-31' }), null);

// Et ce même bail refuse de rester actif sans qu'on comble le trou.
assert.equal(validerModificationBail(BAIL_SANS_FIN, { monthly_rent: 975 }), 'actif_sans_echeance');

console.log('check-lease-update : 11/11 OK');
