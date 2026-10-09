/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pages-proprio-b.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { GO_useRevue, GO_BasculeRevue, GestionS01, GestionS02, GestionS03 } from '@/proto/gestion-options-a';
import { gab, CONT, FilAriane, BoutonLien, LLSol, Exemple, Fleche, Coches, Note } from '@/proto/blocs';
import { PPC, TypesImmeubles, ServicesOfferts, ApercuPortail, BlocOffre } from '@/proto/pages-proprietaires';
import { GestionS04, GestionS05, GestionS06, GestionOffre } from '@/proto/gestion-options-b';
import { F12C } from '@/proto/accueil-faq-12';
import { __ssr } from '@/lib/hydratation';

/* Option B « Chapitres marine » des pages propriétaires : héros marine pleine largeur avec chiffres clés,
   puis chapitres numérotés avec sommaire collant à gauche. Rangées filetées au lieu de cartes. Même contenu que l'option A (PPC). */
const PB_F = '1px solid var(--bordure-fine)',
  PB_FC = '1px solid rgba(200,218,240,.16)';
const PB_SUR = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase'
};

/* Chevrons du logo, tournés vers la droite (profondeur 60, hauteur 153, pas de 71,6 comme dans le logo). */
const CHV = 'M0 0 L60 76.5 L0 153';
/* Visuels de bannière : supergraphiques pleine hauteur, à droite du texte. Les chevrons du logo, tournés vers la droite, débordent du cadre. */
const DEP = 60 / 76.5,
  bigChv = (x0, T, top = -10, bot = 110) => {
    const d = (50 - top) * DEP;
    return [[x0, top], [x0 + T, top], [x0 + T + d, 50], [x0 + T, bot], [x0, bot], [x0 + d, 50]].map(p => p.join(',')).join(' ');
  };
