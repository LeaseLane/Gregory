// Vérifie le calcul du calculateur « Hausse de loyer 2027 » (src/lib/hausse-2027.js). Usage : node scripts/tester-hausse-2027.mjs
import assert from 'node:assert';
import { calculer, nombre, PARAMS } from '../src/lib/hausse-2027.js';
const arr = (x) => Math.round(x * 100) / 100;
// Exemple de la page : 1 450 $, 6 logements, taxes 8 400 → 8 820, assurance 3 600 → 3 960, travaux 12 000.
const r = calculer({ loyer: 1450, logements: 6, taxes1: 8400, taxes2: 8820, assu1: 3600, assu2: 3960, travaux: 12000, service: 0 });
assert.equal(arr(r.base), arr(1450 * PARAMS.tauxBase));
assert.equal(arr(r.taxes), 5.83); assert.equal(arr(r.assu), 5);
assert.equal(arr(r.travaux), arr(12000 * PARAMS.tauxTravaux / 6 / 12));
assert.equal(arr(r.nouveau), arr(1450 + r.hausse));
// Une baisse de taxes réduit la hausse; 0 logement est compté comme 1; un service s'ajoute tel quel.
assert.ok(calculer({ loyer: 1000, logements: 0, taxes1: 1200, taxes2: 0, assu1: 0, assu2: 0, travaux: 0, service: 0 }).taxes === -100);
assert.equal(calculer({ loyer: 1000, logements: 1, taxes1: 0, taxes2: 0, assu1: 0, assu2: 0, travaux: 0, service: 25 }).service, 25);
// Saisie : espaces (même insécables), virgule décimale, symbole $.
assert.equal(nombre('1 450'), 1450); assert.equal(nombre('1 450,50 $'), 1450.5); assert.equal(nombre(''), 0); assert.equal(nombre('abc'), 0);
console.log(`hausse 2027 : calcul vérifié (taux ${PARAMS.tauxBase * 100} %, exemple + ${arr(r.hausse)} $ / mois)`);
