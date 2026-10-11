/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-chiffres-serie8.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { ACC_H } from '@/proto/accueil-options-1';
import { ACC_PREUVES } from '@/proto/blocs';
const PV = () => ACC_PREUVES;
const MAR = 'var(--marine-900)',
  EZ = 'cubic-bezier(.22,1,.36,1)',
  VERS = '/offre-de-service';
const ap = (on, ms = 0, dy = 12) => ({
  opacity: on ? 1 : 0,
  transform: on ? 'none' : 'translateY(' + dy + 'px)',
  transition: 'opacity 600ms ' + EZ + ' ' + ms + 'ms,transform 800ms ' + EZ + ' ' + ms + 'ms'
});
const CSS = '@media (max-width:960px){.c8-2c{grid-template-columns:minmax(0,1fr)!important}.c8-bento{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:none!important}.c8-bento>*{grid-row:auto!important}.c8-fin{justify-self:start!important}}' + '@media (max-width:820px){.c8-g3{grid-template-columns:minmax(0,1fr)!important}.c8-carre{aspect-ratio:auto!important;min-height:240px}.c8-pan>*{border-left:0!important}.c8-pan>*+*{border-top:1px solid rgba(181,212,247,.16)}}' + '@keyframes c8-balaye{from{transform:translateX(-120%)}to{transform:translateX(220%)}}.c8-vu .c8-reflet{animation:c8-balaye 1600ms ' + EZ + ' 500ms both}' + '@media (prefers-reduced-motion:reduce){.c8-vu .c8-reflet{animation:none}}';

/* Pièces communes */
const Titre = ({
  a = 'center',
  clair,
  max = '26ch',
  id
}) => <h2 id={id} style={{
  margin: 0,
  fontSize: 'clamp(26px,2.4vw,36px)',
  lineHeight: 1.25,
  letterSpacing: '-0.03em',
  fontWeight: 700,
  color: clair ? '#fff' : 'var(--marine-400)',
  maxWidth: max,
  textAlign: a,
  textWrap: 'balance'
}}>{ACC_H.surl('Nos {engagements}, écrits {noir sur blanc}.', clair ? 'var(--bleu-300)' : ACC_H.BL)}</h2>;
const Appels = ({
  clair,
  a = 'center'
}) => <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: a === 'center' ? 'center' : 'flex-start',
  alignItems: 'center',
  gap: '12px 14px'
}}>
  <ACC_H.Button variant={clair ? 'inverse' : 'primaire'} size="l" onClick={() => ACC_H.aller(VERS)}>Soumission gratuite</ACC_H.Button>
  <ACC_H.Button variant={clair ? 'contour_inverse' : 'secondaire'} size="l" onClick={() => ACC_H.aller('/gestion-immobiliere')}>Gestion d’immeubles</ACC_H.Button></div>;
const Lib = ({
  x,
  c = MAR,
  fs = '16px',
  a = 'center',
  fw = 700
}) => <span style={{
  display: 'block',
  fontSize: fs,
  fontWeight: fw,
  lineHeight: 1.35,
  color: c,
  textAlign: a,
  textWrap: 'balance'
}}>{x.l}</span>;
const Tuile = ({
  ic,
  t = 48,
  fond = MAR,
  col = '#fff'
}) => <span aria-hidden="true" style={{
  width: t + 'px',
  height: t + 'px',
  flex: 'none',
  borderRadius: Math.round(t * .29) + 'px',
  display: 'grid',
  placeItems: 'center',
  background: fond,
  boxShadow: '0 12px 26px -14px rgba(12,33,71,.7),inset 0 1px 0 rgba(255,255,255,.12)'
}}>{ic && <ACC_H.Icon name={ic} size={Math.round(t * .46)} color={col} />}</span>;

/* Sol quadrillé en perspective (fond clair) : lignes de fuite vers le centre, rangées qui se resserrent vers l'horizon, fondu vers le haut; très faible opacité. */
/* Vraie perspective : point de fuite au centre au-dessus du cadre (HZ); colonnes espacées de S au premier plan, rangées en 1/z avec un pas D réglé pour des cases carrées au premier plan. 25 % de cases en plus qu'avant. */

