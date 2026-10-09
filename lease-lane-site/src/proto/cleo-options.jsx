/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/cleo-options.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Markdown } from '@/lib/markdown';
import { Icon } from '@/components/ds';
import { CP_PARTS } from '@/proto/cleo-panneau';
import { gab } from '@/proto/blocs';
import { LL_CLEO_ACTIONS } from '@/proto/app';
import { LL_FAQ } from '@/proto/faq';
import { CleoFormulaire } from '@/proto/cleo-formulaires';
import { useEtatClient, __ssr } from '@/lib/hydratation';
const MAR = '#0C2147';
const CO_CSS = '.co-l{transition:background-color 200ms,border-color 200ms,color 200ms}.co-l .co-fl{transition:transform 260ms cubic-bezier(.22,1,.36,1),opacity 200ms}.co-l:hover .co-fl{transform:translateX(4px);opacity:1!important}' + '.co-1 .co-l:hover{background:transparent}.co-1 .co-l:hover>span:first-child{color:#3767A2!important}.co-1 .co-l:hover>span.co-urg-t{color:#A3231B!important}.co-rond{color:' + MAR + ';transition:background-color 200ms,border-color 200ms,color 200ms,transform 260ms cubic-bezier(.22,1,.36,1)}.co-l:hover .co-rond{background:#3767A2;transform:translateX(2px)}.co-urg{transition:background-color 200ms,transform 260ms cubic-bezier(.22,1,.36,1)}.co-lien:hover{color:#0C2147!important;text-decoration:underline!important}.co-l:hover .co-urg{background:#A3231B;transform:translateX(2px)}.co-2 .co-l:not(.co-prem):hover{background:rgba(255,255,255,.12)!important;border-color:rgba(181,212,247,.5)!important}.co-2 .co-prem:hover{background:#EEF4FB!important}.co-2 .co-l{transition:background-color 200ms,border-color 200ms,transform 260ms cubic-bezier(.22,1,.36,1)}.co-2 .co-l:hover{transform:translateY(-2px)}.co-3 .co-l:hover{background:#F3F7FC}' + '.co-b{transition:background-color 180ms,color 180ms}.co-1 .co-b:hover,.co-3 .co-b:hover{background:#EEF3F9}.co-2 .co-b:hover{background:rgba(255,255,255,.12)}' + '.co-2 .cp-puce{background:transparent!important;color:#fff!important;border-color:rgba(181,212,247,.4)!important}.co-2 .cp-puce:hover{background:#fff!important;color:' + MAR + '!important}' + '.co-1 .co-grp>button:last-child{border-bottom:1px solid rgba(12,33,71,.08)!important}.co-saisie:focus-within{box-shadow:0 0 0 3px rgba(69,129,203,.22)}.co-1 .co-saisie,.co-1 .co-saisie:focus-within{border:0!important;box-shadow:none!important;outline:0!important}.co-1 .co-saisie:focus-within{background:#E9F0F9!important}.co-1 .co-saisie input:focus,.co-1 .co-saisie input:focus-visible{outline:0!important;box-shadow:none!important}' + '@keyframes co-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes co-pop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}@keyframes co-halo{0%{opacity:0;transform:scale(.92)}35%{opacity:1}100%{opacity:0;transform:scale(1.45)}}' + '.co-in{animation:co-in 460ms cubic-bezier(.22,1,.36,1) both}.co-pop{animation:co-pop 620ms cubic-bezier(.22,1,.36,1) both}.co-halo{position:absolute;inset:0;border-radius:inherit;box-shadow:0 0 0 10px rgba(69,129,203,.2);pointer-events:none;animation:co-halo 1700ms 380ms ease-out both}.co-txt{transition:opacity 260ms ease}.co-passer:hover{color:#0C2147!important;text-decoration:underline!important}.co-l:focus-visible,.co-passer:focus-visible,.co-modif:focus-visible{outline:2px solid #4581CB;outline-offset:2px;border-radius:6px}' + '@media (prefers-reduced-motion:reduce){.co-in,.co-pop,.co-halo{animation:none!important}.co-txt{transition:none}}' + '@media (max-width:560px){.co-revue{display:none!important}.co-3{gap:0!important;background:#F4F7FB}.co-3>*{border-radius:0!important;box-shadow:none!important}}';

