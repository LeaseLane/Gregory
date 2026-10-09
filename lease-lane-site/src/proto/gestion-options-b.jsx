/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/gestion-options-b.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon, Button } from '@/components/ds';
import { PPC, PP_TYPES } from '@/proto/pages-proprietaires';
import { gab, LLSol, MentionJuridique, Exemple, Fleche, Note, CONT } from '@/proto/blocs';
import { LL_FAQ } from '@/proto/faq';
import { PictoImmeuble } from '@/proto/pictos-immeubles';
import { LLBandes } from '@/proto/pages-proprio-b';
import { FormOffreP } from '@/proto/forms-principal';
import { GO_useRevue, GO_BasculeRevue, GO_OptionsSection } from '@/proto/gestion-options-a';
const F = '1px solid var(--bordure-fine)',
  FC = '1px solid rgba(200,218,240,.16)';
const O1 = '0 1px 2px rgba(12,33,71,.05),0 12px 32px rgba(12,33,71,.08)',
  O2 = '0 2px 4px rgba(12,33,71,.06),0 24px 56px rgba(12,33,71,.14)';
const SUR = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase'
};
const Rond = ({
  ic,
  fonce,
  t = 48
}) => <span aria-hidden="true" style={{
  width: t + 'px',
  height: t + 'px',
  flex: 'none',
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  background: fonce ? 'rgba(255,255,255,.12)' : 'var(--bleu-025)'
}}><Icon name={ic} size={Math.round(t * .44)} color={fonce ? '#fff' : 'var(--bleu-600)'} /></span>;
const Lueur = () => <div aria-hidden="true" style={{
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(70% 90% at 100% 0%,rgba(91,154,232,.28),transparent 60%)',
  pointerEvents: 'none'
}} />;
const cleo = () => PPC.gestion.cleo;

/* ——— 04 · Ce que Cléo change ——— */

