/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-v2.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import * as __DS from '@/components/ds';
import { KIT_LL } from '@/proto/kit-ll';
import { C7, ChiffresCentre7 } from '@/proto/accueil-chiffres-serie7';
import { ACC_VOL, ACC_ETAPES } from '@/proto/sections-accueil';
import { ACC_PREUVES, ACC_TACHES } from '@/proto/blocs';
import { LL_SITE } from '@/proto/routes';
import { LL_FAQ } from '@/proto/faq';
import { BASE_LOGO } from '@/proto/chrome';
import { __ssr } from '@/lib/hydratation';
const MAR = '#0C2147',
  BL = '#4581CB',
  BL6 = '#3767A2',
  TXT = '#3E4A59',
  FINE = '1px solid #E6EAEF',
  DOUX = '#F7FAFD';
const BOITE = {
  maxWidth: 'var(--web-conteneur)',
  margin: '0 auto',
  padding: 'var(--web-section) var(--web-gouttiere)',
  boxSizing: 'border-box'
};
const VOL = () => ACC_VOL,
  PRV = () => ACC_PREUVES,
  ETA = () => ACC_ETAPES,
  TCH = () => ACC_TACHES.slice(0, 4),
  S = () => LL_SITE;
const ICV = {
    Location: 'cle',
    Gestion: 'immeuble',
    'Comptabilité': 'loyer',
    Entretien: 'outil'
  },
  ICT = ['calendrier', 'bouclier', 'telephone', 'bulle'];
const GI = '/gestion-immobiliere',
  TOT = () => VOL().reduce((s, v) => s + (+v.m || 0), 0);
const T_SERV = {
  sur: 'Ce que nous prenons en charge',
  titre: '{Quatre résultats}, pas trente tâches.',
  lead: 'Chaque volet est mesuré dans votre rapport mensuel.'
};
const TEM = [['Mon six logements était loué en douze jours, sans que j’aie répondu à un seul appel.', 'Nathalie G.', 'Immeuble de 6 logements, Limoilou', '12 jours', 'pour louer les six logements'], ['Je vois chaque facture et chaque demande. Le rapport arrive le 15, sans que j’aie à le demander.', 'Marc-André P.', 'Triplex, Montcalm', 'le 15', 'rapport mensuel, chaque mois'], ['Le changement de gestionnaire s’est fait en un mois. Les locataires ont reçu l’avis et Cléo a pris le relais le jour même.', 'Sylvie et Robert L.', 'Trois immeubles, 22 portes', '4 semaines', 'pour changer de gestionnaire']];
const PORT = "/assets/img/cleo/cleo-hd.jpg",
  ALT = 'Portrait de Cléo, l’agent IA de Lease Lane';
const T_CLEO = 'Voici Cléo. Votre gestionnaire IA {qui ne dort jamais.}',
  S_CLEO = 'L’agent IA de Lease Lane répond 24/7 aux propriétaires et aux locataires, explique les règles du TAL en termes simples et passe la main à un humain quand ça compte.';
const parlerCleo = () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.dispatchEvent(new CustomEvent('ll-cleo', {
  detail: {}
})) : undefined;
/* ——— Fond clair en perspective ——— */
const Sol = ({
  h = '58%',
  x = '50%',
  o = 1
}) => <React.Fragment>
  <div aria-hidden="true" style={{
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(60% 50% at 50% 0%,rgba(69,129,203,.09),transparent 70%)',
    pointerEvents: 'none'
  }}></div>
  <div aria-hidden="true" style={{
    position: 'absolute',
    left: '-30%',
    right: '-30%',
    bottom: 0,
    height: h,
    opacity: o,
    transform: 'perspective(620px) rotateX(63deg)',
    transformOrigin: x + ' 100%',
    backgroundImage: 'linear-gradient(rgba(69,129,203,.17) 1px,transparent 1px),linear-gradient(90deg,rgba(69,129,203,.13) 1px,transparent 1px)',
    backgroundSize: '76px 76px',
    backgroundPosition: x + ' 0',
    WebkitMaskImage: 'linear-gradient(to top,#000 0%,rgba(0,0,0,.6) 40%,transparent 92%)',
    maskImage: 'linear-gradient(to top,#000 0%,rgba(0,0,0,.6) 40%,transparent 92%)',
    pointerEvents: 'none'
  }}></div></React.Fragment>;
const Clair = ({
  children,
  id,
  h,
  x,
  fond = 'linear-gradient(180deg,#fff 0%,#F4F8FC 100%)'
}) => <section aria-labelledby={id} style={{
  position: 'relative',
  overflow: 'hidden',
  background: fond
}}><Sol h={h} x={x} /><div style={{
    ...BOITE,
    position: 'relative'
  }}>{children}</div></section>;
const Compte = ({
  v,
  clair
}) => <span style={{
  fontSize: '13px',
  fontWeight: 600,
  color: clair ? '#B5D4F7' : BL6,
  fontVariantNumeric: 'tabular-nums'
}}>{v.m} {v.ml}</span>;
const Voir = () => <span aria-hidden="true" className="k-voir" style={{
  display: 'grid',
  placeItems: 'center',
  width: '36px',
  height: '36px',
  borderRadius: 'var(--k-rb)',
  border: '1px solid #C8CDD4',
  color: MAR
}}><KIT_LL.Ico n="fleche" t={16} sw={2} /></span>;
const CtaGI = ({
  centre
}) => <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: centre ? 'center' : 'flex-start',
  gap: '14px 24px'
}}><KIT_LL.Btn to={GI}>Gestion d'immeubles</KIT_LL.Btn><span style={{
    fontSize: '13px',
    color: TXT
  }}>{'4 volets · ' + TOT() + ' services inclus'}</span></div>;

