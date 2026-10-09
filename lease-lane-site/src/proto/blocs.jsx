/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/blocs.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon, Button, Badge, Overline, Input, Select, Checkbox } from '@/components/ds';
import { ouvrirCleo } from '@/proto/seo';
import { naviguer } from '@/lib/routeur';
import { PBHeros } from '@/proto/pages-proprio-b';
import { Section } from '@/proto/accueil';
import { LL_FAQ } from '@/proto/faq';
import { LL_SITE } from '@/proto/routes';
import { FormOffreP } from '@/proto/forms-principal';
import { __ssr } from '@/lib/hydratation';

/* Blocs partagés des pages de la feuille de route. Texte entre crochets = gabarit (souligné pointillé).
   Chiffres non validés = valeurs d'exemple, toujours accompagnées de la pastille « Exemple ». */
const CONT = {
  maxWidth: 'var(--web-conteneur)',
  margin: '0 auto',
  padding: '0 var(--web-gouttiere)'
};
const FILET = '1px solid var(--bordure-fine)';
function gab(t) {
  if (typeof t !== 'string') return t;
  return t.split(/(\[[^\]]+\]|\{[^}]+\})/g).map((s, i) => s.startsWith('[') && s.endsWith(']') ? <span key={i} className="ll-gabarit">{s}</span> : s.startsWith('{') && s.endsWith('}') ? <span key={i} className="ll-bleu">{s.slice(1, -1)}</span> : s);
}
const Exemple = ({
  style
}) => <Badge ton="alerte" taille="s" style={style}>Exemple</Badge>;
/* Lien fléché du kit : la flèche file et revient au survol. */
const FL_TRAIT = <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const Fleche = ({
  to,
  children,
  clair
}) => <a href={to} className={'ll-lien' + (clair ? ' ll-lien-clair' : '')}><span>{children}</span><span className="ll-fl-ar" aria-hidden="true"><i>{FL_TRAIT}</i><i>{FL_TRAIT}</i></span></a>;
const BoutonLien = ({
  to,
  variant = 'primaire',
  size = 'l',
  children,
  icone = true,
  onClick
}) => <Button variant={variant} size={size} onClick={onClick || (() => to === '#cleo' ? ouvrirCleo() : naviguer(to))} iconeApres={icone ? <Icon name="arrow-right" size={size === 'l' ? 17 : 15} /> : undefined}>{children}</Button>;
function FilAriane({
  fil,
  clair
}) {
  return <nav aria-label="Fil d'Ariane"><ol style={{
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      fontSize: '13px'
    }}>
    {fil.map(([n, p], i) => {
        const der = i === fil.length - 1;
        return <li key={p} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
        {i > 0 && <Icon name="chevron-right" size={13} color={clair ? 'var(--bleu-300)' : 'var(--gris-400)'} />}
        {der ? <span aria-current="page" style={{
            color: clair ? '#fff' : 'var(--marine-900)',
            fontWeight: 500
          }}>{n}</span> : <a href={p} style={{
            color: clair ? 'var(--bleu-200)' : 'var(--texte-discret)',
            textDecoration: 'none'
          }}>{n}</a>}</li>;
      })}</ol></nav>;
}

/* Sol quadrillé en perspective de l'accueil (point de fuite central, cases carrées au premier plan, fondu vers le haut). Placer dans un parent isolation:isolate. */
const SOL_HZ = -40,
  SOL_S = 29.4,
  SOL_D = .0518,
  SOL_ZM = 12,
  SOL_V = Array.from({
    length: 119
  }, (_, k) => (k - 59) * SOL_S),
  SOL_H = (() => {
    const o = [];
    for (let z = 1; z <= SOL_ZM; z += SOL_D * z) o.push(SOL_HZ + (600 - SOL_HZ) / z);
    return o;
  })();
const LLSol = ({
  sombre,
  h = '72%'
}) => {
  const r = (((__ssr() ? "undefined" : typeof location) !== "undefined" ? location.hash : undefined) || "/").replace(/^#/, '').split('?')[0];
  if (!undefined && r !== '/' && r !== '/gestion-immobiliere') return null;
  return <LLSolB sombre={sombre} h={h} />;
};
const LLSolB = ({
  sombre,
  h
}) => <div aria-hidden="true" style={{
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: h,
  zIndex: -1,
  pointerEvents: 'none',
  WebkitMaskImage: 'linear-gradient(to top,#000 0%,rgba(0,0,0,.55) 40%,transparent 100%)',
  maskImage: 'linear-gradient(to top,#000 0%,rgba(0,0,0,.55) 40%,transparent 100%)'
}}>
  <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" width="100%" height="100%" style={{
    display: 'block'
  }}><g stroke={sombre ? 'rgba(181,212,247,.1)' : 'rgba(69,129,203,.16)'} strokeWidth="1" fill="none">
    {SOL_V.map(dx => <line key={'v' + dx} x1={500 + dx / SOL_ZM} y1={SOL_HZ + (600 - SOL_HZ) / SOL_ZM} x2={500 + dx} y2="600" vectorEffect="non-scaling-stroke" />)}
    {SOL_H.map((y, i) => <line key={'h' + i} x1="-2000" y1={y} x2="3000" y2={y} vectorEffect="non-scaling-stroke" />)}</g></svg></div>;
const BORD_M = '1px solid rgba(12,33,71,.16)';

