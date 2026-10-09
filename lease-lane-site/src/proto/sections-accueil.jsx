/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/sections-accueil.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon, Button, Badge, Overline } from '@/components/ds';
import { gab, Fleche } from '@/proto/blocs';
import { LL_FAQ } from '@/proto/faq';
import { ouvrirCleo } from '@/proto/seo';
const O1 = '0 1px 2px rgba(12,33,71,.05),0 12px 32px rgba(12,33,71,.08)',
  O2 = '0 2px 4px rgba(12,33,71,.06),0 24px 56px rgba(12,33,71,.14)';
const LIGNE = '1px solid var(--bordure-fine)',
  LIGNE_M = '1px solid rgba(200,218,240,.18)';
const CONTS = {
  maxWidth: 'var(--web-conteneur)',
  margin: '0 auto',
  padding: 'var(--web-section) var(--web-gouttiere)',
  boxSizing: 'border-box'
};
const aller = to => {
  window.location.hash = to;
};
const Ex = () => <Badge ton="alerte" taille="s">Exemple</Badge>;
const Tete = ({
  sur,
  t,
  d,
  clair,
  mb = '40px',
  og,
  tg
}) => <div style={{
  display: 'grid',
  gap: '12px',
  marginBottom: mb
}}>
  {sur && (og ? <div style={{
    marginBottom: og
  }}><Overline trait={false} ton={clair ? 'marine' : undefined}>{sur}</Overline></div> : <Overline trait={false} ton={clair ? 'marine' : undefined}>{sur}</Overline>)}
  <h2 style={{
    margin: 0,
    fontSize: 'var(--titre-l)',
    lineHeight: 1.322,
    letterSpacing: '-0.025em',
    color: clair ? '#fff' : 'var(--marine-900)',
    maxWidth: '22ch',
    textWrap: 'balance'
  }}>{(gab || (x => x))(t)}</h2>
  {d && <p style={{
    margin: 0,
    marginTop: tg || 0,
    fontSize: '14px',
    lineHeight: 1.65,
    maxWidth: '60ch',
    color: clair ? 'var(--bleu-100)' : 'var(--texte-corps)'
  }}>{d}</p>}</div>;
const Num = ({
  k,
  on
}) => <span style={{
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '.14em',
  color: on ? 'var(--bleu-600)' : 'var(--gris-400)'
}}>{'0' + (k + 1)}</span>;

