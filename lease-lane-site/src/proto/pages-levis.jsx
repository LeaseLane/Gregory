/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pages-levis.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { useLangue } from '@/lib/i18n/contexte';
import { Icon } from '@/components/ds';
import { LL_ROUTES } from '@/proto/routes';
import { LL_LEVIS } from '@/proto/levis-donnees';
import { LL_LOCALITES } from '@/proto/localites-donnees';
import { PBHeros } from '@/proto/pages-proprio-b';
import { AppelFinal } from '@/proto/blocs';
import { __ssr } from '@/lib/hydratation';
const MAR = '#0C2147',
  BL6 = '#3767A2',
  TXT = '#3E4A59',
  BD = '1px solid rgba(12,33,71,.16)',
  FIN = '1px solid var(--bordure-fine)';
const BOITE = {
  maxWidth: 'var(--web-conteneur)',
  margin: '0 auto',
  padding: 'var(--web-section) var(--web-gouttiere)',
  boxSizing: 'border-box'
};
/* Langue d'affichage (prototype : LL_LANGUE; site Next.js : contexte de langue). */
const useEN = () => useLangue() === 'en';
/* {mot} = accent de couleur; **gras**; [libellé](/chemin) = lien interne. */
const accent = t => String(t).split(/(\{[^}]+\})/).map((x, i) => /^\{/.test(x) ? <span key={i} style={{
  color: 'var(--bleu-500)'
}}>{x.slice(1, -1)}</span> : x);
function riche(t) {
  const out = [];
  let i = 0;
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let m;
  while (m = re.exec(t)) {
    if (m.index > i) out.push(t.slice(i, m.index));
    out.push(m[1] ? <strong key={m.index} style={{
      color: MAR
    }}>{m[1]}</strong> : <a key={m.index} href={m[3]}>{m[2]}</a>);
    i = re.lastIndex;
  }
  if (i < t.length) out.push(t.slice(i));
  return out;
}
const H2 = ({
  id,
  children
}) => <h2 id={id} style={{
  margin: 0,
  fontSize: 'var(--titre-l)',
  lineHeight: 1.25,
  letterSpacing: '-0.03em',
  color: MAR,
  textWrap: 'balance'
}}>{accent(children)}</h2>;
const P = ({
  children
}) => <p style={{
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.75,
  color: TXT,
  maxWidth: '68ch'
}}>{riche(children)}</p>;
const slugDe = route => String(route && route.path || '').split('/').filter(Boolean).pop();
/* Guide du secteur (/quartiers/<slug>), s'il existe. */
const guideLocal = slug => {
  const p = '/quartiers/' + (slug === 'sainte-foy-sillery-cap-rouge' ? 'sainte-foysillerycap-rouge' : slug);
  return LL_ROUTES.some(r => r.path === p) ? p : null;
};
function PageLocale({
  route
}) {
  const EN = useEN(),
    slug = slugDe(route),
    d = slug === 'levis' ? LL_LEVIS : LL_LOCALITES[slug],
    c = d && d[EN ? 'en' : 'fr'];
  if (!c) return null;
  const H = typeof PBHeros !== 'undefined' ? PBHeros : null;
  return <div className="lv-page">
    {H && <H route={route} titre={c.titre} lead={c.lead} />}
    {c.fiche && <section aria-labelledby="lv-fiche" style={{
      background: '#fff'
    }}><div style={{
        ...BOITE,
        paddingBottom: 0,
        display: 'grid',
        gap: '24px'
      }}>
      <H2 id="lv-fiche">{c.ficheT}</H2>
      <dl className="lv-g4" style={{
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
          gap: '12px'
        }}>{c.fiche.map(([v, l]) => <div key={l} style={{
            display: 'grid',
            gap: '4px',
            alignContent: 'start',
            padding: '18px 20px',
            borderRadius: '16px',
            background: 'var(--bleu-025)'
          }}>
        <dt style={{
              order: 2,
              fontSize: '13px',
              lineHeight: 1.45,
              color: TXT
            }}>{l}</dt><dd style={{
              order: 1,
              margin: 0,
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              color: MAR,
              fontVariantNumeric: 'tabular-nums'
            }}>{v}</dd></div>)}</dl>
      {c.ficheNote && <p style={{
          margin: 0,
          fontSize: '12.5px',
          lineHeight: 1.6,
          color: 'var(--texte-discret)'
        }}>{c.ficheNote}</p>}
    </div></section>}
    <section aria-labelledby="lv-secteurs" style={{
      background: '#fff'
    }}><div style={{
        ...BOITE,
        display: 'grid',
        gap: '32px'
      }}>
      <div style={{
          display: 'grid',
          gap: '12px'
        }}><H2 id="lv-secteurs">{c.secteursT}</H2><P>{c.secteursD}</P></div>
      <ul className="lv-g3 lv-g4" style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(' + Math.min(c.secteurs.length, 4) + ',minmax(0,1fr))',
          gap: '16px'
        }}>
        {c.secteurs.map(([n, d, lien]) => <li key={n} style={{
            display: 'grid',
            gap: '10px',
            alignContent: 'start',
            padding: '22px',
            borderRadius: '18px',
            border: BD,
            background: '#fff'
          }}>
          <span aria-hidden="true" style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--bleu-025)'
            }}><Icon name="map-pin" size={18} color={MAR} /></span>
          <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.015em',
              color: MAR
            }}>{lien ? <a href={lien} style={{
                color: 'inherit'
              }}>{n}</a> : n}</h3>
          <p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.6,
              color: TXT
            }}>{d}</p></li>)}</ul>
      <p style={{
          margin: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 24px',
          fontSize: '14px',
          fontWeight: 600
        }}><a href="/quartiers">{EN ? 'All areas we serve' : 'Tous les secteurs desservis'}</a>{guideLocal(slug) && <a href={guideLocal(slug)}>{EN ? 'Area guide' : 'Guide du secteur'}</a>}</p>
    </div></section>
    <section aria-labelledby="lv-marche" style={{
      background: '#F7FAFD',
      borderTop: FIN,
      borderBottom: FIN
    }}><div className="lv-g2" style={{
        ...BOITE,
        display: 'grid',
        gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
        gap: '24px clamp(32px,5vw,72px)',
        alignItems: 'start'
      }}>
      <H2 id="lv-marche">{c.marcheT}</H2>
      <div style={{
          display: 'grid',
          gap: '16px'
        }}>{c.marche.map((t, i) => <P key={i}>{t}</P>)}
        <p style={{
            margin: 0,
            fontSize: '12.5px',
            lineHeight: 1.6,
            color: 'var(--texte-discret)'
          }}>{(d.src || []).length > 1 ? EN ? 'Sources: ' : 'Sources : ' : EN ? 'Source: ' : 'Source : '}{(d.src || []).map(([t, u], i) => <React.Fragment key={u}>{i ? ' · ' : ''}<a href={u} target="_blank" rel="noopener noreferrer">{t}</a></React.Fragment>)}</p></div>
    </div></section>
    <section aria-labelledby="lv-services" style={{
      background: '#fff'
    }}><div style={{
        ...BOITE,
        display: 'grid',
        gap: '32px'
      }}>
      <H2 id="lv-services">{c.servicesT}</H2>
      <ul className="lv-g3" style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
          gap: '16px'
        }}>
        {c.services.map(([ic, t, d]) => <li key={t} style={{
            display: 'grid',
            gridTemplateColumns: '44px minmax(0,1fr)',
            gap: '14px',
            alignItems: 'start',
            padding: '20px',
            borderRadius: '16px',
            border: BD
          }}>
          <span aria-hidden="true" style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              background: MAR
            }}><Icon name={ic} size={19} color="#fff" /></span>
          <span style={{
              display: 'grid',
              gap: '6px'
            }}><h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: MAR
              }}>{t}</h3><span style={{
                fontSize: '14px',
                lineHeight: 1.55,
                color: TXT
              }}>{d}</span></span></li>)}</ul>
      <p style={{
          margin: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 24px',
          fontSize: '14px',
          fontWeight: 600
        }}><a href="/gestion-immobiliere">{EN ? 'Our property management' : 'Notre gestion immobilière'}</a><a href="/changer-de-gestionnaire">{EN ? 'Switch property managers' : 'Changer de gestionnaire'}</a><a href="/blogue/frais-gestion-immobiliere-quebec">{EN ? 'Property management fees' : 'Frais de gestion immobilière'}</a></p>
    </div></section>
    <section aria-labelledby="lv-regles" style={{
      background: '#F7FAFD',
      borderTop: FIN
    }}><div className="lv-g2" style={{
        ...BOITE,
        display: 'grid',
        gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
        gap: '24px clamp(32px,5vw,72px)',
        alignItems: 'start'
      }}>
      <H2 id="lv-regles">{c.reglesT}</H2><div style={{
          display: 'grid',
          gap: '16px'
        }}>{c.regles.map((t, i) => <P key={i}>{t}</P>)}</div>
    </div></section>
    <section aria-labelledby="lv-faq" style={{
      background: '#fff'
    }}><div style={{
        ...BOITE,
        display: 'grid',
        gap: '28px',
        maxWidth: 'calc(var(--web-conteneur) * .8)'
      }}>
      <H2 id="lv-faq">{c.faqT}</H2>
      <div style={{
          borderTop: FIN
        }}>{c.faq.map(([q, r], i) => <details key={q} className="ll-faq-item" open={i === 0}><summary><span>{q}</span><span className="ll-plus" aria-hidden="true"><Icon name="plus" size={18} color={BL6} /></span></summary><p>{r}</p></details>)}</div>
    </div></section>
    {<AppelFinal surtitre={c.cta.surtitre} titre={c.cta.titre} texte={c.cta.texte} bouton={c.cta.bouton} to="/offre-de-service" />}
  </div>;
}
if ((__ssr() ? "undefined" : typeof window) !== "undefined") {
  if (!((__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('lv-css') : undefined)) {
    const st = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.createElement('style') : undefined;
    st.id = 'lv-css';
    st.textContent = '@media (max-width:960px){.lv-g3{grid-template-columns:minmax(0,1fr)!important}.lv-g2{grid-template-columns:minmax(0,1fr)!important}.lv-g4{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media (max-width:560px){.lv-g4{grid-template-columns:minmax(0,1fr)!important}}';
    document.head.appendChild(st);
  }
}
export { PageLocale, PageLocale as PageLevis };
