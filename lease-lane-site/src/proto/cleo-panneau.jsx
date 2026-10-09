/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/cleo-panneau.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { gab } from '@/proto/blocs';
import { __ssr } from '@/lib/hydratation';
const MAR = '#0C2147',
  FIN = '1px solid rgba(12,33,71,.10)';
const CP_CSS = '.cp-panneau{transform-origin:100% 100%;animation:cp-in 260ms cubic-bezier(.22,1,.36,1) both}@keyframes cp-in{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}' + '.cp-msg{animation:cp-msg 300ms cubic-bezier(.22,1,.36,1) both}@keyframes cp-msg{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' + '.cp-int{transition:background-color 180ms,border-color 180ms,box-shadow 180ms}.cp-int:hover{background:#F7FAFD;border-color:#4581CB!important;box-shadow:0 10px 22px -16px rgba(12,33,71,.5)}.cp-int .cp-fl{transition:transform 240ms cubic-bezier(.22,1,.36,1)}.cp-int:hover .cp-fl{transform:translateX(3px)}' + '.cp-puce{transition:background-color 180ms,border-color 180ms,color 180ms}.cp-puce:hover{background:' + MAR + '!important;border-color:' + MAR + '!important;color:#fff!important}' + '.cp-tete-b{transition:background-color 180ms}.cp-tete-b:hover{background:rgba(255,255,255,.12)!important}' + '.cp-carte{transition:border-color 180ms,box-shadow 180ms}.cp-carte:hover{border-color:#91B5E0!important;box-shadow:0 10px 24px -16px rgba(12,33,71,.45)}' + '.cp-saisie:focus-within{border-color:#4581CB!important;box-shadow:0 0 0 3px rgba(69,129,203,.16)}' + '.cp-panneau button:focus-visible,.cp-panneau a:focus-visible{outline:2px solid #4581CB;outline-offset:2px}' + '.cp-fil{scrollbar-width:thin;scrollbar-color:#C9D9EE transparent}' + '.cp-point{animation:cp-pt 1.1s infinite ease-in-out}@keyframes cp-pt{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-2px)}}' + '.cp-accroche{animation:cp-in 320ms cubic-bezier(.22,1,.36,1) both;transform-origin:100% 100%}' + '@media (max-width:560px){.cp-panneau{position:fixed!important;inset:0!important;width:auto!important;height:auto!important;max-height:none!important;border-radius:0!important}.ll-cleo-flottant[data-ouvert="1"]>.cp-lanceur{display:none}}' + '@media (prefers-reduced-motion:reduce){.cp-panneau,.cp-msg,.cp-accroche,.cp-point{animation:none}}';
const Portrait = ({
  src,
  t = 32,
  anneau
}) => <span style={{
  position: 'relative',
  width: t + 'px',
  height: t + 'px',
  flex: 'none',
  display: 'block'
}}>
  <img src={src} alt="" style={{
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'block',
    boxShadow: anneau ? '0 0 0 2px #fff' : 'none'
  }} /></span>;
const SUR = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#58697F'
};