/* 3a · Panneau interactif */
/* Les quatre grands services de la gestion d'immeubles (listes fournies par Lease Lane, page Gestion d'immeubles). m = nombre de services inclus. Descriptions courtes : à valider. */
const VOL = [{
  ic: 'key',
  t: 'Location',
  d: 'Photos, fiche et campagnes en ligne, visites illimitées, enquêtes de crédit et TAL, bail signé et remise des clés.',
  m: '12',
  ml: 'services inclus',
  taches: ['Visites illimitées', 'Prise de photos', 'Montage d\'une fiche offre de location', 'Constat des lieux (Recommandations au propriétaire selon l\'état du logement)', 'Enquête de crédit/Enquête Tribunal Administratif du logement', 'Campagnes numériques (Google Ads, Facebook Ads)', 'Visibilité organique via notre site web (+100 000 utilisateurs annuels recherchant un appartement)', 'Publicité Facebook Marketplace', 'Affichage sur la bâtisse et le balcon', 'Signature du bail', 'Remise des clés', 'Suivi aménagement']
}, {
  ic: 'building-2',
  t: 'Gestion',
  d: 'Collecte et dépôt des loyers, recouvrements, communications avec les locataires, renouvellement des baux et suivi des plaintes.',
  m: '7',
  ml: 'services inclus',
  taches: ['Collecte des loyers', 'Dépôts des loyers dans votre compte bancaire', 'Suivi serré des loyers en délinquances et recouvrements', 'Accès à notre groupe d\u2019achat d\u2019assurance pour vos immeubles', 'Communications avec les locataires (Question, demande de travaux, etc)', 'Renouvellement des baux et relevé 31', 'Suivi des plaintes de locataires et/ou autorité gouvernementale']
}, {
  ic: 'banknote',
  t: 'Comptabilité',
  d: 'Tenue de livres, paiement des factures et des taxes, déclarations de TPS/TVQ et rapport mensuel.',
  m: '5',
  ml: 'services inclus',
  taches: ['Tenue de livre (Revenus/Dépenses)', 'Paiement des factures', 'Rapport et paiement - gouvernement (TPS/TVQ)', 'Paiement des taxes (municipales, Scolaires, TPS/TVQ)', 'Rapports mensuels fournis au client']
}, {
  ic: 'wrench',
  t: 'Entretien',
  d: 'Réparations, urgences 24 h/24, rénovations intérieures et extérieures, planification des travaux et gestion des sous-traitants.',
  m: '6',
  ml: 'services inclus',
  taches: ['Travaux entretien/réparation', 'Service d\u2019urgence 24h/24h', 'Rénovation de logement', 'Rénovation extérieure', 'Planification de travaux', 'Demande de soumission et gestion des sous-traitants']
}];
function VoletsPanneau({
  sur = 'Ce que nous prenons en charge',
  t = '{Quatre résultats}, pas trente tâches.',
  d = 'Chaque volet est mesuré dans votre rapport mensuel.'
} = {}) {
  const [i, setI] = React.useState(0),
    v = VOL[i];
  return <section style={{
    background: '#fff'
  }}><div style={CONTS}>
    <Tete sur={sur} t={t} d={d} />
    <div className="lls-vol" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
        gap: '24px',
        alignItems: 'stretch'
      }}>
      <div role="tablist" aria-label="Volets" style={{
          display: 'grid',
          gap: '8px'
        }}>
        {VOL.map((x, k) => {
            const on = k === i;
            return <button key={x.t} type="button" role="tab" aria-selected={on} onClick={() => setI(k)} onMouseEnter={() => setI(k)} style={{
              display: 'grid',
              gridTemplateColumns: '52px minmax(0,1fr) auto',
              alignItems: 'center',
              gap: '18px',
              padding: '20px 24px',
              border: 0,
              borderRadius: '16px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'var(--police-corps)',
              background: on ? 'var(--surface-douce)' : 'transparent',
              transition: 'background 200ms'
            }}>
          <span style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: on ? 'var(--marine-900)' : 'var(--bleu-025)',
                transition: 'background 200ms'
              }}><Icon name={x.ic} size={22} color={on ? '#fff' : 'var(--bleu-600)'} /></span>
          <span><span style={{
                  display: 'block',
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  color: 'var(--marine-900)'
                }}>{x.t}</span><span style={{
                  display: 'block',
                  fontSize: '14px',
                  color: 'var(--texte-corps)',
                  marginTop: '4px',
                  lineHeight: 1.5
                }}>{x.d}</span></span>
          <Num k={k} on={on} /></button>;
          })}
      </div>
      <article role="tabpanel" className="ll-sombre lls-vol-p" style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '20px',
          background: 'var(--degrade-marine)',
          padding: '48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
          gap: '40px',
          alignContent: 'space-between'
        }}>
        <div aria-hidden="true" style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(70% 90% at 100% 0%,rgba(91,154,232,.3),transparent 60%)'
          }}></div>
        <div key={i} className="lls-fondu" style={{
            position: 'relative',
            display: 'grid',
            gap: '14px',
            alignContent: 'start'
          }}>
          <span style={{
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--bleu-300)'
            }}>{'Volet 0' + (i + 1)}</span>
          <h3 style={{
              margin: 0,
              fontSize: '32px',
              lineHeight: 1.322,
              color: '#fff'
            }}>{v.t}</h3>
          <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--bleu-100)',
              lineHeight: 1.6
            }}>{v.d}</p>
          <div style={{
              marginTop: '24px',
              display: 'grid',
              gap: '8px'
            }}><span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '56px',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#fff',
                lineHeight: 1
              }}>{v.m}<Ex /></span><span style={{
                fontSize: '14px',
                color: 'var(--bleu-200)'
              }}>{v.ml}</span></div>
        </div>
        <ul key={'t' + i} className="lls-fondu" style={{
            position: 'relative',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            alignSelf: 'start',
            borderTop: LIGNE_M
          }}>
          {v.taches.map(t => <li key={t} style={{
              display: 'grid',
              gridTemplateColumns: '24px minmax(0,1fr)',
              gap: '12px',
              padding: '14px 0',
              borderBottom: LIGNE_M,
              fontSize: '14px',
              color: '#fff'
            }}><Icon name="check" size={17} color="var(--bleu-300)" />{t}</li>)}</ul>
        <div style={{
            position: 'relative',
            gridColumn: '1 / -1',
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}><Button variant="inverse" size="l" onClick={() => aller('/offre-de-service')}>Obtenir une offre de service</Button><Fleche to="/expertise-et-strategie" clair>Notre expertise</Fleche></div>
      </article>
    </div></div></section>;
}

