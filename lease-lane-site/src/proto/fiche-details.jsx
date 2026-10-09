/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/fiche-details.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { FX_DETAILS } from '@/proto/fiche-concepts';
import { __ssr } from '@/lib/hydratation';
const uS = React.useState,
  uE = React.useEffect,
  uR = React.useRef;
const reduit = () => ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : undefined);

/* Pictogrammes des commodités (tracés Lucide, même trait que le reste du site). */
const P = {
  flame: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  ampoule: <><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></>,
  sofa: <><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" /><path d="M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z" /><path d="M4 18v2" /><path d="M20 18v2" /><path d="M12 4v9" /></>,
  auto: <><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></>,
  patte: <><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" /><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" /></>,
  laveuse: <><path d="M3 6h3" /><path d="M17 6h.01" /><rect width="18" height="20" x="3" y="2" rx="2" /><circle cx="12" cy="13" r="5" /><path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5" /></>
};
const PIC = {
  chauff: 'flame',
  eclaire: 'ampoule',
  meuble: 'sofa',
  station: 'auto',
  animaux: 'patte',
  laveuse: 'laveuse'
};
const Pic = ({
  n,
  t = 20
}) => <svg width={t} height={t} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{
  display: 'block',
  flex: 'none'
}}>{P[n]}</svg>;
/* États : couleur + libellé + icône. */
const ETAT = {
  oui: {
    lab: 'Inclus',
    ic: 'check'
  },
  non: {
    lab: 'Non inclus',
    ic: 'minus'
  },
  cond: {
    lab: 'Sous conditions',
    ic: 'info'
  },
  nc: {
    lab: 'À confirmer',
    ic: 'clock'
  }
};
const etatDe = v => v === true ? 'oui' : v === false ? 'non' : v === 'cond' ? 'cond' : 'nc';
const items = () => (FX_DETAILS.INCL || []).map(([k, t,, v]) => ({
  k,
  t,
  e: etatDe(v),
  pic: PIC[k] || 'sofa'
}));
const Badge = ({
  e
}) => <span className={'fd-badge fd-' + e}><Icon name={ETAT[e].ic} size={12} color="currentColor" />{ETAT[e].lab}</span>;
/* Commodités : six présentations. */
function Commod({
  v
}) {
  const L = items();
  if (v === 'puces') return <ul className="fd-puces">{L.map((x, i) => <li key={x.k} className={'fd-' + x.e} style={{
      '--d': i * 50 + 'ms'
    }}><Pic n={x.pic} t={18} /><b>{x.t}</b><Badge e={x.e} /></li>)}</ul>;
  if (v === 'deux') {
    const A = L.filter(x => x.e === 'oui' || x.e === 'cond'),
      B = L.filter(x => x.e === 'non' || x.e === 'nc');
    const Col = ({
      t,
      ic,
      l,
      c
    }) => <div className={'fd-col fd-col-' + c}><h3><Icon name={ic} size={16} color="currentColor" />{t}<span>{l.length}</span></h3><ul>{l.map(x => <li key={x.k}><span className={'fd-pic fd-' + x.e}><Pic n={x.pic} t={18} /></span><b>{x.t}</b><Badge e={x.e} /></li>)}</ul></div>;
    return <div className="fd-deux"><Col t="Inclus" ic="circle-check" l={A} c="oui" /><Col t="Non inclus ou à confirmer" ic="circle-minus" l={B} c="non" /></div>;
  }
  if (v === 'grille') return <><ul className="fd-grille">{L.map((x, i) => <li key={x.k} className={'fd-' + x.e} style={{
        '--d': i * 60 + 'ms'
      }}><span className="fd-gpic"><Pic n={x.pic} t={30} /></span><b>{x.t}</b><Badge e={x.e} /></li>)}</ul></>;
  if (v === 'anneaux') return <ul className="fd-ann">{L.map((x, i) => <li key={x.k} className={'fd-' + x.e} style={{
      '--d': i * 80 + 'ms'
    }}><span className="fd-anneau"><svg className="fd-ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" pathLength="100" /></svg><Pic n={x.pic} t={24} /></span><b>{x.t}</b><Badge e={x.e} /></li>)}</ul>;
  if (v === 'table') return <table className="fd-table"><caption className="fd-sr">Inclus et commodités du logement</caption><thead><tr><th scope="col">Commodité</th><th scope="col">État</th></tr></thead>
    <tbody>{L.map(x => <tr key={x.k} className={'fd-' + x.e}><th scope="row"><span className={'fd-pic fd-' + x.e}><Pic n={x.pic} t={18} /></span>{x.t}</th><td><Badge e={x.e} /></td></tr>)}</tbody></table>;
  return <><ul className="fd-tuiles">{L.map((x, i) => <li key={x.k} className={'fd-' + x.e} style={{
        '--d': i * 60 + 'ms'
      }}><span className={'fd-pic fd-' + x.e}><Pic n={x.pic} t={20} /></span><span><b>{x.t}</b><Badge e={x.e} /></span></li>)}</ul></>;
}

