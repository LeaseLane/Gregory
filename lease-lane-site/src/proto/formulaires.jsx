/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/formulaires.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon, Button, Input, Select, Checkbox } from '@/components/ds';
import { LL_SITE, LL_TEL_URGENCE } from '@/proto/routes';
import { Note, gab, TitreBloc, Cartes, Fleche, FAQListe, BandeauPage } from '@/proto/blocs';
import { FormEtapesP } from '@/proto/forms-principal';
import { naviguer } from '@/lib/routeur';
import { Section } from '@/proto/accueil';
import { GabaritDemande } from '@/proto/demande';
import { ouvrirCleo } from '@/proto/seo';
import { __maintenant, __ssr } from '@/lib/hydratation';

/* Formulaires locataires en étapes : barre de progression, validation près du champ, photos, signature électronique,
   consentement explicite. Les points juridiques (C.c.Q., Loi 25, Loi 31) sont à faire valider avant la mise en ligne. */
const FF = '1px solid var(--bordure-fine)';
const LOGEMENT = {
  k: 'logement',
  type: 'texte',
  label: 'Adresse et numéro de logement',
  ph: '1180, avenue Cartier, app. 4',
  req: 1,
  col: 2
};
const COORD = [{
  k: 'prenom',
  type: 'texte',
  label: 'Prénom',
  req: 1,
  auto: 'given-name'
}, {
  k: 'nom',
  type: 'texte',
  label: 'Nom',
  req: 1,
  auto: 'family-name'
}, {
  k: 'courriel',
  type: 'courriel',
  label: 'Courriel',
  req: 1
}, {
  k: 'tel',
  type: 'tel',
  label: 'Téléphone',
  req: 1
}];
const CONSENT = {
  k: 'consent',
  type: 'case',
  req: 1,
  label: 'J\u2019accepte que ces renseignements servent uniquement à traiter cette demande et à m\u2019en informer.',
  desc: 'Vous pouvez retirer votre consentement en tout temps.'
};
const DISPOS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Matin', 'Après-midi', 'Soir'];

