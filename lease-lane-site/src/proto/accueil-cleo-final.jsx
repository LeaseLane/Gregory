/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-cleo-final.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { ACC_H } from '@/proto/accueil-options-1';
import { ouvrirCleo } from '@/proto/seo';
const PORT = "/assets/img/cleo/cleo-hd.jpg",
  ALT = 'Portrait de Cléo, l’assistant IA de Lease Lane';
const TITRES = ['Voici Cléo. Votre gestionnaire IA {qui ne dort jamais.}', 'Votre bail a des questions. {Cléo a les réponses.}', 'Le TAL, les délais, les urgences : {Cléo s’en occupe, jour et nuit.}', 'Propriétaire ou locataire, {une seule adresse pour avoir l’heure juste.}'];
const SOUS = 'L’assistant IA de Lease Lane répond 24/7 aux propriétaires et aux locataires, explique les règles du TAL en termes simples et passe la main à un humain quand ça compte.';
const SURT = 'Voici les compétences de Cléo :',
  MENTION = 'Information juridique générale, pas un avis juridique. Un humain prend le relais dès que votre dossier le demande.';
const CAP = [{
  ic: 'scale',
  t: 'Le TAL et le Code civil, expliqués',
  d: 'Augmentations de loyer, avis et délais, renouvellement, cession de bail, reprise, éviction, réparations, salubrité. Des réponses claires, à jour, sourcées.',
  tags: ['Augmentations de loyer', 'Avis et délais', 'Renouvellement', 'Cession de bail', 'Reprise', 'Éviction', 'Réparations', 'Salubrité']
}, {
  ic: 'handshake',
  t: 'Impartial, pour les deux côtés du bail',
  d: 'Propriétaire ou locataire, vous obtenez la même rigueur et les options qui s’offrent à vous.'
}, {
  ic: 'phone',
  t: 'Traitement des urgences',
  d: 'Dégât d’eau, chauffage, panne. Cléo trie, donne la consigne de sécurité et alerte la bonne personne.',
  urg: 1
}, {
  ic: 'calendar-check',
  t: 'Prise de rendez-vous rapide',
  d: 'Visites, signatures, états des lieux, interventions. Préavis légaux respectés automatiquement.'
}, {
  ic: 'refresh-cw',
  t: 'Suivi efficace des demandes',
  d: 'Chaque dossier est attribué, suivi et relancé jusqu’à sa résolution.'
}, {
  ic: 'sparkles',
  t: 'Un FAQ autogénéré',
  d: 'Elle s’enrichit de vos vraies questions, validée par notre équipe.'
}];
const ouvrir = t => {
  try {
    ouvrirCleo(t);
  } catch (e) {
    ACC_H.aller('/cleo');
  }
};
const P14 = {
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.65,
  color: 'var(--bleu-100)',
  textWrap: 'pretty'
};
const CAPS = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase'
};
const DEG = 'linear-gradient(160deg,#6194D3,#3767A2)';
/* Titre : variante A/B mémorisée (barre de revue). */
/* Titre figé : « Principal » retenu. */
const useTitre = () => {
  const [i, setI] = React.useState(0);
  return 0;
};
const choisirTitre = i => {
  try {
    void 0;
  } catch (e) {}
  window.dispatchEvent(new CustomEvent('ll-cleo-titre', {
    detail: i
  }));
};
const Titre = ({
  taille = 'var(--titre-l)',
  centre,
  max
}) => {
  const i = useTitre(),
    lg = (TITRES[i] || '').length > 90,
    deux = !i;
  return <h2 style={{
    margin: 0,
    fontSize: taille,
    lineHeight: 1.4,
    letterSpacing: '-0.03em',
    fontWeight: 700,
    color: '#fff',
    maxWidth: deux ? 'none' : max || (lg ? '34ch' : '22ch'),
    textWrap: 'balance',
    textAlign: centre ? 'center' : 'left'
  }}>{ACC_H.surl(TITRES[i] || TITRES[0], ACC_H.CL)}</h2>;
};
const BarreTitre = () => {
  const i = useTitre();
  return <div style={{
    background: 'var(--bleu-025)',
    borderBottom: '1px solid var(--bordure-fine)'
  }}><div role="group" aria-label="Titre, test A/B" style={{
      maxWidth: 'var(--web-conteneur)',
      margin: '0 auto',
      padding: '8px var(--web-gouttiere)',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '6px 8px'
    }}>
  <span style={{
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        color: 'var(--marine-900)',
        marginRight: '4px'
      }}>Titre · test A/B</span>
  {TITRES.map((t, k) => <button key={k} type="button" aria-pressed={i === k} onClick={() => choisirTitre(k)} title={t.replace(/[{}]/g, '')} style={{
        height: '30px',
        padding: '0 12px',
        borderRadius: 'var(--rayon-bouton)',
        border: '1px solid ' + (i === k ? 'var(--marine-900)' : 'var(--bordure-fine)'),
        background: i === k ? 'var(--marine-900)' : '#fff',
        color: i === k ? '#fff' : 'var(--marine-900)',
        fontFamily: 'inherit',
        fontSize: '12.5px',
        fontWeight: 600,
        cursor: 'pointer'
      }}>{k ? 'Variante ' + k : 'Principal'}</button>)}</div></div>;
};
const Tuile = ({
  ic,
  t = 44,
  urg,
  eteint
}) => <span aria-hidden="true" style={{
  width: t + 'px',
  height: t + 'px',
  flex: 'none',
  borderRadius: Math.round(t * .3) + 'px',
  display: 'grid',
  placeItems: 'center',
  background: eteint ? '#0E2340' : urg ? 'var(--urgence-600)' : DEG,
  border: eteint ? '1px solid rgba(181,212,247,.3)' : 0,
  boxShadow: eteint || urg ? 'none' : '0 14px 30px -12px rgba(69,129,203,.95),inset 0 1px 0 rgba(255,255,255,.25)',
  transition: 'background 500ms'
}}><ACC_H.Icon name={ic} size={Math.round(t * .44)} color="#fff" /></span>;
const EnLigne = () => <span style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  height: '28px',
  padding: '0 12px',
  borderRadius: '999px',
  background: 'rgba(63,179,127,.14)',
  border: '1px solid rgba(63,179,127,.4)',
  fontSize: '12px',
  fontWeight: 600,
  color: '#fff',
  whiteSpace: 'nowrap'
}}><span className="cj-pouls" style={{
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#3FB37F'
  }} />En ligne</span>;
