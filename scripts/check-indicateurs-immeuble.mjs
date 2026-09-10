// Vérifie les indicateurs par immeuble (lot G3.10).
//
// Ces quatre chiffres sont lus par le propriétaire pour décider quoi faire
// de son argent. Un calcul faux ne se voit pas : il ressemble à un
// résultat plausible. Le piège principal est le zéro — « 0 $ » se lit
// comme « à l'équilibre », alors qu'un immeuble sans aucun mouvement doit
// afficher un tiret.
//
// Aucun accès réseau. Exécution : node scripts/check-indicateurs-immeuble.mjs

import assert from 'node:assert/strict';

// Copie de indicateursImmeuble() de portail-proprietaire.html.
function indicateursImmeuble(b, depenses, bonsTravail, maintenant = Date.now()) {
  const unites = b.units || [];
  const depuis = new Date(maintenant - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const occupees = unites.filter(u => u.status === 'occupied').length;
  const occupation = unites.length ? Math.round((occupees / unites.length) * 100) : null;

  let encaisse = 0;
  unites.forEach(u => (u.leases || []).forEach(l => (l.payments || []).forEach(p => {
    if (p.status === 'paid' && p.due_date >= depuis) encaisse += Number(p.amount) || 0;
  })));
  const depensesImmeuble = depenses.filter(e => e.building_id === b.id && e.expense_date >= depuis);
  const totalDepenses = depensesImmeuble.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const revenuNet = (encaisse || totalDepenses) ? encaisse - totalDepenses : null;

  const entretienParLogement = unites.length && totalDepenses
    ? Math.round(totalDepenses / unites.length)
    : null;

  const idsUnites = new Set(unites.map(u => u.id));
  const termines = bonsTravail.filter(w =>
    idsUnites.has(w.unit_id) && w.worker_reported_done_at && w.created_at >= depuis);
  const delaiMoyen = termines.length
    ? Math.round(termines.reduce((s, w) =>
        s + (new Date(w.worker_reported_done_at) - new Date(w.created_at)), 0)
        / termines.length / (24 * 60 * 60 * 1000) * 10) / 10
    : null;

  return { occupation, revenuNet, entretienParLogement, delaiMoyen, nbReparations: termines.length };
}

const MAINTENANT = new Date('2026-09-09T12:00:00Z').getTime();
const recent = '2026-06-01';
const vieux = '2024-01-15'; // hors de la fenêtre de 12 mois

const IMMEUBLE = {
  id: 'b1',
  units: [
    { id: 'u1', status: 'occupied', leases: [{ payments: [
      { status: 'paid', amount: 1000, due_date: recent },
      { status: 'paid', amount: 1000, due_date: recent },
    ] }] },
    { id: 'u2', status: 'available', leases: [] },
  ],
};

// --- Occupation ---
let m = indicateursImmeuble(IMMEUBLE, [], [], MAINTENANT);
assert.equal(m.occupation, 50, '1 occupé sur 2');

// Un immeuble sans logement ne vaut pas 0 % — il n'a rien à mesurer.
assert.equal(indicateursImmeuble({ id: 'b1', units: [] }, [], [], MAINTENANT).occupation, null);

// --- Revenu net ---
assert.equal(m.revenuNet, 2000, 'encaissé sans dépense');

m = indicateursImmeuble(IMMEUBLE, [
  { building_id: 'b1', amount: 500, expense_date: recent },
], [], MAINTENANT);
assert.equal(m.revenuNet, 1500, '2000 encaissé - 500 dépensé');

// Les dépenses d'un AUTRE immeuble ne comptent pas.
m = indicateursImmeuble(IMMEUBLE, [
  { building_id: 'b2', amount: 9999, expense_date: recent },
], [], MAINTENANT);
assert.equal(m.revenuNet, 2000, 'dépense d\'un autre immeuble ignorée');

// Hors de la fenêtre de 12 mois : ignoré des deux côtés.
m = indicateursImmeuble(
  { id: 'b1', units: [{ id: 'u1', status: 'occupied', leases: [{ payments: [
    { status: 'paid', amount: 1000, due_date: vieux },
  ] }] }] },
  [{ building_id: 'b1', amount: 500, expense_date: vieux }], [], MAINTENANT);
assert.equal(m.revenuNet, null, 'rien dans la fenêtre → tiret, pas 0 $');

// Un loyer attendu n'est pas un revenu.
m = indicateursImmeuble(
  { id: 'b1', units: [{ id: 'u1', status: 'occupied', leases: [{ payments: [
    { status: 'pending', amount: 1000, due_date: recent },
    { status: 'late', amount: 1000, due_date: recent },
  ] }] }] }, [], [], MAINTENANT);
assert.equal(m.revenuNet, null, 'pending et late ne comptent pas comme encaissés');

// Un immeuble déficitaire retourne bien un négatif (affiché en rouge).
m = indicateursImmeuble({ id: 'b1', units: [{ id: 'u1', status: 'occupied', leases: [] }] },
  [{ building_id: 'b1', amount: 800, expense_date: recent }], [], MAINTENANT);
assert.equal(m.revenuNet, -800, 'dépenses sans revenu');

// --- Entretien par logement ---
m = indicateursImmeuble(IMMEUBLE, [
  { building_id: 'b1', amount: 1000, expense_date: recent },
], [], MAINTENANT);
assert.equal(m.entretienParLogement, 500, '1000 $ sur 2 logements');

// Aucune dépense → tiret, pas « 0 $ ».
assert.equal(indicateursImmeuble(IMMEUBLE, [], [], MAINTENANT).entretienParLogement, null);

// --- Délai moyen de réparation ---
m = indicateursImmeuble(IMMEUBLE, [], [
  { unit_id: 'u1', created_at: '2026-06-01T00:00:00Z', worker_reported_done_at: '2026-06-03T00:00:00Z' },
  { unit_id: 'u2', created_at: '2026-06-01T00:00:00Z', worker_reported_done_at: '2026-06-05T00:00:00Z' },
], MAINTENANT);
assert.equal(m.delaiMoyen, 3, 'moyenne de 2 et 4 jours');
assert.equal(m.nbReparations, 2);

// Un bon non terminé ne fausse pas la moyenne.
m = indicateursImmeuble(IMMEUBLE, [], [
  { unit_id: 'u1', created_at: '2026-06-01T00:00:00Z', worker_reported_done_at: '2026-06-03T00:00:00Z' },
  { unit_id: 'u1', created_at: '2026-06-01T00:00:00Z', worker_reported_done_at: null },
], MAINTENANT);
assert.equal(m.delaiMoyen, 2, 'seuls les bons terminés comptent');
assert.equal(m.nbReparations, 1);

// Un bon sur l'unité d'un AUTRE immeuble est ignoré.
m = indicateursImmeuble(IMMEUBLE, [], [
  { unit_id: 'u-ailleurs', created_at: '2026-06-01T00:00:00Z', worker_reported_done_at: '2026-08-01T00:00:00Z' },
], MAINTENANT);
assert.equal(m.delaiMoyen, null, 'unité hors de cet immeuble');

// Aucune réparation → tiret.
assert.equal(indicateursImmeuble(IMMEUBLE, [], [], MAINTENANT).delaiMoyen, null);

console.log('check-indicateurs-immeuble : 15/15 OK');