/* Thèmes */
const TH = {
  '1': {
    fond: '#fff',
    txt: MAR,
    doux: '#5A6B82',
    sur: '#5A6B82',
    filet: '1px solid rgba(12,33,71,.08)',
    bulleA: null,
    bulleC: {
      background: '#EEF3F9',
      color: MAR
    },
    champ: {
      background: '#F3F6FA',
      border: '1px solid transparent'
    },
    envoi: MAR,
    ic: '#4581CB'
  },
  '2': {
    fond: 'linear-gradient(165deg,#132D57 0%,#0C2147 55%,#0A1B3B 100%)',
    txt: '#fff',
    doux: '#B5C7DF',
    sur: '#7FA2D1',
    filet: '1px solid rgba(181,212,247,.14)',
    bulleA: {
      background: 'rgba(255,255,255,.08)',
      color: '#fff'
    },
    bulleC: {
      background: '#fff',
      color: MAR
    },
    champ: {
      background: 'rgba(255,255,255,.07)',
      border: '1px solid rgba(181,212,247,.22)'
    },
    envoi: '#4581CB',
    ic: '#B5D4F7'
  },
  '3': {
    fond: '#fff',
    txt: MAR,
    doux: '#5A6B82',
    sur: '#7A8BA3',
    filet: '1px solid rgba(12,33,71,.08)',
    bulleA: {
      background: '#F1F5FA',
      color: MAR
    },
    bulleC: {
      background: MAR,
      color: '#fff'
    },
    champ: {
      background: '#fff',
      border: '1px solid rgba(12,33,71,.14)'
    },
    envoi: MAR,
    ic: '#4581CB'
  }
};
const SUR = c => ({
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: c
});
const numUrg = u => String(u || '').replace(/\D/g, '');
const Urgence = ({
  u,
  o,
  T
}) => {
  const n = numUrg(u),
    Tag = n.length >= 10 ? 'a' : 'div';
  const lib = gab ? gab(u) : u;
  return <Tag href={Tag === 'a' ? 'tel:' + n : undefined} style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    fontSize: '12.5px',
    color: o === '2' ? '#F3C9C5' : 'var(--urgence-600)',
    ...(o === '2' ? {
      padding: '12px 14px',
      borderRadius: '14px',
      background: 'rgba(180,54,47,.18)'
    } : o === '3' ? {
      padding: '12px 14px',
      borderRadius: '14px',
      background: 'var(--urgence-100)'
    } : {})
  }}>
    <span aria-hidden="true" style={{
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#D2463E',
      flex: 'none',
      boxShadow: '0 0 0 4px rgba(210,70,62,.18)'
    }} />
    <span><strong style={{
        fontWeight: 700
      }}>Urgence 24/7 · {lib}</strong><span style={{
        color: o === '2' ? '#D9B0AC' : '#7A3631'
      }}> · eau qui coule, plus de chauffage</span></span></Tag>;
};

