/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/fiche.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { LL_CARTE } from '@/proto/routes';
import { gab } from '@/proto/blocs';
import { __ssr } from '@/lib/hydratation';
/* Carte de la fiche (S6) : image locale du secteur, aucune requête externe; la carte interactive se charge au clic seulement, depuis LL_CARTE. */
function CarteFiche({
  quartier,
  lat,
  lng
}) {
  const [on, setOn] = React.useState(false),
    ref = React.useRef(null),
    C = LL_CARTE,
    pret = /^https?:\/\//.test(C.tuiles || ''),
    g = gab || (t => t);
  React.useEffect(() => {
    if (!on || !pret || !ref.current || !((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.L : undefined)) return;
    const m = (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.L.map(ref.current, {
      zoomControl: true,
      attributionControl: true
    }).setView([lat, lng], 15) : undefined;
    window.L.tileLayer(C.tuiles, {
      maxZoom: 17,
      attribution: C.attribution
    }).addTo(m);
    window.L.circleMarker([lat, lng], {
      radius: 8,
      color: '#fff',
      weight: 3,
      fillColor: '#0C2147',
      fillOpacity: 1
    }).addTo(m);
    return () => m.remove();
  }, [on]);
  return <div style={{
    display: 'grid',
    gap: '8px',
    marginTop: '12px'
  }}>
    <div style={{
      height: '150px',
      borderRadius: 'var(--rayon-2)',
      overflow: 'hidden',
      border: '1px solid var(--bordure-fine)',
      background: 'var(--gris-100)',
      position: 'relative'
    }}>
      {on && pret ? <div ref={ref} style={{
        position: 'absolute',
        inset: 0
      }}></div> : <svg role="img" aria-label={'Secteur du logement : ' + quartier} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{
        display: 'block'
      }}>
          <rect width="300" height="150" fill="#EEF3F9" />
          <g stroke="#D5E2F2" strokeWidth="1">{Array.from({
            length: 16
          }, (_, k) => <line key={'v' + k} x1={k * 20} y1="0" x2={k * 20} y2="150" />)}{Array.from({
            length: 8
          }, (_, k) => <line key={'h' + k} x1="0" y1={k * 20} x2="300" y2={k * 20} />)}</g>
          <g stroke="#fff" strokeWidth="6"><line x1="0" y1="62" x2="300" y2="62" /><line x1="128" y1="0" x2="128" y2="150" /></g>
          <circle cx="150" cy="78" r="22" fill="rgba(69,129,203,.16)" /><circle cx="150" cy="78" r="8" fill="#0C2147" stroke="#fff" strokeWidth="3" />
          <text x="12" y="140" fontFamily="Poppins, sans-serif" fontSize="11" fontWeight="600" fill="#3767A2">{quartier}</text></svg>}
    </div>
    {!on && <button type="button" onClick={() => setOn(true)} style={{
      justifySelf: 'start',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      minHeight: '40px',
      padding: '0 14px',
      borderRadius: '10px',
      border: '1px solid rgba(12,33,71,.2)',
      background: '#fff',
      cursor: 'pointer',
      fontFamily: 'var(--police-corps)',
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--marine-900)'
    }}><Icon name="map" size={15} />Afficher la carte interactive</button>}
    {on && !pret && <span role="status" style={{
      fontSize: '12.5px',
      color: 'var(--texte-discret)'
    }}>Carte interactive disponible dès que la source de tuiles est approuvée ({g('[URL des tuiles approuvées]')}).</span>}
    <span style={{
      fontSize: '12px',
      lineHeight: 1.5,
      color: 'var(--texte-discret)'
    }}>Carte fournie par {g(C.fournisseur || '[fournisseur]')} ; en l’affichant, votre adresse IP lui est transmise.</span>
  </div>;
}
export { CarteFiche };