/* Sections partagées. */
const SECT = [['apercu', 'Aperçu', 'file-text'], ['inclus', 'Inclus', 'layers'], ['immeuble', 'L’immeuble', 'building-2'], ['secteur', 'Le secteur', 'map-pin'], ['conditions', 'Conditions', 'shield-check']];
function Contenu({
  k,
  v
}) {
  if (k === 'apercu') return <div className="fd-desc"><p className="fx-p">{FX_DETAILS.DESC}</p><p className="fx-p">{FX_DETAILS.DESC2}</p><p className="fx-ref">Réf. {FX_DETAILS.L && FX_DETAILS.L.ref}</p>{FX_DETAILS.Groupes && <FX_DETAILS.Groupes className="fx-grp-3" />}</div>;
  if (k === 'inclus') return <Commod v={v} />;
  if (k === 'immeuble') return FX_DETAILS.Immeuble ? <FX_DETAILS.Immeuble /> : null;
  if (k === 'secteur') return FX_DETAILS.Secteur ? <FX_DETAILS.Secteur /> : null;
  if (k === 'conditions') return FX_DETAILS.Conditions ? <FX_DETAILS.Conditions /> : null;
  return null;
}
/* Onglets accessibles (flèches, Début, Fin) — habillage selon l'option. */
function Onglets({
  cls,
  icones,
  v,
  glisse
}) {
  const [o, setO] = uS('apercu'),
    refs = uR([]),
    barre = uR(null);
  uE(() => {
    if (!glisse) return;
    const b = refs.current[SECT.findIndex(x => x[0] === o)],
      t = barre.current;
    if (b && t) {
      t.style.width = b.offsetWidth + 'px';
      t.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    }
  }, [o]);
  uE(() => {
    const b = refs.current[SECT.findIndex(x => x[0] === o)];
    if (b && b.parentElement && b.parentElement.scrollWidth > b.parentElement.clientWidth) b.parentElement.scrollTo({
      left: b.offsetLeft - (b.parentElement.clientWidth - b.offsetWidth) / 2,
      behavior: reduit() ? 'auto' : 'smooth'
    });
  }, [o]);
  const cle = (e, i) => {
    let n = null;
    if (e.key === 'ArrowRight') n = (i + 1) % SECT.length;
    if (e.key === 'ArrowLeft') n = (i - 1 + SECT.length) % SECT.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = SECT.length - 1;
    if (n !== null) {
      e.preventDefault();
      setO(SECT[n][0]);
      refs.current[n].focus();
    }
  };
  return <div className={'fd-ong ' + cls}>
    <div className="fd-ong-bande"><div role="tablist" aria-label="Détails du logement" className="fd-ong-l">{SECT.map(([k, t, ic], i) => <button key={k} ref={el => refs.current[i] = el} type="button" role="tab" id={'fd-t-' + k} aria-controls={'fd-p-' + k} aria-selected={o === k} tabIndex={o === k ? 0 : -1} onClick={() => setO(k)} onKeyDown={e => cle(e, i)}>
      {icones && <span className="fd-ong-ic" aria-hidden="true"><Icon name={ic} size={18} color="currentColor" /></span>}<span>{t}</span></button>)}{glisse && <i ref={barre} aria-hidden="true" />}</div></div>
    <div role="tabpanel" id={'fd-p-' + o} aria-labelledby={'fd-t-' + o} tabIndex={0} className="fd-ong-p" key={o}><Contenu k={o} v={v} /></div></div>;
}