const Pastille = ({
  ic,
  children,
  vive
}) => <span style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  height: '26px',
  padding: '0 10px',
  borderRadius: '999px',
  border: '1px solid ' + (vive ? '#fff' : 'rgba(200,218,240,.32)'),
  fontSize: '12px',
  fontWeight: 600,
  color: '#fff',
  whiteSpace: 'nowrap'
}}>{ic && <Icon name={ic} size={13} color="#fff" />}{children}</span>;
const CAP = [['key', 'Location', 'Vos logements loués plus vite', ['Répond aux prospects : prix, dates, inclusions', 'Réserve les visites selon vos plages ouvertes', 'Relance chaque visiteur le lendemain', 'Reçoit des demandes de location complètes']], ['message-square', 'Locataires', 'Chaque locataire a sa réponse', ['Bail, loyer et services, en français d’abord', 'Paiements et reçus, dans le portail', 'Ajout au bail, cession et départ', 'Un avis à chaque étape, par courriel ou texto']], ['wrench', 'Entretien', 'Des demandes prêtes à traiter', ['Demande de travaux avec module de suivi complet', 'Urgences traitées très rapidement', 'Plages de rendez-vous proposées au locataire', 'Suivi jusqu’à la fermeture du dossier']], ['building-2', 'Pour vous', 'Rien ne vous échappe', ['Aucun message sans réponse, jour et nuit', 'Le fil complet transmis au gestionnaire', 'Vos approbations demandées en un geste', 'Les échanges résumés dans votre rapport mensuel']]];
/* Capacités : un seul cadre à fine bordure marine, deux rangées de deux colonnes séparées par des filets (« Tableau unique » de l'accueil). */
const BORD = '1px solid rgba(12,33,71,.16)';
function Capacites() {
  return <div className="cs-tab4" style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
    borderRadius: '20px',
    border: BORD,
    background: '#fff',
    overflow: 'hidden'
  }}>
    {CAP.map(([ic, fam, t, items], k) => <section key={fam} aria-labelledby={'cap-' + ic} className="cs-col" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      padding: 'clamp(22px,2.4vw,32px)',
      borderLeft: k % 2 ? '1px solid var(--bordure-fine)' : 0,
      borderTop: k > 1 ? '1px solid var(--bordure-fine)' : 0
    }}>
      <span aria-hidden="true" style={{
        width: '44px',
        height: '44px',
        flex: 'none',
        borderRadius: '12px',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--marine-900)'
      }}><Icon name={ic} size={19} color="#fff" /></span>
      <span style={{
        display: 'grid',
        gap: '6px'
      }}><span style={{
          ...SUR,
          fontSize: '11.5px',
          color: 'var(--bleu-600)'
        }}>{fam}</span>
        <h4 id={'cap-' + ic} style={{
          margin: 0,
          fontSize: '19px',
          fontWeight: 700,
          letterSpacing: '-0.015em',
          lineHeight: 1.3,
          color: 'var(--marine-900)',
          textWrap: 'balance'
        }}>{t}</h4></span>
      <ul style={{
        listStyle: 'none',
        margin: 0,
        padding: '16px 0 0',
        borderTop: '1px solid var(--bordure-fine)',
        display: 'grid',
        gap: '11px'
      }}>{items.map((it, j) => <li key={j} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '14px',
          lineHeight: 1.5,
          color: 'var(--texte-corps)'
        }}>
        <span aria-hidden="true" style={{
            display: 'grid',
            placeItems: 'center',
            height: '21px',
            flex: 'none'
          }}><Icon name="check" size={14} color="var(--bleu-500)" /></span><span>{gab(it)}</span></li>)}</ul></section>)}
  </div>;
}
/* Compétence « Droit du logement · TAL » : réponses tirées de la banque FAQ (source unique de Cléo). */
const TAL_Q = {
  proprietaires: ['t5', 't7', 't6'],
  locataires: ['t2', 't3', 't4']
};
function CleoTAL() {
  const FQ = LL_FAQ,
    [p, setP] = React.useState('proprietaires'),
    [k, setK] = React.useState(0),
    f = FQ[TAL_Q[p][k]];
  const liste = (t, items) => <div style={{
    display: 'grid',
    gap: '4px',
    alignContent: 'start'
  }}><span style={{
      fontSize: '14px',
      fontWeight: 700,
      color: '#fff',
      paddingBottom: '12px',
      marginBottom: '4px',
      borderBottom: FC
    }}>{t}</span>
    <ul style={{
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'grid'
    }}>{items.map((x, j) => <li key={x} style={{
        display: 'grid',
        gridTemplateColumns: '22px minmax(0,1fr)',
        gap: '12px',
        alignItems: 'start',
        padding: '9px 0',
        borderTop: j ? FC : 'none',
        fontSize: '14px',
        lineHeight: 1.5,
        color: '#fff'
      }}><span aria-hidden="true" style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,.14)',
          display: 'grid',
          placeItems: 'center'
        }}><Icon name="check" size={13} color="#fff" /></span><span>{x}</span></li>)}</ul></div>;
  return <figure className="ll-sombre go-2c" style={{
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
    margin: 0,
    borderRadius: '24px',
    background: 'var(--degrade-marine)',
    padding: 'clamp(24px,3.4vw,44px)',
    display: 'grid',
    gridTemplateColumns: 'minmax(0,6fr) minmax(0,5fr)',
    gap: '40px',
    alignItems: 'stretch',
    boxShadow: O2
  }}>
    <Lueur />{<LLSol sombre h="55%" />}
    <div style={{
      position: 'relative',
      display: 'grid',
      gap: '24px'
    }}>
      {/* Mobile : trois diapositives (présentation · sujets · mise à jour); sur grand écran, les enveloppes s'effacent (display: contents). */}
      <div className="go-tal-car" data-hauteur-auto="" style={{
        display: 'contents'
      }}><div className="go-tal-p" style={{
          display: 'contents'
        }}>
      <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}><Pastille ic="sparkles" vive>Compétence phare</Pastille><Pastille ic="scale">Droit du logement · TAL</Pastille></div>
      <div style={{
            display: 'grid',
            gap: '12px'
          }}><h3 style={{
              margin: 0,
              fontSize: 'clamp(26px,2.6vw,34px)',
              lineHeight: 1.265,
              letterSpacing: '-0.03em',
              color: '#fff',
              textWrap: 'balance'
            }}>Cléo explique les règles du Tribunal administratif du logement.</h3>
        <p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'var(--bleu-100)',
              maxWidth: '56ch'
            }}>Code civil du Québec, procédures, délais et frais du TAL : Cléo explique le droit du logement aux propriétaires comme aux locataires, avec la même rigueur. Chaque réponse suit le même ordre : la situation, la règle et sa source, les options de chaque partie, la prochaine étape.</p></div>
      </div><div className="go-tal-p" style={{
          display: 'contents'
        }}>
      <div className="go-2c" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
            gap: '24px',
            paddingTop: '20px',
            borderTop: FC
          }}>
        {liste('Aux propriétaires', ['Avis de modification : fenêtres et délais', 'Hausse 2026 : taux de base de 3,1 % et outil du TAL', 'Loyer impayé : recours dès 3 semaines de retard', 'Reprise, éviction et moratoire de la Loi 65'])}
        {liste('Aux locataires', ['Accepter ou refuser une hausse, dans le mois', 'Reprise, éviction et protection des 65 ans et plus', 'Cession de bail et sous-location (Loi 31)', 'Réparations, urgences et accès au logement'])}</div>
      </div><div className="go-tal-p" style={{
          display: 'contents'
        }}>
      <p className="go-tal-rev" style={{
            margin: '4px 0 0',
            display: 'grid',
            gridTemplateColumns: '20px minmax(0,1fr)',
            gap: '10px',
            padding: '14px 16px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,.7)',
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'var(--bleu-100)'
          }}><Icon name="refresh-cw" size={18} color="#fff" style={{
              marginTop: '2px'
            }} /><span><strong style={{
                color: '#fff'
              }}>Révisé à chaque changement publié par le TAL ; date de révision affichée.</strong> Taux de l’année, frais en vigueur, formulaires et modèles officiels : sa base est révisée chaque janvier, chaque novembre et à chaque changement de loi.</span></p>
      {<MentionJuridique clair />}
      </div></div>
    </div>
    <div className="go-tal-demo" style={{
      position: 'relative',
      display: 'grid',
      gridTemplateRows: 'auto auto auto 1fr',
      gap: '14px',
      alignSelf: 'stretch',
      padding: '20px',
      borderRadius: '20px',
      background: '#fff',
      boxShadow: '0 12px 32px rgba(4,14,28,.25)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        paddingBottom: '14px',
        borderBottom: F
      }}><img src="/assets/img/cleo-avatar.png" alt="" style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          objectFit: 'cover'
        }} />
        <span style={{
          display: 'grid'
        }}><span style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--marine-900)'
          }}>Demandez à Cléo</span><span style={{
            fontSize: '12px',
            color: 'var(--texte-discret)'
          }}>Exemples de questions</span></span></div>
      <div role="tablist" aria-label="Je suis" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        padding: '4px',
        borderRadius: '999px',
        background: 'var(--surface-douce)',
        border: F
      }}>
        {[['proprietaires', 'Propriétaire'], ['locataires', 'Locataire']].map(([v, t]) => {
          const on = p === v;
          return <button key={v} type="button" role="tab" aria-selected={on} onClick={() => {
            setP(v);
            setK(0);
          }} style={{
            height: '40px',
            border: 0,
            borderRadius: 'var(--rayon-bouton)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 700,
            background: on ? 'var(--marine-900)' : 'transparent',
            color: on ? '#fff' : 'var(--marine-900)',
            transition: 'background 200ms'
          }}>{t}</button>;
        })}</div>
      <div style={{
        display: 'grid',
        gap: '6px'
      }}>{TAL_Q[p].map((id, j) => {
          const on = j === k;
          return <button key={id} type="button" aria-pressed={on} onClick={() => setK(j)} style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) 16px',
            gap: '10px',
            alignItems: 'center',
            minHeight: '44px',
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1px solid ' + (on ? 'var(--marine-900)' : 'var(--bordure-fine)'),
            background: on ? 'var(--bleu-025)' : '#fff',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: on ? 700 : 500,
            lineHeight: 1.4,
            color: 'var(--marine-900)'
          }}>{FQ[id].q}<Icon name="chevron-right" size={16} color="var(--marine-900)" /></button>;
        })}</div>
      <div style={{
        display: 'grid',
        alignContent: 'end'
      }}><div key={p + k} className="lls-fondu" style={{
          display: 'grid',
          gridTemplateColumns: '32px minmax(0,1fr)',
          gap: '10px',
          alignItems: 'end'
        }}><img src="/assets/img/cleo-avatar.png" alt="" style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover'
          }} />
        <div className="ll-sombre" style={{
            padding: '14px 16px',
            borderRadius: '16px 16px 16px 4px',
            background: 'var(--marine-900)',
            color: '#fff',
            fontSize: '14px',
            lineHeight: 1.6
          }}>{f.r}</div></div></div>
    </div>
  </figure>;
}
function S04Horloge() {
  return <div style={{
    display: 'grid',
    gap: '56px'
  }}>
    <CleoTAL />
    <Capacites />
  </div>;
}
const Bulle = ({
  moi,
  h,
  children
}) => <div style={{
  justifySelf: moi ? 'end' : 'start',
  maxWidth: '86%',
  display: 'grid',
  gap: '4px',
  justifyItems: moi ? 'end' : 'start'
}}>
  <div style={{
    padding: '12px 16px',
    borderRadius: moi ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    background: moi ? 'var(--bleu-500)' : 'rgba(255,255,255,.1)',
    color: '#fff',
    fontSize: '14px',
    lineHeight: 1.5
  }}>{children}</div>
  <span style={{
    fontSize: '12px',
    color: 'var(--bleu-200)',
    fontVariantNumeric: 'tabular-nums'
  }}>{h}</span></div>;
