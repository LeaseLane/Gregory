/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/demande.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { LLBandes } from '@/proto/pages-proprio-b';
import { FilAriane, gab } from '@/proto/blocs';
import { ouvrirCleo } from '@/proto/seo';
const AV = "/assets/img/cleo-avatar.png";
const O2 = '0 2px 4px rgba(12,33,71,.06),0 24px 56px rgba(12,33,71,.14)';
const FLs = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const CTD = {
  maxWidth: 'var(--web-conteneur)',
  margin: '0 auto',
  padding: '0 var(--web-gouttiere)',
  boxSizing: 'border-box'
};

/* Version 2 : carte en deux volets — colonne des étapes marine (progression, état de chaque étape, aide de Cléo) et formulaire aéré;
   « Ce qui suit » passe sous la carte, en cartes numérotées. Même API que la version 1. */
const CSS2 = `.lld2-carte{position:relative;display:grid;grid-template-columns:288px minmax(0,1fr);background:#fff;border-radius:24px;border:1px solid rgba(12,33,71,.12);box-shadow:${O2};overflow:hidden}
.lld2-carte.seul{grid-template-columns:minmax(0,1fr)}
.lld2-cote{position:relative;isolation:isolate;display:flex;flex-direction:column;gap:28px;padding:32px 28px;background:var(--degrade-marine);color:#fff}
.lld2-cote::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--lueur-bleue);opacity:.6}
.lld2-prog{display:grid;gap:10px}.lld2-prog b{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--bleu-300)}
.lld2-prog span{height:6px;border-radius:6px;background:rgba(255,255,255,.14);overflow:hidden}.lld2-prog i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,var(--bleu-300),#fff);transform-origin:0 50%;transition:transform .6s cubic-bezier(.22,1,.36,1)}
.lld2-et{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.lld2-et li{position:relative;display:grid;grid-template-columns:36px minmax(0,1fr);gap:14px;align-items:center;min-height:52px;padding:8px 10px 8px 8px;border-radius:14px;transition:background-color .3s}
.lld2-et li[aria-current]{background:rgba(255,255,255,.08)}
.lld2-et li:not(:last-child)::after{content:"";position:absolute;left:25px;top:48px;height:14px;width:2px;border-radius:2px;background:rgba(255,255,255,.18)}.lld2-et li.fait:not(:last-child)::after{background:var(--bleu-300)}
.lld2-m{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-size:13px;font-weight:700;border:1.5px solid rgba(255,255,255,.28);color:var(--bleu-100);transition:background-color .3s,border-color .3s,color .3s,box-shadow .3s}
.lld2-et li.fait .lld2-m{background:var(--bleu-500);border-color:var(--bleu-500);color:#fff}
.lld2-et li[aria-current] .lld2-m{background:#fff;border-color:#fff;color:var(--marine-900);box-shadow:0 0 0 5px rgba(255,255,255,.14)}
.lld2-et strong{display:block;font-size:14px;font-weight:600;line-height:1.3;color:#fff}.lld2-et small{display:block;font-size:12px;color:var(--bleu-100)}
.lld2-et li:not(.fait):not([aria-current]) strong{color:rgba(255,255,255,.72)}
.lld2-aide{margin-top:auto;display:grid;grid-template-columns:40px minmax(0,1fr) 16px;gap:12px;align-items:center;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);color:#fff;cursor:pointer;text-align:left;font-family:var(--police-corps);transition:background-color .25s,border-color .25s}
.lld2-aide:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.32)}.lld2-aide img{width:40px;height:40px;border-radius:12px;object-fit:cover}
.lld2-aide strong{display:block;font-size:14px;font-weight:700;color:#fff!important}.lld2-aide span span{display:block;font-size:12.5px;color:var(--bleu-100)}
.lld2-form{display:flex;flex-direction:column;padding:clamp(28px,3.4vw,48px)}.lld2-form>form.fp{flex:1;display:flex!important;flex-direction:column}
.lld2-suite{display:grid;gap:20px;margin-top:clamp(40px,5vw,56px)}
.lld2-suite-g{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
.lld2-suite-g li{display:grid;gap:12px;align-content:start;padding:22px;border-radius:18px;background:#fff;border:1px solid rgba(12,33,71,.08);transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .4s,border-color .3s}
.lld2-suite-g li:hover{transform:translateY(-3px);border-color:rgba(69,129,203,.35);box-shadow:0 20px 40px -28px rgba(12,33,71,.4)}
.lld2-suite-g li>span{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:var(--bleu-025);font-size:13px;font-weight:700;color:var(--bleu-600)}
.lld2-suite-g strong{font-size:15px;font-weight:700;line-height:1.35;color:var(--marine-900)}.lld2-suite-g p{margin:0;font-size:13px;line-height:1.55;color:var(--gris-700)}
.lld2-pied{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 32px}
.lld2 :focus-visible{outline:2px solid var(--bleu-500);outline-offset:3px}.lld2-cote :focus-visible{outline-color:var(--bleu-300)}
@media (max-width:960px){.lld2-carte{grid-template-columns:minmax(0,1fr)}.lld2-cote{padding:20px;gap:16px}.lld2-et{grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:4px}.lld2-et li{grid-template-columns:36px;justify-content:center;padding:6px}
  .lld2-et li>span:last-child{display:none}.lld2-et li::after{display:none}.lld2-aide{display:none}}
@media (prefers-reduced-motion:reduce){.lld2 *{transition:none!important}}`;
function GabaritDemande({
  route,
  titre,
  lead,
  pastilles = [],
  etapes = [],
  suite = [],
  confid,
  children,
  aside,
  apres
}) {
  const [act, setAct] = React.useState(0);
  const enfant = React.Children.map(children, c => React.isValidElement(c) ? React.cloneElement(c, {
    onEtape: setAct,
    sansEntete: true
  }) : c);
  const fini = act < 0,
    N = etapes.length,
    cote = N > 1,
    cur = fini ? N : act;
  const etat = i => i < cur ? ['fait', 'Terminé'] : i === cur ? ['', 'En cours'] : ['', 'À venir'];
  return <div className="lld2" style={{
    background: 'var(--surface-douce)'
  }}><style>{CSS2}</style>
    <section className="ll-sombre" style={{
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--degrade-marine)'
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--lueur-bleue)',
        pointerEvents: 'none'
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg,rgba(4,14,28,.62) 0%,rgba(4,14,28,.38) 38%,rgba(4,14,28,0) 72%)',
        pointerEvents: 'none'
      }} />
      {<div aria-hidden="true" className="llh-deco" style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 'max(56%,calc(50% + 120px))',
        right: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}><LLBandes /></div>}
      <div className="lld-haut" style={{
        ...CTD,
        position: 'relative',
        padding: '48px var(--web-gouttiere) 152px',
        display: 'grid',
        gap: '24px'
      }}>
        <FilAriane fil={route.fil} clair />
        <h1 style={{
          margin: '16px 0 0',
          fontSize: 'clamp(34.4px,3.01vw,43px)',
          lineHeight: 1.29,
          letterSpacing: '-0.03em',
          color: '#fff',
          maxWidth: '24ch',
          textWrap: 'balance'
        }}>{gab(titre)}</h1>
        {lead && <p style={{
          margin: 0,
          fontSize: '14px',
          lineHeight: 1.65,
          color: 'var(--bleu-100)',
          maxWidth: '60ch'
        }}>{gab(lead)}</p>}
        {pastilles.length > 0 && <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>{pastilles.map(([ic, t]) => <span key={t} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '36px',
            padding: '0 14px 0 10px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            background: 'rgba(255,255,255,.08)',
            border: '1px solid rgba(255,255,255,.2)',
            color: '#fff'
          }}><Icon name={ic} size={15} color="var(--bleu-300)" />{t}</span>)}</div>}
      </div></section>
    <div style={{
      ...CTD,
      position: 'relative',
      marginTop: '-104px',
      paddingBottom: 'var(--web-section)'
    }}>
      <div className={'lld2-carte' + (cote ? '' : ' seul')}>
        {cote && <div className="lld2-cote ll-sombre">
          <div className="lld2-prog"><b>{fini ? 'Demande envoyée' : 'Étape ' + (act + 1) + ' sur ' + N}</b><span aria-hidden="true"><i style={{
                transform: 'scaleX(' + (fini ? 1 : (act + .5) / N) + ')'
              }}></i></span>
            <span className="lld2-courant" style={{
              display: 'none',
              height: 'auto',
              background: 'none',
              fontSize: '15px',
              fontWeight: 700,
              color: '#fff'
            }}>{fini ? '' : etapes[act]}</span></div>
          <ol className="lld2-et" aria-label="Étapes de la demande">{etapes.map((t, i) => {
              const [cl, lib] = etat(i);
              return <li key={t} className={cl} aria-current={!fini && i === act ? 'step' : undefined}>
            <span className="lld2-m" aria-hidden="true">{cl === 'fait' ? <Icon name="check" size={16} color="#fff" /> : i + 1}</span>
            <span><strong>{t}</strong><small>{lib}</small></span></li>;
            })}</ol>
          <button type="button" onClick={() => ouvrirCleo()} className="lld2-aide"><img src={AV} alt="" /><span><strong>Besoin d’aide?</strong><span>Cléo vous guide, 24/7</span></span>{FLs}</button>
        </div>}
        <div className="lld2-form">{enfant}</div></div>
      {suite.length > 0 && <div className="lld2-suite">
        <div className="lld2-pied"><span style={{
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: 'var(--marine-900)'
          }}>Ce qui suit</span>{aside}</div>
        <ol className="lld2-suite-g">{suite.map((s, i) => {
            const [t, d] = Array.isArray(s) ? s : [s];
            return <li key={t}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><strong>{gab(t)}</strong>{d && <p>{gab(d)}</p>}</li>;
          })}</ol>
        <p style={{
          margin: 0,
          display: 'grid',
          gridTemplateColumns: '20px minmax(0,1fr)',
          gap: '10px',
          fontSize: '13px',
          lineHeight: 1.6,
          color: 'var(--gris-700)'
        }}><Icon name="shield-check" size={18} color="var(--bleu-600)" /><span>{confid || 'Seulement ce qui est nécessaire, conservé pour une durée limitée (Loi 25).'} <a href="/confidentialite">Politique de confidentialité</a></span></p></div>}
      {!suite.length && aside}
    </div>
    {apres}
  </div>;
}
export { GabaritDemande };
