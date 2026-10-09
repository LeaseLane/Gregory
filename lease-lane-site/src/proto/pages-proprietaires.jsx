/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pages-proprietaires.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { CONT, FilAriane, gab, Exemple, TitreBloc, Coches, FormOffre, BoutonLien, Fleche, Cartes, MentionJuridique } from '@/proto/blocs';
import { Section } from '@/proto/accueil';
import { FAQSujets } from '@/proto/sections-accueil';
import { PageGestionB } from '@/proto/pages-proprio-b';
import { GabaritDemande } from '@/proto/demande';
import { __ssr } from '@/lib/hydratation';

/* Pages propriétaires : Gestion d'immeubles (page mère), Location et mise en marché, Expertise et stratégie, Changer de gestionnaire, Offre de service.
   Aucun tarif sur le site public : l'offre est préparée pour chaque immeuble.
   Deux options par page, même contenu (PPC) : A « Repère clair » (ce fichier) et B « Chapitres marine » (pages-proprio-b.jsx).
   La bascule A/B en bas à gauche est un outil de revue, retiré à la mise en ligne. */
const FP = '1px solid var(--bordure-fine)';
const O1P = '0 1px 2px rgba(12,33,71,.05),0 12px 32px rgba(12,33,71,.08)',
  O2P = '0 2px 4px rgba(12,33,71,.06),0 24px 56px rgba(12,33,71,.14)';

