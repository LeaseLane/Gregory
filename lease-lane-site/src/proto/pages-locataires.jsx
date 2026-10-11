/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pages-locataires.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon, Button } from '@/components/ds';
import { CONT, FilAriane } from '@/proto/blocs';
import { ouvrirCleo } from '@/proto/seo';
import { PBHeros } from '@/proto/pages-proprio-b';
import { LL_QUARTIERS, BandeQuartiers } from '@/proto/pages-guides';
import { Recherche } from '@/proto/recherche';
/* Pages locataires : carrefour Service aux locataires et enveloppe SEO de Logements à louer. Mobile d'abord.
   Sur le site : urgence, logements, demande de location, commentaire ou plainte. Le reste se fait dans le portail locataire (LL_PORTAIL, routes.js). */
const FT = '1px solid var(--bordure-fine)';

/* Tuile d'accès : flèche droite = page du site, flèche oblique = portail locataire. */

/* Bandeau des locataires : modèle de bannière Gestion d'immeubles (PBHeros); les deux actions les plus fréquentes en grandes tuiles à droite, toutes deux vers le portail locataire. */

/* Suivi 18d « Le trajet » (approuvé) : un fil lumineux parcourt les quatre statuts. Aperçu du portail; le suivi se fait après connexion. Statuts d'exemple. */

/* Options A et B du bloc sous le titre : aucun encadré, seuls les boutons portent une bordure. Mêmes contenus et mêmes chiffres (calculés). */
const hlChiffres = data => {
  const L = data.logements || [],
    n = v => parseInt(String(v).replace(/\D/g, '')) || 0;
  return {
    L,
    libres: L.filter(l => /immédiat/i.test(l.dispo || '')).length,
    min: L.length ? Math.min(...L.map(l => n(l.prix))).toLocaleString('fr-CA') : '0',
    nb: q => L.filter(l => l.secteur === q.n).length
  };
};
const HL2_CSS = '.hla,.hlb{animation:hl-in 520ms cubic-bezier(.22,1,.36,1) both}@keyframes hl-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' + '.hl-pouls{animation:hl-p 2.4s ease-out infinite}@keyframes hl-p{0%{box-shadow:0 0 0 0 rgba(63,179,127,.55)}70%,100%{box-shadow:0 0 0 7px rgba(63,179,127,0)}}' + '.hla-ch>div{position:relative;padding-top:18px}.hla-ch>div::before{content:"";position:absolute;left:0;top:0;width:28px;height:2px;border-radius:2px;background:#6194D3}' + '.hla-q{display:inline-flex;align-items:center;min-height:32px;color:#fff;font-weight:600;text-decoration:none;background:linear-gradient(#6194D3,#6194D3) 0 85%/0 1px no-repeat;transition:background-size 280ms cubic-bezier(.22,1,.36,1),color 200ms}.hla-q:hover{background-size:100% 1px;color:#B5D4F7}' + '.hlb-li{border-bottom:1px solid rgba(181,212,247,.14);border-left:1px solid rgba(181,212,247,.14)}.hlb-li:nth-child(3n+1){border-left:0}.hlb-li:nth-last-child(-n+3){border-bottom:0}.hlb-q{transition:background-color 220ms}.hlb-q:hover{background:rgba(255,255,255,.06)}.hlb-q .hlb-fl{transition:transform 260ms cubic-bezier(.22,1,.36,1)}.hlb-q:hover .hlb-fl{transform:translateX(3px)}.hlb-q:hover .hlb-n{color:#fff!important}' + '.hla-q:focus-visible,.hlb-q:focus-visible,.hl-tous:focus-visible{outline:2px solid #B5D4F7;outline-offset:3px;border-radius:4px}.hl-tous{transition:color 200ms}.hl-tous:hover{color:#B5D4F7!important}' + '@media (max-width:760px){.hlb-grille{grid-template-columns:repeat(2,minmax(0,1fr))!important}.hlb-li{border-left:1px solid rgba(181,212,247,.14)!important;border-bottom:1px solid rgba(181,212,247,.14)!important}.hlb-li:nth-child(2n+1){border-left:0!important}.hlb-li:last-child{border-bottom:0!important}}@media (max-width:620px){.hlb-ch{grid-template-columns:minmax(0,1fr)!important;width:100%!important}.hlb-ch>div{border-left:0!important;border-top:1px solid rgba(181,212,247,.18)}.hlb-ch>div:first-child{border-top:0}}@media (max-width:480px){.hlb-grille{grid-template-columns:minmax(0,1fr)!important}.hlb-li{border-left:0!important}.hla-q{min-height:44px}}' + '@media (prefers-reduced-motion:reduce){.hla,.hlb,.hl-pouls{animation:none}}';
const HL_SUR = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'var(--bleu-300)'
};
const Pouls = () => <span aria-hidden="true" className="hl-pouls" style={{
  width: '8px',
  height: '8px',
  flex: 'none',
  borderRadius: '50%',
  background: '#3FB37F'
}} />;
const Tous = () => <a href="/quartiers" className="hl-tous" style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  minHeight: '32px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#fff',
  textDecoration: 'none',
  whiteSpace: 'nowrap'
}}>Tous les guides<Icon name="arrow-right" size={14} color="currentColor" /></a>;

