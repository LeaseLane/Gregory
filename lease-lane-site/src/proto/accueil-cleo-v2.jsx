/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-cleo-v2.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { CLEO_F } from '@/proto/accueil-cleo-final';
import { ACC_H } from '@/proto/accueil-options-1';
const Tete = () => <div style={{
  display: 'grid',
  gap: '18px'
}}><CLEO_F.Titre /></div>;
const H3 = k => ({
  margin: 0,
  fontSize: k ? '17px' : 'clamp(22px,2vw,26px)',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  lineHeight: 1.3,
  color: '#fff',
  textWrap: 'balance'
});
const VEDETTE = 'linear-gradient(150deg,rgba(69,129,203,.34) 0%,rgba(14,35,64,.38) 72%)';
const Legende = ({
  children
}) => <figcaption style={{
  position: 'absolute',
  left: '14px',
  right: '14px',
  bottom: '14px',
  display: 'grid',
  gap: '12px',
  padding: '14px 16px',
  borderRadius: '20px',
  background: 'rgba(8,20,38,.66)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid rgba(181,212,247,.24)'
}}>{children}</figcaption>;
const Nom = () => <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px'
}}><span style={{
    display: 'grid'
  }}><strong style={{
      fontSize: '16px',
      color: '#fff'
    }}>Cléo</strong><span style={{
      fontSize: '12.5px',
      color: 'var(--bleu-100)'
    }}>Assistant IA de Lease Lane</span></span><CLEO_F.EnLigne /></div>;
const Portrait = ({
  children
}) => <figure style={{
  margin: 0,
  position: 'relative',
  maxWidth: '440px',
  borderRadius: '28px',
  overflow: 'hidden',
  border: '1px solid rgba(181,212,247,.28)',
  boxShadow: '0 50px 100px -50px rgba(0,0,0,.85)'
}}><img src={CLEO_F.PORT} alt={CLEO_F.ALT} style={{
    display: 'block',
    width: '100%',
    aspectRatio: '4 / 5',
    objectFit: 'cover',
    objectPosition: '50% 18%'
  }} /><Legende>{children || <Nom />}</Legende></figure>;
/* Mise en page commune : portrait collant à gauche, contenu à droite. */
const Dispo = ({
  r,
  fond,
  deco,
  portrait,
  children
}) => <CLEO_F.Sec r={r} fond={fond}>{deco || <CLEO_F.Lueur x="78%" y="30%" />}
  <div className="cf-g2" style={{
    ...ACC_H.BOITE,
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
    gap: 'clamp(40px,5vw,80px)',
    alignItems: 'start'
  }}>
    <div className="cf-collant" style={{
      position: 'sticky',
      top: 'calc(' + ACC_H.HAUT + ' + 32px)'
    }}>{portrait || <Portrait />}</div>
    <div style={{
      display: 'grid',
      gap: '28px',
      minWidth: 0
    }}>{children}</div></div></CLEO_F.Sec>;
const Panneau = () => <div style={{
  marginTop: '8px',
  padding: 'clamp(22px,2.6vw,32px)',
  borderRadius: '24px',
  background: 'rgba(255,255,255,.05)',
  border: '1px solid rgba(181,212,247,.24)'
}}><CLEO_F.CTA /></div>;

/* A · Veille de nuit (retravaillée) : ciel qui s'assombrit, horloge 18 h → 6 h dans la légende du portrait; journal des tâches en grille (TAL en tête, pleine largeur), chacune s'allume à son heure. */

/* B · Onglets : la liste des six tâches à gauche du panneau, le détail de la tâche choisie à droite; passage automatique toutes les 6 s, en pause au survol. */

/* C · Accordéon : six lignes numérotées, grands intitulés; une seule ouverte à la fois (le TAL au départ). */

/* D · Carrousel : les six tâches en grandes cartes qui défilent à l'horizontale (flèches, compteur, glisser au doigt). */

/* E · Points clés : la compétence TAL en grande carte (« TAL » en filigrane), les cinq autres en liste compacte sur deux colonnes. */

/* F · Récit : chaque tâche occupe son propre moment au défilement; la légende du portrait affiche la tâche en cours de lecture. */

let CLEO_V2H = {
  Dispo,
  Portrait,
  Tete,
  Panneau,
  H3,
  VEDETTE
};
export { CLEO_V2H };
