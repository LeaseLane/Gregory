/* Converti depuis ui_kits/site-public/faq.js (prototype) — ne pas réintroduire de globaux window. */
import { LL_SITE } from '@/proto/routes';
let LL_FAQ = {
  p1: {
    public: 'proprietaires',
    q: 'Comment l\u2019offre de gestion de mon immeuble est-elle établie?',
    r: 'Chaque offre est préparée pour votre immeuble, après un appel de 30 minutes : nombre de portes, état de l\u2019immeuble, services voulus. Vous la recevez par écrit, avec l\u2019échéancier de transition.'
  },
  p2: {
    public: 'proprietaires',
    q: 'Quels services sont compris dans la gestion?',
    r: 'La perception des loyers, les échanges avec les locataires, la coordination de l\u2019entretien, Cléo 24/7 et le rapport mensuel. La relocation, les travaux majeurs et les dossiers au Tribunal administratif du logement (TAL) sont précisés dans votre offre.'
  },
  p3: {
    public: 'proprietaires',
    q: 'Quelle est la durée du contrat, et comment y mettre fin?',
    r: 'Le contrat de gestion dure 12 mois et se renouvelle. Pour ne pas le renouveler, envoyez un avis écrit au moins 30 jours avant son terme; vous pouvez aussi y mettre fin en tout temps par écrit. Nous remettons alors baux, dossiers et clés à la personne que vous désignez.'
  },
  p4: {
    public: 'proprietaires',
    q: 'Comment se passe le transfert si j\u2019ai déjà un gestionnaire?',
    r: 'Nous lisons d\u2019abord votre contrat actuel pour en respecter le préavis. Nous récupérons ensuite baux, dossiers, clés et historiques, nous avisons les locataires et activons Cléo. Votre premier rapport arrive à la fin du premier mois complet.'
  },
  p5: {
    public: 'proprietaires',
    q: 'En combien de temps un logement vacant est-il loué?',
    r: 'Le délai dépend du secteur, du prix et de la saison. Cléo répond aux prospects en tout temps et organise les visites sans attendre les heures de bureau : moins de jours vacants, moins de loyer perdu.'
  },
  p6: {
    public: 'proprietaires',
    q: 'Comment Cléo répond-il à mes locataires et aux prospects, et quand un humain prend-il le relais?',
    r: 'Cléo répond 24/7, en français d\u2019abord, puis dans la langue de votre interlocuteur. Il donne de l\u2019information générale sur les règles du Code civil et du TAL qui s\u2019appliquent aux deux parties, réserve les visites et trie les urgences. Il passe la main à une personne de l\u2019équipe pour une urgence, un litige ou une mise en demeure, une reprise, une éviction ou une résiliation, une plainte de harcèlement ou de discrimination, ou dès qu\u2019on le lui demande. Il annonce chaque transfert : à qui, pourquoi et dans quel délai.'
  },
  p7: {
    public: 'proprietaires',
    q: 'Comment les locataires sont-ils sélectionnés, et comment leurs données sont-elles protégées?',
    r: 'Chaque candidat choisit comment démontrer sa capacité de payer : reçus de loyer ou factures payées, références d\u2019anciens propriétaires, enquête de crédit avec son consentement, ou endosseur. Nous ne demandons ni le revenu, ni l\u2019employeur, ni le nombre d\u2019occupants, et l\u2019absence d\u2019historique de crédit n\u2019est pas un motif de refus. La pièce d\u2019identité est présentée à la signature, sans copie conservée, conformément à la Loi 25.'
  },
  p8: {
    public: 'proprietaires',
    q: 'Quand et comment les loyers sont-ils versés dans mon compte?',
    r: 'Les loyers perçus sont versés dans votre compte selon la fréquence prévue à votre mandat, déduction faite des dépenses autorisées. Chaque versement est détaillé dans votre espace propriétaire.'
  },
  p9: {
    public: 'proprietaires',
    q: 'Quels rapports vais-je recevoir, et à quelle fréquence?',
    r: 'Un rapport mensuel, au plus tard le 15 du mois : loyers dus et reçus, arriérés, logements vacants, travaux, factures et échéances. Le tableau de bord en ligne présente les mêmes chiffres en continu.'
  },
  p10: {
    public: 'proprietaires',
    q: 'Qui autorise les travaux, et à partir de quel montant?',
    r: 'Sous le seuil d\u2019autorisation que vous fixez à l\u2019annexe B de votre contrat (aucun montant par défaut), nous mandatons le fournisseur et vous en informons. Au-delà, rien n\u2019est engagé sans votre accord, sauf une urgence qui menace la sécurité des personnes ou l\u2019immeuble.'
  },
  p11: {
    public: 'proprietaires',
    q: 'Est-ce que je garde le contrôle sur les décisions importantes?',
    r: 'Oui. Le choix du locataire, les travaux au-delà de votre seuil, la hausse de loyer et tout recours au TAL vous sont soumis. Vous approuvez en ligne, en un geste, et la décision est consignée au dossier.'
  },
  p12: {
    public: 'proprietaires',
    q: 'Gérez-vous les plex de deux à cinq logements?',
    r: 'Oui, les plex sont au cœur de notre offre, avec tous les immeubles locatifs résidentiels, sauf la copropriété divise et la location de courte durée. Le service et les rapports sont les mêmes, quel que soit le nombre de portes.'
  },
  p13: {
    public: 'proprietaires',
    q: 'Quels secteurs desservez-vous?',
    r: 'Nous desservons tout le Québec. Écrivez-nous pour une offre : nous vous répondons en moins de 24 h.'
  },
  p14: {
    public: 'proprietaires',
    phase: 2,
    q: 'Comment gérez-vous les retards de paiement et les dossiers au TAL?',
    r: 'Un rappel part automatiquement dès le premier jour de retard, suivi d\u2019un appel de l\u2019équipe. Si le retard persiste, nous préparons le dossier au Tribunal administratif du logement, avec votre accord.'
  },
  p15: {
    public: 'proprietaires',
    phase: 2,
    q: 'Comment la hausse de loyer annuelle est-elle fixée?',
    r: 'Nous calculons la hausse proposée selon la méthode publiée chaque année par le TAL, puis nous vous la soumettons. L\u2019avis de modification part de trois à six mois avant la fin d\u2019un bail de douze mois.'
  },
  p16: {
    public: 'proprietaires',
    phase: 2,
    q: 'Qu\u2019est-ce que la Loi 31 change pour la cession de bail?',
    r: 'Depuis la Loi 31, adoptée en 2024, le propriétaire qui reçoit un avis de cession peut, plutôt que d\u2019y consentir, résilier le bail. Nous vous présentons chaque option et ses effets avant de répondre au locataire.'
  },
  l1: {
    public: 'locataires',
    q: 'Comment voir les logements disponibles et réserver une visite?',
    r: 'Tous nos logements libres sont sur la page Logements à louer, avec leur date de disponibilité. Cléo réserve votre visite en tout temps, selon les plages ouvertes.'
  },
  l2: {
    public: 'locataires',
    q: 'Quels documents faut-il pour une demande de location?',
    r: 'Vos coordonnées, le logement visé, la date d\u2019emménagement et le moyen choisi pour démontrer votre capacité de payer. Une pièce d\u2019identité est présentée à la signature du bail, sans copie conservée. Aucun dépôt ni chèque postdaté n\u2019est exigé.'
  },
  l3: {
    public: 'locataires',
    q: 'Cléo peut-il répondre en anglais ou dans une autre langue?',
    r: 'Oui. Cléo répond d\u2019abord en français, puis dans la langue de votre message, dont l\u2019anglais. Les documents officiels, comme le bail, restent en français.'
  },
  l4: {
    public: 'locataires',
    q: 'Comment faire une demande de travaux et en suivre l\u2019avancement?',
    r: 'Faites la demande dans votre portail locataire, photos à l\u2019appui. Vous recevez un numéro de suivi et une plage de rendez-vous, puis un avis à chaque étape : reçue, planifiée, en cours, terminée.'
  },
  l5: {
    public: 'locataires',
    q: 'Qu\u2019est-ce qu\u2019une urgence, et quel numéro composer?',
    r: 'Une fuite d\u2019eau importante, une panne de chauffage en hiver, une panne électrique, une porte ou une serrure qui ne ferme plus, un détecteur de fumée défectueux. Composez le ' + (LL_SITE.urgence || '[numéro de garde]') + ' en tout temps; en cas de danger, faites le 911.'
  },
  l6: {
    public: 'locataires',
    q: 'Comment payer mon loyer?',
    r: 'Selon le mode de paiement prévu à votre bail; votre portail locataire indique ce qui est dû et ce qui a été reçu. Pour toute question sur un paiement, écrivez-nous depuis votre portail.'
  },
  l7: {
    public: 'locataires',
    q: 'Comment céder mon bail ou sous-louer mon logement?',
    r: 'Envoyez un avis écrit depuis votre portail locataire, avec les coordonnées de la personne proposée. Depuis la Loi 31, le propriétaire peut accepter, refuser pour un motif sérieux ou, pour une cession, résilier le bail; le portail explique chaque cas avant l\u2019envoi.'
  },
  l8: {
    public: 'locataires',
    q: 'Comment ajouter une personne à mon bail?',
    r: 'Remplissez le formulaire Ajout au bail dans votre portail locataire : identité de la personne, date d\u2019arrivée et statut, colocataire signataire ou simple occupant. Le propriétaire donne son accord, puis le bail est mis à jour.'
  },
  l9: {
    public: 'locataires',
    q: 'Qu\u2019est-ce qu\u2019un endosseur, et à quoi s\u2019engage-t-il?',
    r: 'L\u2019endosseur, ou caution, s\u2019engage à payer le loyer et à respecter le bail si le locataire ne le fait pas. Il choisit comment démontrer sa capacité de payer : enquête de crédit avec son consentement, ou reçus et factures payées. Il signe électroniquement ; nous ne demandons jamais sa carte d\u2019assurance maladie.'
  },
  l10: {
    public: 'locataires',
    q: 'Comment faire un commentaire ou déposer une plainte?',
    r: 'Choisissez la catégorie dans le formulaire : commentaire, plainte ou demande administrative. Vous recevez un accusé de réception immédiat et une première réponse en moins de 24 h.'
  },
  l11: {
    public: 'locataires',
    phase: 2,
    q: 'Comment fonctionne le renouvellement de bail?',
    r: 'Votre bail se renouvelle aux mêmes conditions. Si le propriétaire veut le modifier, il vous envoie un avis de trois à six mois avant la fin d\u2019un bail de douze mois. Vous avez un mois après la réception de l\u2019avis pour lui répondre par écrit que vous refusez la modification ou que vous quittez le logement ; sans réponse de votre part, vous êtes réputé l\u2019avoir acceptée (art. 1945 C.c.Q.).'
  },
  l12: {
    public: 'locataires',
    phase: 2,
    q: 'Quand vais-je recevoir mon Relevé 31?',
    r: 'Le Relevé 31 vous est remis au plus tard le dernier jour de février, pour l\u2019année précédente. Il sert à demander le crédit d\u2019impôt pour solidarité.'
  },
  l13: {
    public: 'locataires',
    phase: 2,
    q: 'Que faire en cas de conflit avec un voisin?',
    r: 'Écrivez-nous en décrivant la situation, les dates et l\u2019effet sur votre logement. Nous intervenons auprès des personnes concernées et vous tenons informé des suites.'
  },
  l14: {
    public: 'locataires',
    phase: 2,
    q: 'Comment se passe mon départ du logement?',
    r: 'Donnez votre avis de départ dans votre portail locataire, dans les délais prévus au bail. Cléo planifie avec vous les visites de relocation, puis nous convenons de la remise des clés.'
  },
  t1: {
    public: 'locataires',
    q: 'Qu\u2019est-ce que le TAL, l\u2019ancienne Régie du logement?',
    r: 'Le Tribunal administratif du logement (TAL) a remplacé la Régie du logement le 31 août 2020. Il tranche les litiges entre locataires et propriétaires de logements résidentiels au Québec, et publie chaque année la méthode de calcul des hausses de loyer.'
  },
  t2: {
    public: 'locataires',
    q: 'Puis-je refuser une hausse de loyer?',
    r: 'Oui. Vous avez un mois après la réception de l\u2019avis pour la refuser par écrit, et vous restez dans le logement. Le propriétaire peut alors demander au TAL de fixer le loyer, dans le mois qui suit votre refus.'
  },
  t3: {
    public: 'locataires',
    q: 'Le propriétaire peut-il reprendre mon logement?',
    r: 'Oui, pour s\u2019y loger ou y loger un proche parent, par un avis écrit au moins six mois avant la fin d\u2019un bail de douze mois. Vous avez un mois pour répondre; sans réponse de votre part, vous êtes réputé refuser.'
  },
  t4: {
    public: 'locataires',
    q: 'Le propriétaire peut-il entrer dans mon logement?',
    r: 'Oui. Avec un préavis de 24 heures, il peut vérifier l\u2019état du logement, y faire des travaux ou le faire visiter à un acheteur ; les visites ont lieu entre 9 h et 21 h, les travaux entre 7 h et 19 h. Après votre avis de non-reconduction, il peut le faire visiter à de futurs locataires sans préavis, entre 9 h et 21 h. Des travaux majeurs exigent un avis écrit d\u2019au moins 10 jours, ou de 3 mois si vous devez quitter le logement plus d\u2019une semaine. Vous pouvez refuser une visite si le propriétaire ou son représentant ne peut être présent. En cas d\u2019urgence, aucun préavis n\u2019est requis.'
  },
  t5: {
    public: 'proprietaires',
    q: 'À partir de quand puis-je m\u2019adresser au TAL pour un loyer impayé?',
    r: 'Après plus de trois semaines de retard, vous pouvez demander au TAL la résiliation du bail et le recouvrement du loyer. Nous préparons le dossier et vous le soumettons avant tout dépôt.'
  },
  t6: {
    public: 'proprietaires',
    q: 'Puis-je exiger un dépôt de garantie?',
    r: 'Non. Au Québec, seul le loyer du premier mois peut être demandé à l\u2019avance. Aucun dépôt de garantie ni chèque postdaté ne peut être exigé.'
  },
  t7: {
    public: 'proprietaires',
    q: 'Comment reprendre un logement pour y habiter?',
    r: 'Envoyez un avis écrit au moins six mois avant la fin d\u2019un bail de douze mois. Le locataire a un mois pour répondre; s\u2019il refuse ou ne répond pas, vous devez demander l\u2019autorisation au TAL dans le mois qui suit.'
  }
};
export { LL_FAQ };