/* Bannière des pages intérieures : modèle Gestion d'immeubles (PBHeros), avec colonne de droite facultative. */
function BandeauPage({
  route,
  surtitre,
  titre,
  lead,
  actions,
  aside,
  compact,
  children
}) {
  if (typeof PBHeros !== 'undefined') return <PBHeros route={route} surtitre={surtitre} titre={titre} lead={lead} actions={actions} aside={aside} compact={compact}>{children}</PBHeros>;
  return <section className="ll-grille ll-sombre" style={{
    position: 'relative',
    background: 'var(--degrade-marine)',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'var(--lueur-bleue)',
      pointerEvents: 'none'
    }} />
    <div style={{
      ...CONT,
      position: 'relative',
      padding: (compact ? '48px' : '64px') + ' var(--web-gouttiere) ' + (compact ? '48px' : '64px')
    }}>
      <FilAriane fil={route.fil} clair />
      <div className="ll-bandeau-grille" style={{
        display: 'grid',
        gridTemplateColumns: aside ? 'minmax(0,1.25fr) minmax(0,1fr)' : 'minmax(0,1fr)',
        gap: '64px',
        alignItems: 'center',
        marginTop: 'var(--esp-8)'
      }}>
        <div>
          
          <h1 style={{
            color: '#fff',
            fontSize: compact ? 'clamp(30px,3vw,42px)' : 'clamp(34px,3.6vw,54px)',
            marginTop: 0,
            maxWidth: '20ch',
            textWrap: 'balance'
          }}>{gab(titre)}</h1>
          {lead && <p style={{
            color: 'var(--bleu-100)',
            fontSize: '12px',
            lineHeight: 1.65,
            marginTop: '16px',
            maxWidth: '64ch'
          }}>{gab(lead)}</p>}
          {actions && <div style={{
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
            marginTop: '32px'
          }}>{actions}</div>}
          {children}
        </div>
        {aside && <div>{aside}</div>}
      </div>
    </div>
  </section>;
}
function TitreBloc({
  surtitre,
  lead,
  titre,
  texte,
  action,
  centre,
  marge,
  clair
}) {
  return <div style={{
    display: 'grid',
    justifyItems: centre ? 'center' : 'start',
    textAlign: centre ? 'center' : 'left',
    marginBottom: marge === 0 ? 0 : 'var(--tete-contenu)'
  }}>
    <div style={{
      maxWidth: '64ch'
    }}>
      {surtitre && <Overline ton={clair ? 'marine' : undefined}>{surtitre}</Overline>}
      <h2 style={{
        fontSize: 'var(--titre-l)',
        marginTop: surtitre ? '12px' : 0,
        color: clair ? '#fff' : undefined,
        textWrap: 'balance'
      }}>
        {lead && <span style={{
          fontWeight: 500,
          letterSpacing: '-0.01em'
        }}>{lead}{'\u00A0'}</span>}{gab(titre)}</h2>
      {texte && <p style={{
        fontSize: '14px',
        lineHeight: 1.65,
        marginTop: '16px',
        color: clair ? 'var(--bleu-100)' : undefined
      }}>{gab(texte)}</p>}
    </div>
    {action && <div style={{
      marginTop: 'var(--esp-6)'
    }}>{action}</div>}
  </div>;
}

/* ——— Accueil : double choix sous le héros ——— */

/* ——— Bande de preuves : trois indicateurs datés ——— */
/* Option 2b « Tableau vivant » (approuvée) : bande marine, une visualisation par indicateur. Valeurs d'exemple. */

/* Option 15b « Chiffre vedette » (approuvée) : Cléo en grand sur marine, les deux autres indicateurs empilés. Valeurs d'exemple. */
const PREUVES_B = [{
  v: '0',
  u: 'secondes',
  l: 'Délai de réponse',
  d: '',
  p: 1,
  ic: 'message-circle'
}, {
  v: '17',
  u: 'jours',
  l: 'Délai de location',
  d: '',
  p: 17 / 30,
  ic: 'key-round'
}, {
  v: '98,6',
  u: '%',
  l: 'Taux d\u2019occupation',
  d: '',
  p: .986,
  ic: 'building-2'
}];
const ChiffrePreuve = ({
  x,
  t,
  c = 'var(--marine-900)',
  cu = 'var(--bleu-600)'
}) => <span style={{
  fontWeight: 700,
  fontSize: t,
  letterSpacing: '-0.04em',
  lineHeight: .95,
  color: c,
  fontVariantNumeric: 'tabular-nums'
}}>{x.v}<span style={{
    fontWeight: 600,
    fontSize: '.4em',
    letterSpacing: 0,
    marginLeft: '8px',
    color: cu
  }}>{x.u}</span></span>;
const BarrePreuve = ({
  p,
  clair
}) => <div aria-hidden="true" style={{
  height: '10px',
  borderRadius: '999px',
  background: clair ? 'var(--bleu-025)' : 'rgba(255,255,255,.14)',
  overflow: 'hidden'
}}><div style={{
    width: p * 100 + '%',
    height: '100%',
    borderRadius: '999px',
    background: clair ? 'var(--bleu-500)' : 'var(--bleu-300)'
  }}></div></div>;