/* ——— Volets : cinq dispositions ——— */
function S1() {
  const V = VOL();
  return <Clair id="v2-s">
  <div style={{
      display: 'grid',
      justifyItems: 'center',
      gap: 'clamp(36px,4vw,56px)'
    }}><KIT_LL.TitreSec id="v2-s" {...T_SERV} a="center" />
    <ul className="v2-g4" style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
        gap: '20px'
      }}>{V.map(v => <li key={v.t} style={{
          display: 'flex'
        }}><KIT_LL.Carte href={GI} etiquette={'Gestion d’immeubles, volet ' + v.t} style={{
            flex: 1,
            padding: '28px 26px 24px',
            gap: '18px'
          }}>
      <KIT_LL.Pastille n={ICV[v.t] || 'immeuble'} /><h3 style={{
              margin: '6px 0 0',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: MAR
            }}>{v.t}</h3><p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.6,
              color: TXT,
              flex: 1
            }}>{v.d}</p>
      <span style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              paddingTop: '16px',
              borderTop: FINE
            }}><Compte v={v} /><Voir /></span></KIT_LL.Carte></li>)}</ul>
    <CtaGI centre /></div></Clair>;
}
function S2() {
  const V = VOL();
  return <Clair id="v2-s" x="70%">
  <div className="v2-2c" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
      gap: 'clamp(40px,6vw,96px)',
      alignItems: 'center'
    }}>
    <div style={{
        display: 'grid',
        gap: '32px'
      }}><KIT_LL.TitreSec id="v2-s" {...T_SERV} max="16ch" /><CtaGI /></div>
    <ul className="v2-f2" style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
        gap: '16px'
      }}>{V.map(v => <li key={v.t} style={{
          display: 'flex'
        }}><KIT_LL.Carte href={GI} etiquette={'Gestion d’immeubles, volet ' + v.t} style={{
            flex: 1,
            padding: '24px',
            gap: '14px'
          }}>
      <span style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}><KIT_LL.Pastille n={ICV[v.t] || 'immeuble'} t={44} /><Voir /></span><h3 style={{
              margin: '8px 0 0',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: MAR
            }}>{v.t}</h3><p style={{
              margin: 0,
              fontSize: '13.5px',
              lineHeight: 1.55,
              color: TXT
            }}>{v.d}</p><Compte v={v} /></KIT_LL.Carte></li>)}</ul></div></Clair>;
}
function S3() {
  const V = VOL(),
    m = c => <KIT_LL.Carte key={c.t} href={GI} etiquette={'Gestion d’immeubles, volet ' + c.t} style={{
      padding: '22px',
      gap: '12px'
    }}><span style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}><KIT_LL.Pastille n={ICV[c.t] || 'immeuble'} t={44} /><span style={{
          display: 'grid',
          gap: '2px'
        }}><h3 style={{
            margin: 0,
            fontSize: '19px',
            fontWeight: 700,
            color: MAR
          }}>{c.t}</h3><Compte v={c} /></span></span><p style={{
        margin: 0,
        fontSize: '13.5px',
        lineHeight: 1.55,
        color: TXT
      }}>{c.d}</p></KIT_LL.Carte>;
  return <Clair id="v2-s" h="64%"><div className="v2-car" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr) minmax(0,1fr)',
      gap: '20px',
      alignItems: 'center'
    }}>
    <div style={{
        display: 'grid',
        gap: '20px'
      }}>{V.slice(0, 2).map(m)}</div>
    <div className="v2-centre" style={{
        display: 'grid',
        justifyItems: 'center',
        gap: '28px',
        padding: 'clamp(8px,2vw,24px)'
      }}><KIT_LL.TitreSec id="v2-s" {...T_SERV} a="center" max="15ch" /><CtaGI centre /></div>
    <div style={{
        display: 'grid',
        gap: '20px'
      }}>{V.slice(2, 4).map(m)}</div></div></Clair>;
}
function S4() {
  const V = VOL();
  return <Clair id="v2-s" h="70%">
  <div style={{
      display: 'grid',
      gap: 'clamp(32px,3.6vw,48px)'
    }}><KIT_LL.TitreSec id="v2-s" {...T_SERV} max="26ch" />
    <div className="k-carte v2-g5" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4,minmax(0,1fr)) minmax(0,1.1fr)',
        overflow: 'hidden',
        padding: 0
      }}>
      {V.map((v, i) => <a key={v.t} href={GI} onClick={e => {
          e.preventDefault();
          KIT_LL.aller(GI);
        }} aria-label={'Gestion d’immeubles, volet ' + v.t} className="v2-rang" style={{
          display: 'grid',
          alignContent: 'start',
          gap: '14px',
          padding: '28px 24px',
          borderLeft: i ? FINE : 0,
          textDecoration: 'none',
          color: 'inherit'
        }}>
        <KIT_LL.Pastille n={ICV[v.t] || 'immeuble'} t={44} /><h3 style={{
            margin: '6px 0 0',
            fontSize: '20px',
            fontWeight: 700,
            color: MAR
          }}>{v.t}</h3><p style={{
            margin: 0,
            fontSize: '13.5px',
            lineHeight: 1.55,
            color: TXT
          }}>{v.d}</p><Compte v={v} /></a>)}
      <a href={GI} onClick={e => {
          e.preventDefault();
          KIT_LL.aller(GI);
        }} className="v2-cta-col" style={{
          display: 'grid',
          alignContent: 'space-between',
          gap: '28px',
          padding: '28px',
          background: MAR,
          color: '#fff',
          textDecoration: 'none'
        }}>
        <span style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#B5D4F7'
          }}>{'4 volets · ' + TOT() + ' services inclus'}</span>
        <span style={{
            display: 'grid',
            gap: '18px'
          }}><span style={{
              fontSize: 'clamp(22px,2vw,28px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.15
            }}>Gestion d'immeubles</span><span aria-hidden="true" className="v2-fl" style={{
              display: 'grid',
              placeItems: 'center',
              width: '48px',
              height: '48px',
              borderRadius: 'var(--k-rb)',
              background: BL6
            }}><KIT_LL.Ico n="fleche" t={20} c="#fff" sw={2} /></span></span></a></div></div></Clair>;
}
function S5() {
  const V = VOL();
  return <Clair id="v2-s" x="30%">
  <div className="v2-2c" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
      gap: 'clamp(40px,6vw,96px)',
      alignItems: 'start'
    }}>
    <div className="v2-colle" style={{
        position: 'sticky',
        top: 'calc(var(--web-entete,108px) + 32px)',
        display: 'grid',
        gap: '32px'
      }}><KIT_LL.TitreSec id="v2-s" {...T_SERV} max="15ch" /><CtaGI /></div>
    <ul className="k-carte" style={{
        listStyle: 'none',
        margin: 0,
        padding: '8px',
        overflow: 'hidden'
      }}>{V.map((v, i) => <li key={v.t} style={{
          borderTop: i ? FINE : 0
        }}><a href={GI} onClick={e => {
            e.preventDefault();
            KIT_LL.aller(GI);
          }} aria-label={'Gestion d’immeubles, volet ' + v.t} className="v2-rang" style={{
            display: 'grid',
            gridTemplateColumns: '56px minmax(0,1fr) auto 44px',
            alignItems: 'center',
            gap: '20px',
            padding: '22px 18px',
            borderRadius: 'var(--k-rs)',
            textDecoration: 'none',
            color: 'inherit'
          }}>
      <KIT_LL.Pastille n={ICV[v.t] || 'immeuble'} t={52} /><span style={{
              display: 'grid',
              gap: '6px'
            }}><h3 style={{
                margin: 0,
                fontSize: '21px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: MAR
              }}>{v.t}</h3><span style={{
                fontSize: '13.5px',
                lineHeight: 1.55,
                color: TXT
              }}>{v.d}</span></span>
      <span className="v2-nb"><Compte v={v} /></span><span aria-hidden="true" className="v2-fl" style={{
              display: 'grid',
              placeItems: 'center',
              width: '44px',
              height: '44px',
              borderRadius: 'var(--k-rb)',
              border: '1px solid #C8CDD4',
              color: MAR
            }}><KIT_LL.Ico n="fleche" t={17} sw={2} /></span></a></li>)}</ul></div></Clair>;
}
const SERV = {
  1: S1,
  2: S2,
  3: S3,
  4: S4,
  5: S5
};

