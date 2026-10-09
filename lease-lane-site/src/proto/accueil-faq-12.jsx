/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-faq-12.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { ACC_H } from '@/proto/accueil-options-1';
import { VOL_H } from '@/proto/accueil-options-3';
import { LL_FAQ } from '@/proto/faq';
import { ACC_FAQ_CATS } from '@/proto/sections-accueil';
import { ouvrirCleo } from '@/proto/seo';
import { __ssr } from '@/lib/hydratation';
const FQ = () => LL_FAQ,
  CT = () => ACC_FAQ_CATS,
  n2 = n => String(n).padStart(2, '0');
const PUB = [['proprietaires', 'Propriétaires'], ['locataires', 'Locataires']],
  AV = "/assets/img/cleo-avatar.png";
const SR = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap'
};
const HAUT = 'calc(var(--web-entete,108px) + 24px)',
  LIG = '1px solid rgba(181,212,247,.14)',
  B6 = 'var(--bleu-600)';
const demander = q => {
  try {
    ouvrirCleo(q);
  } catch (e) {
    location.hash = "/cleo";
  }
};
const liste = pub => {
  const F = FQ(),
    o = [];
  (CT()[pub] || []).forEach(([c, ic, ids]) => ids.forEach(k => {
    if (F[k] && !o.some(x => x.k === k)) o.push({
      k,
      c,
      ic,
      q: F[k].q,
      r: F[k].r
    });
  }));
  return o;
};
const groupes = (pub, L) => (CT()[pub] || []).map(([c, ic, ids]) => ({
  c,
  ic,
  l: ids.map(x => L.find(y => y.k === x && y.c === c)).filter(Boolean)
})).filter(g => g.l.length);
/* Écran étroit (colonnes empilées) : après un choix, ramener la conversation à l'écran. */
const suivre = ref => {
  const el = ref.current;
  if (!el || !el.offsetParent || !((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) || !((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(max-width: 960px)').matches : undefined)) return;
  const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined,
    r = el.getBoundingClientRect(),
    t0 = sc ? sc.getBoundingClientRect().top : 0,
    h = sc ? sc.clientHeight : (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.innerHeight : undefined,
    ent = 96;
  if (r.top >= t0 + ent && r.top < t0 + h * .45) return;
  (sc || window).scrollBy({
    top: r.top - t0 - ent,
    behavior: ACC_H.sansMvt() ? 'auto' : 'smooth'
  });
};
const CSS = '.f12-q:not([aria-current]):hover{background:var(--bleu-025)!important}.f12-q .f12-fl{transition:opacity 200ms,transform 240ms cubic-bezier(.22,1,.36,1)}.f12-q:hover .f12-fl{opacity:1!important;transform:translateX(2px)}' + '.f12-puce:not([aria-pressed="true"]):hover{border-color:var(--bleu-300)!important}.f12-sug:not(:disabled):hover{border-color:var(--bleu-300)!important;background:#fff!important}' + '.f12-ix:hover .f12-ix-t{color:var(--bleu-600)!important}.f12-ix .f12-ix-i{transition:transform 240ms cubic-bezier(.22,1,.36,1)}.f12-ix:hover .f12-ix-i{transform:translateX(3px)}' + '.f12-suj:hover{background:rgba(255,255,255,.04)!important}.f12-qs:not([aria-current]):hover{background:rgba(255,255,255,.08)!important;color:#fff!important}.f12-nav:not(:disabled):hover{border-color:var(--bleu-300)!important;background:var(--bleu-025)!important}.f12-nav:disabled{opacity:.35;cursor:default!important}' + '.f12-q:focus-visible,.f12-ix:focus-visible,.f12-puce:focus-visible,.f12-sug:focus-visible,.f12-nav:focus-visible{outline:2px solid var(--bleu-500);outline-offset:2px}.f12-suj:focus-visible,.f12-qs:focus-visible{outline:2px solid #B5D4F7;outline-offset:2px}' + '.f12-liste,.f12-fil{scrollbar-width:thin;scrollbar-color:var(--bleu-200) transparent}' + '@media (max-width:960px){.f12-g2{grid-template-columns:minmax(0,1fr)!important}.f12-collant{position:relative!important;top:auto!important}.f12-liste{max-height:340px!important}.f12-puce{height:44px!important}.f12-b-chat{height:560px!important}}' + '@media (prefers-reduced-motion:reduce){.f12-q .f12-fl,.f12-ix .f12-ix-i{transition:none}}';

/* Moteur commun : Cléo « écrit », puis la réponse s'affiche mot à mot (instantanée si le mouvement est réduit; un clic sur la bulle l'affiche en entier). */
function useCleo() {
  const [k, setK] = React.useState(null),
    [ph, setPh] = React.useState('repos'),
    [nm, setNm] = React.useState(0),
    tm = React.useRef(0),
    fixe = ACC_H.sansMvt(),
    F = FQ(),
    r = k && F[k] ? F[k].r : '',
    mots = r ? r.split(' ') : [];
  const poser = key => {
    clearTimeout(tm.current);
    setK(key);
    setNm(0);
    if (fixe) {
      setPh('fini');
      return;
    }
    setPh('tape');
    tm.current = setTimeout(() => setPh('flux'), 650);
  };
  const finir = () => {
    clearTimeout(tm.current);
    setPh('fini');
  };
  React.useEffect(() => {
    if (ph !== 'flux') return;
    if (nm >= mots.length) {
      setPh('fini');
      return;
    }
    tm.current = setTimeout(() => setNm(x => x + 1), 22 + Math.random() * 28);
    return () => clearTimeout(tm.current);
  }, [ph, nm, k]);
  React.useEffect(() => () => clearTimeout(tm.current), []);
  return {
    k,
    ph,
    poser,
    finir,
    texte: ph === 'fini' ? r : mots.slice(0, nm).join(' ')
  };
}
const TeteF = ({
  sombre
}) => <h2 style={{
  margin: 0,
  fontSize: 'var(--titre-l)',
  lineHeight: 1.31,
  letterSpacing: '-0.03em',
  fontWeight: 700,
  color: sombre ? '#fff' : ACC_H.MAR,
  maxWidth: '22ch',
  textWrap: 'balance'
}}>{ACC_H.surl('On répond à vos questions {franchement et dans les temps}.', sombre ? '#6194D3' : sombre ? ACC_H.CL : ACC_H.BL)}</h2>;
const Seg = ({
  pub,
  set,
  sombre
}) => <div role="tablist" aria-label="Public" style={{
  display: 'inline-flex',
  padding: '4px',
  borderRadius: '14px',
  background: sombre ? 'rgba(255,255,255,.08)' : '#fff',
  border: sombre ? '1px solid rgba(181,212,247,.2)' : ACC_H.FIN
}}>{PUB.map(([k, t]) => {
    const on = pub === k;
    return <button key={k} type="button" role="tab" aria-selected={on} onClick={() => set(k)} style={{
      height: '44px',
      padding: '0 20px',
      border: 0,
      borderRadius: '10px',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: '14px',
      fontWeight: 600,
      background: on ? sombre ? '#fff' : ACC_H.MAR : 'transparent',
      color: on ? sombre ? ACC_H.MAR : '#fff' : sombre ? '#fff' : ACC_H.MAR,
      transition: 'background 200ms,color 200ms'
    }}>{t}</button>;
  })}</div>;
const Rang = ({
  children
}) => <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '24px 32px'
}}>{children}</div>;
const Cleo = ({
  q,
  sombre
}) => <ACC_H.Button variant={sombre ? 'inverse' : 'secondaire'} size="s" onClick={() => demander(q)} iconeAvant={<ACC_H.Icon name="message-square" size={14} />}>Approfondir avec Cléo</ACC_H.Button>;
const CleoTete = ({
  sombre,
  droite
}) => <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '10px 12px',
  padding: '16px 20px 16px 22px',
  borderBottom: sombre ? LIG : ACC_H.FIN,
  background: sombre ? 'transparent' : '#fff'
}}>
  <span style={{
    position: 'relative',
    flex: 'none'
  }}><img src={AV} alt="" width="38" height="38" style={{
      display: 'block',
      width: '38px',
      height: '38px',
      borderRadius: '12px',
      objectFit: 'cover'
    }} /><span aria-hidden="true" style={{
      position: 'absolute',
      right: '-2px',
      bottom: '-2px',
      width: '11px',
      height: '11px',
      borderRadius: '50%',
      background: '#3FB37F',
      boxShadow: '0 0 0 2px ' + (sombre ? '#132E4E' : '#fff')
    }} /></span>
  <span style={{
    display: 'grid'
  }}><strong style={{
      fontSize: '15px',
      color: sombre ? '#fff' : ACC_H.MAR
    }}>Cléo</strong><span style={{
      fontSize: '12.5px',
      color: sombre ? 'var(--bleu-200)' : 'var(--texte-corps)'
    }}>En ligne 24/7</span></span>
  {droite && <span style={{
    marginLeft: 'auto'
  }}>{droite}</span>}</div>;
const Contexte = ({
  it,
  i,
  n,
  sombre
}) => it ? <span key={it.k} className="cf-entre" style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '30px',
  padding: '0 12px',
  borderRadius: '999px',
  background: sombre ? 'rgba(181,212,247,.12)' : 'var(--bleu-025)',
  fontSize: '12.5px',
  fontWeight: 600,
  color: sombre ? 'var(--bleu-100)' : ACC_H.MAR
}}><ACC_H.Icon name={it.ic} size={13} color={sombre ? ACC_H.CL : B6} />{it.c}{n ? <span style={{
    color: sombre ? 'var(--bleu-300)' : 'var(--texte-corps)',
    fontVariantNumeric: 'tabular-nums'
  }}>{n2(i + 1)}/{n2(n)}</span> : null}</span> : null;