function S04Conversation() {
  return <div className="go-2c" style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
    gap: '40px',
    alignItems: 'center'
  }}>
    <figure className="ll-sombre" style={{
      position: 'relative',
      overflow: 'hidden',
      margin: 0,
      borderRadius: '20px',
      background: 'var(--degrade-marine)',
      padding: '24px',
      display: 'grid',
      gap: '14px',
      boxShadow: O2
    }}>
      <Lueur />
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        paddingBottom: '14px',
        borderBottom: FC
      }}>
        <img src="/assets/img/cleo-avatar.png" alt="" style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          objectFit: 'cover'
        }} />
        <span style={{
          display: 'grid'
        }}><span style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#fff'
          }}>Cléo</span><span style={{
            fontSize: '12px',
            color: 'var(--bleu-200)'
          }}>Agent IA · répond 24/7</span></span>
        <span style={{
          marginLeft: 'auto'
        }}><Exemple /></span></div>
      <div style={{
        position: 'relative',
        display: 'grid',
        gap: '12px'
      }}>
        <Bulle moi h="22 h 14">Bonsoir! Le 4 ½ de Montcalm est-il encore libre pour juillet?</Bulle>
        <Bulle h="22 h 14">Bonsoir. Oui, il est libre le 1er juillet, à 1 450 $ par mois, chauffage non inclus.</Bulle>
        <Bulle moi h="22 h 15">Je peux le visiter mardi en fin de journée?</Bulle>
        <Bulle h="22 h 15">Visite réservée mardi à 17 h 30, avec [Prénom Nom], gestionnaire. Confirmation envoyée par courriel.</Bulle></div>
    </figure>
    <div style={{
      display: 'grid',
      gap: '28px'
    }}>
      <ol style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        borderTop: F
      }}>{cleo().map(([ic, t, d], k) => <li key={t} style={{
          display: 'grid',
          gridTemplateColumns: '44px minmax(0,1fr)',
          gap: '18px',
          padding: '20px 0',
          borderBottom: F
        }}>
        <span style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--marine-900)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontSize: '14px',
            fontWeight: 700
          }}>{'0' + (k + 1)}</span>
        <span style={{
            display: 'grid',
            gap: '4px'
          }}><h3 style={{
              margin: 0,
              fontSize: '18px',
              letterSpacing: '-0.01em',
              color: 'var(--marine-900)'
            }}>{t}</h3><span style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'var(--texte-corps)'
            }}>{d}</span></span></li>)}</ol>
      <div><Fleche to="/cleo">Qui est Cléo</Fleche></div></div>
  </div>;
}
function S04Portrait() {
  const c = cleo();
  return <div className="go-2c" style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
    gap: '16px'
  }}>
    <figure style={{
      position: 'relative',
      margin: 0,
      borderRadius: '20px',
      overflow: 'hidden',
      background: '#1B3A60',
      minHeight: '460px'
    }}>
      <img src="/assets/img/cleo/cleo-hd.jpg" alt="Portrait de Cléo, l’agent IA de Lease Lane" style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: '50% 25%'
      }} />
      <figcaption style={{
        position: 'absolute',
        left: '16px',
        right: '16px',
        bottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '14px',
        background: 'rgba(12,33,71,.86)'
      }}>
        <span aria-hidden="true" style={{
          width: '10px',
          height: '10px',
          flex: 'none',
          borderRadius: '50%',
          background: 'var(--succes-500)',
          boxShadow: '0 0 0 3px rgba(23,121,94,.3)'
        }} />
        <span style={{
          display: 'grid'
        }}><span style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#fff'
          }}>Cléo</span><span style={{
            fontSize: '13px',
            color: 'var(--bleu-100)'
          }}>Agent IA, 24 heures sur 24</span></span></figcaption></figure>
    <div style={{
      display: 'grid',
      gap: '12px',
      alignContent: 'start'
    }}>
      {c.map(([ic, t, d], k) => {
        const m = k === c.length - 1;
        return <article key={t} className={m ? 'll-sombre' : undefined} style={{
          display: 'grid',
          gridTemplateColumns: '48px minmax(0,1fr)',
          gap: '18px',
          padding: '24px',
          borderRadius: '16px',
          background: m ? 'var(--marine-900)' : '#fff',
          border: m ? '1px solid var(--marine-900)' : F,
          boxShadow: m ? O2 : 'none'
        }}>
        <Rond ic={ic} fonce={m} /><span style={{
            display: 'grid',
            gap: '6px'
          }}><h3 style={{
              margin: 0,
              fontSize: '18px',
              letterSpacing: '-0.01em',
              color: m ? '#fff' : 'var(--marine-900)'
            }}>{t}</h3><span style={{
              fontSize: '14px',
              lineHeight: 1.6,
              color: m ? 'var(--bleu-100)' : 'var(--texte-corps)'
            }}>{d}</span></span></article>;
      })}
      <div style={{
        paddingTop: '12px'
      }}><Fleche to="/cleo">Qui est Cléo</Fleche></div></div>
  </div>;
}