/* ——— Preuve ——— */
function Preuve({
  v = 'centre'
}) {
  const ref = React.useRef(null),
    vu = C7.useVu(ref, .3),
    P = PRV(),
    clair = v === 'marine';
  if (v === 'centre' && ChiffresCentre7) return <ChiffresCentre7 />;
  return <section ref={ref} aria-labelledby="v2-p" className={clair ? 'll-sombre' : undefined} style={{
    background: clair ? 'linear-gradient(180deg,#0A1A30,#0E2340)' : DOUX
  }}><div className="v2-tete" style={{
      ...BOITE,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,4fr) minmax(0,8fr)',
      gap: '32px 64px',
      alignItems: 'center'
    }}>
    <div style={{
        display: 'grid',
        gap: '22px',
        justifyItems: 'start'
      }}>{clair ? <h2 id="v2-p" style={{
          margin: 0,
          fontSize: C7.T_TITRE,
          lineHeight: 1.25,
          letterSpacing: '-0.03em',
          fontWeight: 700,
          color: '#fff',
          maxWidth: '17ch',
          textWrap: 'balance'
        }}>Nos <span style={{
            color: '#6194D3'
          }}>engagements</span>, écrits <span style={{
            color: '#6194D3'
          }}>noir sur blanc</span>.</h2> : <C7.Titre id="v2-p" max="17ch" />}<C7.CtaLien on={vu} ms={400} clair={clair} /></div>
    <dl className="v2-g3" style={{
        margin: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
        gap: '24px'
      }}>{P.map((x, k) => <div key={x.l} style={{
          display: 'grid',
          gap: '10px',
          paddingTop: '18px',
          borderTop: '2px solid ' + (clair ? 'rgba(181,212,247,.35)' : '#B5CDEA')
        }}>
      <dd style={{
            margin: 0
          }}><C7.Chiffre x={x} on={vu} k={k} t={C7.T_TITRE} c={clair ? '#fff' : C7.NAV} /></dd><dt style={{
            fontSize: '15px',
            fontWeight: 700,
            color: clair ? '#fff' : C7.NAV
          }}>{x.l}</dt></div>)}</dl></div></section>;
}

