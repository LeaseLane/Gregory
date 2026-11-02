/* LeaseLane — panneau de Cléo (1er nov. 2026). Repris du site : src/proto/cleo-options.jsx (accueil par statut),
   app.jsx (actions, scénarios, relais humain) et faq.jsx (FAQ). La bulle ronde (/refonte/kit/temoins.js) ouvre et ferme le panneau.
   Parcours : présentation, statut (gardé pour la session, comme ll-cleo-statut), accueil propre au profil, puis fil de conversation.
   Maquette : aucune donnée n'est envoyée; les formulaires confirment seulement à l'écran. */
(()=>{
  const AV='/assets/img/cleo-avatar.png',URG='418-473-3208',TEL='tel:4184733208',CLE='ll-cleo-statut';
  const FAQ={"p1":{"public":"proprietaires","q":"Comment l’offre de gestion de mon immeuble est-elle établie?","r":"Chaque offre est préparée pour votre immeuble, après un appel de 30 minutes : nombre de portes, état de l’immeuble, services voulus. Vous la recevez par écrit, avec l’échéancier de transition."},"p2":{"public":"proprietaires","q":"Quels services sont compris dans la gestion?","r":"La perception des loyers, les échanges avec les locataires, la coordination de l’entretien, Cléo 24/7 et le rapport mensuel. La relocation, les travaux majeurs et les dossiers au Tribunal administratif du logement (TAL) sont précisés dans votre offre."},"p3":{"public":"proprietaires","q":"Quelle est la durée du contrat, et comment y mettre fin?","r":"Le contrat de gestion dure 12 mois et se renouvelle. Pour ne pas le renouveler, envoyez un avis écrit au moins 30 jours avant son terme; vous pouvez aussi y mettre fin en tout temps par écrit. Nous remettons alors baux, dossiers et clés à la personne que vous désignez."},"p4":{"public":"proprietaires","q":"Comment se passe le transfert si j’ai déjà un gestionnaire?","r":"Nous lisons d’abord votre contrat actuel pour en respecter le préavis. Nous récupérons ensuite baux, dossiers, clés et historiques, nous avisons les locataires et activons Cléo. Votre premier rapport arrive à la fin du premier mois complet."},"p5":{"public":"proprietaires","q":"En combien de temps un logement vacant est-il loué?","r":"Cela dépend du secteur, du prix et de la saison. Cléo répond aux locataires potentiels en tout temps et réserve les visites sans attendre les heures de bureau. Le logement reste donc vide moins longtemps."},"p6":{"public":"proprietaires","q":"Comment Cléo répond-il à mes locataires et aux locataires potentiels, et quand un humain prend-il le relais?","r":"Cléo répond 24/7, en français d’abord, puis dans la langue de votre interlocuteur. Il donne de l’information générale sur les règles du Code civil et du TAL qui s’appliquent aux deux parties, réserve les visites et trie les urgences. Il passe la main à une personne de l’équipe pour une urgence, un litige ou une mise en demeure, une reprise, une éviction ou une résiliation, une plainte de harcèlement ou de discrimination, ou dès qu’on le lui demande. Il annonce chaque transfert : à qui, pourquoi et dans quel délai."},"p7":{"public":"proprietaires","q":"Comment les locataires sont-ils sélectionnés, et comment leurs données sont-elles protégées?","r":"Chaque candidat choisit comment démontrer sa capacité de payer : reçus de loyer ou factures payées, références d’anciens propriétaires, enquête de crédit avec son consentement, ou endosseur. Nous ne demandons ni le revenu, ni l’employeur, ni le nombre d’occupants, et l’absence d’historique de crédit n’est pas un motif de refus. La pièce d’identité est présentée à la signature, sans copie conservée, conformément à la Loi 25."},"p8":{"public":"proprietaires","q":"Quand et comment les loyers sont-ils versés dans mon compte?","r":"Les loyers perçus sont versés dans votre compte selon la fréquence prévue à votre contrat, déduction faite des dépenses autorisées. Chaque versement est détaillé dans votre espace propriétaire."},"p9":{"public":"proprietaires","q":"Quels rapports vais-je recevoir, et à quelle fréquence?","r":"Un rapport mensuel, au plus tard le 15 du mois : loyers dus et reçus, arriérés, logements vacants, travaux, factures et échéances. Le tableau de bord en ligne présente les mêmes chiffres en continu."},"p10":{"public":"proprietaires","q":"Qui autorise les travaux, et à partir de quel montant?","r":"Sous le seuil d’autorisation que vous fixez à l’annexe B de votre contrat (aucun montant par défaut), nous mandatons le fournisseur et vous en informons. Au-delà, rien n’est engagé sans votre accord, sauf une urgence qui menace la sécurité des personnes ou l’immeuble."},"p11":{"public":"proprietaires","q":"Est-ce que je garde le contrôle sur les décisions importantes?","r":"Oui. Le choix du locataire, les travaux au-delà de votre seuil, la hausse de loyer et tout recours au TAL vous sont soumis. Vous approuvez en ligne, et la décision est consignée au dossier."},"p12":{"public":"proprietaires","q":"Gérez-vous les plex de deux à cinq logements?","r":"Oui. Nous gérons les plex et tous les immeubles locatifs résidentiels, sauf la copropriété divise et la location de courte durée. Le service et les rapports sont les mêmes, quel que soit le nombre de portes."},"p13":{"public":"proprietaires","q":"Quels secteurs desservez-vous?","r":"Nous desservons la grande région de Québec, dans un rayon de 50 km : Québec, la rive nord, la rive sud et l’île d’Orléans. Écrivez-nous pour une offre : nous répondons en moins de 24 h."},"p14":{"public":"proprietaires","phase":2,"q":"Comment gérez-vous les retards de paiement et les dossiers au TAL?","r":"Un rappel part automatiquement dès le premier jour de retard, suivi d’un appel de l’équipe. Si le retard persiste, nous préparons le dossier au Tribunal administratif du logement, avec votre accord."},"p15":{"public":"proprietaires","phase":2,"q":"Comment la hausse de loyer annuelle est-elle fixée?","r":"Nous calculons la hausse proposée selon la méthode publiée chaque année par le TAL, puis nous vous la soumettons. L’avis de modification part de trois à six mois avant la fin d’un bail de douze mois."},"p16":{"public":"proprietaires","phase":2,"q":"Qu’est-ce que la Loi 31 change pour la cession de bail?","r":"Depuis la Loi 31, adoptée en 2024, le propriétaire qui reçoit un avis de cession peut, plutôt que d’y consentir, résilier le bail. Nous vous présentons chaque option et ses effets avant de répondre au locataire."},"l1":{"public":"locataires","q":"Comment voir les logements disponibles et réserver une visite?","r":"La page de nos logements à louer n’est pas encore prête : elle sera bientôt disponible sur le site, avec la date de disponibilité de chaque logement. Cléo pourra alors réserver votre visite en tout temps. En attendant, demandez-lui de vous avertir dès sa mise en ligne."},"l2":{"public":"locataires","q":"Quels documents faut-il pour une demande de location?","r":"Vos coordonnées, le logement visé, la date d’emménagement et le moyen choisi pour démontrer votre capacité de payer. Une pièce d’identité est présentée à la signature du bail, sans copie conservée. Aucun dépôt ni chèque postdaté n’est exigé."},"l3":{"public":"locataires","q":"Cléo peut-il répondre en anglais ou dans une autre langue?","r":"Oui. Cléo répond d’abord en français, puis dans la langue de votre message, dont l’anglais. Les documents officiels, comme le bail, restent en français."},"l4":{"public":"locataires","q":"Comment faire une demande de travaux et en suivre l’avancement?","r":"Faites la demande dans votre portail locataire, photos à l’appui. Vous recevez un numéro de suivi et une plage de rendez-vous, puis un avis à chaque étape : reçue, planifiée, en cours, terminée."},"l5":{"public":"locataires","q":"Qu’est-ce qu’une urgence, et quel numéro composer?","r":"Une fuite d’eau importante, une panne de chauffage en hiver, une panne électrique, une porte ou une serrure qui ne ferme plus, un détecteur de fumée défectueux. Composez le 418-473-3208 en tout temps; en cas de danger, faites le 911."},"l6":{"public":"locataires","q":"Comment payer mon loyer?","r":"Dans votre portail locataire ou par virement. Vous recevez un reçu automatique dès que le paiement arrive."},"l7":{"public":"locataires","q":"Comment céder mon bail ou sous-louer mon logement?","r":"Envoyez un avis écrit depuis votre portail locataire, avec les coordonnées de la personne proposée. Depuis la Loi 31, le propriétaire peut accepter, refuser pour un motif sérieux ou, pour une cession, résilier le bail; le portail explique chaque cas avant l’envoi."},"l8":{"public":"locataires","q":"Comment ajouter une personne à mon bail?","r":"Remplissez le formulaire Ajout au bail dans votre portail locataire : identité de la personne, date d’arrivée et statut, colocataire signataire ou simple occupant. Le propriétaire donne son accord, puis le bail est mis à jour."},"l9":{"public":"locataires","q":"Qu’est-ce qu’un endosseur, et à quoi s’engage-t-il?","r":"L’endosseur, ou caution, s’engage à payer le loyer et à respecter le bail si le locataire ne le fait pas. Il choisit comment démontrer sa capacité de payer : enquête de crédit avec son consentement, ou reçus et factures payées. Il signe électroniquement; nous ne demandons jamais sa carte d’assurance maladie."},"l10":{"public":"locataires","q":"Comment faire un commentaire ou déposer une plainte?","r":"Choisissez la catégorie dans le formulaire : commentaire, plainte ou demande administrative. Vous recevez un accusé de réception immédiat, puis nous revenons vers vous dans les meilleurs délais."},"l11":{"public":"locataires","phase":2,"q":"Comment fonctionne le renouvellement de bail?","r":"Votre bail se renouvelle aux mêmes conditions. Si le propriétaire veut le modifier, il vous envoie un avis de trois à six mois avant la fin d’un bail de douze mois. Vous avez un mois après la réception de l’avis pour lui répondre par écrit que vous refusez la modification ou que vous quittez le logement; sans réponse de votre part, vous êtes réputé l’avoir acceptée (art. 1945 C.c.Q.)."},"l12":{"public":"locataires","phase":2,"q":"Quand vais-je recevoir mon Relevé 31?","r":"Le Relevé 31 vous est remis au plus tard le dernier jour de février, pour l’année précédente. Il sert à demander le crédit d’impôt pour solidarité."},"l13":{"public":"locataires","phase":2,"q":"Que faire en cas de conflit avec un voisin?","r":"Écrivez-nous en décrivant la situation, les dates et l’effet sur votre logement. Nous intervenons auprès des personnes concernées et vous tenons informé des suites."},"l14":{"public":"locataires","phase":2,"q":"Comment se passe mon départ du logement?","r":"Donnez votre avis de départ dans votre portail locataire, dans les délais prévus au bail. Cléo planifie avec vous les visites de relocation, puis nous convenons de la remise des clés."},"t1":{"public":"locataires","q":"Qu’est-ce que le TAL, l’ancienne Régie du logement?","r":"Le Tribunal administratif du logement (TAL) a remplacé la Régie du logement le 31 août 2020. Il tranche les litiges entre locataires et propriétaires de logements résidentiels au Québec, et publie chaque année la méthode de calcul des hausses de loyer."},"t2":{"public":"locataires","q":"Puis-je refuser une hausse de loyer?","r":"Oui. Vous avez un mois après la réception de l’avis pour la refuser par écrit, et vous restez dans le logement. Le propriétaire peut alors demander au TAL de fixer le loyer, dans le mois qui suit votre refus."},"t3":{"public":"locataires","q":"Le propriétaire peut-il reprendre mon logement?","r":"Oui, pour s’y loger ou y loger un proche parent, par un avis écrit au moins six mois avant la fin d’un bail de douze mois. Vous avez un mois pour répondre; sans réponse de votre part, vous êtes réputé refuser."},"t4":{"public":"locataires","q":"Le propriétaire peut-il entrer dans mon logement?","r":"Oui. Avec un préavis de 24 heures, il peut vérifier l’état du logement, y faire des travaux ou le faire visiter à un acheteur; les visites ont lieu entre 9 h et 21 h, les travaux entre 7 h et 19 h. Après votre avis de non-reconduction, il peut le faire visiter à de futurs locataires sans préavis, entre 9 h et 21 h. Des travaux majeurs exigent un avis écrit d’au moins 10 jours, ou de 3 mois si vous devez quitter le logement plus d’une semaine. Vous pouvez refuser une visite si le propriétaire ou son représentant ne peut être présent. En cas d’urgence, aucun préavis n’est requis."},"t5":{"public":"proprietaires","q":"À partir de quand puis-je m’adresser au TAL pour un loyer impayé?","r":"Après plus de trois semaines de retard, vous pouvez demander au TAL la résiliation du bail et le recouvrement du loyer. Nous préparons le dossier et vous le soumettons avant tout dépôt."},"t6":{"public":"proprietaires","q":"Puis-je exiger un dépôt de garantie?","r":"Non. Au Québec, seul le loyer du premier mois peut être demandé à l’avance. Aucun dépôt de garantie ni chèque postdaté ne peut être exigé."},"t7":{"public":"proprietaires","q":"Comment reprendre un logement pour y habiter?","r":"Envoyez un avis écrit au moins six mois avant la fin d’un bail de douze mois. Le locataire a un mois pour répondre; s’il refuse ou ne répond pas, vous devez demander l’autorisation au TAL dans le mois qui suit."}};
  const I={
    key:'<path d="M15.5 7.5 19 4m-2 2 2 2m-6.6 3.6a4.5 4.5 0 1 1-6.4 6.4 4.5 4.5 0 0 1 6.4-6.4Zm0 0L16 8"/>',
    imm:'<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m12-13h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4m-4 4h4m-4 4h4m-4 4h4"/>',
    maison:'<path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
    oeil:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    idee:'<path d="M9 18h6m-5 4h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z"/>',
    pers:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    fl:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    q:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.3-2.4 3.6M12 17h.01"/>',
    tel:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
    env:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    x:'<path d="M6 6l12 12M18 6 6 18"/>',
    re:'<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16m0 5v-5h5"/>'
  };
  const ic=(n,c='')=>`<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const STATUTS=[['locataire','Je suis locataire.','key'],['proprio','Je suis propriétaire et client chez vous.','imm'],['futur','Je veux devenir un locataire.','maison'],['client','Je désire être client de vos services de gestion.','oeil'],['info','Je désire seulement m’informer.','idee']];
  const PROFILS={
    locataire:{lib:'Locataire',k:['travaux','plainte','portailL','bail'],urg:true,faq:['l4','l5','l6','l11']},
    proprio:{lib:'Propriétaire client',k:['portailP','proprio','bail'],faq:['p8','p9','p10','p11']},
    futur:{lib:'Futur locataire',k:['chercher','demande','bail'],faq:['l1','l2','l9','t1']},
    client:{lib:'Futur client',k:['gestion','proprio','bail'],faq:['p1','p2','p12','p13']},
    info:{lib:'Visiteur',k:['chercher','gestion','bail'],faq:['p13','l1','t1','p6']}
  };
  const ACTIONS={
    chercher:['Trouver un logement','Pour vous'],demande:['Déposer une demande de location','Pour vous'],
    travaux:['Services aux locataires','Pour vous'],plainte:['Commentaire ou plainte','Pour vous'],portailL:['Mon espace locataire','Pour vous'],
    gestion:['Confier mon immeuble','Pour vous'],proprio:['Services aux propriétaires','Pour vous'],portailP:['Mon espace propriétaire','Pour vous'],
    bail:['Une question sur le bail ou le TAL','Droit du logement']
  };
  const lien=(t,h)=>({type:'lien',t,h});
  const SC={
    chercher:{m:[{t:'Voici les logements à louer en ce moment, sur les deux rives. Filtrez par secteur, loyer et nombre de pièces, puis réservez une visite depuis la fiche du logement.'},lien('Voir les logements à louer','/logements-a-louer'),lien('Déposer une demande de location','/locataires/demande-de-location')],s:['Quels documents faut-il?','Parler à une personne']},
    demande:{m:[{t:'La demande se fait en ligne, en une dizaine de minutes. Vous choisissez comment démontrer votre capacité de payer : reçus de loyer, références, enquête de crédit avec votre consentement ou endosseur.'},lien('Déposer une demande de location','/locataires/demande-de-location')],s:['Quels documents faut-il?','Parler à une personne']},
    travaux:{m:[{t:`Je note le problème. Si de l’eau coule activement ou s’il n’y a plus de chauffage, appelez d’abord la ligne d’urgence, 24 h sur 24 : ${URG}.`},{type:'urgence'},{t:'Sinon, faites la demande dans votre espace locataire, photos à l’appui : elle est rattachée à votre logement et vous la suivez à chaque étape.'},lien('Services aux locataires','/locataires')],s:['C’est une urgence','Parler à une personne']},
    plainte:{m:[{t:'Un commentaire, une plainte ou une demande administrative se dépose en ligne, sans connexion. Vous recevez un accusé de réception immédiat.'},lien('Ouvrir le formulaire','/commentaire-ou-plainte')],s:['Parler à une personne']},
    portailL:{m:[{t:'Votre espace locataire regroupe votre bail, vos paiements et le suivi de vos demandes.'},lien('Mon espace locataire','/locataires#suivi')],s:['Comment payer mon loyer?','Parler à une personne']},
    gestion:{m:[{t:'Chaque offre est préparée pour votre immeuble, après un appel de 30 minutes : nombre de portes, état de l’immeuble et services voulus.'},{type:'resume',titre:'Ce que comprend la gestion',l:[['Loyers','Perception, reçus, relances'],['Locataires','Messages, demandes, urgences 24/7'],['Travaux','Coordination de l’entretien et des travaux'],['Rapports','Mensuel, avec tableau de bord']]},lien('Obtenir une offre de gestion','/offre-de-service')],s:['Gérez-vous les plex?','Parler à une personne']},
    proprio:{m:[{t:'Gestion complète, location de vos logements, expertise et stratégie : voici où tout est expliqué.'},lien('Gestion immobilière','/gestion-immobiliere'),lien('Expertise et stratégie','/expertise-et-strategie')],s:['Obtenir une offre','Parler à une personne']},
    portailP:{m:[{t:'Votre espace propriétaire montre le tableau de bord, les rapports mensuels et les travaux à approuver.'},lien('Mon espace propriétaire','/gestion-immobiliere#espace')],s:['Quels rapports vais-je recevoir?','Parler à une personne']},
    bail:{m:[{t:'Je peux vous expliquer les règles générales du Code civil et du TAL sur le bail : avis, délais, cession, reprise, résiliation, recours. Décrivez-moi votre situation : je vous indique les règles qui s’y rapportent et leurs sources, puis une personne de l’équipe prend le relais pour votre cas précis.'},{t:'Information juridique générale, pas un avis juridique.',note:1}],s:['Une hausse de loyer','Une cession de bail','Parler à une personne']},
    hausse:{m:[{t:'Pour un bail de 12 mois, l’avis de modification se donne de 3 à 6 mois avant la fin du bail : du 1er janvier au 31 mars pour un bail qui finit le 30 juin (C.c.Q., art. 1942).'},{t:'Le locataire a 1 mois pour accepter, refuser et rester, ou partir; son silence vaut acceptation. S’il refuse et reste, le propriétaire a 1 mois pour demander au TAL de fixer le loyer.'}],s:['Une cession de bail','Parler à une personne']},
    cession:{m:[{t:'Le locataire avise par écrit, avec le nom et l’adresse de la personne proposée. Le propriétaire a 15 jours pour répondre; son silence vaut consentement (C.c.Q., art. 1870 et 1871).'},{t:'Depuis la Loi 31, un refus sans motif sérieux résilie le bail à la date prévue de la cession. Seules les dépenses raisonnables réellement engagées peuvent être réclamées.'}],s:['Une hausse de loyer','Parler à une personne']},
    humain:{m:[{t:'Bien sûr. Laissez-moi vos coordonnées : une personne de l’équipe vous revient, avec le fil de notre conversation pour que vous n’ayez pas à vous répéter.'},{type:'form',bouton:'Être contacté',usage:'me recontacter au sujet de cette conversation'}],s:['Continuer avec Cléo']},
    urgence:{m:[{t:'Pour une fuite d’eau active, une panne de chauffage ou tout danger, appelez maintenant : une personne répond 24 h sur 24.'},{type:'urgence'}],s:['Services aux locataires','Parler à une personne']},
    defaut:{m:[{t:'Je note votre demande. Je n’ai pas de réponse sûre à vous donner ici : une personne de notre équipe vous revient au prochain jour ouvrable.'}],s:['Parler à une personne','Continuer avec Cléo']}
  };
  /* suggestions et texte libre → scénario ou question de la FAQ */
  const SUGG={'Parler à une personne':'humain','Je veux parler à un humain':'humain','C’est une urgence':'urgence','Une hausse de loyer':'hausse','Une cession de bail':'cession','Services aux locataires':'travaux','Obtenir une offre':'gestion','Quels documents faut-il?':'faq:l2','Comment payer mon loyer?':'faq:l6','Gérez-vous les plex?':'faq:p12','Quels rapports vais-je recevoir?':'faq:p9'};
  const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ');
  const VIDES=new Set('le la les un une des de du d l a au aux et ou en est je j me mon ma mes vous votre vos il elle on que qui quoi pour par sur dans avec pas ne se ce cette ces comment quand quel quelle quels quelles puis peut faire faut y'.split(' '));
  const mots=s=>norm(s).split(/\s+/).filter(m=>m.length>2&&!VIDES.has(m));
  const CLES=[[/urgen|fuite|inond|chauffage|feu|incendi/,'urgence'],[/humain|personne|agent|parler a/,'humain'],[/hausse|augment/,'hausse'],[/cession|ceder|sous.?lou/,'cession'],[/logement.*(louer|dispo)|appartement|trouver|cherche|visite/,'chercher'],[/plainte|commentaire/,'plainte'],[/offre|confier|gestion de mon/,'gestion'],[/bail|tal|regie/,'bail']];
  function deviner(txt){
    const n=norm(txt);for(const [re,k] of CLES)if(re.test(n))return k;
    const m=mots(txt);let best=null,score=0;
    for(const id in FAQ){const q=new Set(mots(FAQ[id].q+' '+FAQ[id].r.slice(0,120)));const s=m.filter(x=>q.has(x)).length;if(s>score){score=s;best=id}}
    return score>=2?'faq:'+best:'defaut';
  }

  const racine=document.querySelector('.cl-flot');if(!racine)return;
  const bulle=racine.querySelector('.cl-bulle');
  const p=document.createElement('section');p.className='clv';p.id='clv';p.hidden=true;p.setAttribute('role','dialog');p.setAttribute('aria-label','Clavardage avec Cléo, gestionnaire IA');
  racine.insertBefore(p,bulle);
  bulle.setAttribute('aria-controls','clv');bulle.setAttribute('aria-expanded','false');
  const reduit=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let statut=null,vu=false,sujet=null,fil=[],file=Promise.resolve(),gen=0;
  try{statut=PROFILS[sessionStorage.getItem(CLE)]?sessionStorage.getItem(CLE):null}catch(e){}

  p.innerHTML=`<header class="clv-tete"><span class="clv-av"><img src="${AV}" alt="" width="40" height="40"><i aria-hidden="true"></i></span><b>Cléo · Gestionnaire IA</b><button type="button" class="clv-x" data-a="fermer" aria-label="Fermer le clavardage">${ic('x')}</button></header>
  <div class="clv-corps" aria-live="polite"></div>
  <form class="clv-saisie" novalidate><label class="clv-vh" for="clv-q">Votre question</label><textarea id="clv-q" rows="1" placeholder="Écrivez votre question…"></textarea><button type="submit" aria-label="Envoyer">${ic('env')}</button></form>
  <footer class="clv-pied"><a href="/cleo">Qui est Cléo?</a><a href="/confidentialite">Confidentialité et vie privée</a></footer>`;
  const corps=p.querySelector('.clv-corps'),form=p.querySelector('.clv-saisie'),q=p.querySelector('#clv-q');

  const ligne=(a,t,icone,d='')=>`<button type="button" class="clv-l" data-a="${a}"${d}><span>${esc(t)}</span><span class="clv-c">${ic(icone)}</span></button>`;
  function vueIntro(){
    corps.dataset.v='intro';
    corps.innerHTML=`<div class="clv-intro"><img src="${AV}" alt="" width="84" height="84"><b>Cléo</b><small>Gestionnaire IA</small><p>Je réponds 24/7 aux locataires, aux propriétaires et à ceux qui cherchent un logement. Une personne de l’équipe prend le relais quand votre dossier le demande.</p><button type="button" class="clv-passer" data-a="statut">Commencer</button></div>`;
  }
  function vueStatut(){
    corps.dataset.v='statut';
    corps.innerHTML=`<h2 class="clv-h">Afin de bien vous guider, quel est votre statut chez LeaseLane?</h2><div class="clv-ls">${STATUTS.map(([k,t,i])=>ligne('st',t,i,` data-k="${k}"`)).join('')}</div>`;
  }
  function vueAccueil(){
    corps.dataset.v='accueil';sujet=null;fil=[];
    const P=PROFILS[statut],grp={};P.k.forEach(k=>{const [t,g]=ACTIONS[k];(grp[g]=grp[g]||[]).push(ligne('ac',t,'fl',` data-k="${k}"`))});
    corps.innerHTML=`<h2 class="clv-h">Bonjour, comment puis-je vous aider?</h2><p class="clv-vous">Vous êtes : <b>${P.lib}</b> <button type="button" data-a="modifier">Modifier</button></p>
    <div class="clv-ls">${P.urg?`<a class="clv-l clv-urg" href="${TEL}"><span>Urgence 24/7 · ${URG}</span><span class="clv-c">${ic('tel')}</span></a>`:''}${ligne('sc','Je veux parler à un humain','pers',' data-k="humain"')}</div>
    ${Object.entries(grp).map(([g,l])=>`<p class="clv-g">${g}</p><div class="clv-ls">${l.join('')}</div>`).join('')}
    <p class="clv-g">Questions fréquentes</p><div class="clv-ls">${P.faq.map(id=>ligne('faq',FAQ[id].q,'q',` data-k="${id}"`).replace('class="clv-l"','class="clv-l clv-f"')).join('')}</div>`;
  }
  function vueFil(titre){
    corps.dataset.v='fil';sujet=titre;
    corps.innerHTML=`<div class="clv-sujet"><span><small>Sujet</small> <b>${esc(titre)}</b></span><button type="button" data-a="nouveau">${ic('re')}Nouveau sujet</button></div><div class="clv-fil"></div>`;
  }
  const filEl=()=>corps.querySelector('.clv-fil');
  const bas=()=>{corps.scrollTop=corps.scrollHeight};
  function rendre(m){
    if(m.qui==='client')return `<p class="clv-m clv-moi">${esc(m.t)}</p>`;
    if(m.type==='lien')return `<a class="clv-lien" href="${m.h}"><span>${esc(m.t)}</span>${ic('fl')}</a>`;
    if(m.type==='urgence')return `<a class="clv-carte-urg" href="${TEL}">${ic('tel')}<span><small>Urgence 24/7</small><b>${URG}</b></span></a>`;
    if(m.type==='resume')return `<div class="clv-res"><p>${esc(m.titre)}</p><dl>${m.l.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></div>`;
    if(m.type==='form')return `<form class="clv-form" novalidate><p class="clv-form-t">Vos coordonnées</p><label>Nom<input name="nom" autocomplete="name" required></label><label>Courriel<input name="courriel" type="email" autocomplete="email" required></label><label>Téléphone <span>(facultatif)</span><input name="tel" type="tel" autocomplete="tel"></label><label class="clv-ok"><input type="checkbox" name="ok" required><span>J’accepte que LeaseLane utilise ces renseignements seulement pour ${esc(m.usage)}. <a href="/confidentialite">Politique de confidentialité</a></span></label><p class="clv-err" hidden></p><button type="submit" class="clv-btn">${esc(m.bouton)}</button></form>`;
    if(m.type==='sugg')return `<div class="clv-sugg">${m.l.map(s=>`<button type="button" data-a="sugg">${esc(s)}</button>`).join('')}</div>`;
    return `<p class="clv-m${m.note?' clv-note':''}">${esc(m.t)}</p>`;
  }
  function ajouter(m){fil.push(m);const f=filEl();if(!f)return;f.insertAdjacentHTML('beforeend',rendre(m));bas()}
  function dire(liste,sugg){
    const g=gen;
    file=file.then(async()=>{
      for(const m of liste){
        if(g!==gen)return;
        if(!reduit){const f=filEl();f&&f.insertAdjacentHTML('beforeend','<p class="clv-ecrit" aria-label="Cléo écrit"><i></i><i></i><i></i></p>');bas();await new Promise(r=>setTimeout(r,m.type?350:Math.min(1100,450+(m.t||'').length*4)));const e=corps.querySelector('.clv-ecrit');e&&e.remove()}
        if(g!==gen)return;ajouter(m);
      }
      if(sugg&&sugg.length&&g===gen)ajouter({type:'sugg',l:sugg});
    });
  }
  function lancer(k,libelle,client){
    if(corps.dataset.v!=='fil'){gen++;file=Promise.resolve();vueFil(libelle)}
    corps.querySelectorAll('.clv-sugg').forEach(e=>e.remove());
    if(client)ajouter({qui:'client',t:client});
    if(k.startsWith('faq:')){const f=FAQ[k.slice(4)];dire([{t:f.r}],['Autre question','Parler à une personne']);return}
    if(k==='defaut'&&client&&window.llCleo){const g=gen,f=filEl();f&&f.insertAdjacentHTML('beforeend','<p class="clv-ecrit" aria-label="Cléo écrit"><i></i><i></i><i></i></p>');bas();window.llCleo(client).then(t=>[[{t}],['Autre question','Parler à une personne']],()=>[SC.defaut.m,SC.defaut.s]).then(([m,s])=>{const e=corps.querySelector('.clv-ecrit');e&&e.remove();if(g===gen)dire(m,s)});return}const s=SC[k]||SC.defaut;dire(s.m,s.s);
  }
  function choisirStatut(k){statut=k;try{sessionStorage.setItem(CLE,k)}catch(e){}vueAccueil();focusPremier()}
  const focusPremier=()=>{const f=corps.querySelector('button,a,input');f&&f.focus({preventScroll:true})};

  function ouvrir(){
    p.hidden=false;racine.classList.add('clv-ouvert');bulle.setAttribute('aria-expanded','true');
    if(!corps.dataset.v){if(statut){vueAccueil()}else{vueIntro();if(!reduit)setTimeout(()=>{if(corps.dataset.v==='intro'&&!p.hidden)vueStatut()},2200)}}
    vu=true;requestAnimationFrame(focusPremier);
  }
  function fermer(){p.hidden=true;racine.classList.remove('clv-ouvert');bulle.setAttribute('aria-expanded','false');bulle.focus({preventScroll:true})}
  bulle.addEventListener('click',e=>{e.preventDefault();p.hidden?ouvrir():fermer()});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!p.hidden)fermer()});
  /* tout lien « Parler à Cléo » du site ouvre aussi le panneau */
  document.addEventListener('click',e=>{const a=e.target.closest('a[data-cleo]');if(!a)return;e.preventDefault();ouvrir()});

  p.addEventListener('click',e=>{
    const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,k=b.dataset.k;
    if(a==='fermer')fermer();
    else if(a==='statut'){vueStatut();focusPremier()}
    else if(a==='st')choisirStatut(k);
    else if(a==='modifier'){vueStatut();focusPremier()}
    else if(a==='ac'||a==='sc')lancer(k,a==='sc'?'Parler à une personne':ACTIONS[k][0]);
    else if(a==='faq')lancer('faq:'+k,'Question fréquente',FAQ[k].q);
    else if(a==='nouveau'){gen++;file=Promise.resolve();statut?vueAccueil():vueStatut();focusPremier()}
    else if(a==='sugg'){const t=b.textContent;if(t==='Continuer avec Cléo'||t==='Autre question'){gen++;file=Promise.resolve();vueAccueil();focusPremier();return}lancer(SUGG[t]||deviner(t),t,t)}
  });
  /* formulaire de coordonnées (maquette : confirmation à l'écran, rien n'est envoyé) */
  p.addEventListener('submit',e=>{
    const f=e.target;e.preventDefault();
    if(f===form){const t=q.value.trim();if(!t)return;q.value='';q.style.height='';if(!statut){statut='info';try{sessionStorage.setItem(CLE,'info')}catch(x){}}lancer(deviner(t),'Votre question',t);return}
    const err=f.querySelector('.clv-err'),d=new FormData(f);let m='';
    if(!d.get('nom').trim())m='Indiquez votre nom.';else if(!/^\S+@\S+\.\S+$/.test(d.get('courriel')))m='Indiquez un courriel valide, par exemple nom@exemple.ca.';else if(!d.get('ok'))m='Cochez la case de consentement pour que l’équipe puisse vous joindre.';
    if(m){err.textContent=m;err.hidden=false;return}
    f.outerHTML=`<p class="clv-m clv-confirme">Merci, ${esc(d.get('nom').trim().split(' ')[0])}. Une personne de l’équipe vous écrit à ${esc(d.get('courriel'))} au prochain jour ouvrable.</p>`;bas();
  });
  q.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
  q.addEventListener('input',()=>{q.style.height='';q.style.height=Math.min(q.scrollHeight,96)+'px'});
})();