/* ——— Contenu partagé par les deux options ——— */
const PPC = {
  gestion: {
    titre: 'Compagnie de gestion immobilière à {Québec} : choisir Lease Lane, c\u2019est vous donner {une clé d\u2019avance} en permanence.',
    lead: 'Lease Lane n\u2019est pas une gestion immobilière standard. C\u2019est une plateforme automatisée et propulsée par l\u2019IA qui permet aux propriétaires et aux locataires d\u2019économiser un temps précieux et d\u2019optimiser de façon conséquente les différents processus en lien avec la gestion d\u2019immeubles à Québec.',
    main: ['Le choix de chaque locataire', 'Les travaux au-delà de votre seuil', 'La hausse de loyer annuelle', 'Tout recours au TAL'],
    pourQui: [['house', 'Plex de 2 à 5 logements', 'Le cœur de notre offre : un propriétaire qui veut déléguer sans perdre de vue son immeuble.'], ['building-2', 'Immeubles de 6 logements et plus', 'Location, entretien et perception à l’échelle, avec un rapport par immeuble.'], ['layers', 'Portefeuilles', 'Plusieurs immeubles, un seul tableau de bord et un rapport consolidé chaque mois.']],
    volets: [['key', 'Logements loués', 'Mise en marché, visites réservées par Cléo, sélection conforme et bail signé.'], ['banknote', 'Loyers encaissés', 'Perception, reçus, relances automatiques et suivi des retards jusqu’au TAL.'], ['wrench', 'Immeuble entretenu', 'Demandes qualifiées, fournisseurs vérifiés, travaux suivis jusqu’à la fermeture.'], ['chart-column', 'Chiffres visibles', 'Rapport mensuel et tableau de bord : chaque dossier, chaque décision.']],
    cleo: [['scale', 'Le TAL expliqué', 'Avis, délais, fixation de loyer, recours : Cléo explique les règles du Code civil et du TAL à vos locataires comme à vous, avec leur source.'], ['message-square', 'Réponse en tout temps', 'Propriétaires, locataires et prospects reçoivent une réponse 24/7, en français d’abord.'], ['calendar-check', 'Visites réservées hors des heures de bureau', 'Deux créneaux proposés, une confirmation écrite, des rappels 24 h et 2 h avant : moins de jours vacants.'], ['users', 'Relais humain', 'Urgence, litige, reprise ou éviction : une personne reprend le fil, et Cléo annonce à qui, pourquoi et dans quel délai.']],
    engagements: [['2 min', 'Réponse aux locataires', 'Cléo, 24 heures sur 24'], ['4 h', 'Demande de travaux qualifiée', 'en heures ouvrables'], ['le 15', 'Rapport mensuel', 'au plus tard, chaque mois'], ['72 h', 'Logement vacant en ligne', 'après la remise des clés']]
  },
  location: {
    titre: 'Trouver des locataires rapidement, sans perdre {un mois de loyer}.',
    lead: 'Fiche soignée, visites réservées par Cléo en tout temps, sélection conforme à la Loi 25 et bail signé : chaque jour vacant compte.',
    marche: [['camera', 'Photos et fiche', 'Photos [à confirmer], description précise, inclusions et date de disponibilité.'], ['search', 'Une adresse par logement', 'Chaque fiche a sa propre page, trouvable dans les moteurs de recherche.'], ['share-2', 'Diffusion', 'Publication sur [canaux à confirmer], avec un lien vers la fiche.'], ['calendar-check', 'Visites en ligne', 'Cléo propose deux créneaux, confirme la visite par écrit et envoie un rappel 24 h et 2 h avant.']],
    selection: ['Identité vérifiée, sans conserver de copie de pièce', 'Emploi et revenus', 'Références des propriétaires précédents', 'Enquête de crédit, avec consentement écrit', 'Aucun dépôt ni chèque postdaté exigé (art. 1904 C.c.Q.)'],
    arrivee: [['circle-check', 'Offre acceptée', 'Le candidat retenu est avisé par écrit; les autres reçoivent une réponse.'], ['pencil', 'Bail signé', 'Sur le formulaire obligatoire du Tribunal administratif du logement, avec signature électronique.'], ['key', 'Inspection et clés', 'État des lieux photographié, remise des clés à la date convenue.'], ['house', 'Accueil du locataire', 'Accès au service aux locataires, à Cléo et au paiement du loyer dès le premier jour.']]
  },
  expertise: {
    titre: '{Stratégie immobilière} pour votre immeuble locatif : des décisions appuyées sur {ses chiffres}.',
    lead: 'Loyers, occupation, entretien et conformité : nous analysons votre immeuble, proposons un plan écrit et mesurons les résultats chaque mois. Vous décidez à partir de données vérifiables.',
    domaines: [['chart-column', 'Positionnement des loyers', 'Comparaison avec les logements semblables du secteur et calcul de la hausse annuelle selon la méthode du TAL.'], ['key', 'Occupation et rotation', 'Délai de location, renouvellements et motifs de départ suivis logement par logement, pour réduire les jours vacants.'], ['wrench', 'Entretien planifié', 'Inspection annuelle et plan de travaux sur [nombre d’années à confirmer] ans, classé par urgence et par effet sur la valeur.'], ['shield-check', 'Conformité', 'Bail du TAL, Loi 25, Loi 31 : chaque décision est vérifiée et documentée au dossier.'], ['file-text', 'Dossiers au TAL', 'Retards, hausses contestées, cessions : dossier préparé avec votre accord et suivi jusqu’à la décision.'], ['layers', 'Portefeuille', 'Plusieurs immeubles : priorités comparées et plan consolidé, immeuble par immeuble.']],
    methode: [['search', 'Diagnostic de l’immeuble', 'Visite, lecture des baux et des historiques : loyers, occupation, état du bâtiment et échéances.', 'Semaines 1 et 2 · exemple'], ['file-text', 'Plan écrit', 'Priorités, échéancier et effets attendus sur l’occupation et l’entretien, présentés en rencontre.', 'Semaine 3 · exemple'], ['circle-check', 'Mise en œuvre', 'Chaque action passe par votre approbation en ligne; nous coordonnons fournisseurs, avis et dossiers.', 'En continu'], ['chart-column', 'Mesure mensuelle', 'Le rapport du 15 montre où en est chaque action et ce qu’elle a changé.', 'Chaque mois']],
    indicateurs: [['98,6 %', 'Taux d’occupation', 'moyenne des douze derniers mois'], ['17 jours', 'Délai de location', 'de la mise en ligne au bail signé'], ['94 %', 'Baux renouvelés', 'à leur échéance'], ['4 h', 'Demande qualifiée', 'en heures ouvrables']],
    comparatif: [['Appels et messages des locataires', 'Vous, soirs et fins de semaine compris', 'Cléo 24/7, relais humain au besoin'], ['Logement vacant', 'Annonces, visites et appels à votre charge', 'Visites réservées par Cléo, sélection conforme'], ['Retards de paiement', 'Relances à faire vous-même', 'Rappels automatiques, dossier au TAL avec votre accord'], ['Fournisseurs', 'À trouver et à vérifier', 'Fournisseurs vérifiés : licence RBQ, assurances'], ['Conformité : TAL, Loi 25, Loi 31', 'À suivre seul', 'Appliquée et documentée au dossier'], ['Temps consacré', '8 à 12 h par mois [exemple]', 'Quelques approbations en ligne']]
  },
  changer: {
    titre: 'Changer de gestionnaire immobilier, {sans interruption} pour vos locataires.',
    lead: 'Nous lisons votre contrat, récupérons baux, dossiers et clés, avisons les locataires et activons Cléo. Vous recevez votre premier rapport à la fin du premier mois.',
    etapes: [['file-text', 'Lecture du contrat actuel', 'Nous repérons la durée, le préavis et les clauses de fin, puis préparons l’avis à votre gestionnaire actuel.', 'Semaine 1 · exemple'], ['share-2', 'Transfert complet', 'Baux, dossiers des locataires, clés, contrats de service et historiques des travaux et des paiements.', 'Semaines 2 et 3 · exemple'], ['message-square', 'Avis aux locataires et Cléo', 'Chaque locataire reçoit un avis clair : nouveaux contacts, paiement du loyer, demandes. Cléo répond dès le premier jour.', 'Semaine 3 · exemple'], ['chart-column', 'Premier rapport', 'Loyers, arriérés, demandes ouvertes et calendrier des échéances : un état complet de votre immeuble.', 'Fin du premier mois · exemple']],
    quiFait: [['Contrat actuel', 'Lecture, calcul du préavis, modèle d’avis de fin', 'Copie du contrat, signature de l’avis'], ['Baux et dossiers', 'Récupération, numérisation, classement', 'Autorisation de transfert'], ['Clés et accès', 'Inventaire et garde sécurisée', 'Codes et accès connus'], ['Contrats de service', 'Reprise ou renégociation : déneigement, entretien', 'Liste des contrats en cours'], ['Locataires', 'Avis de changement, activation de Cléo', '—'], ['Comptes et versements', 'Ouverture du compte [à confirmer], premier rapport', 'Coordonnées bancaires']],
    verif: [['01', 'Lecture du contrat actuel', ['Durée du contrat repérée', 'Préavis et clauses de fin repérés', 'Avis de fin préparé pour votre gestionnaire actuel'], 'Copie du contrat, signature de l’avis'], ['02', 'Transfert complet', ['Baux', 'Dossiers des locataires', 'Clés et accès : inventaire et garde sécurisée', 'Contrats de service : déneigement, entretien', 'Historiques des travaux et des paiements'], 'Autorisation de transfert, codes et accès connus, liste des contrats en cours'], ['03', 'Avis aux locataires et Cléo', ['Avis à chaque locataire : nouveaux contacts, paiement du loyer, demandes', 'Cléo actif dès le premier jour'], null], ['04', 'Premier rapport', ['Loyers et arriérés', 'Demandes ouvertes', 'Calendrier des échéances'], 'Coordonnées bancaires']],
    citation: ['Le changement s’est fait en un mois. Les locataires ont reçu l’avis et Cléo a pris le relais le jour même.', 'Sylvie et Robert L.', 'Trois immeubles, 22 portes · ancien gestionnaire pendant 9 ans']
  }
};