/* 4b · Feuille de route */
const ETAPES = [['phone', 'Appel découverte', 'Trente minutes pour comprendre votre immeuble, vos locataires et ce que vous voulez déléguer.', 'Jour 1'], ['file-text', 'Offre et acceptation', 'Services compris, responsabilités et échéancier de transition.', 'Jour 2 à 5'], ['share-2', 'Transfert et activation', 'Baux, dossiers et clés récupérés, locataires avisés, Cléo actif dès le premier jour.', 'Semaine 2 & 3'], ['chart-column', 'Premier rapport', 'À la fin du premier mois complet : loyers, demandes en cours et échéances.', 'Fin du mois 1']];
/* Paramètres facultatifs pour les pages propriétaires : étapes, chiffre de gauche, actions, graphique de la dernière étape, fond. */
function ParcoursFeuille({
  sur = 'Votre arrivée chez Lease Lane',
  t = 'Quatre étapes, du premier appel au premier rapport.',
  etapes = ETAPES,
  chiffre = '4 semaines',
  chiffreTexte = 'du premier appel au premier rapport, sans interruption pour vos locataires',
  actions,
  graphe = true,
  fond = 'var(--surface-douce)',
  id
} = {}) {
  return <section id={id} style={{
    background: fond
  }}><div className="lls-par" style={{
      ...CONTS,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
      gap: '64px',
      alignItems: 'start'
    }}>
    <div>
      <Tete sur={sur} t={t} />
      {chiffre && <div style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: O1,
          padding: '28px',
          display: 'grid',
          gap: '8px',
          marginBottom: '32px'
        }}>
        <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '48px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--marine-900)',
            lineHeight: 1
          }}>{chiffre}<Ex /></span>
        <span style={{
            fontSize: '14px',
            color: 'var(--texte-corps)'
          }}>{chiffreTexte}</span>
        <div aria-hidden="true" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: '4px',
            marginTop: '12px'
          }}>{[1, 2, 3, 4].map(n => <span key={n} style={{
              height: '6px',
              borderRadius: '3px',
              background: 'var(--bleu-500)',
              opacity: .25 + n * .1875
            }}></span>)}</div>
      </div>}
      <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>{actions || <React.Fragment><Button variant="primaire" size="l" onClick={() => aller('/offre-de-service')}>Planifier un appel</Button><Fleche to="/changer-de-gestionnaire">Vous avez déjà un gestionnaire?</Fleche></React.Fragment>}</div>
    </div>
    <ol style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gap: '16px'
      }}>
      {etapes.map(([ic, t, d, q], k) => {
          const der = k === etapes.length - 1;
          return <li key={t} className="lls-etape" style={{
            display: 'grid',
            gridTemplateColumns: '64px minmax(0,1fr)',
            gap: '24px'
          }}>
        <div style={{
              display: 'grid',
              justifyItems: 'center',
              gridTemplateRows: '64px 1fr'
            }}>
          <span style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: der ? 'var(--marine-900)' : '#fff',
                boxShadow: der ? 'none' : 'inset 0 0 0 2px var(--bleu-200)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '18px',
                fontWeight: 700,
                color: der ? '#fff' : 'var(--bleu-600)'
              }}>{'0' + (k + 1)}</span>
          {!der && <span aria-hidden="true" style={{
                width: '2px',
                background: 'var(--bleu-200)',
                marginTop: '8px',
                marginBottom: '-24px'
              }}></span>}</div>
        <article style={{
              background: der ? 'var(--degrade-marine)' : '#fff',
              borderRadius: '16px',
              boxShadow: der ? O2 : O1,
              padding: '28px 32px',
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) auto',
              gap: '8px 24px',
              alignItems: 'start'
            }}>
          {q && <span style={{
                gridColumn: 1,
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: der ? 'var(--bleu-300)' : 'var(--bleu-600)'
              }}>{q}</span>}
          <span style={{
                gridColumn: 2,
                gridRow: '1 / span 3',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: der ? 'rgba(255,255,255,.12)' : 'var(--bleu-025)',
                display: 'grid',
                placeItems: 'center'
              }}><Icon name={ic} size={21} color={der ? '#fff' : 'var(--bleu-600)'} /></span>
          <h3 style={{
                gridColumn: 1,
                margin: 0,
                fontSize: '22px',
                color: der ? '#fff' : 'var(--marine-900)'
              }}>{t}</h3>
          <p style={{
                gridColumn: 1,
                margin: 0,
                fontSize: '14px',
                lineHeight: 1.6,
                color: der ? 'var(--bleu-100)' : 'var(--texte-corps)'
              }}>{d}</p>
          {der && graphe && <div aria-hidden="true" style={{
                gridColumn: '1 / -1',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '6px',
                height: '48px',
                marginTop: '16px'
              }}>{[40, 58, 50, 70, 64, 90, 82, 96].map((h, j) => <span key={j} style={{
                  flex: 1,
                  height: h + '%',
                  borderRadius: '3px',
                  background: j > 5 ? 'var(--bleu-300)' : 'rgba(200,218,240,.3)'
                }}></span>)}</div>}
        </article></li>;
        })}
    </ol>
  </div></section>;
}

