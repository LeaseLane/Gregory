/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pied-options.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { ACC_H } from '@/proto/accueil-options-1';
import { LL_SITE } from '@/proto/routes';
import { TelAff, LiensLegaux, Copyright, Responsable } from '@/proto/chrome';
import { H7SocleA } from '@/proto/accueil-heros7';
import { __ssr } from '@/lib/hydratation';
const h = to => to.startsWith('/') ? to : to;
const AUTH = "/connexion";
const ESPACE = {
  'Propriétaires': [AUTH + '?profil=proprietaire', 'Espace propriétaire', 'building-2'],
  'Locataires': [AUTH + '?profil=locataire', 'Espace locataire', 'key-round']
};
const COLS = [['Propriétaires', [['/gestion-immobiliere', 'Gestion d\u2019immeubles'], ['/gestion-immobiliere/location', 'Location et mise en marché'], ['/expertise-et-strategie', 'Expertise et stratégie'], ['/changer-de-gestionnaire', 'Changer de gestionnaire']]], ['Locataires', [['/locataires', 'Service aux locataires'], ['/locataires/commentaire-ou-plainte', 'Administration et plaintes']]], ['Lease Lane', [['/cleo', 'Agent IA - Cléo'], ['/a-propos', 'À propos'], ['/blogue', 'Blogue & nouvelles'], ['/faq', 'Foire aux questions']]]];
const RS = [['linkedin', 'LinkedIn'], ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['github', 'GitHub'], ['tiktok', 'TikTok']];
const TAG = 'Une gestion d\'immeubles à la fine pointe de la technologie. Nos automatisations prennent le maximum d\'opérations en charge; notre équipe s\'occupe du reste.';
const SLOGAN = 'Une clé d’avance et ce, en permanence.';
const S = () => LL_SITE;
const tel = () => 'tel:' + String(S().telephone || '').replace(/\D/g, '');
const Col = ({
  t,
  items
}) => <nav aria-label={t} style={{
  display: 'grid',
  gap: '10px',
  alignContent: 'start'
}}><span style={{
    fontSize: '15px',
    fontWeight: 700,
    color: '#fff'
  }}>{t}</span><span aria-hidden="true" style={{
    display: 'block',
    width: '24px',
    height: '1px',
    background: 'rgba(181,212,247,.35)',
    marginBottom: '4px'
  }}></span>
  {items.map(([to, x]) => to ? <a key={x} href={h(to)} className="ao-lien" style={{
    justifySelf: 'start',
    fontSize: '14px',
    lineHeight: 1.5,
    color: 'var(--bleu-100)',
    textDecoration: 'none'
  }}>{x}</a> : <span key={x} title="Phase 2" style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    lineHeight: 1.5,
    color: 'rgba(200,218,240,.55)'
  }}>{x}<span style={{
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      padding: '2px 7px',
      borderRadius: '999px',
      border: '1px solid rgba(200,218,240,.3)'
    }}>Bientôt</span></span>)}
  {ESPACE[t] && <span style={{
    justifySelf: 'start',
    marginTop: '10px'
  }}><ACC_H.Button as="a" href={ESPACE[t][0]} variant="contour_inverse" size="m" iconeAvant={<ACC_H.Icon name={ESPACE[t][2]} size={16} />}>{ESPACE[t][1]}</ACC_H.Button></span>}</nav>;
const Reseaux = () => <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '7px'
}}>{RS.map(([k, x]) => <a key={k} href="#" aria-label={x} title={x} onClick={e => e.preventDefault()} className="ao-rs" style={{
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    display: 'grid',
    placeItems: 'center',
    border: ACC_H.FIN_M,
    color: '#fff'
  }}><ACC_H.Icon name={k} size={14} color="currentColor" /></a>)}</div>;
const Contact = ({
  grand
}) => <div style={{
  display: 'grid',
  gap: '10px',
  alignContent: 'start'
}}>{!grand && <React.Fragment><span style={{
      fontSize: '15px',
      fontWeight: 700,
      color: '#fff'
    }}>Contact</span><span aria-hidden="true" style={{
      display: 'block',
      width: '24px',
      height: '1px',
      background: 'rgba(181,212,247,.35)',
      marginBottom: '4px'
    }}></span></React.Fragment>}
  <a href={tel()} className="ao-lien" style={{
    justifySelf: 'start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--bleu-100)',
    textDecoration: 'none',
    fontSize: '14px',
    lineHeight: 1.5
  }}><ACC_H.Icon name="phone" size={18} color={ACC_H.CL} /><TelAff /></a>
  <a href={'mailto:' + (S().courriel || '')} className="ao-lien" style={{
    justifySelf: 'start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--bleu-100)',
    textDecoration: 'none',
    fontSize: '14px',
    lineHeight: 1.5
  }}><ACC_H.Icon name="mail" size={18} color={ACC_H.CL} />{S().courriel}</a>
  <a href="/nous-joindre" className="ao-lien" style={{
    justifySelf: 'start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--bleu-100)',
    textDecoration: 'none',
    fontSize: '14px',
    lineHeight: 1.5
  }}><ACC_H.Icon name="arrow-right" size={18} color={ACC_H.CL} />Nous joindre</a></div>;
const Legal = ({
  fin
}) => <div style={{
  display: 'grid',
  gap: '20px',
  paddingTop: '24px',
  borderTop: ACC_H.FIN_M
}}>
  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px 28px'
  }}><LiensLegaux couleur="var(--bleu-100)" taille="9px" classe="ao-lien" gap="6px 15px" />{fin}</div>
  <span style={{
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '3px 6px',
    fontSize: '9px',
    color: 'var(--bleu-100)'
  }}><Copyright couleur="var(--bleu-100)" taille="9px" /><span aria-hidden="true">·</span><Responsable couleur="var(--bleu-100)" taille="9px" /></span></div>;

