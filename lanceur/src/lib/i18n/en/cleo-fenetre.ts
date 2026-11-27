// Dictionnaire anglais : fenêtre du chat de Cléo (composants/Cleo.tsx). Clé = texte français exact du code, valeur = anglais.
// TEMPORAIRE : « Fenêtre », « Fenêtre flottante », « Tiroir latéral » et « Barre de commande » appartiennent au sélecteur d'essai (CHOIX_FENETRE_CLEO), à supprimer avec lui.
const dico: Record<string, string> = {
  'Fenêtre': 'Window',
  'Fenêtre flottante': 'Floating window',
  'Tiroir latéral': 'Side drawer',
  'Barre de commande': 'Command bar',
  'Réduire': 'Minimize',
  'Agrandir': 'Expand',
  // État vide de la fenêtre (aucun message) : salutation et exemples de questions, par portail.
  'Bonjour {prenom}, je suis Cléo.': 'Hello {prenom}, I’m Cléo.',
  'Bonjour, je suis Cléo.': 'Hello, I’m Cléo.',
  'Posez votre question ou choisissez un exemple. Chaque réponse cite ses sources.': 'Ask your question or pick an example. Every answer cites its sources.',
  'Exemples de questions': 'Example questions',
  'Quand est mon prochain loyer ?': 'When is my next rent due?',
  'Où en est ma demande ?': 'What’s the status of my request?',
  'Quand se termine mon bail ?': 'When does my lease end?',
  'Qu’est-ce qui attend mon approbation ?': 'What’s waiting for my approval?',
  'Qui est en retard ce mois-ci ?': 'Who is late this month?',
  'Relevé du mois dernier': 'Last month’s statement',
  'Quels logements sont vacants ?': 'Which units are vacant?',
};
export default dico;