/* ——— Cléo ——— */
function Cleo({
  v = 'portrait',
  fond = '#fff'
}) {
  const T = TCH();
  const tache = (x, i, carte) => carte ? <li key={x.t} style={{
    display: 'flex'
  }}><KIT_LL.Carte style={{
      flex: 1,
      padding: '24px',
      gap: '14px'
    }}><KIT_LL.Pastille n={ICT[i]} t={44} /><h3 style={{
        margin: '4px 0 0',
        fontSize: '17px',
        fontWeight: 700,
        lineHeight: 1.3,
        color: MAR
      }}>{x.t}</h3><p style={{
        margin: 0,
        fontSize: '13.5px',
        lineHeight: 1.6,
        color: TXT
      }}>{x.d}</p></KIT_LL.Carte></li> : <li key={x.t} style={{
    display: 'grid',
    gridTemplateColumns: '40px minmax(0,1fr)',
    gap: '14px',
    alignItems: 'start'
  }}><KIT_LL.Pastille n={ICT[i]} t={40} /><span style={{
      display: 'grid',
      gap: '6px'
    }}><h3 style={{
        margin: 0,
        fontSize: '16px',
        fontWeight: 700,
        lineHeight: 1.35,
        color: MAR
      }}>{x.t}</h3><p style={{
        margin: 0,
        fontSize: '13.5px',
        lineHeight: 1.6,
        color: TXT
      }}>{x.d}</p></span></li>;
  if (v === 'grille') return <section aria-labelledby="v2-c" style={{
    background: fond
  }}><div style={{
      ...BOITE,
      display: 'grid',
      gap: 'clamp(36px,4vw,56px)'
    }}>
    <div className="v2-tete" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,7fr) minmax(0,5fr)',
        gap: '24px 56px',
        alignItems: 'end'
      }}><div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}><img src={PORT} alt={ALT} width="88" height="88" style={{
            width: '88px',
            height: '88px',
            flex: 'none',
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: '50% 20%',
            background: '#ECF2F9'
          }} /><KIT_LL.TitreSec id="v2-c" titre={T_CLEO} /></div><div style={{
          justifySelf: 'end'
        }}><KIT_LL.Btn onClick={parlerCleo}>Parler à Cléo</KIT_LL.Btn></div></div>
    <p style={{
        margin: '-16px 0 0',
        fontSize: '14px',
        lineHeight: 1.65,
        color: TXT,
        maxWidth: '64ch'
      }}>{S_CLEO}</p>
    <ul className="v2-g4" style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
        gap: '16px'
      }}>{T.map((x, i) => tache(x, i, true))}</ul></div></section>;
  return <section aria-labelledby="v2-c" style={{
    background: fond
  }}><div className="v2-2c" style={{
      ...BOITE,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
      gap: 'clamp(40px,6vw,96px)',
      alignItems: 'center'
    }}>
    <div className="v2-port" style={{
        position: 'relative',
        aspectRatio: '4 / 5',
        borderRadius: 'var(--k-r)',
        overflow: 'hidden',
        background: 'linear-gradient(170deg,#ECF2F9,#C8DAF0)'
      }}><img src={PORT} alt={ALT} style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: '50% 15%'
        }} />
      <span style={{
          position: 'absolute',
          left: '16px',
          bottom: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: 'var(--k-rb)',
          background: '#fff',
          fontSize: '13px',
          fontWeight: 700,
          color: MAR,
          boxShadow: '0 8px 24px -12px rgba(12,33,71,.4)'
        }}><span aria-hidden="true" style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#3FB37F'
          }}></span>24/7</span></div>
    <div style={{
        display: 'grid',
        gap: '32px'
      }}><KIT_LL.TitreSec id="v2-c" titre={T_CLEO} lead={S_CLEO} />
      <ul className="v2-f2" style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
          gap: '24px 32px'
        }}>{T.map((x, i) => tache(x, i))}</ul>
      <div><KIT_LL.Btn onClick={parlerCleo}>Parler à Cléo</KIT_LL.Btn></div></div></div></section>;
}

/* ——— Votre arrivée ——— */
const T_ARR = {
  sur: 'Votre arrivée chez Lease Lane',
  titre: 'Quatre étapes, du premier appel au premier rapport.'
};
function Parcours({
  v = 'ligne',
  fond = DOUX
}) {
  const E = ETA();
  if (v === 'vertical') return <section aria-labelledby="v2-e" style={{
    background: fond
  }}><div className="v2-2c" style={{
      ...BOITE,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
      gap: 'clamp(40px,6vw,96px)',
      alignItems: 'start'
    }}>
    <div className="v2-colle" style={{
        position: 'sticky',
        top: 'calc(var(--web-entete,108px) + 32px)',
        display: 'grid',
        gap: '32px'
      }}><KIT_LL.TitreSec id="v2-e" {...T_ARR} max="16ch" /><div><KIT_LL.Btn to="/offre-de-service">Planifier un appel</KIT_LL.Btn></div></div>
    <ol style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid'
      }}>{E.map(([ic, t, d, q], i) => <li key={t} style={{
          display: 'grid',
          gridTemplateColumns: '48px minmax(0,1fr)',
          gap: '24px',
          paddingBottom: i < E.length - 1 ? '36px' : 0,
          position: 'relative'
        }}>
      {i < E.length - 1 && <span aria-hidden="true" style={{
            position: 'absolute',
            left: '23.5px',
            top: '52px',
            bottom: '4px',
            width: '1px',
            background: '#B5CDEA'
          }}></span>}
      <span style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--k-rb)',
            display: 'grid',
            placeItems: 'center',
            background: '#fff',
            border: '1.5px solid ' + MAR,
            fontSize: '16px',
            fontWeight: 700,
            color: MAR
          }}>{i + 1}</span>
      <span style={{
            display: 'grid',
            gap: '8px',
            paddingTop: '4px'
          }}><span style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '10px 14px'
            }}><h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                color: MAR
              }}>{t}</h3><KIT_LL.Badge>{q}</KIT_LL.Badge></span><p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.65,
              color: TXT,
              maxWidth: '52ch'
            }}>{d}</p></span></li>)}</ol></div></section>;
  return <section aria-labelledby="v2-e" style={{
    background: fond
  }}><div style={{
      ...BOITE,
      display: 'grid',
      gap: 'clamp(40px,4.4vw,64px)'
    }}>
    <div className="v2-tete" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,7fr) minmax(0,5fr)',
        gap: '24px 56px',
        alignItems: 'end'
      }}><KIT_LL.TitreSec id="v2-e" {...T_ARR} /><div style={{
          justifySelf: 'end'
        }}><KIT_LL.Btn to="/offre-de-service">Planifier un appel</KIT_LL.Btn></div></div>
    <ol className="v2-ligne" style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
        gap: '24px'
      }}>{E.map(([ic, t, d, q], i) => <li key={t} style={{
          position: 'relative',
          display: 'grid',
          gap: '16px',
          alignContent: 'start'
        }}>
      <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}><span style={{
              width: '44px',
              height: '44px',
              flex: 'none',
              borderRadius: 'var(--k-rb)',
              display: 'grid',
              placeItems: 'center',
              background: MAR,
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700
            }}>{i + 1}</span>{i < E.length - 1 && <span aria-hidden="true" className="v2-trait" style={{
              flex: 1,
              height: '1px',
              background: 'repeating-linear-gradient(90deg,#91B5E0 0 6px,transparent 6px 12px)'
            }}></span>}</span>
      <KIT_LL.Badge>{q}</KIT_LL.Badge><h3 style={{
            margin: 0,
            fontSize: '19px',
            fontWeight: 700,
            color: MAR
          }}>{t}</h3><p style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: 1.65,
            color: TXT
          }}>{d}</p></li>)}</ol></div></section>;
}