/* Volet « carrés » : même section que l'actuelle (fond quadrillé, titre centré, boutons centrés); seuls les carrés changent. */
function SecCarres({
  id,
  Carre
}) {
  const ref = React.useRef(null),
    vu = ACC_H.useVu(ref, .3),
    P = PV();
  return <section ref={ref} aria-labelledby={id} className={vu ? 'c8-vu' : undefined} style={{
    position: 'relative',
    overflow: 'hidden',
    background: '#fff'
  }}><style>{CSS}</style>
    <div style={{
      ...ACC_H.BOITE,
      position: 'relative',
      display: 'grid',
      justifyItems: 'center',
      gap: 'clamp(45px,5vw,70px)'
    }}><div style={ap(vu)}><Titre id={id} /></div>
      <dl className="c8-g3" style={{
        margin: 0,
        width: '100%',
        maxWidth: '960px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
        gap: '16px'
      }}>{P.map((x, k) => <Carre key={x.l} x={x} k={k} vu={vu} />)}</dl>
      <div style={ap(vu, 520)}><Appels /></div></div></section>;
}
const CARRE = {
  position: 'relative',
  aspectRatio: '1 / 1',
  boxSizing: 'border-box',
  borderRadius: '20px',
  overflow: 'hidden'
};
/* A · Jauge : l'anneau se trace jusqu'à la valeur; l'icône au centre, le chiffre et le libellé dessous. */

/* B · Relevé : lecture alignée à gauche; icône et libellé en tête, puis une grille de 30 cases (un mois) qui se remplit selon la valeur, enfin le grand chiffre. */
const CASES = Array.from({
  length: 30
}, (_, i) => i);

/* Lecture du Relevé : filet qui se trace du centre, grand chiffre en dégradé marine → bleu, unité en pastille (capitales espacées) qui arrive après le compteur. */

/* C · Plaque marine : carré foncé, quadrillé et lueur discrets, icône dans un cercle au trait; un reflet passe une fois à l'entrée. */

/* Pièces du Relevé, réutilisées par D, E, F : étiquette (icône + libellé), chiffre en dégradé, pastille d'unité. */
/* Fond blanc opaque : l'ombre d'un carré ne transparaît jamais sur la surface du carré voisin. */
const FOND_R = () => 'transparent';
/* Ombre des carrés sans fond : calque derrière le carré, découpé au milieu de l'écart (8 px) côté droit, pour ne jamais passer sur le carré voisin. */
const Ombre = ({
  k
}) => <span aria-hidden="true" style={{
  position: 'absolute',
  inset: '-1.75px',
  zIndex: -1,
  borderRadius: '20px',
  boxShadow: '18px -18px 3.15px -1.14px rgba(12,33,71,.064)',
  clipPath: k < 2 ? 'inset(-48px -8px -48px -48px)' : 'none',
  pointerEvents: 'none'
}}></span>;
const CARRE_R = k => ({
  ...CARRE,
  background: FOND_R(k),
  border: '1.75px solid rgba(12,33,71,.26)',
  isolation: 'isolate'
});
const Etiq = ({
  x,
  k,
  vu
}) => <dt style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  height: '42px',
  padding: '0 16px 0 0',
  boxSizing: 'border-box',
  borderRadius: '12px',
  background: 'transparent',
  border: 0,
  ...ap(vu, 220 + k * 160, -6)
}}><Tuile ic={x.ic} t={28} /><Lib x={x} a="left" fs="15px" fw={560} /></dt>;
const NbG = ({
  x,
  vu,
  t = 'clamp(40px,3.8vw,54px)'
}) => <span style={{
  fontSize: t,
  fontWeight: 700,
  letterSpacing: '-0.045em',
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  backgroundImage: 'linear-gradient(180deg,#0C2147 0%,#2E5788 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent'
}}><ACC_H.Compte s={x.v} actif={vu} /></span>;
const Unite = ({
  x,
  k,
  vu,
  ms = 900,
  serre
}) => <span style={{
  display: 'inline-flex',
  alignItems: 'center',
  maxWidth: '100%',
  height: '26px',
  padding: serre ? '0 8px' : '0 10px',
  boxSizing: 'border-box',
  borderRadius: '7px',
  background: 'transparent',
  border: '.5px solid rgba(12,33,71,.6)',
  boxShadow: '4px 5px 14px -6px rgba(12,33,71,.247)',
  fontSize: serre ? '10px' : '11px',
  fontWeight: 700,
  letterSpacing: serre ? '.08em' : '.14em',
  textTransform: 'uppercase',
  color: 'var(--marine-900)',
  whiteSpace: 'nowrap',
  ...ap(vu, ms + k * 160, 6)
}}>{x.u}</span>;
/* D · Lecture en tête : le chiffre mène (en haut, avec son unité), la grille au centre, l'étiquette ferme le carré en bas. */