/* ——— 05 · Vos décisions ——— */
const SEUIL = 'Les travaux courants sous le seuil d’autorisation que vous fixez à l’annexe B de votre contrat sont mandatés et vous en êtes informé.';
const GESTE = 'Chaque décision vous est présentée en ligne avec le dossier complet, puis consignée.';
const DECIS = [{
  ic: 'key',
  tag: 'Location',
  s: 'Dossier complet et enquête consentie : vous choisissez.',
  lieu: 'Triplex, Montcalm · logement 3',
  h: 'Candidature de Sophie Gagnon',
  dl: [['Revenus', 'Vérifiés'], ['Références', '2 sur 2'], ['Enquête de crédit', 'Consentie par écrit'], ['Entrée', '1er juillet']]
}, {
  ic: 'wrench',
  tag: 'Travaux',
  s: 'Soumissions et photos jointes avant tout engagement.',
  lieu: 'Triplex, Montcalm · logement 2',
  h: 'Remplacement du chauffe-eau',
  dl: [['Montant', '1 240 $'], ['Soumissions', '2 fournisseurs vérifiés'], ['Pièces jointes', '3 photos, 2 soumissions']]
}, {
  ic: 'trending-up',
  tag: 'Renouvellement',
  s: 'Calculée selon la méthode du TAL, soumise avant l’avis.',
  lieu: 'Triplex, Montcalm · logement 1',
  h: 'Hausse de loyer proposée',
  dl: [['Loyer actuel', '1 380 $'], ['Loyer proposé', '1 425 $'], ['Calcul', 'Méthode du TAL, détail joint'], ['Avis à envoyer', 'Avant le 31 mars']]
}, {
  ic: 'scale',
  tag: 'Recours au TAL',
  s: 'Aucun dépôt au Tribunal sans votre accord.',
  lieu: 'Duplex, Limoilou · logement 1',
  h: 'Demande au TAL pour loyer impayé',
  dl: [['Retard', '26 jours'], ['Montant dû', '1 450 $'], ['Relances', '3, sans réponse'], ['Dossier', 'Préparé par l’équipe']]
}];
function S05Approbation() {
  const m = PPC.gestion.main,
    [sel, setSel] = React.useState(1),
    [etats, setEtats] = React.useState({});
  const d = DECIS[sel],
    etat = etats[sel],
    attente = DECIS.filter((_, k) => !etats[k]).length;
  const decider = v => setEtats(s => ({
    ...s,
    [sel]: v
  }));
  const suivante = () => {
    for (let j = 1; j <= DECIS.length; j++) {
      const k = (sel + j) % DECIS.length;
      if (!etats[k]) {
        setSel(k);
        return;
      }
    }
  };
  return <div style={{
    position: 'relative',
    display: 'grid',
    gap: '32px'
  }}>
  <div className="go-2c" style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: 'minmax(0,5fr) minmax(0,6fr)',
      gap: '40px',
      alignItems: 'center'
    }}>
    <div style={{
        display: 'grid',
        gap: '18px'
      }}>
      <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
        <span style={{
            ...SUR,
            color: 'var(--bleu-600)'
          }}>Toujours soumis à votre accord</span>
        <span aria-live="polite" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--marine-900)'
          }}><span aria-hidden="true" style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: attente ? 'var(--bleu-500)' : 'var(--succes-500)',
              boxShadow: '0 0 0 4px ' + (attente ? 'rgba(42,111,219,.16)' : 'rgba(23,121,94,.16)')
            }} />{attente ? attente + ' en attente' : 'Tout est décidé'}</span></div>
      <div role="tablist" aria-label="Décisions qui vous reviennent" aria-orientation="vertical" style={{
          display: 'grid',
          gap: '8px'
        }}>
        {m.map((t, k) => {
            const on = k === sel,
              e = etats[k],
              x = DECIS[k];
            return <button key={t} type="button" role="tab" aria-selected={on} onClick={() => setSel(k)} className={on ? 'll-sombre' : undefined} style={{
              display: 'grid',
              gridTemplateColumns: '44px minmax(0,1fr) 20px',
              gap: '14px',
              alignItems: 'center',
              padding: '14px 16px 14px 14px',
              borderRadius: '16px',
              border: on ? '1px solid var(--marine-900)' : BORD,
              background: on ? 'var(--degrade-marine,var(--marine-900))' : '#fff',
              boxShadow: on ? '0 14px 32px rgba(12,33,71,.2)' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'background 240ms, box-shadow 240ms, border-color 240ms'
            }}>
          <span aria-hidden="true" style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: on ? 'rgba(255,255,255,.12)' : 'var(--marine-900)',
                display: 'grid',
                placeItems: 'center'
              }}><Icon name={x.ic} size={19} color="#fff" /></span>
          <span style={{
                display: 'grid',
                gap: '2px'
              }}><span style={{
                  fontSize: '13.6px',
                  fontWeight: 700,
                  color: on ? '#fff' : 'var(--marine-900)'
                }}>{t}</span><span style={{
                  fontSize: '11.05px',
                  lineHeight: 1.45,
                  color: on ? 'var(--bleu-100)' : 'var(--texte-discret)'
                }}>{x.s}</span></span>
          <Icon name={e === 'ok' ? 'circle-check' : e === 'non' ? 'circle-x' : 'lock'} size={18} color={on ? '#fff' : e === 'ok' ? 'var(--succes-600)' : 'var(--marine-900)'} /></button>;
          })}
      </div>
    </div>
    <div style={{
        position: 'relative',
        paddingBottom: '48px',
        perspective: '1200px'
      }}>
      {[3, 2, 1].map(n => attente > n && <span key={n} aria-hidden="true" style={{
          position: 'absolute',
          left: n * 22 + 'px',
          right: n * 22 + 'px',
          bottom: 48 - n * 16 + 'px',
          height: '120px',
          borderRadius: '20px',
          background: n === 1 ? '#fff' : n === 2 ? 'var(--surface-douce)' : 'var(--bleu-025)',
          border: '1px solid var(--bleu-100)',
          boxShadow: '0 10px 24px rgba(12,33,71,' + (.14 - n * .03) + ')',
          transform: 'rotateX(' + n * 4 + 'deg)',
          transformOrigin: '50% 100%',
          transition: 'opacity 300ms, left 300ms, right 300ms'
        }} />)}
      <article role="tabpanel" aria-label="Exemple de demande d’approbation" className="go-appr" style={{
          position: 'relative',
          background: '#fff',
          borderRadius: '20px',
          boxShadow: O2,
          border: BORD,
          overflow: 'hidden'
        }}>
        <header className="ll-sombre" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 24px',
            background: 'var(--marine-900)',
            borderBottom: '1px solid var(--marine-900)'
          }}>
          <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#fff'
            }}><Icon name="bell" size={15} color="#fff" />Approbation demandée</span><Exemple /></header>
        <div key={sel} className="lls-fondu" style={{
            padding: '24px',
            display: 'grid',
            gap: '20px'
          }}>
          <div style={{
              display: 'grid',
              gap: '8px',
              justifyItems: 'start'
            }}>
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '26px',
                padding: '0 10px',
                borderRadius: '999px',
                border: '1px solid var(--marine-900)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--marine-900)'
              }}><Icon name={d.ic} size={13} color="var(--marine-900)" />{d.tag}</span>
            <h3 style={{
                margin: '4px 0 0',
                fontSize: '20.4px',
                lineHeight: 1.322,
                letterSpacing: '-0.02em',
                color: 'var(--marine-900)'
              }}>{d.h}</h3>
            <span style={{
                fontSize: '13px',
                color: 'var(--texte-discret)'
              }}>{d.lieu}</span></div>
          <dl style={{
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0,1fr)',
              fontSize: '14px',
              borderTop: F
            }}>
            {d.dl.map(([x, y]) => <React.Fragment key={x}><dt style={{
                  padding: '11px 0',
                  borderBottom: F,
                  color: 'var(--texte-discret)'
                }}>{x}</dt><dd style={{
                  margin: 0,
                  padding: '11px 0',
                  borderBottom: F,
                  fontWeight: 600,
                  color: 'var(--marine-900)',
                  textAlign: 'right'
                }}>{y}</dd></React.Fragment>)}</dl>
          {etat ? <div role="status" className="lls-fondu" style={{
              display: 'grid',
              gap: '12px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '20px minmax(0,1fr) auto',
                gap: '10px',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: '12px',
                background: etat === 'ok' ? 'var(--succes-100)' : 'var(--surface-douce)'
              }}>
                <Icon name={etat === 'ok' ? 'circle-check' : 'circle-x'} size={18} color={etat === 'ok' ? 'var(--succes-600)' : 'var(--marine-900)'} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--marine-900)'
                }}>{etat === 'ok' ? 'Approuvé' : 'Refusé'} · consigné au dossier</span>
                <button type="button" onClick={() => setEtats(s => {
                  const n = {
                    ...s
                  };
                  delete n[sel];
                  return n;
                })} style={{
                  border: 0,
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--texte-lien)'
                }}>Revoir</button></div>
              {attente > 0 && <div><Button variant="secondaire" size="m" onClick={suivante} iconeApres={<Icon name="arrow-right" size={15} />}>Décision suivante</Button></div>}</div> : <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}><Button variant="primaire" size="m" onClick={() => decider('ok')} iconeAvant={<Icon name="check" size={15} />}>Approuver</Button><Button variant="secondaire" size="m" onClick={() => decider('non')}>Refuser</Button></div>}
        </div></article>
    </div>
  </div>
  <div className="go-2c" style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: '24px',
      paddingTop: '28px',
      borderTop: BORD
    }}>
    {[['circle-check', 'Approbation en un geste', GESTE], ['info', 'Sous votre seuil', SEUIL]].map(([ic, t, d]) => <div key={t} style={{
        display: 'grid',
        gridTemplateColumns: '20px minmax(0,1fr)',
        gap: '12px'
      }}>
      <Icon name={ic} size={18} color="var(--bleu-600)" style={{
          marginTop: '1px'
        }} /><span style={{
          display: 'grid',
          gap: '4px'
        }}><strong style={{
            fontSize: '15px',
            color: 'var(--marine-900)'
          }}>{t}</strong><span style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'var(--texte-corps)'
          }}>{gab(d)}</span></span></div>)}</div>
  </div>;
}
function S05Partage() {
  const m = PPC.gestion.main,
    nous = ['Collecte des loyers', 'Communications avec les locataires', 'Paiement des factures', 'Travaux courants sous votre seuil d’autorisation (annexe B)'];
  const Col = ({
    fonce,
    ic,
    t,
    s,
    items
  }) => <section className={fonce ? 'll-sombre' : undefined} style={{
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '20px',
    background: fonce ? 'var(--degrade-marine)' : '#fff',
    border: fonce ? 0 : F,
    padding: '32px',
    display: 'grid',
    gap: '24px',
    alignContent: 'start'
  }}>
    {fonce && <Lueur />}
    <header style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    }}><Rond ic={ic} fonce={fonce} /><span style={{
        display: 'grid',
        gap: '2px'
      }}>
      <h3 style={{
          margin: 0,
          fontSize: '24px',
          letterSpacing: '-0.02em',
          color: fonce ? '#fff' : 'var(--marine-900)'
        }}>{t}</h3><span style={{
          fontSize: '13px',
          color: fonce ? 'var(--bleu-200)' : 'var(--texte-discret)'
        }}>{s}</span></span></header>
    <ul style={{
      position: 'relative',
      listStyle: 'none',
      margin: 0,
      padding: 0
    }}>{items.map(x => <li key={x} style={{
        display: 'grid',
        gridTemplateColumns: '20px minmax(0,1fr)',
        gap: '12px',
        padding: '13px 0',
        borderTop: fonce ? FC : F,
        fontSize: '14px',
        lineHeight: 1.5,
        color: fonce ? '#fff' : 'var(--marine-900)'
      }}>
      <Icon name={fonce ? 'lock' : 'check'} size={16} color={fonce ? 'var(--bleu-300)' : 'var(--bleu-600)'} style={{
          marginTop: '2px'
        }} /><span>{gab(x)}</span></li>)}</ul></section>;
  return <div style={{
    display: 'grid',
    gap: '16px'
  }}>
    <div className="go-2c" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
      gap: '16px'
    }}>
      <Col fonce ic="user" t="Vous décidez" s="Soumis à votre accord, en ligne" items={m} />
      <Col ic="building-2" t="Nous nous en occupons" s="Mandaté, vous en êtes informé" items={nous} /></div>
    <Note icone="circle-check" titre="Approbation en un geste">{GESTE}</Note>
  </div>;
}
function S05Tuiles() {
  const m = PPC.gestion.main;
  return <div style={{
    display: 'grid',
    gap: '28px'
  }}>
    <ol className="go-2c" style={{
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: '16px'
    }}>{m.map((t, k) => {
        const f = k === 0 || k === 3;
        return <li key={t} className={f ? 'll-sombre' : undefined} style={{
          display: 'grid',
          alignContent: 'space-between',
          gap: '40px',
          minHeight: '200px',
          padding: '28px',
          borderRadius: '20px',
          background: f ? 'var(--marine-900)' : 'var(--bleu-025)'
        }}>
        <span style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}><span style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '.14em',
              color: f ? 'var(--bleu-300)' : 'var(--bleu-600)'
            }}>{'0' + (k + 1)}</span>
          <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: f ? 'var(--bleu-100)' : 'var(--bleu-700)'
            }}><Icon name="lock" size={13} color="currentColor" />Votre accord</span></span>
        <span style={{
            fontSize: 'clamp(22px,2vw,26px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            color: f ? '#fff' : 'var(--marine-900)',
            textWrap: 'balance'
          }}>{t}</span></li>;
      })}</ol>
    <div className="go-2c" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      gap: '24px'
    }}>
      {[['circle-check', 'Approbation en un geste', GESTE], ['info', 'Sous votre seuil', SEUIL]].map(([ic, t, d]) => <div key={t} style={{
        display: 'grid',
        gridTemplateColumns: '20px minmax(0,1fr)',
        gap: '12px'
      }}>
        <Icon name={ic} size={18} color="var(--bleu-600)" style={{
          marginTop: '1px'
        }} /><span style={{
          display: 'grid',
          gap: '4px'
        }}><strong style={{
            fontSize: '15px',
            color: 'var(--marine-900)'
          }}>{t}</strong><span style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'var(--texte-corps)'
          }}>{gab(d)}</span></span></div>)}</div>
  </div>;
}

