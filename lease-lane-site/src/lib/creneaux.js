/* Moments proposés pour une visite ou un appel : jours ouvrables à venir, à partir de demain.
   ponytail: pas d'agenda branché; c'est une préférence que l'équipe confirme ensuite. */
const JOUR = new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'short' });

export function prochainsCreneaux(heures = ['10 h 00', '14 h 30', '9 h 00', '16 h 00'], parJour = 2) {
  const d = new Date();
  const res = [];
  while (res.length < heures.length) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const jour = JOUR.format(d).replace(/^./, c => c.toUpperCase());
    for (let i = 0; i < parJour && res.length < heures.length; i++) res.push({ jour, heure: heures[res.length] });
  }
  return res;
}
