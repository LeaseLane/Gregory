/* Converti depuis ui_kits/site-public/data.js (prototype) — ne pas réintroduire de globaux window. */

let LL_DATA = {
  logements: [{
    id: 'L1',
    batiment: 'Plex (2 à 5 logements)',
    propriete: 'Appartement',
    annee: 1925,
    prix: '1 450 $',
    titre: '4 ½ rénové, Montcalm',
    adresse: '1180, avenue Cartier, Québec',
    chambres: 2,
    sallesDeBain: 1,
    superficie: 880,
    badge: 'Nouveau',
    badgeTon: 'bleu',
    dispo: 'Libre le 1er juillet',
    lat: 46.8045,
    lng: -71.2235,
    secteur: 'Montcalm'
  }, {
    id: 'L2',
    batiment: 'Plex (2 à 5 logements)',
    propriete: 'Appartement',
    annee: 1938,
    prix: '1 195 $',
    titre: '3 ½ lumineux, Limoilou',
    adresse: '640, 3e Avenue, Québec',
    chambres: 1,
    sallesDeBain: 1,
    superficie: 640,
    badge: 'Visite libre',
    badgeTon: 'succes',
    dispo: 'Libre immédiatement',
    lat: 46.8250,
    lng: -71.2260,
    secteur: 'Limoilou'
  }, {
    id: 'L3',
    batiment: 'Maison de ville',
    propriete: 'Maison',
    annee: 1988,
    prix: '1 780 $',
    titre: '5 ½ avec garage, Sainte-Foy',
    adresse: '2880, chemin Sainte-Foy, Québec',
    chambres: 3,
    sallesDeBain: 2,
    superficie: 1240,
    dispo: 'Libre le 1er août',
    lat: 46.7820,
    lng: -71.2830,
    secteur: 'Sainte-Foy'
  }, {
    id: 'L4',
    batiment: 'Immeuble de 6 logements et +',
    propriete: 'Appartement',
    annee: 2016,
    prix: '1 320 $',
    titre: '4 ½ près de la gare, Saint-Roch',
    adresse: '420, rue Saint-Joseph Est, Québec',
    chambres: 2,
    sallesDeBain: 1,
    superficie: 790,
    badge: 'Chauffé éclairé',
    badgeTon: 'neutre',
    dispo: 'Libre le 1er octobre',
    lat: 46.8145,
    lng: -71.2225,
    secteur: 'Saint-Roch'
  }, {
    id: 'L5',
    batiment: 'Maison de ville',
    propriete: 'Maison',
    annee: 2004,
    prix: '2 050 $',
    titre: 'Maison de ville, Beauport',
    adresse: '41, rue des Roseaux, Québec',
    chambres: 3,
    sallesDeBain: 2,
    superficie: 1560,
    dispo: 'Libre le 15 août',
    lat: 46.8600,
    lng: -71.1950,
    secteur: 'Beauport'
  }, {
    id: 'L6',
    batiment: 'Plex (2 à 5 logements)',
    propriete: 'Studio ou loft',
    annee: 1946,
    prix: '985 $',
    titre: '2 ½ meublé, Saint-Sauveur',
    adresse: '1190, rue Saint-Vallier Ouest, Québec',
    chambres: 1,
    sallesDeBain: 1,
    superficie: 520,
    badge: 'Meublé',
    badgeTon: 'bleu',
    dispo: 'Libre immédiatement',
    lat: 46.8090,
    lng: -71.2400,
    secteur: 'Saint-Sauveur'
  }, {
    id: 'L7',
    batiment: 'Immeuble de 6 logements et +',
    propriete: 'Appartement',
    annee: 1979,
    prix: '1 260 $',
    titre: '3 ½ avec balcon, Charlesbourg',
    adresse: '2450, avenue des Églises, Québec',
    chambres: 1,
    sallesDeBain: 1,
    superficie: 700,
    dispo: 'Libre le 1er juillet',
    lat: 46.8560,
    lng: -71.2610,
    secteur: 'Charlesbourg'
  }, {
    id: 'L8',
    batiment: 'Immeuble de 6 logements et +',
    propriete: 'Condo locatif',
    annee: 2021,
    prix: '1 540 $',
    titre: '4 ½ rénové, Lebourgneuf',
    adresse: '1355, boulevard Lebourgneuf, Québec',
    chambres: 2,
    sallesDeBain: 1,
    superficie: 920,
    badge: 'Nouveau',
    badgeTon: 'bleu',
    dispo: 'Libre le 1er août',
    lat: 46.8380,
    lng: -71.2900,
    secteur: 'Lebourgneuf'
  }, {
    id: 'L9',
    batiment: 'Plex (2 à 5 logements)',
    propriete: 'Appartement',
    annee: 1890,
    prix: '1 890 $',
    titre: '5 ½ familial, Vieux-Québec',
    adresse: '88, rue Saint-Louis, Québec',
    chambres: 3,
    sallesDeBain: 1,
    superficie: 1180,
    dispo: 'Libre le 1er octobre',
    lat: 46.8115,
    lng: -71.2070,
    secteur: 'Vieux-Québec'
  }, {
    id: 'L10',
    batiment: 'Immeuble de 6 logements et +',
    propriete: 'Appartement',
    annee: 1962,
    prix: '1 120 $',
    titre: '3 ½ lumineux, Limoilou',
    adresse: '1780, 8e Avenue, Québec',
    chambres: 1,
    sallesDeBain: 1,
    superficie: 660,
    badge: 'Chauffé éclairé',
    badgeTon: 'neutre',
    dispo: 'Libre immédiatement',
    lat: 46.8300,
    lng: -71.2330,
    secteur: 'Limoilou'
  }],
  secteurs: [{
    nom: 'Sainte-Foy',
    n: 31,
    lat: 46.7800,
    lng: -71.2900
  }, {
    nom: 'Limoilou',
    n: 24,
    lat: 46.8280,
    lng: -71.2300
  }, {
    nom: 'Saint-Roch',
    n: 19,
    lat: 46.8150,
    lng: -71.2250
  }, {
    nom: 'Montcalm',
    n: 17,
    lat: 46.8030,
    lng: -71.2260
  }, {
    nom: 'Charlesbourg',
    n: 14,
    lat: 46.8560,
    lng: -71.2620
  }, {
    nom: 'Vieux-Québec',
    n: 12,
    lat: 46.8125,
    lng: -71.2060
  }, {
    nom: 'Beauport',
    n: 11,
    lat: 46.8600,
    lng: -71.1950
  }, {
    nom: 'Lebourgneuf',
    n: 9,
    lat: 46.8380,
    lng: -71.2950
  }],
  services: [{
    icone: 'message-square',
    titre: 'Relations avec les locataires',
    texte: 'Réception des messages, avis et communications courantes. Un membre de notre équipe prend le relais dès que la situation l\u2019exige.'
  }, {
    icone: 'wrench',
    titre: 'Demandes de service et entretien',
    texte: 'Réception avec photos, qualification de l\u2019urgence, assignation au bon intervenant, relances jusqu\u2019à la fermeture du dossier.'
  }, {
    icone: 'banknote',
    titre: 'Loyers et retards de paiement',
    texte: 'Loyers déposés directement dans votre compte. Validation automatisée des paiements, relances et gestion des impayés.'
  }, {
    icone: 'file-text',
    titre: 'Rapports et espace propriétaire',
    texte: 'Rapport mensuel au plus tard le 15 : loyers dus et reçus, arriérés, vacances, travaux, factures et échéances.'
  }, {
    icone: 'gavel',
    titre: 'Administration et dossiers au TAL',
    texte: 'Tenue des dossiers, suivi des échéances, classement des pièces et coordination des dossiers au Tribunal administratif du logement.'
  }, {
    icone: 'key',
    titre: 'Location et relocation',
    texte: 'Annonces, visites, sélection selon des critères objectifs. La décision finale : vous la gardez ou vous nous la confiez.'
  }],
  conversation: [{
    role: 'agent',
    texte: 'Bonjour, je suis Cléo, l\u2019agent IA de Lease Lane. Je réponds 24/7 et je passe la main à un humain quand il le faut. Nos échanges sont conservés pour assurer le suivi de votre demande.'
  }]
};
export { LL_DATA };