/* ——— Types d'immeubles : pictogramme = un carré par logement (rangées du haut vers le bas), toit en pignon pour les maisons ——— */
const PP_TYPES = [{
  n: 'Maison unifamiliale',
  u: '1 logement',
  r: [1],
  toit: 1
}, {
  n: 'Jumelé et maison en rangée',
  u: '2 logements et plus',
  r: [1],
  toit: 1,
  maisons: 2
}, {
  n: 'Duplex',
  u: '2 logements',
  r: [1, 1]
}, {
  n: 'Triplex',
  u: '3 logements',
  r: [1, 1, 1]
}, {
  n: 'Quadruplex',
  u: '4 logements',
  r: [2, 2]
}, {
  n: 'Quintuplex',
  u: '5 logements',
  r: [1, 2, 2]
}, {
  n: 'Multilogement',
  u: '6 à 11 logements',
  r: [3, 3, 3]
}, {
  n: 'Immeuble à logements',
  u: '12 logements et plus',
  r: [4, 4, 4, 4, 4]
}, {
  n: 'Condo en location',
  u: '1 unité ou plus',
  r: [3, 3, 3, 3],
  condo: 1
}];
function Pictogramme({
  t,
  sombre,
  h = 110
}) {
  const big = t.r.length >= 5,
    W = big ? 16 : 18,
    H = big ? 11 : 14,
    G = big ? 4 : 5,
    P = big ? 7 : 9,
    cols = Math.max(...t.r),
    bw = cols * W + (cols - 1) * G + P * 2,
    bh = t.r.length * H + (t.r.length - 1) * G + P * 2,
    toitH = t.toit ? 22 : 0,
    nb = t.maisons || 1,
    gap = 10;
  const total = nb * bw + (nb - 1) * gap,
    x0 = (140 - total) / 2,
    y0 = 104 - bh;
  const trait = sombre ? '#fff' : 'var(--marine-900)',
    corps = sombre ? 'rgba(255,255,255,.06)' : '#fff',
    on = sombre ? 'var(--bleu-300)' : 'var(--bleu-500)',
    off = sombre ? 'rgba(200,218,240,.22)' : 'var(--bleu-100)';
  return <svg viewBox="0 0 140 110" width="100%" height={h} aria-hidden="true">
    <line x1="10" x2="130" y1="104.5" y2="104.5" stroke={sombre ? 'rgba(200,218,240,.3)' : 'var(--bleu-200)'} strokeWidth="1" />
    {Array.from({
      length: nb
    }).map((_, m) => {
      const bx = x0 + m * (bw + gap);
      let k = 0;
      return <g key={m}>{t.toit && <polygon points={bx - 4 + ',' + y0 + ' ' + (bx + bw / 2) + ',' + (y0 - toitH) + ' ' + (bx + bw + 4) + ',' + y0} fill={trait} />}
        <rect x={bx} y={y0} width={bw} height={bh} rx="2" fill={corps} stroke={trait} strokeWidth="1.5" />
        {t.r.map((c, ri) => Array.from({
          length: c
        }).map((_, ci) => {
          k++;
          const rw = c * W + (c - 1) * G,
            ox = bx + (bw - rw) / 2;
          const allume = !t.condo || k === 6;
          return <rect key={ri + '-' + ci} x={ox + ci * (W + G)} y={y0 + P + ri * (H + G)} width={W} height={H} rx="2" fill={allume ? on : off} />;
        }))}</g>;
    })}
  </svg>;
}
/* Trois présentations à comparer (bascule de revue au-dessus de la grille) :
   1 Cartes · 2 La rue (bande marine, tous les immeubles sur un même sol) · 3 Par taille (trois familles de trois). */