/* Accueil guidé : profil du visiteur, choisi une fois par session, puis intentions filtrées. */
const STATUTS = [['locataire', 'Je suis locataire.', 'key'], ['proprio', 'Je suis propriétaire et client chez vous.', 'building-2'], ['futur', 'Je veux devenir un locataire.', 'house'], ['client', 'Je désire être client de vos services de gestion.', 'handshake'], ['info', 'Je désire seulement m\u2019informer.', 'lightbulb']];
/* c = profil central de Cléo (app.jsx) : réponses, FAQ et intentions cloisonnées. Propriétaires : rien de locataire hors TAL et espace propriétaire; locataires : rien de propriétaire. */
const PROFILS = {
  locataire: {
    lib: 'Locataire',
    k: ['travaux', 'plainte', 'portailL', 'bail'],
    urg: true,
    c: 'locataire'
  },
  proprio: {
    lib: 'Propriétaire client',
    k: ['portailP', 'proprio', 'bail'],
    urg: false,
    c: 'proprio'
  },
  futur: {
    lib: 'Futur locataire',
    k: ['chercher', 'visite', 'demande', 'bail'],
    urg: false,
    c: 'prospect'
  },
  client: {
    lib: 'Futur client',
    k: ['gestion', 'proprio', 'bail'],
    urg: false,
    c: 'proprio'
  },
  info: {
    lib: 'Visiteur',
    k: ['chercher', 'gestion', 'bail'],
    urg: false,
    c: null
  }
};
const lireStatut = () => {
  try {
    const s = typeof sessionStorage !== "undefined" ? sessionStorage.getItem('ll-cleo-statut') : undefined;
    return PROFILS[s] ? s : null;
  } catch (e) {
    return null;
  }
};
const mouvementReduit = () => !!(((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : undefined));
const LIGNE = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) auto',
  alignItems: 'center',
  gap: '12px',
  minHeight: '38px',
  padding: '0 2px 0 0',
  margin: 0,
  border: 0,
  borderRadius: 0,
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left'
};
const Carre = ({
  ic,
  fond = MAR
}) => <span aria-hidden="true" className="co-rond" style={{
  width: '29px',
  height: '29px',
  borderRadius: '8px',
  background: fond,
  display: 'grid',
  placeItems: 'center',
  flex: 'none'
}}><Icon name={ic} size={13} color="#fff" /></span>;
function Accueil({
  o,
  T,
  avatar,
  actions,
  onAction,
  urgence,
  onHumain,
  statut,
  onModifier,
  faq = [],
  onFaq
}) {
  const grp = [...new Set(actions.map(a => a.groupe))];
  if (o === '2') return <div style={{
    display: 'grid',
    gap: '24px',
    padding: '8px 24px 24px'
  }}>
    <div style={{
      display: 'grid',
      justifyItems: 'center',
      gap: '12px',
      textAlign: 'center',
      paddingTop: '6px'
    }}>
      <span style={{
        position: 'relative',
        display: 'block',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        boxShadow: '0 0 0 6px rgba(97,148,211,.16),0 0 40px rgba(97,148,211,.45)'
      }}><CP_PARTS.Portrait src={avatar} t={64} /></span>
      <h2 style={{
        margin: 0,
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: '#fff'
      }}>Bonjour, je suis Cléo.</h2>
      <p style={{
        margin: 0,
        maxWidth: '30ch',
        fontSize: '13px',
        lineHeight: 1.55,
        color: T.doux
      }}>Je réponds 24/7 et je passe la main à une personne quand il le faut.</p></div>
    <div style={{
      display: 'grid',
      gap: '12px'
    }}><span style={SUR('#9DBBE3')}>Que souhaitez-vous faire?</span><div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px'
      }}>{actions.map((a, i) => {
          const prem = i === 0,
            large = prem || a.groupe === 'Propriétaires' || a.k === 'bail';
          return <button key={a.k} type="button" className={'co-l' + (prem ? ' co-prem' : '')} onClick={() => onAction(a)} style={{
            gridColumn: large ? '1 / -1' : undefined,
            display: 'grid',
            gap: '10px',
            alignContent: 'start',
            minHeight: large ? '72px' : '104px',
            padding: '16px',
            borderRadius: '16px',
            border: prem ? '1px solid #fff' : '1px solid rgba(181,212,247,.22)',
            background: prem ? '#fff' : 'rgba(255,255,255,.07)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            ...(large ? {
              gridTemplateColumns: 'auto minmax(0,1fr) auto',
              alignItems: 'center'
            } : {})
          }}>
      <span aria-hidden="true" style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              display: 'grid',
              placeItems: 'center',
              background: prem ? MAR : '#4581CB'
            }}><Icon name={a.icone} size={18} color="#fff" /></span><span style={{
              display: 'grid',
              gap: '3px'
            }}><span style={{
                fontSize: '14px',
                fontWeight: 700,
                lineHeight: 1.3,
                color: prem ? MAR : '#fff'
              }}>{a.titre}</span>{large && <span style={{
                fontSize: '12.5px',
                color: prem ? '#4A5B72' : '#C9D9EE'
              }}>{a.desc}</span>}</span>
      {large && <span className="co-fl" style={{
              display: 'grid'
            }}><Icon name="arrow-right" size={17} color={prem ? MAR : '#fff'} /></span>}</button>;
        })}</div></div>
    <Urgence u={urgence} o={o} T={T} /></div>;
  if (o === '3') {
    let n = 0;
    return <div style={{
      display: 'grid',
      gap: '22px',
      padding: '26px 22px 20px'
    }}>
    <div style={{
        display: 'grid',
        gap: '6px'
      }}><span style={SUR('#4581CB')}>Cléo · agent IA</span><h2 style={{
          margin: 0,
          fontSize: '21px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          color: MAR
        }}>Bonjour, par quoi commence-t-on?</h2></div>
    {grp.map(g => <div key={g} style={{
        display: 'grid',
        gap: '6px'
      }}><span style={SUR(T.sur)}>{g}</span>
      <ul style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gap: '2px'
        }}>{actions.filter(a => a.groupe === g).map(a => {
            n++;
            return <li key={a.k}><button type="button" className="co-l" onClick={() => onAction(a)} style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '30px minmax(0,1fr) auto',
                alignItems: 'center',
                gap: '10px',
                minHeight: '54px',
                padding: '6px 10px 6px 8px',
                border: 0,
                borderRadius: '12px',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left'
              }}>
        <span style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#4581CB',
                  fontVariantNumeric: 'tabular-nums'
                }}>{String(n).padStart(2, '0')}</span>
        <span style={{
                  display: 'grid',
                  gap: '1px',
                  minWidth: 0
                }}><span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: MAR
                  }}>{a.titre}</span><span style={{
                    fontSize: '12px',
                    color: T.doux
                  }}>{a.desc}</span></span>
        <span className="co-fl" style={{
                  display: 'grid',
                  opacity: .45
                }}><Icon name="arrow-right" size={16} color={MAR} /></span></button></li>;
          })}</ul></div>)}
    <Urgence u={urgence} o={o} T={T} /></div>;
  }
  /* Visiteur (« je désire seulement m'informer ») : seulement l'information publique — trouver un logement, confier un immeuble, le TAL, parler à un humain.
     Pas d'urgence ni d'espaces clients tant qu'il n'est pas client; FAQ générale sur le TAL. */
  const vis = statut === 'info',
    base = vis && LL_CLEO_ACTIONS ? LL_CLEO_ACTIONS : actions;
  const P = PROFILS[statut],
    liste = P && P.k ? base.filter(a => P.k.includes(a.k)) : actions,
    grpL = [...new Set(liste.map(a => a.groupe))],
    urg = !P || P.urg;
  if (vis) {
    const F = LL_FAQ;
    faq = Object.keys(F).filter(id => id[0] === 't').slice(0, 4).map(id => [id, F[id].q]);
  }
  return <div style={{
    display: 'grid',
    gap: '28px',
    padding: '12px 24px 24px'
  }}>
    <div className="co-in" style={{
      display: 'grid',
      gap: '8px'
    }}><h2 style={{
        margin: 0,
        fontSize: '17.5px',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
        color: MAR
      }}>Bonjour, comment puis-je vous aider?</h2>
      {P && <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: T.doux
      }}>Vous êtes : <strong style={{
          fontWeight: 600,
          color: MAR
        }}>{P.lib}</strong><button type="button" className="co-modif co-lien" onClick={onModifier} style={{
          border: 0,
          padding: '2px 0',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '12px',
          fontWeight: 600,
          color: '#3767A2'
        }}>Modifier</button></span>}</div>
    {onHumain && <div className="co-grp co-in" style={{
      display: 'grid',
      animationDelay: '60ms'
    }}>{urg && <button type="button" className="co-l" onClick={() => onAction({
        k: 'urgence',
        titre: 'Signaler une urgence'
      })} style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto',
        alignItems: 'center',
        gap: '12px',
        minHeight: '38px',
        padding: '0 2px 0 0',
        margin: 0,
        border: 0,
        borderTop: T.filet,
        borderRadius: 0,
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left'
      }}>
        <span style={{
          fontSize: '12.75px',
          fontWeight: 600,
          color: '#C62D24'
        }} className="co-urg-t">Signaler une urgence</span>
        <span className="co-urg" style={{
          width: '29px',
          height: '29px',
          borderRadius: '8px',
          background: '#C62D24',
          display: 'grid',
          placeItems: 'center'
        }}><Icon name="triangle-alert" size={13} color="#fff" /></span></button>}<button type="button" className="co-l" onClick={onHumain} style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto',
        alignItems: 'center',
        gap: '12px',
        minHeight: '38px',
        padding: '0 2px 0 0',
        margin: 0,
        border: 0,
        borderTop: T.filet,
        borderBottom: T.filet,
        borderRadius: 0,
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left'
      }}>
        <span style={{
          fontSize: '12.75px',
          fontWeight: 600,
          color: MAR
        }}>Je veux parler à un humain</span>
        <span className="co-rond" style={{
          width: '29px',
          height: '29px',
          borderRadius: '8px',
          background: MAR,
          display: 'grid',
          placeItems: 'center'
        }}><Icon name="user" size={13} color="#fff" /></span></button></div>}
    {grpL.map((g, gi) => <div key={g} className="co-grp co-in" style={{
      display: 'grid',
      animationDelay: 120 + gi * 60 + 'ms'
    }}><span style={{
        ...SUR(T.sur),
        paddingBottom: '10px'
      }}>{g}</span>
      {liste.filter(a => a.groupe === g).map(a => <button key={a.k} type="button" className="co-l" onClick={() => onAction(a)} style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto',
        alignItems: 'center',
        gap: '12px',
        minHeight: '38px',
        padding: '0 2px 0 0',
        margin: 0,
        border: 0,
        borderTop: T.filet,
        borderRadius: 0,
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left'
      }}>
        <span style={{
          fontSize: '12.75px',
          fontWeight: 600,
          color: MAR
        }}>{a.titre}</span>
        <span className="co-rond" style={{
          width: '29px',
          height: '29px',
          borderRadius: '8px',
          background: MAR,
          display: 'grid',
          placeItems: 'center'
        }}><Icon name="arrow-right" size={13} color="#fff" /></span></button>)}</div>)}
    {faq.length > 0 && <div className="co-grp co-in" style={{
      display: 'grid',
      animationDelay: 120 + grpL.length * 60 + 'ms'
    }}><span style={{
        ...SUR(T.sur),
        paddingBottom: '10px'
      }}>Questions fréquentes</span>
      {faq.map(([id, q]) => <button key={id} type="button" className="co-l" onClick={() => onFaq && onFaq(id)} style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto',
        alignItems: 'center',
        gap: '12px',
        minHeight: '44px',
        padding: '6px 2px 6px 0',
        margin: 0,
        border: 0,
        borderTop: T.filet,
        borderRadius: 0,
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left'
      }}>
        <span style={{
          fontSize: '12.75px',
          fontWeight: 600,
          lineHeight: 1.4,
          color: MAR
        }}>{q}</span>
        <span className="co-rond" style={{
          width: '29px',
          height: '29px',
          borderRadius: '8px',
          background: '#E6EEF8',
          display: 'grid',
          placeItems: 'center'
        }}><Icon name="circle-help" size={14} color="#3767A2" /></span></button>)}</div>}</div>;
}
function Panneau(p) {
  const {
      o,
      messages = [],
      ecrit,
      creneaux = [],
      suggestions = [],
      actions = [],
      onAction,
      saisie = '',
      onSaisie,
      onEnvoi,
      onSuggestion,
      onCreneau,
      onLogement,
      onHumain,
      onClose,
      onRecommencer,
      sujet,
      avatar,
      urgence
    } = p,
    T = TH[o];
  const fil = React.useRef(null),
    champ = React.useRef(null),
    debut = messages.length === 0,
    peut = !!saisie.trim();
  /* Accueil guidé (option 1) : intro animée → Cléo rejoint l'en-tête → question du profil → intentions filtrées. */
  const [statut, setStatut] = React.useState(lireStatut);
  const [phase, setPhase] = useEtatClient(() => o === '1' && debut && !lireStatut() ? mouvementReduit() ? 'statut' : 'intro' : 'fin');
  const [mot, setMot] = React.useState(false);
  const avIntro = React.useRef(null),
    avTete = React.useRef(null),
    premier = React.useRef(null),
    minuteurs = React.useRef([]);
  const vider = () => {
    minuteurs.current.forEach(clearTimeout);
    minuteurs.current = [];
  };
  const voler = () => {
    vider();
    const a = avIntro.current,
      b = avTete.current;
    if (!a || !b || !a.animate || mouvementReduit()) {
      setPhase('statut');
      return;
    }
    const ra = a.getBoundingClientRect(),
      rb = b.getBoundingClientRect();
    setPhase('vol');
    const an = a.animate([{
      transform: 'none'
    }, {
      transform: 'translate(' + (rb.left - ra.left) + 'px,' + (rb.top - ra.top) + 'px) scale(' + rb.width / ra.width + ')'
    }], {
      duration: 620,
      easing: 'cubic-bezier(.65,0,.35,1)',
      fill: 'forwards'
    });
    an.onfinish = () => setPhase('statut');
  };
  const passer = () => {
    if (phase === 'intro') {
      setMot(true);
      voler();
    }
  };
  React.useEffect(() => {
    if (phase !== 'intro') return;
    minuteurs.current = [setTimeout(() => setMot(true), 1150), setTimeout(voler, 2900)];
    return vider;
  }, []);
  React.useEffect(() => {
    if (phase === 'statut') {
      const r = setTimeout(() => premier.current && premier.current.focus({
        preventScroll: true
      }), 380);
      return () => clearTimeout(r);
    }
    if (phase === 'fin') {
      const r = setTimeout(() => champ.current && champ.current.focus({
        preventScroll: true
      }), 280);
      return () => clearTimeout(r);
    }
  }, [phase]);
  const choisir = s => {
    try {
      sessionStorage.setItem('ll-cleo-statut', s);
    } catch (e) {}
    setStatut(s);
    setPhase('fin');
    p.onProfil && p.onProfil(PROFILS[s].c);
  };
  /* Synchronisation avec le profil central : au montage, le statut de la session devient le profil; « Changer de profil » (profil remis à zéro) ramène à la question du statut. */
  const monte = React.useRef(false);
  React.useEffect(() => {
    if (!monte.current) {
      monte.current = true;
      if (statut && p.onProfil) {
        const c = PROFILS[statut].c;
        if (c && p.profil !== c) p.onProfil(c);else if (!c && p.profil != null) p.onProfil(null);
      }
      return;
    }
    if (p.onProfil && p.profil == null && statut && statut !== 'info') {
      try {
        sessionStorage.removeItem('ll-cleo-statut');
      } catch (e) {}
      setStatut(null);
      setPhase('statut');
    }
  }, [p.profil]);
  React.useEffect(() => {
    if (!debut && phase !== 'fin') {
      vider();
      setPhase('fin');
    }
  }, [debut]);
  const accueilGuide = o === '1' && debut && phase !== 'fin',
    enIntro = phase === 'intro' || phase === 'vol';
  React.useEffect(() => {
    const el = fil.current;
    if (!el) return;
    if (debut) {
      el.scrollTop = 0;
      return;
    }
    el.scrollTop = el.scrollHeight;
    const r = setTimeout(() => {
      el.scrollTop = el.scrollHeight;
    }, 120);
    return () => clearTimeout(r);
  }, [messages, ecrit, creneaux, suggestions]);
  React.useEffect(() => {
    const k = e => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', k);
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.removeEventListener('keydown', k) : undefined;
  }, []);
  const dernier = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === 'agent' || messages[i].type) return i;
    return -1;
  })();
  const sombre = o === '2',
    sep = o === '3';
  const btn = {
    height: '36px',
    border: 0,
    borderRadius: '10px',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    fontSize: '12.5px',
    fontWeight: 600
  };
  const tete = <header style={{
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: sep ? '10px 10px 10px 14px' : '16px 14px 8px 24px',
    ...(sep ? {
      background: MAR,
      borderRadius: '18px',
      boxShadow: '0 20px 40px -24px rgba(12,33,71,.6)'
    } : {})
  }}>
    <span ref={avTete} style={{
      position: 'relative',
      flex: 'none',
      opacity: o === '1' && enIntro && debut ? 0 : 1
    }}>{o === '1' ? <img src={avatar} alt="" style={{
        width: '42px',
        height: '42px',
        borderRadius: '11px',
        objectFit: 'cover',
        display: 'block'
      }} /> : <CP_PARTS.Portrait src={avatar} t={sep ? 34 : 30} anneau={sep || sombre} />}<span aria-hidden="true" style={{
        position: 'absolute',
        right: o === '1' ? '-3px' : '-1px',
        bottom: o === '1' ? '-3px' : '-1px',
        width: '9px',
        height: '9px',
        borderRadius: '50%',
        background: '#3FB37F',
        boxShadow: '0 0 0 2px ' + (sep || sombre ? MAR : '#fff')
      }} /></span>
    {o === '1' ? <span className="co-txt" style={{
      opacity: phase === 'intro' && debut ? 0 : 1,
      flex: 1,
      minWidth: 0,
      fontSize: '12.75px',
      fontWeight: 600,
      color: MAR,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }}>Cléo - Gestionnaire IA</span> : <span style={{
      flex: 1,
      minWidth: 0,
      display: 'grid'
    }}><span style={{
        fontSize: '14px',
        fontWeight: 700,
        color: sep || sombre ? '#fff' : MAR
      }}>Cléo</span><span style={{
        fontSize: '11.5px',
        color: sep || sombre ? '#B5C7DF' : T.doux
      }}>Agent IA · en ligne</span></span>}
    <button type="button" className="co-b" onClick={onClose} aria-label="Fermer la conversation" style={{
      ...btn,
      width: '36px',
      color: sep || sombre ? '#fff' : MAR
    }}><Icon name="x" size={18} color="currentColor" /></button></header>;
  const barre = !debut && <div style={{
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    margin: sep ? '0' : '4px 24px 0',
    padding: sep ? '12px 16px 10px 18px' : '8px 0',
    borderBottom: T.filet
  }}>
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: 0,
      fontSize: '12.5px'
    }}><span style={SUR(T.sur)}>Sujet</span><span style={{
        fontWeight: 600,
        color: T.txt,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>{sujet || 'Votre question'}</span></span>
    <button type="button" className="co-b" onClick={onRecommencer} style={{
      ...btn,
      height: '32px',
      padding: '0 8px',
      color: sombre ? '#B5D4F7' : '#3767A2',
      whiteSpace: 'nowrap'
    }}><Icon name="refresh-cw" size={13} color="currentColor" />Nouveau sujet</button></div>;
  const intro = <div onClick={passer} style={{
    minHeight: '100%',
    boxSizing: 'border-box',
    display: 'grid',
    alignContent: 'center',
    justifyItems: 'center',
    gap: '18px',
    padding: '8px 32px 56px',
    textAlign: 'center',
    cursor: phase === 'intro' ? 'pointer' : 'default'
  }}>
    <span ref={avIntro} className="co-pop" style={{
      position: 'relative',
      display: 'block',
      width: '88px',
      height: '88px',
      borderRadius: '22px',
      transformOrigin: '0 0',
      zIndex: 2
    }}>
      <img src={avatar} alt="" style={{
        width: '100%',
        height: '100%',
        borderRadius: 'inherit',
        objectFit: 'cover',
        display: 'block',
        boxShadow: '0 18px 36px -18px rgba(12,33,71,.55)'
      }} />{phase === 'intro' && <span className="co-halo" aria-hidden="true" />}</span>
    <div className="co-txt" style={{
      display: 'grid',
      justifyItems: 'center',
      gap: '14px',
      opacity: phase === 'vol' ? 0 : 1
    }}>
      <div className="co-in" style={{
        display: 'grid',
        gap: '4px',
        animationDelay: '280ms'
      }}><span style={{
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: MAR
        }}>Cléo</span><span style={{
          ...SUR('#3767A2'),
          fontSize: '10.5px'
        }}>Gestionnaire IA</span></div>
      <div style={{
        minHeight: '44px',
        display: 'grid',
        placeItems: 'center'
      }}>{mot ? <p className="co-in" style={{
          margin: 0,
          maxWidth: '30ch',
          fontSize: '14px',
          lineHeight: 1.55,
          color: '#3B4C64',
          textWrap: 'balance'
        }}>Bonjour, je suis Cléo et je suis heureux de discuter avec vous aujourd’hui.</p> : <span className="co-in" role="status" aria-label="Cléo écrit" style={{
          display: 'inline-flex',
          gap: '4px',
          padding: '10px 12px',
          borderRadius: '14px',
          background: '#F1F5FA',
          animationDelay: '620ms'
        }}>{[0, 1, 2].map(k => <span key={k} className="cp-point" style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#7F94B2',
            animationDelay: k * .15 + 's'
          }} />)}</span>}</div>
      <button type="button" className="co-passer co-in" onClick={e => {
        e.stopPropagation();
        passer();
      }} style={{
        border: 0,
        background: 'transparent',
        padding: '6px 8px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '11px',
        fontWeight: 600,
        color: '#5A6B82',
        animationDelay: '900ms'
      }}>Passer l’introduction</button></div></div>;
  const questionStatut = <div style={{
    display: 'grid',
    gap: '24px',
    padding: '12px 24px 24px'
  }}>
    <div className="co-in" style={{
      display: 'grid',
      gap: '8px'
    }}>
      <h2 id="co-statut-q" style={{
        margin: 0,
        fontSize: '17.5px',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1.25,
        color: MAR,
        textWrap: 'balance'
      }}>Afin de bien vous guider, quel est votre statut chez Lease Lane?</h2></div>
    <div role="group" aria-labelledby="co-statut-q" className="co-grp" style={{
      display: 'grid'
    }}>
      {STATUTS.map(([k, lib, ic], i) => <button key={k} ref={i === 0 ? premier : undefined} type="button" className="co-l co-in" onClick={() => choisir(k)} aria-pressed={statut === k} style={{
        ...LIGNE,
        borderTop: T.filet,
        animationDelay: 140 + i * 55 + 'ms'
      }}>
        <span style={{
          fontSize: '12.75px',
          fontWeight: 600,
          color: MAR
        }}>{lib}</span><Carre ic={ic} /></button>)}</div></div>;
  const fil_ = <div ref={fil} className="cp-fil" aria-live="polite" style={{
    flex: 1,
    overflowY: accueilGuide && enIntro ? 'visible' : 'auto',
    minHeight: 0
  }}>
    {debut ? accueilGuide ? enIntro ? intro : questionStatut : <Accueil o={o} T={T} avatar={avatar} actions={actions} onAction={onAction} urgence={urgence} onHumain={onHumain} statut={o === '1' ? statut : null} onModifier={() => setPhase('statut')} faq={p.faq || []} onFaq={p.onFaq} /> : <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      padding: o === '3' ? '20px 18px 14px' : '22px 24px 16px'
    }}>
      {messages.map((m, i) => {
        const prec = messages[i - 1],
          agent = m.role === 'agent' || !!m.type,
          tete = agent && !(prec && (prec.role === 'agent' || prec.type));
        const bulle = agent ? T.bulleA : T.bulleC;
        const contenu = m.type === 'logements' ? <CP_PARTS.Logements items={m.items} onLogement={onLogement} /> : m.type === 'formulaire' && CleoFormulaire ? <CleoFormulaire {...m} /> : m.type === 'resume' ? <CP_PARTS.Resume {...m} /> : m.type === 'humain' ? <CP_PARTS.Humain {...m} /> : <div style={{
          fontSize: '13.5px',
          lineHeight: 1.6,
          color: agent ? T.txt : bulle.color,
          ...(bulle ? {
            padding: '10px 14px',
            borderRadius: agent ? '4px 16px 16px 16px' : '16px 16px 4px 16px',
            background: bulle.background,
            color: bulle.color
          } : {})
        }}>{agent ? <Markdown texte={m.texte} /> : m.texte}</div>;
        return <div key={i} className="cp-msg" style={{
          display: 'grid',
          gap: '6px',
          alignSelf: agent ? 'stretch' : 'flex-end',
          maxWidth: agent ? m.type || !bulle ? '100%' : '88%' : '82%',
          marginTop: tete && i ? '14px' : 0
        }}>
          {tete && <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}><CP_PARTS.Portrait src={avatar} t={20} /><span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: T.txt
            }}>Cléo</span></span>}
          <div style={{
            justifySelf: agent ? 'start' : 'end',
            width: m.type ? '100%' : undefined
          }}>{contenu}</div>
          {i === dernier && !ecrit && suggestions.length > 0 && <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '4px'
          }}>{suggestions.map(s => <button key={s} type="button" className="cp-puce cp-sugg" onClick={() => onSuggestion && onSuggestion(s)} style={{
              minHeight: '36px',
              padding: '0 14px',
              borderRadius: '10px',
              border: '1px solid var(--marine-900)',
              background: 'var(--marine-900)',
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '12.5px',
              fontWeight: 600
            }}>{s}</button>)}</div>}
        </div>;
      })}
      {creneaux.length > 0 && <div className="cp-msg"><CP_PARTS.Creneaux creneaux={creneaux} onCreneau={onCreneau} /></div>}
      {ecrit && <div className="cp-msg" role="status" aria-label="Cléo écrit" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        alignSelf: 'flex-start',
        marginTop: '6px'
      }}><CP_PARTS.Portrait src={avatar} t={20} /><span style={{
          display: 'inline-flex',
          gap: '4px',
          padding: '10px 12px',
          borderRadius: '14px',
          background: sombre ? 'rgba(255,255,255,.08)' : '#F1F5FA'
        }}>{[0, 1, 2].map(k => <span key={k} className="cp-point" style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: sombre ? '#B5D4F7' : '#7F94B2',
            animationDelay: k * .15 + 's'
          }} />)}</span></div>}
    </div>}</div>;
  const saisieF = <form inert={accueilGuide && enIntro ? true : undefined} aria-hidden={accueilGuide && enIntro ? true : undefined} onSubmit={e => {
    e.preventDefault();
    if (peut) onEnvoi && onEnvoi();
  }} style={{
    flex: 'none',
    display: 'grid',
    gap: '8px',
    opacity: accueilGuide && enIntro ? 0 : 1,
    transform: accueilGuide && enIntro ? 'translateY(8px)' : 'none',
    transition: 'opacity 320ms ease,transform 420ms cubic-bezier(.22,1,.36,1)',
    padding: sep ? '10px' : (o === '1' ? '42px' : '50px') + ' 24px 16px',
    ...(sep ? {
      background: '#fff',
      borderRadius: '18px',
      boxShadow: '0 20px 40px -24px rgba(12,33,71,.45),0 0 0 1px rgba(12,33,71,.06)'
    } : {})
  }}>
    <div className="co-saisie" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      minHeight: o === '1' ? '42px' : '50px',
      padding: o === '1' ? '6px 6px' : '5px 5px 5px 8px',
      borderRadius: o === '1' ? '999px' : '14px',
      ...T.champ,
      background: o === '1' ? 'var(--bleu-025)' : T.champ.background,
      transition: 'box-shadow 180ms'
    }}>
      <button type="button" aria-label="Joindre une photo" title="Joindre une photo" style={{
        width: o === '1' ? '29px' : '38px',
        height: o === '1' ? '29px' : '38px',
        flex: 'none',
        border: 0,
        borderRadius: o === '1' ? '8px' : '50%',
        background: o === '1' ? MAR : 'transparent',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center'
      }}><Icon name="paperclip" size={o === '1' ? 13 : 17} color={o === '1' ? '#fff' : sombre ? '#B5C7DF' : '#7A8BA3'} /></button>
      <input ref={champ} value={saisie} onChange={e => onSaisie && onSaisie(e.target.value)} placeholder={debut ? 'Écrivez votre question…' : 'Écrivez à Cléo…'} aria-label="Message à Cléo" style={{
        flex: 1,
        minWidth: 0,
        height: o === '1' ? '30px' : '40px',
        border: 0,
        outline: 0,
        background: 'transparent',
        fontFamily: 'inherit',
        fontSize: o === '1' ? '12px' : '14px',
        color: T.txt
      }} />
      <button type="submit" aria-label="Envoyer" disabled={!peut} style={{
        width: o === '1' ? '29px' : '40px',
        height: o === '1' ? '29px' : '40px',
        flex: 'none',
        border: 0,
        borderRadius: o === '1' ? '8px' : '11px',
        background: o === '1' ? MAR : peut ? T.envoi : sombre ? 'rgba(255,255,255,.1)' : '#E4EBF4',
        cursor: peut ? 'pointer' : 'default',
        display: 'grid',
        placeItems: 'center',
        transition: 'background-color 180ms'
      }}><Icon name="send" size={o === '1' ? 13 : 16} color={o === '1' ? '#fff' : peut ? '#fff' : sombre ? '#7F94B2' : '#8A9BB2'} /></button></div>
    {o === '1' ? <span style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      padding: '0 4px',
      marginTop: '2px',
      transform: 'translateY(15%)'
    }}><a href="/cleo" className="co-lien" style={{
        fontSize: '8.8px',
        fontWeight: 600,
        color: '#3767A2',
        textDecoration: 'none'
      }}>Qui est Cléo?</a><a href="/confidentialite" className="co-lien" style={{
        fontSize: '8.8px',
        fontWeight: 600,
        color: '#3767A2',
        textDecoration: 'none'
      }}>Confidentialité & vie privée</a></span> : <span style={{
      textAlign: 'center',
      fontSize: '11px',
      color: sombre ? '#9FB4D1' : '#5A6B82'
    }}>Agent IA · échanges conservés pour le suivi</span>}</form>;
  if (sep) return <section className="cp-panneau co-3" role="dialog" aria-label="Conversation avec Cléo" style={{
    width: '400px',
    height: 'min(660px,calc(100vh - 196px))',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontFamily: 'var(--police-corps)'
  }}>
    {tete}<div style={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      borderRadius: '22px',
      overflow: 'hidden',
      boxShadow: '0 30px 60px -30px rgba(12,33,71,.5),0 0 0 1px rgba(12,33,71,.06)'
    }}>{barre}{fil_}</div>{saisieF}</section>;
  return <section className={'cp-panneau co-' + o} role="dialog" aria-label="Conversation avec Cléo" style={{
    width: o === '1' ? '420px' : '400px',
    height: 'min(660px,calc(100vh - 196px))',
    display: 'flex',
    flexDirection: 'column',
    background: T.fond,
    borderRadius: o === '1' ? '28px' : '24px',
    overflow: 'hidden',
    boxShadow: o === '1' ? '0 40px 90px -36px rgba(12,33,71,.45),0 0 0 1px rgba(12,33,71,.06)' : '0 40px 80px -30px rgba(4,12,28,.7)',
    fontFamily: 'var(--police-corps)'
  }}>
    {tete}{barre}{fil_}{saisieF}</section>;
}

/* Option 1 « Épuré » retenue : bascule de revue retirée. */
function CleoPanneauOptions(props) {
  return <React.Fragment><style>{CP_PARTS.CP_CSS + CO_CSS}</style><Panneau o="1" {...props} /></React.Fragment>;
}
export { CleoPanneauOptions as CleoPanneau };
