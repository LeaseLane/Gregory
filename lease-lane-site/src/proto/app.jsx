/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/app.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { useDico } from '@/lib/i18n/contexte';
import { AIAgentLauncher, AIAgentPanel } from '@/components/ds';
import { LL_FAQ } from '@/proto/faq';
import { LL_SITE } from '@/proto/routes';
import { LL_DATA } from '@/proto/data';
import { CleoPanneau } from '@/proto/cleo-options';
import { CleoAccroche } from '@/proto/cleo-panneau';
import { __ssr } from '@/lib/hydratation';
import { demanderCleo, envoyerDemande } from '@/lib/envoi';
import { prochainsCreneaux } from '@/lib/creneaux';
import { AUD, ORDRE, faqPour, normF, motsF, trouverFaq, cleScenario, decider, choisirDico } from '@/lib/cleo-routage';

/* Repli si le paquet du système n'expose pas encore le contexte : la page s'affiche avec les pilules au lieu d'un écran blanc. */

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
const PHOTO_L1 = "/assets/img/logements/montcalm-cartier.jpg";

/* Cléo — scénarios de conversation. Chaque réponse = suite de messages (texte ou carte), avec
   relances et créneaux optionnels. Ton : vouvoiement, phrases courtes, aucune promesse, escalade
   vers une personne dès qu'une décision légale ou financière est en jeu. */
/* Jours ouvrables à venir, calculés à l'ouverture (avant : dates fixes de septembre). */
const CRENEAUX = () => prochainsCreneaux(['10 h 00', '17 h 30', '12 h 15', '9 h 00']);
/* Profils de Cléo : chaque visiteur choisit son statut; les intentions, les réponses et la FAQ proposées en dépendent.
   Propriétaire : rien de locataire, sauf le droit du logement (TAL) et ce qui passe par son espace. Locataire et futur locataire : rien de propriétaire.
   Le profil se change en tout temps (« Changer de profil »). */