/* 5b · Le résultat d'abord */

/* 6a · Sujets, réponses et Cléo */
const CATS = {
  proprietaires: [['Offre et contrat', 'file-text', ['p1', 'p2', 'p3', 'p8']], ['Transition', 'share-2', ['p4', 'p11']], ['Location', 'key', ['p5', 'p7']], ['Gestion courante', 'wrench', ['p9', 'p10', 'p12', 'p13']], ['Cléo', 'message-square', ['p6']], ['Loyers et TAL', 'scale', ['p14', 'p15', 'p16', 't5', 't7', 't6', 't1']]],
  locataires: [['Logements et visites', 'search', ['l1', 'l2', 'l3']], ['Travaux et urgences', 'wrench', ['l4', 'l5']], ['Loyer', 'credit-card', ['l6', 'l12']], ['Bail', 'file-text', ['l7', 'l8', 'l9', 'l11', 'l14']], ['TAL et droit du logement', 'scale', ['t1', 't2', 't3', 't4']], ['Autres demandes', 'message-square', ['l10', 'l13']]]
};
function FAQSujets({
  sur = 'Questions fréquentes',
  t = 'Vos questions, {nos réponses directes}.',
  d = 'Ces réponses viennent des questions posées à Cléo, validées par notre équipe avant leur publication.',
  fond = 'var(--surface-douce)',
  seul,
  sombre
} = {}) {
  const F = LL_FAQ;
  const [pub, setPub] = React.useState(seul || 'proprietaires'),
    [c, setC] = React.useState(0),
    [ouv, setOuv] = React.useState('p1');
  const cats = CATS[pub],
    ids = cats[c][2].filter(k => F[k]);
  const choisir = (p, k) => {
    setPub(p);
    setC(k);
    setOuv(CATS[p][k][2][0]);
  };
  const L = sombre ? '1px solid rgba(200,218,240,.16)' : LIGNE,
    enc = sombre ? '#fff' : 'var(--marine-900)',
    doux = sombre ? 'var(--bleu-100)' : 'var(--texte-corps)';
  return <section className={sombre ? 'll-sombre' : undefined} style={{
    position: 'relative',
    overflow: 'hidden',
    background: sombre ? 'var(--degrade-marine)' : fond
  }}>
    {sombre && <div aria-hidden="true" style={{
      position: 'absolute',
      inset: 0,
      background: 'var(--lueur-bleue)',
      pointerEvents: 'none'
    }} />}
    <div style={{
      ...CONTS,
      position: 'relative'
    }}>
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '24px 32px',
        marginBottom: '40px',
        flexWrap: 'wrap'
      }}>
      <Tete mb={0} sur={sur} t={t} d={d} clair={sombre} og="2.4px" tg="3.6px" />
      {!seul && <div role="tablist" aria-label="Public" style={{
          display: 'inline-flex',
          padding: '4px',
          borderRadius: '999px',
          background: sombre ? 'rgba(255,255,255,.08)' : '#fff',
          border: L
        }}>
        {[['proprietaires', 'Propriétaires'], ['locataires', 'Locataires']].map(([k, t]) => <button key={k} type="button" role="tab" aria-selected={pub === k} onClick={() => choisir(k, 0)} style={{
            height: '44px',
            padding: '0 22px',
            border: 0,
            borderRadius: 'var(--rayon-bouton)',
            cursor: 'pointer',
            fontFamily: 'var(--police-corps)',
            fontSize: '14px',
            fontWeight: 600,
            background: pub === k ? sombre ? '#fff' : 'var(--marine-900)' : 'transparent',
            color: pub === k ? sombre ? 'var(--marine-900)' : '#fff' : enc
          }}>{t}</button>)}</div>}
    </div>
    <div className="lls-faq" style={{
        display: 'grid',
        gridTemplateColumns: '240px minmax(0,1fr)',
        gap: '32px',
        alignItems: 'start'
      }}>
      <nav aria-label="Catégories" className="lls-faq-nav" style={{
          display: 'grid',
          gap: '4px'
        }}>
        <span style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: sombre ? 'var(--bleu-300)' : 'var(--texte-corps)',
            padding: '0 16px 8px'
          }}>Sujets</span>
        {cats.map(([t, ic, l], k) => {
            const on = k === c;
            return <button key={t} type="button" onClick={() => choisir(pub, k)} aria-pressed={on} style={{
              display: 'grid',
              gridTemplateColumns: '20px minmax(0,1fr) auto',
              alignItems: 'center',
              gap: '12px',
              minHeight: '48px',
              padding: '0 16px',
              border: 0,
              borderRadius: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'var(--police-corps)',
              background: on ? '#fff' : 'transparent',
              color: on ? 'var(--marine-900)' : enc
            }}>
          <Icon name={ic} size={17} color={on ? 'var(--bleu-600)' : doux} /><span style={{
                fontSize: '14px',
                fontWeight: on ? 600 : 500
              }}>{t}</span>
          <span style={{
                fontSize: '12px',
                fontWeight: 700,
                minWidth: '24px',
                height: '24px',
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                background: on ? 'var(--bleu-500)' : sombre ? 'rgba(255,255,255,.1)' : '#fff',
                color: on ? '#fff' : doux
              }}>{l.filter(x => F[x]).length}</span></button>;
          })}</nav>
      <div style={{
          borderTop: L
        }}>{ids.map(k => {
            const o = ouv === k;
            return <div key={k} style={{
              borderBottom: L
            }}>
        <button type="button" aria-expanded={o} onClick={() => setOuv(o ? null : k)} style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '24px',
                minHeight: '64px',
                padding: '16px 0',
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--police-corps)',
                fontSize: '16px',
                fontWeight: 600,
                lineHeight: 1.4,
                color: enc
              }}>{F[k].q}
          <span style={{
                  width: '32px',
                  height: '32px',
                  flex: 'none',
                  borderRadius: '50%',
                  background: o ? sombre ? '#fff' : 'var(--marine-900)' : sombre ? 'rgba(255,255,255,.1)' : '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  transition: 'transform 200ms',
                  transform: o ? 'rotate(45deg)' : 'none'
                }}><Icon name="plus" size={16} color={o ? sombre ? 'var(--marine-900)' : '#fff' : sombre ? '#fff' : 'var(--bleu-600)'} /></span></button>
        <div hidden={!o} className="lls-fondu" style={{
                padding: '0 56px 24px 0',
                display: o ? 'grid' : 'none',
                gap: '16px'
              }}><p style={{
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: doux
                }}>{F[k].r}</p>
          <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}><Button variant={sombre ? 'inverse' : 'secondaire'} size="s" onClick={() => ouvrirCleo(F[k].q)} iconeAvant={<Icon name="message-square" size={14} />}>Approfondir avec Cléo</Button></div></div></div>;
          })}</div>
    </div></div></section>;
}
export { VoletsPanneau, ParcoursFeuille, FAQSujets, VOL as ACC_VOL, ETAPES as ACC_ETAPES, CATS as ACC_FAQ_CATS };