/* Cartes du fil */
function Logements({
  items,
  onLogement
}) {
  return <div style={{
    display: 'grid',
    gap: '8px'
  }}>{items.map((l, i) => <button key={i} type="button" className="cp-carte" onClick={() => onLogement && onLogement(l)} style={{
      display: 'grid',
      gridTemplateColumns: '64px minmax(0,1fr) auto',
      gap: '12px',
      alignItems: 'center',
      padding: '8px 12px 8px 8px',
      textAlign: 'left',
      cursor: 'pointer',
      background: '#fff',
      border: FIN,
      borderRadius: '14px',
      fontFamily: 'inherit'
    }}>
    <span style={{
        width: '64px',
        height: '52px',
        borderRadius: '9px',
        overflow: 'hidden',
        background: 'linear-gradient(160deg,#EAF1FA,#D5E2F2)',
        display: 'grid',
        placeItems: 'center'
      }}>{l.photo ? <img src={l.photo} alt="" style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }} /> : <Icon name="building-2" size={18} color="#91B5E0" />}</span>
    <span style={{
        minWidth: 0,
        display: 'grid',
        gap: '2px'
      }}><span style={{
          fontSize: '13.5px',
          fontWeight: 600,
          color: MAR,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>{l.titre}</span><span style={{
          fontSize: '12px',
          color: '#58697F'
        }}>{l.detail}</span></span>
    <span style={{
        fontSize: '14px',
        fontWeight: 700,
        color: MAR,
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums'
      }}>{l.prix}</span></button>)}</div>;
}
function Resume({
  titre,
  lignes = [],
  etat,
  note
}) {
  return <div style={{
    border: FIN,
    borderRadius: '14px',
    overflow: 'hidden',
    background: '#fff'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      padding: '11px 14px',
      background: '#F3F7FC'
    }}><span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: 700,
        color: MAR
      }}><Icon name="circle-check" size={15} color="var(--succes-500)" />{titre}</span>{etat && <span style={{
        ...SUR,
        color: '#3767A2'
      }}>{etat}</span>}</div>
    <dl style={{
      margin: 0,
      padding: '10px 14px',
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0,1fr)',
      gap: '7px 16px',
      fontSize: '12.5px'
    }}>{lignes.map(([k, v]) => <React.Fragment key={k}><dt style={{
          color: '#58697F'
        }}>{k}</dt><dd style={{
          margin: 0,
          color: MAR,
          fontWeight: 600
        }}>{v}</dd></React.Fragment>)}</dl>
    {note && <p style={{
      margin: 0,
      padding: '0 14px 12px',
      fontSize: '12px',
      lineHeight: 1.5,
      color: '#58697F'
    }}>{note}</p>}</div>;
}
function Humain({
  nom,
  role,
  delai,
  onAppel
}) {
  return <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    border: FIN,
    borderRadius: '14px',
    background: '#fff'
  }}>
    <span aria-hidden="true" style={{
      width: '38px',
      height: '38px',
      borderRadius: '50%',
      background: MAR,
      display: 'grid',
      placeItems: 'center',
      flex: 'none'
    }}><Icon name="headset" size={17} color="#fff" /></span>
    <span style={{
      flex: 1,
      minWidth: 0,
      display: 'grid',
      gap: '2px'
    }}><span style={{
        fontSize: '13.5px',
        fontWeight: 700,
        color: MAR
      }}>{gab ? gab(nom) : nom}</span><span style={{
        fontSize: '12px',
        color: '#58697F'
      }}>{role} · {delai}</span></span>
    <button type="button" onClick={onAppel} className="cp-puce" style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      height: '36px',
      padding: '0 14px',
      borderRadius: '10px',
      border: '1px solid rgba(12,33,71,.2)',
      background: '#fff',
      color: MAR,
      fontFamily: 'inherit',
      fontSize: '12.5px',
      fontWeight: 600,
      cursor: 'pointer'
    }}><Icon name="phone" size={14} color="currentColor" />Rappel</button></div>;
}
function Creneaux({
  creneaux,
  onCreneau
}) {
  return <div style={{
    display: 'grid',
    gap: '8px'
  }}><span style={{
      ...SUR,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px'
    }}><Icon name="calendar-check" size={13} color="#4581CB" />Créneaux libres</span>
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px'
    }}>{creneaux.map((c, i) => <button key={i} type="button" className="cp-puce" onClick={() => onCreneau && onCreneau(c)} style={{
        display: 'grid',
        gap: '2px',
        minHeight: '52px',
        padding: '8px 12px',
        borderRadius: '12px',
        border: '1px solid rgba(12,33,71,.18)',
        background: '#fff',
        color: MAR,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left'
      }}><span style={{
          fontSize: '12.5px',
          fontWeight: 700
        }}>{c.jour}</span><span style={{
          fontSize: '12px',
          opacity: .75
        }}>{c.heure}</span></button>)}</div></div>;
}

/* Accueil : d'abord « Vous êtes… » (trois profils); ensuite seulement ce qui concerne ce profil — intentions, questions fréquentes filtrées,
   ligne d'urgence pour les locataires — et un lien pour changer de profil en tout temps. */

/* Accroche du premier passage : une bulle à côté du portrait, une seule fois, refermable. */
function CleoAccroche({
  onOuvrir
}) {
  const [vue, setVue] = React.useState(false);
  React.useEffect(() => {
    let deja = false;
    try {
      deja = ((__ssr() ? "undefined" : typeof localStorage) !== "undefined" ? localStorage.getItem('ll-cleo-accroche') : undefined) === '1';
    } catch (e) {}
    if (deja) return;
    const t = setTimeout(() => setVue(true), 3500);
    return () => clearTimeout(t);
  }, []);
  const fermer = () => {
    setVue(false);
    try {
      localStorage.setItem('ll-cleo-accroche', '1');
    } catch (e) {}
  };
  if (!vue) return null;
  return <div className="cp-accroche" role="status" style={{
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    maxWidth: '280px',
    padding: '14px 12px 14px 16px',
    borderRadius: '16px 16px 4px 16px',
    background: '#fff',
    boxShadow: '0 24px 48px -20px rgba(12,33,71,.45),0 0 0 1px rgba(12,33,71,.08)',
    fontFamily: 'var(--police-corps)'
  }}>
    <button type="button" onClick={() => {
      fermer();
      onOuvrir && onOuvrir();
    }} style={{
      flex: 1,
      display: 'grid',
      gap: '3px',
      padding: 0,
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: 'inherit'
    }}>
      <span style={{
        fontSize: '14px',
        fontWeight: 700,
        color: MAR
      }}>Vous désirez de l’aide?</span><span style={{
        fontSize: '12.5px',
        lineHeight: 1.45,
        color: '#3E4A59'
      }}>Logement, visite, bail ou TAL : je réponds 24/7.</span></button>
    <button type="button" onClick={fermer} aria-label="Masquer" style={{
      width: '28px',
      height: '28px',
      flex: 'none',
      margin: '-6px -4px 0 0',
      border: 0,
      borderRadius: '8px',
      background: 'transparent',
      cursor: 'pointer',
      display: 'grid',
      placeItems: 'center'
    }}><Icon name="x" size={14} color="#58697F" /></button></div>;
}
let CP_PARTS = {
  Logements,
  Resume,
  Humain,
  Creneaux,
  Portrait,
  CP_CSS
};
export { CleoAccroche, CP_PARTS };
