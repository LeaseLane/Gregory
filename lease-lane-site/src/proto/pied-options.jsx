/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pied-options.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Logo } from '@/components/ds';
import { ACC_H } from '@/proto/accueil-options-1';
import { LL_SITE, LL_ROUTES } from '@/proto/routes';
import { BASE_LOGO, TelAff, LiensLegaux, Copyright, Responsable } from '@/proto/chrome';
import { H7SocleA } from '@/proto/accueil-heros7';
const h = to => to.startsWith('/') ? to : to;
const AUTH = "/connexion";
const ESPACE = {
  'Propriétaires': [AUTH + '?profil=proprietaire', 'Espace propriétaire', 'building-2'],
  'Locataires': [AUTH + '?profil=locataire', 'Espace locataire', 'key-round']
};
const COLS = [['Propriétaires', [['/gestion-immobiliere', 'Gestion d\u2019immeubles'], ['/gestion-immobiliere/location', 'Location et mise en marché'], ['/expertise-et-strategie', 'Expertise et stratégie'], ['/changer-de-gestionnaire', 'Changer de gestionnaire']]], ['Locataires', [['/locataires', 'Service aux locataires'], ['/locataires/commentaire-ou-plainte', 'Administration et plaintes']]], ['Lease Lane', [['/cleo', 'Agent IA - Cléo'], ['/a-propos', 'À propos'], ['/blogue', 'Blogue & nouvelles'], ['/faq', 'Foire aux questions']]]];
const RS = [['linkedin', 'LinkedIn', 'https://www.linkedin.com/company/leaselane'], ['instagram', 'Instagram', 'https://www.instagram.com/leaselane.ca'], ['facebook', 'Facebook', 'https://www.facebook.com/leaselane.ca']];
const TAG = 'Une gestion d\'immeubles à la fine pointe de la technologie. Nos automatisations prennent le maximum d\'opérations en charge; notre équipe s\'occupe du reste.';
const SLOGAN = 'Une clé d’avance et ce, en permanence.';
const S = () => LL_SITE;
const tel = () => 'tel:+1' + String(S().telephone || '').replace(/\D/g, '');
const LOGO = () => <Logo base={BASE_LOGO} fond="marine" slogan={false} hauteur={40} />;
const Reseaux = () => <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '7px'
}}>{RS.map(([k, x, u]) => <a key={k} href={u} target="_blank" rel="noopener noreferrer" aria-label={x + ' (nouvel onglet)'} title={x} className="ao-rs" style={{
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    display: 'grid',
    placeItems: 'center',
    border: ACC_H.FIN_M,
    color: '#fff'
  }}><ACC_H.Icon name={k} size={14} color="currentColor" /></a>)}</div>;
