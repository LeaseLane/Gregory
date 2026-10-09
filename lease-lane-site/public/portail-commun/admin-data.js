/* Données des modules Utilisateurs et accès · Conformité Loi 25 — deux portées : admin (équipe Lease Lane) et propriétaire. */
window.LL_ADMIN = {
  roles:['Administrateur','Gestionnaire','Comptabilité','Propriétaire','Locataire','Fournisseur'],
  permissions:[
    ['Consulter les immeubles et logements','y','y','y','p','p','p'],
    ['Créer / modifier un immeuble ou un logement','y','y','n','p','n','n'],
    ['Voir les dossiers de locataires (identité, enquête)','y','y','n','p','n','n'],
    ['Lire les demandes et les échanges','y','y','n','p','p','p'],
    ['Approuver une dépense','y','p','n','y','n','n'],
    ['Finances, versements et relevés','y','y','y','p','n','n'],
    ['Exporter des renseignements personnels','y','n','n','n','n','n'],
    ['Gérer les utilisateurs et la double authentification','y','n','n','p','n','n'],
    ['Registre de consentement et demandes Loi 25','y','y','n','p','n','n'],
    ['Réviser une décision automatisée (Cléo)','y','y','n','n','n','n']
  ],
  utilisateurs:{
    admin:[
      {id:'U1',nom:'Steven Paradis',courriel:'steven@leaselane.ai',role:'Administrateur',etat:'Actif',dfa:true,derniere:'Aujourd\u2019hui · 7 h 58',portee:'Tout'},
      {id:'U2',nom:'Camille Desrosiers',courriel:'camille@leaselane.ai',role:'Gestionnaire',etat:'Actif',dfa:true,derniere:'Aujourd\u2019hui · 8 h 40',portee:'34 portes · 5 immeubles'},
      {id:'U3',nom:'Julie Nadeau',courriel:'julie@leaselane.ai',role:'Comptabilité',etat:'Actif',dfa:true,derniere:'Hier · 16 h 12',portee:'Finance seulement'},
      {id:'U4',nom:'Marie-Josée Bérubé',courriel:'mj.berube@courriel.ca',role:'Propriétaire',etat:'Actif',dfa:true,derniere:'Aujourd\u2019hui · 9 h 05',portee:'Ses 5 immeubles'},
      {id:'U5',nom:'Samuel Fortin',courriel:'s.fortin@courriel.ca',role:'Locataire',etat:'Actif',dfa:false,derniere:'21 sept. · 19 h 12',portee:'1180 Cartier — 2'},
      {id:'U6',nom:'Plomberie Capitale',courriel:'repartition@plomberiecapitale.ca',role:'Fournisseur',etat:'Actif',dfa:false,derniere:'19 sept.',portee:'Bons de travail assignés'},
      {id:'U7',nom:'Stagiaire gestion',courriel:'stagiaire@leaselane.ai',role:'Gestionnaire',etat:'Suspendu',dfa:false,derniere:'12 août',portee:'—'}
    ],
    proprietaire:[
      {id:'P1',nom:'Marie-Josée Bérubé',courriel:'mj.berube@courriel.ca',role:'Propriétaire',etat:'Actif',dfa:true,derniere:'Aujourd\u2019hui · 9 h 05',portee:'Tous vos immeubles'},
      {id:'P2',nom:'Étienne Bérubé',courriel:'e.berube@courriel.ca',role:'Copropriétaire',etat:'Actif',dfa:true,derniere:'18 sept.',portee:'1180 Cartier · 41 des Roseaux'},
      {id:'P3',nom:'Julie Nadeau',courriel:'julie@leaselane.ai',role:'Comptabilité (lecture)',etat:'Actif',dfa:true,derniere:'Hier · 16 h 12',portee:'Finance et relevés'},
      {id:'P4',nom:'Camille Desrosiers',courriel:'camille@leaselane.ai',role:'Gestionnaire Lease Lane',etat:'Actif',dfa:true,derniere:'Aujourd\u2019hui · 8 h 40',portee:'Mandat de gestion'}
    ]
  },
  rolesProprietaire:['Propriétaire','Copropriétaire','Comptabilité (lecture)','Gestionnaire Lease Lane'],
  permissionsProprietaire:[
    ['Consulter les immeubles et logements','y','p','y','y'],
    ['Voir les dossiers de locataires','y','p','n','y'],
    ['Approuver une dépense','y','p','n','p'],
    ['Finance, versements et relevés','y','p','y','y'],
    ['Documents des locataires (dépôt, classement)','y','p','n','y'],
    ['Inviter et gérer les accès','y','n','n','n'],
    ['Demandes Loi 25 des locataires','y','n','n','y']
  ],
  journal:[
    ['9 h 12','Camille Desrosiers','Consultation du dossier locataire','T2 · Nadia Tremblay','Gestionnaire · autorisé','ok'],
    ['9 h 05','Marie-Josée Bérubé','Connexion (2FA application)','—','Québec, QC · Safari','ok'],
    ['8 h 42','Cléo (assistante)','Qualification automatique d\u2019une demande','DEM-2026-0154','Révision humaine disponible','systeme'],
    ['8 h 40','Camille Desrosiers','Connexion (2FA application)','—','Québec, QC · Chrome','ok'],
    ['Hier · 17 h 40','Camille Desrosiers','Reprise humaine d\u2019une urgence','DEM-2026-0152','Décision automatisée annulée','ok'],
    ['Hier · 16 h 50','Système','Purge automatique','6 candidatures non retenues','Conservation 6 mois dépassée','systeme'],
    ['Hier · 14 h 05','Plomberie Capitale','Tentative refusée','Dossier locataire T2','Rôle Fournisseur · non autorisé','refus'],
    ['19 sept. · 9 h 26','Marie-Josée Bérubé','Autorisation de dépense','TRV-2026-0311 · 1 250 $','Seuil 500 $ dépassé','ok']
  ],
  demandes:[
    {id:'DR-2026-018',type:'Accès à ses renseignements',qui:'Nadia Tremblay (locataire)',recue:'12 sept.',echeance:'12 oct.',etat:'En cours',ton:'bleu',jours:21},
    {id:'DR-2026-017',type:'Retrait du consentement (infolettre)',qui:'o.gagnon@…',recue:'10 sept.',echeance:'Immédiat',etat:'Traitée',ton:'succes'},
    {id:'DR-2026-016',type:'Suppression (candidature non retenue)',qui:'Ancien candidat · 640 3e Avenue',recue:'2 sept.',echeance:'2 oct.',etat:'En attente de validation',ton:'alerte',jours:11},
    {id:'DR-2026-015',type:'Rectification (adresse de correspondance)',qui:'l.bouchard@…',recue:'20 août',echeance:'19 sept.',etat:'Traitée',ton:'succes'},
    {id:'DR-2026-014',type:'Révision d\u2019une décision automatisée (Cléo)',qui:'Candidat · 2880 Sainte-Foy',recue:'14 août',echeance:'13 sept.',etat:'Traitée',ton:'succes'},
    {id:'DR-2026-013',type:'Portabilité (export structuré)',qui:'Ancien locataire · 420 Saint-Joseph Est',recue:'8 août',echeance:'7 sept.',etat:'Traitée',ton:'succes'},
    {id:'DR-2026-012',type:'Désindexation',qui:'f.lavoie@…',recue:'1 août',echeance:'31 août',etat:'Traitée',ton:'succes'}
  ],
  /* À valider par l'avocat */
  typesDemandes:['Accès','Rectification','Suppression','Retrait du consentement','Portabilité (export structuré)','Désindexation','Révision d\u2019une décision automatisée'],
  incidents:[],
  horsQuebec:[
    ['Hébergement Supabase','Ensemble des données de la plateforme','Région à confirmer','—','—','À évaluer'],
    ['Fournisseur d\u2019IA de Cléo','Messages des conversations avec Cléo','À confirmer','—','—','À évaluer'],
    ['QuickBooks (Intuit)','Données comptables, noms des propriétaires et des locataires','À confirmer','—','—','À évaluer'],
    ['Envoi de courriels','Nom et adresse courriel','À confirmer','—','—','À évaluer'],
    ['Envoi de textos','Nom et numéro de téléphone','À confirmer','—','—','À évaluer'],
    ['Tuiles de carte','Adresse IP et zone consultée','À confirmer','—','—','À évaluer']
  ],
  consentements:{
    stats:[['Nécessaires',100],['Statistiques',58],['Marketing (infolettre, offres)',41]],
    bases:[
      ['Demande de location','Enquête de crédit et vérification des références — consentement explicite, case non pré-cochée','ok'],
      ['Cléo, assistante IA','Avis de traitement automatisé (art. 12.1) affiché avant la première conversation · révision humaine offerte','ok'],
      ['Reçus et avis par courriel','Nécessaires à l\u2019exécution du bail — aucun consentement requis','ok'],
      ['Infolettre et offres','Consentement distinct · retrait en un clic · 41 % des locataires','ok'],
      ['Partage aux fournisseurs','Nom, logement et téléphone transmis pour l\u2019intervention seulement · mention au bail','ok'],
      ['Témoins tiers (cartes)','Fournisseur de tuiles hors Québec — évaluation en cours','attention'],
      /* À valider par l'avocat */
      ['Solvabilité et profilage (module à venir)','Fonction désactivée par défaut, activée seulement avec le consentement de la personne informée (art. 8.1)','attention']
    ]
  },
  conservation:[
    ['Candidatures non retenues','6 mois','Purge automatique mensuelle · journalisée'],
    /* À valider par l'avocat */
    ['Enquêtes de crédit','Jusqu\u2019à la décision','Candidat retenu : détruite à la signature du bail · non retenu : 6 mois avec la candidature','avalider'],
    ['Baux, annexes, reçus','3 ans après la fin du bail','Prescription civile · lecture seule après fermeture'],
    /* À valider par l'avocat */
    ['Conversations avec Cléo','12 mois','Détruites après 12 mois · révision humaine sur demande','avalider'],
    ['Dossiers de travaux et factures','7 ans','Obligation fiscale'],
    ['Journaux d\u2019accès','36 mois','Lecture seule · Administrateur']
  ],
  documents:[
    ['Politique de confidentialité','v2.1 · publiée le 3 juin 2026','ok','Publiée'],
    ['Témoins et vie privée','v1.3 · publiée le 3 juin 2026','ok','Publiée'],
    ['Conditions d\u2019utilisation des espaces','v1.0 · brouillon du 28 août 2026','attention','À publier'],
    ['Politique de gouvernance — version publique (site web)','Résumé publié sur le site (art. 3.2)','attention','À publier'],
    ['Politique de gouvernance interne','v1.0 · approuvée le 3 mars 2026','ok','Interne'],
    ['Délégation écrite du responsable de la protection des renseignements','Par la personne ayant la plus haute autorité','attention','À signer'],
    ['EFVP — plateforme complète (art. 3.3)','Évaluation des facteurs relatifs à la vie privée','attention','À faire'],
    ['EFVP — communications hors Québec (art. 17)','Fournisseurs listés à l\u2019onglet Communications hors Québec','attention','À faire'],
    ['Procédure de gestion des incidents','Évaluation du risque, avis à la CAI et aux personnes','attention','À rédiger'],
    ['Registre des incidents de confidentialité','0 incident en 2026','ok','À jour'],
    ['EFVP — Cléo et décisions automatisées','Qualification des demandes · terminée','ok','Terminée'],
    ['Registre des décisions automatisées (art. 12.1)','Mis à jour quotidiennement','ok','À jour']
  ],
  responsable:'Steven Paradis · steven@leaselane.ai'
};
