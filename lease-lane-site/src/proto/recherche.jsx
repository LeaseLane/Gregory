/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/recherche.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon, Button } from '@/components/ds';
import { LL_QUARTIERS } from '@/proto/pages-guides';
import { LL_DATA } from '@/proto/data';
import { __ssr } from '@/lib/hydratation';

/* Carte provisoire, blanc et bleu, dessinée dans le navigateur (aucun serveur de tuiles) en attendant le fournisseur de cartes du site.
   Positions réelles des logements; repères de quartier aux coordonnées approximatives de leur centre. Aucune géographie dessinée à la main. */
const QX = {
  limoilou: [46.833, -71.222],
  montcalm: [46.803, -71.232],
  'saint-roch': [46.815, -71.226],
  'saint-sauveur': [46.808, -71.243],
  'sainte-foy': [46.776, -71.288],
  charlesbourg: [46.861, -71.268],
  beauport: [46.858, -71.193],
  lebourgneuf: [46.838, -71.287],
  'vieux-quebec': [46.812, -71.207]
};
const grille = () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.L.GridLayer.extend({
  createTile() {
    const s = this.getTileSize(),
      c = document.createElement('canvas'),
      r = 2;
    c.width = s.x * r;
    c.height = s.y * r;
    c.style.width = s.x + 'px';
    c.style.height = s.y + 'px';
    const x = c.getContext('2d');
    x.scale(r, r);
    x.fillStyle = '#fff';
    x.fillRect(0, 0, s.x, s.y);
    x.strokeStyle = 'rgba(69,129,203,.12)';
    x.lineWidth = 1;
    x.beginPath();
    for (let i = 32; i < s.x; i += 32) {
      x.moveTo(i + .5, 0);
      x.lineTo(i + .5, s.y);
    }
    for (let j = 32; j < s.y; j += 32) {
      x.moveTo(0, j + .5);
      x.lineTo(s.x, j + .5);
    }
    x.stroke();
    x.strokeStyle = 'rgba(69,129,203,.26)';
    x.beginPath();
    x.moveTo(.5, 0);
    x.lineTo(.5, s.y);
    x.moveTo(0, .5);
    x.lineTo(s.x, .5);
    x.stroke();
    x.fillStyle = 'rgba(69,129,203,.5)';
    for (let i = 0; i < s.x; i += 32) for (let j = 0; j < s.y; j += 32) {
      x.beginPath();
      x.arc(i + .5, j + .5, 1.3, 0, 7);
      x.fill();
    }
    return c;
  }
}) : undefined;
const qHTML = n => '<a class="lr-q" href="#/quartiers/' + n.s + '" aria-label="Guide du quartier ' + n.n + '"><span class="lr-q-pt"></span><span class="lr-q-t">' + n.n + '</span></a>';
const CENTRE = [46.818, -71.240];
const PHOTO_DEF = "/assets/img/logements/montcalm-cartier.jpg";
const prixN = p => parseInt(String(p).replace(/\D/g, '')) || 0;
const typeDe = l => {
  const m = String(l.titre || '').match(/(\d)\s*½/);
  return m ? m[1] + ' ½' : 'Autre';
};

/* Toujours réécrit : le paquet du système charge une ancienne copie de ce fichier avant celle-ci. */