function Preuves() {
  return <div data-ll-exemple="1"><PreuvesBase /></div>;
}
function PreuvesBase() {
  const [a, b, c] = PREUVES_B;
  const Petite = ({
    x
  }) => <article style={{
    borderRadius: '24px',
    background: '#fff',
    border: '1px solid var(--bordure-fine)',
    padding: '32px',
    display: 'grid',
    gap: '20px',
    alignContent: 'space-between'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '16px'
    }}><ChiffrePreuve x={x} t="clamp(48px,4.4vw,64px)" /><span aria-hidden="true" style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'var(--bleu-025)',
        display: 'grid',
        placeItems: 'center',
        flex: 'none'
      }}><Icon name={x.ic} size={20} color="var(--bleu-600)" /></span></div>
    <div style={{
      display: 'grid',
      gap: '12px'
    }}><BarrePreuve p={x.p} clair /><span style={{
        display: 'grid',
        gap: '2px'
      }}><span style={{
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--marine-900)'
        }}>{x.l}</span><span style={{
          fontSize: '14px',
          color: 'var(--gris-700)'
        }}>{x.d}</span></span></div></article>;
  return <section style={{
    background: 'var(--bleu-025)'
  }}>
    <div style={{
      ...CONT,
      padding: 'var(--web-section) var(--web-gouttiere)'
    }}>
      <h2 style={{
        margin: '0 0 48px',
        fontSize: 'var(--titre-l)',
        lineHeight: 1.265,
        letterSpacing: '-0.03em',
        fontWeight: 700,
        color: 'var(--marine-900)',
        textWrap: 'balance'
      }}>Une gestion d’immeuble automatisée aura nécessairement <span style={{
          color: 'var(--bleu-600)'
        }}>des chiffres qui vont impressionner</span>.</h2>
      <div className="ll-preuves-b" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,1fr)',
        gap: '20px'
      }}>
        <article style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '24px',
          background: 'var(--degrade-marine)',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '48px',
          minHeight: '440px'
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(70% 70% at 90% 0%,rgba(91,154,232,.3),transparent 60%)'
          }}></div>
          <span style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff'
          }}><img src="/assets/img/cleo-avatar.png" alt="" style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              objectFit: 'cover'
            }} />Cléo, 24 heures sur 24</span>
          <div style={{
            position: 'relative',
            display: 'grid',
            gap: '28px'
          }}>
            <ChiffrePreuve x={a} t="clamp(96px,10vw,152px)" c="#fff" cu="var(--bleu-300)" />
            <div style={{
              display: 'grid',
              gap: '10px'
            }}><BarrePreuve p={a.p} /><div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--bleu-200)'
              }}><span>{a.ech}</span></div></div>
            <span style={{
              display: 'grid',
              gap: '4px'
            }}><span style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff'
              }}>{a.l}</span><span style={{
                fontSize: '14px',
                color: 'var(--bleu-100)'
              }}>{a.d}</span></span></div></article>
        <div style={{
          display: 'grid',
          gap: '20px'
        }}><Petite x={b} /><Petite x={c} /></div>
      </div>
    </div>
  </section>;
}

/* ——— L'offre en quatre volets, titrés par résultat ——— */

/* ——— Processus en étapes ——— */

/* ——— Témoignages : nom, type d'immeuble, résultat ——— */

/* S5 : témoignages et chiffres d'exemple visibles en revue seulement (data-ll-exemple, interrupteur de la barre de revue). */

/* ——— FAQ : réponses présentes dans le HTML dès le chargement (balises details) ——— */
function FAQItem({
  id,
  ouvert
}) {
  const f = LL_FAQ[id];
  return <details className="ll-faq-item" open={ouvert} data-faq={id}>
    <summary><span>{f.q}</span><span className="ll-plus" aria-hidden="true"><Icon name="plus" size={18} color="var(--bleu-600)" /></span></summary>
    <p>{gab(f.r)}</p></details>;
}
function FAQListe({
  ids,
  surtitre = 'Questions fréquentes',
  titre = 'Vos questions, {nos réponses directes}.',
  texte,
  fond
}) {
  return <Section fond={fond}>
    <div className="ll-faq-grille" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr)',
      gap: '64px',
      alignItems: 'start'
    }}>
      <div style={{
        position: 'sticky',
        top: '132px'
      }}>
        <Overline>{surtitre}</Overline>
        <h2 style={{
          fontSize: 'var(--titre-l)',
          marginTop: '12px',
          textWrap: 'balance'
        }}>{gab(titre)}</h2>
        <p style={{
          fontSize: '14px',
          marginTop: '16px'
        }}>{texte || 'Ces réponses viennent des questions posées à Cléo. Notre équipe les valide avant leur publication et les date.'}</p>
        <div style={{
          display: 'flex',
          gap: '18px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: 'var(--esp-8)'
        }}>
          <Button variant="secondaire" size="m" onClick={() => ouvrirCleo()} iconeAvant={<Icon name="message-square" size={15} />}>Poser la question à Cléo</Button>
          <Fleche to="/faq">Toutes les questions</Fleche></div>
      </div>
      <div style={{
        borderTop: FILET
      }}>{ids.map((id, i) => <FAQItem key={id} id={id} ouvert={i === 0} />)}</div>
    </div>
  </Section>;
}

