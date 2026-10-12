/* Converti depuis ui_kits/site-public/levis-donnees.js (prototype) — ne pas réintroduire de globaux window. */

let LL_LEVIS = {
  fr: {
    titre: 'Gestion immobilière à {Lévis}',
    lead: 'Lease Lane est basée à Lévis. Nous gérons des immeubles locatifs sur la Rive-Sud comme à Québec : location, perception des loyers, entretien et suivi au TAL, avec Cléo qui répond à vos locataires 24/7.',
    secteursT: 'Les secteurs que nous desservons à {Lévis}',
    secteursD: 'Les trois arrondissements de la ville, et Québec de l’autre côté du fleuve.',
    secteurs: [['Desjardins', 'Lévis, Lauzon, Pintendre et Saint-Joseph-de-la-Pointe-De Lévy'], ['Les Chutes-de-la-Chaudière-Est', 'Saint-Romuald, Charny, Saint-Jean-Chrysostome et Breakeyville'], ['Les Chutes-de-la-Chaudière-Ouest', 'Saint-Nicolas, Saint-Rédempteur et Saint-Étienne-de-Lauzon']],
    marcheT: 'Le marché locatif sur la {Rive-Sud}',
    marche: ['Selon la SCHL, le taux d’inoccupation de la région métropolitaine de Québec, qui comprend Lévis, est passé à **2,4 %** en octobre 2025. La hausse se concentre notamment sur la Rive-Sud, surtout dans les logements neufs.', 'Concrètement, un logement au bon prix et bien présenté se loue encore vite à Lévis, mais un logement trop cher ou peu visible reste vide plus longtemps qu’en 2024. Chaque jour compte : voir [ce que coûte un logement vacant](/blogue/logement-vacant-cout).'],
    servicesT: 'Ce que nous prenons en charge',
    services: [['key', 'Location', 'Fiche, photos, visites réservées par Cléo 24/7 et sélection des locataires conforme à la Loi 25.'], ['banknote', 'Loyers', 'Perception, reçus, rappels dès le premier jour de retard et suivi jusqu’au TAL au besoin.'], ['wrench', 'Entretien', 'Demandes reçues avec photos, urgences prises en charge 24/7, fournisseurs suivis jusqu’à la fermeture.'], ['scale', 'Baux et TAL', 'Renouvellements, avis dans les délais, cessions et dossiers au Tribunal administratif du logement.'], ['chart-column', 'Rapports', 'Un rapport mensuel et un tableau de bord en ligne : chaque dollar et chaque dossier.'], ['message-square', 'Cléo', 'L’agent IA qui répond à vos locataires et aux locataires potentiels, jour et nuit, et passe le relais à l’équipe.']],
    reglesT: 'Les règles qui s’appliquent à {Lévis}',
    regles: ['Les baux de Lévis suivent les mêmes règles qu’ailleurs au Québec : le Code civil du Québec et les décisions du Tribunal administratif du logement. Les règlements municipaux de Lévis s’ajoutent pour l’entretien et la salubrité des bâtiments.', 'Pour aller plus loin : [la hausse de loyer 2026](/blogue/hausse-de-loyer-2026), [la reprise de logement](/blogue/reprise-de-logement) et [les réparations urgentes](/blogue/urgences-locatives).'],
    faqT: 'Questions fréquentes sur la gestion à {Lévis}',
    faq: [['Gérez-vous des immeubles à Lévis?', 'Oui. Lease Lane est basée à Lévis et gère des immeubles locatifs dans les trois arrondissements de la ville, ainsi qu’à Québec.'], ['Quels types d’immeubles gérez-vous?', 'Des immeubles résidentiels locatifs : duplex, triplex, multilogements et condos locatifs. Chaque offre est établie selon votre immeuble.'], ['Comment se passe le changement de gestionnaire?', 'En quatre étapes : lecture de votre contrat actuel, transfert des baux et des dossiers, avis aux locataires avec Cléo actif dès le premier jour, puis premier rapport.'], ['Combien coûte la gestion de mon immeuble?', 'Le prix dépend du nombre de logements, de l’état de l’immeuble et des services voulus. Demandez une offre : nous répondons avec une proposition et un rendez-vous.']],
    cta: {
      surtitre: 'Un immeuble à Lévis?',
      titre: 'Parlons de {votre immeuble}.',
      texte: 'Décrivez-le en deux minutes : nous répondons avec une offre et un rendez-vous proposé.',
      bouton: 'Obtenir une offre'
    }
  },
  en: {
    titre: 'Property management in {Lévis}',
    lead: 'Lease Lane is based in Lévis. We manage rental buildings on the South Shore and in Québec City: leasing, rent collection, maintenance and TAL follow-up, with Cléo answering your tenants 24/7.',
    secteursT: 'The areas we serve in {Lévis}',
    secteursD: 'The city’s three boroughs, and Québec City across the river.',
    secteurs: [['Desjardins', 'Lévis, Lauzon, Pintendre and Saint-Joseph-de-la-Pointe-De Lévy'], ['Les Chutes-de-la-Chaudière-Est', 'Saint-Romuald, Charny, Saint-Jean-Chrysostome and Breakeyville'], ['Les Chutes-de-la-Chaudière-Ouest', 'Saint-Nicolas, Saint-Rédempteur and Saint-Étienne-de-Lauzon']],
    marcheT: 'The rental market on the {South Shore}',
    marche: ['According to CMHC, the vacancy rate in the Québec census metropolitan area, which includes Lévis, rose to **2.4%** in October 2025. The increase is concentrated in areas including the South Shore, especially in new units.', 'In practice, a well-priced, well-presented unit still rents quickly in Lévis, but an overpriced or poorly visible unit stays empty longer than in 2024. Every day counts: see [what a vacant unit costs](/blogue/logement-vacant-cout).'],
    servicesT: 'What we take care of',
    services: [['key', 'Leasing', 'Listing, photos, viewings booked by Cléo 24/7 and tenant screening compliant with Law 25.'], ['banknote', 'Rent', 'Collection, receipts, reminders from the first day late and follow-up to the TAL when needed.'], ['wrench', 'Maintenance', 'Requests received with photos, emergencies handled 24/7, suppliers followed until the file is closed.'], ['scale', 'Leases and the TAL', 'Renewals, notices on time, assignments and files at the Administrative Housing Tribunal.'], ['chart-column', 'Reports', 'A monthly report and an online dashboard: every dollar and every file.'], ['message-square', 'Cléo', 'The AI agent that answers your tenants and prospects, day and night, and hands over to the team.']],
    reglesT: 'The rules that apply in {Lévis}',
    regles: ['Leases in Lévis follow the same rules as elsewhere in Québec: the Civil Code of Québec and the decisions of the Administrative Housing Tribunal. Lévis municipal by-laws also apply to building maintenance and sanitation.', 'Learn more: [the 2026 rent increase](/blogue/hausse-de-loyer-2026), [repossessing a dwelling](/blogue/reprise-de-logement) and [urgent repairs](/blogue/urgences-locatives).'],
    faqT: 'Frequently asked questions about management in {Lévis}',
    faq: [['Do you manage buildings in Lévis?', 'Yes. Lease Lane is based in Lévis and manages rental buildings in the city’s three boroughs, as well as in Québec City.'], ['What types of buildings do you manage?', 'Residential rental buildings: duplexes, triplexes, multi-unit buildings and rental condos. Each offer is based on your building.'], ['How does switching property managers work?', 'In four steps: review of your current contract, transfer of leases and files, notice to tenants with Cléo active from day one, then the first report.'], ['How much does managing my building cost?', 'The price depends on the number of units, the building’s condition and the services you want. Request an offer: we reply with a proposal and a meeting.']],
    cta: {
      surtitre: 'A building in Lévis?',
      titre: 'Let’s talk about {your building}.',
      texte: 'Describe it in two minutes: we reply with an offer and a proposed meeting.',
      bouton: 'Get an offer'
    }
  },
  src: [['Rapport sur le marché locatif 2025 (SCHL)', 'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres']]
};
export { LL_LEVIS };
