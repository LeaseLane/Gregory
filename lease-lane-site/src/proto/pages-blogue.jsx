/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pages-blogue.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { gab, AppelFinal } from '@/proto/blocs';
import { PBHeros } from '@/proto/pages-proprio-b';
import { __ssr } from '@/lib/hydratation';
const MAR = '#0C2147',
  BL6 = '#3767A2',
  TXT = '#3E4A59',
  DIS = '#58697F',
  BD = '1px solid rgba(12,33,71,.16)',
  FIN = '1px solid var(--bordure-fine)';
const BOITE = {
  maxWidth: 'var(--web-conteneur)',
  margin: '0 auto',
  padding: 'var(--web-section) var(--web-gouttiere)',
  boxSizing: 'border-box'
};
const g = t => gab ? gab(t) : t;
const CATS = [['tous', 'Tous les articles'], ['proprietaires', 'Propriétaires'], ['locataires', 'Locataires'], ['droit', 'Droit du logement'], ['nouvelles', 'Nouvelles Lease Lane']];
const AUTEURS = {
  jt: {
    nom: '[Prénom Nom]',
    role: 'Administration et baux',
    bio: 'Responsable des baux, des cessions et des dossiers au TAL chez Lease Lane.',
    ini: 'P N'
  },
  cd: {
    nom: '[Prénom Nom]',
    role: 'Gestionnaire immobilière',
    bio: 'Accompagne les propriétaires dans la gestion de leurs immeubles.',
    ini: 'P N'
  },
  rev: {
    nom: '[Nom du réviseur]',
    role: '[Avocat ou notaire, membre du Barreau ou de la Chambre des notaires]',
    bio: 'Révision juridique indépendante des articles de droit du logement.',
    ini: 'R'
  }
};
const ARTICLES = [{
  slug: 'hausse-de-loyer-2026',
  cat: 'droit',
  t: 'Hausse de loyer 2026 : délais, calcul et recours au TAL',
  r: 'Les fenêtres d’avis, le taux de base publié par le TAL et ce que chaque partie peut faire, étape par étape.',
  d: '2026-01-20',
  m: '2026-10-08',
  min: 7,
  aut: 'jt',
  une: 1
}, {
  slug: 'cession-de-bail-loi-31',
  cat: 'locataires',
  t: 'Cession de bail : ce qui change avec la Loi 31',
  r: 'Avis, délai de réponse du propriétaire et motifs sérieux de refus.',
  d: '2025-11-12',
  m: '2025-11-12',
  min: 5,
  aut: 'jt'
}, {
  slug: 'logement-vacant-cout',
  cat: 'proprietaires',
  t: 'Combien coûte vraiment un logement vacant?',
  r: 'Le calcul jour par jour, et les leviers qui raccourcissent la période de location.',
  d: '2025-10-02',
  m: '2025-10-02',
  min: 4,
  aut: 'cd'
}, {
  slug: 'urgences-locatives',
  cat: 'locataires',
  t: 'Fuite, chauffage, serrure : qu’est-ce qu’une urgence?',
  r: 'Les quatre niveaux d’urgence et qui appeler, à toute heure.',
  d: '2025-09-18',
  m: '2025-09-18',
  min: 3,
  aut: 'cd'
}, {
  slug: 'cleo-tal',
  cat: 'nouvelles',
  t: 'Cléo explique maintenant les règles du TAL',
  r: 'Ce que l’agent IA peut répondre, ses limites et le relais humain.',
  d: '2025-08-27',
  m: '2025-08-27',
  min: 3,
  aut: 'cd'
}, {
  slug: 'depot-de-garantie',
  cat: 'droit',
  t: 'Dépôt de garantie : pourquoi il est interdit au Québec',
  r: 'Ce que le propriétaire peut exiger, et ce qu’il ne peut pas.',
  d: '2025-08-05',
  m: '2025-08-05',
  min: 4,
  aut: 'jt'
}];
const catNom = k => (CATS.find(c => c[0] === k) || [])[1];
const dateFr = iso => {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return iso;
  }
};
/* Données structurées : injectées dans <head> le temps de la page. Nom encore en gabarit : l'organisation signe à sa place. */
const gabarit = n => /\[/.test(n || ''),
  ORG_AUTEUR = {
    '@type': 'Organization',
    '@id': 'https://leaselane.ai/#organisation',
    name: 'Lease Lane',
    url: 'https://leaselane.ai/',
    logo: {
      '@type': 'ImageObject',
      url: 'https://leaselane.ai/logo-lease-lane.png'
    }
  };
function useJsonLd(id, data) {
  React.useEffect(() => {
    const s = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.createElement('script') : undefined;
    s.type = 'application/ld+json';
    s.id = id;
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
    return () => s.remove();
  }, [id]);
}
const Meta = ({
  a,
  clair
}) => <span style={{
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '6px 14px',
  fontSize: '13px',
  color: clair ? 'var(--bleu-100)' : DIS
}}>
  <span style={{
    fontWeight: 700,
    color: clair ? '#fff' : BL6
  }}>{catNom(a.cat)}</span><time dateTime={a.d}>{dateFr(a.d)}</time><span>{a.min} min de lecture</span></span>;
const Photo = ({
  id,
  h,
  lab,
  cls
}) => <div className={cls} style={{
  position: 'relative',
  height: h,
  minHeight: cls ? '340px' : undefined,
  background: 'linear-gradient(160deg,#EAF1FA,#D5E2F2)',
  overflow: 'hidden'
}}><image-slot id={id} shape="rect" placeholder={lab} style={{
    display: 'block',
    width: '100%',
    height: '100%'
  }}></image-slot></div>;
const lien = s => "/blogue/" + s;
function CarteArticle({
  a,
  i
}) {
  return <article className="bl-carte fn-in" style={{
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    border: BD,
    borderRadius: '18px',
    overflow: 'hidden',
    animationDelay: Math.min(i, 6) * 50 + 'ms'
  }}>
  <Photo id={'bl-img-' + a.slug} h="190px" lab={'Image · ' + a.t} />
  <div style={{
      display: 'grid',
      gap: '10px',
      padding: '22px 22px 24px',
      flex: 1,
      alignContent: 'start'
    }}>
    <Meta a={a} />
    <h3 className="bl-t" style={{
        margin: 0,
        fontSize: '19px',
        lineHeight: 1.35,
        letterSpacing: '-0.015em',
        color: MAR,
        transition: 'color 200ms'
      }}><a href={lien(a.slug)} style={{
          color: 'inherit',
          textDecoration: 'none'
        }}><span aria-hidden="true" style={{
            position: 'absolute',
            inset: 0
          }} />{a.t}</a></h3>
    <p style={{
        margin: 0,
        fontSize: '14px',
        lineHeight: 1.6,
        color: TXT
      }}>{a.r}</p>
    <span aria-hidden="true" style={{
        marginTop: 'auto',
        paddingTop: '8px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: 650,
        color: MAR
      }}>Lire l’article<span className="bl-fl" style={{
          display: 'grid'
        }}><Icon name="arrow-right" size={15} color={MAR} /></span></span></div></article>;
}
function PageBlogue({
  route
}) {
  const [cat, setCat] = React.useState('tous'),
    [q, setQ] = React.useState('');
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const L = ARTICLES.filter(a => (cat === 'tous' || a.cat === cat) && (!q || norm(a.t + ' ' + a.r).includes(norm(q))));
  const une = cat === 'tous' && !q ? ARTICLES.find(a => a.une) : null,
    reste = une ? L.filter(a => a !== une) : L;
  useJsonLd('ld-blogue', {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blogue & nouvelles · Lease Lane',
    url: 'https://leaselane.ai/blogue',
    inLanguage: 'fr-CA',
    publisher: ORG_AUTEUR,
    blogPost: ARTICLES.map(a => ({
      '@type': 'BlogPosting',
      headline: a.t,
      datePublished: a.d,
      dateModified: a.m,
      url: 'https://leaselane.ai/blogue/' + a.slug,
      author: gabarit(AUTEURS[a.aut].nom) ? ORG_AUTEUR : {
        '@type': 'Person',
        name: AUTEURS[a.aut].nom
      }
    }))
  });
  const H = typeof PBHeros !== 'undefined' ? PBHeros : null;
  return <div>
    {H && <H route={route} titre="Blogue & nouvelles sur la {gestion immobilière} à Québec" lead="Droit du logement, gestion d’immeubles et nouvelles de Lease Lane. Chaque article est rédigé par notre équipe, révisé et daté, avec ses sources." />}
    <section aria-labelledby="bl-liste" style={{
      background: '#fff'
    }}><div style={{
        ...BOITE,
        display: 'grid',
        gap: '40px'
      }}>
      <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
        <h2 id="bl-liste" style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)'
          }}>Articles</h2>
        <div role="group" aria-label="Filtrer par sujet" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>{CATS.map(([k, t]) => {
              const on = cat === k;
              return <button key={k} type="button" aria-pressed={on} onClick={() => setCat(k)} className="bl-filtre" style={{
                height: '44px',
                padding: '0 16px',
                borderRadius: '10px',
                border: on ? '1px solid ' + MAR : BD,
                background: on ? MAR : '#fff',
                color: on ? '#fff' : MAR,
                fontFamily: 'var(--police-corps)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}>{t}</button>;
            })}</div>
        {/* Mobile : les sujets deviennent un menu déroulant (responsive.css masque les boutons à ≤ 620 px) */}
        <label className="bl-choix"><span style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)'
            }}>Filtrer par sujet</span>
          <select value={cat} onChange={e => setCat(e.target.value)}>{CATS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
          <span aria-hidden="true" className="bl-choix-ic"><Icon name="chevron-down" size={18} color={MAR} /></span></label>
        <label style={{
            position: 'relative',
            flex: '0 1 320px'
          }}><span style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)'
            }}>Rechercher un article</span>
          <span aria-hidden="true" style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'grid'
            }}><Icon name="search" size={16} color={BL6} /></span>
          <input className="go-champ" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un article" style={{
              width: '100%',
              height: '48px',
              padding: '0 14px 0 42px',
              boxSizing: 'border-box'
            }} /></label></div>
      {une && <article className="bl-carte bl-une" style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,1fr)',
          background: '#fff',
          border: BD,
          borderRadius: '22px',
          overflow: 'hidden'
        }}>
        <Photo cls="bl-une-ph" id={'bl-img-' + une.slug + '-une'} h="100%" lab={'Image · ' + une.t} />
        <div style={{
            display: 'grid',
            gap: '16px',
            alignContent: 'center',
            padding: 'clamp(28px,4vw,52px)'
          }}>
          <span style={{
              justifySelf: 'start',
              height: '28px',
              padding: '0 10px',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '8px',
              background: '#F3F7FC',
              fontSize: '12px',
              fontWeight: 700,
              color: MAR
            }}>À la une</span>
          <Meta a={une} />
          <h3 className="bl-t" style={{
              margin: 0,
              fontSize: 'clamp(24px,2.4vw,32px)',
              lineHeight: 1.25,
              letterSpacing: '-0.025em',
              color: MAR,
              textWrap: 'balance',
              transition: 'color 200ms'
            }}><a href={lien(une.slug)} style={{
                color: 'inherit',
                textDecoration: 'none'
              }}><span aria-hidden="true" style={{
                  position: 'absolute',
                  inset: 0
                }} />{une.t}</a></h3>
          <p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.65,
              color: TXT
            }}>{une.r}</p>
          <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: DIS
            }}><span aria-hidden="true" style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: MAR,
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontSize: '12px',
                fontWeight: 700
              }}>{AUTEURS[une.aut].ini}</span>Par <strong style={{
                color: MAR
              }}>{AUTEURS[une.aut].nom}</strong> · révisé par un juriste</span></div></article>}
      <span aria-live="polite" style={{
          fontSize: '13px',
          fontWeight: 600,
          color: DIS
        }}>{L.length} article{L.length > 1 ? 's' : ''}{cat !== 'tous' ? ' · ' + catNom(cat) : ''}</span>
      {reste.length ? <div className="bl-g3" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
          gap: '20px'
        }}>{reste.map((a, i) => <CarteArticle key={a.slug} a={a} i={i} />)}</div> : !une && <p style={{
          margin: 0,
          padding: '40px 0',
          fontSize: '14px',
          color: TXT
        }}>Aucun article pour cette recherche. Essayez un autre mot ou un autre sujet.</p>}
    </div></section>
    {<AppelFinal surtitre="Une question précise?" titre="Cléo répond {en tout temps}." texte="Une règle du TAL, une visite, une urgence : écrivez-lui, il répond 24/7 et passe la main à l’équipe au besoin." bouton="Écrire à Cléo" to="#cleo" />}
  </div>;
}

