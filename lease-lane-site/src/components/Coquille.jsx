/** @jsxImportSource @/lib/i18n */
'use client';
/* Gabarit commun de toutes les pages (repris de App, app.jsx du prototype) :
   lien d'évitement, en-tête et menu, contenu, pied de page, Cléo (bulle et panneau) et bandeau des témoins.
   La zone #ll-scroll garde le défilement du prototype (les composants l'écoutent). */
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FormeBoutonContexte } from '@/components/ds';
import { FORME_VOIE, AgentIA } from '@/proto/app';
import { Entete } from '@/proto/chrome';
import { PiedRevue } from '@/proto/pied-options';
import { CleoTemoins } from '@/proto/cleo-temoins';
import { naviguer, PontRouteur } from '@/lib/routeur';
import { useLangue } from '@/lib/i18n/contexte';
import { versFR } from '@/lib/i18n/adresses';
import { demarrerFinitions } from '@/lib/finitions';
import '@/lib/leaflet-global';

export default function Coquille({ children }) {
  const chemin = usePathname() || '/';
  const lang = useLangue();
  /* Les composants du prototype raisonnent en adresses françaises (lien actif, etc.). */
  const cheminFR = lang === 'en' ? versFR(chemin) : chemin;
  const [agent, setAgent] = useState(false);
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
        <AgentIA ouvert={agent} setOuvert={setAgent} aller={naviguer} />
        <CleoTemoins />
      </div>
      </div>
    </FormeBoutonContexte.Provider>
  );
}
