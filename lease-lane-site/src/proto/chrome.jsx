/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/chrome.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { useLangue, allerLangue } from '@/lib/i18n/contexte';
import ReactDOM from 'react-dom';
import * as __DS from '@/components/ds';
import { MenuCleo } from '@/proto/menu-options';
import { LL_SITE } from '@/proto/routes';
import { gab } from '@/proto/blocs';
import { useEtatClient, __ssr } from '@/lib/hydratation';

/* Résolution au rendu : évite qu'une autre déclaration globale masque les composants du système (version autonome). */
const chDS = k => p => React.createElement(__DS[k], p);
const ChLogo = chDS('Logo'),
  ChIcon = chDS('Icon');
const BASE_LOGO = "/assets/logo/";

/* Arborescence : trois têtes de colonne = trois entrées de menu (feuille de route, section 7). */

/* Accès aux espaces connectés (pied de page) : deux boutons « voie » empilés, même largeur (320 px). */

function Entete({
  page,
  aller
}) {
  const [ouvert, setOuvert] = useEtatClient(() => {
    try {
      return new URLSearchParams((__ssr() ? "undefined" : typeof location) !== "undefined" ? location.search : undefined).get('menu') === '1';
    } catch (e) {
      return false;
    }
  });
  const [rendu, setRendu] = React.useState(false);
  const [cache, setCache] = React.useState(false),
    [ombre, setOmbre] = React.useState(false);
  React.useEffect(() => {
    const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;
    if (!sc) return;
    let der = sc.scrollTop,
      tm = null;
    /* Le menu se cache en descendant; il réapparaît 0,5 s après le début d'un défilement vers le haut (tout de suite près du haut de la page). */
    const f = () => {
      const y = sc.scrollTop;
      if (Math.abs(y - der) < 4) return;
      if (y <= 140) {
        clearTimeout(tm);
        tm = null;
        setCache(false);
        setOmbre(y > 8);
      } else if (y > der) {
        clearTimeout(tm);
        tm = null;
        setCache(true);
      } else if (tm == null) {
        tm = setTimeout(() => {
          tm = null;
          setCache(false);
          setOmbre(true);
        }, 500);
      }
      der = y;
    };
    sc.addEventListener('scroll', f, {
      passive: true
    });
    return () => {
      clearTimeout(tm);
      sc.removeEventListener('scroll', f);
    };
  }, []);
  React.useEffect(() => {
    if (ouvert) {
      setRendu(true);
      return;
    }
    const reduit = ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : undefined);
    const t = setTimeout(() => setRendu(false), reduit ? 0 : 460);
    return () => clearTimeout(t);
  }, [ouvert]);
  return <header className="ll-entete" style={{
    position: 'sticky',
    top: 0,
    zIndex: 1001,
    background: 'var(--gris-000)',
    transform: cache && !ouvert ? 'translateY(-100%)' : 'none',
    boxShadow: ombre && !cache && !ouvert ? '0 10px 24px -18px rgba(12,33,71,.45)' : 'none',
    transition: 'transform 360ms cubic-bezier(.22,1,.36,1),box-shadow 300ms'
  }}>
    <div style={{
      position: 'relative',
      borderBottom: '1px solid var(--bordure-fine)'
    }}>
      <div className="ll-entete-rang" style={{
        maxWidth: 'none',
        margin: '0 auto',
        height: 'var(--web-entete)',
        padding: '0 43px 0 calc(var(--web-gouttiere) - 1.5vw)',
        display: 'flex',
        alignItems: 'center',
        gap: '32px'
      }}>
        <a href="#" onClick={e => {
          e.preventDefault();
          aller('accueil');
        }} style={{
          display: 'flex',
          flex: 'none',
          marginLeft: '-9px'
        }} title="Accueil">
          <ChLogo base={BASE_LOGO} fond="blanc" slogan={false} hauteur={72} /></a>
        <span style={{
          flex: 1
        }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: 'none'
        }}>
          <LangueEntete />
          <button aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={ouvert} title={ouvert ? 'Fermer le menu' : 'Menu'} onClick={() => setOuvert(!ouvert)} style={{
            width: '44px',
            height: '44px',
            marginRight: '-10px',
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--marine-900)'
          }}><ChIcon name="menu" size={24} actif={ouvert} /></button>
        </div>
      </div>
    </div>
    {rendu && ReactDOM.createPortal(<MenuCleo page={page} sortie={!ouvert} fermer={() => setOuvert(false)} />, (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.body : undefined)}
  </header>;
}

/* Menu ouvrant — option A « Deux publics » (approuvée). Panneaux blancs sur fond marine : encre marine sur blanc, aucun texte bleu sur bleu. */

