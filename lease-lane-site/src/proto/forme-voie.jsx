/* Extrait de app.jsx par posttraiter.py : la coquille (Coquille.jsx) n'a besoin que du kit de boutons « Flèche », pas de
   tout l'agent Cléo (chargé au premier geste de l'utilisateur, PageSpeed du 23 oct. 2026). */
/* Boutons du site public : kit « Flèche ». Icône du segment choisie d'après le libellé quand la page n'en fournit pas. */
const ICONES_BOUTON = [[/offre/i, 'file-text'], [/expertise|méthode/i, 'chart-column'], [/tarif|frais/i, 'tag'], [/recherch/i, 'search'], [/logement|propriét/i, 'house'], [/cléo|écrire|question/i, 'message-square'], [/appel|planifier|visite|rendez/i, 'calendar-check'], [/travaux/i, 'wrench'], [/connexion|connecter|accéder|espace|portail/i, 'key-round'], [/relais|personne|équipe/i, 'users'], [/étapes/i, 'layers'], [/envoyer/i, 'send'], [/photo/i, 'camera'], [/document/i, 'files'], [/gestion/i, 'building-2'], [/urgence|appeler/i, 'phone'], [/témoin|personnaliser/i, 'settings'], [/refuser/i, 'x'], [/accepter|enregistrer|confirmer|continuer|valider/i, 'check'], [/locataire|service/i, 'key-round']];
const FORME_VOIE = {
  forme: 'fleche',
  icone: t => {
    const m = ICONES_BOUTON.find(([r]) => r.test(t || ''));
    return m ? m[1] : 'circle-check';
  }
};
const AVATAR_CLEO = "/assets/img/cleo-avatar.png";
export { ICONES_BOUTON, FORME_VOIE, AVATAR_CLEO };
