/** @jsxImportSource @/lib/i18n */
'use client';
/* Gabarit commun de toutes les pages (repris de App, app.jsx du prototype) :
   lien d'évitement, en-tête et menu, contenu, pied de page, Cléo (bulle et panneau) et bandeau des témoins.
   La zone #ll-scroll garde le défilement du prototype (les composants l'écoutent). */
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AIAgentLauncher, FormeBoutonContexte } from '@/components/ds';
import { FORME_VOIE, AVATAR_CLEO } from '@/proto/forme-voie';
import { Entete } from '@/proto/chrome';
import { PiedRevue } from '@/proto/pied-options';
import { CleoTemoins } from '@/proto/cleo-temoins';
import { PixelMeta } from '@/components/PixelMeta';
import { naviguer, PontRouteur } from '@/lib/routeur';
import { useLangue } from '@/lib/i18n/contexte';
import { versFR } from '@/lib/i18n/adresses';
import { demarrerFinitions } from '@/lib/finitions';

/* Agent Cléo (proto/app.jsx et ses scénarios, ≈ 90 Ko) : chargé au premier geste de l'utilisateur, à la fermeture de la bulle des
   témoins, à l'appel d'un bouton « Écrire à Cléo », ou après 8 s — jamais avec la page (PageSpeed, 23 oct. 2026). D'ici là, le
   bouton flottant est le même composant, rendu par le serveur; un clic charge l'agent et ouvre le panneau. */
const AgentIAComplet = lazy(() => import('@/proto/app').then((m) => ({ default: m.AgentIA })));
const GESTES = ['pointerdown', 'keydown', 'touchstart', 'wheel'];
function Lanceur({ onClick }) {
  return <div className="ll-cleo-flottant" data-ouvert={0} style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 1200, display: 'grid', justifyItems: 'end', gap: '14px' }}>
    <AIAgentLauncher className="cp-lanceur" avatar={AVATAR_CLEO} ouvert={false} pastille={0} onClick={onClick} etiquette="Parler à Cléo" /></div>;
}
/* Rejoue, une fois l'agent monté (ses écouteurs sont posés dans ses effets, avant celui-ci), les événements reçus avant son chargement. */
function Relais({ attente, onMonte }) {
  useEffect(() => { for (const [nom, detail] of attente.current) window.dispatchEvent(new CustomEvent(nom, { detail })); attente.current = []; onMonte(); }, [attente, onMonte]);
  return null;
}

export default function Coquille({ children }) {
  const chemin = usePathname() || '/';
  const lang = useLangue();
  /* Les composants du prototype raisonnent en adresses françaises (lien actif, etc.). */
  const cheminFR = lang === 'en' ? versFR(chemin) : chemin;
  const [agent, setAgent] = useState(false);
  const [cleoPret, setCleoPret] = useState(false);
  /* Le bouton flottant servi par le serveur reste le même nœud jusqu'à ce que l'agent soit monté : un geste (pointerdown) lance le
     chargement, et le clic qui suit doit tomber sur le même bouton, sinon il est perdu. */
  const [cleoMonte, setCleoMonte] = useState(false);
  const attente = useRef([]);
  useEffect(() => {
    if (cleoPret) return;
    const charger = () => { setCleoPret(true); import('@/lib/leaflet-global'); };
    const garder = (e) => { attente.current.push([e.type, e.detail]); charger(); };
    const sc = document.getElementById('ll-scroll');
    GESTES.forEach((g) => window.addEventListener(g, charger, { once: true, passive: true }));
    sc && sc.addEventListener('scroll', charger, { once: true, passive: true });
    window.addEventListener('ll-temoins-vue', charger, { once: true });
    window.addEventListener('ll-cleo', garder); window.addEventListener('ll-cleo-profil', garder);
    const t = setTimeout(charger, 8000);
    return () => { GESTES.forEach((g) => window.removeEventListener(g, charger)); sc && sc.removeEventListener('scroll', charger); window.removeEventListener('ll-temoins-vue', charger); window.removeEventListener('ll-cleo', garder); window.removeEventListener('ll-cleo-profil', garder); clearTimeout(t); };
  }, [cleoPret]);
  useEffect(() => { demarrerFinitions(); }, []);
  /* Nouvelle page : retour en haut de la zone de défilement (le prototype le faisait à chaque changement d'adresse). */
  useEffect(() => {
    const sc = document.getElementById('ll-scroll');
    const ancre = decodeURIComponent((window.location.hash || '').slice(1));
    const el = ancre && document.getElementById(ancre);
    if (sc) sc.scrollTop = el ? Math.max(0, el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 124) : 0;
  }, [chemin]);
  return (
    <FormeBoutonContexte.Provider value={FORME_VOIE}>
      <PontRouteur lang={lang} />
      {/* #root : même conteneur que le prototype (des règles de site.css s'y appliquent, ex. échelle des titres). */}
      <div id="root">
      <div id="ll-scroll" style={{ height: '100vh', overflowY: 'auto', background: 'var(--gris-000)' }}>
        <a href="#ll-page" className="ll-evitement" onClick={e => { e.preventDefault(); const m = document.getElementById('ll-page'); if (m) { m.setAttribute('tabindex', '-1'); m.focus(); } }}>Aller au contenu</a>
        <Entete page={cheminFR} aller={naviguer} />
        <main id="ll-page" key={chemin}>{children}</main>
        <PiedRevue />
        {!cleoMonte && <Lanceur onClick={() => { setAgent(true); setCleoPret(true); }} />}
        {cleoPret && <Suspense fallback={null}><AgentIAComplet ouvert={agent} setOuvert={setAgent} aller={naviguer} /><Relais attente={attente} onMonte={() => setCleoMonte(true)} /></Suspense>}
        <CleoTemoins />
        <PixelMeta />
      </div>
      </div>
    </FormeBoutonContexte.Provider>
  );
}
