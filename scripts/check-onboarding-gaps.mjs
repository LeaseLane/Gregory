// Vérifie la logique de lacunes de l'onboarding propriétaire (lot G1).
//
// Cette logique est dupliquée à trois endroits — la vue SQL
// owner_onboarding_checklist, describeGaps() dans send-onboarding-reminder
// et describeOnboardingGaps() dans portail-proprietaire.html. Les trois
// doivent s'accorder, sinon le courriel de rappel et le portail ne disent
// pas la même chose au client.
//
// Ce test porte sur la règle partagée : un compteur à 0 n'est pas une
// lacune, un booléen faux non plus, et un dossier vide se lit comme
// complet plutôt que de faire planter l'affichage.
//
// Aucun accès réseau, aucune écriture. Exécution : node scripts/check-onboarding-gaps.mjs

import assert from 'node:assert/strict';

// Copie de la table du portail. Si tu modifies l'une, modifie l'autre.
const ONBOARDING_LABELS = [
  ['missing_phone',                              () => "Ajouter votre numéro de téléphone"],
  ['missing_buildings',                          () => "Ajouter votre premier immeuble"],
  ['missing_units',                              () => "Ajouter au moins un logement à votre immeuble"],
  ['units_missing_rent_count',                   (n) => `${n} logement(s) sans loyer indiqué`],
  ['occupied_units_missing_lease_count',         (n) => `${n} logement(s) occupé(s) sans bail enregistré`],
  ['active_leases_missing_tenant_contact_count', (n) => `${n} bail(aux) dont le locataire n'a ni courriel ni téléphone`],
  ['active_leases_missing_bail_doc_count',       (n) => `${n} bail(aux) sans copie du bail téléversée`],
];

function describeOnboardingGaps(c) {
  return ONBOARDING_LABELS
    .filter(([key]) => typeof c[key] === 'boolean' ? c[key] : Number(c[key]) > 0)
    .map(([key, label]) => label(c[key]));
}

const DOSSIER_COMPLET = {
  missing_phone: false,
  missing_buildings: false,
  missing_units: false,
  units_missing_rent_count: 0,
  occupied_units_missing_lease_count: 0,
  active_leases_missing_tenant_contact_count: 0,
  active_leases_missing_bail_doc_count: 0,
};

// Un dossier complet ne doit afficher aucune lacune — c'est la condition
// exacte qui fait passer onboarding_completed_at à now() côté SQL.
assert.deepEqual(describeOnboardingGaps(DOSSIER_COMPLET), []);

// Un compteur à 0 n'est pas une lacune. Régression classique : un test de
// vérité JS afficherait « 0 logement(s) sans loyer indiqué ».
assert.deepEqual(
  describeOnboardingGaps({ ...DOSSIER_COMPLET, units_missing_rent_count: 0 }),
  [],
);

// Un compteur positif est une lacune, et le nombre apparaît dans le texte.
assert.deepEqual(
  describeOnboardingGaps({ ...DOSSIER_COMPLET, units_missing_rent_count: 3 }),
  ['3 logement(s) sans loyer indiqué'],
);

// Un booléen vrai est une lacune.
assert.deepEqual(
  describeOnboardingGaps({ ...DOSSIER_COMPLET, missing_phone: true }),
  ['Ajouter votre numéro de téléphone'],
);

// Les compteurs arrivent en texte depuis PostgREST (bigint sérialisé en
// JSON). '2' doit compter comme une lacune, pas être ignoré.
assert.deepEqual(
  describeOnboardingGaps({ ...DOSSIER_COMPLET, active_leases_missing_bail_doc_count: '2' }),
  ['2 bail(aux) sans copie du bail téléversée'],
);

// Un dossier neuf : plusieurs lacunes, dans l'ordre de la table.
assert.deepEqual(
  describeOnboardingGaps({
    ...DOSSIER_COMPLET,
    missing_phone: true,
    missing_buildings: true,
    missing_units: true,
  }),
  [
    'Ajouter votre numéro de téléphone',
    'Ajouter votre premier immeuble',
    'Ajouter au moins un logement à votre immeuble',
  ],
);

// Une vue vide ou des champs absents ne doivent pas produire de fausses
// lacunes ni lever d'exception — le portail affiche la carte avant que
// toutes les données soient revenues.
assert.deepEqual(describeOnboardingGaps({}), []);

console.log('check-onboarding-gaps : 7/7 OK');