const QBulle = ({
  q
}) => <div className="cf-entre" style={{
  justifySelf: 'end',
  maxWidth: '84%',
  padding: '12px 16px',
  borderRadius: '18px 18px 6px 18px',
  background: 'rgba(12,33,71,.65)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  lineHeight: 1.5
}}>{q}</div>;
const Points = () => <span className="cf-points" style={{
  display: 'inline-flex',
  gap: '5px',
  padding: '6px 0'
}}><span style={SR}>Cléo écrit</span>{[0, 1, 2].map(j => <span key={j} aria-hidden="true" style={{
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: ACC_H.BL,
    display: 'block'
  }} />)}</span>;
const Valide = () => <span className="cf-entre" style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '12px',
  fontSize: '12.5px',
  fontWeight: 600,
  color: '#247A52'
}}><ACC_H.Icon name="check" size={14} color="#247A52" />Validée par notre équipe</span>;
/* Bulle de Cléo : en direct (c) ou figée (txt, réponses précédentes du fil). */
const Reponse = ({
  c,
  txt,
  fond = 'var(--bleu-025)'
}) => {
  const live = !txt,
    ph = live ? c.ph : 'fini',
    flux = ph === 'flux';
  return <div style={{
    display: 'grid',
    gridTemplateColumns: '32px minmax(0,1fr)',
    gap: '12px',
    alignItems: 'start'
  }}><img src={AV} alt="" width="32" height="32" style={{
      width: '32px',
      height: '32px',
      borderRadius: '10px',
      objectFit: 'cover'
    }} />
    <div aria-live={live ? 'polite' : undefined} aria-busy={live ? ph !== 'fini' : undefined} onClick={flux ? c.finir : undefined} style={{
      padding: '14px 16px',
      borderRadius: '6px 18px 18px 18px',
      background: fond,
      border: ACC_H.FIN,
      color: ACC_H.MAR,
      fontSize: '14px',
      lineHeight: 1.7,
      minHeight: '52px',
      cursor: flux ? 'pointer' : 'default'
    }}>
      {ph === 'tape' ? <Points /> : <React.Fragment>{live ? c.texte : txt}{flux && <span aria-hidden="true" className="fq-curseur" style={{
          display: 'inline-block',
          width: '2px',
          height: '1.1em',
          marginLeft: '3px',
          verticalAlign: '-0.18em',
          background: ACC_H.BL
        }} />}</React.Fragment>}
      {live && ph === 'fini' && <Valide />}</div></div>;
};
const Corps = ({
  it,
  c,
  pad = '26px 24px'
}) => <div style={{
  display: 'grid',
  alignContent: 'start',
  gap: '16px',
  padding: pad,
  background: '#fff'
}}>{it && <QBulle key={'q' + it.k} q={it.q} />}{it && <Reponse c={c} />}</div>;