/* Adresse null = portail locataire. */

/* Langue (en-tête) : même pastille que « Gestion d'immeubles » — 36 px de haut, fond marine, langue active dans la pastille blanche de 26,64 px. */

/* Changer de langue : page jumelle dans l'autre langue (langue.js). */
const changerLangue = x => {
  allerLangue(x === 'EN' ? 'en' : 'fr');
};
function LangueEntete() {
  const [l, setL] = React.useState(useLangue() === 'en' ? 'EN' : 'FR');
  return <div role="group" aria-label="Langue" className="ll-langue-entete" style={{
    display: 'inline-flex',
    alignItems: 'center',
    flex: 'none',
    gap: '2px',
    height: '36px',
    padding: '4.68px',
    marginRight: '4px',
    boxSizing: 'border-box',
    borderRadius: '10px',
    background: 'var(--marine-900)'
  }}>
    {['FR', 'EN'].map(x => {
      const on = l === x;
      return <button key={x} type="button" aria-pressed={on} lang={x === 'EN' ? 'en' : 'fr'} onClick={() => {
        setL(x);
        changerLangue(x);
      }} style={{
        height: '26.64px',
        minWidth: '36px',
        padding: '0 10px',
        border: 0,
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: 'var(--police-corps)',
        fontSize: '12.6px',
        fontWeight: 600,
        letterSpacing: '.06em',
        background: on ? '#fff' : 'transparent',
        color: on ? 'var(--marine-900)' : '#fff',
        transition: 'background-color 200ms,color 200ms'
      }}>{x}</button>;
    })}</div>;
}
/* Liens légaux de chaque pied de page (S1) : ordre fixe, « Gérer mes témoins » rouvre le bandeau; responsable lu dans LL_SITE. */
const LL_LIENS_LEGAUX = [['/confidentialite', 'Politique de confidentialité'], ['/temoins', 'Témoins de navigation'], ['gerer', 'Gérer mes témoins'], ['/conditions-utilisation', 'Conditions d\u2019utilisation'], ['/gouvernance', 'Gouvernance des renseignements personnels']];
function LiensLegaux({
  couleur = 'var(--bleu-200)',
  taille = '12px',
  classe = 'll-pied-lien',
  page,
  onLien,
  gap = '4px 20px',
  minH
}) {
  const st = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: minH,
    fontSize: taille,
    color: couleur,
    textDecoration: 'none'
  };
  return <nav aria-label="Information légale" style={{
    display: 'flex',
    gap,
    flexWrap: 'wrap',
    alignItems: 'center'
  }}>
    {LL_LIENS_LEGAUX.map(([to, x]) => to === 'gerer' ? <button key={to} type="button" onClick={() => {
      onLien && onLien();
      window.dispatchEvent(new Event('ll-temoins'));
    }} className={classe} style={{
      ...st,
      border: 0,
      background: 'transparent',
      padding: 0,
      cursor: 'pointer',
      fontFamily: 'var(--police-corps)'
    }}>{x}</button> : <a key={to} href={to} onClick={onLien} aria-current={page === to ? 'page' : undefined} className={classe} style={{
      ...st,
      color: page === to ? '#fff' : couleur
    }}>{x}</a>)}</nav>;
}
function Responsable({
  couleur = 'var(--bleu-200)',
  taille = '12px'
}) {
  const r = LL_SITE.responsable || {},
    g = gab || (t => t);
  return <span style={{
    fontSize: taille,
    color: couleur,
    lineHeight: 1.5
  }}>Responsable de la protection des renseignements personnels : {r.titre ? r.titre.toLowerCase() === 'président' ? 'le président' : r.titre : g('[titre]')}, {r.courriel ? <a href={'mailto:' + r.courriel} style={{
      color: 'inherit'
    }}>{r.courriel}</a> : g('[courriel dédié]')}</span>;
}
const Copyright = ({
  couleur = 'var(--bleu-200)',
  taille = '12px'
}) => {
  const S = LL_SITE;
  return <span style={{
    fontSize: taille,
    color: couleur
  }}>© 2026 {S.raison} · NEQ {(gab || (t => t))(S.neq || '[NEQ]')}</span>;
};
const TelAff = () => {
  const t = String(LL_SITE.telephone || '');
  return /\d/.test(t) ? t : gab ? gab(t) : t;
};
/* Pied 16c « Deux voies » (approuvé) : une porte d'entrée par public, puis le plan du site, les coordonnées et les mentions légales. */

export { chDS, ChLogo, ChIcon, BASE_LOGO, Entete, changerLangue, LangueEntete, LL_LIENS_LEGAUX, LiensLegaux, Responsable, Copyright, TelAff };