/* ——— Bandeau final ——— */
function AppelFinal({
  surtitre = 'Prochaine étape',
  titre = 'Une offre claire pour votre immeuble, {en deux minutes}.',
  texte = 'Décrivez votre immeuble : nous revenons avec une offre écrite et un moment pour en parler.',
  bouton = 'Obtenir une offre de service',
  to = '/offre-de-service',
  secondaire,
  to2,
  marine
}) {
  /* Une seule bande marine par page : l'accueil la porte ici (marine), les pages intérieures l'ont déjà en tête. */
  /* Pages intérieures : fond blanc et sol quadrillé clair de l'accueil, juste avant le pied marine. */
  return <section className={marine ? 'll-sombre' : undefined} style={{
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
    background: marine ? 'var(--degrade-marine)' : '#fff',
    borderTop: marine ? 0 : FILET
  }}>
    {marine && <div className="ll-grille" style={{
      position: 'absolute',
      inset: 0
    }} />}{marine && <div style={{
      position: 'absolute',
      inset: 0,
      background: 'var(--lueur-bleue)'
    }} />}<LLSol sombre={marine} />
    <div style={{
      ...CONT,
      position: 'relative',
      padding: 'var(--web-section) var(--web-gouttiere)',
      display: 'grid',
      gridTemplateColumns: marine ? 'minmax(0,1fr) auto' : 'minmax(0,7fr) minmax(0,5fr)',
      alignItems: marine ? 'end' : 'center',
      gap: 'var(--esp-12)'
    }} className="ll-deux">
      <div style={{
        maxWidth: '60ch',
        display: 'grid',
        gap: '0'
      }}><Overline ton={marine ? 'marine' : undefined}>{surtitre}</Overline>
        <h2 style={{
          color: marine ? '#fff' : undefined,
          fontSize: 'var(--titre-xl)',
          maxWidth: '18ch',
          marginTop: '12px',
          textWrap: 'balance'
        }}>{gab(titre)}</h2>
        <p style={{
          color: marine ? 'var(--bleu-100)' : undefined,
          fontSize: '14px',
          marginTop: '16px'
        }}>{texte}</p>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginTop: '32px'
        }}>
        <BoutonLien to={to} variant={marine ? 'inverse' : 'primaire'}>{bouton}</BoutonLien>
        {secondaire && <BoutonLien to={to2} variant={marine ? 'contour_inverse' : 'secondaire'} icone={false}>{secondaire}</BoutonLien>}</div></div>
      {!marine && <AutresVoies />}
    </div>
  </section>;
}
/* Trois autres façons de nous joindre, à côté de l'appel principal : carte blanche à fine bordure marine, rangées fléchées. */
function AutresVoies() {
  const S = LL_SITE,
    tel = String(S.telephone || '');
  const R = ({
    ic,
    t,
    d,
    href,
    onClick,
    fonce
  }) => <a href={href || '#'} onClick={onClick ? e => {
    e.preventDefault();
    onClick();
  } : undefined} className="fn-voie" style={{
    display: 'grid',
    gridTemplateColumns: '44px minmax(0,1fr) 20px',
    gap: '16px',
    alignItems: 'center',
    padding: '16px 18px',
    borderRadius: '14px',
    textDecoration: 'none',
    background: fonce ? 'var(--degrade-marine,#0C2147)' : 'transparent',
    color: fonce ? '#fff' : '#0C2147'
  }}>
    <span aria-hidden="true" style={{
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      display: 'grid',
      placeItems: 'center',
      background: fonce ? 'rgba(255,255,255,.12)' : '#0C2147'
    }}><Icon name={ic} size={19} color="#fff" /></span>
    <span style={{
      display: 'grid',
      gap: '2px'
    }}><span style={{
        fontSize: '15px',
        fontWeight: 700
      }}>{t}</span><span style={{
        fontSize: '13px',
        color: fonce ? 'var(--bleu-100)' : 'var(--texte-discret)'
      }}>{d}</span></span>
    <span aria-hidden="true" className="fn-voie-fl" style={{
      display: 'grid'
    }}><Icon name="arrow-right" size={17} color="currentColor" /></span></a>;
  return <div style={{
    display: 'grid',
    gap: '4px',
    padding: '8px',
    borderRadius: '22px',
    background: '#fff',
    border: BORD_M,
    boxShadow: '0 2px 4px rgba(12,33,71,.04),0 40px 80px -48px rgba(12,33,71,.5)'
  }}>
    <R fonce ic="message-square" t="Écrire à Cléo" d="Réponse immédiate, 24 heures sur 24" onClick={() => ouvrirCleo()} />
    <R ic="phone" t={tel || 'Nous appeler'} d="Une personne de l’équipe, en semaine" href={'tel:' + tel.replace(/\D/g, '')} />
    <R ic="mail" t="Nous joindre" d="Courriel, bureau et heures d’ouverture" href="/nous-joindre" /></div>;
}

/* ——— Cléo en action : un échange type, de la question à la visite réservée ——— */

function CleoEnAction({
  fond = 'blanc',
  surtitre,
  titre = 'De la question à la {visite réservée}, sans attendre le lendemain.',
  texte
}) {
  const etapes = [['22 h 14', 'La question arrive', 'Un prospect écrit un soir de semaine.'], ['22 h 14', 'Disponibilité en temps réel', 'Cléo répond avec le logement, le loyer et la date.'], ['22 h 15', 'Visite réservée', 'Deux créneaux proposés, la visite confirmée par écrit.'], ['Avant la visite', 'Rappels', 'Un rappel 24 h, puis 2 h avant; le gestionnaire reçoit le fil.']];
  return <Section fond={fond}>
    <div className="ll-deux" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: 'var(--esp-16)',
      alignItems: 'stretch'
    }}>
      <div>
        <TitreBloc surtitre={surtitre} titre={titre} texte={texte || 'Cléo est l\u2019agent IA de Lease Lane. Il répond 24/7, en français d\u2019abord, explique les règles du TAL en termes simples et passe la main à une personne dès qu\u2019un dossier le demande.'} marge={20} />
        <MentionJuridique style={{
          marginBottom: '28px'
        }} />
        <ol style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          borderTop: FILET
        }}>{etapes.map(([h, t, d]) => <li key={t} style={{
            display: 'grid',
            gridTemplateColumns: '96px minmax(0,1fr)',
            gap: 'var(--carte-ecart)',
            padding: '16px 0',
            borderBottom: FILET
          }}>
          <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--bleu-600)',
              fontVariantNumeric: 'tabular-nums',
              paddingTop: '2px'
            }}>{h}</span>
          <span><span style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--marine-900)'
              }}>{t}</span><span style={{
                display: 'block',
                fontSize: '14px',
                color: 'var(--texte-discret)'
              }}>{d}</span></span></li>)}</ol>
        <div style={{
          display: 'flex',
          gap: '18px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: 'var(--esp-8)'
        }}>
          <Button variant="primaire" size="l" onClick={() => ouvrirCleo()} iconeAvant={<Icon name="message-square" size={17} />}>Écrire à Cléo</Button>
          <Fleche to="/cleo">Qui est Cléo</Fleche><Exemple /></div>
      </div>
      <figure className="ll-cleo-carte" style={{
        position: 'relative',
        margin: 0,
        width: '100%',
        height: '100%',
        minHeight: 'clamp(380px,38vw,560px)',
        borderRadius: 'var(--rayon-carte)',
        overflow: 'hidden',
        background: 'var(--bleu-025)',
        boxShadow: '0 2px 4px rgba(12,33,71,.05),0 24px 56px rgba(12,33,71,.12)'
      }}>
        <img src="/assets/img/cleo/cleo-hd.jpg" alt="Portrait de Cléo, l'agent IA de Lease Lane" style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: '50% 12%'
        }} />
        <span aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg,rgba(12,33,71,0) 55%,rgba(12,33,71,.5) 100%)'
        }} />
      </figure>
    </div>
  </Section>;
}