/* Secteurs desservis (SEO local) : sous la ligne de séparation, juste au-dessus des liens légaux. Liste tirée des adresses (pages locales). */
/* Secteurs du pied : quatre zones en colonnes, plus le lien vers la page centrale (pages locales, 50 km autour de Québec). */
const ZONES = [['Ville de Québec', ['la-cite-limoilou', 'beauport', 'charlesbourg', 'les-rivieres', 'sainte-foy-sillery-cap-rouge', 'la-haute-saint-charles']], ['Rive-Nord', ['l-ancienne-lorette', 'saint-augustin-de-desmaures', 'boischatel', 'lac-beauport', 'stoneham-et-tewkesbury', 'sainte-brigitte-de-laval', 'sainte-catherine-de-la-jacques-cartier', 'shannon']], ['Rive-Sud', ['levis', 'saint-henri', 'saint-lambert-de-lauzon', 'saint-apollinaire', 'sainte-marie']], ['Portneuf', ['donnacona', 'pont-rouge', 'saint-raymond']]];
const nomsSecteurs = () => {
  const N = {};
  LL_ROUTES.filter(r => r.page === 'locale' || r.page === 'levis').forEach(r => {
    N[r.path.split('/').pop()] = [r.path, r.fil[r.fil.length - 1][0]];
  });
  return N;
};
/* Secteurs (option B retenue le 11 oct. 2026) : en-tête au style des colonnes du pied, onglets par zone, villes en pastilles.
   Toutes les villes restent dans le HTML (panneaux inactifs masqués), pour le référencement. */

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
/* Bas du pied (« 5 · Raffiné », retenu le 11 oct. 2026) : intitulés blancs 13 px, liens 14 px, secteurs dans un repli natif. */
const PE_T = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#fff',
  letterSpacing: '.01em'
};
const PE_L = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '32px',
  fontSize: '14px',
  color: 'var(--bleu-100)',
  textDecoration: 'none'
};
/* Secteurs : repli natif <details> (clavier, lecteur d'écran et moteurs de recherche sans script). */
const SecteursRepli = ({
  c
}) => {
  const N = nomsSecteurs();
  return <details className="pe-sec" style={{
    display: 'grid'
  }}><summary style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      minHeight: '44px',
      cursor: 'pointer',
      listStyle: 'none',
      fontSize: '14px',
      fontWeight: 600,
      color: '#fff',
      justifySelf: c ? 'center' : 'start'
    }}>Secteurs desservis<span style={{
        fontWeight: 400,
        color: 'var(--bleu-100)'
      }}>22 villes, 50 km autour de Québec</span><span className="pe-fl" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(k => <svg key={k} width="9" height="12" viewBox="0 0 9 12" style={{
          '--k': k,
          opacity: 1 - k * 0.16
        }}><path d="M2 1.5 6.5 6 2 10.5" fill="none" stroke="#91B5E0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>)}</span><span className="pe-chev" aria-hidden="true" style={{
        display: "inline-grid"
      }}><ACC_H.Icon name="chevron-down" size={16} color={ACC_H.CL} /></span></summary>
    <div className="pe-zg">{ZONES.map(([z, l], i) => {
        const v = l.filter(x => N[x]);
        return <div key={z} className="pe-z" style={{
          '--i': i
        }}>
      <div style={{
            display: 'grid',
            gridTemplateColumns: '34px minmax(0,1fr)',
            gap: '12px',
            alignItems: 'center',
            paddingBottom: '14px',
            borderBottom: '1px solid rgba(255,255,255,.08)'
          }}><span aria-hidden="true" style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,.07)',
              display: 'grid',
              placeItems: 'center'
            }}><ACC_H.Icon name="map-pin" size={16} color={ACC_H.CL} /></span>
        <span style={{
              display: 'grid',
              gap: '1px'
            }}><span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff'
              }}>{z}</span><span style={{
                fontSize: '12px',
                color: '#91B5E0'
              }}>{v.length + ' ' + (i === 0 ? 'arrondissements' : 'municipalités')}</span></span></div>
      <ul style={{
            listStyle: 'none',
            margin: 0,
            padding: '10px 0 0',
            display: 'grid'
          }}>{v.map(x => <li key={x}><a href={N[x][0]} className="ao-lien pe-l pe-zl" style={{
                ...PE_L,
                fontSize: '13px',
                minHeight: '32px'
              }}><span aria-hidden="true" className="pe-zp"></span>{N[x][1]}</a></li>)}</ul></div>;
      })}</div>
    <a href="/gestion-immobiliere/grande-region-de-quebec" className="ao-lien pe-l" style={{
      ...PE_L,
      color: '#fff',
      fontWeight: 600,
      justifySelf: c ? 'center' : 'start'
    }}>Toute la grande région de Québec<ACC_H.Icon name="arrow-right" size={14} color={ACC_H.CL} /></a></details>;
};
/* 5 · Raffiné (direction du 11 oct. 2026) : marque et contact à gauche, quatre colonnes de liens, secteurs repliés,
   silhouette de Québec tracée d'un trait (toits, Château Frontenac, clocher) au-dessus des mentions. Chevron du logo au survol des liens. */
const SKY = "M0 58H90V50H118V44H136V50H170V40L182 31L194 40V58H232V47H256V42H276V47H300V58H338V36H352V58H392V45H420V38L432 30L444 38V45H470V58H520V34H534V24L542 15L550 24V34H566V12L574 2L582 12V34H598V20L606 11L614 20V34H632V24L640 16L648 24V34H662V58H706V46H730V40H752V46H770V58H812V38H820V22L825 6L830 22V38H838V58H884V48H912V42H930V48H958V58H1000V44L1012 35L1024 44V58H1062V50H1092V45H1118V50H1146V58H1200";
const LienR = ({
  href,
  children,
  fort,
  ic
}) => <a href={href} className="ao-lien pr-l" style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '34px',
  fontSize: '14px',
  fontWeight: fort ? 600 : 400,
  color: fort ? '#fff' : 'var(--bleu-100)',
  textDecoration: 'none'
}}>{ic && <ACC_H.Icon name={ic} size={14} color={ACC_H.CL} />}<span>{children}</span><svg className="pr-chev" aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"><path d="M3 1.5 6.5 5 3 8.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></a>;
const ColR = ({
  t,
  items
}) => <nav aria-label={t} style={{
  display: 'grid',
  gap: '14px',
  alignContent: 'start'
}}><span style={PE_T}>{t}</span><ul style={{
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gap: '2px'
  }}>{items.map(([href, x, ic]) => <li key={x}><LienR href={href} ic={ic}>{x}{/logements-a-louer$|demande-de-location$/.test(href) && <span className="pr-bt">Bientôt</span>}</LienR></li>)}</ul></nav>;
