// Heures d'ouverture de la ligne (America/Toronto) : jours ISO (1 = lundi … 7 = dimanche), "HH:MM".
export function ouvert(h: { debut: string; fin: string; jours: number[] }, maintenant = new Date()) {
  const loc = new Date(maintenant.toLocaleString("en-US", { timeZone: "America/Toronto" }));
  const jour = loc.getDay() === 0 ? 7 : loc.getDay(), hm = loc.toTimeString().slice(0, 5);
  return h.jours.includes(jour) && hm >= h.debut && hm < h.fin;
}