/* E · Encart : étiquette en tête; dessous, un encart blanc réunit le chiffre (et son unité) à gauche et la grille (5 × 6) à droite. */

/* F · Bande de jours : lecture alignée à gauche; étiquette en tête, grand chiffre et unité, puis une bande de 30 traits (un par jour) qui se remplit de gauche à droite. */
const Bande = ({
  p,
  vu,
  ms = 0
}) => {
  const n = p * 30;
  return <span aria-hidden="true" style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(30,minmax(0,1fr))',
    alignItems: 'end',
    gap: '3px',
    width: '100%',
    height: '34px'
  }}>{CASES.map(i => {
      const f = Math.max(0, Math.min(1, n - i));
      return <span key={i} style={{
        height: i % 7 === 0 ? '100%' : '78%',
        borderRadius: '2px',
        background: 'rgba(12,33,71,.08)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end'
      }}><span style={{
          display: 'block',
          width: '100%',
          height: '100%',
          borderRadius: '2px',
          background: 'linear-gradient(180deg,rgba(69,129,203,.8) 0%,rgba(69,129,203,.8) 81.25%,var(--marine-900) 100%)',
          opacity: f > 0 ? .35 + .65 * f : 0,
          transformOrigin: '50% 100%',
          transform: vu && f > 0 ? 'scaleY(1)' : 'scaleY(0)',
          transition: 'transform 420ms ' + EZ + ' ' + (ms + i * 24) + 'ms'
        }}></span></span>;
    })}</span>;
};
const CarreF = ({
  x,
  k,
  vu
}) => <div className="c8-carre" style={{
  ...CARRE_R(k),
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
  justifyItems: 'start',
  textAlign: 'left',
  gap: '18px',
  padding: 'clamp(24px,2.6vw,32px)',
  ...ap(vu, 120 + k * 120)
}}><Ombre k={k} />
  <Etiq x={x} k={k} vu={vu} />
  <dd style={{
    margin: 0,
    alignSelf: 'center',
    display: 'grid',
    justifyItems: 'start',
    gap: '12px'
  }}><NbG x={x} vu={vu} t="clamp(48px,4.6vw,66px)" /><Unite x={x} k={k} vu={vu} /></dd>
  <Bande p={x.p} vu={vu} ms={420 + k * 160} /></div>;
const F8 = () => <SecCarres id="c8-f" Carre={CarreF} />;

/* 1 · Colonne de preuve : le titre et les appels mènent à gauche; à droite, un relevé en trois rangées (icône, libellé, barre, chiffre). */

/* 2 · Bande marine : section foncée avec sol quadrillé en perspective; un seul panneau de verre partagé en trois colonnes; appels en clair. */

/* 3 · Chiffre vedette : le délai de réponse de Cléo en grand (carré marine, anneau plein), les deux autres chiffres empilés à côté; titre et appels en tête. */

/* Revue : « Actuelle » = section actuelle (Centré); A–C ne changent que les carrés; 1–3 refont la section. */
/* Nos chiffres figés : F « Relevé · Bande de jours » retenue, barre de revue retirée. */
let AccChiffres = () => <F8 />;
export { AccChiffres };
