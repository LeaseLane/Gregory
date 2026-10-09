/* Converti depuis ui_kits/site-public/routes.js (prototype) — ne pas réintroduire de globaux window. */

const A = ['Accueil', '/'],
  PROP = ['Gestion immobilière', '/gestion-immobiliere'],
  LOC = ['Service aux locataires', '/locataires'];
const F = (lbl, path, extra) => Object.assign({
  path,
  fil: [A, LOC, [lbl, path]],
  index: false,
  schemas: ['WebPage', 'BreadcrumbList'],
  page: 'formulaire',
  liens: ['/locataires', '/logements-a-louer', '/faq']
}, extra);
const Q = [['limoilou', 'Limoilou', 'à Limoilou'], ['montcalm', 'Montcalm', 'à Montcalm'], ['saint-roch', 'Saint-Roch', 'à Saint-Roch'], ['saint-sauveur', 'Saint-Sauveur', 'à Saint-Sauveur'], ['sainte-foy', 'Sainte-Foy', 'à Sainte-Foy'], ['charlesbourg', 'Charlesbourg', 'à Charlesbourg'], ['beauport', 'Beauport', 'à Beauport'], ['lebourgneuf', 'Lebourgneuf', 'à Lebourgneuf'], ['vieux-quebec', 'Vieux-Québec', 'dans le Vieux-Québec']];
let LL_ROUTES = [{
  path: '/',
  page: 'accueil',
  requete: 'gestion immobilière Québec',
  titre: 'Gestion immobilière Québec | Lease Lane',
  description: 'Lease Lane gère vos logements à Québec : location rapide, loyers encaissés, entretien suivi et chiffres visibles. Cléo répond 24/7.',
  fil: [A],
  schemas: ['WebSite', 'RealEstateAgent', 'FAQPage', 'BreadcrumbList'],
  faq: ['p1', 'p4', 'p5', 'p13', 't1'],
  liens: ['/gestion-immobiliere', '/logements-a-louer', '/changer-de-gestionnaire', '/offre-de-service', '/cleo', '/faq']
}, {
  path: '/gestion-immobiliere',
  page: 'gestion',
  requete: 'compagnie de gestion immobilière Québec',
  titre: 'Compagnie de gestion immobilière Québec | Lease Lane',
  description: 'Gestion d\u2019immeubles locatifs à Québec : location, perception des loyers, entretien et rapports en ligne. Vous gardez les décisions importantes.',
  fil: [A, PROP],
  schemas: ['WebPage', 'Service', 'FAQPage', 'BreadcrumbList'],
  faq: ['p6', 'p8', 'p9', 'p10', 'p11', 'p12'],
  liens: ['/gestion-immobiliere/location', '/expertise-et-strategie', '/changer-de-gestionnaire', '/cleo', '/offre-de-service']
}, {
  path: '/gestion-immobiliere/location',
  page: 'location',
  requete: 'trouver des locataires rapidement',
  titre: 'Trouver des locataires rapidement | Lease Lane',
  description: 'Mise en marché, visites réservées par Cléo 24/7 et sélection conforme à la Loi 25. Calculez ce que vous coûte un logement vacant.',
  fil: [A, PROP, ['Location et mise en marché', '/gestion-immobiliere/location']],
  schemas: ['WebPage', 'Service', 'FAQPage', 'BreadcrumbList'],
  faq: ['p5', 'p7'],
  liens: ['/gestion-immobiliere', '/cleo', '/expertise-et-strategie', '/offre-de-service']
}, {
  path: '/expertise-et-strategie',
  page: 'expertise',
  requete: 'stratégie immobilière immeuble locatif',
  titre: 'Stratégie immobilière pour immeuble locatif | Lease Lane',
  description: 'Loyers, occupation, entretien planifié et conformité : nous analysons votre immeuble, proposons un plan écrit et mesurons les résultats chaque mois.',
  fil: [A, PROP, ['Expertise et stratégie', '/expertise-et-strategie']],
  schemas: ['WebPage', 'Service', 'FAQPage', 'BreadcrumbList'],
  faq: ['p15', 'p14', 'p16', 'p10'],
  liens: ['/gestion-immobiliere', '/changer-de-gestionnaire', '/offre-de-service', '/faq']
}, {
  path: '/changer-de-gestionnaire',
  page: 'changer',
  requete: 'changer de gestionnaire immobilier',
  titre: 'Changer de gestionnaire immobilier sans risque | Lease Lane',
  description: 'Quitter votre gestionnaire actuel en quatre étapes : lecture du contrat, transfert des baux et dossiers, avis aux locataires, premier rapport.',
  fil: [A, PROP, ['Changer de gestionnaire', '/changer-de-gestionnaire']],
  schemas: ['WebPage', 'HowTo', 'FAQPage', 'BreadcrumbList'],
  faq: ['p4', 'p3', 'p11'],
  liens: ['/gestion-immobiliere', '/expertise-et-strategie', '/offre-de-service']
}, {
  path: '/cleo',
  page: 'cleo',
  requete: 'agent conversationnel gestion immobilière',
  titre: 'Agent conversationnel en gestion immobilière | Lease Lane',
  description: 'Cléo, l\u2019agent IA de Lease Lane, explique 24/7 le droit du logement et le TAL (ex-Régie du logement), trie les urgences et réserve les visites.',
  fil: [A, ['Cléo', '/cleo']],
  schemas: ['WebPage', 'FAQPage', 'BreadcrumbList'],
  faq: ['p6', 'l3', 't1'],
  liens: ['/gestion-immobiliere/location', '/locataires', '/confidentialite', '/offre-de-service']
}, {
  path: '/logements-a-louer',
  page: 'logements',
  requete: 'appartement à louer Québec',
  titre: 'Appartements à louer Québec | Lease Lane',
  description: 'Logements à louer à Québec gérés par Lease Lane : filtres par secteur, pièces, loyer et date, visite réservée en tout temps avec Cléo.',
  fil: [A, ['Logements à louer', '/logements-a-louer']],
  schemas: ['WebPage', 'ItemList', 'BreadcrumbList'],
  faq: ['l1', 'l2'],
  liens: ['/locataires/demande-de-location', '/locataires', '/cleo', '/quartiers']
}, {
  path: '/logements-a-louer/4-et-demi-renove-montcalm',
  image: 'https://leaselane.ca/images/logements/montcalm-cartier.jpg',
  imageAlt: '4 ½ rénové à louer sur l\u2019avenue Cartier, Montcalm',
  page: 'fiche',
  requete: '4 ½ à louer Montcalm',
  titre: '4 ½ rénové à louer, Montcalm | Lease Lane',
  description: '4 ½ rénové de 880 pi² à Montcalm, 1 450 $ par mois, libre le 1er juillet. Réservez une visite avec Cléo ou faites votre demande en ligne.',
  fil: [A, ['Logements à louer', '/logements-a-louer'], ['4 ½ rénové, Montcalm', '/logements-a-louer/4-et-demi-renove-montcalm']],
  schemas: ['RealEstateListing', 'BreadcrumbList'],
  liens: ['/logements-a-louer', '/locataires/demande-de-location', '/quartiers/montcalm', '/cleo']
}, {
  path: '/locataires',
  page: 'locataires',
  requete: 'service aux locataires',
  titre: 'Service aux locataires 24/7 | Lease Lane',
  description: 'Urgence 24/7, demande de location, administration et plaintes; travaux, suivi, loyer et bail dans le portail locataire. Cléo répond en tout temps.',
  fil: [A, LOC],
  schemas: ['WebPage', 'FAQPage', 'BreadcrumbList'],
  faq: ['l5', 'l4', 'l6', 'l7', 'l8', 'l9', 'l10', 'l1'],
  liens: ['/locataires/demande-de-location', '/locataires/commentaire-ou-plainte', '/logements-a-louer', '/faq']
}, F('Demande de location', '/locataires/demande-de-location', {
  form: 'location',
  titre: 'Demande de location | Lease Lane',
  requete: 'demande de location logement',
  description: 'Déposez votre demande de location en ligne. Aucun dépôt exigé; seuls les renseignements nécessaires sont demandés, avec votre accord.'
}), F('Commentaire ou plainte', '/locataires/commentaire-ou-plainte', {
  form: 'plainte',
  titre: 'Commentaire ou plainte | Lease Lane',
  requete: 'plainte gestionnaire immobilier',
  description: 'Commentaire, plainte ou demande administrative : accusé de réception immédiat et réponse dans le délai publié.'
}), {
  path: '/faq',
  page: 'faq',
  requete: 'FAQ gestion immobilière',
  titre: 'FAQ gestion immobilière et location | Lease Lane',
  description: 'Réponses directes aux questions des propriétaires et des locataires : offre, contrat, transition, location, travaux, loyer et bail.',
  fil: [A, ['FAQ', '/faq']],
  schemas: ['WebPage', 'FAQPage', 'BreadcrumbList'],
  faq: 'tout',
  liens: ['/expertise-et-strategie', '/locataires', '/cleo', '/offre-de-service']
}, {
  path: '/blogue',
  page: 'blogue',
  requete: 'blogue gestion immobilière Québec',
  titre: 'Blogue gestion immobilière Québec | Lease Lane',
  description: 'Droit du logement, gestion d’immeubles et nouvelles de Lease Lane : des articles rédigés par notre équipe, révisés et datés, avec leurs sources.',
  fil: [A, ['Blogue & nouvelles', '/blogue']],
  schemas: ['Blog', 'BreadcrumbList'],
  liens: ['/faq', '/cleo', '/gestion-immobiliere', '/offre-de-service', '/logements-a-louer']
}, {
  path: '/blogue/hausse-de-loyer-2026',
  page: 'article',
  requete: 'hausse de loyer 2026 Québec TAL',
  titre: 'Hausse de loyer 2026 au Québec : délais et TAL | Lease Lane',
  description: 'Les délais d’avis, le calcul du TAL et les options du locataire et du propriétaire, avec les articles du Code civil cités. Révisé par un juriste.',
  fil: [A, ['Blogue & nouvelles', '/blogue'], ['Hausse de loyer 2026', '/blogue/hausse-de-loyer-2026']],
  schemas: ['Article', 'BreadcrumbList', 'FAQPage'],
  liens: ['/blogue', '/cleo', '/faq', '/offre-de-service', '/logements-a-louer']
}, {
  path: '/a-propos',
  page: 'apropos',
  requete: 'Lease Lane gestion locative',
  titre: 'À propos de Lease Lane, gestion locative Québec',
  description: 'Lease Lane réunit une équipe de gestion et Cléo, un agent IA 24/7 formé au droit du logement, pour des logements loués plus vite et une gestion que vous voyez.',
  fil: [A, ['À propos', '/a-propos']],
  schemas: ['AboutPage', 'RealEstateAgent', 'BreadcrumbList'],
  liens: ['/cleo', '/gestion-immobiliere', '/offre-de-service']
}, {
  path: '/nous-joindre',
  page: 'contact',
  requete: 'joindre Lease Lane',
  titre: 'Joindre Lease Lane | Gestion immobilière à Québec',
  description: 'Téléphone, courriel, bureau à Lévis ou Cléo 24/7 : propriétaire ou locataire, choisissez comment joindre Lease Lane.',
  fil: [A, ['Nous joindre', '/nous-joindre']],
  schemas: ['ContactPage', 'BreadcrumbList'],
  liens: ['/offre-de-service', '/cleo', '/faq']
}, {
  path: '/offre-de-service',
  page: 'offre',
  requete: 'offre de gestion immobilière',
  titre: 'Obtenir une offre de gestion immobilière | Lease Lane',
  description: 'Décrivez votre immeuble en deux minutes : type, nombre de portes, secteur. Nous répondons avec une offre et un rendez-vous proposé.',
  fil: [A, ['Offre de service', '/offre-de-service']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/expertise-et-strategie', '/changer-de-gestionnaire', '/confidentialite']
}, {
  path: '/quartiers',
  page: 'quartiers',
  requete: 'quartiers de Québec où louer',
  titre: 'Quartiers de Québec : guides pour locataires | Lease Lane',
  description: 'Neuf guides de quartier à Québec : arrondissement, repères et logements à louer gérés par Lease Lane, avec visite réservée en tout temps avec Cléo.',
  fil: [A, ['Logements à louer', '/logements-a-louer'], ['Guides de quartier', '/quartiers']],
  schemas: ['WebPage', 'ItemList', 'BreadcrumbList'],
  liens: ['/logements-a-louer', '/locataires/demande-de-location', '/cleo']
}, ...Q.map(([s, n, dans]) => ({
  path: '/quartiers/' + s,
  page: 'quartier',
  requete: 'appartement à louer ' + n,
  titre: 'Appartement à louer ' + dans + ' | Lease Lane',
  description: 'Guide du quartier ' + n + ' pour locataires : arrondissement, repères et logements à louer gérés par Lease Lane. Visite réservée 24/7 avec Cléo.',
  fil: [A, ['Guides de quartier', '/quartiers'], [n, '/quartiers/' + s]],
  schemas: ['WebPage', 'FAQPage', 'BreadcrumbList'],
  faq: ['l1', 'l2', 't6'],
  liens: ['/logements-a-louer', '/locataires/demande-de-location', '/quartiers', '/cleo']
})), {
  path: '/glossaire-bail-residentiel',
  page: 'glossaire',
  index: false,
  requete: 'glossaire bail résidentiel Québec',
  titre: 'Glossaire du bail résidentiel au Québec | Lease Lane',
  description: 'Régie du logement, hausse de loyer, cession, dépôt de garantie : les mots courants et le terme du Code civil ou du TAL, avec la source sur le site.',
  fil: [A, ['FAQ', '/faq'], ['Glossaire du bail résidentiel', '/glossaire-bail-residentiel']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/faq', '/cleo', '/locataires', '/offre-de-service']
}, {
  path: '/temoins',
  page: 'legal',
  requete: 'témoins de navigation',
  titre: 'Témoins de navigation | Lease Lane',
  description: 'Les témoins utilisés sur leaselane.ca, leurs fins, leur durée et la façon de modifier vos choix en tout temps.',
  fil: [A, ['Témoins de navigation', '/temoins']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/confidentialite', '/conditions-utilisation', '/nous-joindre']
}, {
  path: '/conditions-utilisation',
  page: 'legal',
  requete: 'conditions d\u2019utilisation',
  titre: 'Conditions d\u2019utilisation | Lease Lane',
  description: 'Les conditions qui encadrent l\u2019utilisation du site leaselane.ca, de Cléo, des annonces de logements et des formulaires en ligne.',
  fil: [A, ['Conditions d\u2019utilisation', '/conditions-utilisation']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/confidentialite', '/temoins', '/nous-joindre']
}, {
  path: '/confidentialite',
  page: 'legal',
  requete: 'politique de confidentialité',
  titre: 'Politique de confidentialité | Lease Lane',
  description: 'Comment Lease Lane recueille, utilise, conserve et protège vos renseignements personnels, conformément à la Loi 25.',
  fil: [A, ['Politique de confidentialité', '/confidentialite']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/temoins', '/conditions-utilisation', '/gouvernance', '/nous-joindre']
}, {
  path: '/gouvernance',
  page: 'legal',
  index: true,
  requete: 'gouvernance renseignements personnels',
  titre: 'Gouvernance des renseignements personnels | Lease Lane',
  description: 'Notre responsable de la protection des renseignements personnels, les rôles, le cycle de vie des renseignements, les incidents et les plaintes (Loi 25).',
  fil: [A, ['Gouvernance des renseignements personnels', '/gouvernance']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/confidentialite', '/temoins', '/nous-joindre']
}];
let LL_ALIAS = {
  accueil: '/',
  recherche: '/logements-a-louer',
  fiche: '/logements-a-louer/4-et-demi-renove-montcalm',
  proprietaires: '/gestion-immobiliere',
  apropos: '/a-propos',
  contact: '/nous-joindre'
};
let LL_SITE = {
  domaine: 'https://leaselane.ca',
  nom: 'Lease Lane',
  raison: 'Solutions locatives LeaseLane inc.',
  slogan: 'Solutions locatives intelligentes',
  telephone: '418-473-3208',
  courriel: 'info@leaselane.ca',
  neq: '1182479981',
  adresse: {
    rue: '1516, rue du Layon',
    ville: 'Lévis',
    region: 'QC',
    cp: 'G7A 0E6'
  },
  urgence: '418-473-3208',
  /* Heures d'ouverture (décision du 8 oct. 2026). */
  heures: 'Du lundi au vendredi, de 8 h à 17 h. Urgences 24/7. Rencontres sur rendez-vous seulement.',
  /* Délais publiés (décision du 8 oct. 2026) : urgences 24/7, première réponse aux demandes en moins de 24 h. */
  delai: 'première réponse en moins de 24 h',
  /* Responsable de la protection des renseignements personnels (Loi 25, art. 3.1) : le président, sans délégation (décision du 8 oct. 2026).
     Le site publie le titre et le courriel dédié, sans nom. */
  responsable: {
    nom: null,
    titre: 'Président',
    courriel: 'confidentialite@leaselane.ca'
  },
  /* Durée de validité du choix de témoins, en mois (S7). null : pas d'échéance tant que la valeur n'est pas fournie. version : version active de la politique des témoins. */
  temoins: {
    validiteMois: null,
    version: '1.0'
  },
  /* Prototype : page de connexion. En production : connexion du portail locataire [adresse à confirmer]. */
  portail: "/connexion"
};
let LL_TEL_URGENCE = () => 'tel:' + String(LL_SITE.urgence || '').replace(/[^\d+]/g, '');
let LL_CARTE = {
  tuiles: '[URL des tuiles approuvées]',
  attribution: '[attribution de la source]',
  fournisseur: '[fournisseur]'
};
export { LL_ROUTES, LL_ALIAS, LL_SITE, LL_TEL_URGENCE, LL_CARTE };