/* ——— Cléo, mosaïque (7c) : titre et portrait côte à côte, puis une tuile par tâche ——— */
const TACHES_CLEO = [{
  ic: 'calendar-check',
  t: 'Rendez-vous',
  d: 'Cléo propose deux créneaux, réserve la visite et la confirme par écrit, avec un rappel 24 h et 2 h avant. Un report? Il propose deux nouvelles dates, sans repasser par l\u2019équipe.',
  bg: 'var(--bleu-025)',
  bd: 'var(--bleu-025)',
  pastille: '#fff',
  ico: 'var(--bleu-600)'
}, {
  ic: 'scale',
  t: 'Droit du logement et TAL',
  d: 'Hausse de loyer, avis, cession, reprise : Cléo explique la règle du Code civil et du TAL qui s\u2019applique, avec sa source et ses délais, aux propriétaires comme aux locataires.',
  bg: '#fff',
  bd: 'var(--bordure-fine)',
  pastille: 'var(--bleu-025)',
  ico: 'var(--bleu-600)'
}, {
  ic: 'phone',
  t: 'Mise en contact rapide pour les urgences',
  d: 'Fuite, chauffage, électricité ou serrure : Cléo classe l\u2019urgence, donne la consigne de sécurité et prévient la personne de garde. Il recueille l\u2019adresse et la nature du problème pour que l\u2019intervention commence sans délai.',
  bg: 'var(--urgence-100)',
  bd: 'var(--urgence-100)',
  pastille: '#fff',
  ico: 'var(--urgence-600)'
}, {
  ic: 'share-2',
  t: 'Attribution des demandes & Relances',
  d: 'Chaque demande reçoit un responsable, un délai de réponse et un délai cible. Cléo relance au plus trois fois, entre 8 h et 21 h, et avise le locataire à chaque étape du suivi.',
  bg: 'var(--marine-900)',
  bd: 'var(--marine-900)',
  pastille: 'rgba(255,255,255,.1)',
  ico: 'var(--bleu-300)',
  fonce: true
}];
function CleoMosaique({
  fond = 'douce',
  titre = 'Un modèle de gestion qui repose sur la {fine pointe de la technologie} et qui ne dort jamais la nuit.'
}) {
  return <Section fond={fond}>
    <div className="ll-deux" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: '20px'
    }}>
      <div className="ll-mos-int" style={{
        padding: '48px',
        borderRadius: '24px',
        background: '#fff',
        border: BORD_M,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '40px'
      }}>
        <div style={{
          display: 'grid',
          gap: '20px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(28px,2.6vw,36px)',
            lineHeight: 1.288,
            letterSpacing: '-0.025em',
            fontWeight: 700,
            color: 'var(--marine-900)',
            textWrap: 'balance'
          }}>{gab(titre)}</h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: 1.65,
            color: 'var(--texte-corps)',
            maxWidth: '52ch'
          }}>Cléo est l’agent IA de Lease Lane. Il répond 24/7, en français d’abord, explique les règles du TAL en termes simples et passe la main à une personne dès qu’un dossier le demande.</p>
          <MentionJuridique />
          <p style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'var(--texte-corps)',
            textWrap: 'pretty'
          }}>Il prend les demandes de visite, répond aux questions sur les logements et les services, reçoit les signalements et ouvre les demandes de travaux. Chaque échange est consigné au dossier, pour que l’équipe reprenne là où il s’est arrêté.</p></div>
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <Button variant="primaire" size="l" onClick={() => ouvrirCleo()} iconeAvant={<Icon name="message-square" size={17} />}>Écrire à Cléo</Button>
          <Fleche to="/cleo">Qui est Cléo</Fleche></div></div>
      <figure className="ll-mos-photo" style={{
        margin: 0,
        aspectRatio: '7 / 6',
        borderRadius: '24px',
        overflow: 'hidden',
        background: '#1B3A60'
      }}>
        <img src="/assets/img/cleo/cleo-hd.jpg" alt="Portrait de Cléo, l’agent IA de Lease Lane" style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: '50% 30%',
          display: 'block'
        }} /></figure>
      <ul className="ll-mos-taches" style={{
        gridColumn: '1 / -1',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
        gap: '20px'
      }}>
        {TACHES_CLEO.map(x => <li key={x.t} style={{
          boxSizing: 'border-box',
          padding: '28px',
          borderRadius: '24px',
          background: x.bg,
          border: '1px solid ' + x.bd,
          boxShadow: x.fonce ? '0 2px 4px rgba(12,33,71,.06),0 24px 56px rgba(12,33,71,.14)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <span aria-hidden="true" style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: x.pastille
          }}><Icon name={x.ic} size={22} color={x.ico} /></span>
          <span style={{
            display: 'grid',
            gap: '8px'
          }}><h3 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.015em',
              lineHeight: 1.38,
              color: x.fonce ? '#fff' : 'var(--marine-900)',
              textWrap: 'balance'
            }}>{x.t}</h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.55,
              color: x.fonce ? 'var(--bleu-100)' : 'var(--texte-corps)'
            }}>{x.d}</p></span></li>)}
      </ul>
    </div>
  </Section>;
}