/* A · Index et console : carte blanche des questions (filtre par sujet, numérotation) à gauche; console marine de Cléo, séparée et collante, à droite. */

/* B · Fil de conversation : sommaire ouvert sur fond blanc (sujets en chapitres), conversation claire et collante à droite.
   Chaque question choisie s'ajoute au fil; les questions déjà posées sont cochées; Cléo propose deux questions liées. */

/* C · Sujets et réponse : sur marine, les sujets en accordéon (un ouvert à la fois) à gauche; la carte blanche de Cléo, séparée, à droite.
   La question choisie prend le blanc de la carte de Cléo; précédente et suivante parcourent toutes les questions et ouvrent le bon sujet. */
const NavB = ({
  ic,
  lbl,
  onClick,
  disabled
}) => <button type="button" aria-label={lbl} title={lbl} onClick={onClick} disabled={disabled} className="f12-nav" style={{
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  border: ACC_H.FIN,
  background: '#fff',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  transition: 'background 200ms,border-color 200ms'
}}><ACC_H.Icon name={ic} size={18} color={ACC_H.MAR} /></button>;
function F12C({
  clair
}) {
  const [pub, setPub] = React.useState('proprietaires'),
    L = liste(pub),
    G = groupes(pub, L),
    c = useCleo(),
    [sg, setSg] = React.useState(0),
    ref = React.useRef(null),
    chat = React.useRef(null),
    vu = ACC_H.useVu(chat, .35);
  const it = L.find(x => x.k === c.k) || null,
    idx = it ? L.indexOf(it) : -1;
  const choisir = (x, s) => {
    if (!x) return;
    const gi = G.findIndex(g => g.c === x.c);
    if (gi >= 0) setSg(gi);
    c.poser(x.k);
    if (s) suivre(chat);
  };
  React.useEffect(() => {
    if (vu && !c.k && L[0]) c.poser(L[0].k);
  }, [vu]);
  const changer = p => {
    setPub(p);
    setSg(0);
    const l = liste(p);
    if (l[0]) c.poser(l[0].k);
  };
  return <section ref={ref} className={clair ? 'f12-clair' : 'll-sombre'} style={{
    position: 'relative',
    overflow: 'clip',
    background: clair ? '#fff' : '#0E2340'
  }}><style>{CSS}</style>
    {!clair && <span aria-hidden="true" style={{
      position: 'absolute',
      right: '-16%',
      top: '-12%',
      width: '62%',
      aspectRatio: '1',
      background: 'radial-gradient(closest-side,rgba(69,129,203,.24),rgba(69,129,203,0))',
      pointerEvents: 'none'
    }} />}
    <div style={{
      ...ACC_H.BOITE,
      position: 'relative',
      display: 'grid',
      gap: '40px'
    }}>
      <Rang><TeteF sombre={!clair} /><Seg pub={pub} set={changer} sombre={!clair} /></Rang>
      <div className="f12-g2" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,5fr) minmax(0,7fr)',
        gap: 'clamp(32px,4vw,64px)',
        alignItems: 'start'
      }}>
        <div style={{
          display: 'grid',
          gap: '8px'
        }}>{G.map((g, gi) => {
            const o = gi === sg,
              actif = !!it && it.c === g.c;
            return <div key={pub + g.c} style={{
              borderRadius: '20px',
              background: clair ? o ? '#F7FAFD' : '#fff' : o ? 'rgba(255,255,255,.06)' : 'transparent',
              border: '1px solid ' + (clair ? o ? 'rgba(12,33,71,.22)' : 'rgba(12,33,71,.12)' : o ? 'rgba(181,212,247,.32)' : 'rgba(181,212,247,.12)'),
              transition: 'background 240ms,border-color 240ms'
            }}>
          <h3 style={{
                margin: 0
              }}><button type="button" aria-expanded={o} aria-controls={'f12c-' + gi} onClick={() => setSg(o ? -1 : gi)} className="f12-suj" style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0,1fr) auto auto',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px 12px 12px',
                  border: 0,
                  borderRadius: '20px',
                  background: 'transparent',
                  color: clair ? ACC_H.MAR : '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}><VOL_H.Tuile ic={g.ic} t={40} /><span style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    lineHeight: 1.3
                  }}>{g.c}</span><span style={{
                    minWidth: '26px',
                    height: '26px',
                    padding: '0 8px',
                    borderRadius: '13px',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: clair ? actif ? ACC_H.MAR : '#EEF3F9' : actif ? ACC_H.CL : 'rgba(255,255,255,.1)',
                    color: clair ? actif ? '#fff' : ACC_H.MAR : actif ? ACC_H.MAR : 'var(--bleu-100)',
                    transition: 'background 240ms,color 240ms'
                  }}>{g.l.length}</span><span aria-hidden="true" style={{
                    display: 'grid',
                    transform: o ? 'rotate(180deg)' : 'none',
                    transition: 'transform 300ms cubic-bezier(.22,1,.36,1)'
                  }}><ACC_H.Icon name="chevron-down" size={18} color={clair ? ACC_H.MAR : 'var(--bleu-200)'} /></span></button></h3>
          <ul id={'f12c-' + gi} hidden={!o} className="lls-fondu" style={{
                listStyle: 'none',
                margin: 0,
                padding: '0 8px 8px',
                display: o ? 'grid' : 'none',
                gap: '2px'
              }}>{g.l.map(x => {
                  const on = x.k === c.k;
                  return <li key={x.k}><button type="button" aria-current={on ? 'true' : undefined} onClick={() => choisir(x, true)} className="f12-qs" style={{
                      width: '100%',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0,1fr) 16px',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '11px 14px',
                      borderRadius: '14px',
                      border: 0,
                      background: on ? clair ? 'rgba(12,33,71,.65)' : '#fff' : 'transparent',
                      color: on ? clair ? '#fff' : ACC_H.MAR : clair ? 'var(--texte-corps)' : 'var(--bleu-100)',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      fontWeight: on ? 600 : 500,
                      lineHeight: 1.45,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background 200ms,color 200ms'
                    }}>{x.q}<span aria-hidden="true" style={{
                        display: 'grid',
                        opacity: on ? 1 : 0
                      }}><ACC_H.Icon name="arrow-right" size={15} color={clair ? '#fff' : B6} /></span></button><p hidden>{x.r}</p></li>;
                })}</ul></div>;
          })}</div>
        <div ref={chat} className="f12-collant" style={{
          position: 'sticky',
          top: HAUT,
          display: 'grid',
          gridTemplateRows: 'auto minmax(0,1fr) auto',
          minHeight: '520px',
          borderRadius: '28px',
          overflow: 'hidden',
          background: '#fff',
          border: clair ? '1px solid rgba(12,33,71,.16)' : 0,
          boxShadow: clair ? '0 40px 80px -50px rgba(12,33,71,.45)' : '0 60px 120px -50px rgba(2,8,18,.85)'
        }}>
          <CleoTete droite={<Contexte it={it} i={idx} n={L.length} />} />
          <Corps it={it} c={c} pad="28px 26px" />
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '14px 18px 14px 22px',
            borderTop: ACC_H.FIN
          }}><div>{it && <Cleo q={it.q} />}</div>
            <div style={{
              display: 'flex',
              gap: '8px'
            }}><NavB ic="chevron-left" lbl="Question précédente" disabled={idx <= 0} onClick={() => choisir(L[idx - 1])} /><NavB ic="chevron-right" lbl="Question suivante" disabled={idx < 0 || idx >= L.length - 1} onClick={() => choisir(L[idx + 1])} /></div></div></div></div>
      <Repli pub={pub === 'proprietaires' ? 'locataires' : 'proprietaires'} /></div></section>;
}
/* Onglet inactif : questions et réponses présentes dans le HTML (onglet replié), pour l'indexation et les moteurs génératifs. */
const Repli = ({
  pub
}) => {
  const L = liste(pub),
    G = groupes(pub, L);
  return <div hidden>{G.map(g => <div key={g.c}><h3>{g.c}</h3><ul>{g.l.map(x => <li key={x.k}><span>{x.q}</span><p>{x.r}</p></li>)}</ul></div>)}</div>;
};

/* Revue : « Actuelle » = B · Réponse en direct (série 11), puis les trois options séparées. */
/* FAQ figée : C « Sujets et réponse » retenue, barre de revue retirée. */
let AccFaq = () => <F12C clair />;
export { AccFaq, F12C };