const PP_TYPES_OPT = [['cartes', '1 · Cartes'], ['rue', '2 · La rue'], ['familles', '3 · Par taille']];
const PP_FAMILLES = [['Maisons et condos', 'Un logement à la fois', [0, 1, 8]], ['Plex', '2 à 4 logements', [2, 3, 4]], ['Immeubles', '5 logements et plus', [5, 6, 7]]];
function TypesImmeubles() {
  const [o, setO] = React.useState(() => {
    try {
      return null || 'cartes';
    } catch (e) {
      return 'cartes';
    }
  });
  const choisir = v => {
    try {
      void 0;
    } catch (e) {}
    setO(v);
  };
  const bascule = <div role="group" aria-label="Présentation des types d’immeubles (revue)" style={{
    justifySelf: 'start',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    padding: '4px',
    borderRadius: '999px',
    border: '1px dashed var(--bleu-300)',
    background: 'var(--bleu-025)'
  }}>
    {PP_TYPES_OPT.map(([k, n]) => <button key={k} type="button" aria-pressed={o === k} onClick={() => choisir(k)} style={{
      height: '36px',
      padding: '0 14px',
      border: 0,
      borderRadius: 'var(--rayon-bouton)',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: '13px',
      fontWeight: 600,
      background: o === k ? 'var(--marine-900)' : 'transparent',
      color: o === k ? '#fff' : 'var(--marine-900)'
    }}>{n}</button>)}</div>;
  let corps;
  if (o === 'rue') corps = <div className="ll-sombre" style={{
    borderRadius: '20px',
    background: 'var(--degrade-marine)',
    padding: '32px 8px 0'
  }}>
    <ul className="pp-rue" style={{
      listStyle: 'none',
      margin: 0,
      padding: '0 8px',
      display: 'grid',
      gridTemplateColumns: 'repeat(9,minmax(0,1fr))',
      columnGap: '6px'
    }}>
      {PP_TYPES.map(t => <li key={t.n} style={{
        display: 'grid',
        gap: '14px',
        alignContent: 'end',
        justifyItems: 'center',
        textAlign: 'center',
        padding: '0 0 24px',
        minWidth: 0
      }}>
        <Pictogramme t={t} sombre h={92} />
        <span style={{
          display: 'grid',
          gap: '4px'
        }}><span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.3
          }}>{t.n}</span><span style={{
            fontSize: '12px',
            color: 'var(--bleu-100)'
          }}>{t.u}</span></span></li>)}
    </ul></div>;else if (o === 'familles') corps = <div className="pp-types" style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
    gap: '16px'
  }}>
    {PP_FAMILLES.map(([f, d, ids]) => <section key={f} style={{
      background: '#fff',
      border: FP,
      borderRadius: '20px',
      padding: '24px',
      display: 'grid',
      gap: '4px',
      alignContent: 'start'
    }}>
      <h3 style={{
        margin: 0,
        fontSize: '20px',
        letterSpacing: '-0.015em',
        color: 'var(--marine-900)'
      }}>{f}</h3>
      <span style={{
        fontSize: '13px',
        color: 'var(--texte-discret)',
        marginBottom: '12px'
      }}>{d}</span>
      <ul style={{
        listStyle: 'none',
        margin: 0,
        padding: 0
      }}>{ids.map(i => {
          const t = PP_TYPES[i];
          return <li key={t.n} style={{
            display: 'grid',
            gridTemplateColumns: '72px minmax(0,1fr)',
            gap: '14px',
            alignItems: 'center',
            padding: '10px 0',
            borderTop: FP
          }}>
        <span style={{
              borderRadius: '12px',
              background: 'var(--bleu-025)',
              padding: '4px 2px 0'
            }}><Pictogramme t={t} h={56} /></span>
        <span style={{
              display: 'grid',
              gap: '2px'
            }}><span style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--marine-900)',
                lineHeight: 1.3
              }}>{t.n}</span><span style={{
                fontSize: '13px',
                color: 'var(--texte-discret)'
              }}>{t.u}</span></span></li>;
        })}</ul>
    </section>)}</div>;else corps = <ul style={{
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
    gap: '16px'
  }} className="pp-types">
    {PP_TYPES.map(t => <li key={t.n} className="lls-carte" style={{
      background: '#fff',
      border: FP,
      borderRadius: '16px',
      overflow: 'hidden',
      display: 'grid'
    }}>
      <div style={{
        background: 'var(--bleu-025)',
        padding: '16px 12px 0'
      }}><Pictogramme t={t} /></div>
      <div style={{
        padding: '16px 18px 18px',
        display: 'grid',
        gap: '4px'
      }}><span style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--marine-900)',
          lineHeight: 1.3
        }}>{t.n}</span><span style={{
          fontSize: '13px',
          color: 'var(--texte-discret)'
        }}>{t.u}</span></div></li>)}
  </ul>;
  return <div style={{
    display: 'grid',
    gap: '20px'
  }}>{bascule}{corps}</div>;
}