/* ——— Témoignages ——— */
const T_TEM = {
  titre: 'Des propriétaires, {des résultats}.',
  lead: 'Le résultat d’abord, puis les mots du propriétaire.'
};
const Temoin = ({
  x,
  grand
}) => {
  const [q, n, ty, r, rl] = x;
  return <figure className="k-carte" style={{
    margin: 0,
    padding: grand ? 'clamp(28px,3vw,44px)' : '28px',
    display: 'grid',
    gap: '20px',
    alignContent: 'space-between',
    height: '100%',
    boxSizing: 'border-box'
  }}>
  <span style={{
      display: 'grid',
      gap: '4px'
    }}><span style={{
        fontSize: grand ? 'clamp(40px,4vw,56px)' : '34px',
        fontWeight: 700,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        color: MAR
      }}>{r}</span><span style={{
        fontSize: '13px',
        fontWeight: 600,
        color: BL6
      }}>{rl}</span></span>
  <blockquote style={{
      margin: 0,
      display: 'grid',
      gap: '12px'
    }}><KIT_LL.Ico n="guillemets" t={grand ? 28 : 22} c={BL} /><p style={{
        margin: 0,
        fontSize: grand ? '18px' : '15px',
        fontWeight: grand ? 600 : 500,
        lineHeight: 1.55,
        color: MAR,
        textWrap: 'pretty'
      }}>{q}</p></blockquote>
  <figcaption style={{
      display: 'grid',
      gap: '2px',
      paddingTop: '16px',
      borderTop: FINE
    }}><span style={{
        fontSize: '14px',
        fontWeight: 700,
        color: MAR
      }}>{n}</span><span style={{
        fontSize: '13px',
        color: TXT
      }}>{ty}</span></figcaption></figure>;
};
function Temoignages({
  v = 'trois',
  fond = '#fff'
}) {
  return <section aria-labelledby="v2-t" style={{
    background: fond
  }}><div style={{
      ...BOITE,
      display: 'grid',
      gap: 'clamp(36px,4vw,56px)'
    }}><KIT_LL.TitreSec id="v2-t" {...T_TEM} />
  {v === 'vedette' ? <div className="v2-ved" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,7fr) minmax(0,5fr)',
        gridTemplateRows: '1fr 1fr',
        gap: '20px'
      }}><div style={{
          gridRow: '1 / 3'
        }}><Temoin x={TEM[0]} grand /></div><Temoin x={TEM[1]} /><Temoin x={TEM[2]} /></div> : <div className="v2-g3" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
        gap: '20px'
      }}>{TEM.map(x => <Temoin key={x[1]} x={x} />)}</div>}</div></section>;
}

/* ——— Questions ——— */
const T_FAQ = {
  sur: 'Questions fréquentes',
  titre: 'Vos questions, {nos réponses directes}.',
  lead: 'Ces réponses viennent des questions posées à Cléo, validées par notre équipe avant leur publication.'
};
const IDS = ['p1', 'p2', 'p3', 'p8', 'p4', 'p5'];
function Faq({
  v = 'deux',
  fond = DOUX
}) {
  const F = LL_FAQ,
    it = IDS.filter(k => F[k]).map(k => F[k]);
  const lien = <a href="/faq" onClick={e => {
    e.preventDefault();
    KIT_LL.aller('/faq');
  }} className="k-btn k-l"><span>Foire aux questions</span><span className="k-fl" aria-hidden="true"><KIT_LL.Ico n="fleche" t={18} sw={2} /></span></a>;
  if (v === 'centre') return <section aria-labelledby="v2-f" style={{
    background: fond
  }}><div style={{
      ...BOITE,
      display: 'grid',
      justifyItems: 'center',
      gap: 'clamp(36px,4vw,56px)'
    }}><KIT_LL.TitreSec id="v2-f" {...T_FAQ} a="center" /><div style={{
        width: '100%',
        maxWidth: '820px'
      }}><KIT_LL.Accordeon items={it} pid="v2-acc" /></div>{lien}</div></section>;
  return <section aria-labelledby="v2-f" style={{
    background: fond
  }}><div className="v2-2c" style={{
      ...BOITE,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
      gap: 'clamp(40px,6vw,96px)',
      alignItems: 'start'
    }}>
    <div className="v2-colle" style={{
        position: 'sticky',
        top: 'calc(var(--web-entete,108px) + 32px)',
        display: 'grid',
        gap: '28px',
        justifyItems: 'start'
      }}><KIT_LL.TitreSec id="v2-f" {...T_FAQ} max="16ch" />{lien}</div><KIT_LL.Accordeon items={it} pid="v2-acc" /></div></section>;
}