const Tags = ({
  tags
}) => <ul style={{
  listStyle: 'none',
  margin: '2px 0 0',
  padding: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px'
}}>{tags.map(t => <li key={t} style={{
    height: '28px',
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 11px',
    borderRadius: '999px',
    background: 'rgba(181,212,247,.1)',
    border: '1px solid rgba(181,212,247,.22)',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap'
  }}>{t}</li>)}</ul>;
const CTA = ({
  centre
}) => <div style={{
  display: 'grid',
  gap: '14px',
  justifyItems: centre ? 'center' : 'start'
}}>
  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: centre ? 'center' : 'flex-start'
  }}>
    <ACC_H.Button variant="inverse" size="l" onClick={() => ouvrir()} iconeAvant={<ACC_H.Icon name="message-circle" size={18} />}>Vous avez des questions? Allez-y!</ACC_H.Button>
    <ACC_H.Button as="a" href="/offre-de-service" variant="contour_inverse" size="l" iconeAvant={<ACC_H.Icon name="building-2" size={18} />}>Je suis propriétaire, je veux en savoir plus</ACC_H.Button></div></div>;
const Lueur = ({
  x = '72%',
  y = '38%',
  t = 1000
}) => <span aria-hidden="true" style={{
  position: 'absolute',
  left: x,
  top: y,
  width: t + 'px',
  height: t + 'px',
  transform: 'translate(-50%,-50%)',
  background: 'radial-gradient(closest-side,rgba(69,129,203,.28),rgba(69,129,203,0))',
  pointerEvents: 'none'
}} />;
const Sec = ({
  r,
  children,
  fond = 'var(--degrade-marine)'
}) => <section ref={r} className="ll-sombre" style={{
  position: 'relative',
  overflow: 'clip',
  background: fond
}}>{children}</section>;
const heureDe = p => {
  const hh = (18 * 60 + Math.round(p * 720)) % 1440;
  return String(Math.floor(hh / 60)).padStart(2, '0') + ' h ' + String(hh % 60).padStart(2, '0');
};

/* A · Veille de nuit (retravaillée) : portrait vertical avec horloge en verre et barre de la nuit (18 h → 6 h); journal des six tâches qui s'allument au défilement, chacune à son heure. */
const ETOILES = (() => {
  let s = 7;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return Array.from({
    length: 54
  }, () => [r() * 100, r() * 100, r() < .2 ? 3 : 2, .3 + r() * .6]);
})();

/* B · Mosaïque : grille de tuiles; le TAL en grande tuile (avec « TAL » en filigrane), portrait de Cléo, une mini-illustration par tâche. */

/* C · Conversation en direct : les six tâches à gauche; à droite, une conversation d'exemple se joue pour la tâche choisie (message, Cléo écrit, réponse, actions), puis passe à la suivante. */

/* D · Manifeste : le titre en très grand, le portrait glissé dans la phrase; les six tâches en index numéroté (le TAL en tête, plus grand). */

/* E · Cadran 24 h : un cadran de 24 heures (nuit en haut); chaque tâche est placée à une heure type. L'aiguille passe de l'une à l'autre (pause au survol); clic sur une tâche pour y aller. */

let CLEO_F = {
  TITRES,
  SOUS,
  SURT,
  MENTION,
  CAP,
  useTitre,
  Titre,
  BarreTitre,
  Tuile,
  EnLigne,
  Tags,
  CTA,
  Lueur,
  Sec,
  heureDe,
  ETOILES,
  P14,
  CAPS,
  PORT,
  ALT,
  ouvrir,
  DEG
};
export { CLEO_F };