const ligneChv = (x0, top = -10, bot = 110) => {
  const d = (50 - top) * DEP;
  return 'M' + x0 + ' ' + top + ' L' + (x0 + d) + ' 50 L' + x0 + ' ' + bot;
};
const PLEIN = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%'
};
/* Bandes réutilisables (héros, offre) : trois chevrons pleine hauteur, opacités dégressives. */
function LLBandes({
  x = [10, 32, 54],
  T = 9.75,
  op = [.75, .5, .25],
  c = ['#1C3451', '#3767A2', '#5990D2'],
  ar = 'xMinYMid slice'
}) {
  return <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio={ar} style={PLEIN}>{x.map((x0, i) => <g key={i} className="llh-av" style={{
      animationDelay: 120 + i * 160 + 'ms'
    }}><polygon points={bigChv(x0, T)} fill={c[i]} opacity={op[i]} /></g>)}</svg>;
}
function HerosBandes() {
  return <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="xMinYMid slice" style={PLEIN}>
    {[['#1C3451', 10, .75], ['#3767A2', 32, .5], ['#5990D2', 54, .25]].map(([c, x, o], i) => <g key={i} className="llh-av" style={{
      animationDelay: 120 + i * 160 + 'ms'
    }}><polygon points={bigChv(x, 9.75)} fill={c} opacity={o} /></g>)}
  </svg>;
}
function HerosNegatif() {
  const cut = 'polygon(0 0,100% 0,100% 100%,0 100%,24% 50%)';
  return <div aria-hidden="true" style={{
    position: 'absolute',
    inset: 0
  }}>
    <span className="llh-av" style={{
      position: 'absolute',
      inset: 0,
      clipPath: cut,
      WebkitClipPath: cut,
      background: 'linear-gradient(140deg,#F4F8FD 0%,#E3EEFA 60%,#CFE1F6 100%)'
    }} />
    <svg className="llh-av" viewBox="-12 -12 228 177" style={{
      position: 'absolute',
      right: '12%',
      top: '50%',
      height: 'min(38%,240px)',
      transform: 'translateY(-50%)',
      overflow: 'visible',
      animationDelay: '420ms'
    }}>
      {['#0E2340', '#1C3451', '#3767A2'].map((c, i) => <path key={i} d={CHV} transform={'translate(' + i * 71.6 + ' 0)'} fill="none" stroke={c} strokeWidth="16.16" strokeLinecap="round" strokeLinejoin="miter" strokeMiterlimit="6" />)}
    </svg></div>;
}
function HerosContours() {
  const X = Array.from({
      length: 15
    }, (_, i) => -24 + i * 8),
    fort = {
      8: ['#5990D2', .5],
      9: ['#9CC4F2', .5],
      10: ['#FFFFFF', .5]
    };
  return <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="xMinYMid slice" style={PLEIN}>
    {X.map((x, i) => {
      const s = fort[i];
      return <path key={i} className="llh-trace" pathLength="1" d={ligneChv(x)} fill="none" stroke={s ? s[0] : 'rgba(200,218,240,.16)'} strokeWidth={s ? s[1] : .18} strokeLinecap="round" strokeLinejoin="miter" style={{
        animationDelay: 80 + i * 70 + 'ms'
      }} />;
    })}
  </svg>;
}
function PBMotif({
  v
}) {
  return v === '1' ? <HerosBandes /> : v === '2' ? <HerosNegatif /> : v === '3' ? <HerosContours /> : null;
}
function PBHeros({
  route,
  surtitre,
  titre,
  lead,
  actions,
  stats,
  motif = true,
  aside,
  children,
  compact
}) {
  const ur = GO_useRevue,
    [mv] = ur ? ur('heros6') : ['1'],
    m = motif ? mv : '0',
    vis = m !== '0';
  const texte = <div style={{
    display: 'grid',
    gap: '24px',
    padding: compact ? '48px 0 64px' : stats ? '64px 0 72px' : route && route.page === 'logements' ? '80px 0 112px' : '64px 0 96px',
    maxWidth: '860px',
    alignContent: 'start'
  }}>
        {surtitre && <span style={{
      ...PB_SUR,
      color: 'var(--bleu-300)'
    }}>{surtitre}</span>}
        <h1 style={{
      margin: 0,
      color: '#fff',
      fontSize: 'clamp(34.4px,3.01vw,43px)',
      lineHeight: 1.29,
      letterSpacing: '-0.03em',
      maxWidth: '24ch',
      textWrap: 'balance'
    }}>{gab(titre)}</h1>
        {lead && <p style={{
      margin: 0,
      fontSize: '14px',
      lineHeight: 1.65,
      color: 'var(--bleu-100)',
      maxWidth: '58ch'
    }}>{gab(lead)}</p>}
        {actions && <div style={{
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginTop: '8px'
    }}>{actions}</div>}
        {children}
      </div>;
  return <section className="ll-sombre" style={{
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--degrade-marine)'
  }}>
    {!vis && <div aria-hidden="true" style={{
      position: 'absolute',
      inset: 0,
      background: 'url(../../assets/img/skyline.png) right bottom / min(1100px,90%) auto no-repeat',
      opacity: .132,
      WebkitMaskImage: 'linear-gradient(90deg,transparent 15%,#000 70%)',
      maskImage: 'linear-gradient(90deg,transparent 15%,#000 70%)'
    }} />}
    <div aria-hidden="true" style={{
      position: 'absolute',
      inset: 0,
      background: 'var(--lueur-bleue)'
    }} />
    <div aria-hidden="true" style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(90deg,rgba(4,14,28,.62) 0%,rgba(4,14,28,.38) 38%,rgba(4,14,28,0) 72%)',
      pointerEvents: 'none'
    }} />
    {vis && <div key={m} className="llh-deco" style={{
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 'max(56%,calc(50% + 120px))',
      right: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}><PBMotif v={m} /></div>}
    <div style={{
      ...CONT,
      position: 'relative',
      padding: '48px var(--web-gouttiere) 0'
    }}>
      <FilAriane fil={route.fil} clair />
      {aside ? <div className="llh-grille" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,.85fr)',
        gap: '56px',
        alignItems: 'center'
      }}>
        {texte}<div style={{
          position: 'relative',
          padding: compact ? '0 0 48px' : '0 0 64px',
          alignSelf: compact ? 'center' : 'end'
        }}>{aside}</div>
      </div> : vis ? <div className="llh-grille" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,.85fr)',
        gap: '56px',
        alignItems: 'stretch'
      }}>
        {texte}
        <div aria-hidden="true" className="llh-deco"></div>
      </div> : texte}
      {stats && <dl style={{
        margin: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        borderTop: PB_FC
      }}>
        {stats.map(([v, t], i) => <div key={t} style={{
          padding: '28px 24px 36px ' + (i ? '24px' : '0'),
          borderLeft: i ? PB_FC : 'none',
          display: 'grid',
          gap: '8px',
          alignContent: 'start'
        }}>
          <dt style={{
            order: 2,
            fontSize: '14px',
            color: 'var(--bleu-100)'
          }}>{t}</dt><dd style={{
            order: 1,
            margin: 0,
            fontSize: '40px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: '#fff'
          }}>{v}</dd></div>)}
      </dl>}
    </div>
  </section>;
}
const pad2 = n => String(n).padStart(2, '0');
/* Sommaire collant — trois options de revue (0 = actuel). */
function PBSommaire({
  v,
  chapitres,
  ai,
  frac,
  aller
}) {
  const n = chapitres.length,
    lib = c => c.court || c.t,
    btn = {
      border: 0,
      background: 'transparent',
      cursor: 'pointer',
      fontFamily: 'inherit',
      textAlign: 'left'
    };
  if (v === '1') {
    const p = Math.min(1, (ai + frac) / Math.max(1, n - 1));
    return <div style={{
      display: 'grid',
      gap: '18px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '12px'
      }}><span style={{
          ...PB_SUR,
          color: 'var(--bleu-600)'
        }}>Sur cette page</span><span style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--marine-900)',
          fontVariantNumeric: 'tabular-nums'
        }}>{pad2(ai + 1)} / {pad2(n)}</span></div>
      <div style={{
        position: 'relative',
        display: 'grid',
        gap: '4px'
      }}>
        <span aria-hidden="true" style={{
          position: 'absolute',
          left: '15px',
          top: '24px',
          bottom: '24px',
          width: '2px',
          marginLeft: '-1px',
          background: 'var(--bordure-fine)',
          borderRadius: '2px'
        }}><span style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: p * 100 + '%',
            background: 'var(--bleu-500)',
            borderRadius: '2px',
            transition: 'height 200ms linear'
          }} /></span>
        {chapitres.map((c, i) => {
          const on = i === ai,
            fait = i < ai;
          return <button key={c.id} type="button" onClick={() => aller(c.id)} aria-current={on ? 'true' : undefined} style={{
            ...btn,
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '32px minmax(0,1fr)',
            gap: '14px',
            alignItems: 'center',
            minHeight: '48px',
            padding: '8px 0'
          }}>
          <span style={{
              width: '32px',
              height: '32px',
              boxSizing: 'border-box',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              fontSize: '12px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              background: fait ? 'var(--marine-900)' : '#fff',
              color: fait ? '#fff' : on ? 'var(--marine-900)' : 'var(--texte-discret)',
              border: fait ? '0' : on ? '2px solid var(--marine-900)' : '1px solid var(--bordure-fine)',
              boxShadow: on ? '0 0 0 5px rgba(42,111,219,.14)' : 'none',
              transition: 'all 240ms'
            }}>{fait ? <Icon name="check" size={14} color="#fff" /> : pad2(i + 1)}</span>
          <span style={{
              fontSize: '14px',
              lineHeight: 1.35,
              fontWeight: on ? 700 : 500,
              color: on || fait ? 'var(--marine-900)' : 'var(--texte-discret)'
            }}>{lib(c)}</span></button>;
        })}
      </div></div>;
  }
  if (v === '2') return <div className="ll-sombre" style={{
    position: 'relative',
    overflow: 'hidden',
    display: 'grid',
    gap: '16px',
    padding: '20px',
    borderRadius: '20px',
    background: 'var(--degrade-marine,var(--marine-900))',
    boxShadow: '0 20px 48px rgba(12,33,71,.22)'
  }}>
      <div aria-hidden="true" style={{
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(80% 60% at 100% 0%,rgba(91,154,232,.28),transparent 60%)',
      pointerEvents: 'none'
    }} />
      <span style={{
      position: 'relative',
      ...PB_SUR,
      color: 'var(--bleu-300)',
      padding: '4px 12px 0'
    }}>Sur cette page</span>
      <div style={{
      position: 'relative',
      display: 'grid',
      gap: '2px'
    }}>{chapitres.map((c, i) => {
        const on = i === ai;
        return <button key={c.id} type="button" onClick={() => aller(c.id)} aria-current={on ? 'true' : undefined} style={{
          ...btn,
          display: 'grid',
          gridTemplateColumns: '28px minmax(0,1fr)',
          gap: '8px',
          alignItems: 'baseline',
          minHeight: '44px',
          padding: '11px 12px',
          borderRadius: '12px',
          background: on ? '#fff' : 'transparent',
          transition: 'background 200ms'
        }}>
        <span style={{
            fontSize: '12px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: on ? 'var(--bleu-600)' : 'var(--bleu-300)'
          }}>{pad2(i + 1)}</span>
        <span style={{
            fontSize: '14px',
            lineHeight: 1.35,
            fontWeight: on ? 700 : 500,
            color: on ? 'var(--marine-900)' : '#fff'
          }}>{lib(c)}</span></button>;
      })}</div>
      <div style={{
      position: 'relative',
      display: 'grid',
      gap: '10px',
      paddingTop: '16px',
      borderTop: PB_FC
    }}>
        <span style={{
        fontSize: '13px',
        lineHeight: 1.5,
        color: 'var(--bleu-100)',
        padding: '0 4px'
      }}>Une offre écrite pour votre immeuble, en un jour ouvrable.</span>
        <BoutonLien to="/offre-de-service" variant="inverse">Obtenir une offre</BoutonLien></div>
    </div>;
  if (v === '3') return <div style={{
    display: 'grid',
    gap: '24px'
  }}>
      <div key={ai} className="lls-fondu" style={{
      display: 'grid',
      gap: '8px'
    }}>
        <span style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px'
      }}><span style={{
          fontSize: '72px',
          fontWeight: 800,
          lineHeight: .9,
          letterSpacing: '-0.05em',
          color: 'var(--marine-900)',
          fontVariantNumeric: 'tabular-nums'
        }}>{pad2(ai + 1)}</span><span style={{
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--texte-discret)',
          fontVariantNumeric: 'tabular-nums'
        }}>/ {pad2(n)}</span></span>
        <span style={{
        fontSize: '18px',
        fontWeight: 700,
        letterSpacing: '-0.015em',
        lineHeight: 1.25,
        color: 'var(--marine-900)'
      }}>{lib(chapitres[ai])}</span></div>
      <div style={{
      display: 'grid'
    }}>{chapitres.map((c, i) => {
        const on = i === ai,
          w = i < ai ? 1 : on ? frac : 0;
        return <button key={c.id} type="button" onClick={() => aller(c.id)} aria-current={on ? 'true' : undefined} style={{
          ...btn,
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '28px minmax(0,1fr)',
          gap: '8px',
          alignItems: 'baseline',
          minHeight: '44px',
          padding: '12px 0'
        }}>
        <span aria-hidden="true" style={{
            position: 'absolute',
            left: 0,
            top: '-1px',
            height: '1px',
            width: '50%',
            background: 'var(--bordure-fine)'
          }} />
        <span aria-hidden="true" style={{
            position: 'absolute',
            left: 0,
            top: '-1px',
            height: '2px',
            width: w * 50 + '%',
            background: 'var(--marine-900)',
            transition: 'width 200ms linear'
          }} />
        <span style={{
            fontSize: '12px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: on ? 'var(--bleu-600)' : 'var(--texte-discret)'
          }}>{pad2(i + 1)}</span>
        <span style={{
            fontSize: '14px',
            lineHeight: 1.35,
            fontWeight: on ? 700 : 500,
            color: i <= ai ? 'var(--marine-900)' : 'var(--texte-discret)'
          }}>{lib(c)}</span></button>;
      })}</div>
    </div>;
  return <div style={{
    display: 'grid',
    gap: '4px'
  }}>{chapitres.map((c, i) => {
      const on = i === ai;
      return <button key={c.id} type="button" onClick={() => aller(c.id)} aria-current={on ? 'true' : undefined} style={{
        ...btn,
        display: 'grid',
        gridTemplateColumns: '28px minmax(0,1fr)',
        gap: '8px',
        alignItems: 'baseline',
        padding: '10px 0 10px 14px',
        minHeight: '44px',
        boxShadow: 'inset 2px 0 0 ' + (on ? 'var(--bleu-500)' : 'var(--bordure-fine)'),
        transition: 'box-shadow 200ms'
      }}>
      <span style={{
          fontSize: '13px',
          fontWeight: 700,
          color: on ? 'var(--bleu-600)' : 'var(--texte-discret)',
          fontVariantNumeric: 'tabular-nums'
        }}>{pad2(i + 1)}</span>
      <span style={{
          fontSize: '14px',
          fontWeight: on ? 700 : 500,
          color: 'var(--marine-900)',
          lineHeight: 1.4
        }}>{lib(c)}</span></button>;
    })}</div>;
}
function PBChapitres({
  chapitres,
  fond = 'var(--gris-000)'
}) {
  const [pos, setPos] = React.useState({
    ai: 0,
    frac: 0
  });
  const useR = GO_useRevue,
    Bascule = GO_BasculeRevue,
    [v, setV] = useR ? useR('som') : ['0', () => {}];
  React.useEffect(() => {
    const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;
    if (!sc) return;
    const f = () => {
      const h = sc.getBoundingClientRect().top + 180;
      let ai = 0,
        frac = 0;
      chapitres.forEach((c, i) => {
        const el = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('pb-' + c.id) : undefined;
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top <= h) {
          ai = i;
          frac = Math.max(0, Math.min(1, (h - r.top) / Math.max(1, r.height)));
        }
      });
      setPos(p => p.ai === ai && Math.abs(p.frac - frac) < .005 ? p : {
        ai,
        frac
      });
    };
    f();
    sc.addEventListener('scroll', f, {
      passive: true
    });
    return () => sc.removeEventListener('scroll', f);
  }, []);
  const aller = id => {
    const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined,
      el = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('pb-' + id) : undefined;
    if (sc && el) sc.scrollTo({
      top: el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 112,
      behavior: 'smooth'
    });
  };
  return <section style={{
    background: fond
  }}><div className="pb-chap" style={{
      ...CONT,
      display: 'grid',
      gridTemplateColumns: '240px minmax(0,1fr)',
      gap: 'clamp(64px,8vw,160px)',
      padding: 'var(--web-section) var(--web-gouttiere)'
    }}>
    <nav aria-label="Sommaire de la page" className="pb-som" style={{
        position: 'sticky',
        top: '112px',
        alignSelf: 'start',
        display: 'grid',
        gap: '20px'
      }}>
      <PBSommaire v={v} chapitres={chapitres} ai={pos.ai} frac={pos.frac} aller={aller} />
      {Bascule && v === 'x' && <Bascule n="sommaire" noms={['Rail', 'Carte marine', 'Index']} o={v} set={setV} />}
    </nav>
    <div style={{
        display: 'grid',
        gap: 'clamp(96px,9vw,144px)'
      }}>
      {chapitres.map((c, i) => <article key={c.id} id={'pb-' + c.id} aria-labelledby={'pb-t-' + c.id} style={{
          display: 'grid',
          gap: '70.3px'
        }}>
        <header style={{
            display: 'grid',
            gap: '12px',
            maxWidth: '100%'
          }}>
          <span style={{
              display: 'grid',
              justifySelf: 'start',
              gap: '12px',
              marginBottom: '20.35px'
            }}><span style={{
                ...PB_SUR,
                color: 'var(--bleu-600)'
              }}>{String(i + 1).padStart(2, '0')} · {c.court || c.t}</span>
          <span aria-hidden="true" style={{
                display: 'block',
                height: '1.3px',
                background: 'var(--marine-900)'
              }} /></span>
          <h2 id={'pb-t-' + c.id} style={{
              margin: 0,
              fontSize: 'var(--titre-l)',
              textWrap: 'balance'
            }}>{gab(c.t)}</h2>
          {c.texte && <p style={{
              margin: '3.6px 0 0',
              fontSize: '14px',
              lineHeight: 1.65
            }}>{gab(c.texte)}</p>}</header>
        {c.contenu}
      </article>)}
    </div>
  </div></section>;
}
const PBRangees = ({
  items
}) => <ul style={{
  listStyle: 'none',
  margin: 0,
  padding: '0 clamp(20px,2.4vw,32px)',
  background: '#fff',
  border: '1px solid rgba(12,33,71,.16)',
  borderRadius: '20px'
}}>
  {items.map(([ic, t, d], k) => <li key={t} className="pb-rang" style={{
    display: 'grid',
    gridTemplateColumns: '48px minmax(0,1fr) minmax(0,1.4fr)',
    gap: '8px 24px',
    alignItems: 'start',
    padding: '24px 0',
    borderTop: k ? PB_F : 0
  }}>
    <span aria-hidden="true" style={{
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      background: 'var(--marine-900)',
      display: 'grid',
      placeItems: 'center'
    }}><Icon name={ic} size={19} color="#fff" /></span>
    <h3 style={{
      margin: '10px 0 0',
      fontSize: '18px',
      letterSpacing: '-0.01em',
      color: 'var(--marine-900)'
    }}>{gab(t)}</h3>
    <p style={{
      margin: '10px 0 0',
      fontSize: '14px',
      lineHeight: 1.6,
      color: 'var(--texte-corps)'
    }}>{gab(d)}</p></li>)}
