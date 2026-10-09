/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-options-3.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { ACC_H } from '@/proto/accueil-options-1';
const CAPS = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase'
};
const DEG = 'linear-gradient(160deg,#6194D3,#3767A2)';
const Tuile = ({
  ic,
  t = 44,
  clair
}) => <span aria-hidden="true" style={{
  width: t + 'px',
  height: t + 'px',
  flex: 'none',
  borderRadius: Math.round(t * .3) + 'px',
  display: 'grid',
  placeItems: 'center',
  background: clair ? 'var(--bleu-025)' : DEG,
  boxShadow: clair ? 'none' : '0 12px 26px -12px rgba(69,129,203,.9),inset 0 1px 0 rgba(255,255,255,.25)'
}}><ACC_H.Icon name={ic} size={Math.round(t * .44)} color={clair ? 'var(--bleu-600)' : '#fff'} /></span>;
const Coche = ({
  c = '#3FB37F',
  fond = 'rgba(63,179,127,.14)'
}) => <span aria-hidden="true" style={{
  width: '22px',
  height: '22px',
  flex: 'none',
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  background: fond
}}><ACC_H.Icon name="check" size={13} color={c} /></span>;
/* En-têtes et appels (textes actuels). */
const TeteV = ({
  centre,
  sansD,
  sansSur
}) => <div style={{
  display: 'grid',
  gap: '14px',
  justifyItems: centre ? 'center' : 'start',
  textAlign: centre ? 'center' : 'left'
}}>{!sansSur && <ACC_H.Overline trait={false}>Ce que nous prenons en charge</ACC_H.Overline>}
  <h2 style={{
    margin: 0,
    fontSize: 'var(--titre-l)',
    lineHeight: 1.31,
    letterSpacing: '-0.03em',
    fontWeight: 700,
    color: ACC_H.MAR,
    maxWidth: 'none',
    textWrap: 'balance'
  }}>{ACC_H.surl('Des services adaptés à vos besoins et nécessairement {clé en main}.', ACC_H.BL)}</h2>
  {!sansD && <p style={{
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.65,
    color: 'var(--texte-corps)',
    maxWidth: '60ch'
  }}>Chaque volet est mesuré dans votre rapport mensuel.</p>}</div>;
const CtaV = ({
  centre,
  lib,
  lien
}) => <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: centre ? 'center' : 'flex-start',
  gap: '14px'
}}><ACC_H.Button variant="primaire" size="l" onClick={() => ACC_H.aller('/offre-de-service')}>{lib || "Soumission - Gestion d'immeubles"}</ACC_H.Button><ACC_H.Fl to="/expertise-et-strategie">{lien || 'Notre expertise'}</ACC_H.Fl></div>;
let VOL_H = {
  TeteV,
  CtaV,
  Tuile,
  Coche,
  CAPS
};
const TeteP = () => <div style={{
  display: 'grid',
  gap: '14px'
}}><ACC_H.Overline ton="marine">Votre arrivée chez Lease Lane</ACC_H.Overline><h2 style={{
    margin: 0,
    fontSize: 'var(--titre-l)',
    lineHeight: 1.31,
    letterSpacing: '-0.03em',
    fontWeight: 700,
    color: '#fff',
    maxWidth: '22ch',
    textWrap: 'balance'
  }}>Quatre étapes, du premier appel au premier rapport.</h2></div>;
const QuatreP = ({
  vu,
  droite
}) => <div style={{
  display: 'grid',
  gap: '10px',
  justifyItems: droite ? 'end' : 'start',
  textAlign: droite ? 'right' : 'left'
}}><span style={{
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px',
    fontSize: 'clamp(40px,4.4vw,64px)',
    fontWeight: 700,
    letterSpacing: '-0.04em',
    lineHeight: 1,
    color: '#fff',
    whiteSpace: 'nowrap'
  }}><ACC_H.Compte s="4 semaines" actif={vu} /><ACC_H.Ex /></span><span style={{
    fontSize: '14px',
    lineHeight: 1.6,
    color: 'var(--bleu-100)',
    maxWidth: '42ch'
  }}>du premier appel au premier rapport, sans interruption pour vos locataires</span></div>;
const ActP = () => <div className="ll-act" style={{
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '14px 26px'
}}><ACC_H.Button variant="inverse" size="l" onClick={() => ACC_H.aller('/offre-de-service')}>Planifier un appel</ACC_H.Button><ACC_H.Fl to="/changer-de-gestionnaire" clair>Vous avez déjà un gestionnaire?</ACC_H.Fl></div>;
let PARC_H = {
  TeteP,
  QuatreP,
  ActP
};

/* ——— Volets A · Tableau de bord : les quatre résultats tels qu'ils paraissent dans le rapport mensuel; chaque indicateur ouvre ses cinq tâches. ——— */

/* ——— Volets B · Recto verso : quatre fiches; au survol (ou au toucher), la fiche pivote et montre ses cinq tâches. ——— */

/* ——— Volets C · Trente tâches, quatre résultats : au défilement, les tâches éparpillées viennent se ranger sous leur résultat. ——— */

/* ——— Arrivée A · Billet d'embarquement : départ « Appel de découverte », arrivée « Premier rapport »; quatre coupons séparés par des perforations. ——— */

/* ——— Arrivée B · Les livrables : ce que vous recevez à chaque étape, montré comme un objet (rendez-vous, offre, liste de transfert, rapport). ——— */

/* ——— Arrivée C · Le plan : les quatre étapes dessinées comme les pièces d'un plan d'architecte; cotes de durée au-dessus, parcours pointillé d'une porte à l'autre. ——— */

export { VOL_H, PARC_H };