/* ——— Services offerts, par volet (texte fourni par Lease Lane) ——— */
const PP_SERVICES = [{
  k: 'location',
  ic: 'key',
  t: 'Location',
  items: ['Visites illimitées', 'Prise de photos', 'Montage d\'une fiche offre de location', 'Constat des lieux (Recommandations au propriétaire selon l\'état du logement)', 'Enquête de crédit/Enquête Tribunal Administratif du logement', 'Campagnes numériques (Google Ads, Facebook Ads)', 'Visibilité organique via notre site web (+100 000 utilisateurs annuels recherchant un appartement)', 'Publicité Facebook Marketplace', 'Affichage sur la bâtisse et le balcon', 'Signature du bail', 'Remise des clés', 'Suivi aménagement']
}, {
  k: 'gestion',
  ic: 'building-2',
  t: 'Gestion',
  items: ['Collecte des loyers', 'Dépôts des loyers dans votre compte bancaire', 'Suivi serré des loyers en délinquances et recouvrements', 'Accès à notre groupe d\u2019achat d\u2019assurance pour vos immeubles', 'Communications avec les locataires (Question, demande de travaux, etc)', 'Renouvellement des baux et relevé 31', 'Suivi des plaintes de locataires et/ou autorité gouvernementale']
}, {
  k: 'compta',
  ic: 'banknote',
  t: 'Comptabilité',
  items: ['Tenue de livre (Revenus/Dépenses)', 'Paiement des factures', 'Rapport et paiement - gouvernement (TPS/TVQ)', 'Paiement des taxes (municipales, Scolaires, TPS/TVQ)', 'Rapports mensuels fournis au client']
}, {
  k: 'entretien',
  ic: 'wrench',
  t: 'Entretien',
  items: ['Travaux entretien/réparation', 'Service d\u2019urgence 24h/24h', 'Rénovation de logement', 'Rénovation extérieure', 'Planification de travaux', 'Demande de soumission et gestion des sous-traitants']
}];
function PanneauService({
  s,
  sombre
}) {
  const fil = sombre ? '1px solid rgba(200,218,240,.16)' : FP;
  return <section aria-labelledby={'svc-' + s.k} className={(sombre ? 'll-sombre ' : '') + 'lls-carte'} style={{
    position: 'relative',
    overflow: 'hidden',
    background: sombre ? 'var(--degrade-marine,var(--marine-900))' : '#fff',
    border: sombre ? 'none' : FP,
    borderRadius: '20px',
    padding: '28px 28px 20px',
    display: 'grid',
    gap: '20px',
    alignContent: 'start',
    boxShadow: sombre ? '0 20px 48px rgba(12,33,71,.22)' : '0 1px 2px rgba(12,33,71,.04),0 12px 32px rgba(12,33,71,.06)'
  }}>
    {sombre && <div aria-hidden="true" style={{
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(70% 80% at 100% 0%,rgba(91,154,232,.28),transparent 60%)',
      pointerEvents: 'none'
    }} />}
    <header style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: '52px minmax(0,1fr)',
      alignItems: 'center',
      gap: '16px',
      paddingBottom: '20px',
      borderBottom: fil
    }}>
      <span aria-hidden="true" style={{
        width: '52px',
        height: '52px',
        borderRadius: '14px',
        background: sombre ? 'rgba(255,255,255,.12)' : 'var(--marine-900)',
        display: 'grid',
        placeItems: 'center'
      }}><Icon name={s.ic} size={22} color={sombre ? '#fff' : 'var(--bleu-300)'} /></span>
      <h3 id={'svc-' + s.k} style={{
        margin: 0,
        fontSize: '24px',
        lineHeight: 1.322,
        letterSpacing: '-0.02em',
        color: sombre ? '#fff' : 'var(--marine-900)'
      }}>{s.t}</h3></header>
    <ul style={{
      position: 'relative',
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'grid'
    }}>{s.items.map((it, j) => <li key={it} style={{
        display: 'grid',
        gridTemplateColumns: '22px minmax(0,1fr)',
        gap: '12px',
        alignItems: 'start',
        padding: '10px 0',
        borderTop: j ? fil : 'none',
        fontSize: '14px',
        lineHeight: 1.5,
        color: sombre ? '#fff' : 'var(--marine-900)'
      }}>
      <span aria-hidden="true" style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: sombre ? 'rgba(255,255,255,.14)' : 'var(--bleu-025)',
          display: 'grid',
          placeItems: 'center'
        }}><Icon name="check" size={13} color={sombre ? 'var(--bleu-300)' : 'var(--bleu-600)'} /></span><span>{it}</span></li>)}</ul>
  </section>;
}
function ServicesOfferts() {
  const [loc, ges, cpt, ent] = PP_SERVICES;
  return <div className="ll-deux" style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
    gap: '20px',
    alignItems: 'start'
  }}>
    <div style={{
      display: 'grid',
      gap: '20px'
    }}><PanneauService s={loc} sombre /><PanneauService s={cpt} /></div>
    <div style={{
      display: 'grid',
      gap: '20px'
    }}><PanneauService s={ges} /><PanneauService s={ent} /></div>
  </div>;
}

