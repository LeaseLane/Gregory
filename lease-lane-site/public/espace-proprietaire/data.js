window.LL_PROP = {
  utilisateur:{nom:'Marie-Josée Bérubé', initiales:'MB', courriel:'mj.berube@courriel.ca', sous:'34 portes · 5 immeubles'},
  notifications:[
    {icone:'wallet', texte:'Autorisation demandée : remplacement du chauffe-eau, 1 250 $ (Plomberie Capitale).', quand:'Il y a 2 h', lu:false},
    {icone:'triangle-alert', texte:'Urgence reprise par Camille D. : détecteur de fumée, 420 Saint-Joseph Est — 5.', quand:'Hier · 17 h 40', lu:false},
    {icone:'banknote', texte:'Loyer partiel reçu : 640 3e Avenue, logement 7 (700 $ sur 1 195 $).', quand:'19 sept.', lu:false},
    {icone:'file-text', texte:'Rapport d\u2019août disponible dans Finances.', quand:'15 sept.', lu:true}
  ],
  approbations:[
    {id:'TRV-2026-0311', demande:'DEM-2026-0151', titre:'Remplacement du chauffe-eau', adresse:'640, 3e Avenue — logement 3', montant:'1 250 $', fournisseur:'Plomberie Capitale', seuil:'Au-delà de votre seuil de 500 $'},
    {id:'TRV-2026-0309', demande:'DEM-2026-0153', titre:'Réparation de la porte d\u2019entrée arrière', adresse:'420, rue Saint-Joseph Est — commun', montant:'640 $', fournisseur:'Menuiserie Lauzon', seuil:'Au-delà de votre seuil de 500 $'}
  ],
  demandes:[
    {id:'DEM-2026-0148', titre:'Fuite sous l\u2019évier', logement:'1180 Cartier — 2', locataire:'Samuel Fortin', etat:'fermee', date:'18 sept.', cout:'210 $', urgence:'normale',
     texte:'Fuite lente sous l\u2019évier de la cuisine, l\u2019armoire est humide. Photos jointes.', pieces:2,
     etapes:[['Signalement','Locataire','18 sept. · 8 h 42'],['Qualification','Plateforme','18 sept. · 8 h 43'],['Assignation','Camille D.','18 sept. · 9 h 10'],['Autorisation','Sous le seuil','18 sept. · 9 h 26'],['Intervention','Plomberie Capitale','19 sept. · 13 h 05'],['Fermeture','Camille D.','19 sept. · 16 h 40']]},
    {id:'DEM-2026-0151', titre:'Chauffe-eau hors service', logement:'640 3e Avenue — 3', locataire:'Nadia Tremblay', etat:'attente_approbation', date:'19 sept.', cout:'1 250 $', urgence:'elevee',
     texte:'Plus d\u2019eau chaude depuis ce matin. Le réservoir fait un bruit métallique.', pieces:1,
     etapes:[['Signalement','Locataire','19 sept. · 8 h 42'],['Qualification','Plateforme','19 sept. · 8 h 43'],['Assignation','Camille D.','19 sept. · 9 h 10'],['Autorisation','Vous','En attente'],['Intervention','Plomberie Capitale','—'],['Fermeture','—','—']]},
    {id:'DEM-2026-0152', titre:'Détecteur de fumée défectueux', logement:'420 Saint-Joseph Est — 5', locataire:'Olivier Gagnon', etat:'urgence', date:'20 sept.', cout:'—', urgence:'urgence',
     texte:'Le détecteur sonne en continu sans fumée, impossible de l\u2019arrêter.', pieces:0,
     etapes:[['Signalement','Locataire','20 sept. · 17 h 31'],['Reprise humaine','Camille D.','20 sept. · 17 h 40'],['Assignation','Électrique Duval','20 sept. · 17 h 55'],['Intervention','Électrique Duval','20 sept. · 19 h 10'],['Fermeture','—','—']]},
    {id:'DEM-2026-0153', titre:'Porte d\u2019entrée arrière qui ferme mal', logement:'420 Saint-Joseph Est — commun', locataire:'Signalement interne', etat:'assignee', date:'20 sept.', cout:'640 $', urgence:'normale',
     texte:'Le pêne n\u2019accroche plus ; la porte reste entrouverte la nuit.', pieces:3,
     etapes:[['Signalement','Équipe Lease Lane','20 sept. · 10 h 02'],['Qualification','Plateforme','20 sept. · 10 h 03'],['Assignation','Menuiserie Lauzon','20 sept. · 11 h 20'],['Autorisation','Vous','En attente'],['Intervention','—','—'],['Fermeture','—','—']]},
    {id:'DEM-2026-0154', titre:'Robinet de baignoire qui goutte', logement:'2880 Sainte-Foy — 1', locataire:'Léa Bouchard', etat:'qualifiee', date:'21 sept.', cout:'—', urgence:'normale',
     texte:'Goutte à goutte constant, même robinet bien fermé.', pieces:1,
     etapes:[['Signalement','Locataire','21 sept. · 19 h 12'],['Qualification','Plateforme','21 sept. · 19 h 13'],['Assignation','—','—'],['Autorisation','—','—'],['Intervention','—','—'],['Fermeture','—','—']]}
  ],
  immeubles:[
    {id:'I1', adresse:'1180, avenue Cartier', secteur:'Montcalm', ville:'Québec', portes:8, occupees:8, loyer:'11 240 $', arriere:'0 $', annee:1962, etages:3, photo:'../../assets/img/logements/montcalm-cartier.jpg',
     logements:[['1','4 ½','1 380 $','Occupé','J. Lévesque'],['2','4 ½','1 450 $','Occupé','S. Fortin'],['3','3 ½','1 195 $','Occupé','M. Roy'],['4','4 ½','1 420 $','Occupé','A. Pelletier'],['5','5 ½','1 780 $','Occupé','Famille Nguyen'],['6','3 ½','1 210 $','Occupé','C. Martel'],['7','4 ½','1 405 $','Occupé','D. Lachance'],['8','4 ½','1 400 $','Occupé','P. Simard']]},
    {id:'I2', adresse:'640, 3e Avenue', secteur:'Limoilou', ville:'Québec', portes:12, occupees:11, loyer:'15 600 $', arriere:'1 450 $', annee:1978, etages:3,
     logements:[['1','3 ½','1 195 $','Occupé','N. Tremblay'],['2','3 ½','1 195 $','Occupé','K. Ouellet'],['3','4 ½','1 320 $','Occupé','N. Tremblay'],['4','4 ½','1 320 $','Vacant','—'],['5','3 ½','1 180 $','Occupé','R. Côté'],['6','3 ½','1 190 $','Occupé','F. Blais'],['7','3 ½','1 195 $','Arriéré','G. Paquet']]},
    {id:'I3', adresse:'420, rue Saint-Joseph Est', secteur:'Saint-Roch', ville:'Québec', portes:6, occupees:6, loyer:'7 910 $', arriere:'0 $', annee:1995, etages:3,
     logements:[['1','4 ½','1 320 $','Occupé','O. Gagnon'],['2','4 ½','1 320 $','Occupé','T. Morin'],['3','3 ½','1 250 $','Occupé','V. Dubé'],['4','3 ½','1 250 $','Occupé','E. Girard'],['5','4 ½','1 385 $','Occupé','O. Gagnon'],['6','4 ½','1 385 $','Occupé','H. Bergeron']]},
    {id:'I4', adresse:'2880, chemin Sainte-Foy', secteur:'Sainte-Foy', ville:'Québec', portes:5, occupees:4, loyer:'5 400 $', arriere:'420 $', annee:2004, etages:2,
     logements:[['1','5 ½','1 780 $','Occupé','L. Bouchard'],['2','4 ½','1 420 $','Occupé','B. Caron'],['3','3 ½','1 100 $','Vacant','—'],['4','3 ½','1 100 $','Arriéré','S. Ménard'],['5','—','—','Occupé','Y. Fillion']]},
    {id:'I5', adresse:'41, rue des Roseaux', secteur:'Beauport', ville:'Québec', portes:3, occupees:3, loyer:'3 000 $', arriere:'0 $', annee:2015, etages:2,
     logements:[['1','Maison','2 050 $','Occupé','Famille Roy'],['2','—','—','Occupé','—'],['3','—','—','Occupé','—']]}
  ],
  locataires:[
    {id:'T1', nom:'Samuel Fortin', initiales:'SF', logement:'1180 Cartier — 2', bail:'1 juill. 2025 → 30 juin 2026', loyer:'1 450 $', etat:'paye', tel:'418 555-0187', courriel:'s.fortin@courriel.ca', depuis:'2023', demandes:1},
    {id:'T2', nom:'Nadia Tremblay', initiales:'NT', logement:'640 3e Avenue — 3', bail:'1 juill. 2026 → 30 juin 2027', loyer:'1 320 $', etat:'paye', tel:'418 555-0234', courriel:'n.tremblay@courriel.ca', depuis:'2026', demandes:1},
    {id:'T3', nom:'Olivier Gagnon', initiales:'OG', logement:'420 Saint-Joseph Est — 5', bail:'1 juill. 2024 → 30 juin 2027', loyer:'1 385 $', etat:'paye', tel:'418 555-0311', courriel:'o.gagnon@courriel.ca', depuis:'2024', demandes:1},
    {id:'T4', nom:'Gabriel Paquet', initiales:'GP', logement:'640 3e Avenue — 7', bail:'1 juill. 2025 → 30 juin 2026', loyer:'1 195 $', etat:'retard', tel:'418 555-0402', courriel:'g.paquet@courriel.ca', depuis:'2022', demandes:0},
    {id:'T5', nom:'Sophie Ménard', initiales:'SM', logement:'2880 Sainte-Foy — 4', bail:'1 juill. 2026 → 30 juin 2027', loyer:'1 100 $', etat:'retard', tel:'418 555-0456', courriel:'s.menard@courriel.ca', depuis:'2026', demandes:0},
    {id:'T6', nom:'Léa Bouchard', initiales:'LB', logement:'2880 Sainte-Foy — 1', bail:'1 juill. 2025 → 30 juin 2026', loyer:'1 780 $', etat:'paye', tel:'418 555-0519', courriel:'l.bouchard@courriel.ca', depuis:'2021', demandes:1}
  ],
  releves31:[
    {id:'R1',immeuble:'1180, avenue Cartier',logement:'2',locataires:'Samuel Fortin',statut:'À produire'},
    {id:'R2',immeuble:'640, 3e Avenue',logement:'3',locataires:'Nadia Tremblay',statut:'À produire'},
    {id:'R3',immeuble:'640, 3e Avenue',logement:'7',locataires:'Gabriel Paquet',statut:'À produire'},
    {id:'R4',immeuble:'420, rue Saint-Joseph Est',logement:'5',locataires:'Olivier Gagnon',statut:'À produire'},
    {id:'R5',immeuble:'2880, chemin Sainte-Foy',logement:'1',locataires:'Léa Bouchard',statut:'À produire'},
    {id:'R6',immeuble:'2880, chemin Sainte-Foy',logement:'4',locataires:'Sophie Ménard',statut:'À produire'}
  ],
  messages:[
    {id:'M1', de:'Camille Desrosiers', initiales:'CD', role:'Gestionnaire Lease Lane', objet:'Chauffe-eau — 640 3e Avenue, log. 3 : votre autorisation', quand:'Aujourd\u2019hui · 9 h 12', lu:false, dossier:'boite',
     corps:'Bonjour Marie-Josée,\n\nLe plombier confirme que le réservoir de 2011 est en fin de vie. L\u2019estimation de Plomberie Capitale est de 1 250 $ (remplacement 60 gal., installation, disposition). Elle dépasse votre seuil de 500 $ : nous attendons votre autorisation dans le dossier DEM-2026-0151.\n\nLa locataire est sans eau chaude depuis hier ; nous pouvons intervenir demain matin si vous approuvez aujourd\u2019hui.\n\nCamille', pieces:['Estimation-Plomberie-Capitale.pdf']},
    {id:'M2', de:'Lease Lane', initiales:'LL', role:'Rapports', objet:'Votre rapport d\u2019août 2026 est disponible', quand:'15 sept.', lu:true, dossier:'boite',
     corps:'Le rapport mensuel d\u2019août est prêt : loyers dus et reçus, arriérés, logements vacants, travaux, factures et échéances. Vous le trouverez dans Finances › Relevés.', pieces:['Rapport-aout-2026.pdf']},
    {id:'M3', de:'Camille Desrosiers', initiales:'CD', role:'Gestionnaire Lease Lane', objet:'Logement 4, 640 3e Avenue : deux visites planifiées', quand:'12 sept.', lu:true, dossier:'boite',
     corps:'Deux candidatures qualifiées pour le 4 ½ vacant. Visites jeudi 17 h et samedi 10 h. Je vous reviens avec les dossiers complets après les visites.', pieces:[]},
    {id:'M4', de:'Vous', initiales:'MB', role:'', objet:'Toiture 1180 Cartier — soumissions', quand:'4 sept.', lu:true, dossier:'envoyes',
     corps:'Merci pour les trois soumissions. Je retiens Toitures Beauport, échéancier de mai 2027. On en reparle au rapport d\u2019octobre.', pieces:[]}
  ],
  mois:[{m:'Avr',v:38},{m:'Mai',v:41},{m:'Juin',v:40},{m:'Juil',v:43},{m:'Août',v:42},{m:'Sept',v:41}],
  ecritures:[
    {id:'E1', date:'2026-09-01', libelle:'Loyers encaissés — 1180 Cartier', categorie:'Revenu', montant:'+11 240,00 $', ton:'succes'},
    {id:'E2', date:'2026-09-01', libelle:'Loyers encaissés — 420 Saint-Joseph Est', categorie:'Revenu', montant:'+7 910,00 $', ton:'succes'},
    {id:'E3', date:'2026-09-03', libelle:'Honoraires de gestion 6 %', categorie:'Honoraires', montant:'−2 476,80 $', ton:'neutre'},
    {id:'E4', date:'2026-09-08', libelle:'Plomberie Capitale — DEM-2026-0148', categorie:'Entretien', montant:'−210,00 $', ton:'neutre'},
    {id:'E5', date:'2026-09-08', libelle:'Coordination 10 % — DEM-2026-0148', categorie:'Coordination', montant:'−21,00 $', ton:'neutre'},
    {id:'E6', date:'2026-09-15', libelle:'Assurance immeuble — 420 Saint-Joseph Est', categorie:'Assurance', montant:'−742,00 $', ton:'neutre'},
    {id:'E7', date:'2026-09-19', libelle:'Loyer partiel — 640 3e Avenue, log. 7', categorie:'Revenu', montant:'+700,00 $', ton:'alerte'}
  ],
  calendrier:{nom:'Septembre',annee:2026,jours:30,premier:2,aujourdhui:21},
  evenements:[
    {jour:1,titre:'Loyers du mois',ton:'succes'},{jour:15,titre:'Rapport d\u2019août',ton:'marine'},{jour:17,titre:'Visite 17 h — 640 3e Av. log. 4',ton:'bleu'},
    {jour:19,titre:'Visite 10 h — 640 3e Av. log. 4',ton:'bleu'},{jour:20,titre:'Urgence — détecteur, 420 S-J Est',ton:'urgence'},{jour:22,titre:'Chauffe-eau — intervention',ton:'alerte'},
    {jour:24,titre:'Inspection toiture — 1180 Cartier',ton:'bleu'},{jour:30,titre:'Versement net',ton:'succes'},{jour:30,titre:'Fin de période',ton:'marine'}
  ],
  faq:[
    {t:'Frais et versements',items:[
      ['Comment sont calculés les honoraires ?','6 % des loyers effectivement perçus sur les logements occupés. Un logement vacant ne génère aucun frais.'],
      ['Quand recevrai-je mon versement ?','Le net est versé le dernier jour ouvrable du mois, après honoraires et dépenses autorisées. Le détail figure au grand livre.'],
      ['Prenez-vous une marge sur les travaux ?','Non. La facture du fournisseur vous est remise telle quelle ; 10 % de coordination s\u2019ajoutent, indiqués séparément.']]},
    {t:'Travaux et autorisations',items:[
      ['Qu\u2019est-ce que le seuil d\u2019autorisation ?','Le montant sous lequel une dépense est engagée sans vous consulter (500 $ par défaut). Vous le modifiez dans Demandes.'],
      ['Que se passe-t-il en cas d\u2019urgence ?','Une personne de l\u2019équipe reprend le dossier immédiatement et sécurise les lieux. Vous êtes informé, la dépense est justifiée au dossier.'],
      ['Puis-je choisir mes fournisseurs ?','Oui. Indiquez vos fournisseurs privilégiés par immeuble ; nous vérifions licence RBQ et assurances.']]},
    {t:'Locataires et baux',items:[
      ['Qui décide de la sélection d\u2019un locataire ?','Vous, sauf si vous nous confiez la décision. La sélection repose sur des critères objectifs et documentés.'],
      ['Comment gérez-vous les retards de loyer ?','Relance automatisée à J+3, appel à J+7, puis dossier au TAL si nécessaire, avec votre accord.']]}
  ]
};