/* ——— Formulaire qualifiant (offre de service) : deux étapes, consentement explicite ——— */
const CRENEAUX_OFFRE = [['Mardi 7 oct.', '10 h 00'], ['Mardi 7 oct.', '14 h 30'], ['Mercredi 8 oct.', '9 h 00'], ['Jeudi 9 oct.', '16 h 00']];
function FormOffre(props) {
  if (!undefined) return <FormOffreP {...props} />;
  return <FormOffreBase {...props} />;
}
function FormOffreBase({
  compact,
  onEtape,
  sansEntete
}) {
  const [etape, setEtape] = React.useState(1),
    [v, setV] = React.useState({
      type: '',
      portes: '',
      secteur: '',
      actuel: '',
      debut: '',
      prenom: '',
      nom: '',
      courriel: '',
      tel: '',
      consent: false
    });
  const [err, setErr] = React.useState({}),
    [rdv, setRdv] = React.useState(null);
  React.useEffect(() => {
    onEtape && onEtape(etape === 3 ? -1 : etape - 1);
  }, [etape]);
  const maj = k => e => setV({
    ...v,
    [k]: e && e.target ? e.target.type === 'checkbox' ? e.target.checked : e.target.value : e
  });
  const valider = () => {
    const e = {};
    if (etape === 1) {
      if (!v.type) e.type = 'Choisissez un type d\u2019immeuble.';
      if (!/^\d+$/.test(v.portes) || +v.portes < 1) e.portes = 'Indiquez un nombre de portes.';
      if (!v.secteur.trim()) e.secteur = 'Indiquez le secteur.';
      if (!v.actuel) e.actuel = 'Répondez oui ou non.';
    } else {
      if (!v.prenom.trim()) e.prenom = 'Indiquez votre prénom.';
      if (!v.nom.trim()) e.nom = 'Indiquez votre nom.';
      if (!/^\S+@\S+\.\S+$/.test(v.courriel)) e.courriel = 'Adresse courriel invalide.';
      if (v.tel.replace(/\D/g, '').length < 10) e.tel = 'Numéro à 10 chiffres.';
      if (!v.consent) e.consent = 'Votre consentement est requis pour traiter la demande.';
    }
    setErr(e);
    return !Object.keys(e).length;
  };
  const suivant = () => {
    if (valider()) setEtape(etape + 1);
  };
  if (etape === 3) return <div style={{
    display: 'grid',
    gap: '18px'
  }} role="status">
    <span style={{
      width: '52px',
      height: '52px',
      borderRadius: '999px',
      background: 'var(--succes-100)',
      display: 'grid',
      placeItems: 'center'
    }}><Icon name="circle-check" size={24} color="var(--succes-600)" /></span>
    <h3 style={{
      fontSize: '24px'
    }}>{rdv ? 'Rendez-vous confirmé' : 'Demande reçue, merci ' + v.prenom + '.'}</h3>
    <p style={{
      margin: 0,
      fontSize: '14px'
    }}>{rdv ? 'Appel de 30 minutes le ' + rdv[0] + ' à ' + rdv[1] + '. Une invitation part à ' + v.courriel + '.' : 'Accusé de réception envoyé à ' + v.courriel + ' · dossier OFF-2026-0187. Choisissez un moment pour l\u2019appel de 30 minutes :'}</p>
    {!rdv && <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
      gap: '10px'
    }}>{CRENEAUX_OFFRE.map(c => <button key={c.join()} onClick={() => setRdv(c)} style={{
        padding: '14px',
        border: FILET,
        borderRadius: 'var(--rayon-3)',
        background: 'var(--gris-000)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--police-corps)'
      }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--bleu-500)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bordure-fine)'}>
      <span style={{
          display: 'block',
          fontSize: '13px',
          color: 'var(--texte-discret)'
        }}>{c[0]}</span><span style={{
          display: 'block',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--marine-900)'
        }}>{c[1]}</span></button>)}</div>}
  </div>;
  const choix = (k, opts) => <div style={{
    display: 'grid',
    gap: '8px'
  }} role="radiogroup" aria-label="Gestionnaire actuel">
    <span style={{
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--marine-900)'
    }}>Avez-vous un gestionnaire actuellement?</span>
    <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    }}>{opts.map(o => <button type="button" key={o} role="radio" aria-checked={v[k] === o} onClick={() => setV({
        ...v,
        [k]: o
      })} style={{
        height: 'var(--web-bouton-h-s)',
        padding: '0 26px',
        borderRadius: 'var(--rayon-bouton)',
        cursor: 'pointer',
        fontFamily: 'var(--police-corps)',
        fontSize: '14.5px',
        fontWeight: 550,
        letterSpacing: 0,
        border: '1px solid ' + (v[k] === o ? 'var(--marine-900)' : 'var(--gris-300)'),
        background: v[k] === o ? 'var(--marine-900)' : 'var(--gris-000)',
        color: v[k] === o ? '#fff' : 'var(--marine-900)'
      }}>{o}</button>)}</div>
    {err[k] && <span style={{
      fontSize: '13px',
      color: 'var(--urgence-600)'
    }}>{err[k]}</span>}</div>;
  return <form onSubmit={e => {
    e.preventDefault();
    etape === 1 ? suivant() : valider() && setEtape(3);
  }} noValidate style={{
    display: 'grid',
    gap: '22px'
  }}>
    {sansEntete ? <h2 style={{
      margin: 0,
      fontSize: '24px',
      letterSpacing: '-0.02em',
      color: 'var(--marine-900)'
    }}>{etape === 1 ? 'Votre immeuble' : 'Vos coordonnées'}</h2> : <div style={{
      display: 'grid',
      gap: '10px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '13px'
      }}><span style={{
          fontWeight: 600,
          color: 'var(--marine-900)'
        }}>{etape === 1 ? 'Votre immeuble' : 'Vos coordonnées'}</span><span style={{
          color: 'var(--texte-discret)'
        }}>Étape {etape} sur 2</span></div>
      <div style={{
        height: '4px',
        borderRadius: '999px',
        background: 'var(--gris-100)'
      }}><div style={{
          width: etape * 50 + '%',
          height: '100%',
          borderRadius: '999px',
          background: 'var(--bleu-500)',
          transition: 'width var(--duree-3) var(--courbe-sortie)'
        }} /></div></div>}
    {etape === 1 ? <div className="ll-champs" style={{
      display: 'grid',
      gridTemplateColumns: compact ? '1fr' : 'repeat(2,minmax(0,1fr))',
      gap: '18px 20px'
    }}>
        <Select label="Type d'immeuble" value={v.type} onChange={maj('type')} options={[{
        value: '',
        label: 'Choisir'
      }, 'Plex de 2 à 5 logements', 'Immeuble de 6 à 11 logements', 'Immeuble de 12 logements et plus', 'Plusieurs immeubles', 'Maison ou condo locatif']} aide={err.type || '[Types à confirmer]'} />
        <Input label="Nombre de portes" inputMode="numeric" placeholder="6" value={v.portes} onChange={maj('portes')} erreur={err.portes} />
        <Input label="Secteur" placeholder="Quartier ou ville" value={v.secteur} onChange={maj('secteur')} erreur={err.secteur} />
        <Select label="Date de début souhaitée" value={v.debut} onChange={maj('debut')} options={['Dès que possible', 'D\u2019ici un mois', 'D\u2019ici trois mois', 'Plus tard']} />
        <div style={{
        gridColumn: '1 / -1'
      }}>{choix('actuel', ['Oui', 'Non, je gère moi-même'])}</div>
      </div> : <div className="ll-champs" style={{
      display: 'grid',
      gridTemplateColumns: compact ? '1fr' : 'repeat(2,minmax(0,1fr))',
      gap: '18px 20px'
    }}>
        <Input label="Prénom" autoComplete="given-name" value={v.prenom} onChange={maj('prenom')} erreur={err.prenom} />
        <Input label="Nom" autoComplete="family-name" value={v.nom} onChange={maj('nom')} erreur={err.nom} />
        <Input label="Courriel" type="email" autoComplete="email" value={v.courriel} onChange={maj('courriel')} erreur={err.courriel} />
        <Input label="Téléphone" type="tel" autoComplete="tel" placeholder="418 555-0123" value={v.tel} onChange={maj('tel')} erreur={err.tel} />
        <div style={{
        gridColumn: '1 / -1',
        display: 'grid',
        gap: '6px'
      }}>
          <Checkbox checked={v.consent} onChange={maj('consent')} label="J'accepte que Lease Lane utilise ces renseignements pour préparer une offre et me joindre à ce sujet." description={<span>Aucune autre utilisation. Vous pouvez retirer votre consentement en tout temps. <a href="/confidentialite">Politique de confidentialité</a></span>} />
          {err.consent && <span style={{
          fontSize: '13px',
          color: 'var(--urgence-600)'
        }}>{err.consent}</span>}</div>
      </div>}
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexWrap: 'wrap'
    }}>
      {etape === 2 && <Button style={{
        marginRight: 'auto'
      }} variant="fantome" size="l" type="button" onClick={() => setEtape(1)} iconeAvant={<Icon name="arrow-left" size={16} />}>Retour</Button>}
      <Button variant="primaire" size="l" type="submit" iconeApres={<Icon name="arrow-right" size={17} />}>{etape === 1 ? 'Continuer' : 'Envoyer ma demande'}</Button></div>
  </form>;
}