/* A · Trois portes : l'urgence, la soumission et les portails en tuiles, puis le plan du site. */

/* B · Grand format : marque et slogan en titre, actions, plan du site; coordonnées en petit dans le coin inférieur droit (colonne « Contact »); réseaux sociaux dans la ligne des mentions. */
/* Duos : une carte partagée en deux. À gauche la soumission et les logements, à droite les portails; au survol, un trait bleu se trace en haut de la moitié visée. */

/* Logo à la hauteur de la rangée du plan du site : hauteur mesurée sur la plus haute colonne (sans le logo), remesurée au redimensionnement. */
/* Sol quadrillé dense en perspective derrière le pied de page : point de fuite au centre, cases carrées au premier plan, fondu vers le haut; traits très discrets. */
const P_HZ = -40,
  P_S = 29.4,
  P_D = .0518,
  P_ZM = 12,
  P_V = Array.from({
    length: 119
  }, (_, k) => (k - 59) * P_S),
  P_H = (() => {
    const o = [];
    for (let z = 1; z <= P_ZM; z += P_D * z) o.push(P_HZ + (600 - P_HZ) / z);
    return o;
  })();
const SolPied = ({
  o = 1
}) => <div aria-hidden="true" style={{
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '80%',
  zIndex: -1,
  pointerEvents: 'none',
  opacity: o,
  WebkitMaskImage: 'linear-gradient(to top,#000 0%,rgba(0,0,0,.55) 45%,transparent 100%)',
  maskImage: 'linear-gradient(to top,#000 0%,rgba(0,0,0,.55) 45%,transparent 100%)'
}}><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" width="100%" height="100%" style={{
    display: 'block'
  }}><g stroke="rgba(181,212,247,.09)" strokeWidth="1" fill="none">{P_V.map(dx => <line key={'v' + dx} x1={500 + dx / P_ZM} y1={P_HZ + (600 - P_HZ) / P_ZM} x2={500 + dx} y2="600" vectorEffect="non-scaling-stroke" />)}{P_H.map((y, i) => <line key={'h' + i} x1="-2000" y1={y} x2="3000" y2={y} vectorEffect="non-scaling-stroke" />)}</g></svg></div>;
function useHautRang() {
  const r = React.useRef(null),
    [h, setH] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = r.current;
    if (!el) return;
    const m = () => {
      const c = [...el.querySelectorAll('nav')].concat(el.lastElementChild ? [el.lastElementChild] : []);
      const mx = Math.max(0, ...c.map(x => x.offsetHeight));
      setH(((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(max-width:960px)').matches : undefined) ? 0 : mx);
    };
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    window.addEventListener('resize', m);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', m);
    };
  }, []);
  return [r, h];
}
function PiedB() {
  const ref = React.useRef(null),
    p = ACC_H.useDefil(ref),
    [rang, hL] = useHautRang();
  return <footer ref={ref} className="ll-sombre" style={{
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
    background: 'linear-gradient(180deg,#0E2340 0%,#081729 100%)'
  }}><SolPied />
    <div style={{
      ...ACC_H.BOITE,
      position: 'relative',
      display: 'grid',
      gap: '56px'
    }}>
      <div style={{
        display: 'grid',
        gap: '20px',
        justifyItems: 'center',
        textAlign: 'center'
      }}><p style={{
          margin: 0,
          fontSize: 'clamp(28px,3vw,40px)',
          fontWeight: 700,
          lineHeight: 1.31,
          letterSpacing: '-0.03em',
          color: '#fff',
          maxWidth: '18ch',
          textWrap: 'balance'
        }}>{String(SLOGAN).split(/(clé|permanence)/).map((x, i) => i % 2 ? <span key={i} style={{
            color: '#4581CB'
          }}>{x}</span> : x)}</p><p style={{
          margin: 0,
          fontSize: '14px',
          lineHeight: 1.65,
          color: 'var(--bleu-100)',
          maxWidth: '46ch'
        }}>{TAG}</p></div>
      {/* Mêmes quatre entrées que le bas de la bannière d'accueil (Propriétaires, Gestionnaire IA, Locataires, Nos propriétés), dans un cadre arrondi. */}
      {<div className="pd-socle" style={{
        borderRadius: '20px',
        overflow: 'hidden',
        border: ACC_H.FIN_M
      }}>{<H7SocleA />}</div>}
      <div ref={rang} className="ao-g4" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '32px',
        paddingTop: '40px',
        borderTop: ACC_H.FIN_M
      }}><a href="/" aria-label="Lease Lane, accueil" style={{
          display: 'block',
          alignSelf: 'stretch'
        }}><img src="/assets/img/logo/lease-lane-cadre-vertical.png" alt="Lease Lane" style={{
            display: 'block',
            height: hL ? hL + 'px' : 'auto',
            width: hL ? 'auto' : 'clamp(96px,22vw,140px)',
            maxWidth: 'none'
          }} /></a>{COLS.map(([t, it]) => <Col key={t} t={t} items={it} />)}<Contact /></div>
      <Legal fin={<Reseaux />} /></div></footer>;
}
/* C · Compact : une barre d'actions en tête (urgence, soumission, portails), puis le plan du site serré, sur fond marine uni. */

/* Pied de page figé : B « Grand format » retenu, barre de revue retirée. */
let PiedRevue = () => <PiedB />;
export { PiedRevue, SolPied };