/* ——— Article ——— */
const A0 = ARTICLES[0];
const SRC = [['Code civil du Québec, art. 1942 (avis de modification du bail)', 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/CCQ-1991', 'LégisQuébec'], ['Code civil du Québec, art. 1945 et 1947 (réponse du locataire, demande de fixation)', 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/CCQ-1991', 'LégisQuébec'], ['Tribunal administratif du logement · Calcul de l’augmentation de loyer [année à valider]', 'https://www.tal.gouv.qc.ca/', 'TAL'], ['Tribunal administratif du logement · Modèle d’avis d’augmentation de loyer', 'https://www.tal.gouv.qc.ca/', 'TAL'], ['Code civil du Québec, art. 1950 et 1955 (loyer du nouveau locataire, immeuble neuf)', 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/CCQ-1991', 'LégisQuébec']];
const SECTIONS = [['reponse', 'La réponse courte'], ['delais', 'Les délais de l’avis'], ['calcul', 'Le calcul de la hausse'], ['calendrier', 'Un exemple de calendrier'], ['reponse-loc', 'La réponse du locataire'], ['tal', 'Le recours au TAL'], ['cas', 'Deux cas particuliers'], ['erreurs', 'Les erreurs à éviter'], ['faq', 'Questions fréquentes'], ['sources', 'Sources']];
const FQ = [['Le propriétaire peut-il augmenter le loyer en cours de bail?', 'Non, sauf si le bail le prévoit expressément pour un bail de plus de 12 mois. La modification prend effet au renouvellement.'], ['Que se passe-t-il si le locataire ne répond pas à l’avis?', 'Son silence vaut acceptation de la hausse : le bail est reconduit aux nouvelles conditions.'], ['Le taux du TAL est-il obligatoire?', 'Non. Il sert de référence au calcul; les parties peuvent s’entendre sur un autre montant. En cas de désaccord, le TAL fixe le loyer.']];
const Ref = ({
  n
}) => <sup><a href={'#src-' + n} aria-label={'Source ' + n}>[{n}]</a></sup>;
function PageArticle({
  route
}) {
  const a = A0,
    au = AUTEURS[a.aut],
    rv = AUTEURS.rev,
    [act, setAct] = React.useState(SECTIONS[0][0]);
  React.useEffect(() => {
    const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;
    if (!sc) return;
    const f = () => {
      const h = sc.getBoundingClientRect().top + 160;
      let x = SECTIONS[0][0];
      SECTIONS.forEach(([id]) => {
        const el = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById(id) : undefined;
        if (el && el.getBoundingClientRect().top <= h) x = id;
      });
      setAct(x);
    };
    f();
    sc.addEventListener('scroll', f, {
      passive: true
    });
    return () => sc.removeEventListener('scroll', f);
  }, []);
  const aller = id => e => {
    e.preventDefault();
    const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined,
      el = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById(id) : undefined;
    if (sc && el) sc.scrollTo({
      top: el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 130,
      behavior: 'smooth'
    });
  };
  const url = 'https://leaselane.ai/blogue/' + a.slug;
  useJsonLd('ld-article', [{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.t,
    description: a.r,
    inLanguage: 'fr-CA',
    datePublished: a.d,
    dateModified: a.m,
    mainEntityOfPage: url,
    image: url + '/couverture.jpg',
    author: gabarit(au.nom) ? ORG_AUTEUR : {
      '@type': 'Person',
      name: au.nom,
      jobTitle: au.role,
      worksFor: {
        '@type': 'Organization',
        name: 'Lease Lane'
      },
      url: 'https://leaselane.ai/a-propos'
    },
    ...(gabarit(rv.nom) ? {} : {
      reviewedBy: {
        '@type': 'Person',
        name: rv.nom,
        jobTitle: rv.role
      }
    }),
    publisher: ORG_AUTEUR,
    citation: SRC.map(s => s[0]),
    about: ['Augmentation de loyer', 'Tribunal administratif du logement', 'Bail résidentiel au Québec']
  }, {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FQ.map(([q, r]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: r
      }
    }))
  }]);
  const H = typeof PBHeros !== 'undefined' ? PBHeros : null;
  const Pers = ({
    p,
    lab
  }) => <div style={{
    display: 'grid',
    gridTemplateColumns: '44px minmax(0,1fr)',
    gap: '12px',
    alignItems: 'center'
  }}><span aria-hidden="true" style={{
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      background: 'rgba(255,255,255,.12)',
      border: '1px solid rgba(255,255,255,.24)',
      color: '#fff',
      display: 'grid',
      placeItems: 'center',
      fontSize: '14px',
      fontWeight: 700
    }}>{p.ini}</span>
    <span style={{
      display: 'grid',
      gap: '1px'
    }}><span style={{
        fontSize: '12px',
        color: 'var(--bleu-200)'
      }}>{lab}</span><span style={{
        fontSize: '14px',
        fontWeight: 650,
        color: '#fff'
      }}>{g(p.nom)}</span><span style={{
        fontSize: '12px',
        color: 'var(--bleu-100)'
      }}>{g(p.role)}</span></span></div>;
  return <article itemScope itemType="https://schema.org/Article">
    {H && <H route={route} titre={a.t} lead={a.r}>
      <dl className="bl-meta" style={{
        margin: '8px 0 0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        gap: '16px 0',
        width: 'fit-content',
        maxWidth: '100%',
        paddingTop: '24px',
        borderTop: '1px solid rgba(255,255,255,.16)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          paddingRight: '24px'
        }}>
          <span aria-hidden="true" style={{
            width: '44px',
            height: '44px',
            flex: 'none',
            borderRadius: '12px',
            background: 'rgba(255,255,255,.12)',
            border: '1px solid rgba(255,255,255,.24)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontSize: '14px',
            fontWeight: 700
          }}>{au.ini}</span>
          <span style={{
            display: 'grid',
            gap: '3px'
          }}><dt style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)'
            }}>Rédigé par</dt><dd style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 650,
              lineHeight: 1.3,
              color: '#fff'
            }}>{g(au.nom)}</dd><dd style={{
              margin: 0,
              fontSize: '12px',
              lineHeight: 1.3,
              color: 'var(--bleu-100)'
            }}>{g(au.role)}</dd></span></div>
        {[['Publié le', <time dateTime={a.d} itemProp="datePublished">{dateFr(a.d)}</time>], ['Mis à jour le', <time dateTime={a.m} itemProp="dateModified">{dateFr(a.m)}</time>], ['Lecture', a.min + ' min']].map(([k, v]) => <div key={k} className="bl-meta-i" style={{
          display: 'grid',
          gap: '3px',
          alignContent: 'center',
          padding: '0 24px',
          borderLeft: '1px solid rgba(255,255,255,.16)'
        }}><dt style={{
            fontSize: '12px',
            color: 'var(--bleu-200)'
          }}>{k}</dt><dd style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 650,
            lineHeight: 1.3,
            color: '#fff',
            whiteSpace: 'nowrap'
          }}>{v}</dd></div>)}
      </dl></H>}
    <section style={{
      background: '#fff'
    }}><div className="bl-art" style={{
        ...BOITE,
        display: 'grid',
        gridTemplateColumns: '220px minmax(0,1fr) 280px',
        gap: 'clamp(32px,4vw,64px)',
        alignItems: 'start'
      }}>
      <nav aria-label="Sommaire de l’article" className="bl-toc-col bl-toc" style={{
          position: 'sticky',
          top: '130px',
          display: 'grid',
          gap: '4px'
        }}>
        <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: MAR,
            marginBottom: '8px'
          }}>Dans cet article</span>
        {SECTIONS.map(([id, t]) => <a key={id} href={'#' + id} onClick={aller(id)} aria-current={act === id ? 'true' : undefined} style={{
            display: 'block',
            padding: '8px 0 8px 14px',
            fontSize: '13.5px',
            fontWeight: 500,
            lineHeight: 1.4,
            color: DIS,
            textDecoration: 'none',
            boxShadow: 'inset 2px 0 0 var(--bordure-fine)'
          }}>{t}</a>)}</nav>
      <div className="bl-corps" itemProp="articleBody" style={{
          minWidth: 0,
          maxWidth: '70ch'
        }}>
        <section id="reponse" aria-labelledby="h-reponse" style={{
            padding: '24px 26px',
            borderRadius: '16px',
            background: '#F3F7FC',
            border: BD,
            scrollMarginTop: '140px'
          }}>
          <h2 id="h-reponse" style={{
              margin: '0 0 10px',
              fontSize: '18px'
            }}>La réponse courte</h2>
          <p style={{
              margin: 0
            }}>Pour un bail de 12 mois, le propriétaire envoie l’avis de hausse <strong>de 3 à 6 mois avant la fin du bail</strong><Ref n={1} />. Le locataire a <strong>un mois pour répondre</strong>; son silence vaut acceptation<Ref n={2} />. En cas de refus, le propriétaire peut demander au TAL de fixer le loyer, à l’aide de la méthode de calcul publiée chaque année<Ref n={3} />.</p></section>
        <h2 id="delais">Les délais de l’avis</h2>
        <p>L’avis de modification doit être écrit et indiquer le nouveau loyer, en dollars ou en pourcentage, ainsi que la durée du bail proposée<Ref n={1} />.</p>
        <div style={{
            overflowX: 'auto',
            border: BD,
            borderRadius: '14px',
            margin: '0 0 20px'
          }}><table><caption style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
                clip: 'rect(0 0 0 0)'
              }}>Délais d’envoi de l’avis selon la durée du bail</caption>
          <thead><tr><th scope="col">Durée du bail</th><th scope="col">Envoyer l’avis</th></tr></thead>
          <tbody><tr><td><strong>12 mois ou plus</strong></td><td>De 3 à 6 mois avant la fin du bail</td></tr><tr><td><strong>Moins de 12 mois</strong></td><td>De 1 à 2 mois avant la fin du bail</td></tr><tr><td><strong>Durée indéterminée</strong></td><td>De 1 à 2 mois avant la modification</td></tr></tbody></table></div>
        <h3>Ce que l’avis doit contenir</h3>
        <ul><li>Le nouveau loyer, en dollars, ou l’augmentation, en dollars ou en pourcentage.</li><li>La durée du bail proposée, si elle change.</li><li>Toute autre modification des conditions, par exemple un service retiré ou ajouté.</li><li>Le délai dont le locataire dispose pour refuser, soit un mois après la réception.</li></ul>
        <p>L’avis doit être rédigé dans la langue du bail. Gardez une preuve de sa réception : un envoi recommandé, un huissier ou une remise en main propre contre signature. En cas de litige, c’est la date de réception qui compte, pas celle de l’envoi<Ref n={1} />.</p>
        <h2 id="calcul">Le calcul de la hausse</h2>
        <p>Depuis le 1er janvier 2026, le calcul suit une nouvelle méthode. La base est la moyenne sur trois ans de l’indice des prix à la consommation du Québec, publiée par le TAL. S’y ajoutent, s’il y a lieu, un ajustement pour les taxes municipales et scolaires et pour les assurances, quand leur hausse dépasse ce pourcentage de base ; les dépenses de travaux majeurs, au taux de 5 % ; et l’ajout d’un service, d’un accessoire ou d’une dépendance. Les aides gouvernementales reçues sont prises en compte. Un avis donné avant le 1er janvier 2026 suit l’ancienne méthode. Le résultat est une référence : les parties peuvent s’entendre sur un autre montant<Ref n={3} />.</p>
        <p>{g('[Taux de référence de l’année et exemple chiffré à valider par le réviseur avant publication.]')}</p>
        <p>Le calcul repose sur des pièces : comptes de taxes municipales et scolaires, primes d’assurance, factures des travaux majeurs et factures des services ou accessoires ajoutés. Rassemblez-les avant d’envoyer l’avis. Une hausse appuyée sur des chiffres vérifiables se discute plus facilement et se défend mieux devant le TAL.</p>
        <h2 id="calendrier">Un exemple de calendrier</h2>
        <p>Prenons un bail de 12 mois qui se termine le 30 juin. Les dates ci-dessous découlent directement des délais du Code civil<Ref n={1} /><Ref n={2} />.</p>
        <ul><li><strong>Du 1er janvier au 31 mars</strong> : le propriétaire envoie l’avis de modification.</li><li><strong>Dans le mois qui suit la réception</strong> : le locataire accepte, refuse ou annonce son départ. Sans réponse, la hausse est acceptée.</li><li><strong>Dans le mois qui suit un refus</strong> : le propriétaire peut demander au TAL de fixer le loyer.</li><li><strong>1er juillet</strong> : le bail est reconduit. Si le TAL n’a pas encore tranché, l’ancien loyer reste payable; l’écart sera réglé après la décision.</li></ul>
        <h2 id="reponse-loc">La réponse du locataire</h2>
        <ul><li><strong>Il accepte</strong> : le bail est reconduit au nouveau loyer.</li><li><strong>Il refuse et reste</strong> : il avise le propriétaire par écrit dans le mois<Ref n={2} />.</li><li><strong>Il refuse et part</strong> : il avise le propriétaire qu’il quitte à la fin du bail.</li></ul>
        <h2 id="tal">Le recours au TAL</h2>
        <p>Si le locataire refuse et reste, le propriétaire a <strong>un mois</strong> après la réponse pour demander au TAL de fixer le loyer<Ref n={2} />. Sans demande, le bail est reconduit aux mêmes conditions. Le modèle d’avis du TAL évite les erreurs de forme<Ref n={4} />.</p>
        <p>Devant le TAL, chaque partie présente ses pièces. Le tribunal applique la méthode de calcul, peut retenir une hausse plus basse ou plus haute que celle demandée, et fixe aussi les autres conditions contestées.</p>
        <h2 id="cas">Deux cas particuliers</h2>
        <h3>Le nouveau locataire</h3>
        <p>À la signature, le propriétaire doit indiquer le loyer le plus bas payé au cours des 12 mois précédents, à la section G du bail. Si le nouveau loyer est plus élevé, le locataire peut demander au TAL de le fixer dans les 10 jours suivant la signature, ou dans les 2 mois suivant le début du bail si l’information n’a pas été donnée ou si elle est fausse<Ref n={5} />.</p>
        <h3>L’immeuble neuf</h3>
        <p>Pour un immeuble construit ou transformé en logement depuis moins de cinq ans, le locataire ne peut pas faire fixer le loyer par le TAL, à condition que cette exception soit inscrite à la section F du bail<Ref n={5} />. Sans cette mention, les règles habituelles s’appliquent.</p>
        <h2 id="erreurs">Les erreurs à éviter</h2>
        <ul><li><strong>Envoyer l’avis trop tôt ou trop tard</strong> : hors des délais, il est sans effet et le bail est reconduit aux mêmes conditions.</li><li><strong>Oublier une condition</strong> : un changement absent de l’avis ne peut pas être imposé au renouvellement.</li><li><strong>Laisser passer le délai de recours</strong> : sans demande au TAL dans le mois qui suit un refus, le loyer ne change pas.</li><li><strong>Ne pas conserver les pièces</strong> : sans factures ni comptes, la hausse est difficile à justifier.</li></ul>
        <p>Chez Lease Lane, ces étapes sont suivies pour chaque logement : les avis partent dans la bonne fenêtre, les réponses sont consignées et les pièces du calcul sont classées au dossier.</p>
        <aside style={{
            margin: '28px 0',
            padding: '20px 22px',
            borderRadius: '14px',
            background: '#fff',
            border: BD,
            display: 'grid',
            gridTemplateColumns: '40px minmax(0,1fr)',
            gap: '14px'
          }}>
          <img src="/assets/img/cleo-avatar.png" alt="" style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              objectFit: 'cover'
            }} />
          <span style={{
              display: 'grid',
              gap: '8px'
            }}><strong style={{
                fontSize: '14px',
                color: MAR
              }}>Votre situation est particulière?</strong><span style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: TXT
              }}>Cléo applique ces règles à votre bail, 24/7, et passe le relais à l’équipe au besoin.</span>
            <button type="button" onClick={() => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.dispatchEvent(new CustomEvent('ll-cleo', {
                detail: {
                  texte: 'Une hausse de loyer'
                }
              })) : undefined} style={{
                justifySelf: 'start',
                height: '44px',
                padding: '0 16px',
                borderRadius: '10px',
                border: 0,
                background: MAR,
                color: '#fff',
                fontFamily: 'var(--police-corps)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}>Demander à Cléo</button></span></aside>
        <h2 id="faq">Questions fréquentes</h2>
        <div style={{
            borderTop: FIN
          }}>{FQ.map(([q, r], i) => <details key={q} className="ll-faq-item" open={i === 0}><summary><span>{q}</span><span className="ll-plus" aria-hidden="true"><Icon name="plus" size={18} color={BL6} /></span></summary><p>{r}</p></details>)}</div>
        <h2 id="sources">Sources</h2>
        <ol className="bl-src" style={{
            listStyle: 'none',
            padding: 0
          }}>{SRC.map(([t, u, ed], i) => <li key={i} id={'src-' + (i + 1)} style={{
              display: 'grid',
              gridTemplateColumns: '32px minmax(0,1fr)',
              gap: '10px',
              padding: '8px 6px'
            }}><span style={{
                fontSize: '13px',
                fontWeight: 700,
                color: BL6
              }}>[{i + 1}]</span>
          <span style={{
                fontSize: '14px',
                lineHeight: 1.6
              }}>{g(t)} · <a href={u} target="_blank" rel="noopener noreferrer">{ed}<span style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    clip: 'rect(0 0 0 0)'
                  }}> (nouvel onglet)</span></a> · consulté le {dateFr(a.m)}</span></li>)}</ol>
        <p style={{
            marginTop: '32px',
            padding: '16px 18px',
            borderRadius: '12px',
            background: '#F7FAFD',
            border: FIN,
            fontSize: '13px',
            lineHeight: 1.65
          }}>Cet article fournit de l’information juridique générale, à jour à la date indiquée. Il ne constitue pas un avis juridique. Pour une situation précise, consultez le TAL, Éducaloi, un avocat ou un notaire.</p>
      </div>
      <aside className="bl-aside" aria-label="Validation de l’article" style={{
          position: 'sticky',
          top: '130px',
          display: 'grid',
          gap: '16px'
        }}>
        <div style={{
            padding: '22px',
            borderRadius: '18px',
            border: BD,
            background: '#fff',
            display: 'grid',
            gap: '14px'
          }}>
          <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: 700,
              color: MAR
            }}><Icon name="shield-check" size={18} color="#1F7A52" />Contenu vérifié</span>
          <ul style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gap: '10px'
            }}>{[['Rédigé par', au.nom + ', ' + au.role.toLowerCase()], ['Sources', SRC.length + ' sources officielles, citées dans le texte'], ['Prochaine révision', 'Janvier 2027, ou dès qu’une règle change']].map(([k, v]) => <li key={k} style={{
                display: 'grid',
                gap: '2px',
                paddingTop: '10px',
                borderTop: FIN
              }}><span style={{
                  fontSize: '12px',
                  color: DIS
                }}>{k}</span><span style={{
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: MAR,
                  lineHeight: 1.45
                }}>{g(v)}</span></li>)}</ul></div>
        <details style={{
            padding: '16px 18px',
            borderRadius: '14px',
            border: BD,
            background: '#fff'
          }}><summary style={{
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 650,
              color: MAR
            }}>Journal des modifications</summary>
          <ul style={{
              listStyle: 'none',
              margin: '12px 0 0',
              padding: 0,
              display: 'grid',
              gap: '10px',
              fontSize: '13px',
              lineHeight: 1.5,
              color: TXT
            }}><li><time dateTime={a.m} style={{
                  fontWeight: 650,
                  color: MAR
                }}>{dateFr(a.m)}</time> · Ajout du modèle d’avis du TAL.</li><li><time dateTime={a.d} style={{
                  fontWeight: 650,
                  color: MAR
                }}>{dateFr(a.d)}</time> · Publication.</li></ul></details>
        <div style={{
            padding: '16px 18px',
            borderRadius: '14px',
            background: '#F7FAFD',
            border: FIN,
            fontSize: '13px',
            lineHeight: 1.6,
            color: TXT
          }}><strong style={{
              display: 'block',
              color: MAR,
              marginBottom: '4px'
            }}>Notre méthode</strong>Chaque article de droit du logement cite ses sources officielles, est relu par un juriste et porte sa date de mise à jour. <a href="/a-propos">En savoir plus</a></div>
      </aside>
    </div></section>
    <section aria-labelledby="bl-suite" style={{
      background: '#F7FAFD',
      borderTop: FIN
    }}><div style={{
        ...BOITE,
        display: 'grid',
        gap: '28px'
      }}>
      <h2 id="bl-suite" style={{
          margin: 0,
          fontSize: 'var(--titre-l)',
          letterSpacing: '-0.03em',
          color: MAR
        }}>À lire aussi</h2>
      <div className="bl-g3" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
          gap: '20px'
        }}>{ARTICLES.filter(x => x !== a).slice(0, 3).map((x, i) => <CarteArticle key={x.slug} a={x} i={i} />)}</div></div></section>
  </article>;
}
export { PageBlogue, PageArticle, ARTICLES as LL_BLOGUE };
