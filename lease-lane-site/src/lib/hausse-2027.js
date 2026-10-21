/* Calculateur « Hausse de loyer 2027 » : SEUL ENDROIT À METTRE À JOUR.
   ⚠️ tauxTravaux et la formule viennent de la livraison design (hausse-de-loyer-2027/LISEZMOI.md § 2). Avant la mise en ligne :
   remplacer par les valeurs officielles (Règlement sur les critères de fixation de loyer, outil du TAL) et faire
   valider par Steven sur au moins 3 cas comparés à l'outil officiel du TAL.
   Quand le TAL publie le taux 2027 (janvier) : changer annee et tauxBase, rien d'autre. */
export const PARAMS = {
  annee: 2026,         // année du taux appliqué (2026 jusqu'à la publication du taux 2027)
  tauxBase: 0.031,     // taux de base 2026 publié par le TAL (3,1 %, comme l'article 2026 du site); à confirmer par Steven
  tauxTravaux: 0.05,   // EXEMPLE : part annuelle du coût des travaux majeurs ajoutée au loyer; à valider
  dateEffet: { fr: '1er juillet 2027', en: 'July 1, 2027' },
};

/* Structure de la méthode 2026 telle que livrée (à valider — l'article 2026 du site dit que taxes et assurances
   ne comptent que pour la part de leur hausse qui dépasse le taux de base) :
   base = loyer × tauxBase; taxes = (taxes 2027 − taxes 2026) ÷ logements ÷ 12; assurance = idem;
   travaux = coût × tauxTravaux ÷ logements ÷ 12; service = coût mensuel; hausse = somme; % = hausse ÷ loyer.
   Une baisse de taxes ou d'assurance réduit la hausse. */
export function calculer(v) {
  const n = Math.max(1, v.logements);
  const base = v.loyer * PARAMS.tauxBase;
  const taxes = (v.taxes2 - v.taxes1) / n / 12;
  const assu = (v.assu2 - v.assu1) / n / 12;
  const travaux = v.travaux * PARAMS.tauxTravaux / n / 12;
  const service = v.service;
  const hausse = base + taxes + assu + travaux + service;
  return { base, taxes, assu, travaux, service, hausse, pct: v.loyer ? hausse / v.loyer : 0, nouveau: v.loyer + hausse };
}

/* « 1 450 », « 1450,50 », « 1 450.5 $ » → nombre; vide ou illisible → 0. */
export const nombre = (s) => {
  const x = parseFloat(String(s ?? '').replace(/[\s  ]/g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(x) ? x : 0;
};

/* Questions fréquentes : mêmes textes que le JSON-LD FAQPage des deux page.tsx. */
export const FAQ_2027 = [
  ['Quand le taux 2027 sera-t-il publié?', 'Le TAL publie le taux annuel en janvier. Le calculateur passe au taux 2027 dès sa publication; d’ici là, il utilise le taux 2026.'],
  ['Le locataire peut-il refuser la hausse?', 'Oui, dans le mois qui suit l’avis. Le bail est alors reconduit et le propriétaire peut demander au TAL de fixer le loyer dans le mois suivant.'],
  ['Puis-je augmenter le loyer d’un logement neuf?', 'Si l’immeuble a été construit, ou que son affectation a changé, depuis cinq ans ou moins, et que la mention est inscrite au bail (section F), le locataire ne peut pas demander au TAL de fixer le loyer pendant cette période.'],
  ['Que faire si l’immeuble a eu de gros travaux?', 'Inscrivez leur coût dans « Travaux majeurs » et gardez les factures : le TAL les demande en cas de refus.'],
  ['Le calculateur remplace-t-il un avis juridique?', 'Non. C’est un outil d’information générale. Vérifiez auprès du TAL avant d’envoyer l’avis.'],
];