/* Rythme vertical : chaque rangée a le même espacement (28 px) et un filet au-dessus; la colonne de marque a la hauteur des autres. */
const RANG = {
  padding: '28px 0',
  borderTop: ACC_H.FIN_M
};
const Bas5 = () => <div style={{
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr)'
}}>
  <div className="pr-g" style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(200px,1fr) repeat(4,max-content)',
    columnGap: 'clamp(24px,3vw,44px)',
    rowGap: '28px',
    paddingBottom: '28px'
  }}>
    <div style={{
      display: 'grid',
      gap: '16px',
      alignContent: 'start'
    }}>
      <a href="/" aria-label="Lease Lane, accueil" style={{
        display: 'inline-block',
        justifySelf: 'start'
      }}><LOGO /></a>
      <p style={{
        margin: 0,
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'var(--bleu-100)',
        maxWidth: '30ch'
      }}>Gestion immobilière à Québec et à Lévis. Choisir Lease Lane, c’est avoir une clé d’avance en permanence.</p>
      <div className="pr-vers" aria-hidden="true"><span className="pr-vers-l"></span><span className="pe-fl">{[0, 1, 2, 3, 4, 5].map(k => <svg key={k} width="9" height="12" viewBox="0 0 9 12" style={{
            '--k': k,
            opacity: .2 + k * 0.16
          }}><path d="M2 1.5 6.5 6 2 10.5" fill="none" stroke="#91B5E0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>)}</span></div></div>
    {COLS.map(([t, it]) => <ColR key={t} t={t} items={it.map(([to, x]) => [h(to), x])} />)}
    <ColR t="Vos espaces" items={[[ESPACE['Propriétaires'][0], 'Espace propriétaire', 'building-2'], [ESPACE['Locataires'][0], 'Espace locataire', 'key-round'], ["/locataires#urgence", 'Urgence 24/7', 'triangle-alert']]} /></div>
  <div className="pr-contact" style={{
    ...RANG,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px 32px'
  }}>
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '4px 28px'
    }}><a href={h('/nous-joindre')} className="ao-lien" style={{
        ...PE_T,
        textDecoration: 'none'
      }}>Nous joindre</a>
      <LienR href={tel()} ic="phone" fort><TelAff /></LienR><LienR href={'mailto:' + (S().courriel || '')} ic="mail">{S().courriel}</LienR><LienR href="/nous-joindre#ecrire" ic="message-square">Écrire à l’équipe</LienR></div>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    }}><span style={{
        ...PE_T,
        fontWeight: 500,
        color: 'var(--bleu-100)'
      }}>Suivez-nous</span><Reseaux /></div></div>
  <div style={{
    ...RANG,
    padding: '14px 0'
  }}><SecteursRepli /></div>
  <div style={{
    display: 'grid',
    gap: '36px',
    paddingTop: '28px',
    borderTop: ACC_H.FIN_M
  }}>
    <svg aria-hidden="true" focusable="false" viewBox="0 0 1200 60" preserveAspectRatio="xMidYMax meet" style={{
      display: 'block',
      width: '100%',
      height: 'auto',
      maxHeight: '64px'
    }}><path className="pr-sky" d={SKY} fill="none" stroke="rgba(145,181,224,.42)" strokeWidth="1.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></svg>
    <div className="pr-bas" style={{
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      textAlign: 'center'
    }}><LiensLegaux couleur="var(--bleu-100)" taille="12px" classe="ao-lien" gap="4px 18px" />
      <span style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '3px 6px',
        fontSize: '12px',
        color: 'var(--bleu-100)'
      }}><Copyright couleur="var(--bleu-100)" taille="12px" /><span aria-hidden="true">·</span><Responsable couleur="var(--bleu-100)" taille="12px" /></span></div></div></div>;
function PiedB() {
  const ref = React.useRef(null),
    p = ACC_H.useDefil(ref);
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
      <div style={{
        paddingTop: '40px',
        borderTop: ACC_H.FIN_M
      }}><Bas5 /></div>
      </div></footer>;
}
/* C · Compact : une barre d'actions en tête (urgence, soumission, portails), puis le plan du site serré, sur fond marine uni. */

/* Pied de page figé : B « Grand format » retenu, barre de revue retirée. */
let PiedRevue = () => <PiedB />;
export { PiedRevue, SolPied };