</ul>;
const PBChiffres = ({
  items
}) => <div className="ll-sombre" style={{
  position: 'relative',
  isolation: 'isolate',
  overflow: 'hidden',
  borderRadius: '20px',
  background: 'var(--degrade-marine)',
  padding: 'clamp(24px,3vw,40px)',
  display: 'grid',
  gap: '24px'
}}>{<LLSol sombre h="80%" />}
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}><span style={{
      ...PB_SUR,
      color: 'var(--bleu-300)'
    }}>Mesurés chaque mois</span><Exemple /></div>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
    rowGap: '24px'
  }}>{items.map(([v, t, d], i) => <div key={t} style={{
      padding: '4px 20px 4px ' + (i ? '20px' : '0'),
      borderLeft: i ? PB_FC : 'none',
      display: 'grid',
      gap: '8px',
      alignContent: 'start'
    }}>
    <span style={{
        fontSize: 'clamp(36px,3.4vw,48px)',
        fontWeight: 700,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        color: '#fff',
        whiteSpace: 'nowrap'
      }}>{v}</span>
    <span style={{
        fontSize: '15px',
        fontWeight: 700,
        color: '#fff',
        marginTop: '8px'
      }}>{t}</span><span style={{
        fontSize: '14px',
        color: 'var(--bleu-100)'
      }}>{d}</span></div>)}</div>