/* Seuls location et plainte sont routés sur le site public; les autres formulaires restent ici en attendant leur version portail locataire. */
const FORMS = {
  travaux: {
    titre: 'Nouvelle demande de {travaux}',
    lead: 'Photos, niveau d\u2019urgence et disponibilités : nous qualifions la demande et vous proposons une plage de rendez-vous.',
    etapes: [{
      t: 'Le problème',
      champs: [LOGEMENT, {
        k: 'categorie',
        type: 'select',
        label: 'Catégorie',
        req: 1,
        options: ['Plomberie', 'Électricité', 'Chauffage', 'Électroménagers', 'Portes, fenêtres et serrures', 'Parasites', 'Espaces communs', 'Autre']
      }, {
        k: 'urgence',
        type: 'choix',
        label: 'Niveau d\u2019urgence',
        req: 1,
        col: 2,
        options: [['normale', 'Normale', 'Sous 5 jours ouvrables'], ['elevee', 'Élevée', 'Sous 48 heures'], ['urgence', 'Urgence', 'Risque pour les personnes ou l\u2019immeuble']]
      }, {
        type: 'note',
        ton: 'urgence',
        icone: 'triangle-alert',
        titre: 'Urgence : appelez maintenant',
        texte: 'Composez le ' + (LL_SITE.urgence || '[numéro de garde]') + ', en tout temps. En cas de danger, faites le 911. Vous pouvez aussi terminer ce formulaire.',
        si: v => v.urgence === 'urgence'
      }]
    }, {
      t: 'Description et photos',
      champs: [{
        k: 'description',
        type: 'zone',
        label: 'Ce que vous observez',
        ph: 'Depuis quand, à quel endroit, ce que vous avez déjà essayé…',
        req: 1,
        col: 2
      }, {
        k: 'photos',
        type: 'fichiers',
        label: 'Photos ou vidéo (facultatif)',
        col: 2
      }]
    }, {
      t: 'Accès au logement',
      champs: [{
        k: 'acces',
        type: 'choix',
        label: 'Entrée dans le logement',
        req: 1,
        col: 2,
        options: [['oui', 'J\u2019autorise l\u2019entrée en mon absence', 'Le fournisseur est identifié et l\u2019heure consignée'], ['non', 'Je veux être présent', 'Nous vous proposons des plages']]
      }, {
        k: 'dispos',
        type: 'puces',
        label: 'Vos disponibilités',
        options: DISPOS,
        col: 2
      }, {
        type: 'note',
        icone: 'info',
        texte: 'Préavis de 24 heures avant toute entrée, sauf urgence (art. 1931 C.c.Q.). Les travaux ont lieu entre 7 h et 19 h.'
      }]
    }, {
      t: 'Vos coordonnées',
      champs: [...COORD, {
        k: 'avis',
        type: 'choix',
        label: 'Avis de suivi',
        req: 1,
        col: 2,
        options: [['courriel', 'Courriel'], ['texto', 'Texto'], ['deux', 'Les deux']]
      }, CONSENT]
    }],
    fin: {
      num: 'DEM-2026-0413',
      texte: 'Plage proposée : jeudi 2 octobre, de 9 h à 12 h. Vous recevrez un avis à chaque étape.',
      suite: ['Qualification par l\u2019équipe, première réponse en moins de 24 h', 'Confirmation de la plage de rendez-vous', 'Avis à chaque étape : planifiée, en cours, terminée'],
      suivi: true
    }
  },
  location: {
    titre: 'Demande de {location}',
    lead: 'Seuls les renseignements nécessaires sont demandés, avec votre consentement. Aucun dépôt ni chèque postdaté n\u2019est exigé.',
    etapes: [{
      t: 'Le logement',
      champs: [{
        k: 'logement',
        type: 'logements',
        label: 'Logement visé',
        req: 1,
        col: 2
      }, {
        k: 'date',
        type: 'dateRapide',
        label: 'Date d\u2019emménagement souhaitée',
        req: 1,
        col: 2
      }]
    }, {
      t: 'Vos coordonnées',
      champs: COORD
    }, /* S2 : le candidat choisit comment démontrer sa capacité de payer; ni revenu, ni employeur, ni NAS, ni nombre d'occupants. */
    {
      t: 'Capacité de payer',
      champs: [{
        type: 'note',
        icone: 'info',
        texte: 'Vous choisissez comment démontrer votre capacité de payer le loyer. Nous ne demandons ni votre revenu, ni votre employeur, ni votre numéro d\u2019assurance sociale. Pas d\u2019historique de crédit? Ce n\u2019est pas un motif de refus : choisissez un autre moyen.'
      }, {
        k: 'moyen',
        type: 'choix',
        label: 'Comment souhaitez-vous démontrer votre capacité de payer?',
        req: 1,
        col: 2,
        options: [['recus', 'Reçus de loyer ou factures payées', 'Reçus de loyer des 12 derniers mois, ou factures payées liées à votre logement (électricité, téléphone). Vous les transmettez après l\u2019envoi, par un lien sécurisé.'], ['references', 'Références d\u2019anciens propriétaires', 'Nous leur demandons seulement si le loyer était payé à temps.'], ['credit', 'Enquête de crédit', 'Auprès d\u2019une agence d\u2019évaluation du crédit, avec votre consentement.'], ['endosseur', 'Endosseur', 'Une personne s\u2019engage à payer le loyer si vous ne le faites pas. Elle remplit son propre formulaire.']]
      }, {
        k: 'ref1Nom',
        type: 'texte',
        label: 'Nom de l\u2019ancien propriétaire ou gestionnaire',
        req: 1,
        si: v => v.moyen === 'references'
      }, {
        k: 'ref1Contact',
        type: 'texte',
        label: 'Téléphone ou courriel',
        req: 1,
        si: v => v.moyen === 'references'
      }, {
        k: 'ref2',
        type: 'lien',
        label: 'Ajouter une deuxième référence',
        labelOn: 'Retirer la deuxième référence',
        col: 2,
        si: v => v.moyen === 'references'
      }, {
        k: 'ref2Nom',
        type: 'texte',
        label: 'Nom de l\u2019ancien propriétaire ou gestionnaire (2e référence)',
        req: 1,
        si: v => v.moyen === 'references' && v.ref2
      }, {
        k: 'ref2Contact',
        type: 'texte',
        label: 'Téléphone ou courriel (2e référence)',
        req: 1,
        si: v => v.moyen === 'references' && v.ref2
      }, {
        k: 'endosseurCourriel',
        type: 'courriel',
        label: 'Courriel de l\u2019endosseur',
        req: 1,
        col: 2,
        si: v => v.moyen === 'endosseur'
      }, {
        type: 'note',
        icone: 'mail',
        texte: 'Votre endosseur recevra le lien du formulaire d\u2019endossement.',
        si: v => v.moyen === 'endosseur'
      }]
    }, {
      t: 'Consentement',
      champs: [{
        type: 'note',
        icone: 'shield-check',
        titre: 'Ce que nous ne demandons pas',
        texte: 'Aucun dépôt ni chèque postdaté (art. 1904 C.c.Q.). Aucune pièce d\u2019identité à cette étape : vous la présentez à la signature du bail, sans qu\u2019aucune copie ne soit conservée.'
      }, {
        k: 'consentCredit',
        type: 'case',
        req: 1,
        si: v => v.moyen === 'credit',
        label: 'Je consens à ce que Lease Lane obtienne mon dossier de crédit auprès de Equifax, par le service ProprioEnquête de la CORPIQ (qui vérifie aussi les dossiers du Tribunal administratif du logement), aux seules fins d\u2019étudier cette demande.',
        desc: 'Vous pouvez retirer ce consentement tant que l\u2019enquête n\u2019est pas faite.'
      }, {
        k: 'consentRefs',
        type: 'case',
        req: 1,
        si: v => v.moyen === 'references',
        label: 'Je consens à ce que Lease Lane joigne les personnes indiquées, seulement pour savoir si le loyer était payé à temps.'
      }, CONSENT]
    }],
    fin: {
      num: 'LOC-2026-0091',
      texte: 'Votre demande est à l\u2019étude. Vous recevrez une réponse écrite, que la demande soit acceptée ou non.',
      suite: ['Vérification du moyen choisi, avec votre consentement', 'Première réponse écrite en moins de 24 h', 'Pièce d\u2019identité présentée à la signature, sans copie', 'Signature du bail en ligne si la demande est acceptée']
    }
  },
  ajout: {
    titre: 'Ajout d\u2019une personne {au bail}',
    lead: 'Colocataire signataire ou simple occupant : le propriétaire donne son accord, puis le bail est mis à jour.',
    etapes: [{
      t: 'Votre bail',
      champs: [LOGEMENT, {
        k: 'locataire',
        type: 'texte',
        label: 'Votre nom (locataire inscrit au bail)',
        req: 1
      }, {
        k: 'courriel',
        type: 'courriel',
        label: 'Votre courriel',
        req: 1
      }]
    }, {
      t: 'La personne à ajouter',
      champs: [{
        k: 'personne',
        type: 'texte',
        label: 'Nom de la personne',
        req: 1
      }, {
        k: 'arrivee',
        type: 'date',
        label: 'Date d\u2019arrivée',
        req: 1
      }, {
        k: 'statut',
        type: 'choix',
        label: 'Statut',
        req: 1,
        col: 2,
        options: [['coloc', 'Colocataire signataire', 'Signe le bail et en partage les obligations'], ['occupant', 'Occupant', 'Habite le logement sans signer le bail']]
      }, {
        k: 'courrielPersonne',
        type: 'courriel',
        label: 'Courriel de la personne ajoutée',
        req: 1,
        col: 2,
        si: v => v.statut === 'coloc'
      }]
    }, {
      t: 'Consentement',
      champs: [{
        type: 'note',
        icone: 'info',
        texte: 'La personne qui signera le bail choisit elle-même comment démontrer sa capacité de payer, comme tout candidat. Elle reçoit un lien pour le faire.',
        si: v => v.statut === 'coloc'
      }, {
        k: 'informePersonne',
        type: 'case',
        req: 1,
        label: 'J\u2019ai informé la personne ajoutée que je transmets son nom et, s\u2019il y a lieu, son courriel à Lease Lane pour cette demande.'
      }, CONSENT]
    }],
    fin: {
      num: 'BAI-2026-0034',
      texte: 'Votre demande est transmise au propriétaire.',
      suite: ['Accord écrit du propriétaire', 'Mise à jour du bail', 'Copie signée envoyée à chaque signataire']
    }
  },
  endossement: {
    titre: '{Endossement} du bail',
    lead: 'L\u2019endosseur s\u2019engage à payer le loyer et à respecter le bail si le locataire ne le fait pas. Cinq étapes, signature électronique comprise.',
    etapes: [{
      t: 'L\u2019endosseur',
      champs: [...COORD, {
        k: 'adresse',
        type: 'texte',
        label: 'Adresse',
        req: 1,
        col: 2
      }]
    }, {
      t: 'Capacité de payer',
      champs: [{
        k: 'moyen',
        type: 'choix',
        label: 'Comment souhaitez-vous démontrer votre capacité de payer?',
        req: 1,
        col: 2,
        options: [['credit', 'Enquête de crédit', 'Auprès d\u2019une agence d\u2019évaluation du crédit, avec votre consentement.'], ['recus', 'Reçus ou factures payées', 'Vous les transmettez après l\u2019envoi, par un lien sécurisé.']]
      }]
    }, {
      t: 'Le bail visé',
      champs: [LOGEMENT, {
        k: 'locataires',
        type: 'texte',
        label: 'Locataire(s) au bail',
        req: 1
      }]
    }, {
      t: 'Consentement',
      champs: [{
        type: 'note',
        icone: 'shield-check',
        titre: 'Vérification sans copie',
        texte: 'Votre identité est vérifiée par une pièce présentée en personne ou par vidéo, sans qu\u2019aucune copie ne soit conservée. Nous ne demandons jamais la carte d\u2019assurance maladie.'
      }, {
        k: 'consentCredit',
        type: 'case',
        req: 1,
        si: v => v.moyen === 'credit',
        label: 'Je consens à ce que Lease Lane obtienne mon dossier de crédit auprès de Equifax, par le service ProprioEnquête de la CORPIQ (qui vérifie aussi les dossiers du Tribunal administratif du logement), aux seules fins de cet endossement.'
      }, {
        k: 'engagement',
        type: 'case',
        req: 1,
        label: 'Je comprends que je m\u2019engage à payer le loyer et à respecter le bail si le locataire ne le fait pas.'
      }, CONSENT]
    }, {
      t: 'Signature',
      champs: [{
        k: 'signature',
        type: 'signature',
        label: 'Signez dans le cadre',
        req: 1,
        col: 2
      }, {
        k: 'nomSignature',
        type: 'texte',
        label: 'Nom complet',
        req: 1
      }]
    }],
    fin: {
      num: 'END-2026-0019',
      texte: 'Votre endossement est signé. Une confirmation écrite vous est envoyée.',
      suite: ['Vérification de l\u2019identité, sans copie', 'Confirmation écrite à l\u2019endosseur', 'Copie au locataire et au propriétaire']
    }
  },
  cession: {
    titre: 'Avis de {cession de bail} ou de {sous-location}',
    lead: 'Lisez d\u2019abord les réponses possibles du propriétaire, puis envoyez votre avis.',
    etapes: [{
      t: 'Votre demande',
      champs: [{
        k: 'type',
        type: 'choix',
        label: 'Type de demande',
        req: 1,
        col: 2,
        options: [['cession', 'Cession de bail', 'Une autre personne reprend votre bail'], ['sous', 'Sous-location', 'Vous restez locataire; une personne occupe le logement']]
      }, LOGEMENT, {
        k: 'date',
        type: 'date',
        label: 'Date visée',
        req: 1
      }]
    }, {
      t: 'La personne proposée',
      champs: [...COORD, {
        k: 'adressePersonne',
        type: 'texte',
        label: 'Adresse actuelle de la personne proposée',
        req: 1,
        col: 2,
        auto: 'street-address'
      }]
    }, {
      t: 'Avant l\u2019envoi',
      champs: [{
        type: 'note',
        ton: 'alerte',
        icone: 'triangle-alert',
        titre: 'Possibilité de résiliation (Loi 31)',
        texte: 'Pour une cession, le propriétaire peut choisir de résilier votre bail plutôt que d\u2019y consentir.',
        si: v => v.type !== 'sous'
      }, {
        k: 'lu',
        type: 'case',
        req: 1,
        label: 'J\u2019ai pris connaissance des réponses possibles du propriétaire, dont la résiliation.'
      }, {
        k: 'informeCes',
        type: 'case',
        req: 1,
        label: 'J\u2019ai informé la personne proposée que je transmets son nom, son adresse et ses coordonnées à Lease Lane pour cette demande.'
      }, {
        type: 'note',
        icone: 'info',
        texte: 'Elle recevra un lien pour consentir elle-même aux vérifications, s\u2019il y a lieu.'
      }, CONSENT]
    }],
    fin: {
      num: 'CES-2026-0011',
      texte: 'Votre avis est transmis au propriétaire.',
      suite: ['Réponse du propriétaire : accord, refus motivé ou résiliation', 'Réponse du propriétaire dans les 15 jours suivant la réception de votre avis ; sans réponse dans ce délai, il est réputé avoir consenti (art. 1871 C.c.Q.)', 'Suite confirmée par écrit']
    }
  },
  plainte: {
    titre: '{Commentaire}, {plainte} ou demande administrative',
    lead: 'Accusé de réception immédiat, puis une première réponse en moins de 24 h.',
    etapes: [{
      t: 'Votre message',
      champs: [{
        k: 'categorie',
        type: 'choix',
        label: 'Catégorie',
        req: 1,
        col: 2,
        sansDesc: 1,
        options: [['commentaire', 'Commentaire', 'Une suggestion, une appréciation'], ['plainte', 'Plainte', 'Un problème qui n\u2019est pas réglé'], ['admin', 'Demande administrative', 'Un document, une attestation, un changement'], ['partenariat', 'Partenariats', 'Une collaboration ou une proposition d\u2019affaires']]
      }, LOGEMENT, {
        k: 'description',
        type: 'zone',
        label: 'Votre message',
        req: 1,
        col: 2
      }, {
        k: 'pieces',
        type: 'fichiers',
        label: 'Pièces jointes (facultatif)',
        col: 2
      }]
    }, {
      t: 'Votre réponse',
      champs: [{
        k: 'nom',
        type: 'texte',
        label: 'Nom',
        req: 1
      }, {
        k: 'courriel',
        type: 'courriel',
        label: 'Courriel',
        req: 1
      }, {
        k: 'mode',
        type: 'choix',
        label: 'Réponse souhaitée par',
        req: 1,
        col: 2,
        options: [['courriel', 'Courriel'], ['telephone', 'Téléphone'], ['texto', 'Texto']]
      }, CONSENT]
    }],
    fin: {
      num: 'COM-2026-0128',
      texte: 'Accusé de réception envoyé.',
      suite: ['Première réponse en moins de 24 h', 'Une seule personne suit votre dossier jusqu\u2019à la fermeture']
    }
  },
  depart: {
    titre: 'Avis de {départ}',
    lead: 'Donnez votre avis dans les délais prévus au bail. Cléo planifie ensuite avec vous les visites de relocation.',
    etapes: [{
      t: 'Votre bail',
      champs: [LOGEMENT, {
        k: 'nom',
        type: 'texte',
        label: 'Nom',
        req: 1
      }, {
        k: 'courriel',
        type: 'courriel',
        label: 'Courriel',
        req: 1
      }, {
        k: 'dateDepart',
        type: 'date',
        label: 'Date de départ prévue',
        req: 1
      }, {
        k: 'raison',
        type: 'select',
        label: 'Motif',
        options: ['Fin du bail', 'Cession de bail', 'Entente de résiliation', 'Autre']
      }]
    }, {
      t: 'Visites de relocation',
      champs: [{
        k: 'acces',
        type: 'choix',
        label: 'Visites',
        req: 1,
        col: 2,
        options: [['oui', 'Visites possibles en mon absence', 'Préavis de 24 heures'], ['non', 'Je veux être présent', 'Plages convenues avec Cléo']]
      }, {
        k: 'dispos',
        type: 'puces',
        label: 'Vos disponibilités',
        options: DISPOS,
        col: 2
      }]
    }, {
      t: 'Confirmation',
      champs: [CONSENT]
    }],
    fin: {
      num: 'DEP-2026-0007',
      texte: 'Votre avis de départ est enregistré.',
      suite: ['Accusé de réception', 'Visites de relocation planifiées avec Cléo', 'Rendez-vous de remise des clés']
    }
  }
};
function Signature({
  valeur,
  onChange
}) {
  const ref = React.useRef(null),
    dessin = React.useRef(false);
  const pos = e => {
    const r = ref.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  React.useEffect(() => {
    const c = ref.current,
      d = ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.devicePixelRatio : undefined) || 1;
    c.width = c.offsetWidth * d;
    c.height = c.offsetHeight * d;
    const x = c.getContext('2d');
    x.scale(d, d);
    x.lineWidth = 2.2;
    x.lineCap = 'round';
    x.strokeStyle = '#0C2147';
  }, []);
  const debut = e => {
    dessin.current = true;
    const x = ref.current.getContext('2d');
    x.beginPath();
    x.moveTo(...pos(e));
    ref.current.setPointerCapture(e.pointerId);
  };
  const trace = e => {
    if (!dessin.current) return;
    const x = ref.current.getContext('2d');
    x.lineTo(...pos(e));
    x.stroke();
    if (!valeur) onChange(true);
  };
  const effacer = () => {
    const c = ref.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    onChange(false);
  };
  return <div style={{
    display: 'grid',
    gap: '8px'
  }}>
    <canvas ref={ref} onPointerDown={debut} onPointerMove={trace} onPointerUp={() => dessin.current = false} aria-label="Zone de signature" style={{
      width: '100%',
      height: '160px',
      border: '1px dashed var(--gris-300)',
      borderRadius: 'var(--rayon-3)',
      background: 'var(--surface-douce)',
      touchAction: 'none',
      cursor: 'crosshair'
    }} />
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '13px',
      color: 'var(--texte-discret)'
    }}><span>Signé électroniquement le {__maintenant().toLocaleDateString('fr-CA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}</span>
      <button type="button" onClick={effacer} style={{
        border: 0,
        background: 'transparent',
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'var(--police-corps)',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--texte-lien)'
      }}>Effacer</button></div></div>;
}
function Fichiers({
  valeur = [],
  onChange,
  label
}) {
  const ref = React.useRef(null);
  return <div style={{
    display: 'grid',
    gap: '8px'
  }}><span style={{
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--marine-900)'
    }}>{label}</span>
    <button type="button" onClick={() => ref.current.click()} onDragOver={e => e.preventDefault()} onDrop={e => {
      e.preventDefault();
      onChange([...valeur, ...[...e.dataTransfer.files].map(f => f.name)]);
    }} style={{
      display: 'grid',
      justifyItems: 'center',
      gap: '6px',
      padding: '26px',
      border: '1px dashed var(--gris-300)',
      borderRadius: 'var(--rayon-3)',
      background: 'var(--surface-douce)',
      cursor: 'pointer',
      fontFamily: 'var(--police-corps)'
    }}>
      <Icon name="camera" size={22} color="var(--bleu-600)" /><span style={{
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--marine-900)'
      }}>Ajouter des photos ou une vidéo</span><span style={{
        fontSize: '13px',
        color: 'var(--texte-discret)'
      }}>Glissez les fichiers ici, ou touchez pour choisir · 10 Mo max.</span></button>
    <input ref={ref} type="file" accept="image/*,video/*" multiple hidden onChange={e => onChange([...valeur, ...[...e.target.files].map(f => f.name)])} />
    {valeur.length > 0 && <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    }}>{valeur.map((n, i) => <span key={i} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '30px',
        padding: '0 12px',
        borderRadius: '999px',
        background: 'var(--bleu-025)',
        fontSize: '13px',
        color: 'var(--marine-900)'
      }}><Icon name="image" size={13} />{n}</span>)}</div>}</div>;
}
function Champ({
  c,
  v,
  set,
  err
}) {
  const val = v[c.k],
    e = err[c.k];
  const lbl = {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--marine-900)'
  };
  if (c.type === 'note') return <div style={{
    gridColumn: '1 / -1'
  }}><Note icone={c.icone} ton={c.ton || 'bleu'} titre={c.titre}>{gab(c.texte)}</Note></div>;
  const wrap = x => <div style={{
    gridColumn: c.col === 2 || c.type === 'case' ? '1 / -1' : 'auto',
    display: 'grid',
    gap: '6px'
  }}>{x}{e && (c.type === 'choix' || c.type === 'case' || c.type === 'signature') && <span role="alert" style={{
      fontSize: '13px',
      color: 'var(--urgence-600)'
    }}>{e}</span>}</div>;
  if (c.type === 'select') {
    const o = typeof c.options === 'function' ? c.options() : c.options;
    return wrap(<Select label={c.label} value={val || ''} onChange={x => set(c.k, x.target.value)} options={[{
      value: '',
      label: 'Choisir'
    }, ...o]} aide={e} />);
  }
  if (c.type === 'zone') return wrap(<label style={{
    display: 'grid',
    gap: '6px'
  }}><span style={lbl}>{c.label}</span>
    <textarea rows={5} value={val || ''} placeholder={c.ph} onChange={x => set(c.k, x.target.value)} aria-invalid={!!e} style={{
      width: '100%',
      resize: 'vertical',
      border: '1px solid ' + (e ? 'var(--urgence-500)' : 'var(--gris-300)'),
      borderRadius: 'var(--rayon-champ)',
      padding: '12px 14px',
      fontFamily: 'var(--police-corps)',
      fontSize: '15px',
      color: 'var(--marine-900)'
    }} />
    {e && <span role="alert" style={{
      fontSize: '13px',
      color: 'var(--urgence-600)'
    }}>{e}</span>}</label>);
  if (c.type === 'choix') return wrap(<div role="radiogroup" aria-label={c.label} style={{
    display: 'grid',
    gap: '8px'
  }}><span style={lbl}>{c.label}</span>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(' + (c.options[0][2] ? 200 : 120) + 'px,1fr))',
      gap: '8px'
    }}>{c.options.map(([k, t, d]) => {
        const on = val === k;
        return <button type="button" key={k} role="radio" aria-checked={on} onClick={() => set(c.k, k)} style={{
          textAlign: 'left',
          padding: d ? '14px 16px' : '0 16px',
          minHeight: '48px',
          borderRadius: 'var(--rayon-3)',
          cursor: 'pointer',
          fontFamily: 'var(--police-corps)',
          border: '1px solid ' + (on ? 'var(--marine-900)' : 'var(--gris-300)'),
          background: on ? 'var(--marine-900)' : 'var(--gris-000)',
          transition: 'var(--transition-interface)'
        }}>
        <span style={{
            display: 'block',
            fontSize: '15px',
            fontWeight: 600,
            color: on ? '#fff' : 'var(--marine-900)'
          }}>{t}</span>{d && <span style={{
            display: 'block',
            fontSize: '13px',
            marginTop: '2px',
            color: on ? 'var(--bleu-100)' : 'var(--texte-discret)'
          }}>{d}</span>}</button>;
      })}</div></div>);
  if (c.type === 'puces') return wrap(<div style={{
    display: 'grid',
    gap: '8px'
  }}><span style={lbl}>{c.label}</span><div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    }}>{c.options.map(o => {
        const on = (val || []).includes(o);
        return <button type="button" key={o} aria-pressed={on} onClick={() => set(c.k, on ? val.filter(x => x !== o) : [...(val || []), o])} style={{
          height: '40px',
          padding: '0 20px',
          borderRadius: 'var(--rayon-bouton)',
          cursor: 'pointer',
          fontFamily: 'var(--police-corps)',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '-0.005em',
          border: '1px solid ' + (on ? 'var(--marine-900)' : 'var(--gris-300)'),
          background: on ? 'var(--marine-900)' : 'var(--gris-000)',
          color: on ? '#fff' : 'var(--marine-900)'
        }}>{o}</button>;
      })}</div></div>);
  if (c.type === 'case') return wrap(<Checkbox checked={!!val} onChange={x => set(c.k, x.target.checked)} label={c.label} description={c.desc ? <span>{c.desc} <a href="/confidentialite">Politique de confidentialité</a></span> : undefined} />);
  if (c.type === 'lien') return wrap(<button type="button" onClick={() => set(c.k, !val)} style={{
    justifySelf: 'start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: 0,
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'var(--police-corps)',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--texte-lien)'
  }}><Icon name={val ? 'minus' : 'plus'} size={15} />{val ? c.labelOn || c.label : c.label}</button>);
  if (c.type === 'fichiers') return wrap(<Fichiers valeur={val} onChange={x => set(c.k, x)} label={c.label} />);
  if (c.type === 'signature') return wrap(<div style={{
    display: 'grid',
    gap: '8px'
  }}><span style={lbl}>{c.label}</span><Signature valeur={val} onChange={x => set(c.k, x)} /></div>);
  const types = {
    courriel: 'email',
    tel: 'tel',
    date: 'date',
    nombre: 'number'
  };
  return wrap(<Input label={c.label} type={types[c.type] || 'text'} placeholder={c.ph} autoComplete={c.auto} value={val || ''} onChange={x => set(c.k, x.target.value)} erreur={e} />);
}
function FormEtapes(props) {
  if (!undefined) return <FormEtapesP {...props} />;
  return <FormEtapesBase {...props} />;
}
function FormEtapesBase({
  cfg,
  onEtape,
  sansEntete
}) {
  const [i, setI] = React.useState(0),
    [v, setV] = React.useState({}),
    [err, setErr] = React.useState({}),
    [fini, setFini] = React.useState(false);
  React.useEffect(() => {
    onEtape && onEtape(fini ? -1 : i);
  }, [i, fini]);
  const haut = React.useRef(null);
  const set = (k, x) => {
    setV(p => ({
      ...p,
      [k]: x
    }));
    if (err[k]) setErr(p => {
      const n = {
        ...p
      };
      delete n[k];
      return n;
    });
  };
  const etape = cfg.etapes[i],
    champs = etape.champs.filter(c => !c.si || c.si(v));
  const valider = () => {
    const e = {};
    champs.forEach(c => {
      if (!c.k) return;
      const x = v[c.k];
      if (c.req && (x === undefined || x === '' || x === false || Array.isArray(x) && !x.length)) e[c.k] = c.type === 'case' ? 'Ce consentement est requis.' : c.type === 'signature' ? 'Votre signature est requise.' : 'Ce champ est requis.';else if (c.type === 'courriel' && x && !/^\S+@\S+\.\S+$/.test(x)) e[c.k] = 'Adresse courriel invalide.';else if (c.type === 'tel' && x && x.replace(/\D/g, '').length < 10) e[c.k] = 'Numéro à 10 chiffres.';
    });
    setErr(e);
    return !Object.keys(e).length;
  };
  const remonter = () => {
    const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;
    if (sc && haut.current) sc.scrollTop = Math.max(0, haut.current.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 132);
  };
  const suivant = e => {
    e.preventDefault();
    if (!valider()) return;
    if (i < cfg.etapes.length - 1) {
      setI(i + 1);
      setTimeout(remonter, 30);
    } else {
      setFini(true);
      setTimeout(remonter, 30);
    }
  };
  if (fini) return <div ref={haut} role="status" style={{
    display: 'grid',
    gap: '18px'
  }}>
    <span style={{
      width: '56px',
      height: '56px',
      borderRadius: '999px',
      background: 'var(--succes-100)',
      display: 'grid',
      placeItems: 'center'
    }}><Icon name="circle-check" size={26} color="var(--succes-600)" /></span>
    <div><span style={{
        fontSize: '13px',
        color: 'var(--texte-discret)'
      }}>Numéro de dossier</span><div style={{
        fontFamily: 'ui-monospace,monospace',
        fontSize: '22px',
        fontWeight: 700,
        color: 'var(--marine-900)'
      }}>{cfg.fin.num}</div></div>
    <h2 style={{
      fontSize: '26px'
    }}>Demande reçue{v.prenom ? ', merci ' + v.prenom : ''}.</h2><p style={{
      margin: 0,
      fontSize: '14px'
    }}>{gab(cfg.fin.texte)}</p>
    <ol style={{
      margin: 0,
      paddingLeft: '20px',
      display: 'grid',
      gap: '8px',
      fontSize: '15px'
    }}>{cfg.fin.suite.map(s => <li key={s}>{gab(s)}</li>)}</ol>
    <div style={{
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      marginTop: '6px'
    }}>
      {cfg.fin.suivi && <Button variant="primaire" size="l" onClick={() => {
        sessionStorage.setItem('ll-suivi', cfg.fin.num);
        naviguer('/locataires/suivi');
      }}>Suivre ma demande</Button>}
      <Button variant="secondaire" size="l" onClick={() => naviguer('/locataires')}>Service aux locataires</Button></div></div>;
  return <form ref={haut} onSubmit={suivant} noValidate style={{
    display: 'grid',
    gap: '26px'
  }}>
    {sansEntete ? <h2 style={{
      margin: 0,
      fontSize: '24px',
      letterSpacing: '-0.02em',
      color: 'var(--marine-900)'
    }}>{etape.t}</h2> : <div style={{
      display: 'grid',
      gap: '12px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '13px'
      }}><span style={{
          fontWeight: 600,
          color: 'var(--marine-900)'
        }}>{etape.t}</span><span style={{
          color: 'var(--texte-discret)'
        }}>Étape {i + 1} sur {cfg.etapes.length}</span></div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(' + cfg.etapes.length + ',minmax(0,1fr))',
        gap: '6px'
      }} aria-hidden="true">{cfg.etapes.map((x, j) => <span key={j} style={{
          height: '4px',
          borderRadius: '999px',
          background: j <= i ? 'var(--bleu-500)' : 'var(--gris-100)',
          transition: 'background var(--duree-3) var(--courbe-sortie)'
        }} />)}</div>
    </div>}
    <div className="ll-champs" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: 'var(--carte-ecart)'
    }}>{champs.map((c, j) => <Champ key={(c.k || 'n') + j} c={c} v={v} set={set} err={err} />)}</div>
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap',
      paddingTop: '8px',
      borderTop: FF
    }}>
      {i > 0 && <Button variant="fantome" size="l" type="button" onClick={() => {
        setI(i - 1);
        setErr({});
      }} iconeAvant={<Icon name="arrow-left" size={16} />}>Retour</Button>}
      <span style={{
        flex: 1
      }} />
      <Button variant="primaire" size="l" type="submit" iconeApres={<Icon name={i < cfg.etapes.length - 1 ? 'arrow-right' : 'send'} size={16} />}>{i < cfg.etapes.length - 1 ? 'Continuer' : 'Envoyer'}</Button></div>
  </form>;
}
function Loi31() {
  return <Section fond="douce">
    <TitreBloc surtitre="Avant d'envoyer votre avis" titre="Ce que le propriétaire {peut répondre}." texte="Résumé de la Loi 31, adoptée en 2024. Texte à faire valider avant la mise en ligne." />
    <Cartes items={[['circle-check', 'Il consent à la cession', 'La personne proposée devient locataire et vous êtes libéré du bail.'], ['x', 'Il refuse pour un motif sérieux', 'Il doit vous donner la raison par écrit; vous restez locataire.'], ['log-out', 'Il choisit de résilier le bail', 'Depuis la Loi 31, il peut, au lieu de consentir à la cession, mettre fin au bail. Vous quittez le logement à la date convenue.']]} />
    <div style={{
      marginTop: '20px'
    }}><Note icone="info" titre="Sous-location">Vous restez responsable du bail. Le propriétaire ne peut refuser la sous-location sans motif sérieux.</Note></div>
  </Section>;
}
function PageFormulaire({
  route
}) {
  const cfg = FORMS[route.form];
  if (GabaritDemande) return <GabaritDemande route={route} titre={cfg.titre} lead={cfg.lead} pastilles={[['file-text', cfg.etapes.length + ' étapes'], ['message-circle', 'Aide de Cléo en tout temps']]} etapes={cfg.etapes.map(e => e.t)} suite={cfg.fin.suite} aside={route.form === 'travaux' ? <Fleche to="/locataires/suivi">Suivre une demande existante</Fleche> : null} apres={<React.Fragment>{route.form === 'cession' && <Loi31 />}{route.faq && <FAQListe ids={route.faq} titre="{À savoir} avant d'envoyer." />}</React.Fragment>}>
    <FormEtapes key={route.path} cfg={cfg} /></GabaritDemande>;
  return <div>
    <BandeauPage compact route={route} surtitre={route.phase === 2 ? 'Service aux locataires · phase 2' : 'Service aux locataires'} titre={cfg.titre} lead={cfg.lead} />
    {route.form === 'cession' && <Loi31 />}
    <Section>
      <div className="ll-deux" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)',
        gap: '48px',
        alignItems: 'start'
      }}>
        <div style={{
          background: 'var(--gris-000)',
          border: FF,
          borderRadius: 'var(--rayon-carte)',
          padding: 'clamp(20px,3vw,40px)',
          boxShadow: 'var(--ombre-2)'
        }}><FormEtapes key={route.path} cfg={cfg} /></div>
        <aside style={{
          display: 'grid',
          gap: '16px'
        }}>
          <div style={{
            background: 'var(--surface-douce)',
            borderRadius: 'var(--rayon-carte)',
            padding: '24px',
            display: 'grid',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}><img src="/assets/img/cleo-avatar.png" alt="" style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                objectFit: 'cover'
              }} />
              <span style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--marine-900)'
              }}>Besoin d'aide?</span></div>
            <p style={{
              margin: 0,
              fontSize: '14px'
            }}>Cléo peut vous guider dans cette demande, en tout temps.</p>
            <Button variant="secondaire" size="m" onClick={() => ouvrirCleo()} iconeAvant={<Icon name="message-square" size={15} />}>Écrire à Cléo</Button></div>
          <Note icone="triangle-alert" ton="urgence" titre="Urgence">Composez le <a href={LL_TEL_URGENCE()} style={{
              color: 'inherit',
              fontWeight: 700
            }}>{gab(LL_SITE.urgence)}</a>, en tout temps. En cas de danger, faites le 911.</Note>
          <Note icone="shield-check" titre="Vos renseignements">Seulement ce qui est nécessaire, conservé pour une durée limitée (Loi 25). <a href="/confidentialite">En savoir plus</a></Note>
          {route.form === 'travaux' && <Fleche to="/locataires/suivi">Suivre une demande existante</Fleche>}
        </aside>
      </div>
    </Section>
    {route.faq && <FAQListe ids={route.faq} fond="douce" titre="{À savoir} avant d'envoyer." />}
  </div>;
}
export { FF, LOGEMENT, COORD, CONSENT, DISPOS, FORMS, Signature, Fichiers, Champ, FormEtapes, FormEtapesBase, Loi31, PageFormulaire, Signature as FE_Signature, Fichiers as FE_Fichiers };