/* Option B · « Index des quartiers » : bandeau de chiffres cerné, filet, appel à l'action en deux colonnes, filet, index des quartiers dans un cadre fin. */
function HLB({
  data
}) {
  const {
      L,
      libres,
      min,
      nb
    } = hlChiffres(data),
    Q = LL_QUARTIERS;
  const LIG = '1px solid rgba(181,212,247,.18)',
    FIL = <span aria-hidden="true" style={{
      display: 'block',
      width: '50%',
      height: '1px',
      background: 'linear-gradient(90deg,rgba(181,212,247,.28),rgba(181,212,247,.06))'
    }} />;
  const C = [[String(libres), 'Libre maintenant', true], [String(L.length), 'À louer'], [min + ' $', 'À partir de']];
  return <div className="hlb" style={{
    display: 'grid',
    gap: '32px',
    marginTop: '4px',
    maxWidth: '760px'
  }}>
    <dl className="hlb-ch" style={{
      margin: 0,
      width: '75%',
      boxSizing: 'border-box',
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))'
    }}>
      {C.map(([v, t, vif], i) => <div key={t} style={{
        display: 'grid',
        justifyItems: 'center',
        textAlign: 'center',
        gap: '4px',
        padding: '16px 22px',
        borderLeft: i ? LIG : 0
      }}>
        <dt style={{
          order: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--bleu-100)'
        }}>{vif && <Pouls />}{t}</dt>
        <dd style={{
          order: 1,
          margin: 0,
          fontSize: '26px',
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: '#fff',
          fontVariantNumeric: 'tabular-nums'
        }}>{v}</dd></div>)}</dl>
    <div className="hlb-cta" style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '18px 28px',
      margin: '14px 0'
    }}>
      <div style={{
        display: 'grid',
        gap: '4px',
        minWidth: 0
      }}><span style={{
          fontSize: '18px',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: '#fff'
        }}>Un logement vous plaît?</span><span style={{
          fontSize: '14px',
          color: 'var(--bleu-100)'
        }}>Déposez votre demande en ligne. Aucun dépôt exigé.</span></div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        
        <Button forme="fleche" variant="contour_inverse" size="m" icone="message-circle" onClick={() => ouvrirCleo('Je cherche un logement à Québec')}>Écrire à Cléo</Button></div></div>
    {Q.length > 0 && <nav aria-label="Logements par quartier" style={{
      border: LIG,
      borderRadius: '16px',
      background: 'rgba(255,255,255,.03)',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '10px 18px 10px 20px',
        borderBottom: LIG,
        background: 'rgba(255,255,255,.04)'
      }}><span style={{
          ...HL_SUR,
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px'
        }}><Icon name="map-pin" size={15} color="#fff" />Par quartier</span><Tous /></div>
      <ul className="hlb-grille" style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(3,minmax(0,1fr))'
      }}>
        {Q.map(q => {
          const k = nb(q);
          return <li key={q.s} className="hlb-li"><a href={"/quartiers/" + q.s} className="hlb-q" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              minHeight: '52px',
              padding: '0 18px 0 20px',
              textDecoration: 'none'
            }}>
          <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff'
              }}>{q.n}</span>
          <span className="hlb-n" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--bleu-300)',
                whiteSpace: 'nowrap',
                transition: 'color 200ms'
              }}>{'À voir (' + k + ')'}<span className="hlb-fl" style={{
                  display: 'grid'
                }}><Icon name="arrow-right" size={14} color="#fff" /></span></span></a></li>;
        })}</ul></nav>}
  </div>;
}

/* Bloc sous le titre du héros : option B retenue. */
function HerosLogements({
  data
}) {
  return <React.Fragment><style>{HL2_CSS}</style><HLB data={data} /></React.Fragment>;
}

/* Logements à louer : la demande de location est l'action principale de la page, en carte marine à droite du titre. */
function PageLogements({
  route,
  aller,
  data,
  selection,
  setSelection
}) {
  const H = typeof PBHeros !== 'undefined' ? PBHeros : null;
  if (H) return <div>
    <H route={route} titre="Appartements à louer à {Québec}"><HerosLogements data={data} /></H>
    <Recherche aller={aller} data={data} selection={selection} setSelection={setSelection} />
    {<BandeQuartiers />}
  </div>;
  return <div>
    <div style={{
      borderBottom: FT,
      background: 'var(--gris-000)'
    }}>
      <div style={{
        ...CONT,
        padding: '16px var(--web-gouttiere)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px 32px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'grid',
          gap: '6px'
        }}><FilAriane fil={route.fil} />
          <h1 style={{
            fontSize: 'clamp(22px,2vw,28px)'
          }}>Appartements à louer à <span className="ll-bleu">Québec</span></h1>
          <span style={{
            fontSize: '14px',
            color: 'var(--texte-discret)'
          }}>{data.logements.length} logements · disponibilités à jour</span></div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px 20px',
          flexWrap: 'wrap',
          padding: '12px 12px 12px 14px',
          borderRadius: '20px',
          background: 'var(--marine-900)',
          boxShadow: '0 16px 40px rgba(12,33,71,.18)'
        }}>
          <span aria-hidden="true" style={{
            width: '44px',
            height: '44px',
            flex: 'none',
            borderRadius: '50%',
            background: 'rgba(255,255,255,.12)',
            display: 'grid',
            placeItems: 'center'
          }}><Icon name="key" size={20} color="#fff" /></span>
          <span style={{
            display: 'grid',
            gap: '2px',
            marginRight: '4px'
          }}><span style={{
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: '#fff'
            }}>Un logement vous plaît?</span><span style={{
              fontSize: '13px',
              color: 'var(--bleu-100)'
            }}>Déposez votre demande en ligne. Aucun dépôt exigé.</span></span>
          </div>
      </div>
    </div>
    <Recherche aller={aller} data={data} selection={selection} setSelection={setSelection} />
  </div>;
}
export { FT, hlChiffres, HL2_CSS, HL_SUR, Pouls, Tous, HLB, HerosLogements, PageLogements };