/* ——— Demande d'offre (formulaire) ——— */
const TYPES = ['Plex de 2 à 5 logements', 'Immeuble de 6 à 11 logements', 'Immeuble de 12 logements et plus', 'Plusieurs immeubles', 'Maison ou condo locatif'];
function Formulaire() {
  const [v, setV] = React.useState({
      type: '',
      portes: '',
      secteur: '',
      prenom: '',
      nom: '',
      courriel: '',
      tel: '',
      consent: false
    }),
    [err, setErr] = React.useState({}),
    [ok, setOk] = React.useState(false),
    ref = React.useRef(null);
  const maj = k => e => setV(s => ({
    ...s,
    [k]: e && e.target ? e.target.type === 'checkbox' ? e.target.checked : e.target.value : e
  }));
  const envoyer = e => {
    e.preventDefault();
    const x = {};
    if (!v.type) x.type = 'Choisissez un type d’immeuble.';
    if (!/^\d+$/.test(v.portes) || +v.portes < 1) x.portes = 'Indiquez un nombre de portes.';
    if (!v.secteur.trim()) x.secteur = 'Indiquez le secteur.';
    if (!v.prenom.trim()) x.prenom = 'Indiquez votre prénom.';
    if (!v.nom.trim()) x.nom = 'Indiquez votre nom.';
    if (!/^\S+@\S+\.\S+$/.test(v.courriel)) x.courriel = 'Adresse courriel invalide.';
    if (v.tel.replace(/\D/g, '').length < 10) x.tel = 'Numéro à 10 chiffres.';
    if (!v.consent) x.consent = 'Votre consentement est requis pour traiter la demande.';
    setErr(x);
    if (Object.keys(x).length) {
      setTimeout(() => {
        const r = ref.current;
        if (!r) return;
        const g = x.type ? r.querySelector('input[name="v2-type"]') : r.querySelector('[aria-invalid="true"]');
        g && g.focus();
      }, 0);
      return;
    }
    setOk(true);
  };
  if (ok) return <div role="status" className="k-carte" style={{
    padding: 'clamp(28px,3vw,40px)',
    gap: '16px'
  }}><span aria-hidden="true" style={{
      width: '52px',
      height: '52px',
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      background: '#E3F4EC'
    }}><KIT_LL.Ico n="check" t={24} c="#1F7A52" sw={2.2} /></span><h3 style={{
      margin: 0,
      fontSize: '24px',
      color: MAR
    }}>{'Demande reçue, merci ' + v.prenom + '.'}</h3><p style={{
      margin: 0,
      fontSize: '14px',
      color: TXT
    }}>Réponse en un jour ouvrable · sans engagement</p></div>;
  return <form ref={ref} noValidate onSubmit={envoyer} className="k-carte" style={{
    padding: 'clamp(24px,3vw,40px)',
    gap: '22px'
  }} aria-label="Demande d’offre de service">
    <KIT_LL.Choix nom="v2-type" label="Type d'immeuble" req options={TYPES} value={v.type} onChange={maj('type')} err={err.type} />
    <div className="v2-f2" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: '18px 20px'
    }}>
      <KIT_LL.Champ id="v2-portes" label="Nombre de portes" req inputMode="numeric" placeholder="6" value={v.portes} onChange={maj('portes')} err={err.portes} />
      <KIT_LL.Champ id="v2-secteur" label="Secteur" req placeholder="Quartier ou ville" value={v.secteur} onChange={maj('secteur')} err={err.secteur} />
      <KIT_LL.Champ id="v2-prenom" label="Prénom" req autoComplete="given-name" value={v.prenom} onChange={maj('prenom')} err={err.prenom} />
      <KIT_LL.Champ id="v2-nom" label="Nom" req autoComplete="family-name" value={v.nom} onChange={maj('nom')} err={err.nom} />
      <KIT_LL.Champ id="v2-courriel" label="Courriel" req type="email" autoComplete="email" value={v.courriel} onChange={maj('courriel')} err={err.courriel} />
      <KIT_LL.Champ id="v2-tel" label="Téléphone" req type="tel" autoComplete="tel" inputMode="tel" value={v.tel} onChange={maj('tel')} err={err.tel} /></div>
    <KIT_LL.Case id="v2-consent" checked={v.consent} onChange={maj('consent')} err={err.consent}>J'accepte que Lease Lane utilise ces renseignements pour préparer une offre et me joindre à ce sujet. Aucune autre utilisation. Vous pouvez retirer votre consentement en tout temps. <a href="/confidentialite" style={{
        color: BL6,
        fontWeight: 600
      }}>Politique de confidentialité</a></KIT_LL.Case>
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '14px 20px'
    }}><KIT_LL.Btn type="submit">Envoyer ma demande</KIT_LL.Btn><span style={{
        fontSize: '13px',
        color: TXT
      }}>Réponse en un jour ouvrable · sans engagement</span></div></form>;
}
const T_FIN = {
  sur: 'Prochaine étape',
  titre: 'Une offre claire pour votre immeuble, {en deux minutes}.',
  lead: 'Décrivez votre immeuble : nous revenons avec une offre écrite et un moment pour en parler.'
};
function Final({
  v = 'split',
  fond = '#fff'
}) {
  const s = S(),
    tel = 'tel:' + String(s.telephone || '').replace(/\D/g, '');
  const contact = <ul style={{
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gap: '14px'
  }}>{[['telephone', s.telephone, tel], ['courriel', s.courriel, 'mailto:' + s.courriel]].map(([ic, t, h]) => <li key={ic}><a href={h} className="k-focus" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        minHeight: '44px',
        fontSize: '15px',
        fontWeight: 600,
        color: MAR,
        textDecoration: 'none'
      }}><KIT_LL.Pastille n={ic} t={40} />{t}</a></li>)}</ul>;
  if (v === 'centre') return <section aria-labelledby="v2-o" style={{
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(180deg,#fff,#F4F8FC)'
  }}><Sol h="45%" /><div style={{
      ...BOITE,
      position: 'relative',
      display: 'grid',
      justifyItems: 'center',
      gap: '40px'
    }}><KIT_LL.TitreSec id="v2-o" {...T_FIN} a="center" /><div style={{
        width: '100%',
        maxWidth: '760px'
      }}><Formulaire /></div></div></section>;
  return <section aria-labelledby="v2-o" style={{
    background: fond
  }}><div className="v2-2c" style={{
      ...BOITE,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
      gap: 'clamp(40px,6vw,96px)',
      alignItems: 'start'
    }}>
    <div style={{
        display: 'grid',
        gap: '32px'
      }}><KIT_LL.TitreSec id="v2-o" {...T_FIN} max="16ch" />{contact}</div><Formulaire /></div></section>;
}

