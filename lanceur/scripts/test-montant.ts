// Vérifie la lecture des montants tapés (virgule décimale du Québec) : npx tsx scripts/test-montant.ts
import { montantSaisi } from '../src/lib/format.ts';
const cas: [string, string][] = [['689,85', '689.85'], ['600', '600'], ['1 250,50 $', '1250.50'], ['1250.5', '1250.5'], ['12,5,3', '12.53'], ['', '']];
let ko = 0; for (const [e, a] of cas) { const r = montantSaisi(e); if (r !== a) { ko++; console.error('ÉCHEC', JSON.stringify(e), '→', r, 'attendu', a); } }
console.log(ko ? `${ko} échec(s)` : `${cas.length} vérifications OK`); process.exitCode = ko ? 1 : 0;