/* ——— Bascule d'option (revue) ——— */
const PP_OPTIONS = {
  a: 'Repère clair',
  b: 'Chapitres marine'
};
function useOptionPage(page) {
  const k = 'll-option-' + page,
    [o, setO] = React.useState(() => {
      try {
        return null || 'a';
      } catch (e) {
        return 'a';
      }
    });
  return [o, v => {
    try {
      void 0;
    } catch (e) {}
    setO(v);
    const s = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;
    if (s) s.scrollTo(0, 0);
  }];
}
function BasculeOption({
  o,
  set
}) {
  return <div role="group" aria-label="Option de design de la page" style={{
    position: 'fixed',
    left: '24px',
    bottom: '24px',
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 6px 6px 16px',
    borderRadius: '999px',
    background: 'var(--marine-900)',
    boxShadow: '0 12px 32px rgba(12,33,71,.28)'
  }}>
    <span style={{
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--bleu-200)',
      marginRight: '6px'
    }}>Option</span>
    {Object.entries(PP_OPTIONS).map(([k, n]) => <button key={k} type="button" aria-pressed={o === k} onClick={() => set(k)} title={n} style={{
      height: '40px',
      padding: '0 16px',
      border: 0,
      borderRadius: 'var(--rayon-bouton)',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: '13px',
      fontWeight: 600,
      background: o === k ? '#fff' : 'transparent',
      color: o === k ? 'var(--marine-900)' : '#fff'
    }}>{k.toUpperCase()} · {n}</button>)}
  </div>;
}
/* Pages figées : option retenue, sans bascule. */
const PP_FIGEES = {
  gestion: 'b',
  location: 'b',
  expertise: 'b',
  changer: 'b'
};
function AvecOptions({
  page,
  route,
  A,
  B
}) {
  const [o, set] = useOptionPage(page),
    fige = PP_FIGEES[page],
    v = fige || o;
  const P = v === 'b' && B ? B : A;
  return <React.Fragment><P route={route} />{!fige && <BasculeOption o={o} set={set} />}</React.Fragment>;
}