/* ——— 06 · Nos engagements ——— */
const eng = () => PPC.gestion.engagements;
function S06Bande() {
  return <div className="ll-sombre" style={{
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '20px',
    background: 'var(--degrade-marine)',
    padding: 'clamp(28px,3vw,44px)',
    display: 'grid',
    gap: '28px'
  }}>
    <Lueur />
    <div style={{
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px'
    }}><span style={{
        ...SUR,
        color: 'var(--bleu-300)'
      }}>Mesurés chaque mois</span><Exemple /></div>
    <div className="go-4c" style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      rowGap: '28px'
    }}>{eng().map(([v, t, d], i) => <dl key={t} style={{
        margin: 0,
        display: 'grid',
        gap: '8px',
        alignContent: 'start',
        padding: '4px 20px',
        paddingLeft: i ? '20px' : 0,
        borderLeft: i ? FC : 'none'
      }}>
      <dd style={{
          order: 1,
          margin: 0,
          fontSize: 'clamp(40px,3.6vw,54px)',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: '#fff',
          whiteSpace: 'nowrap'
        }}>{v}</dd>
      <dt style={{
          order: 2,
          fontSize: '15px',
          fontWeight: 700,
          color: '#fff',
          marginTop: '10px'
        }}>{t}</dt>
      <dd style={{
          order: 3,
          margin: 0,
          fontSize: '14px',
          color: 'var(--bleu-100)'
        }}>{d}</dd></dl>)}</div>
  </div>;
}
/* Visuels des quatre engagements : même empreinte (64 px de haut), alignés à gauche, centrés verticalement. */
const VIZ = [() => <span style={{
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: 'conic-gradient(var(--bleu-500) 0 12deg,var(--bleu-100) 12deg 360deg)',
  display: 'grid',
  placeItems: 'center'
}}><span style={{
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: '#fff',
    display: 'grid',
    placeItems: 'center'
  }}><Icon name="clock" size={20} color="var(--bleu-600)" /></span></span>, () => <span style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(8,minmax(0,12px))',
  alignItems: 'end',
  gap: '5px',
  height: '64px',
  width: '100%'
}}>{Array.from({
    length: 8
  }, (_, i) => <span key={i} style={{
    height: 22 + i * 6 + 'px',
    borderRadius: '4px',
    background: i < 4 ? 'var(--bleu-500)' : 'var(--bleu-100)'
  }} />)}</span>, () => <span style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(7,9px)',
  gap: '4px',
  alignContent: 'center',
  height: '64px'
}}>{Array.from({
    length: 30
  }, (_, i) => <span key={i} style={{
    width: '9px',
    height: '9px',
    borderRadius: '3px',
    background: i === 14 ? 'var(--marine-900)' : i < 14 ? 'var(--bleu-200)' : 'var(--bleu-050,var(--bleu-025))',
    boxShadow: i === 14 ? '0 0 0 2px #fff,0 0 0 4px var(--bleu-500)' : 'none'
  }} />)}</span>, () => <span style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,48px))',
  gap: '6px',
  width: '100%'
}}>{['J1', 'J2', 'J3'].map((j, i) => <span key={j} style={{
    height: '48px',
    borderRadius: '10px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '13px',
    fontWeight: 700,
    color: '#fff',
    background: 'var(--bleu-' + ['300', '400', '600'][i] + ')'
  }}>{j}</span>)}</span>];