</div>;
const PBMarine = ({
  titre,
  children
}) => <div className="ll-sombre" style={{
  position: 'relative',
  isolation: 'isolate',
  overflow: 'hidden',
  borderRadius: '20px',
  background: 'var(--degrade-marine,var(--marine-900))',
  padding: 'clamp(24px,3vw,40px)',
  display: 'grid',
  gap: '18px',
  alignContent: 'start'
}}>
  {<LLSol sombre h="70%" />}<span style={{
    ...PB_SUR,
    color: 'var(--bleu-300)'
  }}>{titre}</span>{children}</div>;
const PBActions = ({
  a,
  b,
  to2 = '/offre-de-service'
}) => <React.Fragment><BoutonLien to="/offre-de-service" variant="inverse">{a}</BoutonLien>{b && <BoutonLien to={to2} variant="contour_inverse" icone={false}>{b}</BoutonLien>}</React.Fragment>;
function PageGestionB({
  route
}) {
  const c = PPC.gestion;
  return <div style={{
    '--web-conteneur': 'calc(1520px + 2 * var(--web-gouttiere))'
  }}>
    <PBHeros motif route={route} titre={c.titre} lead={c.lead} actions={<PBActions a="Obtenir une offre" b="Notre expertise" to2="/expertise-et-strategie" />} />
    <PBChapitres chapitres={[{
      id: 'qui',
      court: 'Pour qui?',
      t: 'Une offre qui s\u2019adresse à tous les propriétaires d\u2019immeubles résidentiels dans la {grande région de Québec}.',
      contenu: <GestionS01 actuel={<TypesImmeubles />} />
    }, {
      id: 'volets',
      court: 'Services offerts',
      t: 'Lease Lane vous offre un service {clé en main} pour vos immeubles. Tout est pris en charge.',
      contenu: <GestionS02 actuel={<ServicesOfferts />} />
    }, {
      id: 'voir',
      court: 'Ce que vous voyez',
      t: 'Une {toute nouvelle approche} de la gestion d\u2019immeubles à Québec. Une solution pensée pour optimiser la gestion immobilière dans sa globalité.',
      contenu: <GestionS03 actuel={<ApercuPortail />} />
    }, {
      id: 'cleo',
      court: 'Ce que Cléo change',
      t: 'Votre agent IA {qui ne dort pas}, au service de vos locataires, de vous et de votre équipe.',
      contenu: <GestionS04 actuel={<div style={{
        display: 'grid',
        gap: '32px'
      }}><PBRangees items={c.cleo} /><div><Fleche to="/cleo">Qui est Cléo</Fleche></div></div>} />
    }, {
      id: 'main',
      court: 'Vos décisions',
      t: 'Vous gardez la main sur {l’essentiel}. Vous ne travaillez pas mais vous êtes en contrôle total.',
      contenu: <GestionS05 actuel={<div className="ll-deux" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        gap: '24px'
      }}>
        <PBMarine titre="Toujours soumis à votre accord"><Coches clair items={c.main} /></PBMarine>
        <div style={{
          display: 'grid',
          gap: '14px',
          alignContent: 'start'
        }}><Note icone="circle-check" titre="Approbation en un geste">Chaque décision vous est présentée en ligne avec le dossier complet, puis consignée.</Note><Note icone="info" titre="Sous votre seuil">Les travaux courants sous votre seuil d’autorisation [montant à fixer] sont mandatés et vous en êtes informé.</Note></div></div>} />
    }, {
      id: 'engagements',
      court: 'Nos engagements',
      t: 'Quatre engagements chiffrés, {vérifiables} dans votre rapport.',
      contenu: <GestionS06 actuel={<PBChiffres items={c.engagements} />} />
    }]} />
    {<F12C />}
    <GestionOffre actuel={<BlocOffre fond="blanc" />} />
  </div>;
}

/* Liste de vérification de la transition : reprise des quatre étapes publiées, sans étape nouvelle. */

export { PB_F, PB_FC, PB_SUR, CHV, DEP, bigChv, ligneChv, PLEIN, LLBandes, HerosBandes, HerosNegatif, HerosContours, PBMotif, PBHeros, pad2, PBSommaire, PBChapitres, PBRangees, PBChiffres, PBMarine, PBActions, PageGestionB };
