/* Converti depuis ui_kits/site-public/articles-blogue.js (prototype) — ne pas réintroduire de globaux window. */

var CCQ_FR = 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/CCQ-1991',
  CCQ_EN = 'https://www.legisquebec.gouv.qc.ca/en/document/cs/CCQ-1991';
var REV_FR = 'Octobre 2027, ou dès qu’une règle change',
  REV_EN = 'October 2027, or as soon as a rule changes';
let LL_ARTICLES = [/* ——— 1. Dépôt de garantie ——— */
{
  slug: 'depot-de-garantie',
  couv: {
    fr: "Clés d’appartement et enveloppe sur une table, devant des maisons en rangée de Québec",
    en: "Apartment keys and an envelope on a table, in front of Québec City row houses"
  },
  slugEN: 'security-deposit-quebec',
  cat: 'droit',
  d: '2026-10-11',
  m: '2026-10-11',
  min: 6,
  aut: 'jt',
  fr: {
    t: 'Dépôt de garantie au Québec : pourquoi il est interdit',
    r: 'Ce que le propriétaire peut exiger à la signature, ce qu’il ne peut pas demander, et que faire si un dépôt a déjà été versé.',
    titre: 'Dépôt de garantie au Québec : interdit? | Lease Lane',
    description: 'Au Québec, un propriétaire ne peut exiger que le premier mois de loyer d’avance. Dépôt, clés, chèques postdatés : la règle et les recours, sources à l’appui.',
    requete: 'dépôt de garantie Québec',
    fil: 'Dépôt de garantie',
    about: ['Dépôt de garantie', 'Bail résidentiel au Québec', 'Tribunal administratif du logement'],
    reponse: 'Au Québec, le propriétaire ne peut exiger d’avance **que le premier mois de loyer**. Tout autre montant est interdit : dépôt de garantie, dépôt pour les clés, dernier mois de loyer ou chèques postdatés exigés[1][2]. Une clause du bail qui prévoit un dépôt est sans effet[1], et le locataire peut demander le remboursement au TAL.',
    sections: [{
      id: 'regle',
      h: 'Ce que dit la loi',
      blocs: [['p', 'Selon l’article 1904 du Code civil du Québec, le locateur ne peut exiger d’avance que le paiement du premier terme de loyer, soit **un mois au maximum**. Il ne peut pas non plus exiger une somme d’argent autre que le loyer, « sous forme de dépôt ou autrement », ni exiger la remise de chèques postdatés[1].'], ['p', 'Cette règle protège le locataire et ne peut pas être écartée par le bail. Toute clause d’un bail de logement qui y déroge est **sans effet**, même si le locataire l’a signée[1].']]
    }, {
      id: 'permis',
      h: 'Ce que le propriétaire peut demander, et ce qu’il ne peut pas',
      blocs: [['table', {
        cap: 'Sommes qu’un propriétaire peut exiger à la signature d’un bail au Québec',
        th: ['Demande', 'Au Québec'],
        lignes: [['Premier mois de loyer, d’avance', 'Permis, un mois au maximum'], ['Dernier mois de loyer', 'Interdit'], ['Dépôt pour les clés ou la télécommande', 'Interdit s’il est exigé'], ['Dépôt pour dommages', 'Interdit'], ['Chèques postdatés', 'Interdits s’ils sont exigés; possibles d’un commun accord']]
      }], ['p', 'Le TAL donne précisément l’exemple des clés : le locateur ne peut pas exiger de somme additionnelle « pour garantir la remise des clés ». Les chèques postdatés ne peuvent pas être imposés, mais les parties peuvent choisir ce mode de paiement d’un commun accord[2].'], ['h3', 'La règle en Ontario'], ['p', 'En Ontario, la loi permet un dépôt de loyer, souvent le dernier mois, et un dépôt de clé remboursable[4]. Ces pratiques sont courantes ailleurs au Canada, mais elles ne s’appliquent pas à un logement situé au Québec.']]
    }, {
      id: 'volontaire',
      h: 'Le « dépôt volontaire » : une zone grise?',
      blocs: [['p', 'Selon Éducaloi, un dépôt n’est acceptable que s’il est offert de façon **libre et volontaire** par le locataire, sans aucune pression[3]. Dans une décision rapportée par Éducaloi, un formulaire de « dépôt volontaire » préparé par le propriétaire a été jugé invalide[3].'], ['p', 'En pratique, un document rédigé par le propriétaire et présenté comme une condition de la location n’est pas volontaire. Le locataire peut refuser de payer, ou payer puis demander le remboursement.']]
    }, {
      id: 'deja-paye',
      h: 'Vous avez déjà versé un dépôt?',
      blocs: [['ol', ['Demandez le remboursement par écrit au propriétaire, en citant l’article 1904 du Code civil, et gardez une copie de votre demande.', 'Rassemblez vos preuves : reçu, virement, courriel ou clause du bail qui mentionne le dépôt.', 'Sans remboursement, déposez une demande au Tribunal administratif du logement.']], ['p', 'Le recours vise le montant versé. Il ne met pas fin au bail et ne justifie pas de [retenir le loyer](/blogue/loyer-impaye).']]
    }, {
      id: 'proprietaires',
      h: 'Pour les propriétaires : se protéger sans dépôt',
      blocs: [['ul', ['**Une enquête de crédit**, avec le consentement écrit du candidat. Voir [ce que le propriétaire peut demander](/blogue/enquete-prelocation).', '**Des références** d’anciens propriétaires, demandées à tous les candidats de la même façon.', '**Un état des lieux photographié** à l’entrée et à la sortie, signé par les deux parties.', '**Le recours au TAL** pour des dommages réels, preuves à l’appui.']], ['p', 'Chez Lease Lane, aucun dépôt n’est demandé : seul le premier mois de loyer est exigé à la signature. Les [demandes de location](/locataires/demande-de-location) se font en ligne et ne recueillent que les renseignements nécessaires.']]
    }],
    faq: [['Mon propriétaire peut-il demander le dernier mois de loyer?', 'Non. Seul le premier mois peut être exigé d’avance (art. 1904 C.c.Q.). Le dépôt du dernier mois est permis en Ontario, pas au Québec.'], ['Un dépôt pour les clés ou la télécommande est-il permis?', 'Non, s’il est exigé. Le TAL cite précisément les clés comme exemple de somme qu’un propriétaire ne peut pas exiger.'], ['Que faire si j’ai déjà payé un dépôt?', 'Demandez le remboursement par écrit au propriétaire. Sans réponse, déposez une demande au TAL : la clause qui prévoit le dépôt est sans effet (art. 1893 C.c.Q.).'], ['Le propriétaire peut-il exiger des chèques postdatés?', 'Non (art. 1904 C.c.Q.). Ce mode de paiement est possible seulement si les deux parties y consentent librement.']],
    src: [['Code civil du Québec, art. 1893 et 1904', CCQ_FR, 'LégisQuébec'], ['Paiement du loyer', 'https://www.tal.gouv.qc.ca/fr/etre-locataire/paiement-du-loyer', 'Tribunal administratif du logement'], ['Le dépôt de garantie : illégal, mais répandu', 'https://educaloi.qc.ca/actualites-juridiques/le-depot-de-garantie-illegal-mais-repandu/', 'Éducaloi'], ['Residential Tenancies Act, 2006, art. 105 et 106', 'https://www.ontario.ca/laws/statute/06r17', 'Gouvernement de l’Ontario']],
    cleo: 'Cléo vous dit ce qu’un propriétaire peut exiger à la signature d’un bail, 24/7, et passe le relais à l’équipe au besoin.',
    cleoQ: 'Un dépôt de garantie',
    revision: REV_FR
  },
  en: {
    t: 'Security deposits in Québec: why they are prohibited',
    r: 'What a landlord can require when the lease is signed, what they cannot ask for, and what to do if a deposit was already paid.',
    titre: 'Security Deposit in Québec: Is It Legal? | Lease Lane',
    description: 'In Québec, a landlord can only require the first month’s rent in advance. Deposits, keys, post-dated cheques: the rule and the recourse, with sources.',
    requete: 'security deposit Quebec',
    fil: 'Security deposit',
    about: ['Security deposit', 'Residential lease in Québec', 'Administrative Housing Tribunal'],
    reponse: 'In Québec, a landlord can only require **the first month’s rent** in advance. Any other amount is prohibited: a security deposit, a key deposit, the last month’s rent or required post-dated cheques[1][2]. A lease clause that provides for a deposit has no effect[1], and the tenant can ask the TAL for a refund.',
    sections: [{
      id: 'regle',
      h: 'What the law says',
      blocs: [['p', 'Under article 1904 of the Civil Code of Québec, the landlord can only require payment of the first term of rent in advance, which means **one month at most**. The landlord also cannot require any sum of money other than the rent, “in the form of a deposit or otherwise”, or require post-dated cheques[1].'], ['p', 'This rule protects the tenant and cannot be set aside by the lease. Any clause in a dwelling lease that departs from it has **no effect**, even if the tenant signed it[1].']]
    }, {
      id: 'permis',
      h: 'What a landlord can ask for, and what they cannot',
      blocs: [['table', {
        cap: 'Amounts a landlord can require when a lease is signed in Québec',
        th: ['Request', 'In Québec'],
        lignes: [['First month’s rent, in advance', 'Allowed, one month at most'], ['Last month’s rent', 'Prohibited'], ['Deposit for keys or a remote', 'Prohibited if required'], ['Damage deposit', 'Prohibited'], ['Post-dated cheques', 'Prohibited if required; possible by mutual agreement']]
      }], ['p', 'The TAL gives keys as a specific example: the landlord cannot require an additional amount “to guarantee the return of the keys”. Post-dated cheques cannot be imposed, but both parties can choose this method of payment by mutual agreement[2].'], ['h3', 'The rule in Ontario'], ['p', 'In Ontario, the law allows a rent deposit, often the last month, and a refundable key deposit[4]. These practices are common elsewhere in Canada, but they do not apply to a dwelling located in Québec.']]
    }, {
      id: 'volontaire',
      h: 'The “voluntary deposit”: a grey area?',
      blocs: [['p', 'According to Éducaloi, a deposit is only acceptable if the tenant offers it **freely and voluntarily**, without any pressure[3]. In a decision reported by Éducaloi, a “voluntary deposit” form prepared by the landlord was found invalid[3].'], ['p', 'In practice, a document written by the landlord and presented as a condition of renting is not voluntary. The tenant can refuse to pay, or pay and then ask for a refund.']]
    }, {
      id: 'deja-paye',
      h: 'Already paid a deposit?',
      blocs: [['ol', ['Ask the landlord for a refund in writing, citing article 1904 of the Civil Code, and keep a copy of your request.', 'Gather your evidence: receipt, transfer, email or the lease clause that mentions the deposit.', 'If you are not refunded, file an application with the Administrative Housing Tribunal.']], ['p', 'The recourse covers the amount paid. It does not end the lease and does not justify [withholding rent](/blogue/loyer-impaye).']]
    }, {
      id: 'proprietaires',
      h: 'For landlords: protecting yourself without a deposit',
      blocs: [['ul', ['**A credit check**, with the applicant’s written consent. See [what a landlord can ask for](/blogue/enquete-prelocation).', '**References** from previous landlords, requested from every applicant in the same way.', '**A photographed condition report** at move-in and move-out, signed by both parties.', '**An application to the TAL** for actual damage, with evidence.']], ['p', 'At Lease Lane, no deposit is requested: only the first month’s rent is required at signing. [Rental applications](/locataires/demande-de-location) are made online and only collect the information that is needed.']]
    }],
    faq: [['Can my landlord ask for the last month’s rent?', 'No. Only the first month can be required in advance (art. 1904 C.C.Q.). A last-month deposit is allowed in Ontario, not in Québec.'], ['Is a deposit for keys or a remote allowed?', 'No, if it is required. The TAL specifically cites keys as an example of an amount a landlord cannot require.'], ['What if I already paid a deposit?', 'Ask the landlord for a refund in writing. If you get no answer, file an application with the TAL: the clause that provides for the deposit has no effect (art. 1893 C.C.Q.).'], ['Can the landlord require post-dated cheques?', 'No (art. 1904 C.C.Q.). This method of payment is only possible if both parties freely agree to it.']],
    src: [['Civil Code of Québec, arts. 1893 and 1904', CCQ_EN, 'LégisQuébec'], ['Paiement du loyer (rent payment)', 'https://www.tal.gouv.qc.ca/fr/etre-locataire/paiement-du-loyer', 'Administrative Housing Tribunal'], ['Le dépôt de garantie : illégal, mais répandu', 'https://educaloi.qc.ca/actualites-juridiques/le-depot-de-garantie-illegal-mais-repandu/', 'Éducaloi'], ['Residential Tenancies Act, 2006, ss. 105 and 106', 'https://www.ontario.ca/laws/statute/06r17', 'Government of Ontario']],
    cleo: 'Cléo tells you what a landlord can require when a lease is signed, 24/7, and hands over to the team when needed.',
    cleoQ: 'A security deposit',
    revision: REV_EN
  }
}, /* ——— 2. Cession de bail ——— */
{
  slug: 'cession-de-bail-loi-31',
  couv: {
    fr: "Remise des clés d’un appartement d’une personne à une autre, dans l’entrée d’un logement",
    en: "Apartment keys handed from one person to another in a dwelling’s entrance"
  },
  slugEN: 'lease-assignment-bill-31',
  cat: 'locataires',
  d: '2026-10-11',
  m: '2026-10-11',
  min: 7,
  aut: 'jt',
  fr: {
    t: 'Cession de bail : ce qui change avec la Loi 31',
    r: 'L’avis de cession, le délai de 15 jours, les trois réponses possibles du propriétaire et les frais permis, depuis le 21 février 2024.',
    titre: 'Cession de bail et Loi 31 : délais et refus | Lease Lane',
    description: 'Avis de cession, 15 jours pour répondre, refus et résiliation du bail : les règles de la cession de bail au Québec depuis la Loi 31, articles cités.',
    requete: 'cession de bail Loi 31',
    fil: 'Cession de bail',
    about: ['Cession de bail', 'Loi 31', 'Tribunal administratif du logement'],
    reponse: 'Depuis le 21 février 2024 (Loi 31), le propriétaire qui reçoit un avis de cession a **15 jours** pour répondre[1][2]. Il peut accepter, refuser pour un motif sérieux (le bail continue) ou refuser pour un autre motif : **le bail est alors résilié** à la date de cession indiquée dans l’avis[1][2]. Sans réponse dans les 15 jours, il est réputé avoir accepté[1].',
    sections: [{
      id: 'difference',
      h: 'Cession ou sous-location : la différence',
      blocs: [['p', 'La **cession** transfère le bail à une autre personne, le cessionnaire, qui devient locataire à votre place. Elle libère l’ancien locataire de ses obligations; dans un bail de logement, il est impossible de convenir autrement[1][2].'], ['p', 'La **sous-location** permet à une autre personne d’occuper le logement, mais vous restez locataire et responsable envers le propriétaire. La nouvelle option de refus avec résiliation ne s’applique pas à la sous-location[2].']]
    }, {
      id: 'avis',
      h: 'L’avis de cession',
      blocs: [['p', 'Le locataire doit aviser le propriétaire par écrit et lui donner le nom et l’adresse de la personne à qui il veut céder le bail. Depuis la Loi 31, l’avis doit aussi indiquer **la date de cession prévue**[1]. Le TAL propose un formulaire d’avis[4].'], ['p', 'Envoyez l’avis d’une façon qui permet de prouver sa réception : le délai de réponse du propriétaire commence à la réception, pas à l’envoi.']]
    }, {
      id: 'quinze',
      h: 'Le délai de 15 jours et les trois réponses possibles',
      blocs: [['table', {
        cap: 'Réponses possibles du propriétaire à un avis de cession de bail et leurs effets',
        th: ['Réponse du propriétaire', 'Effet'],
        lignes: [['Accepte, ou ne répond pas dans les 15 jours', 'La cession a lieu; le cessionnaire devient locataire à la date prévue'], ['Refuse pour un motif sérieux, par écrit et motivé', 'Le bail continue; le locataire peut contester le refus au TAL'], ['Refuse pour un autre motif', 'Le bail est résilié à la date de cession indiquée dans l’avis']]
      }], ['p', 'Le motif sérieux concerne en général le cessionnaire, par exemple sa capacité de payer le loyer. Le propriétaire doit donner ses motifs dans les 15 jours, sinon il est réputé avoir consenti[1]. Le TAL publie un formulaire de réponse pour les avis transmis depuis le 21 février 2024[3].']]
    }, {
      id: 'frais',
      h: 'Frais et argent : ce qui est interdit',
      blocs: [['ul', ['Le propriétaire qui consent ne peut exiger que le remboursement des **dépenses raisonnables** liées à la cession, comme les frais d’une [enquête de crédit](/blogue/enquete-prelocation)[1][2].', 'La cession doit être **gratuite** : le locataire qui cède son bail ne peut exiger aucune somme du cessionnaire, ni lui imposer l’achat de meubles[1].', 'En sous-location, le sous-loyer ne peut pas dépasser le loyer payé, plus les services et des frais raisonnables pour les meubles fournis[1].']], ['p', 'Selon le TAL, exiger une contrepartie pour une cession ou un sous-loyer trop élevé constitue une infraction passible d’une amende[2].']]
    }, {
      id: 'calendrier',
      h: 'Un exemple de calendrier',
      blocs: [['p', 'Exemple : un locataire veut céder son bail au 1er mai.'], ['ul', ['**Début mars** : il envoie l’avis de cession avec le nom et l’adresse du cessionnaire et la date du 1er mai.', '**15 jours après la réception de l’avis** : fin du délai de réponse du propriétaire.', '**Sans réponse ou en cas d’accord** : le cessionnaire devient locataire le 1er mai.', '**Refus pour un autre motif** : le bail prend fin le 1er mai; le propriétaire peut [relouer](/blogue/logement-vacant-cout).']]]
    }, {
      id: 'loyer',
      h: 'Le loyer du cessionnaire',
      blocs: [['p', 'Le cessionnaire reprend le bail tel quel. Il n’est pas un nouveau locataire : il ne peut pas faire fixer son loyer par le TAL au motif que le loyer est plus élevé que le plus bas payé dans les 12 derniers mois[2].'], ['p', 'Si le bail est résilié parce que le propriétaire a refusé pour un autre motif, le propriétaire signe ensuite un **nouveau bail** et doit remettre au nouveau locataire [l’avis du loyer le plus bas payé](/blogue/hausse-de-loyer-2026) dans les 12 mois précédents (section G du bail)[1].']]
    }, {
      id: 'recours',
      h: 'Les recours au TAL',
      blocs: [['p', 'Le locataire peut demander au TAL de se prononcer sur les motifs du refus. Selon les résumés de décisions publiés par le TAL, le tribunal peut notamment déclarer la cession valide ou accorder des dommages-intérêts[5].'], ['p', 'Le propriétaire doit répondre par écrit, dans les 15 jours, en précisant laquelle des trois réponses il choisit. Pour les immeubles que nous gérons, chaque avis de cession est consigné dès sa réception et la réponse part dans le délai. Voir notre [gestion immobilière](/gestion-immobiliere).']]
    }],
    faq: [['Mon propriétaire peut-il refuser ma cession sans raison?', 'Oui, depuis le 21 février 2024, mais le bail prend alors fin à la date de cession indiquée dans votre avis (art. 1978.2 C.c.Q.).'], ['Que se passe-t-il si le propriétaire ne répond pas?', 'Après 15 jours suivant la réception de l’avis, il est réputé avoir consenti à la cession (art. 1871 C.c.Q.).'], ['Puis-je demander de l’argent au cessionnaire?', 'Non. La cession doit être gratuite (art. 1978.3 C.c.Q.); selon le TAL, c’est une infraction passible d’une amende.'], ['Le propriétaire peut-il me facturer des frais?', 'Seulement les dépenses raisonnables liées à la cession, comme une enquête de crédit (art. 1872 C.c.Q.).']],
    src: [['Code civil du Québec, art. 1870 à 1873, 1896 et 1978.1 à 1978.4', CCQ_FR, 'LégisQuébec'], ['Cession d’un bail ou sous-location', 'https://www.tal.gouv.qc.ca/fr/cession-d-un-bail-ou-sous-location/contrat-de-cession-de-bail-et-avis-de-sous-location', 'Tribunal administratif du logement'], ['Réponse à un avis de cession de bail (avis transmis à compter du 21 février 2024)', 'https://www.tal.gouv.qc.ca/sites/default/files/notices/TAL_828_E.pdf', 'Tribunal administratif du logement'], ['Avis de cession de bail', 'https://www.tal.gouv.qc.ca/sites/default/files/notices/TAL_802_E.pdf', 'Tribunal administratif du logement'], ['Résumés de décisions : cession ou sous-location', 'https://www.tal.gouv.qc.ca/fr/resumes-decisions-cession-sous-location', 'Tribunal administratif du logement']],
    cleo: 'Cléo vérifie votre avis de cession et vous dit où vous en êtes dans le délai, 24/7.',
    cleoQ: 'Une cession de bail',
    revision: REV_FR
  },
  en: {
    t: 'Lease assignment: what changed with Bill 31',
    r: 'The notice of assignment, the 15-day deadline, the landlord’s three possible answers and the fees allowed, since February 21, 2024.',
    titre: 'Lease Assignment and Bill 31 in Québec | Lease Lane',
    description: 'Notice of assignment, 15 days to answer, refusal and termination of the lease: the rules for assigning a lease in Québec since Bill 31, with articles cited.',
    requete: 'lease assignment Quebec Bill 31',
    fil: 'Lease assignment',
    about: ['Lease assignment', 'Bill 31', 'Administrative Housing Tribunal'],
    reponse: 'Since February 21, 2024 (Bill 31), a landlord who receives a notice of assignment has **15 days** to answer[1][2]. The landlord can accept, refuse for a serious reason (the lease continues) or refuse for another reason: **the lease is then terminated** on the assignment date given in the notice[1][2]. Without an answer within 15 days, the landlord is deemed to have accepted[1].',
    sections: [{
      id: 'difference',
      h: 'Assignment or sublease: the difference',
      blocs: [['p', 'An **assignment** transfers the lease to another person, the assignee, who becomes the tenant in your place. It releases the former tenant from their obligations; in a dwelling lease, it is not possible to agree otherwise[1][2].'], ['p', 'A **sublease** lets another person occupy the dwelling, but you remain the tenant and responsible to the landlord. The new option to refuse and terminate does not apply to a sublease[2].']]
    }, {
      id: 'avis',
      h: 'The notice of assignment',
      blocs: [['p', 'The tenant must notify the landlord in writing and give the name and address of the person they want to assign the lease to. Since Bill 31, the notice must also state **the planned assignment date**[1]. The TAL provides a notice form[4].'], ['p', 'Send the notice in a way that proves it was received: the landlord’s response period starts when the notice is received, not when it is sent.']]
    }, {
      id: 'quinze',
      h: 'The 15-day deadline and the three possible answers',
      blocs: [['table', {
        cap: 'The landlord’s possible answers to a notice of lease assignment and their effects',
        th: ['Landlord’s answer', 'Effect'],
        lignes: [['Accepts, or does not answer within 15 days', 'The assignment takes place; the assignee becomes the tenant on the planned date'], ['Refuses for a serious reason, in writing, with reasons', 'The lease continues; the tenant can contest the refusal at the TAL'], ['Refuses for another reason', 'The lease is terminated on the assignment date given in the notice']]
      }], ['p', 'A serious reason usually concerns the assignee, for example their ability to pay the rent. The landlord must give their reasons within 15 days, otherwise they are deemed to have consented[1]. The TAL publishes a response form for notices sent since February 21, 2024[3].']]
    }, {
      id: 'frais',
      h: 'Fees and money: what is prohibited',
      blocs: [['ul', ['A landlord who consents can only require reimbursement of **reasonable expenses** related to the assignment, such as the cost of a [credit check](/blogue/enquete-prelocation)[1][2].', 'The assignment must be **free**: the tenant who assigns their lease cannot require any amount from the assignee or force them to buy furniture[1].', 'In a sublease, the sublease rent cannot exceed the rent paid, plus services and reasonable charges for furniture provided[1].']], ['p', 'According to the TAL, requiring payment for an assignment or charging excessive sublease rent is an offence subject to a fine[2].']]
    }, {
      id: 'calendrier',
      h: 'A sample timeline',
      blocs: [['p', 'Example: a tenant wants to assign their lease as of May 1.'], ['ul', ['**Early March**: they send the notice of assignment with the assignee’s name and address and the May 1 date.', '**15 days after the notice is received**: end of the landlord’s response period.', '**No answer or consent**: the assignee becomes the tenant on May 1.', '**Refusal for another reason**: the lease ends on May 1; the landlord can [rent the unit again](/blogue/logement-vacant-cout).']]]
    }, {
      id: 'loyer',
      h: 'The assignee’s rent',
      blocs: [['p', 'The assignee takes over the lease as is. They are not a new tenant: they cannot ask the TAL to fix their rent on the grounds that it is higher than the lowest rent paid in the previous 12 months[2].'], ['p', 'If the lease is terminated because the landlord refused for another reason, the landlord then signs a **new lease** and must give the new tenant [the notice of the lowest rent paid](/blogue/hausse-de-loyer-2026) in the previous 12 months (section G of the lease)[1].']]
    }, {
      id: 'recours',
      h: 'Recourse at the TAL',
      blocs: [['p', 'The tenant can ask the TAL to rule on the reasons for the refusal. According to the decision summaries published by the TAL, the tribunal can, among other things, declare the assignment valid or award damages[5].'], ['p', 'The landlord must answer in writing, within 15 days, stating which of the three answers they choose. For the buildings we manage, every notice of assignment is logged on receipt and the answer goes out on time. See our [property management](/gestion-immobiliere).']]
    }],
    faq: [['Can my landlord refuse my assignment without a reason?', 'Yes, since February 21, 2024, but the lease then ends on the assignment date given in your notice (art. 1978.2 C.C.Q.).'], ['What happens if the landlord does not answer?', 'After 15 days from receiving the notice, the landlord is deemed to have consented to the assignment (art. 1871 C.C.Q.).'], ['Can I ask the assignee for money?', 'No. The assignment must be free (art. 1978.3 C.C.Q.); according to the TAL, it is an offence subject to a fine.'], ['Can the landlord charge me fees?', 'Only reasonable expenses related to the assignment, such as a credit check (art. 1872 C.C.Q.).']],
    src: [['Civil Code of Québec, arts. 1870 to 1873, 1896 and 1978.1 to 1978.4', CCQ_EN, 'LégisQuébec'], ['Lease assignment or sublease', 'https://www.tal.gouv.qc.ca/fr/cession-d-un-bail-ou-sous-location/contrat-de-cession-de-bail-et-avis-de-sous-location', 'Administrative Housing Tribunal'], ['Reply to a notice of assignment of lease (notices sent as of February 21, 2024)', 'https://www.tal.gouv.qc.ca/sites/default/files/notices/TAL_828_E.pdf', 'Administrative Housing Tribunal'], ['Notice of assignment of lease', 'https://www.tal.gouv.qc.ca/sites/default/files/notices/TAL_802_E.pdf', 'Administrative Housing Tribunal'], ['Decision summaries: assignment or sublease', 'https://www.tal.gouv.qc.ca/fr/resumes-decisions-cession-sous-location', 'Administrative Housing Tribunal']],
    cleo: 'Cléo checks your notice of assignment and tells you where you stand in the deadline, 24/7.',
    cleoQ: 'A lease assignment',
    revision: REV_EN
  }
}, /* ——— 3. Reprise de logement et éviction ——— */
{
  slug: 'reprise-de-logement',
  couv: {
    fr: "Boîtes de déménagement dans un appartement vide, devant un triplex de Québec",
    en: "Moving boxes in an empty apartment, facing a Québec City triplex"
  },
  slugEN: 'repossession-eviction-quebec',
  cat: 'droit',
  d: '2026-10-11',
  m: '2026-10-11',
  min: 8,
  aut: 'jt',
  fr: {
    t: 'Reprise de logement et éviction : règles, délais et moratoire',
    r: 'Qui peut reprendre un logement, les délais d’avis, la réponse du locataire, la protection des aînés et le moratoire sur les évictions jusqu’en 2027.',
    titre: 'Reprise de logement au Québec : délais et moratoire | Lease Lane',
    description: 'Reprise pour soi ou un proche, avis de 6 mois, silence du locataire, aînés de 65 ans et plus, moratoire sur les évictions : les règles au Québec, articles cités.',
    requete: 'reprise de logement',
    fil: 'Reprise de logement',
    about: ['Reprise de logement', 'Éviction', 'Tribunal administratif du logement'],
    reponse: 'Au Québec, un propriétaire peut reprendre un logement pour lui-même ou un proche en donnant un avis écrit, **en général 6 mois avant la fin du bail**[1]. Le locataire a un mois pour répondre et **son silence vaut refus**; le propriétaire doit alors s’adresser au TAL dans le mois[1][3]. Les évictions pour agrandir, subdiviser ou changer l’affectation d’un logement sont suspendues **jusqu’au 6 juin 2027**[2].',
    sections: [{
      id: 'qui',
      h: 'Qui peut reprendre un logement',
      blocs: [['p', 'Le propriétaire peut reprendre le logement pour l’habiter lui-même, ou pour y loger ses ascendants ou descendants au premier degré, ou un autre parent ou allié dont il est le principal soutien. Il peut aussi le reprendre pour un ex-conjoint dont il demeure le principal soutien[1].'], ['p', 'Un copropriétaire indivis ne peut pas reprendre un logement, sauf si l’autre copropriétaire est son conjoint et qu’ils sont les deux seuls propriétaires[1].']]
    }, {
      id: 'avis',
      h: 'Les délais de l’avis',
      blocs: [['table', {
        cap: 'Délais d’avis de reprise de logement selon la durée du bail',
        th: ['Durée du bail', 'Avis à donner'],
        lignes: [['Plus de 6 mois', 'Au moins 6 mois avant la fin du bail'], ['6 mois ou moins', 'Au moins 1 mois avant la fin du bail'], ['Durée indéterminée', 'Au moins 6 mois avant la date de la reprise']]
      }], ['p', 'L’avis indique la date de la reprise, le nom du bénéficiaire et son lien avec le propriétaire. Il doit aussi **reproduire le texte de l’article 1959.1** du Code civil, qui protège certains aînés[1]. Un avis incomplet ou tardif expose la reprise à un refus du tribunal.']]
    }, {
      id: 'reponse',
      h: 'La réponse du locataire et la demande au TAL',
      blocs: [['p', 'Le locataire a **un mois** après la réception de l’avis pour répondre. S’il ne répond pas, il est réputé avoir **refusé** de quitter le logement[1].'], ['p', 'En cas de refus, c’est au propriétaire de présenter une demande au TAL **dans le mois** qui suit. Il doit démontrer qu’il entend réellement reprendre le logement pour la fin indiquée et qu’il ne s’agit pas d’un prétexte[1][3].']]
    }, {
      id: 'aines',
      h: 'La protection des locataires de 65 ans et plus',
      blocs: [['p', 'Le propriétaire ne peut ni reprendre ni évincer lorsque le locataire, ou son conjoint, remplit **les trois conditions** suivantes[1][2] :'], ['ul', ['il a 65 ans ou plus;', 'il occupe le logement depuis au moins 10 ans;', 'son revenu est égal ou inférieur à 125 % du revenu maximal d’admissibilité à un logement à loyer modique.']], ['p', 'Des exceptions existent pour la reprise, notamment lorsque le propriétaire ou le bénéficiaire a lui-même 65 ans ou plus[1]. Les seuils de revenu sont publiés par la Société d’habitation du Québec.']]
    }, {
      id: 'eviction',
      h: 'Éviction et moratoire jusqu’en 2027',
      blocs: [['p', 'L’**éviction** vise un autre motif : subdiviser le logement, l’agrandir substantiellement ou en changer l’affectation. La Loi 65, sanctionnée le 6 juin 2024, interdit ces évictions **jusqu’au 6 juin 2027**[2]. La reprise pour soi ou un proche n’est pas visée par ce moratoire.'], ['p', 'Le moratoire peut prendre fin plus tôt si le [taux d’inoccupation](/blogue/logement-vacant-cout) publié par la SCHL atteint 3 %, après un avis publié à la Gazette officielle; le gouvernement peut aussi soustraire des territoires au moratoire[2]. Vérifiez l’état du moratoire auprès du TAL avant d’envoyer un avis.'], ['table', {
        cap: 'Comparaison entre la reprise de logement et l’éviction au Québec',
        th: ['', 'Reprise', 'Éviction'],
        lignes: [['Motif', 'Loger le propriétaire ou un proche', 'Subdiviser, agrandir ou changer l’affectation'], ['Visée par le moratoire', 'Non', 'Oui, jusqu’au 6 juin 2027'], ['Indemnité', 'Frais de déménagement, si le TAL l’impose', 'Frais de déménagement et 1 mois de loyer par année d’occupation (3 à 24 mois)'], ['Protection des 65 ans et plus', 'Oui, avec exceptions', 'Oui']]
      }], ['p', 'L’indemnité d’éviction comprend les frais raisonnables de déménagement et un mois de loyer par année de location ininterrompue, d’au moins 3 mois et d’au plus 24 mois[1].']]
    }, {
      id: 'apres',
      h: 'Après la reprise',
      blocs: [['p', 'Un logement repris ou évacué ne peut pas être reloué ni utilisé à une autre fin sans l’autorisation du TAL[1]. Si le propriétaire n’agit pas de bonne foi, le locataire peut réclamer des dommages-intérêts, et des dommages punitifs en cas de mauvaise foi[1].'], ['p', 'Exemple de calendrier pour un bail du 1er juillet 2026 au 30 juin 2027 : l’avis doit être reçu au plus tard le 31 décembre 2026; le locataire a un mois pour répondre; en cas de refus ou de silence, la demande au TAL est déposée dans le mois suivant.']]
    }],
    faq: [['Le locataire ne répond pas à l’avis : accepte-t-il?', 'Non. Son silence vaut refus (art. 1962 C.c.Q.). Le propriétaire doit s’adresser au TAL dans le mois.'], ['Le moratoire empêche-t-il la reprise pour ma fille?', 'Non. Il vise seulement les évictions pour subdivision, agrandissement ou changement d’affectation. La reprise reste possible, sous réserve de la protection des aînés.'], ['Combien coûte une éviction?', 'Les frais raisonnables de déménagement, plus un mois de loyer par année d’occupation, avec un minimum de 3 mois et un maximum de 24 mois (art. 1965 C.c.Q.).'], ['Puis-je relouer le logement après la reprise?', 'Pas sans l’autorisation du TAL (art. 1970 C.c.Q.).']],
    src: [['Code civil du Québec, art. 1957 à 1970', CCQ_FR, 'LégisQuébec'], ['Loi limitant le droit d’éviction des locateurs et renforçant la protection des locataires aînés (2024, chapitre 23)', 'https://www.tal.gouv.qc.ca/sites/default/files/PL65.pdf', 'Assemblée nationale du Québec'], ['Reprise de logement', 'https://www.tal.gouv.qc.ca/fr/droit-du-locateur-de-mettre-fin-au-bail/reprise-de-logement', 'Tribunal administratif du logement'], ['Éviction pour subdivision, agrandissement substantiel ou changement d’affectation', 'https://www.tal.gouv.qc.ca/fr/droit-du-locateur-de-mettre-fin-au-bail/eviction-pour-subdivision-agrandissement-substantiel-ou-changement-d-affection-d-un-logement', 'Tribunal administratif du logement'], ['La reprise du logement', 'https://educaloi.qc.ca/capsules/la-reprise-du-logement/', 'Éducaloi']],
    cleo: 'Cléo calcule la date limite de votre avis et vous explique la suite, 24/7.',
    cleoQ: 'Une reprise de logement',
    revision: REV_FR
  },
  en: {
    t: 'Repossession and eviction: rules, deadlines and moratorium',
    r: 'Who can repossess a dwelling, notice deadlines, the tenant’s answer, protection for seniors and the moratorium on evictions until 2027.',
    titre: 'Repossessing a Dwelling in Québec: Rules | Lease Lane',
    description: 'Repossession for yourself or a relative, 6-month notice, tenant silence, seniors 65 and over, the eviction moratorium: the rules in Québec, with articles cited.',
    requete: 'repossession of a dwelling Quebec',
    fil: 'Repossession',
    about: ['Repossession of a dwelling', 'Eviction', 'Administrative Housing Tribunal'],
    reponse: 'In Québec, a landlord can repossess a dwelling for themselves or a relative by giving written notice, **usually 6 months before the end of the lease**[1]. The tenant has one month to answer and **silence counts as a refusal**; the landlord must then apply to the TAL within one month[1][3]. Evictions to enlarge, subdivide or change the use of a dwelling are suspended **until June 6, 2027**[2].',
    sections: [{
      id: 'qui',
      h: 'Who can repossess a dwelling',
      blocs: [['p', 'The owner can repossess the dwelling to live in it, or to house their ascendants or descendants in the first degree, or another relative or person connected by marriage or civil union of whom they are the main support. They can also repossess it for a former spouse of whom they remain the main support[1].'], ['p', 'An undivided co-owner cannot repossess a dwelling, unless the other co-owner is their spouse and they are the only two owners[1].']]
    }, {
      id: 'avis',
      h: 'Notice deadlines',
      blocs: [['table', {
        cap: 'Notice deadlines for repossessing a dwelling by lease term',
        th: ['Lease term', 'Notice to give'],
        lignes: [['More than 6 months', 'At least 6 months before the end of the lease'], ['6 months or less', 'At least 1 month before the end of the lease'], ['Indeterminate term', 'At least 6 months before the repossession date']]
      }], ['p', 'The notice states the repossession date, the name of the beneficiary and their relationship to the owner. It must also **reproduce the text of article 1959.1** of the Civil Code, which protects certain seniors[1]. An incomplete or late notice exposes the repossession to a refusal by the tribunal.']]
    }, {
      id: 'reponse',
      h: 'The tenant’s answer and the application to the TAL',
      blocs: [['p', 'The tenant has **one month** after receiving the notice to answer. If they do not answer, they are deemed to have **refused** to leave the dwelling[1].'], ['p', 'If the tenant refuses, the landlord must apply to the TAL **within the following month**. They must show that they genuinely intend to repossess the dwelling for the stated purpose and that it is not a pretext[1][3].']]
    }, {
      id: 'aines',
      h: 'Protection for tenants aged 65 and over',
      blocs: [['p', 'The landlord can neither repossess nor evict when the tenant, or their spouse, meets **all three conditions** below[1][2]:'], ['ul', ['they are 65 or older;', 'they have lived in the dwelling for at least 10 years;', 'their income is equal to or below 125% of the maximum income threshold to qualify for low-rental housing.']], ['p', 'There are exceptions for repossession, notably when the owner or the beneficiary is also 65 or older[1]. Income thresholds are published by the Société d’habitation du Québec.']]
    }, {
      id: 'eviction',
      h: 'Eviction and the moratorium until 2027',
      blocs: [['p', '**Eviction** covers a different purpose: subdividing the dwelling, substantially enlarging it or changing its use. Bill 65, assented to on June 6, 2024, prohibits these evictions **until June 6, 2027**[2]. Repossession for yourself or a relative is not covered by the moratorium.'], ['p', 'The moratorium can end earlier if the [vacancy rate](/blogue/logement-vacant-cout) published by CMHC reaches 3%, after a notice in the Gazette officielle; the government can also exclude territories from the moratorium[2]. Check the status of the moratorium with the TAL before sending a notice.'], ['table', {
        cap: 'Comparison between repossession and eviction in Québec',
        th: ['', 'Repossession', 'Eviction'],
        lignes: [['Purpose', 'House the owner or a relative', 'Subdivide, enlarge or change the use'], ['Covered by the moratorium', 'No', 'Yes, until June 6, 2027'], ['Compensation', 'Moving costs, if the TAL orders it', 'Moving costs and 1 month’s rent per year of occupancy (3 to 24 months)'], ['Protection for 65 and over', 'Yes, with exceptions', 'Yes']]
      }], ['p', 'Eviction compensation includes reasonable moving costs and one month’s rent per year of uninterrupted tenancy, of at least 3 months and at most 24 months[1].']]
    }, {
      id: 'apres',
      h: 'After the repossession',
      blocs: [['p', 'A repossessed or vacated dwelling cannot be leased again or used for another purpose without the TAL’s authorization[1]. If the landlord does not act in good faith, the tenant can claim damages, and punitive damages in case of bad faith[1].'], ['p', 'Sample timeline for a lease from July 1, 2026 to June 30, 2027: the notice must be received no later than December 31, 2026; the tenant has one month to answer; if they refuse or stay silent, the application to the TAL is filed within the following month.']]
    }],
    faq: [['The tenant does not answer the notice: do they accept?', 'No. Their silence counts as a refusal (art. 1962 C.C.Q.). The landlord must apply to the TAL within one month.'], ['Does the moratorium prevent repossession for my daughter?', 'No. It only covers evictions for subdivision, enlargement or change of use. Repossession remains possible, subject to the protection for seniors.'], ['How much does an eviction cost?', 'Reasonable moving costs, plus one month’s rent per year of occupancy, with a minimum of 3 months and a maximum of 24 months (art. 1965 C.C.Q.).'], ['Can I lease the dwelling again after repossessing it?', 'Not without the TAL’s authorization (art. 1970 C.C.Q.).']],
    src: [['Civil Code of Québec, arts. 1957 to 1970', CCQ_EN, 'LégisQuébec'], ['An Act to limit the right of lessors to evict and to strengthen the protection of senior lessees (2024, chapter 23)', 'https://www.tal.gouv.qc.ca/sites/default/files/PL65.pdf', 'National Assembly of Québec'], ['Repossession of a dwelling', 'https://www.tal.gouv.qc.ca/fr/droit-du-locateur-de-mettre-fin-au-bail/reprise-de-logement', 'Administrative Housing Tribunal'], ['Eviction for subdivision, substantial enlargement or change of use', 'https://www.tal.gouv.qc.ca/fr/droit-du-locateur-de-mettre-fin-au-bail/eviction-pour-subdivision-agrandissement-substantiel-ou-changement-d-affection-d-un-logement', 'Administrative Housing Tribunal'], ['La reprise du logement', 'https://educaloi.qc.ca/capsules/la-reprise-du-logement/', 'Éducaloi']],
    cleo: 'Cléo works out your notice deadline and explains the next steps, 24/7.',
    cleoQ: 'Repossessing a dwelling',
    revision: REV_EN
  }
}, /* ——— 4. Loyer impayé ——— */
{
  slug: 'loyer-impaye',
  couv: {
    fr: "Calendrier mural et classeur de reçus de loyer sur un bureau",
    en: "Wall calendar and a binder of rent receipts on a desk"
  },
  slugEN: 'unpaid-rent-tal',
  cat: 'proprietaires',
  d: '2026-10-11',
  m: '2026-10-11',
  min: 7,
  aut: 'jt',
  fr: {
    t: 'Loyer impayé : quand et comment s’adresser au TAL',
    r: 'Retard simple, plus de trois semaines ou retards fréquents : les recours du propriétaire, les frais de 2026 et ce qu’il ne faut jamais faire.',
    titre: 'Loyer impayé au Québec : recours au TAL | Lease Lane',
    description: 'Loyer en retard dès le lendemain, résiliation après 3 semaines, frais de 92 $ en 2026 : les recours du propriétaire au TAL pour un loyer impayé, articles cités.',
    requete: 'loyer impayé TAL',
    fil: 'Loyer impayé',
    about: ['Loyer impayé', 'Résiliation de bail', 'Tribunal administratif du logement'],
    reponse: 'Au Québec, le loyer est **en retard dès le lendemain** de la date de paiement : le propriétaire peut alors réclamer les sommes dues au TAL[2]. Après **plus de trois semaines** de retard, il peut aussi demander la résiliation du bail[1]. Le locataire évite la résiliation s’il paie, avant le jugement, le loyer dû, les intérêts et les frais[1]. Les frais de la demande sont de 92 $ depuis le 1er avril 2026[3].',
    sections: [{
      id: 'retard',
      h: 'Quand le loyer est-il en retard?',
      blocs: [['p', 'Le locataire est en défaut dès le lendemain de la date prévue pour le paiement. Le propriétaire n’est pas tenu d’accepter un paiement partiel[2].'], ['p', 'Envoyez un rappel écrit dès le premier jour. Il date le début du défaut, ce qui compte si le dossier se rend au tribunal.']]
    }, {
      id: 'recours',
      h: 'Les trois situations et leurs recours',
      blocs: [['table', {
        cap: 'Recours du propriétaire selon la situation de retard de loyer',
        th: ['Situation', 'Recours possible', 'À prouver'],
        lignes: [['Retard, peu importe sa durée', 'Recouvrement du loyer, des intérêts et des frais', 'Le montant dû'], ['Retard de plus de trois semaines', 'Résiliation du bail et recouvrement', 'Le retard de plus de trois semaines'], ['Retards fréquents', 'Résiliation du bail', 'Les retards et un préjudice sérieux']]
      }], ['p', 'Pour un retard de plus de trois semaines, le TAL ne peut pas se contenter d’ordonner au locataire de payer à l’avenir au lieu de résilier[1]. Pour des retards fréquents, le propriétaire doit démontrer qu’ils lui causent un préjudice sérieux[1].']]
    }, {
      id: 'demande',
      h: 'Déposer la demande au TAL',
      blocs: [['ol', ['Remplissez la demande relative au non-paiement du loyer, en ligne ou sur le formulaire du TAL[4].', 'Payez les frais : **92 $** depuis le 1er avril 2026. Les prestataires de l’aide financière de dernier recours en sont exemptés[3].', 'Attendez que la demande soit **estampillée** par le TAL avant de la notifier au locataire[3].', 'Notifiez la demande au locataire, par courrier recommandé ou par huissier, et conservez la preuve.']], ['p', 'Les frais de notification peuvent être réclamés au locataire, selon les montants publiés par le TAL[3].']]
    }, {
      id: 'payer',
      h: 'Le locataire peut encore payer',
      blocs: [['p', 'Le locataire évite la résiliation s’il paie, **avant le jugement**, le loyer dû, les intérêts et les frais[1]. Le jour de l’audience, apportez un relevé à jour des sommes dues et des paiements reçus.'], ['p', 'Une entente de paiement écrite, signée par les deux parties, est souvent la voie la plus rapide pour récupérer l’argent sans audience.']]
    }, {
      id: 'interdits',
      h: 'Ce que le propriétaire ne peut jamais faire',
      blocs: [['ul', ['Changer la serrure sans le consentement du locataire[1].', 'Harceler le locataire pour le [pousser à partir](/blogue/reprise-de-logement)[1].', 'Couper un service, comme [le chauffage ou l’électricité](/blogue/urgences-locatives), pour forcer le paiement : le propriétaire doit procurer la jouissance paisible du logement pendant toute la durée du bail[1].', 'Exiger un dépôt ou plus d’un mois de loyer d’avance pour se protéger d’un prochain retard. Voir [le dépôt de garantie](/blogue/depot-de-garantie).']]]
    }, {
      id: 'apres',
      h: 'Après la décision',
      blocs: [['p', 'Une décision de résiliation s’exécute selon les règles publiées par le TAL[5]. Le locataire qui quitte reste responsable du loyer perdu jusqu’à la relocation, et le propriétaire doit chercher à [relouer](/blogue/logement-vacant-cout) pour limiter ses pertes.'], ['p', 'Chez Lease Lane, les loyers sont suivis chaque jour : le rappel part dès le lendemain de l’échéance, les ententes sont consignées et, au besoin, le dossier du TAL est préparé avec vous. Voir notre [gestion immobilière](/gestion-immobiliere).']]
    }],
    faq: [['Quand puis-je m’adresser au TAL?', 'Dès le lendemain de l’échéance pour réclamer le loyer. Après plus de trois semaines de retard, vous pouvez aussi demander la résiliation du bail (art. 1971 C.c.Q.).'], ['Puis-je changer les serrures?', 'Non. Il faut le consentement du locataire (art. 1934 C.c.Q.), et le harcèlement est interdit (art. 1902 C.c.Q.).'], ['Le locataire paie tout avant l’audience : qu’arrive-t-il?', 'S’il paie le loyer, les intérêts et les frais avant le jugement, la résiliation est évitée (art. 1883 C.c.Q.).'], ['Combien coûte la demande au TAL?', '92 $ depuis le 1er avril 2026 pour une demande relative au non-paiement du loyer, plus les frais de notification.']],
    src: [['Code civil du Québec, art. 1854, 1883, 1902, 1904, 1934, 1971 et 1973', CCQ_FR, 'LégisQuébec'], ['Paiement du loyer', 'https://www.tal.gouv.qc.ca/fr/etre-locataire/paiement-du-loyer', 'Tribunal administratif du logement'], ['Frais exigibles', 'https://www.tal.gouv.qc.ca/fr/depot-d-une-demande/frais-exigibles', 'Tribunal administratif du logement'], ['Demande relative au non-paiement de loyer', 'https://www.tal.gouv.qc.ca/fr/formulaires-de-demande-au-tribunal/demande-relative-au-non-paiement-de-loyer', 'Tribunal administratif du logement'], ['Exécution d’une décision', 'https://www.tal.gouv.qc.ca/fr/decision/execution-d-une-decision', 'Tribunal administratif du logement']],
    cleo: 'Cléo vous indique où en est le retard et quelle démarche s’applique, 24/7.',
    cleoQ: 'Un loyer impayé',
    revision: REV_FR
  },
  en: {
    t: 'Unpaid rent: when and how to apply to the TAL',
    r: 'Simple delay, more than three weeks or frequent delays: the landlord’s recourse, the 2026 fees and what you must never do.',
    titre: 'Unpaid Rent in Québec: Going to the TAL | Lease Lane',
    description: 'Rent is late the next day, termination after 3 weeks, a $92 fee in 2026: a landlord’s recourse at the TAL for unpaid rent in Québec, with articles cited.',
    requete: 'unpaid rent Quebec',
    fil: 'Unpaid rent',
    about: ['Unpaid rent', 'Lease termination', 'Administrative Housing Tribunal'],
    reponse: 'In Québec, rent is **late from the day after** the payment date: the landlord can then claim the amounts owed at the TAL[2]. After **more than three weeks** of delay, they can also ask for the lease to be terminated[1]. The tenant avoids termination by paying the rent owed, interest and costs before the judgment[1]. The application fee has been $92 since April 1, 2026[3].',
    sections: [{
      id: 'retard',
      h: 'When is rent late?',
      blocs: [['p', 'The tenant is in default from the day after the payment date. The landlord does not have to accept a partial payment[2].'], ['p', 'Send a written reminder on the first day. It dates the start of the default, which matters if the file goes to the tribunal.']]
    }, {
      id: 'recours',
      h: 'The three situations and their recourse',
      blocs: [['table', {
        cap: 'Landlord’s recourse depending on the rent delay situation',
        th: ['Situation', 'Possible recourse', 'To prove'],
        lignes: [['Late, regardless of how long', 'Recovery of rent, interest and costs', 'The amount owed'], ['More than three weeks late', 'Lease termination and recovery', 'The delay of more than three weeks'], ['Frequent delays', 'Lease termination', 'The delays and serious prejudice']]
      }], ['p', 'For a delay of more than three weeks, the TAL cannot simply order the tenant to pay on time in the future instead of terminating the lease[1]. For frequent delays, the landlord must show that they cause serious prejudice[1].']]
    }, {
      id: 'demande',
      h: 'Filing the application with the TAL',
      blocs: [['ol', ['Complete the application for non-payment of rent, online or on the TAL form[4].', 'Pay the fee: **$92** since April 1, 2026. Recipients of last-resort financial assistance are exempt[3].', 'Wait until the application is **stamped** by the TAL before serving it on the tenant[3].', 'Serve the application on the tenant, by registered mail or by bailiff, and keep the proof.']], ['p', 'Service costs can be claimed from the tenant, according to the amounts published by the TAL[3].']]
    }, {
      id: 'payer',
      h: 'The tenant can still pay',
      blocs: [['p', 'The tenant avoids termination by paying, **before the judgment**, the rent owed, interest and costs[1]. On the day of the hearing, bring an up-to-date statement of the amounts owed and payments received.'], ['p', 'A written payment agreement, signed by both parties, is often the fastest way to recover the money without a hearing.']]
    }, {
      id: 'interdits',
      h: 'What a landlord must never do',
      blocs: [['ul', ['Change the lock without the tenant’s consent[1].', 'Harass the tenant to [push them to leave](/blogue/reprise-de-logement)[1].', 'Cut off a service, such as [heat or electricity](/blogue/urgences-locatives), to force payment: the landlord must provide peaceable enjoyment of the dwelling for the whole term of the lease[1].', 'Require a deposit or more than one month’s rent in advance to protect against a future delay. See [security deposits](/blogue/depot-de-garantie).']]]
    }, {
      id: 'apres',
      h: 'After the decision',
      blocs: [['p', 'A termination decision is enforced according to the rules published by the TAL[5]. A tenant who leaves remains responsible for lost rent until the unit is rented again, and the landlord must try to [rent it again](/blogue/logement-vacant-cout) to limit their losses.'], ['p', 'At Lease Lane, rents are tracked daily: the reminder goes out the day after the due date, agreements are logged and, when needed, the TAL file is prepared with you. See our [property management](/gestion-immobiliere).']]
    }],
    faq: [['When can I apply to the TAL?', 'From the day after the due date to claim the rent. After more than three weeks of delay, you can also ask for the lease to be terminated (art. 1971 C.C.Q.).'], ['Can I change the locks?', 'No. The tenant’s consent is required (art. 1934 C.C.Q.), and harassment is prohibited (art. 1902 C.C.Q.).'], ['The tenant pays everything before the hearing: what happens?', 'If they pay the rent, interest and costs before the judgment, termination is avoided (art. 1883 C.C.Q.).'], ['How much does the TAL application cost?', '$92 since April 1, 2026 for an application for non-payment of rent, plus service costs.']],
    src: [['Civil Code of Québec, arts. 1854, 1883, 1902, 1904, 1934, 1971 and 1973', CCQ_EN, 'LégisQuébec'], ['Paiement du loyer (rent payment)', 'https://www.tal.gouv.qc.ca/fr/etre-locataire/paiement-du-loyer', 'Administrative Housing Tribunal'], ['Frais exigibles (fees)', 'https://www.tal.gouv.qc.ca/fr/depot-d-une-demande/frais-exigibles', 'Administrative Housing Tribunal'], ['Application for non-payment of rent', 'https://www.tal.gouv.qc.ca/fr/formulaires-de-demande-au-tribunal/demande-relative-au-non-paiement-de-loyer', 'Administrative Housing Tribunal'], ['Enforcement of a decision', 'https://www.tal.gouv.qc.ca/fr/decision/execution-d-une-decision', 'Administrative Housing Tribunal']],
    cleo: 'Cléo tells you where the delay stands and which step applies, 24/7.',
    cleoQ: 'Unpaid rent',
    revision: REV_EN
  }
}, /* ——— 5. Réparations urgentes ——— */
{
  slug: 'urgences-locatives',
  couv: {
    fr: "Plombier qui répare un tuyau sous l’évier d’une cuisine, en hiver",
    en: "Plumber repairing a pipe under a kitchen sink, in winter"
  },
  slugEN: 'urgent-repairs-rental',
  cat: 'locataires',
  d: '2026-10-11',
  m: '2026-10-11',
  min: 6,
  aut: 'cd',
  fr: {
    t: 'Fuite, chauffage, serrure : qu’est-ce qu’une réparation urgente?',
    r: 'Ce qui est urgent selon le TAL, qui agit et quand, la température minimale à Québec et les preuves à garder.',
    titre: 'Réparation urgente en logement : qui agit? | Lease Lane',
    description: 'Fuite d’eau, panne de chauffage, serrure brisée : ce qu’est une réparation urgente au Québec, les étapes pour le locataire et le propriétaire, articles cités.',
    requete: 'réparation urgente logement',
    fil: 'Réparations urgentes',
    about: ['Réparation urgente', 'Bail résidentiel au Québec', 'Tribunal administratif du logement'],
    reponse: 'Une réparation est urgente quand elle est nécessaire pour conserver le logement ou en garder l’usage : **fuite majeure, panne de chauffage l’hiver, serrure d’entrée brisée, égout bloqué**[2]. Le locataire avise d’abord le propriétaire. S’il est injoignable ou n’agit pas à temps, le locataire peut faire faire l’essentiel et se faire rembourser les dépenses raisonnables, sur preuve[1].',
    sections: [{
      id: 'definition',
      h: 'Ce qui est urgent, selon le TAL',
      blocs: [['p', 'Le Code civil permet au locataire d’agir lui-même quand une réparation est **urgente et nécessaire** pour assurer la conservation ou la jouissance du logement[1]. Le TAL donne des exemples[2] :'], ['ul', ['une fuite importante de la tuyauterie ou du toit;', 'une installation électrique défectueuse;', 'un égout bloqué;', 'une marche ou une planche de balcon pourrie qui cède;', 'une panne de chauffage l’hiver, ou le refus de remplir le réservoir de mazout;', 'une serrure défectueuse de la porte d’entrée.']], ['p', 'Le TAL qualifie ce recours de mesure d’exception, à utiliser avec prudence et bonne foi. La réparation doit se limiter à l’essentiel, de façon temporaire[2].']]
    }, {
      id: 'tableau',
      h: 'Urgent ou pas?',
      blocs: [['table', {
        cap: 'Exemples de situations et niveau d’urgence d’une réparation en logement',
        th: ['Situation', 'Urgent?', 'Qui agit'],
        lignes: [['Plus de chauffage en janvier', 'Oui', 'Le propriétaire, sans délai; à défaut, le locataire fait l’essentiel'], ['Dégât d’eau actif', 'Oui', 'Couper l’eau, aviser le propriétaire, limiter les dommages'], ['Serrure de la porte d’entrée brisée', 'Oui', 'Le propriétaire; une serrure ne se change pas sans l’accord des deux parties'], ['Robinet qui goutte', 'Non', 'Avis écrit au propriétaire'], ['Électroménager d’appoint en panne', 'Non', 'Avis écrit au propriétaire']]
      }]]
    }, {
      id: 'etapes',
      h: 'Les étapes pour le locataire',
      blocs: [['ol', ['**Aviser le propriétaire** dès que vous constatez le problème : le locataire doit l’informer dans un délai raisonnable de toute défectuosité importante[1].', '**Tenter de le joindre** et noter chaque tentative : date, heure, moyen utilisé.', '**S’il n’agit pas à temps**, faire faire la réparation essentielle, sans attendre l’autorisation du tribunal[1].', '**Garder les preuves** : photos, factures et pièces remplacées. Vous devez rendre compte au propriétaire et lui remettre les pièces justificatives[1].', '**Se faire rembourser** : à défaut de remboursement, vous pouvez retenir le montant des dépenses raisonnables sur le loyer[1][2].']], ['p', 'Le propriétaire peut intervenir à tout moment pour terminer lui-même les travaux[1].']]
    }, {
      id: 'chauffage',
      h: 'Le chauffage à Québec : 20 °C au minimum',
      blocs: [['p', 'À Québec, le système de chauffage doit permettre de maintenir **au moins 20 °C** dans le logement, mesurés au centre de la pièce à un mètre du sol. Les espaces contigus doivent rester à 15 °C ou plus, et le logement doit être alimenté en eau chaude et froide[3].'], ['note', 'Ces seuils viennent d’un règlement de la Ville de Québec. Ailleurs, dont à Lévis, vérifiez le règlement de votre municipalité.']]
    }, {
      id: 'acces',
      h: 'L’accès au logement en cas d’urgence',
      blocs: [['ul', ['Le propriétaire doit en principe donner un avis de 24 heures pour faire des travaux, **sauf en cas d’urgence**[1].', 'Le locataire peut refuser l’accès avant 7 h et après 19 h, **sauf pour des travaux urgents**[1].', 'Personne ne peut poser ou changer une serrure sans le consentement du propriétaire et du locataire[1].', 'Pour des réparations urgentes, le propriétaire peut exiger l’évacuation temporaire du logement; le locataire garde son droit à une diminution de loyer ou à une indemnité[1].']]]
    }, {
      id: 'non-urgent',
      h: 'Et si ce n’est pas urgent?',
      blocs: [['p', 'Envoyez un avis écrit au propriétaire. S’il ne fait pas la réparation, le locataire doit obtenir l’**autorisation du TAL** avant de faire les travaux lui-même[1]. Il peut aussi demander une diminution de loyer ou des dommages-intérêts.'], ['p', 'Retenir le loyer pour une réparation non urgente, sans autorisation, expose le locataire à un recours pour loyer impayé. Voir [le loyer impayé](/blogue/loyer-impaye).']]
    }, {
      id: 'lease-lane',
      h: 'Pour les immeubles gérés par Lease Lane',
      blocs: [['p', 'Les urgences sont prises en charge **24/7** : Cléo reçoit l’appel ou le message, qualifie l’urgence et joint le fournisseur de garde, puis l’équipe suit le dossier jusqu’à la fermeture. Les autres demandes passent par la [demande de travaux](/locataires) du portail, avec un suivi à chaque étape.']]
    }],
    faq: [['Le propriétaire peut-il entrer sans préavis?', 'Oui, en cas d’urgence (art. 1931 C.c.Q.). Pour des travaux urgents, il peut même entrer avant 7 h ou après 19 h (art. 1933 C.c.Q.).'], ['Puis-je déduire la facture de mon loyer?', 'Oui, pour une réparation urgente et nécessaire, si le propriétaire ne vous rembourse pas, à condition que les dépenses soient raisonnables et appuyées de pièces justificatives (art. 1868 et 1869 C.c.Q.).'], ['Quelle est la température minimale à Québec?', '20 °C dans le logement, selon le règlement R.V.Q. 3021 de la Ville de Québec.'], ['Et si la réparation n’est pas urgente?', 'Envoyez un avis écrit. Ensuite, le TAL peut vous autoriser à faire les travaux, diminuer le loyer ou accorder des dommages-intérêts (art. 1863 et 1867 C.c.Q.).']],
    src: [['Code civil du Québec, art. 1863 à 1869, 1910 à 1913 et 1931 à 1934', CCQ_FR, 'LégisQuébec'], ['Réparations urgentes et nécessaires', 'https://www.tal.gouv.qc.ca/fr/le-logement/reparations-urgentes-et-necessaires', 'Tribunal administratif du logement'], ['Règlement sur l’occupation et l’entretien des bâtiments, R.V.Q. 3021, art. 7 et 8', 'https://reglements.ville.quebec.qc.ca/fr/showdoc/cr/R.V.Q.3021//20240220', 'Ville de Québec'], ['Accès au logement et visite', 'https://www.tal.gouv.qc.ca/fr/le-logement/acces-au-logement-et-visite', 'Tribunal administratif du logement'], ['Logement en mauvais état : les recours', 'https://educaloi.qc.ca/capsules/logement-en-mauvais-etat-les-recours/', 'Éducaloi']],
    cleo: 'Cléo qualifie l’urgence et joint le fournisseur de garde, 24/7, pour les immeubles que nous gérons.',
    cleoQ: 'Une réparation urgente',
    revision: REV_FR
  },
  en: {
    t: 'Leak, heating, lock: what counts as an urgent repair?',
    r: 'What is urgent according to the TAL, who acts and when, the minimum temperature in Québec City and the evidence to keep.',
    titre: 'Urgent Repairs in a Rental: Who Acts? | Lease Lane',
    description: 'Water leak, no heat, broken lock: what an urgent repair is in Québec, the steps for tenants and landlords, and the articles of the Civil Code that apply.',
    requete: 'urgent repairs rental Quebec',
    fil: 'Urgent repairs',
    about: ['Urgent repair', 'Residential lease in Québec', 'Administrative Housing Tribunal'],
    reponse: 'A repair is urgent when it is needed to preserve the dwelling or keep using it: **a major leak, no heat in winter, a broken entrance lock, a blocked sewer**[2]. The tenant first notifies the landlord. If the landlord cannot be reached or does not act in time, the tenant can have the essential work done and be reimbursed for reasonable expenses, with proof[1].',
    sections: [{
      id: 'definition',
      h: 'What is urgent, according to the TAL',
      blocs: [['p', 'The Civil Code allows the tenant to act themselves when a repair is **urgent and necessary** to preserve the dwelling or keep using it[1]. The TAL gives examples[2]:'], ['ul', ['a major leak in the plumbing or the roof;', 'faulty electrical wiring;', 'a blocked sewer;', 'a rotten step or balcony board that gives way;', 'no heat in winter, or a refusal to fill the oil tank;', 'a defective lock on the entrance door.']], ['p', 'The TAL describes this recourse as an exceptional measure, to be used with caution and good faith. The repair must be limited to what is essential, on a temporary basis[2].']]
    }, {
      id: 'tableau',
      h: 'Urgent or not?',
      blocs: [['table', {
        cap: 'Examples of situations and urgency level of a repair in a rental unit',
        th: ['Situation', 'Urgent?', 'Who acts'],
        lignes: [['No heat in January', 'Yes', 'The landlord, without delay; otherwise, the tenant has the essential work done'], ['Active water damage', 'Yes', 'Shut off the water, notify the landlord, limit the damage'], ['Broken entrance door lock', 'Yes', 'The landlord; a lock cannot be changed without both parties’ consent'], ['Dripping faucet', 'No', 'Written notice to the landlord'], ['Secondary appliance out of order', 'No', 'Written notice to the landlord']]
      }]]
    }, {
      id: 'etapes',
      h: 'Steps for the tenant',
      blocs: [['ol', ['**Notify the landlord** as soon as you notice the problem: the tenant must inform them within a reasonable time of any substantial defect[1].', '**Try to reach them** and note each attempt: date, time, method used.', '**If they do not act in time**, have the essential repair done, without waiting for the tribunal’s authorization[1].', '**Keep the evidence**: photos, invoices and replaced parts. You must account to the landlord and give them the supporting documents[1].', '**Get reimbursed**: if you are not reimbursed, you can withhold the amount of reasonable expenses from the rent[1][2].']], ['p', 'The landlord can step in at any time to finish the work themselves[1].']]
    }, {
      id: 'chauffage',
      h: 'Heating in Québec City: 20 °C minimum',
      blocs: [['p', 'In Québec City, the heating system must be able to maintain **at least 20 °C** in the dwelling, measured in the centre of the room one metre above the floor. Adjoining spaces must stay at 15 °C or more, and the dwelling must be supplied with hot and cold water[3].'], ['note', 'These thresholds come from a Ville de Québec by-law. Elsewhere, including Lévis, check your municipality’s by-law.']]
    }, {
      id: 'acces',
      h: 'Access to the dwelling in an emergency',
      blocs: [['ul', ['The landlord must normally give 24 hours’ notice to carry out work, **except in an emergency**[1].', 'The tenant can refuse access before 7 a.m. and after 7 p.m., **except for urgent work**[1].', 'No one can install or change a lock without the consent of both the landlord and the tenant[1].', 'For urgent repairs, the landlord can require the tenant to leave the dwelling temporarily; the tenant keeps the right to a rent reduction or compensation[1].']]]
    }, {
      id: 'non-urgent',
      h: 'And if it is not urgent?',
      blocs: [['p', 'Send written notice to the landlord. If they do not make the repair, the tenant must obtain the **TAL’s authorization** before doing the work themselves[1]. They can also ask for a rent reduction or damages.'], ['p', 'Withholding rent for a non-urgent repair without authorization exposes the tenant to a claim for unpaid rent. See [unpaid rent](/blogue/loyer-impaye).']]
    }, {
      id: 'lease-lane',
      h: 'For buildings managed by Lease Lane',
      blocs: [['p', 'Emergencies are handled **24/7**: Cléo receives the call or message, qualifies the emergency and reaches the on-call supplier, then the team follows the file until it is closed. Other requests go through the [maintenance request](/locataires) in the portal, with updates at every step.']]
    }],
    faq: [['Can the landlord enter without notice?', 'Yes, in an emergency (art. 1931 C.C.Q.). For urgent work, they can even enter before 7 a.m. or after 7 p.m. (art. 1933 C.C.Q.).'], ['Can I deduct the invoice from my rent?', 'Yes, for an urgent and necessary repair, if the landlord does not reimburse you, as long as the expenses are reasonable and supported by receipts (arts. 1868 and 1869 C.C.Q.).'], ['What is the minimum temperature in Québec City?', '20 °C in the dwelling, under Ville de Québec by-law R.V.Q. 3021.'], ['And if the repair is not urgent?', 'Send written notice. The TAL can then authorize you to do the work, reduce the rent or award damages (arts. 1863 and 1867 C.C.Q.).']],
    src: [['Civil Code of Québec, arts. 1863 to 1869, 1910 to 1913 and 1931 to 1934', CCQ_EN, 'LégisQuébec'], ['Urgent and necessary repairs', 'https://www.tal.gouv.qc.ca/fr/le-logement/reparations-urgentes-et-necessaires', 'Administrative Housing Tribunal'], ['By-law on the occupancy and maintenance of buildings, R.V.Q. 3021, ss. 7 and 8', 'https://reglements.ville.quebec.qc.ca/fr/showdoc/cr/R.V.Q.3021//20240220', 'Ville de Québec'], ['Access to the dwelling and visits', 'https://www.tal.gouv.qc.ca/fr/le-logement/acces-au-logement-et-visite', 'Administrative Housing Tribunal'], ['Logement en mauvais état : les recours', 'https://educaloi.qc.ca/capsules/logement-en-mauvais-etat-les-recours/', 'Éducaloi']],
    cleo: 'Cléo qualifies the emergency and reaches the on-call supplier, 24/7, for the buildings we manage.',
    cleoQ: 'An urgent repair',
    revision: REV_EN
  }
}, /* ——— 6. Coût d'un logement vacant ——— */
{
  slug: 'logement-vacant-cout',
  couv: {
    fr: "Salon d’un appartement vide et lumineux à Québec",
    en: "Bright, empty apartment living room in Québec City"
  },
  slugEN: 'vacant-unit-cost',
  cat: 'proprietaires',
  d: '2026-10-11',
  m: '2026-10-11',
  min: 6,
  aut: 'cd',
  fr: {
    t: 'Combien coûte vraiment un logement vacant?',
    r: 'Le calcul jour par jour avec les chiffres de la SCHL pour la région de Québec, et les leviers qui raccourcissent la période de location.',
    titre: 'Coût d’un logement vacant à Québec : le calcul | Lease Lane',
    description: 'Taux d’inoccupation de 2,4 % et loyer moyen de 1 277 $ (SCHL 2025) : combien coûte chaque jour de vacance à Québec et comment louer plus vite, légalement.',
    requete: 'coût logement vacant',
    fil: 'Coût d’un logement vacant',
    about: ['Logement vacant', 'Taux d’inoccupation', 'Marché locatif de Québec'],
    reponse: 'Un logement vacant coûte environ **le loyer mensuel divisé par 30,4, multiplié par le nombre de jours vides**, plus les frais que le propriétaire paie pendant la vacance : chauffage, électricité, publicité, nettoyage. Avec le loyer moyen d’un logement de deux chambres dans la région de Québec, 1 277 $ selon la SCHL[1], chaque jour vide coûte environ **42 $** en loyer perdu.',
    sections: [{
      id: 'calcul',
      h: 'Le calcul, jour par jour',
      blocs: [['p', 'La formule : **loyer mensuel ÷ 30,4 × jours vacants**, plus les frais assumés par le propriétaire pendant la vacance. Le chiffre 30,4 est le nombre moyen de jours dans un mois.'], ['p', 'Un mois vide représente **8,3 % des revenus bruts annuels** du logement (un mois sur douze), sans compter les frais.']]
    }, {
      id: 'marche',
      h: 'Le marché locatif de Québec en chiffres',
      blocs: [['ul', ['Taux d’inoccupation de la région métropolitaine de Québec en octobre 2025 : **2,4 %**[1].', 'Loyer moyen d’un logement de deux chambres : **1 277 $**, en hausse de 6,1 %[1].', 'Hausse d’environ 10 % pour les logements qui [ont changé de locataire](/blogue/hausse-de-loyer-2026)[1].', 'Ville de Québec seulement : 2,2 % d’inoccupation en 2025; la Ville situe l’équilibre autour de 3 %[2].']], ['p', 'La hausse du taux d’inoccupation touche surtout certains secteurs, dont la Rive-Sud, et les logements neufs[1]. Un logement bien situé et au bon prix se loue encore vite; un logement mal présenté ou trop cher reste vide plus longtemps qu’en 2024.']]
    }, {
      id: 'exemple',
      h: 'Un exemple chiffré',
      blocs: [['p', 'Exemple établi avec le loyer moyen d’un deux chambres (1 277 $), soit 42 $ par jour. Les frais de 150 $ par mois (chauffage, électricité, publicité) sont une **hypothèse illustrative**, à remplacer par vos chiffres.'], ['table', {
        cap: 'Coût estimé d’un logement vacant selon la durée de la vacance (exemple)',
        th: ['Jours vacants', 'Loyer perdu', 'Frais (hypothèse)', 'Total'],
        lignes: [['15 jours', '630 $', '75 $', '705 $'], ['30 jours', '1 260 $', '150 $', '1 410 $'], ['60 jours', '2 521 $', '300 $', '2 821 $']]
      }], ['p', 'À comparer : baisser le loyer de 25 $ par mois pour louer 30 jours plus tôt coûte 300 $ sur un an, contre environ 1 410 $ pour un mois vide.']]
    }, {
      id: 'leviers',
      h: 'Les leviers qui raccourcissent la vacance',
      blocs: [['ul', ['**Un prix au marché** dès la mise en ligne : un loyer trop élevé se corrige souvent après plusieurs semaines perdues.', '**Des visites pendant le préavis** : dès que le locataire sortant a avisé qu’il ne renouvelle pas, il doit permettre les visites et l’affichage entre 9 h et 21 h. Pour une visite à un futur locataire, le propriétaire n’a pas à donner de préavis de 24 heures[3].', '**Une réponse rapide** à chaque demande : un locataire potentiel sans réponse le jour même peut visiter ailleurs.', '**De bonnes photos** et une fiche complète : inclusions, services, stationnement, animaux.', '**Le bon moment** : au Québec, beaucoup de baux se terminent le 30 juin; planifier la relocation dès l’hiver évite de rater la saison.']], ['p', 'Chez Lease Lane, Cléo répond aux locataires potentiels 24/7 et réserve les visites selon vos plages ouvertes. Voir notre [service de location](/gestion-immobiliere/location).']]
    }, {
      id: 'choix',
      h: 'Louer vite, mais légalement',
      blocs: [['p', 'Pour remplir un logement rapidement, on peut être tenté de filtrer les candidats. Plusieurs critères sont pourtant interdits :'], ['ul', ['refuser une personne parce qu’elle est enceinte ou a des enfants, sauf si les dimensions du logement le justifient[3];', 'refuser une personne parce qu’elle reçoit de l’aide sociale : c’est de la discrimination fondée sur la condition sociale[4];', 'appliquer un ratio loyer/revenu rigide, qui peut constituer de la discrimination indirecte selon la Commission des droits de la personne[4].']], ['p', 'Les références d’anciens propriétaires et les preuves de paiement du loyer sont des moyens acceptables de vérifier un dossier[4]. Voir [l’enquête de prélocation](/blogue/enquete-prelocation).']]
    }],
    faq: [['Quel est le taux d’inoccupation à Québec?', '2,4 % dans la région métropolitaine de Québec en octobre 2025, selon la SCHL. C’est encore sous le seuil d’équilibre d’environ 3 %.'], ['Combien coûte un mois vide?', 'Environ un douzième des revenus bruts annuels du logement, soit 8,3 %, plus les frais courants comme le chauffage et l’électricité.'], ['Puis-je refuser une famille avec enfants?', 'Non, sauf si les dimensions du logement le justifient (art. 1899 C.c.Q.).'], ['Le locataire sortant doit-il accepter les visites?', 'Oui, dès son avis de non-renouvellement, entre 9 h et 21 h. Le propriétaire n’a pas à donner de préavis de 24 heures pour une visite à un futur locataire (art. 1930 à 1932 C.c.Q.).']],
    src: [['Rapport sur le marché locatif 2025', 'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres', 'Société canadienne d’hypothèques et de logement'], ['Données sur l’habitation', 'https://www.ville.quebec.qc.ca/apropos/planification-orientations/habitation/donnees/index.aspx', 'Ville de Québec'], ['Code civil du Québec, art. 1899 et 1930 à 1932', CCQ_FR, 'LégisQuébec'], ['Vos droits dans le logement', 'https://www.cdpdj.qc.ca/fr/vos-droits/droits/dans-le-logement', 'Commission des droits de la personne et des droits de la jeunesse']],
    cleo: 'Cléo estime ce que coûte la vacance de votre logement et vous propose les prochaines étapes, 24/7.',
    cleoQ: 'Un logement vacant',
    revision: REV_FR,
    avert: 'Cet article fournit de l’information générale, à jour à la date indiquée. Les chiffres du marché proviennent de la SCHL et de la Ville de Québec; l’exemple chiffré est illustratif. Il ne constitue pas un avis juridique ou financier.'
  },
  en: {
    t: 'What does a vacant unit really cost?',
    r: 'The day-by-day calculation with CMHC figures for the Québec City area, and the levers that shorten the leasing period.',
    titre: 'Cost of a Vacant Unit in Québec City | Lease Lane',
    description: 'A 2.4% vacancy rate and a $1,277 average rent (CMHC 2025): what each day of vacancy costs in Québec City and how to rent faster, legally.',
    requete: 'cost of vacancy rental Quebec City',
    fil: 'Cost of a vacant unit',
    about: ['Vacant rental unit', 'Vacancy rate', 'Québec City rental market'],
    reponse: 'A vacant unit costs roughly **the monthly rent divided by 30.4, multiplied by the number of empty days**, plus the costs the owner pays during the vacancy: heating, electricity, advertising, cleaning. With the average rent of a two-bedroom unit in the Québec City area, $1,277 according to CMHC[1], each empty day costs about **$42** in lost rent.',
    sections: [{
      id: 'calcul',
      h: 'The calculation, day by day',
      blocs: [['p', 'The formula: **monthly rent ÷ 30.4 × vacant days**, plus the costs the owner pays during the vacancy. The number 30.4 is the average number of days in a month.'], ['p', 'One empty month represents **8.3% of the unit’s gross annual income** (one month out of twelve), not counting costs.']]
    }, {
      id: 'marche',
      h: 'The Québec City rental market in numbers',
      blocs: [['ul', ['Vacancy rate in the Québec census metropolitan area in October 2025: **2.4%**[1].', 'Average rent for a two-bedroom unit: **$1,277**, up 6.1%[1].', 'An increase of about 10% for units that [changed tenants](/blogue/hausse-de-loyer-2026)[1].', 'City of Québec only: 2.2% vacancy in 2025; the City places equilibrium around 3%[2].']], ['p', 'The rise in the vacancy rate mainly affects certain areas, including the South Shore, and new units[1]. A well-located unit at the right price still rents quickly; a poorly presented or overpriced unit stays empty longer than in 2024.']]
    }, {
      id: 'exemple',
      h: 'A worked example',
      blocs: [['p', 'Example based on the average rent of a two-bedroom unit ($1,277), or $42 per day. The $150 per month in costs (heating, electricity, advertising) is an **illustrative assumption**, to be replaced with your own figures.'], ['table', {
        cap: 'Estimated cost of a vacant unit by length of vacancy (example)',
        th: ['Vacant days', 'Lost rent', 'Costs (assumption)', 'Total'],
        lignes: [['15 days', '$630', '$75', '$705'], ['30 days', '$1,260', '$150', '$1,410'], ['60 days', '$2,521', '$300', '$2,821']]
      }], ['p', 'For comparison: lowering the rent by $25 per month to rent 30 days sooner costs $300 over a year, versus about $1,410 for one empty month.']]
    }, {
      id: 'leviers',
      h: 'The levers that shorten vacancy',
      blocs: [['ul', ['**A market price** from the day the listing goes live: an overpriced rent is often corrected only after several lost weeks.', '**Viewings during the notice period**: once the outgoing tenant has said they will not renew, they must allow viewings and signs between 9 a.m. and 9 p.m. For a viewing by a prospective tenant, the landlord does not need to give 24 hours’ notice[3].', '**A quick reply** to every inquiry: a prospective tenant who gets no answer the same day may visit elsewhere.', '**Good photos** and a complete listing: inclusions, services, parking, pets.', '**The right timing**: in Québec, many leases end on June 30; planning the re-leasing in winter avoids missing the season.']], ['p', 'At Lease Lane, Cléo answers prospects 24/7 and books viewings within your open time slots. See our [leasing service](/gestion-immobiliere/location).']]
    }, {
      id: 'choix',
      h: 'Rent fast, but legally',
      blocs: [['p', 'To fill a unit quickly, it can be tempting to screen applicants out. Several criteria are, however, prohibited:'], ['ul', ['refusing a person because she is pregnant or has children, unless the size of the dwelling justifies it[3];', 'refusing a person because they receive social assistance: this is discrimination based on social condition[4];', 'applying a rigid rent-to-income ratio, which can amount to indirect discrimination according to the human rights commission[4].']], ['p', 'References from previous landlords and proof of rent payment are acceptable ways to check an application[4]. See [tenant screening](/blogue/enquete-prelocation).']]
    }],
    faq: [['What is the vacancy rate in Québec City?', '2.4% in the Québec census metropolitan area in October 2025, according to CMHC. It is still below the equilibrium threshold of about 3%.'], ['How much does an empty month cost?', 'About one twelfth of the unit’s gross annual income, or 8.3%, plus running costs such as heating and electricity.'], ['Can I refuse a family with children?', 'No, unless the size of the dwelling justifies it (art. 1899 C.C.Q.).'], ['Does the outgoing tenant have to accept viewings?', 'Yes, from their notice of non-renewal, between 9 a.m. and 9 p.m. The landlord does not need to give 24 hours’ notice for a viewing by a prospective tenant (arts. 1930 to 1932 C.C.Q.).']],
    src: [['Rental Market Report 2025', 'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres', 'Canada Mortgage and Housing Corporation'], ['Données sur l’habitation (housing data)', 'https://www.ville.quebec.qc.ca/apropos/planification-orientations/habitation/donnees/index.aspx', 'Ville de Québec'], ['Civil Code of Québec, arts. 1899 and 1930 to 1932', CCQ_EN, 'LégisQuébec'], ['Vos droits dans le logement (your housing rights)', 'https://www.cdpdj.qc.ca/fr/vos-droits/droits/dans-le-logement', 'Commission des droits de la personne et des droits de la jeunesse']],
    cleo: 'Cléo estimates what your vacancy costs and suggests the next steps, 24/7.',
    cleoQ: 'A vacant unit',
    revision: REV_EN,
    avert: 'This article provides general information, up to date as of the date shown. Market figures come from CMHC and the Ville de Québec; the worked example is illustrative. It is not legal or financial advice.'
  }
}, /* ——— 7. Frais de gestion immobilière ——— */
{
  slug: 'frais-gestion-immobiliere-quebec',
  couv: {
    fr: "Tablette avec un graphique et maquette de triplex sur un bureau, vue sur le Château Frontenac",
    en: "Tablet with a chart and a triplex model on a desk, view of the Château Frontenac"
  },
  slugEN: 'property-management-fees-quebec-city',
  cat: 'proprietaires',
  d: '2026-10-11',
  m: '2026-10-11',
  min: 7,
  aut: 'cd',
  fr: {
    t: 'Frais de gestion immobilière à Québec : combien ça coûte?',
    r: 'Les modes de facturation observés au Québec, les fourchettes publiées, la déduction fiscale et les questions à poser avant de signer.',
    titre: 'Frais de gestion immobilière à Québec : prix | Lease Lane',
    description: 'Pourcentage des loyers, mise en location, frais du TAL, déduction fiscale : combien coûte un gestionnaire immobilier à Québec et Lévis, et comment comparer.',
    requete: 'frais de gestion immobilière Québec',
    fil: 'Frais de gestion immobilière',
    about: ['Frais de gestion immobilière', 'Gestionnaire immobilier', 'Québec et Lévis'],
    reponse: 'À Québec, les gestionnaires facturent le plus souvent **un pourcentage des loyers perçus**. Les firmes québécoises publient des fourchettes d’environ **4 % à 11 %** selon le type d’immeuble et l’étendue du service[1][2][3], plus des frais de mise en location qui vont souvent de 50 % à 100 % d’un mois de loyer[1][2]. Ces honoraires sont déductibles du revenu de location[4].',
    sections: [{
      id: 'modeles',
      h: 'Les modes de facturation',
      blocs: [['table', {
        cap: 'Modes de facturation de la gestion immobilière observés au Québec, selon des firmes québécoises',
        th: ['Poste', 'Mode de facturation', 'Fourchette publiée'],
        lignes: [['Gestion courante', 'Pourcentage des loyers perçus', 'Environ 4 % à 7 % chez une firme[1]; 5 % à 10 % du revenu brut chez une autre, 4 % à 6 % pour les multilogements[2]; 5 % à 10 % en résidentiel chez une troisième[3]'], ['Mise en location d’un logement', 'Pourcentage d’un mois de loyer', '50 % à 100 % du premier mois[1][2]'], ['Maison ou condo', 'Forfait mensuel', '100 $ à 200 $ par mois chez une firme[2]'], ['Dossier au TAL', 'Forfait par dossier', '150 $ à 300 $ chez une firme[2]'], ['Supervision de travaux', 'Pourcentage du coût des travaux', '10 % à 15 % chez une firme[2]']]
      }], ['note', 'Ces fourchettes sont celles que des firmes publient sur leur site; elles varient selon l’immeuble, le nombre de logements et ce qui est inclus. Elles ne constituent pas un prix garanti.']]
    }, {
      id: 'base',
      h: 'Loyers perçus ou loyers facturés?',
      blocs: [['p', 'Vérifiez la base de calcul. Un pourcentage des **loyers perçus** ne coûte rien pendant une [vacance](/blogue/logement-vacant-cout) ou un [retard](/blogue/loyer-impaye); un pourcentage des loyers **facturés** se paie même quand l’argent n’entre pas. Plusieurs firmes facturant au pourcentage ne facturent rien sur un logement vacant[2][3], mais c’est une pratique de firme : lisez le contrat.']]
    }, {
      id: 'inclus',
      h: 'Ce qui devrait être inclus',
      blocs: [['ul', ['la perception des loyers et le suivi des retards;', 'les communications avec les locataires et la réception des demandes;', 'la coordination de l’entretien courant et des [urgences](/blogue/urgences-locatives);', 'le renouvellement des baux et les [avis dans les délais](/blogue/hausse-de-loyer-2026);', 'un rapport mensuel des revenus, dépenses et demandes ouvertes;', 'l’accès aux documents : baux, factures, historique.']], ['p', 'Ce qui est souvent facturé en plus : la mise en location, les dossiers au TAL, la supervision de travaux majeurs et les frais d’ouverture de dossier.']]
    }, {
      id: 'comparer',
      h: 'Comparer deux soumissions',
      blocs: [['ol', ['La base de calcul : loyers perçus ou facturés?', 'Les frais pendant une vacance.', 'La durée du contrat, le préavis et les conditions de résiliation.', 'La fréquence et le contenu de la reddition de comptes.', 'Le compte où sont déposés les loyers : séparé ou en fidéicommis?', 'Le délai de réponse aux urgences, la nuit et la fin de semaine.', 'Les frais accessoires et les taxes en sus.']], ['p', 'Une soumission moins chère en pourcentage peut coûter plus cher au total une fois les frais accessoires ajoutés. Demandez un exemple chiffré sur votre immeuble.']]
    }, {
      id: 'impot',
      h: 'Des frais déductibles',
      blocs: [['p', 'Les sommes payées à une personne ou à une entreprise pour gérer votre immeuble sont déductibles comme **frais de gestion et d’administration** de votre revenu de location (formulaire T776 au fédéral)[4]. Au Québec, les revenus et dépenses de location se déclarent sur le formulaire TP-128[5].'], ['p', 'Le coût net de la gestion est donc plus bas que le pourcentage affiché. Validez votre situation avec votre comptable.']]
    }, {
      id: 'piege',
      h: 'Le 3,5 % du TAL n’est pas un tarif',
      blocs: [['p', 'Le TAL utilise un pourcentage de « frais de gestion » dans ses paramètres de calcul des loyers. C’est un paramètre réglementaire, **pas un tarif du marché** : il ne dit rien du prix d’un gestionnaire.']]
    }, {
      id: 'lease-lane',
      h: 'Chez Lease Lane',
      blocs: [['p', 'Notre offre est établie selon votre immeuble : nombre de logements, état, services voulus. Elle inclut Cléo, l’agent IA qui répond à vos locataires 24/7, et un rapport mensuel que vous voyez en ligne. [Demandez votre offre de service](/offre-de-service) ou voyez comment se passe un [changement de gestionnaire](/changer-de-gestionnaire).']]
    }],
    faq: [['Quel pourcentage est courant à Québec?', 'Les fourchettes publiées par des firmes québécoises vont d’environ 4 % à 11 % des loyers perçus, selon l’immeuble et le service.'], ['Paie-t-on des frais de gestion pendant une vacance?', 'Plusieurs firmes facturant au pourcentage des loyers perçus ne facturent rien sur un logement vacant. Vérifiez la base de calcul dans le contrat.'], ['Les frais de gestion sont-ils déductibles?', 'Oui, comme frais de gestion et d’administration du revenu de location (T776 au fédéral; TP-128 au Québec).'], ['Combien coûte la mise en location d’un logement?', 'Les firmes publient le plus souvent de 50 % à 100 % du premier mois de loyer.']],
    src: [['Combien coûte un gestionnaire immobilier?', 'https://summumpm.com/blog/combien-coute-un-gestionnaire-immobilier/', 'Summum PM'], ['Combien coûte une gestion immobilière au Québec?', 'https://www.marcelpinardgestionimmobiliere.com/blogue/2768935_combien-coute-une-gestion-immobiliere-au-quebec', 'Marcel Pinard Gestion immobilière'], ['Tarifs de gestion immobilière', 'https://locationajax.ca/tarif-gestion-immobiliere/', 'Location Ajax'], ['Guide T4036, Revenus de location', 'https://www.canada.ca/fr/agence-revenu/services/formulaires-publications/publications/t4036/revenus-location.html', 'Agence du revenu du Canada'], ['TP-128, Revenus et dépenses de location d’un immeuble', 'https://www.revenuquebec.ca/fr/services-en-ligne/formulaires-et-publications/details-courant/tp-128/', 'Revenu Québec']],
    cleo: 'Cléo répond à vos questions sur notre offre et prépare votre demande de soumission, 24/7.',
    cleoQ: 'Les frais de gestion',
    revision: REV_FR,
    avert: 'Cet article fournit de l’information générale, à jour à la date indiquée. Les fourchettes citées sont celles publiées par des firmes; elles ne constituent pas une offre. Il ne constitue pas un avis fiscal ou financier.'
  },
  en: {
    t: 'Property management fees in Québec City: what does it cost?',
    r: 'The billing methods seen in Québec, the published ranges, the tax deduction and the questions to ask before signing.',
    titre: 'Property Management Fees in Québec City | Lease Lane',
    description: 'Percentage of rents, leasing fees, TAL files, tax deduction: what a property manager costs in Québec City and Lévis, and how to compare offers.',
    requete: 'property management fees Quebec City',
    fil: 'Property management fees',
    about: ['Property management fees', 'Property manager', 'Québec City and Lévis'],
    reponse: 'In Québec City, managers most often charge **a percentage of rents collected**. Québec firms publish ranges of about **4% to 11%** depending on the type of building and the scope of service[1][2][3], plus leasing fees that often range from 50% to 100% of one month’s rent[1][2]. These fees are deductible from rental income[4].',
    sections: [{
      id: 'modeles',
      h: 'Billing methods',
      blocs: [['table', {
        cap: 'Property management billing methods observed in Québec, according to Québec firms',
        th: ['Item', 'Billing method', 'Published range'],
        lignes: [['Ongoing management', 'Percentage of rents collected', 'About 4% to 7% at one firm[1]; 5% to 10% of gross income at another, 4% to 6% for multi-unit buildings[2]; 5% to 10% for residential at a third[3]'], ['Leasing a unit', 'Percentage of one month’s rent', '50% to 100% of the first month[1][2]'], ['House or condo', 'Monthly flat fee', '$100 to $200 per month at one firm[2]'], ['TAL file', 'Flat fee per file', '$150 to $300 at one firm[2]'], ['Work supervision', 'Percentage of the cost of work', '10% to 15% at one firm[2]']]
      }], ['note', 'These ranges are the ones firms publish on their websites; they vary by building, number of units and what is included. They are not a guaranteed price.']]
    }, {
      id: 'base',
      h: 'Rents collected or rents billed?',
      blocs: [['p', 'Check the basis of calculation. A percentage of **rents collected** costs nothing during a [vacancy](/blogue/logement-vacant-cout) or a [late payment](/blogue/loyer-impaye); a percentage of rents **billed** is paid even when no money comes in. Several firms that charge a percentage do not charge anything on a vacant unit[2][3], but this is a firm practice: read the contract.']]
    }, {
      id: 'inclus',
      h: 'What should be included',
      blocs: [['ul', ['rent collection and follow-up on late payments;', 'communications with tenants and intake of requests;', 'coordination of routine maintenance and [emergencies](/blogue/urgences-locatives);', 'lease renewals and [notices sent on time](/blogue/hausse-de-loyer-2026);', 'a monthly report of income, expenses and open requests;', 'access to documents: leases, invoices, history.']], ['p', 'What is often billed separately: leasing, TAL files, supervision of major work and file opening fees.']]
    }, {
      id: 'comparer',
      h: 'Comparing two quotes',
      blocs: [['ol', ['The basis of calculation: rents collected or billed?', 'Fees during a vacancy.', 'Contract term, notice period and termination conditions.', 'How often you get reports, and what they contain.', 'The account where rents are deposited: separate or in trust?', 'Response time for emergencies, at night and on weekends.', 'Additional fees and taxes on top.']], ['p', 'A quote with a lower percentage can cost more in total once additional fees are added. Ask for a worked example on your building.']]
    }, {
      id: 'impot',
      h: 'Deductible fees',
      blocs: [['p', 'Amounts paid to a person or a company to manage your property are deductible as **management and administration fees** from your rental income (form T776 federally)[4]. In Québec, rental income and expenses are reported on form TP-128[5].'], ['p', 'The net cost of management is therefore lower than the percentage shown. Check your situation with your accountant.']]
    }, {
      id: 'piege',
      h: 'The TAL’s 3.5% is not a market rate',
      blocs: [['p', 'The TAL uses a “management fees” percentage in its rent calculation parameters. It is a regulatory parameter, **not a market rate**: it says nothing about what a property manager costs.']]
    }, {
      id: 'lease-lane',
      h: 'At Lease Lane',
      blocs: [['p', 'Our offer is based on your building: number of units, condition, services wanted. It includes Cléo, the AI agent that answers your tenants 24/7, and a monthly report you can see online. [Request your service offer](/offre-de-service) or see how a [switch of property managers](/changer-de-gestionnaire) works.']]
    }],
    faq: [['What percentage is common in Québec City?', 'The ranges published by Québec firms go from about 4% to 11% of rents collected, depending on the building and the service.'], ['Do you pay management fees during a vacancy?', 'Several firms that charge a percentage of rents collected charge nothing on a vacant unit. Check the basis of calculation in the contract.'], ['Are management fees deductible?', 'Yes, as management and administration fees from rental income (T776 federally; TP-128 in Québec).'], ['How much does it cost to lease a unit?', 'Firms most often publish 50% to 100% of the first month’s rent.']],
    src: [['Combien coûte un gestionnaire immobilier?', 'https://summumpm.com/blog/combien-coute-un-gestionnaire-immobilier/', 'Summum PM'], ['Combien coûte une gestion immobilière au Québec?', 'https://www.marcelpinardgestionimmobiliere.com/blogue/2768935_combien-coute-une-gestion-immobiliere-au-quebec', 'Marcel Pinard Gestion immobilière'], ['Tarifs de gestion immobilière', 'https://locationajax.ca/tarif-gestion-immobiliere/', 'Location Ajax'], ['Guide T4036, Rental Income', 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4036/rental-income.html', 'Canada Revenue Agency'], ['TP-128, Income and expenses respecting the rental of immovable property', 'https://www.revenuquebec.ca/fr/services-en-ligne/formulaires-et-publications/details-courant/tp-128/', 'Revenu Québec']],
    cleo: 'Cléo answers your questions about our offer and prepares your quote request, 24/7.',
    cleoQ: 'Management fees',
    revision: REV_EN,
    avert: 'This article provides general information, up to date as of the date shown. The ranges cited are those published by firms; they are not an offer. It is not tax or financial advice.'
  }
}, /* ——— 8. Enquête de prélocation ——— */
{
  slug: 'enquete-prelocation',
  couv: {
    fr: "Formulaire de demande de location, cadenas et clés sur une table de bureau",
    en: "Rental application form, padlock and keys on an office table"
  },
  slugEN: 'tenant-screening-quebec',
  cat: 'proprietaires',
  d: '2026-10-11',
  m: '2026-10-11',
  min: 7,
  aut: 'jt',
  fr: {
    t: 'Enquête de prélocation : ce que le propriétaire peut demander',
    r: 'Les renseignements permis, ceux qui sont interdits, le consentement à l’enquête de crédit, la discrimination et la conservation des dossiers (Loi 25).',
    titre: 'Enquête de prélocation au Québec : permis? | Lease Lane',
    description: 'NAS, pièce d’identité, enquête de crédit, références : ce qu’un propriétaire peut demander à un candidat locataire au Québec, selon la CAI et la CDPDJ.',
    requete: 'enquête de prélocation',
    fil: 'Enquête de prélocation',
    about: ['Enquête de prélocation', 'Renseignements personnels', 'Loi 25'],
    reponse: 'Au Québec, un propriétaire peut demander le **nom, l’adresse et les coordonnées des anciens propriétaires** du candidat. Avec son consentement, il peut faire une **enquête de crédit**, qui ne demande que le nom, l’adresse et la date de naissance[1]. Il ne peut pas exiger le NAS, un numéro de compte bancaire, des relevés de paie, des renseignements de santé ni des copies de pièces d’identité[1][2].',
    sections: [{
      id: 'tableau',
      h: 'Ce qui est permis, et ce qui ne l’est pas',
      blocs: [['table', {
        cap: 'Renseignements qu’un propriétaire peut demander à un candidat locataire au Québec',
        th: ['Renseignement', 'Peut-il être demandé?'],
        lignes: [['Nom, prénom et adresse', 'Oui[1]'], ['Nom et coordonnées des anciens propriétaires ou concierges', 'Oui[1]'], ['Date de naissance', 'Seulement pour une enquête de crédit, avec consentement[1][2]'], ['Enquête de crédit', 'Seulement avec le consentement du candidat[1]'], ['Voir une pièce d’identité', 'Oui, sans la copier, la photographier ni en noter les numéros[1]'], ['NAS, numéro d’assurance maladie, de passeport ou de permis de conduire', 'Non[1][2]'], ['Numéro ou solde de compte bancaire, relevé de paie, T4', 'Non[2]'], ['État de santé, grossesse, état civil, pays d’origine', 'Non[2]']]
      }]]
    }, {
      id: 'credit',
      h: 'L’enquête de crédit, avec consentement',
      blocs: [['p', 'L’enquête de crédit exige le consentement écrit du candidat et ne nécessite que son nom, son adresse et sa date de naissance. Le NAS n’est donc pas nécessaire[1].'], ['p', 'Le candidat qui refuse l’enquête peut fournir lui-même son rapport de crédit, une attestation bancaire, une lettre de référence ou des preuves de paiement de comptes, par exemple d’électricité ou de télécommunications[1]. Le propriétaire ne peut pas refuser un candidat parce qu’il ne fournit pas ses numéros d’assurance maladie ou de permis de conduire[1].']]
    }, {
      id: 'discrimination',
      h: 'Les motifs de refus interdits',
      blocs: [['p', 'La Charte des droits et libertés de la personne interdit la discrimination fondée notamment sur la grossesse, l’état civil, l’âge, l’origine ethnique ou nationale et la **condition sociale**[2][3]. Selon la Commission des droits de la personne, refuser un candidat parce qu’il reçoit de l’aide sociale ou parce qu’il est aux études est discriminatoire[2].'], ['p', 'Le Code civil interdit aussi de refuser un bail à une femme parce qu’elle est enceinte ou à une personne parce qu’elle a des enfants, sauf si les dimensions du logement le justifient; des dommages punitifs sont possibles[4].']]
    }, {
      id: 'conservation',
      h: 'Conserver et détruire les dossiers (Loi 25)',
      blocs: [['ul', ['Ne recueillir que les renseignements **nécessaires**, aux fins déterminées avant la collecte[5].', 'Ne les utiliser qu’à ces fins[5].', 'Une fois la fin atteinte, les **détruire ou les anonymiser**, sous réserve d’un délai de conservation prévu par la loi[5]. Les dossiers des candidats non retenus n’ont pas à être gardés indéfiniment.']]]
    }, {
      id: 'tal',
      h: 'Et les décisions du TAL?',
      blocs: [['p', 'Les décisions du TAL sont publiques et accessibles gratuitement sur le site de SOQUIJ[6]. Si vous les consultez pour vérifier un dossier, le principe de nécessité de la Loi 25 s’applique : ne retenez que ce qui est utile à la décision de louer.']]
    }, {
      id: 'liste',
      h: 'La liste de vérification d’une enquête conforme',
      blocs: [['ol', ['Un formulaire de demande limité au nécessaire, sans NAS ni numéro de compte, même « facultatif ».', 'Un consentement écrit et distinct pour l’enquête de crédit.', 'Aucune copie des pièces d’identité.', 'Les mêmes critères pour tous les candidats.', 'Un accès restreint aux dossiers.', 'La destruction des dossiers des candidats non retenus.']], ['p', 'La [demande de location](/locataires/demande-de-location) de Lease Lane suit ces règles : elle ne recueille que les renseignements nécessaires et demande le consentement à l’enquête de crédit séparément.']]
    }],
    faq: [['Le propriétaire peut-il exiger mon NAS?', 'Non. Selon la Commission d’accès à l’information, le NAS n’est pas nécessaire pour l’enquête de crédit.'], ['Peut-il photocopier mon permis de conduire?', 'Non. Il peut voir la pièce d’identité, mais pas en conserver de copie ni en noter les numéros.'], ['Je refuse l’enquête de crédit : que faire?', 'Fournissez vous-même votre rapport de crédit, une attestation bancaire ou des références d’anciens propriétaires.'], ['Peut-il refuser parce que j’ai des enfants ou que je reçois de l’aide sociale?', 'Non (art. 1899 C.c.Q. et art. 10 de la Charte), sauf si les dimensions du logement le justifient dans le cas des enfants.']],
    src: [['Signature d’un bail', 'https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/signature-bail', 'Commission d’accès à l’information'], ['Aide-mémoire pour les propriétaires d’immeubles à logements', 'https://www.cdpdj.qc.ca/storage/app/media/publications/aide-memoire_logement.pdf', 'Commission des droits de la personne et des droits de la jeunesse'], ['Obtenir un logement : vos droits', 'https://www.cdpdj.qc.ca/fr/publications/obtenir-un-logement-vos-droi', 'Commission des droits de la personne et des droits de la jeunesse'], ['Code civil du Québec, art. 1899', CCQ_FR, 'LégisQuébec'], ['Loi sur la protection des renseignements personnels dans le secteur privé, art. 5, 12 et 23', 'https://www.canlii.org/fr/qc/legis/lois/rlrq-c-p-39.1/derniere/rlrq-c-p-39.1.html', 'CanLII'], ['Rechercher une décision', 'https://www.tal.gouv.qc.ca/fr/decision/rechercher-une-decision', 'Tribunal administratif du logement']],
    cleo: 'Cléo vous dit quels renseignements demander à un candidat, et lesquels éviter, 24/7.',
    cleoQ: 'Une enquête de prélocation',
    revision: REV_FR
  },
  en: {
    t: 'Tenant screening in Québec: what a landlord can ask for',
    r: 'Information allowed, information prohibited, consent to a credit check, discrimination and keeping files (Law 25).',
    titre: 'Tenant Screening in Québec: What Is Allowed | Lease Lane',
    description: 'SIN, ID, credit check, references: what a landlord can ask a rental applicant in Québec, according to the CAI and the human rights commission (CDPDJ).',
    requete: 'tenant screening Quebec',
    fil: 'Tenant screening',
    about: ['Tenant screening', 'Personal information', 'Law 25'],
    reponse: 'In Québec, a landlord can ask for the applicant’s **name, address and the contact information of previous landlords**. With the applicant’s consent, they can run a **credit check**, which only requires the name, address and date of birth[1]. They cannot require the SIN, a bank account number, pay stubs, health information or copies of ID[1][2].',
    sections: [{
      id: 'tableau',
      h: 'What is allowed, and what is not',
      blocs: [['table', {
        cap: 'Information a landlord can ask a rental applicant for in Québec',
        th: ['Information', 'Can it be requested?'],
        lignes: [['First name, last name and address', 'Yes[1]'], ['Name and contact information of previous landlords or janitors', 'Yes[1]'], ['Date of birth', 'Only for a credit check, with consent[1][2]'], ['Credit check', 'Only with the applicant’s consent[1]'], ['Seeing an ID document', 'Yes, without copying it, photographing it or noting its numbers[1]'], ['SIN, health insurance, passport or driver’s licence number', 'No[1][2]'], ['Bank account number or balance, pay stub, T4', 'No[2]'], ['Health, pregnancy, civil status, country of origin', 'No[2]']]
      }]]
    }, {
      id: 'credit',
      h: 'The credit check, with consent',
      blocs: [['p', 'A credit check requires the applicant’s written consent and only needs their name, address and date of birth. The SIN is therefore not necessary[1].'], ['p', 'An applicant who refuses the check can provide their own credit report, a bank letter, a reference letter or proof of bill payments, for example electricity or telecommunications[1]. The landlord cannot refuse an applicant because they do not provide their health insurance or driver’s licence numbers[1].']]
    }, {
      id: 'discrimination',
      h: 'Prohibited reasons for refusal',
      blocs: [['p', 'The Charter of human rights and freedoms prohibits discrimination based on, among other things, pregnancy, civil status, age, ethnic or national origin and **social condition**[2][3]. According to the human rights commission, refusing an applicant because they receive social assistance or because they are a student is discriminatory[2].'], ['p', 'The Civil Code also prohibits refusing a lease to a woman because she is pregnant or to a person because they have children, unless the size of the dwelling justifies it; punitive damages are possible[4].']]
    }, {
      id: 'conservation',
      h: 'Keeping and destroying files (Law 25)',
      blocs: [['ul', ['Only collect the information that is **necessary**, for purposes determined before collecting it[5].', 'Only use it for those purposes[5].', 'Once the purpose is achieved, **destroy or anonymize** it, subject to a retention period provided by law[5]. Files of applicants who were not selected do not need to be kept indefinitely.']]]
    }, {
      id: 'tal',
      h: 'What about TAL decisions?',
      blocs: [['p', 'TAL decisions are public and available free of charge on the SOQUIJ website[6]. If you consult them to check an application, Law 25’s necessity principle applies: only keep what is useful to the decision to rent.']]
    }, {
      id: 'liste',
      h: 'Checklist for compliant screening',
      blocs: [['ol', ['An application form limited to what is necessary, with no SIN or account number, even “optional”.', 'Separate written consent for the credit check.', 'No copies of ID documents.', 'The same criteria for every applicant.', 'Restricted access to files.', 'Destruction of the files of applicants who were not selected.']], ['p', 'Lease Lane’s [rental application](/locataires/demande-de-location) follows these rules: it only collects the information that is needed and asks for consent to the credit check separately.']]
    }],
    faq: [['Can the landlord require my SIN?', 'No. According to the Commission d’accès à l’information, the SIN is not necessary for a credit check.'], ['Can they photocopy my driver’s licence?', 'No. They can see the ID document, but not keep a copy or note its numbers.'], ['I refuse the credit check: what can I do?', 'Provide your own credit report, a bank letter or references from previous landlords.'], ['Can they refuse me because I have children or receive social assistance?', 'No (art. 1899 C.C.Q. and s. 10 of the Charter), unless the size of the dwelling justifies it in the case of children.']],
    src: [['Signature d’un bail (signing a lease)', 'https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/signature-bail', 'Commission d’accès à l’information'], ['Aide-mémoire pour les propriétaires d’immeubles à logements', 'https://www.cdpdj.qc.ca/storage/app/media/publications/aide-memoire_logement.pdf', 'Commission des droits de la personne et des droits de la jeunesse'], ['Obtenir un logement : vos droits', 'https://www.cdpdj.qc.ca/fr/publications/obtenir-un-logement-vos-droi', 'Commission des droits de la personne et des droits de la jeunesse'], ['Civil Code of Québec, art. 1899', CCQ_EN, 'LégisQuébec'], ['Act respecting the protection of personal information in the private sector, ss. 5, 12 and 23', 'https://www.canlii.org/fr/qc/legis/lois/rlrq-c-p-39.1/derniere/rlrq-c-p-39.1.html', 'CanLII'], ['Search for a decision', 'https://www.tal.gouv.qc.ca/fr/decision/rechercher-une-decision', 'Administrative Housing Tribunal']],
    cleo: 'Cléo tells you which information to ask an applicant for, and which to avoid, 24/7.',
    cleoQ: 'Tenant screening',
    revision: REV_EN
  }
}];
export { LL_ARTICLES };