/* ——— Calculateur du coût d'un logement vide ——— */
function Calculateur() {
  const [loyer, setLoyer] = React.useState(1400),
    [jours, setJours] = React.useState(45),
    [rot, setRot] = React.useState(1);
  const fmt = n => Math.round(n).toLocaleString('fr-CA') + ' $';
  const parJour = loyer * 12 / 365,
    cout = parJour * jours * rot,
    gain = parJour * Math.max(0, jours - 17) * rot;
  const curseur = (l, val, set, min, max, pas, suf) => <label style={{
    display: 'grid',
    gap: '10px'
  }}>
    <span style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '14px'
    }}><span style={{
        fontWeight: 600,
        color: 'var(--marine-900)'
      }}>{l}</span><span style={{
        fontWeight: 700,
        color: 'var(--marine-900)',
        fontVariantNumeric: 'tabular-nums'
      }}>{val.toLocaleString('fr-CA')}{suf}</span></span>
    <input type="range" min={min} max={max} step={pas} value={val} onChange={e => set(+e.target.value)} style={{
      width: '100%',
      accentColor: 'var(--bleu-500)'
    }} /></label>;
  return <div className="ll-deux" style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
    border: FILET,
    borderRadius: 'var(--rayon-carte)',
    overflow: 'hidden',
    background: 'var(--gris-000)'
  }}>
    <div style={{
      padding: 'var(--esp-8)',
      display: 'grid',
      gap: 'var(--esp-6)',
      alignContent: 'start'
    }}>
      {curseur('Loyer mensuel', loyer, setLoyer, 600, 3500, 25, ' $')}{curseur('Jours vacants', jours, setJours, 0, 120, 1, ' jours')}{curseur('Relocations par année', rot, setRot, 1, 4, 1, '')}
      <p style={{
        fontSize: '13px',
        color: 'var(--texte-discret)',
        margin: 0
      }}>Calcul indicatif : loyer mensuel × 12 ÷ 365 × jours vacants × relocations.</p></div>
    <div className="ll-sombre" style={{
      position: 'relative',
      background: 'var(--degrade-marine)',
      padding: 'var(--esp-8)',
      display: 'grid',
      alignContent: 'center',
      gap: '10px'
    }}>
      <span style={{
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: 'var(--bleu-300)'
      }}>Loyer perdu par année</span>
      <span aria-live="polite" style={{
        fontFamily: 'var(--police-titre)',
        fontWeight: 700,
        fontSize: 'clamp(44px,4.4vw,64px)',
        letterSpacing: '-0.03em',
        color: '#fff',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums'
      }}>{fmt(cout)}</span>
      <span style={{
        fontSize: '14px',
        color: 'var(--bleu-100)'
      }}>soit {fmt(parJour)} par jour vacant</span>
      <div style={{
        marginTop: '18px',
        paddingTop: '18px',
        borderTop: '1px solid rgba(200,218,240,.2)',
        display: 'grid',
        gap: '6px'
      }}>
        <span data-ll-exemple="1" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          color: '#fff',
          fontWeight: 600
        }}>Loué en 17 jours, vous récupérez {fmt(gain)}<Exemple /></span>
        <span data-ll-exemple="1" style={{
          fontSize: '13px',
          color: 'var(--bleu-200)'
        }}>Délai moyen de location de notre parc, valeur d'exemple.</span></div>
    </div>
  </div>;
}