const mkHTML = (l, on) => '<div class="lr-mk" data-on="' + (on ? 1 : 0) + '"><div class="lr-mk-p">' + l.prix + '</div><div class="lr-mk-q"></div></div>';
function Carte({
  logements,
  selection,
  setSelection,
  survol
}) {
  const ref = React.useRef(null),
    [carte, setCarte] = React.useState(null);
  const couche = React.useRef(null),
    mks = React.useRef({}),
    prec = React.useRef(null),
    cadrer = React.useRef(null);
  React.useEffect(() => {
    if (!((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.L : undefined) || !ref.current || carte) return;
    const m = (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.L.map(ref.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      preferCanvas: true,
      minZoom: 11,
      maxZoom: 17,
      maxBounds: [[46.68, -71.52], [46.98, -70.98]],
      maxBoundsViscosity: .8
    }).setView(CENTRE, 12) : undefined;
    setCarte(m);
    m.attributionControl.setPrefix(false);
    m.attributionControl.addAttribution('Carte provisoire · Lease Lane');
    /* Vue d'ensemble : les quartiers se réduisent à leur point pour laisser les prix lisibles; leurs noms apparaissent dès le zoom 13. */
    const z = () => ref.current && ref.current.classList.toggle('lr-z-loin', m.getZoom() < 13);
    m.on('zoomend', z);
    z();
    let vide = !ref.current.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = ref.current && ref.current.clientWidth;
      m.invalidateSize({
        pan: false
      });
      if (vide && w) {
        vide = false;
        m.setView(m.getCenter(), m.getZoom(), {
          reset: true
        });
        couche.current && couche.current.redraw();
        cadrer.current && cadrer.current();
      } else if (!w) vide = true;
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [carte]);
  React.useEffect(() => {
    if (!carte || couche.current) return;
    const G = grille();
    couche.current = new G({
      tileSize: 256
    }).addTo(carte);
    LL_QUARTIERS.forEach(q => {
      const p = QX[q.s];
      if (!p) return;
      window.L.circle(p, {
        radius: 900,
        stroke: true,
        color: '#4581CB',
        weight: 1,
        opacity: .35,
        dashArray: '3 5',
        fillColor: '#4581CB',
        fillOpacity: .07,
        interactive: false
      }).addTo(carte);
      window.L.marker(p, {
        icon: (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.L.divIcon({
          html: qHTML(q),
          className: '',
          iconSize: [0, 0]
        }) : undefined,
        keyboard: false,
        zIndexOffset: -500,
        title: 'Guide du quartier ' + q.n
      }).addTo(carte);
    });
  }, [carte]);
  /* Marqueurs : recréés seulement quand la liste filtrée change. */
  React.useEffect(() => {
    if (!carte) return;
    Object.values(mks.current).forEach(m => carte.removeLayer(m));
    mks.current = {};
    prec.current = null;
    logements.forEach(l => {
      const mk = (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.L.marker([l.lat, l.lng], {
        icon: window.L.divIcon({
          html: mkHTML(l, false),
          className: '',
          iconSize: [0, 0]
        }),
        keyboard: true,
        title: l.titre + ', ' + l.prix
      }).addTo(carte) : undefined;
      mk.on('click', () => setSelection(l.id));
      mks.current[l.id] = mk;
    });
    cadrer.current = () => {
      if (!ref.current || !ref.current.clientWidth) return;
      carte.invalidateSize();
      if (logements.length > 1) carte.fitBounds((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.L.latLngBounds(logements.map(l => [l.lat, l.lng])) : undefined, {
        padding: [60, 60],
        maxZoom: 14
      });else if (logements[0]) carte.setView([logements[0].lat, logements[0].lng], 14);
    };
    cadrer.current();
  }, [carte, logements]);
  /* Sélection : seuls l'ancien et le nouveau marqueur sont redessinés. */
  const actif = survol || selection;
  React.useEffect(() => {
    if (!carte) return;
    const ic = (id, on) => {
      const m = mks.current[id],
        l = logements.find(x => x.id === id);
      if (m && l) {
        m.setIcon((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.L.divIcon({
          html: mkHTML(l, on),
          className: '',
          iconSize: [0, 0]
        }) : undefined);
        m.setZIndexOffset(on ? 1000 : 0);
      }
    };
    if (prec.current && prec.current !== actif) ic(prec.current, false);
    if (actif) ic(actif, true);
    prec.current = actif;
  }, [carte, actif, logements]);
  const btn = {
    width: '40px',
    height: '40px',
    display: 'grid',
    placeItems: 'center',
    border: 0,
    background: '#fff',
    cursor: 'pointer',
    color: '#0C2147'
  };
  const groupe = {
    display: 'grid',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid rgba(12,33,71,.16)',
    boxShadow: '0 10px 24px -12px rgba(12,33,71,.35)',
    overflow: 'hidden'
  };
  return <div className="lr-carte" style={{
    position: 'relative',
    height: '100%',
    background: '#fff'
  }}>
    <div ref={ref} style={{
      position: 'absolute',
      inset: 0
    }} role="region" aria-label="Carte des logements" />
    <div style={{
      position: 'absolute',
      right: '16px',
      top: '16px',
      zIndex: 500,
      display: 'grid',
      gap: '10px'
    }}>
      <div style={groupe}><button className="lr-btn" style={btn} onClick={() => carte && carte.zoomIn()} aria-label="Zoom avant"><Icon name="plus" size={18} /></button><span style={{
          height: '1px',
          background: 'var(--bordure-fine)'
        }} />
        <button className="lr-btn" style={btn} onClick={() => carte && carte.zoomOut()} aria-label="Zoom arrière"><Icon name="minus" size={18} /></button></div>
      <div style={groupe}><button className="lr-btn" style={btn} onClick={() => carte && logements.length && carte.fitBounds((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.L.latLngBounds(logements.map(l => [l.lat, l.lng])) : undefined, {
          padding: [60, 60],
          maxZoom: 14
        })} aria-label="Voir tous les résultats"><Icon name="locate-fixed" size={18} /></button></div>
    </div>
  </div>;
}
const Puce = ({
  on,
  onClick,
  children
}) => <button type="button" aria-pressed={on} onClick={onClick} className="lr-puce" style={{
  height: '36px',
  padding: '0 14px',
  borderRadius: '8px',
  border: '1px solid ' + (on ? '#0C2147' : 'rgba(12,33,71,.18)'),
  background: on ? '#0C2147' : '#fff',
  color: on ? '#fff' : '#0C2147',
  fontFamily: 'var(--police-corps)',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
}}>{children}</button>;
/* Menu déroulant (rectangle, coins adoucis) : choix unique ou multiple, fermeture au clic extérieur et à Échap. */
function Menu({
  lab,
  valeur,
  options,
  multi,
  choisi,
  onChoix,
  ic,
  plein,
  h,
  droite
}) {
  const [o, setO] = React.useState(false),
    r = React.useRef(null),
    id = React.useId ? React.useId() : 'm' + lab;
  React.useEffect(() => {
    if (!o) return;
    const f = e => {
        if (r.current && !r.current.contains(e.target)) setO(false);
      },
      k = e => {
        if (e.key === 'Escape') setO(false);
      };
    document.addEventListener('mousedown', f);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', f);
      document.removeEventListener('keydown', k);
    };
  }, [o]);
  const actif = multi ? choisi.length > 0 : choisi !== options[0][0];
  return <div ref={r} style={{
    position: 'relative',
    width: plein ? '100%' : undefined
  }}>
    <button type="button" aria-haspopup="listbox" aria-expanded={o} aria-controls={id} onClick={() => setO(x => !x)} className="lr-puce" style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: plein ? 'space-between' : undefined,
      width: plein ? '100%' : undefined,
      boxSizing: 'border-box',
      gap: '8px',
      height: h || '52px',
      padding: '0 12px 0 14px',
      borderRadius: '12px',
      border: '1px solid ' + (actif || o ? '#0C2147' : 'rgba(12,33,71,.18)'),
      background: actif ? '#F3F7FC' : '#fff',
      color: '#0C2147',
      fontFamily: 'var(--police-corps)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      textAlign: 'left'
    }}>
      <span style={{
        fontSize: '13px',
        fontWeight: 600
      }}>{actif ? valeur : lab}</span>
      <Icon name="chevron-down" size={14} color="#0C2147" style={{
        marginLeft: '4px',
        transform: o ? 'rotate(180deg)' : 'none',
        transition: 'transform 240ms cubic-bezier(.22,1,.36,1)'
      }} /></button>
    {o && <ul id={id} role="listbox" aria-multiselectable={multi || undefined} aria-label={lab} className="lr-in" style={{
      position: 'absolute',
      left: droite ? 'auto' : 0,
      right: droite ? 0 : 'auto',
      top: 'calc(100% + 8px)',
      zIndex: 2000,
      minWidth: plein ? '100%' : '220px',
      boxSizing: 'border-box',
      margin: 0,
      padding: '6px',
      listStyle: 'none',
      background: '#fff',
      borderRadius: '10px',
      border: '1px solid rgba(12,33,71,.16)',
      boxShadow: '0 24px 48px -20px rgba(12,33,71,.45)'
    }}>
      {options.map(([v, t]) => {
        const on = multi ? choisi.includes(v) : choisi === v;
        return <li key={v} role="option" aria-selected={on}><button type="button" onClick={() => {
            onChoix(v);
            if (!multi) setO(false);
          }} className="lr-opt" style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '18px minmax(0,1fr)',
            gap: '10px',
            alignItems: 'center',
            minHeight: '40px',
            padding: '8px 10px',
            border: 0,
            borderRadius: '6px',
            background: on ? '#F3F7FC' : 'transparent',
            cursor: 'pointer',
            fontFamily: 'var(--police-corps)',
            fontSize: '13.5px',
            fontWeight: on ? 700 : 500,
            color: '#0C2147',
            textAlign: 'left'
          }}>
        <span aria-hidden="true" style={{
              width: '18px',
              height: '18px',
              boxSizing: 'border-box',
              borderRadius: multi ? '4px' : '50%',
              border: '1.5px solid ' + (on ? '#0C2147' : 'rgba(12,33,71,.3)'),
              background: on ? '#0C2147' : '#fff',
              display: 'grid',
              placeItems: 'center'
            }}>{on && (multi ? <Icon name="check" size={12} color="#fff" /> : <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#fff'
              }} />)}</span>{t}</button></li>;
      })}
      {multi && choisi.length > 0 && <li style={{
        borderTop: '1px solid var(--bordure-fine)',
        marginTop: '4px',
        paddingTop: '4px'
      }}><button type="button" onClick={() => onChoix(null)} style={{
          width: '100%',
          minHeight: '36px',
          padding: '0 10px',
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'var(--police-corps)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--texte-lien)',
          textAlign: 'left'
        }}>Effacer</button></li>}</ul>}
  </div>;
}
const Etiq = ({
  children
}) => <span style={{
  fontSize: '11.5px',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#3767A2'
}}>{children}</span>;
function Logement({
  l,
  on,
  i,
  onSurvol,
  onChoisir,
  aller,
  g
}) {
  const ph = l.photo || (l.id === 'L1' ? PHOTO_DEF : null),
    libre = /immédiat/i.test(l.dispo || ''),
    quand = libre ? 'Libre' : String(l.dispo || '').replace(/^Libre (le )?/i, '');
  return <li className="lr-item lr-in" data-on={on ? 1 : 0} data-g={g ? 1 : 0} style={{
    animationDelay: Math.min(i, 8) * 45 + 'ms',
    display: 'grid',
    gridTemplateColumns: g ? 'minmax(0,1fr)' : '198px minmax(0,1fr)',
    alignContent: g ? 'start' : 'stretch',
    alignItems: g ? undefined : 'center',
    gap: g ? '14px' : '22px',
    padding: g ? '12px 12px 16px' : '16px 24px 16px 16px',
    minHeight: g ? undefined : '230px',
    boxSizing: 'border-box',
    borderRadius: g ? '14px' : '0 14px 14px 0',
    border: g ? '1px solid rgba(12,33,71,.12)' : 0,
    background: g ? '#fff' : undefined,
    cursor: 'pointer'
  }} onMouseEnter={() => onSurvol(l.id)} onMouseLeave={() => onSurvol(null)} onClick={() => onChoisir(l.id)}>
    <span className="lr-ph" style={{
      position: 'relative',
      aspectRatio: g ? '4 / 3' : '1 / 1',
      alignSelf: g ? undefined : 'center',
      borderRadius: '10px',
      overflow: 'hidden',
      background: 'linear-gradient(160deg,#EAF1FA,#D5E2F2)',
      display: 'grid',
      placeItems: 'center'
    }}>
      {ph ? <img src={ph} alt="" loading="lazy" decoding="async" style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }} /> : <Icon name="building-2" size={26} color="#91B5E0" />}
      {l.dispo && <span style={{
        position: 'absolute',
        left: '8px',
        top: '8px',
        height: '24px',
        padding: '0 9px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '8px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(12,33,71,.18)',
        fontSize: '11.5px',
        fontWeight: 700,
        color: libre ? '#1F7A52' : '#0C2147'
      }}><span aria-hidden="true" style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: libre ? '#3FB37F' : '#4581CB'
        }} />{quand}</span>}</span>
    <span style={{
      display: 'grid',
      gap: g ? '6px' : '12px',
      alignContent: 'start',
      minWidth: 0
    }}>
      <span style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '10px'
      }}><span style={{
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#0C2147',
          fontVariantNumeric: 'tabular-nums'
        }}>{l.prix}<span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#58697F',
            letterSpacing: 0
          }}> / mois</span></span></span>
      <a href="/logements-a-louer/4-et-demi-renove-montcalm" onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        aller('fiche');
      }} style={{
        fontSize: '15px',
        fontWeight: 700,
        lineHeight: 1.3,
        color: '#0C2147',
        textDecoration: 'none'
      }}>{l.titre}</a>
      <span style={{
        fontSize: '12.5px',
        fontWeight: 600,
        color: '#3E4A59',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>{l.propriete || l.adresse}</span>
      <span style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px 14px',
        marginTop: '4px',
        fontSize: '12.5px',
        fontWeight: 600,
        color: '#3E4A59'
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px'
        }}><Icon name="bed" size={14} color="#4581CB" />{l.chambres} ch.</span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px'
        }}><Icon name="bath" size={14} color="#4581CB" />{l.sallesDeBain} sdb</span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px'
        }}><Icon name="ruler" size={14} color="#4581CB" />{l.superficie} pi²</span>
        {l.annee && <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px'
        }}><Icon name="calendar" size={14} color="#4581CB" />{'Construit en ' + l.annee}</span>}</span></span>
  </li>;
}
function Apercu({
  l,
  aller,
  fermer
}) {
  const ph = l.photo || (l.id === 'L1' ? PHOTO_DEF : null);
  return <article key={l.id} className="lr-apercu lr-in" aria-label={'Aperçu : ' + l.titre} style={{
    position: 'absolute',
    left: '16px',
    bottom: '80px',
    zIndex: 600,
    width: '340px',
    background: '#fff',
    borderRadius: '18px',
    border: '1px solid rgba(12,33,71,.16)',
    boxShadow: '0 30px 60px -28px rgba(12,33,71,.55)',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'relative',
      height: '150px',
      background: 'linear-gradient(160deg,#EAF1FA,#D5E2F2)',
      display: 'grid',
      placeItems: 'center'
    }}>{ph ? <img src={ph} alt="" loading="lazy" decoding="async" style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }} /> : <Icon name="building-2" size={32} color="#91B5E0" />}
      <button type="button" onClick={fermer} aria-label="Fermer l’aperçu" className="lr-btn" style={{
        position: 'absolute',
        right: '10px',
        top: '10px',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: 0,
        background: '#fff',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(12,33,71,.2)'
      }}><Icon name="x" size={16} color="#0C2147" /></button></div>
    <div style={{
      padding: '18px 20px 20px',
      display: 'grid',
      gap: '8px'
    }}>
      <span style={{
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: '#0C2147'
      }}>{l.prix}<span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#58697F',
          letterSpacing: 0
        }}> / mois</span></span>
      <span style={{
        fontSize: '15px',
        fontWeight: 700,
        color: '#0C2147'
      }}>{l.titre}</span><span style={{
        fontSize: '13px',
        color: '#58697F'
      }}>{l.adresse}{l.dispo ? ' · ' + l.dispo : ''}</span>
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginTop: '8px'
      }}><Button variant="primaire" size="m" onClick={() => aller('fiche')}>Voir la fiche</Button>
        <Button variant="secondaire" size="m" onClick={() => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.dispatchEvent(new CustomEvent('ll-cleo', {
          detail: {
            texte: 'Je voudrais planifier une visite'
          }
        })) : undefined}>Planifier une visite</Button></div></div>
  </article>;
}
function Recherche({
  aller,
  data,
  selection,
  setSelection
}) {
  const tous = data.logements,
    max = Math.max(...tous.map(l => prixN(l.prix)), 2000);
  const [statut, setStatut] = React.useState('tous'),
    [types, setTypes] = React.useState([]),
    [secteur, setSecteur] = React.useState(''),
    [budget, setBudget] = React.useState(max);
  const [vue, setVue] = React.useState('carte'),
    [tri, setTri] = React.useState('recent'),
    [mob, setMob] = React.useState('liste'),
    [survol, setSurvol] = React.useState(null),
    [apercu, setApercu] = React.useState(false);
  const corps = React.useRef(null),
    [enVue, setEnVue] = React.useState(false);
  React.useEffect(() => {
    const el = corps.current;
    if (!el) return;
    const io = new IntersectionObserver(([x]) => setEnVue(x.isIntersecting && x.intersectionRatio > .35), {
      threshold: [0, .35, .6]
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const [avance, setAvance] = React.useState(false),
    [ch, setCh] = React.useState(0),
    [sdb, setSdb] = React.useState(0),
    [sup, setSup] = React.useState(0),
    [dispo, setDispo] = React.useState(''),
    [incl, setIncl] = React.useState([]);
  const INCL = [['chauff', 'Chauffé'], ['eclaire', 'Éclairé'], ['meuble', 'Meublé'], ['station', 'Stationnement'], ['animaux', 'Animaux acceptés'], ['laveuse', 'Entrées laveuse-sécheuse']];
  const txt = l => (String(l.titre) + ' ' + String(l.detail || '') + ' ' + String(l.description || '') + ' ' + (l.inclus || []).join(' ')).toLowerCase();
  const inclOk = (l, k) => {
    const t = txt(l);
    return {
      chauff: /chauff/.test(t),
      eclaire: /éclair|eclair/.test(t),
      meuble: /meubl/.test(t),
      station: /stationn/.test(t),
      animaux: /animau/.test(t),
      laveuse: /laveuse/.test(t)
    }[k];
  };
  const [bat, setBat] = React.useState([]),
    [prop, setProp] = React.useState([]),
    [an, setAn] = React.useState('');
  const BATS = ['Plex (2 à 5 logements)', 'Immeuble de 6 logements et +', 'Maison de ville'],
    PROPS = ['Appartement', 'Condo locatif', 'Maison', 'Studio ou loft'];
  const ANS = [['', 'Peu importe'], ['-1950', 'Avant 1950'], ['1950-1999', '1950 à 1999'], ['2000-2019', '2000 à 2019'], ['2020-', '2020 et +']];
  const anOk = l => {
    if (!an) return true;
    const [a, b] = an.split('-').map(x => x ? +x : null),
      y = +l.annee || 0;
    return y && (a == null || y >= a) && (b == null || y < b + (an === '-1950' ? 0 : 1));
  };
  const nAv = (ch ? 1 : 0) + (sdb ? 1 : 0) + (sup ? 1 : 0) + (dispo ? 1 : 0) + incl.length + bat.length + prop.length + (an ? 1 : 0);
  const TYPES = React.useMemo(() => [...new Set(tous.map(typeDe))].sort(), [tous]);
  const res = React.useMemo(() => {
    let c = tous.filter(l => prixN(l.prix) <= budget && (!types.length || types.includes(typeDe(l))) && (!secteur || String(l.adresse).includes(secteur) || String(l.titre).includes(secteur)) && (statut === 'tous' || (statut === 'libre' ? /immédiat/i.test(l.dispo || '') : !/immédiat/i.test(l.dispo || ''))) && (!ch || (+l.chambres || 0) >= ch) && (!sdb || (+l.sallesDeBain || 0) >= sdb) && (!sup || (+l.superficie || 0) >= sup) && (!dispo || String(l.dispo || '').toLowerCase().includes(dispo)) && incl.every(k => inclOk(l, k)) && (!bat.length || bat.includes(l.batiment)) && (!prop.length || prop.includes(l.propriete)) && anOk(l));
    if (tri === 'prix') c = [...c].sort((a, b) => prixN(a.prix) - prixN(b.prix));
    if (tri === 'grand') c = [...c].sort((a, b) => b.superficie - a.superficie);
    return c;
  }, [tous, statut, types, secteur, budget, tri, ch, sdb, sup, dispo, incl, bat, prop, an]);
  const sel = apercu && res.find(l => l.id === selection);
  /* Clic sur un logement (liste ou carte) : on ouvre directement sa fiche, sans aperçu intermédiaire (9 oct. 2026). */
  const choisir = id => {
    setSelection(id);
    aller('fiche');
  };
  const VUES = [['carte', 'map', 'Carte'], ['liste', 'list', 'Liste'], ['grille', 'layout-grid', 'Grille']],
    large = vue !== 'carte';
  const filtres = !!(statut !== 'tous' || types.length || secteur || budget < max || nAv);
  const remise = () => {
    setBat([]);
    setProp([]);
    setAn('');
    setStatut('tous');
    setTypes([]);
    setSecteur('');
    setBudget(max);
    setCh(0);
    setSdb(0);
    setSup(0);
    setDispo('');
    setIncl([]);
  };
  const Compteur = ({
    lab,
    v,
    set,
    maxi,
    suf
  }) => <div style={{
    display: 'grid',
    gap: '8px'
  }}><Etiq>{lab}</Etiq><div role="group" aria-label={lab} style={{
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap'
    }}>{Array.from({
        length: maxi + 1
      }, (_, i) => i).map(i => <Puce key={i} on={v === i} onClick={() => set(i)}>{i === 0 ? 'Peu importe' : i + (i === maxi ? '+' : '') + (suf || '')}</Puce>)}</div></div>;
  const sel_ = {
    height: '52px',
    padding: '0 36px 0 14px',
    borderRadius: '12px',
    border: '1px solid rgba(12,33,71,.18)',
    background: '#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%230C2147%27 stroke-width=%272.5%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E") no-repeat right 14px center',
    WebkitAppearance: 'none',
    appearance: 'none',
    fontFamily: 'var(--police-corps)',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0C2147',
    cursor: 'pointer'
  };
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    height: 'calc((100vh - var(--web-entete,108px)) * 1.3)',
    minHeight: '884px'
  }}>
    <div style={{
      position: 'relative',
      zIndex: 30,
      background: '#fff',
      borderBottom: '1px solid rgba(12,33,71,.12)'
    }}>
      <div className="lr-filtres" style={{
        maxWidth: 'none',
        margin: 0,
        padding: '42px clamp(16px,2vw,28px)',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.7fr) repeat(3,minmax(0,1fr)) minmax(0,1.3fr) minmax(0,1.2fr)',
        gap: '12px',
        alignItems: 'stretch'
      }}>
        <button type="button" onClick={() => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.dispatchEvent(new CustomEvent('ll-cleo', {
          detail: {
            texte: 'Je cherche un logement à Québec'
          }
        })) : undefined} className="lr-cleo" aria-label="Écrire à Cléo : Vous désirez de l’aide?" style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(0,1fr) auto',
          alignItems: 'center',
          gap: '12px',
          height: '52px',
          boxSizing: 'border-box',
          padding: '0 18px 0 6px',
          borderRadius: '12px',
          border: 0,
          background: '#0C2147',
          color: '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'var(--police-corps)',
          minWidth: 0
        }}>
          <span className="lr-cleo-av" style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            flex: 'none'
          }}><img src="/assets/img/cleo-avatar.png" alt="" style={{
              width: '40px',
              height: '40px',
              borderRadius: '9px',
              objectFit: 'cover',
              display: 'block',
              boxShadow: '0 0 0 0.7px #fff'
            }} /><span aria-hidden="true" className="cr-pouls" style={{
              position: 'absolute',
              right: '-3px',
              bottom: '-3px',
              width: '11px',
              height: '11px',
              borderRadius: '50%',
              background: '#3FB37F',
              border: '2px solid #0C2147'
            }} /></span>
          <span style={{
            display: 'grid',
            minWidth: 0
          }}><span style={{
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: 1.35,
              color: '#fff'
            }}>Vous désirez de l’aide?</span></span><span aria-hidden="true" className="lr-cleo-fl" style={{
            display: 'grid',
            marginRight: '-4px'
          }}><Icon name="arrow-right" size={17} color="#fff" /></span></button>
        <Menu plein lab="Disponibilité" ic="calendar-check" options={[['tous', 'Tous'], ['libre', 'Libre maintenant'], ['bientot', 'Bientôt libre']]} choisi={statut} valeur={{
          tous: 'Tous',
          libre: 'Libre maintenant',
          bientot: 'Bientôt libre'
        }[statut]} onChoix={setStatut} />
        <Menu plein multi lab="Grandeur" ic="layers" options={TYPES.map(t => [t, t])} choisi={types} valeur={types.length ? types.join(', ') : 'Toutes'} onChoix={t => t === null ? setTypes([]) : setTypes(v => v.includes(t) ? v.filter(x => x !== t) : [...v, t])} />
        <Menu plein lab="Secteurs" ic="map-pin" options={[['', 'Tous les secteurs'], ...(LL_DATA.secteurs || []).map(s => [s.nom, s.nom])]} choisi={secteur} valeur={secteur} onChoix={setSecteur} />
        <label className="lr-budget" style={{
          display: 'grid',
          alignContent: 'center',
          gap: '8px',
          height: '52px',
          boxSizing: 'border-box',
          padding: '0 16px',
          borderRadius: '12px',
          border: '1px solid ' + (budget < max ? '#0C2147' : 'rgba(12,33,71,.18)'),
          background: budget < max ? '#F3F7FC' : '#fff'
        }}><span style={{
            display: 'flex',
            fontSize: '13px',
            fontWeight: 600,
            color: '#0C2147'
          }}>{budget >= max ? 'Échelle de prix' : 'Échelle de prix · ≤ ' + budget.toLocaleString('fr-CA') + ' $'}</span>
          <input type="range" className="lr-plage" min={800} max={max} step={25} value={budget} onChange={e => setBudget(+e.target.value)} style={{
            '--p': (budget - 800) / Math.max(1, max - 800) * 100 + '%'
          }} aria-label="Loyer maximal" /></label>
        <button type="button" aria-expanded={avance} aria-controls="lr-avance" onClick={() => setAvance(a => !a)} className="lr-puce" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          boxSizing: 'border-box',
          height: '52px',
          padding: '0 12px 0 16px',
          borderRadius: '12px',
          border: '1px solid ' + (avance || nAv ? '#0C2147' : 'rgba(12,33,71,.18)'),
          background: avance ? '#0C2147' : '#fff',
          color: avance ? '#fff' : '#0C2147',
          fontFamily: 'var(--police-corps)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}>
          <Icon name="sliders-horizontal" size={16} color="currentColor" />Recherche avancée{nAv > 0 && <span style={{
            minWidth: '20px',
            height: '20px',
            padding: '0 6px',
            boxSizing: 'border-box',
            borderRadius: '8px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '11px',
            background: avance ? '#fff' : '#0C2147',
            color: avance ? '#0C2147' : '#fff'
          }}>{nAv}</span>}
          <Icon name="chevron-down" size={15} color="currentColor" style={{
            marginLeft: 'auto',
            transform: avance ? 'rotate(180deg)' : 'none',
            transition: 'transform 260ms cubic-bezier(.22,1,.36,1)'
          }} /></button>
      </div>
      <div id="lr-avance" style={{
        display: 'grid',
        gridTemplateRows: avance ? '1fr' : '0fr',
        transition: 'grid-template-rows 360ms cubic-bezier(.22,1,.36,1)',
        background: '#F7FAFD',
        borderTop: avance ? '1px solid rgba(12,33,71,.1)' : '0'
      }} aria-hidden={!avance}>
        <div style={{
          overflow: 'hidden',
          minHeight: 0
        }}>
          <div className="lr-av-g" style={{
            maxWidth: 'var(--web-conteneur)',
            margin: '0 auto',
            padding: '22px var(--web-gouttiere) 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
            gap: '22px 40px',
            visibility: avance ? 'visible' : 'hidden'
          }}>
            <Compteur lab="Chambres" v={ch} set={setCh} maxi={4} />
            <Compteur lab="Salles de bain" v={sdb} set={setSdb} maxi={2} />
            <div style={{
              display: 'grid',
              gap: '8px'
            }}><Etiq>Superficie minimale</Etiq><div role="group" aria-label="Superficie minimale" style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }}>{[[0, 'Peu importe'], [700, '700 pi²+'], [900, '900 pi²+'], [1100, '1 100 pi²+']].map(([v, t]) => <Puce key={v} on={sup === v} onClick={() => setSup(v)}>{t}</Puce>)}</div></div>
            <div style={{
              display: 'grid',
              gap: '8px'
            }}><Etiq>Date d’emménagement</Etiq><div role="group" aria-label="Date d’emménagement" style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }}>{[['', 'Peu importe'], ['immédiat', 'Immédiatement'], ['juillet', '1er juillet'], ['octobre', '1er octobre']].map(([v, t]) => <Puce key={t} on={dispo === v} onClick={() => setDispo(v)}>{t}</Puce>)}</div></div>
            <div style={{
              display: 'grid',
              gap: '8px',
              gridColumn: 'span 2'
            }}><Etiq>Inclus et commodités</Etiq><div role="group" aria-label="Inclus et commodités" style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }}>{INCL.map(([k, t]) => {
                  const on = incl.includes(k);
                  return <Puce key={k} on={on} onClick={() => setIncl(v => on ? v.filter(x => x !== k) : [...v, k])}>{on && <Icon name="check" size={13} color="#fff" style={{
                      marginRight: '6px',
                      verticalAlign: '-2px'
                    }} />}{t}</Puce>;
                })}</div></div>
            <div style={{
              display: 'grid',
              gap: '8px'
            }}><Etiq>Type de bâtiment</Etiq><div role="group" aria-label="Type de bâtiment" style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }}>{BATS.map(k => {
                  const on = bat.includes(k);
                  return <Puce key={k} on={on} onClick={() => setBat(v => on ? v.filter(x => x !== k) : [...v, k])}>{on && <Icon name="check" size={13} color="#fff" style={{
                      marginRight: '6px',
                      verticalAlign: '-2px'
                    }} />}{k}</Puce>;
                })}</div></div>
            <div style={{
              display: 'grid',
              gap: '8px'
            }}><Etiq>Type de propriété</Etiq><div role="group" aria-label="Type de propriété" style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }}>{PROPS.map(k => {
                  const on = prop.includes(k);
                  return <Puce key={k} on={on} onClick={() => setProp(v => on ? v.filter(x => x !== k) : [...v, k])}>{on && <Icon name="check" size={13} color="#fff" style={{
                      marginRight: '6px',
                      verticalAlign: '-2px'
                    }} />}{k}</Puce>;
                })}</div></div>
            <div style={{
              display: 'grid',
              gap: '8px'
            }}><Etiq>Année de construction</Etiq><div role="group" aria-label="Année de construction" style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }}>{ANS.map(([v, k]) => <Puce key={k} on={an === v} onClick={() => setAn(v)}>{k}</Puce>)}</div></div>
            <div style={{
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              paddingTop: '16px',
              borderTop: '1px solid rgba(12,33,71,.1)'
            }}>
              <span aria-live="polite" style={{
                fontSize: '13px',
                color: '#3E4A59'
              }}><strong style={{
                  color: '#0C2147'
                }}>{res.length}</strong> logement{res.length > 1 ? 's' : ''} correspond{res.length > 1 ? 'ent' : ''} à vos critères</span>
              <span style={{
                display: 'flex',
                gap: '8px'
              }}>{filtres && <Button variant="fantome" size="m" onClick={remise}>Tout effacer</Button>}<Button variant="primaire" size="m" onClick={() => setAvance(false)}>Afficher les résultats</Button></span></div>
          </div></div></div></div>
    <div ref={corps} className="lr-corps" data-mob={mob} data-vue={vue} style={{
      position: 'relative',
      zIndex: 1,
      isolation: 'isolate',
      flex: 1,
      display: 'grid',
      gridTemplateColumns: large ? 'minmax(0,1fr)' : 'minmax(456px,552px) minmax(0,1fr)',
      minHeight: 0
    }}>
      <div className="lr-liste" style={{
        overflowY: 'auto',
        background: vue === 'grille' ? '#F7FAFD' : '#fff',
        borderRight: large ? 0 : '1px solid rgba(12,33,71,.12)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '35px 20px',
          background: vue === 'grille' ? 'rgba(247,250,253,.94)' : 'rgba(255,255,255,.94)',
          backdropFilter: 'blur(6px)'
        }}>
          <span aria-live="polite" style={{
            fontFamily: 'var(--police-corps)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#0C2147',
            whiteSpace: 'nowrap'
          }}>{res.length} logement{res.length > 1 ? 's' : ''}{filtres && <button type="button" onClick={remise} style={{
              marginLeft: '10px',
              border: 0,
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--texte-lien)'
            }}>Effacer les filtres</button>}</span>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div className="lr-vues" role="group" aria-label="Affichage" style={{
              display: 'flex',
              gap: '4px',
              height: '52px',
              boxSizing: 'border-box',
              padding: '5px',
              borderRadius: '12px',
              border: '1px solid rgba(12,33,71,.18)',
              background: '#fff'
            }}>{VUES.map(([k, ic, t]) => <button key={k} type="button" className="lr-vue" data-k={k} aria-pressed={vue === k} aria-label={'Vue ' + t.toLowerCase()} title={t} onClick={() => {
                setVue(k);
                setApercu(false);
                if (k !== 'carte') setMob('liste');
              }} style={{
                width: '44px',
                display: 'grid',
                placeItems: 'center',
                border: 0,
                borderRadius: '8px',
                background: vue === k ? '#0C2147' : 'transparent',
                color: vue === k ? '#fff' : '#0C2147',
                cursor: 'pointer'
              }}><Icon name={ic} size={16} color="currentColor" /></button>)}</div>
            <Menu droite lab="Pertinence" options={[['recent', 'Pertinence'], ['prix', 'Prix croissant'], ['grand', 'Plus grands']]} choisi={tri} valeur={{
              recent: 'Pertinence',
              prix: 'Prix croissant',
              grand: 'Plus grands'
            }[tri]} onChoix={setTri} /></span></div>
        {res.length ? <ul key={vue} style={vue === 'grille' ? {
          listStyle: 'none',
          margin: 0,
          padding: '4px 20px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
          gap: '16px'
        } : vue === 'liste' ? {
          listStyle: 'none',
          margin: 0,
          padding: '8px 8px 24px',
          display: 'grid',
          gap: '2px'
        } : {
          listStyle: 'none',
          margin: 0,
          padding: '8px',
          display: 'grid',
          gap: '2px'
        }}>{res.map((l, i) => <Logement key={l.id} l={l} i={i} g={vue === 'grille'} on={selection === l.id} onSurvol={setSurvol} onChoisir={choisir} aller={aller} />)}</ul> : <div className="lr-in" style={{
          margin: 'auto',
          padding: '48px 32px',
          display: 'grid',
          justifyItems: 'center',
          gap: '12px',
          textAlign: 'center'
        }}><span style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#F3F7FC',
            display: 'grid',
            placeItems: 'center'
          }}><Icon name="search" size={22} color="#4581CB" /></span>
            <strong style={{
            fontSize: '17px',
            color: '#0C2147'
          }}>Aucun logement pour ces critères</strong><span style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: '#3E4A59',
            maxWidth: '34ch'
          }}>Élargissez le budget ou le secteur, ou demandez à Cléo de vous prévenir dès qu’un logement correspond.</span>
            <Button variant="secondaire" size="m" onClick={remise}>Effacer les filtres</Button></div>}
        <div style={{
          marginTop: 'auto',
          padding: '18px 20px 22px',
          display: 'grid',
          gridTemplateColumns: '36px minmax(0,1fr)',
          gap: '12px',
          alignItems: 'center',
          background: 'var(--marine-900)'
        }}>
          <img src="/assets/img/cleo-avatar.png" alt="" style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            objectFit: 'cover'
          }} />
          <span style={{
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'var(--bleu-100)'
          }}>Rien ne convient? <button type="button" onClick={() => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.dispatchEvent(new CustomEvent('ll-cleo', {
              detail: {
                texte: 'M’aviser des nouveautés'
              }
            })) : undefined} style={{
              border: 0,
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: 700,
              color: '#fff',
              textDecoration: 'underline',
              textUnderlineOffset: '3px'
            }}>Cléo vous prévient</button> dès qu’un logement correspond.</span></div>
      </div>
      <div className="lr-zone" style={{
        position: 'relative',
        minHeight: 0,
        display: large ? 'none' : undefined
      }}>
        <Carte logements={res} selection={selection} setSelection={choisir} survol={survol} />
        {sel && <Apercu l={sel} aller={aller} fermer={() => setApercu(false)} />}
      </div>
    </div>
    <div className="lr-mob" role="group" aria-label="Affichage" aria-hidden={!enVue} style={{
      display: 'none',
      position: 'fixed',
      left: '50%',
      bottom: '20px',
      transform: enVue ? 'translateX(-50%)' : 'translate(-50%,24px)',
      opacity: enVue ? 1 : 0,
      pointerEvents: enVue ? 'auto' : 'none',
      transition: 'opacity 240ms,transform 320ms cubic-bezier(.22,1,.36,1)',
      zIndex: 1100,
      gap: '2px',
      padding: '4px',
      borderRadius: '8px',
      background: '#0C2147',
      boxShadow: '0 16px 32px -12px rgba(12,33,71,.6)'
    }}>
      {[['liste', 'list', 'Liste'], ['carte', 'map', 'Carte']].map(([k, ic, t]) => <button key={k} type="button" aria-pressed={mob === k} onClick={() => {
        setMob(k);
        if (k === 'carte') setVue('carte');
      }} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: '40px',
        padding: '0 18px',
        border: 0,
        borderRadius: '8px',
        background: mob === k ? '#fff' : 'transparent',
        color: mob === k ? '#0C2147' : '#fff',
        fontFamily: 'var(--police-corps)',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer'
      }}><Icon name={ic} size={15} color="currentColor" />{t}</button>)}</div>
  </div>;
}
export { Recherche };