/* ——— Blocs de l'option A ——— */
function BandeauProprio({
  route,
  titre,
  lead,
  actions,
  tuile
}) {
  return <section style={{
    background: 'var(--bleu-025)',
    borderBottom: FP
  }}><div className="llb-c" style={{
      ...CONT,
      padding: '48px var(--web-gouttiere) 64px',
      display: 'grid',
      gridTemplateColumns: tuile ? 'minmax(0,1.2fr) minmax(0,1fr)' : 'minmax(0,1fr)',
      gap: '48px',
      alignItems: 'end'
    }}>
    <div style={{
        display: 'grid',
        gap: '24px'
      }}><FilAriane fil={route.fil} />
      <h1 style={{
          margin: 0,
          fontSize: 'clamp(36px,4vw,56px)',
          lineHeight: 1.208,
          letterSpacing: '-0.035em',
          color: 'var(--marine-900)',
          maxWidth: '20ch',
          textWrap: 'balance'
        }}>{gab(titre)}</h1>
      <p style={{
          margin: 0,
          fontSize: '14px',
          lineHeight: 1.65,
          color: 'var(--gris-700)',
          maxWidth: '58ch'
        }}>{gab(lead)}</p>
      {actions && <div style={{
          display: 'flex',
          gap: '16px 28px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: '8px'
        }}>{actions}</div>}</div>
    {tuile}
  </div></section>;
}
const TuileMarine = ({
  children
}) => <div className="ll-sombre" style={{
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '24px',
  background: 'var(--marine-900)',
  boxShadow: '0 24px 56px rgba(12,33,71,.18)',
  padding: '32px',
  display: 'grid',
  gap: '14px',
  alignContent: 'start'
}}>
  <div aria-hidden="true" style={{
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(70% 90% at 100% 0%,rgba(91,154,232,.28),transparent 60%)',
    pointerEvents: 'none'
  }} />
  <div style={{
    position: 'relative',
    display: 'grid',
    gap: '14px'
  }}>{children}</div></div>;
function ApercuPortail() {
  const ref = React.useRef(null),
    [k, setK] = React.useState(.6);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const f = () => setK(el.clientWidth / 1440);
    f();
    const t = setTimeout(f, 120);
    window.addEventListener('resize', f);
    const ro = new ResizeObserver(f);
    ro.observe(el);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', f);
      ro.disconnect();
    };
  }, []);
  return <div style={{
    borderRadius: '20px',
    overflow: 'hidden',
    background: 'var(--gris-000)',
    boxShadow: O2P
  }}>
    <div style={{
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 16px',
      borderBottom: FP,
      background: 'var(--surface-douce)'
    }}>
      {[0, 1, 2].map(i => <span key={i} style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: 'var(--gris-200)'
      }} />)}
      <span style={{
        marginLeft: '12px',
        fontSize: '13px',
        color: 'var(--texte-discret)'
      }}>Espace propriétaire · tableau de bord {gab('[à confirmer]')}</span></div>
    <div ref={ref} style={{
      position: 'relative',
      height: 900 * k + 'px',
      overflow: 'hidden'
    }}>
      <iframe src="/espace-proprietaire/index.html" title="Aperçu de l'espace propriétaire" tabIndex={-1} loading="lazy" style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '1440px',
        height: '900px',
        border: 0,
        transform: 'scale(' + k + ')',
        transformOrigin: '0 0',
        pointerEvents: 'none'
      }} /></div>
  </div>;
}
function GrilleChiffres({
  items
}) {
  return <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
    gap: '24px'
  }}>
    {items.map(([v, t, d]) => <div key={t} className="lls-carte" style={{
      background: '#fff',
      borderRadius: '16px',
      boxShadow: O1P,
      padding: '28px',
      display: 'grid',
      gap: '8px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}><span style={{
          fontWeight: 700,
          fontSize: '44px',
          letterSpacing: '-0.03em',
          color: 'var(--marine-900)',
          lineHeight: 1
        }}>{v}</span><Exemple /></div>
      <span style={{
        fontSize: '16px',
        fontWeight: 700,
        color: 'var(--marine-900)',
        marginTop: '12px'
      }}>{t}</span><span style={{
        fontSize: '14px',
        color: 'var(--texte-discret)'
      }}>{d}</span></div>)}
  </div>;
}
function Engagements({
  fond = 'douce'
}) {
  return <Section fond={fond}>
    <TitreBloc surtitre="Nos engagements" titre="Quatre engagements chiffrés, {vérifiables} dans votre rapport." texte="Valeurs d'exemple : les engagements définitifs sont [valeurs à fixer]." />
    <GrilleChiffres items={PPC.gestion.engagements} />
  </Section>;
}
function BlocOffre({
  titre = 'Recevez une offre pour votre immeuble.',
  surtitre = 'Offre de service',
  fond = 'douce'
}) {
  return <div id="offre"><Section fond={fond}>
    <div className="ll-deux" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.35fr)',
        gap: '64px',
        alignItems: 'start'
      }}>
      <div>
        <TitreBloc surtitre={surtitre} titre={titre} texte="Deux étapes, deux minutes. Nous revenons en un jour ouvrable avec une offre écrite et un moment pour en parler." marge={32} />
        <Coches items={['Accusé de réception immédiat', 'Appel de 30 minutes au moment choisi', 'Offre écrite, services détaillés', 'Aucun engagement']} />
      </div>
      <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: 'clamp(24px,3vw,40px)',
          boxShadow: O2P
        }}><FormOffre /></div>
    </div>
  </Section></div>;
}

