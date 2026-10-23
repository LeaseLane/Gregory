// Écriture courte des maquettes Penpot dans les tableaux du Lanceur : « 1180, Cartier — 2 », « 2880, ch. Sainte-Foy », « 640, 3e Avenue », « 4½ ».
// La ville se lit dans la colonne Quartier; l'adresse complète reste dans la fiche de l'immeuble.
export const adresse = (a: string | null | undefined) => !a ? '—' : a
  .replace(/,\s*(Québec|Lévis)(?=\s*(—|·|$))/g, '')
  .replace(/^(\d+[A-Za-z]?(?:-\d+)?),\s*(?:rue|avenue)\s+(?=[A-ZÉÈÎ])/, '$1, ')
  .replace(/\bchemin\b/g, 'ch.').replace(/\bboulevard\b/g, 'boul.');

export const piece = (t: string | null | undefined) => t ? t.replace(/(\d) ?1\/2/g, '$1½') : t ?? null;