const PROFILS = [{
  k: 'proprio',
  icone: 'building-2',
  titre: 'Propriétaire',
  desc: 'J’ai un ou plusieurs immeubles locatifs'
}, {
  k: 'locataire',
  icone: 'key-round',
  titre: 'Locataire',
  desc: 'J’habite un logement géré par Lease Lane'
}, {
  k: 'prospect',
  icone: 'search',
  titre: 'Je cherche un logement',
  desc: 'Visiter, louer, déposer une demande'
}];
const ACTIONS = [{
  k: 'chercher',
  icone: 'key',
  titre: 'Trouver un logement',
  desc: 'Logements à Québec, loyers du bail',
  groupe: 'Pour vous',
  pour: ['prospect', 'locataire']
}, {
  k: 'visite',
  icone: 'calendar-check',
  titre: 'Planifier une visite',
  desc: 'Créneaux du gestionnaire de secteur',
  groupe: 'Pour vous',
  pour: ['prospect']
}, {
  k: 'demande',
  icone: 'file-text',
  titre: 'Déposer une demande de location',
  desc: 'En ligne, avec votre consentement',
  groupe: 'Pour vous',
  pour: ['prospect']
}, {
  k: 'travaux',
  icone: 'wrench',
  titre: 'Services aux locataires',
  desc: 'Urgence ou demande de travaux',
  groupe: 'Pour vous',
  pour: ['locataire']
}, {
  k: 'plainte',
  icone: 'message-square',
  titre: 'Commentaire ou plainte',
  desc: 'Formulaire en ligne, accusé immédiat',
  groupe: 'Pour vous',
  pour: ['locataire']
}, {
  k: 'portailL',
  icone: 'log-in',
  titre: 'Mon portail locataire',
  desc: 'Bail, paiements, demandes',
  groupe: 'Pour vous',
  pour: ['locataire']
}, {
  k: 'gestion',
  icone: 'building-2',
  titre: 'Confier mon immeuble',
  desc: 'Offre préparée pour votre immeuble',
  groupe: 'Pour vous',
  pour: ['proprio']
}, {
  k: 'proprio',
  icone: 'building',
  titre: 'Services aux propriétaires',
  desc: 'Gestion, location, expertise',
  groupe: 'Pour vous',
  pour: ['proprio']
}, {
  k: 'portailP',
  icone: 'log-in',
  titre: 'Mon espace propriétaire',
  desc: 'Tableau de bord, rapports, approbations',
  groupe: 'Pour vous',
  pour: ['proprio']
}, {
  k: 'bail',
  icone: 'scale',
  titre: 'Une question sur le bail ou le TAL',
  desc: 'Avis, délais, hausse, reprise, recours',
  groupe: 'Droit du logement',
  pour: ['proprio', 'locataire', 'prospect']
}];
/* Public de chaque scénario : '*' = tous (droit du logement, relais humain). */
/* FAQ visible dans Cléo selon le profil : propriétaire = ses questions + tout le TAL (t*); locataire et futur locataire = leurs questions + le TAL côté locataire. */
const SCENARIOS = {
  chercher: {
    messages: d => [{
      role: 'agent',
      texte: 'Voici ce qui correspond à Québec sous 1 500 $ en ce moment. Les loyers affichés sont ceux du bail, sans surprise.'
    }, {
      type: 'logements',
      items: [{
        id: 'L1',
        photo: PHOTO_L1,
        titre: d.logements[0].titre,
        detail: '2 ch. · 880 pi² · libre le 1er juillet',
        prix: d.logements[0].prix
      }, {
        id: 'L4',
        titre: d.logements[3].titre,
        detail: '2 ch. · 790 pi² · chauffé, éclairé',
        prix: d.logements[3].prix
      }, {
        id: 'L2',
        titre: d.logements[1].titre,
        detail: '1 ch. · 640 pi² · libre immédiatement',
        prix: d.logements[1].prix
      }]
    }, {
      role: 'agent',
      texte: 'Voulez-vous en visiter un cette semaine, ou que je vous avise des nouvelles annonces qui correspondent ?'
    }],
    suggestions: ['Visiter le 4 ½ de Montcalm', 'M\u2019aviser des nouveautés', 'Voir tout sur la carte']
  },
  visite: {
    messages: () => [{
      role: 'agent',
      texte: 'Avec plaisir. Choisissez le moment qui vous convient; l\u2019équipe vous confirme la visite.'
    }],
    creneaux: true
  },
  aviser: {
    messages: () => [{
      role: 'agent',
      texte: 'Je peux vous prévenir dès qu\u2019un logement correspond à vos critères, par courriel seulement et jamais plus d\u2019une fois par jour. Vous pourrez retirer votre consentement en un clic.'
    }, {
      type: 'formulaire',
      variante: 'alerte',
      lignes: [['Type', '4 ½'], ['Secteur', 'Montcalm, Saint-Roch, Limoilou'], ['Budget', 'Jusqu\u2019à 1 500 $'], ['Canal', 'Courriel']]
    }],
    suggestions: ['Modifier les critères', 'Plutôt une visite']
  },
  travaux: {
    messages: () => [{
      role: 'agent',
      texte: 'Je note le problème. Si de l\u2019eau coule activement ou s\u2019il n\u2019y a plus de chauffage, appelez d\u2019abord la ligne d\u2019urgence, 24 h sur 24 : ' + LL_SITE.urgence + '.'
    }, {
      type: 'formulaire',
      variante: 'urgence'
    }, {
      role: 'agent',
      texte: 'Sinon, faites la demande dans votre portail locataire, photos à l\u2019appui : elle est rattachée à votre logement et vous la suivez à chaque étape.'
    }],
    suggestions: ['C\u2019est une urgence', 'Accéder au portail locataire', 'Parler à une personne']
  },
  plainte: {
    messages: () => [{
      role: 'agent',
      texte: 'Un commentaire, une plainte ou une demande administrative se dépose en ligne, sans connexion. Vous recevez un accusé de réception immédiat.'
    }],
    suggestions: ['Ouvrir le formulaire de plainte', 'Parler à une personne']
  },
  frais: {
    messages: () => [{
      role: 'agent',
      texte: 'Chaque offre est préparée pour votre immeuble, après un appel de 30 minutes : nombre de portes, état de l\u2019immeuble et services voulus.'
    }, {
      type: 'resume',
      titre: 'Ce que comprend la gestion',
      lignes: [['Loyers', 'Perception, reçus, relances'], ['Locataires', 'Messages, demandes, urgences 24/7'], ['Travaux', 'Coordination de l\u2019entretien et des travaux'], ['Rapports', 'Mensuel, avec tableau de bord']]
    }, {
      role: 'agent',
      texte: 'Pour une offre préparée pour votre immeuble, une personne de l\u2019équipe vous rappelle. Voulez-vous un créneau ?'
    }],
    creneaux: true,
    suggestions: ['Oui, un rappel', 'Notre expertise', 'Obtenir une offre']
  },
  humain: {
    messages: () => [{
      role: 'agent',
      texte: 'Bien sûr. Laissez-moi vos coordonnées : une personne de l\u2019équipe vous revient, avec le fil de notre conversation pour que vous n\u2019ayez pas à vous répéter.'
    }, {
      type: 'formulaire',
      variante: 'humain',
      titre: 'Vos coordonnées',
      bouton: 'Être contacté',
      usage: 'me recontacter au sujet de cette conversation',
      onOk: x => transmettre(x, 'Cléo : parler à une personne')
    }],
    suggestions: ['Continuer avec Cléo']
  },
  hausse: {
    messages: () => [{
      role: 'agent',
      texte: 'Pour un bail de 12 mois, l\u2019avis de modification se donne de 3 à 6 mois avant la fin du bail : du 1er janvier au 31 mars pour un bail qui finit le 30 juin (C.c.Q., art. 1942).'
    }, {
      role: 'agent',
      texte: 'Le locataire a 1 mois pour accepter, refuser et rester, ou partir; son silence vaut acceptation. S\u2019il refuse et reste, le propriétaire a 1 mois pour demander au TAL de fixer le loyer. Pour 2026, le taux de base du TAL est de 3,1 %.'
    }],
    suggestions: ['Une cession de bail', 'Parler à une personne']
  },
  cession: {
    messages: () => [{
      role: 'agent',
      texte: 'Le locataire avise par écrit, avec le nom et l\u2019adresse de la personne proposée. Le propriétaire a 15 jours pour répondre; son silence vaut consentement (C.c.Q., art. 1870 et 1871).'
    }, {
      role: 'agent',
      texte: 'Depuis la Loi 31, un refus sans motif sérieux résilie le bail à la date prévue de la cession. Seules les dépenses raisonnables réellement engagées peuvent être réclamées.'
    }],
    suggestions: ['Une hausse de loyer', 'Parler à une personne']
  },
  depot: {
    messages: () => [{
      role: 'agent',
      texte: 'Au Québec, seul le premier mois de loyer peut être exigé d\u2019avance (C.c.Q., art. 1904). Dépôt de garantie, dépôt pour les clés, chèques postdatés imposés et frais de dossier sont interdits; une somme perçue ainsi est remboursable avec intérêts.'
    }],
    suggestions: ['Une hausse de loyer', 'Parler à une personne']
  },
  bail: {
    messages: () => [{
      role: 'agent',
      texte: 'Je peux vous expliquer les règles générales du Code civil et du TAL sur le bail : avis, délais, cession, reprise, résiliation, recours. Décrivez-moi votre situation : je vous indique les règles qui s\u2019y rapportent et leurs sources, puis une personne de l\u2019équipe prend le relais pour votre cas précis.'
    }, {
      role: 'agent',
      texte: 'Information juridique générale, pas un avis juridique. Un humain prend le relais dès que votre dossier le demande.'
    }],
    suggestions: ['Une hausse de loyer', 'Une cession de bail', 'Parler à une personne']
  }
};
/* Rempli par le composant (accès à l'état du clavardage) : SCENARIOS.humain y envoie ses coordonnées. */
let transmettre = () => Promise.resolve();
const DEFAUT = {
  messages: () => [{
    role: 'agent',
    texte: 'Je note votre demande. Je n\u2019ai pas de réponse sûre à vous donner ici : une personne de notre équipe vous revient au prochain jour ouvrable.'
  }],
  creneaux: true,
  suggestions: ['Trouver un logement', 'Signaler un problème', 'Parler à une personne']
};
function AgentIA({
  ouvert,
  setOuvert,
  aller
}) {
  const __d = useDico();
  choisirDico(__d.lang === 'en' ? __d.D : null);
  const data = LL_DATA;
  /* Le fil démarre vide : l'accueil du panneau (salutation, intentions, urgence) tient lieu de premier message. */
  const [messages, setMessages] = React.useState([]),
    /* Fil courant, lu au moment d'envoyer une demande (les rappels de formulaire gardent un ancien état). */
    fil = React.useRef([]),
    [sujet, setSujet] = React.useState(null);
  const [saisie, setSaisie] = React.useState('');
  const [ecrit, setEcrit] = React.useState(false);
  const [creneaux, setCreneaux] = React.useState([]);
  const [suggestions, setSuggestions] = React.useState([]);
  const [nonLus, setNonLus] = React.useState(0);
  const [profil, setProfilE] = React.useState(() => {
      try {
        return (typeof sessionStorage !== "undefined" ? sessionStorage.getItem('ll-cleo-profil') : undefined) || null;
      } catch (e) {
        return null;
      }
    }),
    attente = React.useRef(null);
  const setProfil = k => {
    try {
      k ? typeof sessionStorage !== "undefined" ? sessionStorage.setItem('ll-cleo-profil', k) : undefined : typeof sessionStorage !== "undefined" ? sessionStorage.removeItem('ll-cleo-profil') : undefined;
    } catch (e) {}
    setProfilE(k);
  };
  /* Profil choisi dans le menu ouvrant (menu-options.jsx) : le panneau suit. */
  React.useEffect(() => {
    const f = e => setProfilE((e.detail || {}).profil || null);
    window.addEventListener('ll-cleo-profil', f);
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.removeEventListener('ll-cleo-profil', f) : undefined;
  }, []);
  const lib = k => ({
    proprio: 'propriétaire',
    locataire: 'locataire',
    prospect: 'à la recherche d\u2019un logement'
  })[k] || '';
  const repondre = sc => {
    setEcrit(true);
    setCreneaux([]);
    setSuggestions([]);
    const suite = sc.messages(data);
    suite.forEach((m, i) => setTimeout(() => {
      setMessages(prev => [...prev, m]);
      if (i === suite.length - 1) {
        setEcrit(false);
        if (sc.creneaux) setCreneaux(CRENEAUX());
        setSuggestions(sc.suggestions || []);
        if (!ouvert) setNonLus(n => n + 1);
      }
    }, 700 + i * 650));
  };
  /* Cloisonnement par profil : ce qui ne concerne pas le profil choisi n'est pas servi; on propose de changer de profil. */
  const bloquer = aud => repondre({
    messages: () => [{
      role: 'agent',
      texte: 'Cette question s\u2019adresse ' + (aud.includes('proprio') ? 'aux propriétaires' : 'aux locataires et aux futurs locataires') + '. Votre profil actuel : ' + lib(profil) + '. Si votre situation est différente, changez de profil et je vous réponds.'
    }],
    suggestions: ['Changer de profil', 'Parler à une personne']
  });
  const demanderProfil = t => {
    attente.current = t;
    repondre({
      messages: () => [{
        role: 'agent',
        texte: 'Pour vous répondre précisément : êtes-vous propriétaire, locataire, ou à la recherche d\u2019un logement?'
      }],
      suggestions: ['Je suis propriétaire', 'Je suis locataire', 'Je cherche un logement']
    });
  };
  const repondreFaq = id => {
    const F = LL_FAQ[id];
    if (!F) return;
    repondre({
      messages: () => [{
        role: 'agent',
        texte: F.r
      }, ...(id[0] === 't' ? [{
        role: 'agent',
        texte: 'Information juridique générale, pas un avis juridique. Un humain prend le relais dès que votre dossier le demande.'
      }] : [])],
      suggestions: ['Une autre question', 'Parler à une personne']
    });
  };
  const traiter = (t, pr) => {
    const d = decider(t, pr);
    if (d.type === 'nav') {
      setOuvert(false);
      if (d.to) aller(d.to);else window.location.href = LL_SITE.portail;
      return;
    }
    if (d.type === 'bloquer') return bloquer(d.aud);
    if (d.type === 'profil') return demanderProfil(t);
    if (d.type === 'scenario') return repondre(SCENARIOS[d.k]);
    if (d.type === 'faq') return repondreFaq(d.id);
    /* Aucun scénario ni FAQ : l'IA répond (handle-public-faq, base de
       connaissance du site seulement). Si elle est indisponible, réponse
       prudente d'origine. */
    setEcrit(true);
    demanderCleo(t).then(texte => repondre({
      messages: () => [{
        role: 'agent',
        texte
      }],
      suggestions: ['Parler à une personne', 'Une autre question']
    }), () => repondre(DEFAUT));
  };
  const choisirProfil = k => {
    setProfil(k);
    const q = attente.current;
    attente.current = null;
    if (q) {
      traiter(q, k);
      return;
    }
    repondre({
      messages: () => [{
        role: 'agent',
        texte: 'Parfait, je vous réponds en tant que ' + lib(k) + '. Que puis-je faire pour vous?'
      }],
      suggestions: ACTIONS.filter(a => a.pour.includes(k)).slice(0, 3).map(a => a.titre)
    });
  };
  const envoyer = texte => {
    const t = (texte || saisie).trim();
    if (!t) return;
    setMessages(m => [...m, {
      role: 'client',
      texte: t
    }]);
    setSaisie('');
    if (/^(changer de profil|change (my )?profile)/i.test(t)) {
      changerProfil();
      return;
    }
    if (/^(une autre question|another question)/i.test(t)) {
      recommencer();
      return;
    }
    if (/^(je suis propri|i'?m an? (property )?owner|i am an? (property )?owner|i own)/i.test(t)) {
      choisirProfil('proprio');
      return;
    }
    if (/^(je suis locataire|i'?m a tenant|i am a tenant)/i.test(t)) {
      choisirProfil('locataire');
      return;
    }
    if (/^(je cherche un logement|i'?m looking for (a home|an apartment|a place)|i am looking for (a home|an apartment|a place))$/i.test(t)) {
      choisirProfil('prospect');
      return;
    }
    const a = ACTIONS.find(x => x.titre === t);
    if (a) {
      action(a, true);
      return;
    }
    traiter(t, profil);
  };
  const action = (a, dejaDit) => {
    if (a.k === 'demande') {
      aller('/locataires/demande-de-location');
      setOuvert(false);
      return;
    }
    if (a.k === 'portailL' || a.k === 'portailP') {
      setOuvert(false);
      window.location.href = LL_SITE.portail;
      return;
    }
    if (profil && a.pour && !a.pour.includes(profil)) {
      bloquer(a.pour);
      return;
    }
    if (!profil && a.pour && a.pour.length < 3) setProfil(a.pour[0]);
    const libelle = {
      chercher: 'Je cherche un logement à Québec',
      visite: 'Je voudrais planifier une visite',
      travaux: 'Je veux signaler un problème dans mon logement',
      plainte: 'J\u2019ai un commentaire ou une plainte',
      bail: 'J\u2019ai une question sur mon bail ou le TAL',
      gestion: 'Je veux confier la gestion de mon immeuble',
      urgence: 'C\u2019est une urgence dans mon logement',
      proprio: 'Quels services offrez-vous aux propriétaires?'
    }[a.k];
    setSujet(a.titre);
    if (!dejaDit) setMessages(m => [...m, {
      role: 'client',
      texte: libelle
    }]);
    repondre(SCENARIOS[a.k === 'gestion' || a.k === 'proprio' ? 'frais' : a.k === 'urgence' ? 'travaux' : a.k]);
  };
  fil.current = messages;
  /* Envoie à l'équipe (Messages du site) avec la conversation, puis répond honnêtement. */
  transmettre = (x, sujet, lignes = []) => envoyerDemande({
    type: 'contact',
    nom: x.nom.trim(),
    courriel: x.courriel.trim(),
    tel: x.tel,
    sujet,
    lignes,
    message: fil.current.filter(m => m.texte).map(m => (m.role === 'client' ? 'Visiteur' : 'Cléo') + ' : ' + m.texte).join('\n')
  }).then(() => setMessages(m => [...m, {
    role: 'agent',
    texte: 'C\u2019est transmis. Une personne de l\u2019équipe vous revient au prochain jour ouvrable, à ' + x.courriel.trim() + '.'
  }]), e => setMessages(m => [...m, {
    role: 'agent',
    texte: 'Je n\u2019ai pas pu transmettre votre demande (' + e.message + ') Réessayez dans un instant, ou écrivez-nous depuis la page Nous joindre.'
  }]));
  const choisirCreneau = c => {
    setCreneaux([]);
    setSuggestions([]);
    setMessages(m => [...m, {
      role: 'client',
      texte: c.jour + ' à ' + c.heure
    }]);
    /* S3 : coordonnées et consentement avant la confirmation; la carte reprend le courriel saisi. */
    /* Pas d'agenda branché : la plage choisie est une préférence, l'équipe confirme. */
    const confirmer = x => transmettre(x, 'Cléo : demande de visite', [['Moment souhaité', c.jour + ' à ' + c.heure]]);
    setTimeout(() => setMessages(m => [...m, {
      role: 'agent',
      texte: 'Noté : ' + c.jour + ' à ' + c.heure + '. Laissez-moi votre nom et votre courriel; l\u2019équipe vous confirme la visite.'
    }, {
      type: 'formulaire',
      variante: 'visite',
      onOk: confirmer
    }]), 600);
  };
  const ouvrirLogement = () => {
    aller('fiche');
    setOuvert(false);
  };
  const envoyerRef = React.useRef(envoyer);
  envoyerRef.current = envoyer;
  React.useEffect(() => {
    const f = e => {
      setOuvert(true);
      setNonLus(0);
      const t = e.detail && e.detail.texte;
      if (t) setTimeout(() => envoyerRef.current(t), 350);
    };
    window.addEventListener('ll-cleo', f);
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.removeEventListener('ll-cleo', f) : undefined;
  }, []);
  const basculer = () => {
    setOuvert(!ouvert);
    if (!ouvert) {
      setNonLus(0);
      try {
        localStorage.setItem('ll-cleo-accroche', '1');
      } catch (e) {}
    }
  };
  React.useEffect(() => {
    if (ouvert) try {
      localStorage.setItem('ll-cleo-accroche', '1');
    } catch (e) {}
  }, [ouvert]);
  const recommencer = () => {
    setMessages([]);
    setSuggestions([]);
    setCreneaux([]);
    setEcrit(false);
    setSujet(null);
    setSaisie('');
    attente.current = null;
  };
  const changerProfil = () => {
    setProfil(null);
    recommencer();
  };
  const actionsProfil = profil ? ACTIONS.filter(a => a.pour.includes(profil)) : [];
  const faqProfil = profil ? faqPour(profil).slice(0, 4).map(id => [id, LL_FAQ[id].q]) : [];
  const ouvrirFaq = id => {
    setSujet('Question fréquente');
    setMessages(m => [...m, {
      role: 'client',
      texte: LL_FAQ[id].q
    }]);
    repondreFaq(id);
  };
  const Panneau = CleoPanneau,
    Accroche = CleoAccroche;
  return <div className="ll-cleo-flottant" data-ouvert={ouvert ? 1 : 0} style={{
    position: 'fixed',
    right: '24px',
    bottom: '24px',
    zIndex: 1200,
    display: 'grid',
    justifyItems: 'end',
    gap: '14px'
  }}>
    {ouvert && Panneau && <Panneau avatar={AVATAR_CLEO} messages={messages} ecrit={ecrit} creneaux={creneaux} actions={profil ? actionsProfil : ACTIONS} onAction={a => action(a)} profil={profil} profils={PROFILS} onProfil={k => k ? setProfil(k) : changerProfil()} faq={faqProfil} onFaq={ouvrirFaq} suggestions={suggestions} sujet={sujet} urgence={LL_SITE.urgence} saisie={saisie} onSaisie={setSaisie} onEnvoi={() => envoyer()} onSuggestion={s => envoyer(s)} onCreneau={choisirCreneau} onLogement={ouvrirLogement} onHumain={() => {
      if (!sujet) setSujet('Parler à une personne');
      envoyer('Je voudrais parler à une personne');
    }} onClose={() => setOuvert(false)} onRecommencer={recommencer} />}
    {!ouvert && !messages.length && Accroche && <Accroche onOuvrir={() => {
      setOuvert(true);
      setNonLus(0);
    }} />}
    {ouvert && !Panneau && <AIAgentPanel avatar={AVATAR_CLEO} statut="En ligne" messages={messages} ecrit={ecrit} creneaux={creneaux} actions={ACTIONS} onAction={action} suggestions={suggestions} saisie={saisie} onSaisie={setSaisie} onEnvoi={() => envoyer()} onSuggestion={s => envoyer(s)} onCreneau={choisirCreneau} onLogement={ouvrirLogement} onHumain={() => envoyer('Je voudrais parler à une personne')} onClose={() => setOuvert(false)} />}
    <AIAgentLauncher className="cp-lanceur" avatar={AVATAR_CLEO} ouvert={ouvert} pastille={nonLus} onClick={basculer} etiquette="Parler à Cléo" />
  </div>;
}
export { ICONES_BOUTON, FORME_VOIE, AVATAR_CLEO, PHOTO_L1, CRENEAUX, PROFILS, ACTIONS, ACTIONS as LL_CLEO_ACTIONS, AUD, faqPour, normF, motsF, trouverFaq, SCENARIOS, DEFAUT, ORDRE, cleScenario, AgentIA };