/* ——— Pied de page ——— */
const COLS = [['Propriétaires', [['/gestion-immobiliere', 'Gestion d’immeubles'], ['/gestion-immobiliere/location', 'Location et mise en marché'], ['/expertise-et-strategie', 'Expertise et stratégie'], ['/changer-de-gestionnaire', 'Changer de gestionnaire']]], ['Locataires', [['/locataires', 'Service aux locataires'], ['/locataires/commentaire-ou-plainte', 'Administration et plaintes']]], ['Lease Lane', [['/cleo', 'Agent IA - Cléo'], ['/a-propos', 'À propos'], ['/faq', 'Foire aux questions']]]];
const LEG = [['/temoins', 'Témoins de navigation'], ['/conditions-utilisation', 'Conditions d’utilisation'], ['/confidentialite', 'Politique de confidentialité']];
const TAG = 'Une gestion d\'immeubles à la fine pointe de la technologie. Nos automatisations prennent le maximum d\'opérations en charge; notre équipe s\'occupe du reste.';
const AUTH = "/connexion";
function Pied() {
  const s = S(),
    {
      Logo
    } = __DS,
    L = {
      color: '#C8DAF0',
      textDecoration: 'none',
      fontSize: '14px',
      lineHeight: 1.5,
      display: 'inline-flex',
      minHeight: '32px',
      alignItems: 'center'
    },
    T = {
      margin: '0 0 14px',
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: '#91B5E0'
    };
  return <footer className="ll-sombre v2-pied" style={{
    background: '#0A1A30',
    color: '#fff'
  }}><div style={{
      ...BOITE,
      paddingTop: 'clamp(48px,6vw,80px)',
      paddingBottom: '28px',
      display: 'grid',
      gap: '48px'
    }}>
    <div className="v2-tete" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto',
        gap: '24px 48px',
        alignItems: 'center',
        paddingBottom: '40px',
        borderBottom: '1px solid rgba(200,218,240,.14)'
      }}>
      <div style={{
          display: 'grid',
          gap: '16px',
          justifyItems: 'start'
        }}>{Logo ? <Logo base={BASE_LOGO} fond="marine" slogan={false} hauteur={40} /> : null}<p style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: 1.65,
            color: '#C8DAF0',
            maxWidth: '56ch'
          }}>{TAG}</p></div>
      <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px'
        }}><KIT_LL.Btn to={GI} clair>Gestion d'immeubles</KIT_LL.Btn><a href={AUTH} className="k-btn k-s" style={{
            background: 'transparent',
            color: '#fff',
            borderColor: 'rgba(255,255,255,.45)'
          }}><span>Espace propriétaire</span></a><a href={AUTH} className="k-btn k-s" style={{
            background: 'transparent',
            color: '#fff',
            borderColor: 'rgba(255,255,255,.45)'
          }}><span>Espace locataire</span></a></div></div>
    <div className="v2-pg" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.3fr) repeat(3,minmax(0,1fr))',
        gap: '36px'
      }}>
      <div><h2 style={T}>Nous joindre</h2><ul style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gap: '6px'
          }}>
        <li><a href={'tel:' + String(s.telephone || '').replace(/\D/g, '')} style={{
                ...L,
                color: '#fff',
                fontWeight: 600,
                fontSize: '16px'
              }}>{s.telephone}</a></li><li><a href={'mailto:' + s.courriel} style={L}>{s.courriel}</a></li>
        {s.adresse && <li style={{
              ...L,
              display: 'block'
            }}>{s.adresse.rue + ', ' + s.adresse.ville + ' (' + s.adresse.region + ') ' + s.adresse.cp}</li>}
        <li style={{
              marginTop: '12px'
            }}><a href="/locataires#urgence" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                minHeight: '44px',
                padding: '0 16px',
                borderRadius: 'var(--k-rb)',
                background: 'var(--urgence-500)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none'
              }}><KIT_LL.Ico n="alerte" t={16} c="#fff" sw={2} />{'Urgence 24/7 · ' + s.urgence}</a></li></ul></div>
      {COLS.map(([t, l]) => <nav key={t} aria-label={t}><h2 style={T}>{t}</h2><ul style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gap: '2px'
          }}>{l.map(([to, x]) => <li key={x}><a href={to} style={L}>{x}</a></li>)}</ul></nav>)}</div>
    <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px 24px',
        paddingTop: '24px',
        borderTop: '1px solid rgba(200,218,240,.14)'
      }}>
      <span style={{
          fontSize: '13px',
          color: '#91B5E0'
        }}>{'© 2026 ' + (s.raison || 'Lease Lane')}</span>
      <nav aria-label="Information légale" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 22px'
        }}>{LEG.map(([to, x]) => <a key={to} href={to} style={{
            ...L,
            fontSize: '13px'
          }}>{x}</a>)}<button type="button" onClick={() => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.dispatchEvent(new Event('ll-temoins')) : undefined} style={{
            ...L,
            fontSize: '13px',
            border: 0,
            background: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}>Gérer mes témoins</button></nav></div>
  </div></footer>;
}