/* 2 · Ancres : sections à la suite; la bande collante suit le défilement. */

/* 4 · Accordéon */

/* 6 · Latéral : navigation verticale; menu déroulant sur mobile. */

const CSS = `
.fd-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.fd-h3{margin:0 0 16px;font-size:18px;font-weight:700;letter-spacing:-.01em;color:var(--marine-900)}
/* États (succès, gris, ambre, bleu) — contraste AA du texte sur fond pâle */
.fd-badge{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border-radius:7px;font-size:12px;font-weight:600;white-space:nowrap}
.fd-badge.fd-oui{background:#E3F4EC;color:#14664A}.fd-badge.fd-non{background:#EEF1F5;color:#4A5668}.fd-badge.fd-cond{background:#FDF1DC;color:#8A5300}.fd-badge.fd-nc{background:#E6EFFA;color:#2E5788}
.fd-pic{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;flex:none}
.fd-pic.fd-oui{background:#E3F4EC;color:#17795E}.fd-pic.fd-non{background:#EEF1F5;color:#6B7789}.fd-pic.fd-cond{background:#FDF1DC;color:#B36B00}.fd-pic.fd-nc{background:#E6EFFA;color:#3767A2}
.fd-leg{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-wrap:nowrap;gap:8px;white-space:nowrap}
@keyframes fd-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.fd-ong-p,.fd-lat-p,.fd-acc-p{animation:fd-in .45s cubic-bezier(.22,1,.36,1) both}
.fd-ong-p:focus-visible{outline:2px solid var(--bleu-500);outline-offset:6px;border-radius:8px}
.fd-ong-p{padding-top:24px}
.fd-ong-l{position:relative;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}.fd-ong-l::-webkit-scrollbar{display:none}
.fd-ong-l button{flex:none;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border:0;background:none;font:600 14px var(--police-corps);color:var(--gris-600);cursor:pointer;transition:color .2s,background-color .25s,border-color .25s}
.fd-ong-l button:focus-visible,.fd-anc-l button:focus-visible,.fd-acc button:focus-visible,.fd-lat button:focus-visible,.fd-lat select:focus-visible{outline:2px solid var(--bleu-500);outline-offset:2px}
/* 1 Pilule */
.fd-pil .fd-ong-l{display:inline-flex;max-width:100%;padding:5px;border-radius:14px;background:#F2F6FB;border:1px solid rgba(12,33,71,.08)}
.fd-pil .fd-ong-l button{border-radius:10px;color:var(--marine-900)}
.fd-pil .fd-ong-l button[aria-selected=true]{background:var(--marine-900);color:#fff;box-shadow:0 8px 18px -10px rgba(12,33,71,.6)}
.fd-pil .fd-ong-l button:not([aria-selected=true]):hover{background:#fff}
.fd-pil .fd-desc{padding:24px;border-radius:18px;background:#fff;border:1px solid var(--gris-100)}
.fd-tuiles{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.fd-tuiles li{display:flex;align-items:center;gap:12px;padding:14px;border-radius:14px;border:1px solid var(--gris-100);background:#fff;animation:fd-in .5s cubic-bezier(.22,1,.36,1) var(--d,0ms) both}
.fd-tuiles li>span:last-child{display:grid;gap:6px;justify-items:start}.fd-tuiles b{font-size:14px;font-weight:600;color:var(--marine-900)}
.fd-tuiles li.fd-oui{border-color:#B9E2CF;background:#F6FBF8}.fd-tuiles li.fd-cond{border-color:#F3D9A8}.fd-tuiles li.fd-nc{border-color:#C6D9F0}
/* 2 Ancres */
.fd-anc-bande{position:sticky;top:calc(var(--web-entete,108px) + 8px);z-index:20;margin-bottom:8px;padding:6px;border-radius:14px;background:rgba(255,255,255,.92);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid var(--gris-100);box-shadow:0 14px 30px -24px rgba(12,33,71,.5)}
.fd-anc-l{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}.fd-anc-l::-webkit-scrollbar{display:none}
.fd-anc-l button{flex:none;display:inline-flex;align-items:center;gap:7px;min-height:44px;padding:0 14px;border:0;border-radius:10px;background:none;font:600 13.5px var(--police-corps);color:var(--gris-600);cursor:pointer;transition:background-color .25s,color .25s}
.fd-anc-l button[aria-current=true]{background:var(--marine-900);color:#fff}
.fd-anc-s{padding:28px 0;border-top:1px solid var(--gris-100)}.fd-anc-s:first-of-type{border-top:0}
.fd-puces{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.fd-puces li{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:6px 8px 6px 14px;border-radius:12px;border:1px solid var(--gris-100);background:#fff;animation:fd-in .45s cubic-bezier(.22,1,.36,1) var(--d,0ms) both}
.fd-puces b{font-size:14px;font-weight:600;color:var(--marine-900)}
.fd-puces li.fd-oui{color:#17795E}.fd-puces li.fd-non{color:#6B7789}.fd-puces li.fd-cond{color:#B36B00}.fd-puces li.fd-nc{color:#3767A2}
/* 3 Icônes */
.fd-ico .fd-ong-l{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.fd-ico .fd-ong-l button{flex-direction:column;justify-content:center;gap:8px;min-height:92px;padding:12px 8px;border-radius:16px;border:1px solid var(--gris-100);background:#fff;color:var(--marine-900);text-align:center}
.fd-ico .fd-ong-ic{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:var(--bleu-025);color:var(--bleu-600);transition:background-color .25s,color .25s}
.fd-ico .fd-ong-l button[aria-selected=true]{border-color:var(--marine-900);box-shadow:inset 0 -3px 0 var(--marine-900)}
.fd-ico .fd-ong-l button[aria-selected=true] .fd-ong-ic{background:var(--marine-900);color:#fff}
.fd-ico .fd-ong-l button:not([aria-selected=true]):hover{border-color:rgba(12,33,71,.3)}
.fd-deux{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.fd-col{border-radius:18px;border:1px solid var(--gris-100);overflow:hidden;background:#fff}
.fd-col h3{margin:0;display:flex;align-items:center;gap:8px;padding:14px 18px;font-size:15px;font-weight:700}
.fd-col h3 span{margin-left:auto;min-width:26px;height:26px;padding:0 8px;border-radius:8px;display:grid;place-items:center;font-size:12.5px;background:#fff}
.fd-col-oui h3{background:#E3F4EC;color:#14664A}.fd-col-non h3{background:#EEF1F5;color:#4A5668}
.fd-col ul{list-style:none;margin:0;padding:6px 18px 12px}
.fd-col li{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--gris-100)}.fd-col li:first-child{border-top:0}
.fd-col b{font-size:14px;font-weight:600;color:var(--marine-900)}
/* 4 Accordéon */
.fd-acc{display:grid;gap:10px}
.fd-acc-i{border-radius:16px;border:1px solid var(--gris-100);background:#fff;overflow:hidden;transition:border-color .25s,box-shadow .25s}
.fd-acc-i.on{border-color:rgba(12,33,71,.25);box-shadow:0 18px 40px -30px rgba(12,33,71,.45)}
.fd-acc h3{margin:0}
.fd-acc button{width:100%;display:grid;grid-template-columns:40px minmax(0,1fr) 24px;gap:12px;align-items:center;min-height:64px;padding:10px 16px;border:0;background:none;text-align:left;font:700 15px var(--police-corps);color:var(--marine-900);cursor:pointer}
.fd-acc .fd-ong-ic{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:var(--bleu-025);color:var(--bleu-600)}
.fd-acc-i.on .fd-ong-ic{background:var(--marine-900);color:#fff}
.fd-acc-fl{display:grid;transition:transform .3s cubic-bezier(.22,1,.36,1)}.fd-acc-i.on .fd-acc-fl{transform:rotate(180deg)}
.fd-acc-p{padding:4px 16px 20px}
.fd-grille{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.fd-grille li{display:grid;justify-items:center;gap:10px;padding:18px 10px;border-radius:16px;text-align:center;animation:fd-in .5s cubic-bezier(.22,1,.36,1) var(--d,0ms) both}
.fd-grille b{font-size:14px;font-weight:600;color:var(--marine-900)}
.fd-gpic{display:grid;place-items:center;width:60px;height:60px;border-radius:16px;background:#fff}
.fd-grille li.fd-oui{background:#E3F4EC}.fd-grille li.fd-oui .fd-gpic{color:#17795E}
.fd-grille li.fd-non{background:#F3F5F8}.fd-grille li.fd-non .fd-gpic{color:#6B7789}
.fd-grille li.fd-cond{background:#FDF1DC}.fd-grille li.fd-cond .fd-gpic{color:#B36B00}
.fd-grille li.fd-nc{background:#E6EFFA}.fd-grille li.fd-nc .fd-gpic{color:#3767A2}
/* 5 Bande marine */
.fd-mar .fd-ong-bande{margin:0 calc(-1 * var(--web-gouttiere));padding:8px var(--web-gouttiere) 0;background:var(--degrade-marine,var(--marine-900));border-radius:18px 18px 0 0}
.fd-mar .fd-ong-l button{color:#B5CDEA;min-height:52px}
.fd-mar .fd-ong-l button[aria-selected=true]{color:#fff}
.fd-mar .fd-ong-l button:not([aria-selected=true]):hover{color:#fff}
.fd-mar .fd-ong-l i{position:absolute;left:0;bottom:0;height:3px;border-radius:3px 3px 0 0;background:#6194D3;transition:transform .35s cubic-bezier(.22,1,.36,1),width .35s cubic-bezier(.22,1,.36,1)}
.fd-mar .fd-ong-p{margin:0 calc(-1 * var(--web-gouttiere));padding:28px var(--web-gouttiere);background:var(--bleu-025);border-radius:0 0 18px 18px}
.fd-ann{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}
.fd-ann li{display:grid;justify-items:center;gap:10px;text-align:center}
.fd-ann b{font-size:13.5px;font-weight:600;color:var(--marine-900)}
.fd-anneau{position:relative;display:grid;place-items:center;width:72px;height:72px;border-radius:50%;background:#fff}
.fd-anneau .fd-ring{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.fd-anneau circle{fill:none;stroke-width:3.5;stroke-linecap:round;stroke-dasharray:100;stroke-dashoffset:100;animation:fd-trace 1s cubic-bezier(.65,0,.35,1) var(--d,0ms) forwards}
@keyframes fd-trace{to{stroke-dashoffset:0}}
.fd-ann li.fd-oui .fd-anneau{color:#17795E}.fd-ann li.fd-oui circle{stroke:#17795E}
.fd-ann li.fd-non .fd-anneau{color:#6B7789}.fd-ann li.fd-non circle{stroke:#C3CBD6}
.fd-ann li.fd-cond .fd-anneau{color:#B36B00}.fd-ann li.fd-cond circle{stroke:#E19A2C}
.fd-ann li.fd-nc .fd-anneau{color:#3767A2}.fd-ann li.fd-nc circle{stroke:#6194D3;stroke-dasharray:6 4}
/* 6 Latéral */
.fd-lat{display:grid;grid-template-columns:240px minmax(0,1fr);gap:32px;align-items:start}
.fd-lat-nav ul{list-style:none;margin:0;padding:8px;display:grid;gap:4px;border-radius:16px;background:var(--bleu-025)}
.fd-lat-nav button{width:100%;display:grid;grid-template-columns:20px minmax(0,1fr) 16px;gap:10px;align-items:center;min-height:48px;padding:0 12px;border:0;border-radius:11px;background:none;text-align:left;font:600 14px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:background-color .25s,color .25s}
.fd-lat-nav button[aria-current=true]{background:var(--marine-900);color:#fff}
.fd-lat-nav button:not([aria-current=true]):hover{background:#fff}
.fd-lat-sel{display:none;position:relative}
.fd-lat-sel select{width:100%;height:52px;padding:0 44px 0 16px;border-radius:12px;border:1px solid rgba(12,33,71,.18);background:#fff;font:600 15px var(--police-corps);color:var(--marine-900);-webkit-appearance:none;appearance:none;text-align:center;text-align-last:center}
.fd-lat-sel>svg{position:absolute;right:16px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--marine-900)}
.fd-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--gris-100);border-radius:16px;overflow:hidden;background:#fff}
.fd-table th,.fd-table td{padding:12px 16px;text-align:left;border-top:1px solid var(--gris-100);font-size:14px}
.fd-table thead th{border-top:0;background:var(--bleu-025);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gris-600)}
.fd-table tbody th{display:flex;align-items:center;gap:12px;font-weight:600;color:var(--marine-900)}
.fd-table td{text-align:right}
/* Tablette */
@media (max-width:960px){.fd-tuiles,.fd-grille{grid-template-columns:repeat(2,minmax(0,1fr))}.fd-ann{grid-template-columns:repeat(3,minmax(0,1fr));row-gap:22px}.fd-lat{grid-template-columns:200px minmax(0,1fr);gap:24px}
  .fd-ico .fd-ong-l{display:flex;overflow-x:auto}.fd-ico .fd-ong-l button{min-width:116px}}
/* Mobile */
@media (max-width:620px){
  .fd-tuiles,.fd-deux{grid-template-columns:minmax(0,1fr)}
  .fd-grille{grid-template-columns:repeat(2,minmax(0,1fr))}
  .fd-ann{grid-template-columns:repeat(2,minmax(0,1fr))}
  .fd-pil .fd-ong-l{display:flex}
  .fd-pil .fd-desc{padding:18px}
  .fd-leg,.fd-puces{justify-content:center}
  .fd-lat{grid-template-columns:minmax(0,1fr)}.fd-lat-sel{display:block}.fd-lat-nav ul{display:none}
  .fd-mar .fd-ong-bande{border-radius:0}.fd-mar .fd-ong-p{border-radius:0}
  .fd-table th,.fd-table td{padding:12px}
  .fd-col li{grid-template-columns:40px minmax(0,1fr);row-gap:6px}.fd-col li .fd-badge{grid-column:2;justify-self:start}
}
@media (prefers-reduced-motion:reduce){.fd-ong-p,.fd-lat-p,.fd-acc-p,.fd-tuiles li,.fd-puces li,.fd-grille li{animation:none!important}.fd-anneau circle{animation:none!important;stroke-dashoffset:0}.fd-ong-l i,.fd-acc-fl{transition:none!important}}`;

/* Option retenue : 1 « Pilule » (choix final du 9 oct. 2026); bandeau de revue retiré. Les autres options restent dans ce fichier, inactives. */
function Details() {
  return <><style>{CSS}</style><div className="fd"><Onglets cls="fd-pil" v="tuiles" /></div></>;
}
export { Details as FicheDetails };
