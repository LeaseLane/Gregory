// Arbitrage (2026-11-25) : un même mot français avait des traductions différentes selon la section; ce fichier, chargé en
// dernier, fixe la valeur commune. Les sens vraiment différents passent par un contexte « mot|contexte » (voir langue.ts).
const dico: Record<string, string> = {
  'Nom': 'Name',
  'Logement': 'Unit',
  'Terminé': 'Completed',
  'Dossiers': 'Folders',
  'Dossiers|Juridique': 'Cases',
  'Relancer': 'Send reminder',
  'Relancer|campagne': 'Restart',
  'Entrée': 'Entrance',
  'Entrée|clavier': 'Enter',
  'En retard': 'Late',
  'Refuser': 'Decline',
  'Aucun': 'None',
  'Fiche': 'Profile',
  'Mode': 'Method',
  'Échéance': 'Due date',
  'Marquer payé': 'Mark paid',
};
export default dico;