/* ——— Cinq accueils ——— */
const PAGES = {
  1: {
    nom: 'Clair et direct',
    s: 1,
    b: [[Preuve, {
      v: 'centre'
    }], [Cleo, {
      v: 'portrait',
      fond: DOUX
    }], [Parcours, {
      v: 'ligne',
      fond: '#fff'
    }], [Temoignages, {
      v: 'trois',
      fond: DOUX
    }], [Faq, {
      v: 'deux',
      fond: '#fff'
    }], [Final, {
      v: 'split',
      fond: DOUX
    }]]
  },
  2: {
    nom: 'Éditorial',
    s: 5,
    b: [[Temoignages, {
      v: 'vedette',
      fond: '#fff'
    }], [Preuve, {
      v: 'bande'
    }], [Parcours, {
      v: 'vertical',
      fond: '#fff'
    }], [Cleo, {
      v: 'grille',
      fond: DOUX
    }], [Faq, {
      v: 'centre',
      fond: '#fff'
    }], [Final, {
      v: 'centre'
    }]]
  },
  3: {
    nom: 'Panneau d’entrée',
    s: 2,
    b: [[Preuve, {
      v: 'marine'
    }], [Cleo, {
      v: 'portrait',
      fond: '#fff'
    }], [Parcours, {
      v: 'ligne',
      fond: DOUX
    }], [Temoignages, {
      v: 'vedette',
      fond: '#fff'
    }], [Faq, {
      v: 'deux',
      fond: DOUX
    }], [Final, {
      v: 'split',
      fond: '#fff'
    }]]
  },
  4: {
    nom: 'Carrefour',
    s: 3,
    b: [[Parcours, {
      v: 'ligne',
      fond: '#fff'
    }], [Preuve, {
      v: 'centre'
    }], [Temoignages, {
      v: 'trois',
      fond: DOUX
    }], [Cleo, {
      v: 'grille',
      fond: '#fff'
    }], [Faq, {
      v: 'deux',
      fond: DOUX
    }], [Final, {
      v: 'centre'
    }]]
  },
  5: {
    nom: 'Bandeau',
    s: 4,
    b: [[Cleo, {
      v: 'portrait',
      fond: '#fff'
    }], [Preuve, {
      v: 'bande'
    }], [Parcours, {
      v: 'vertical',
      fond: '#fff'
    }], [Temoignages, {
      v: 'trois',
      fond: DOUX
    }], [Faq, {
      v: 'centre',
      fond: '#fff'
    }], [Final, {
      v: 'split',
      fond: DOUX
    }]]
  }
};
const CLE = 'll-accueil-v2',
  CLE_K = 'll-kit-v2';
/* Fichier de site dédié : window.LL_VUE_SITE impose la version d'accueil et la bibliothèque (sans barres de revue). */
const SITE = null;
const lire = (c, d) => {
  if (SITE && SITE[c] != null) return SITE[c];
  try {
    return null || d;
  } catch (e) {
    return d;
  }
};
const useEtat = (c, d) => {
  const [m, setM] = React.useState(() => lire(c, d));
  React.useEffect(() => {
    const f = () => setM(lire(c, d));
    window.addEventListener('ll-accueil-v2', f);
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.removeEventListener('ll-accueil-v2', f) : undefined;
  }, []);
  return m;
};
const poser = (c, v) => {
  try {
    void 0;
  } catch (e) {}
  window.dispatchEvent(new Event('ll-accueil-v2'));
};
const Barre = ({
  titre,
  opts,
  val,
  cle
}) => <div role="group" aria-label={titre} style={{
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 4px 4px 14px',
  borderRadius: '24px',
  border: '1px dashed #6A9AD5',
  background: '#fff'
}}>
  <span style={{
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: '#2E5788',
    marginRight: '6px'
  }}>{titre}</span>
  {opts.map(([v, l]) => <button key={v} type="button" aria-pressed={val === v} onClick={() => poser(cle, v)} style={{
    height: '34px',
    padding: '0 14px',
    border: 0,
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 600,
    background: val === v ? MAR : 'transparent',
    color: val === v ? '#fff' : MAR
  }}>{l}</button>)}</div>;
/* Accueil : revue réactivée (« Actuel » par défaut = version retenue). */

function AccueilV2({
  actuel
}) {
  const m = useEtat(CLE, '1'),
    k = useEtat(CLE_K, 'A'),
    pg = PAGES[m];
  const barres = <div style={{
    position: 'sticky',
    top: 'var(--web-entete,108px)',
    zIndex: 40,
    background: 'rgba(236,242,249,.94)',
    backdropFilter: 'blur(6px)',
    borderBottom: '1px solid #E6EAEF'
  }}><div style={{
      maxWidth: 'var(--web-conteneur)',
      margin: '0 auto',
      padding: '8px var(--web-gouttiere)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    }}>
    <Barre titre="Revue · Accueil" cle={CLE} val={m} opts={[['0', 'Actuel'], ...Object.entries(PAGES).map(([v, p]) => [v, v + ' · ' + p.nom])]} />
    {pg && <Barre titre="Bibliothèque" cle={CLE_K} val={k} opts={Object.entries(KIT_LL.KITS).map(([v, x]) => [v, v + ' · ' + x.nom])} />}</div></div>;
  if (SITE && pg) {
    const Sv = SERV[pg.s];
    return <KIT_LL.Kit k={k}><Sv />{pg.b.map(([Cmp, p], i) => <Cmp key={i} {...p} />)}<Pied /></KIT_LL.Kit>;
  }
  /* Site principal : accueil retenu, barres de revue retirées. */
  if (!SITE) return actuel;
  if (!pg) return <React.Fragment>{barres}{actuel}</React.Fragment>;
  const Sv = SERV[pg.s];
  return <KIT_LL.Kit k={k}>{barres}<Sv />{pg.b.map(([Cmp, p], i) => <Cmp key={i} {...p} />)}<Pied /></KIT_LL.Kit>;
}
export { AccueilV2 };