/* ——— Petits blocs ——— */
/* Cartes au langage de l'accueil : fond blanc, ombre douce, sans bordure, légère montée au survol. */
/* grille : pistes fixes (3 → 1, ou 4 → 2 → 1) pour éviter une carte orpheline en dernière rangée. */
function Cartes({
  items,
  colonnes = 3,
  grille
}) {
  return <div className={grille ? 'lls-grille lls-grille-' + colonnes : undefined} style={{
    display: 'grid',
    gridTemplateColumns: grille ? 'repeat(' + colonnes + ',minmax(0,1fr))' : 'repeat(auto-fit,minmax(' + (colonnes >= 4 ? 220 : 260) + 'px,1fr))',
    gap: '24px'
  }}>
    {items.map(([ic, t, d, extra]) => <div key={t} className="cs-carte" style={{
      background: '#fff',
      borderRadius: '18px',
      border: BORD_M,
      padding: '28px',
      display: 'grid',
      gap: '12px',
      alignContent: 'start'
    }}>
      <span style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: 'var(--marine-900)',
        display: 'grid',
        placeItems: 'center'
      }}><Icon name={ic} size={19} color="#fff" /></span>
      <h3 style={{
        fontSize: '20px',
        letterSpacing: '-0.015em',
        marginTop: '8px'
      }}>{gab(t)}</h3><p style={{
        fontSize: '14px',
        margin: 0,
        lineHeight: 1.6,
        color: 'var(--texte-corps)'
      }}>{gab(d)}</p>{extra}</div>)}
  </div>;
}
/* Mention d'information juridique générale (S4) : sous chaque affirmation sur ce que Cléo explique du droit. */
const LL_MENTION = 'Information juridique générale, pas un avis juridique. Un humain prend le relais dès que votre dossier le demande.';
const MentionJuridique = ({
  clair,
  style
}) => <p className="ll-mention-jur" style={{
  margin: 0,
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  fontSize: '12.5px',
  lineHeight: 1.55,
  color: clair ? 'var(--bleu-200)' : 'var(--texte-discret)',
  ...style
}}><Icon name="info" size={14} color={clair ? 'var(--bleu-300)' : 'var(--bleu-600)'} style={{
    flex: 'none',
    marginTop: '2px'
  }} /><span>{LL_MENTION}</span></p>;
/* Liste cochée animée : à l'entrée dans l'écran, un filet descend et chaque élément s'allume tour à tour, de haut en bas (sans numéros). */
function Coches({
  items,
  clair
}) {
  const r = React.useRef(null),
    [vu, setVu] = React.useState(false);
  React.useEffect(() => {
    const el = r.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setVu(true);
      return;
    }
    const io = new IntersectionObserver(([x]) => {
      if (x.isIntersecting) {
        setVu(true);
        io.disconnect();
      }
    }, {
      threshold: .4
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <ul ref={r} className={'ll-coches' + (clair ? ' c' : '')} data-vu={vu ? '1' : undefined} style={{
    '--n': items.length
  }}>{items.map((t, i) => <li key={t} style={{
      '--i': i
    }}>
    <span className="ll-coches-pt" aria-hidden="true"><Icon name="check" size={14} color="currentColor" /></span><span>{gab(t)}</span></li>)}</ul>;
}
function Note({
  icone = 'info',
  ton = 'bleu',
  titre,
  children
}) {
  const c = {
    bleu: ['var(--bleu-025)', 'var(--bleu-600)'],
    alerte: ['var(--alerte-100)', 'var(--alerte-600)'],
    urgence: ['var(--urgence-100)', 'var(--urgence-600)']
  }[ton];
  return <div style={{
    display: 'grid',
    gridTemplateColumns: '22px minmax(0,1fr)',
    gap: '12px',
    padding: '16px 18px',
    background: c[0],
    borderRadius: 'var(--rayon-3)'
  }}>
    <Icon name={icone} size={18} color={c[1]} style={{
      marginTop: '2px'
    }} /><div style={{
      fontSize: '14px',
      lineHeight: 1.55,
      color: 'var(--marine-900)'
    }}>{titre && <strong style={{
        display: 'block',
        marginBottom: '2px'
      }}>{titre}</strong>}{children}</div></div>;
}
export { CONT, FILET, gab, Exemple, FL_TRAIT, Fleche, BoutonLien, FilAriane, SOL_HZ, SOL_S, SOL_D, SOL_ZM, SOL_V, SOL_H, LLSol, LLSolB, BORD_M, BandeauPage, TitreBloc, PREUVES_B, ChiffrePreuve, BarrePreuve, Preuves, PreuvesBase, FAQItem, FAQListe, AppelFinal, AutresVoies, CleoEnAction, TACHES_CLEO, CleoMosaique, CRENEAUX_OFFRE, FormOffre, FormOffreBase, Calculateur, Cartes, LL_MENTION, MentionJuridique, Coches, Note, FILET as FILET_P, PREUVES_B as ACC_PREUVES, TACHES_CLEO as ACC_TACHES };