/* Quatre blocs : visuel, valeur, intitulé — sans sous-texte; mêmes marges internes et même rythme vertical d'un bloc à l'autre. */
function S06Visuels() {
  return <div className="go-4c" style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
    gap: '16px'
  }}>{eng().map(([v, t], i) => {
      const V = VIZ[i];
      return <article key={t} className="lls-carte" style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid var(--marine-900)',
        borderBottomWidth: '3px',
        boxShadow: O1,
        padding: '28px',
        display: 'grid',
        gridTemplateRows: '64px auto auto',
        alignContent: 'start',
        rowGap: '0'
      }}>
      <div aria-hidden="true" style={{
          display: 'flex',
          alignItems: 'center',
          height: '64px'
        }}><V /></div>
      <span style={{
          marginTop: '28px',
          fontSize: '40px',
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1,
          color: 'var(--marine-900)',
          whiteSpace: 'nowrap'
        }}>{v}</span>
      <h3 style={{
          margin: '14px 0 0',
          fontSize: '15px',
          fontWeight: 700,
          lineHeight: 1.4,
          color: 'var(--marine-900)',
          textWrap: 'balance'
        }}>{t}</h3></article>;
    })}</div>;
}
function S06Rapport() {
  const mois = ['1 min 40 s', '3 h 10', '14 sept.', '48 h'],
    th = {
      textAlign: 'left',
      padding: '12px 24px',
      fontSize: '12px',
      fontWeight: 600,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--texte-discret)',
      background: 'var(--surface-douce)'
    };
  return <article style={{
    background: '#fff',
    borderRadius: '20px',
    boxShadow: O2,
    border: F,
    overflow: 'hidden'
  }}>
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      padding: '20px 24px',
      borderBottom: F
    }}>
      <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}><Rond ic="file-text" t={44} /><span style={{
          display: 'grid',
          gap: '2px'
        }}><span style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--marine-900)'
          }}>Rapport mensuel · septembre 2026</span><span style={{
            fontSize: '13px',
            color: 'var(--texte-discret)'
          }}>Triplex, Montcalm · section « Nos engagements »</span></span></span><Exemple /></header>
    <div style={{
      overflowX: 'auto'
    }}><table style={{
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: '600px',
        fontSize: '14px'
      }}>
      <thead><tr>{['Engagement', 'Cible', 'Ce mois-ci', 'Statut'].map(c => <th key={c} scope="col" style={th}>{c}</th>)}</tr></thead>
      <tbody>{eng().map(([v, t, d], i) => <tr key={t} style={{
            borderTop: F
          }}>
        <td style={{
              padding: '18px 24px'
            }}><span style={{
                display: 'block',
                fontWeight: 700,
                color: 'var(--marine-900)'
              }}>{t}</span><span style={{
                display: 'block',
                fontSize: '13px',
                color: 'var(--texte-discret)'
              }}>{d}</span></td>
        <td style={{
              padding: '18px 24px',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--marine-900)',
              whiteSpace: 'nowrap'
            }}>{v}</td>
        <td style={{
              padding: '18px 24px',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--bleu-600)',
              whiteSpace: 'nowrap'
            }}>{mois[i]}</td>
        <td style={{
              padding: '18px 24px'
            }}><span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '28px',
                padding: '0 12px',
                borderRadius: '999px',
                background: 'var(--succes-100)',
                color: 'var(--succes-600)',
                fontSize: '13px',
                fontWeight: 600
              }}><Icon name="circle-check" size={14} color="currentColor" />Respecté</span></td></tr>)}</tbody></table></div>
    <footer style={{
      padding: '14px 24px',
      background: 'var(--surface-douce)',
      borderTop: F,
      fontSize: '13px',
      color: 'var(--texte-discret)'
    }}>Présentés dans votre rapport du 15 et dans votre tableau de bord.</footer>
  </article>;
}

