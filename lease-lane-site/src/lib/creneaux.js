/* Moments proposés pour une visite ou un appel : jours ouvrables à venir (ni fin de semaine ni férié), à partir de demain.
   ponytail: pas d'agenda branché; c'est une préférence que l'équipe confirme ensuite. */
const JOUR = new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'short' });

const ISO = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const nieme = (an, mois, jourSem, n) => { const d = new Date(an, mois, 1); while (d.getDay() !== jourSem) d.setDate(d.getDate() + 1); d.setDate(d.getDate() + 7 * (n - 1)); return d; };
/* Jours fériés du Québec (Loi sur les normes du travail). */
function feries(an) {
  const a = an % 19, b = Math.floor(an / 100), c = an % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    paques = new Date(an, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
  const decale = n => new Date(paques.getFullYear(), paques.getMonth(), paques.getDate() + n);
  const patriotes = new Date(an, 4, 24); while (patriotes.getDay() !== 1) patriotes.setDate(patriotes.getDate() - 1);
  return new Set([new Date(an, 0, 1), decale(-2), decale(1), patriotes, new Date(an, 5, 24), new Date(an, 6, 1),
    nieme(an, 8, 1, 1), nieme(an, 9, 1, 2), new Date(an, 11, 25), new Date(an, 11, 26)].map(ISO));
}

export function prochainsCreneaux(heures = ['10 h 00', '14 h 30', '9 h 00', '16 h 00'], parJour = 2) {
  const d = new Date();
  const res = [];
  while (res.length < heures.length) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6 || feries(d.getFullYear()).has(ISO(d))) continue;
    const jour = JOUR.format(d).replace(/^./, c => c.toUpperCase());
    for (let i = 0; i < parJour && res.length < heures.length; i++) res.push({ jour, heure: heures[res.length] });
  }
  return res;
}

/* Vérification rapide : node src/lib/creneaux.js */
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('creneaux.js')) {
  const f = feries(2026);
  for (const j of ['2026-01-01', '2026-04-03', '2026-04-06', '2026-05-18', '2026-06-24', '2026-07-01', '2026-09-07', '2026-10-12', '2026-12-25']) if (!f.has(j)) throw new Error('férié manquant ' + j);
  if (f.has('2026-10-13')) throw new Error('faux férié');
  console.log('fériés 2026 ok', prochainsCreneaux());
}
