/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-services-dispo.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { ACC_H } from '@/proto/accueil-options-1';
import { VOL_H } from '@/proto/accueil-options-3';
import { SV12_D } from '@/proto/accueil-services-12';
import { ACC_VOL } from '@/proto/sections-accueil';
const VD = () => ACC_VOL;
const BORD = '1px solid rgba(12,33,71,.26)',
  ART = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    borderRadius: '18px',
    background: '#fff',
    border: BORD,
    overflow: 'hidden'
  };
const H3 = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1.15,
  color: ACC_H.MAR
};
const apercu = (v, i) => SV12_D.SV_CHOIX[i] ? SV12_D.SV_CHOIX[i].map(k => v.taches[k]).filter(Boolean) : v.taches;
const Tuile = ({
  ic,
  t = 44
}) => <span aria-hidden="true" style={{
  width: t + 'px',
  height: t + 'px',
  flex: 'none',
  borderRadius: Math.round(t * .28) + 'px',
  display: 'grid',
  placeItems: 'center',
  background: ACC_H.MAR
}}><ACC_H.Icon name={ic} size={Math.round(t * .44)} color="#fff" /></span>;
const Plus = () => <p style={{
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  ...VOL_H.CAPS,
  fontSize: '11.5px',
  color: 'var(--bleu-600)'
}}><ACC_H.Icon name="plus" size={13} color="#4581CB" />Et bien plus encore.</p>;
const Cta = ({
  v,
  i
}) => <ACC_H.Button as="a" href={SV12_D.SV_LIEN[i] || '/gestion-immobiliere'} variant="primaire" size="m" aria-label={'En savoir plus : ' + v.t}>En savoir plus</ACC_H.Button>;
const Nb = ({
  v
}) => <span style={{
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: 1.3,
  color: 'var(--bleu-600)',
  fontVariantNumeric: 'tabular-nums'
}}>{v.m} {v.ml}</span>;
const Pied = ({
  v,
  i
}) => <React.Fragment><div style={{
    marginTop: '16px'
  }}><Plus /></div><div style={{
    marginTop: 'auto',
    paddingTop: '24px'
  }}><Cta v={v} i={i} /></div></React.Fragment>;
function Coquille({
  carte
}) {
  const V = VD();
  return <section style={{
    position: 'relative',
    overflow: 'hidden',
    background: '#fff'
  }}>
    <div aria-hidden="true" style={{
      position: 'absolute',
      left: '-30%',
      right: '-30%',
      bottom: '-6%',
      height: '46%',
      transform: 'perspective(520px) rotateX(64deg)',
      transformOrigin: '50% 100%',
      backgroundImage: 'linear-gradient(rgba(12,33,71,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(12,33,71,.05) 1px,transparent 1px)',
      backgroundSize: '80px 80px',
      WebkitMaskImage: 'linear-gradient(to top,#000 10%,transparent 90%)',
      maskImage: 'linear-gradient(to top,#000 10%,transparent 90%)',
      pointerEvents: 'none'
    }} />
    <div style={{
      ...ACC_H.BOITE,
      position: 'relative',
      display: 'grid',
      gap: '44px'
    }}>
      <div className="ao-g2" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,7fr) minmax(0,5fr)',
        gap: '24px 56px',
        alignItems: 'end'
      }}><VOL_H.TeteV sansD sansSur /><div className="vs-cta" style={{
          justifySelf: 'end'
        }}><VOL_H.CtaV lib="Gestion d'immeubles" lien="Expertise & stratégie" /></div></div>
      <div className="sv-ecrans" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
        gridAutoRows: '1fr',
        gap: '16px',
        alignItems: 'stretch'
      }}>{V.map((v, i) => <React.Fragment key={v.t}>{carte(v, i)}</React.Fragment>)}</div></div></section>;
}

/* D1 · Chiffre clé */

/* D2 · En-tête */
const C2 = (v, i) => <article style={ART}>
  <header style={{
    display: 'grid',
    gap: '8px',
    justifyItems: 'center',
    textAlign: 'center',
    padding: '20px 22px 22px',
    background: 'var(--bleu-025)',
    borderBottom: BORD
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '8px'
    }}><Tuile ic={v.ic} t={41.4} /></div>
    <h3 style={H3}>{v.t}</h3><Nb v={v} /></header>
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '1 1 auto',
    padding: '20px 22px 24px'
  }}>
    <ul style={{
      listStyle: 'none',
      margin: 'auto 0 0',
      padding: 0,
      display: 'grid',
      gap: '10px',
      width: 'fit-content',
      maxWidth: '100%'
    }}>{apercu(v, i).map(t => <li key={t} style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        fontSize: '13.5px',
        lineHeight: 1.45,
        color: 'var(--texte-corps)'
      }}><span aria-hidden="true" style={{
          width: '6px',
          height: '6px',
          flex: 'none',
          marginTop: '7px',
          borderRadius: '2px',
          background: '#4581CB'
        }} /><span>{t}</span></li>)}</ul>
    <Pied v={v} i={i} /></div></article>;

/* D3 · Index */

let SvD2 = () => <Coquille carte={C2} />;
export { SvD2 };