/* ——— Offre de service ——— */
const OF = {
  titre: 'Recevez une offre pour votre immeuble.',
  texte: 'Deux étapes, deux minutes. Nous revenons en un jour ouvrable avec une offre écrite et un moment pour en parler.',
  coches: ['Accusé de réception immédiat', 'Appel de 30 minutes au moment choisi', 'Offre écrite, services détaillés', 'Aucun engagement'],
  suite: [['Accusé de réception', 'Immédiat, par courriel, avec votre numéro de dossier.'], ['Appel de 30 minutes', 'Au moment que vous choisissez, avec une personne de l’équipe.'], ['Offre écrite', 'Services compris, responsabilités et échéancier de transition.']]
};

/* Offre guidée : en-tête centré, une question à la fois, fond bleu très pâle, chevrons discrets. */

function OffreGuidee({
  barre
}) {
  const T = PP_TYPES,
    PI = PictoImmeuble,
    B = LLBandes;
  const [et, setEt] = React.useState(0),
    [type, setType] = React.useState(null),
    [nb, setNb] = React.useState(null),
    [nom, setNom] = React.useState(''),
    [mail, setMail] = React.useState(''),
    [tel, setTel] = React.useState(''),
    [err, setErr] = React.useState({}),
    [envoye, setEnvoye] = React.useState(false);
  const avancer = (fn, v) => {
    fn(v);
    setTimeout(() => setEt(e => e + 1), 220);
  };
  const envoyer = e => {
    e.preventDefault();
    const x = {};
    if (!nom.trim()) x.nom = 'Indiquez votre nom.';
    if (!/^\S+@\S+\.\S+$/.test(mail)) x.mail = 'Indiquez un courriel valide.';
    setErr(x);
    if (!Object.keys(x).length) setEnvoye(true);
  };
  const recommencer = () => {
    setEnvoye(false);
    setEt(0);
    setType(null);
    setNb(null);
    setNom('');
    setMail('');
    setTel('');
    setErr({});
  };
  const Q = ['Quel type d’immeuble possédez-vous?', 'Combien de logements compte-t-il?', 'Où pouvons-nous vous joindre?'];
  return <section style={{
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--bleu-025)'
  }}>
    <div style={{
      ...CONT,
      position: 'relative',
      padding: 'var(--web-section) var(--web-gouttiere)',
      display: 'grid',
      gap: '40px'
    }}>{barre}
      <div style={{
        display: 'grid',
        justifyItems: 'center',
        gap: '18px',
        textAlign: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          display: 'grid',
          justifySelf: 'center',
          gap: '12px',
          marginBottom: '14.35px'
        }}><span style={{
            ...SUR,
            color: 'var(--bleu-600)'
          }}>Soumission gratuite - Gestion d’immeubles</span><span aria-hidden="true" style={{
            display: 'block',
            height: '1.3px',
            background: 'var(--marine-900)'
          }} /></span>
        <h2 style={{
          margin: 0,
          fontSize: 'var(--titre-xl)',
          lineHeight: 1.242,
          letterSpacing: '-0.03em',
          color: 'var(--marine-900)',
          maxWidth: '24ch',
          textWrap: 'balance'
        }}>{gab('Obtenez votre soumission {dès maintenant}. Un processus gratuit et sans engagements.')}</h2>