/* ——— Option A · Repère clair ——— */
function PageGestionA({
  route
}) {
  const c = PPC.gestion;
  return <div>
    <BandeauProprio route={route} titre={c.titre} lead={c.lead} actions={<React.Fragment><BoutonLien to="/offre-de-service">Obtenir une offre</BoutonLien><Fleche to="/expertise-et-strategie">Notre expertise</Fleche></React.Fragment>} tuile={<TuileMarine><span style={{
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: 'var(--bleu-300)'
      }}>Vous gardez la main</span>
        <Coches clair items={c.main} /><span style={{
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'var(--bleu-100)'
      }}>Approbation en ligne, en un geste, consignée au dossier.</span></TuileMarine>} />
    <Section fond="douce"><TitreBloc surtitre="Pour qui?" titre="Une offre qui s\u2019adresse à tous les propriétaires d\u2019immeubles résidentiels dans la {grande région de Québec}." /><TypesImmeubles /></Section>
    <Section><TitreBloc surtitre="Services offerts" titre="Lease Lane vous offre un service {clé en main} pour vos immeubles. Tout est pris en charge." /><ServicesOfferts /></Section>
    <Section fond="douce"><TitreBloc surtitre="Ce que vous voyez" titre="Votre immeuble, {en temps réel}." texte="Loyers perçus, arriérés, demandes en cours, autorisations à donner : le tableau de bord et le rapport mensuel montrent les mêmes chiffres." /><ApercuPortail /></Section>
    <Section><TitreBloc surtitre="Ce que Cléo change" titre="Aucune demande sans réponse, {même à 3 h du matin}." action={<Fleche to="/cleo">Qui est Cléo</Fleche>} /><Cartes colonnes={4} items={c.cleo} /><MentionJuridique style={{
        marginTop: '20px'
      }} /></Section>
    <Engagements />
    <FAQSujets fond="#fff" t="Ce que les {propriétaires} nous demandent." />
    <BlocOffre />
  </div>;
}
const PageGestion = ({
  route
}) => <AvecOptions page="gestion" route={route} A={PageGestionA} B={PageGestionB} />;
function PageOffre({
  route
}) {
  return <GabaritDemande route={route} titre="Obtenir une offre de {gestion immobilière}" lead="Deux minutes pour décrire votre immeuble. Une réponse en un jour ouvrable, avec une offre écrite et un rendez-vous proposé." pastilles={[['clock', '2 minutes'], ['calendar-check', 'Réponse en 1 jour ouvrable'], ['shield-check', 'Sans engagement']]} etapes={['Votre immeuble', 'Vos coordonnées']} suite={[['Accusé de réception', 'Immédiat, par courriel, avec votre numéro de dossier.'], ['Appel de 30 minutes', 'Au moment que vous choisissez, avec une personne de l’équipe.'], ['Offre écrite', 'Services compris, responsabilités et échéancier de transition.']]} confid="Utilisés seulement pour préparer l'offre et vous joindre. Conservés [durée à confirmer], puis détruits si aucune entente n'est conclue.">
    <FormOffre /></GabaritDemande>;
}
export { FP, O1P, O2P, PPC, PP_TYPES, Pictogramme, PP_TYPES_OPT, PP_FAMILLES, TypesImmeubles, PP_SERVICES, PanneauService, ServicesOfferts, PP_OPTIONS, useOptionPage, BasculeOption, PP_FIGEES, AvecOptions, BandeauProprio, TuileMarine, ApercuPortail, GrilleChiffres, Engagements, BlocOffre, PageGestionA, PageGestion, PageOffre, O1P as O1P_PP };