</div>
      <div style={{
        width: '100%',
        maxWidth: '920px',
        justifySelf: 'center',
        background: '#fff',
        borderRadius: '24px',
        border: '1px solid rgba(12,33,71,.16)',
        boxShadow: O2,
        padding: 'clamp(24px,3.5vw,40px)'
      }}>{<FormOffreP />}</div>
      <div style={{
        width: '100%',
        maxWidth: '920px',
        justifySelf: 'center',
        display: 'grid',
        gap: '33.6px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}><span aria-hidden="true" style={{
            flex: 1,
            height: '1px',
            background: 'var(--bordure-fine)'
          }} /><span style={{
            ...SUR,
            color: 'var(--marine-900)',
            whiteSpace: 'nowrap'
          }}>Ce qui suit votre demande</span><span aria-hidden="true" style={{
            flex: 1,
            height: '1px',
            background: 'var(--bordure-fine)'
          }} /></div>
        <ol className="go-suite2" style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(' + OF.suite.length + ',minmax(0,1fr))',
          gap: '32px'
        }}>
          <span aria-hidden="true" className="go-suite2-l" style={{
            position: 'absolute',
            top: '17px',
            left: 'calc(' + 50 / OF.suite.length + '% - ' + 16 * (OF.suite.length - 1) / OF.suite.length + 'px)',
            right: 'calc(' + 50 / OF.suite.length + '% - ' + 16 * (OF.suite.length - 1) / OF.suite.length + 'px)',
            height: '1px',
            background: 'var(--marine-900)',
            opacity: .25
          }} />
          {OF.suite.map(([t, d], k) => {
            const fait = envoye && k === 0;
            return <li key={t} className="go-suite2-i" style={{
              position: 'relative',
              display: 'grid',
              gap: '14px',
              alignContent: 'start',
              justifyItems: 'center',
              textAlign: 'center'
            }}>
            <span style={{
                width: '36px',
                height: '36px',
                boxSizing: 'border-box',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: '13px',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                background: fait || k === 0 ? 'var(--marine-900)' : 'var(--bleu-025)',
                color: fait || k === 0 ? '#fff' : 'var(--marine-900)',
                border: '1.5px solid var(--marine-900)',
                boxShadow: '0 0 0 6px var(--bleu-025)'
              }}>{fait ? <Icon name="check" size={15} color="#fff" /> : '0' + (k + 1)}</span>
            <span style={{
                display: 'grid',
                gap: '6px',
                justifyItems: 'center'
              }}><strong style={{
                  fontSize: '16px',
                  letterSpacing: '-0.01em',
                  color: 'var(--marine-900)'
                }}>{t}</strong><span style={{
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: 'var(--texte-corps)',
                  maxWidth: '32ch'
                }}>{d}</span></span></li>;
          })}</ol></div>
    </div></section>;
}
function GestionOffre({
  actuel
}) {
  const [o, set] = GO_useRevue('offre3');
  const barre = <GO_BasculeRevue n="offre de service" noms={['Guidée']} o={o} set={set} />;
  const C = [null, OffreGuidee][+o];
  return <div id="offre" key={o} className="lls-fondu">{C ? <C barre={barre} /> : <div style={{
      background: '#fff'
    }}><div style={{
        ...CONT,
        paddingTop: '40px',
        display: 'grid'
      }}>{barre}</div>{actuel}</div>}</div>;
}
const GestionS04 = ({
  actuel
}) => <GO_OptionsSection k="s04" n="04" noms={['Horloge 24 h', 'Conversation', 'Portrait']} actuel={actuel} options={[<S04Horloge />, <S04Conversation />, <S04Portrait />]} />;
const GestionS05 = ({
  actuel
}) => <GO_OptionsSection k="s05" n="05" noms={['Approbation', 'Vous / nous', 'Quatre tuiles']} actuel={actuel} options={[<S05Approbation />, <S05Partage />, <S05Tuiles />]} />;
const GestionS06 = ({
  actuel
}) => <GO_OptionsSection k="s06" n="06" noms={['Bande marine', 'Visuels', 'Extrait du rapport']} actuel={actuel} options={[<S06Bande />, <S06Visuels />, <S06Rapport />]} />;
export { CleoTAL, GestionS04, GestionS05, GestionS06, GestionOffre };
