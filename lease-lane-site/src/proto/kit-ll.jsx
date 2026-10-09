/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/kit-ll.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
const KITS = {
  A: {
    nom: 'Voie',
    r: '12px',
    rs: '8px',
    rb: '12px',
    bd: '1px solid rgba(12,33,71,.14)',
    sw: 1.75,
    ombre: '0 1px 2px rgba(12,33,71,.05),0 20px 44px -30px rgba(12,33,71,.4)',
    teinte: '#F3F7FC',
    ic: 'carre'
  },
  B: {
    nom: 'Clé',
    r: '24px',
    rs: '14px',
    rb: '999px',
    bd: '1px solid transparent',
    sw: 1.5,
    ombre: '0 1px 2px rgba(12,33,71,.04),0 24px 56px -32px rgba(12,33,71,.35)',
    teinte: '#ECF2F9',
    ic: 'rond'
  },
  C: {
    nom: 'Plan',
    r: '4px',
    rs: '2px',
    rb: '4px',
    bd: '1px solid rgba(12,33,71,.24)',
    sw: 2,
    ombre: 'none',
    teinte: '#F7F9FC',
    ic: 'cadre'
  }
};
const KitCtx = React.createContext('A');
const useKit = () => React.useContext(KitCtx);
const vars = k => {
  const K = KITS[k] || KITS.A;
  return {
    '--k-r': K.r,
    '--k-rs': K.rs,
    '--k-rb': K.rb,
    '--k-bd': K.bd,
    '--k-ombre': K.ombre,
    '--k-teinte': K.teinte
  };
};
const Kit = ({
  k = 'A',
  children,
  style,
  className
}) => <KitCtx.Provider value={k}><div data-kit={k} className={'k-racine ' + (className || '')} style={{
    ...vars(k),
    ...style
  }}>{children}</div></KitCtx.Provider>;
/* Icônes Lease Lane — grille 24, traits ronds. */
const P = {
  cle: ['M14.2 9.8 20 4', 'M17.5 6.5l2 2', 'M15.2 8.8l1.6 1.6', {
    c: [9, 15, 4.6]
  }],
  immeuble: ['M4 21V5.5L11 3v18', 'M11 9h9v12', 'M2.5 21h19', 'M7 8v.01', 'M7 11.5v.01', 'M7 15v.01', 'M14.5 12.5h2', 'M14.5 16h2'],
  loyer: ['M6 3h12v18l-3-1.8L12 21l-3-1.8L6 21z', 'M9 8h6', 'M9 11.5h6', 'M9 15h3.5'],
  outil: ['M14.7 5.3a4.2 4.2 0 0 0-1.1 4.1L4.8 18.2a1.8 1.8 0 0 0 2.6 2.6l8.8-8.8a4.2 4.2 0 0 0 4.1-1.1 4.2 4.2 0 0 0 1-4.2l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6a4.2 4.2 0 0 0-3.6 1.6z'],
  bulle: ['M4 5.5h16v10.5H10l-6 4.5z', 'M8 9.5h8', 'M8 12.5h5'],
  calendrier: ['M4 6h16v14H4z', 'M4 10.5h16', 'M8.5 3.5v4', 'M15.5 3.5v4', 'M8 14h2.5'],
  telephone: ['M6.5 3.5h3l1.8 4.6-2.3 1.6a11 11 0 0 0 5.3 5.3l1.6-2.3 4.6 1.8v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z'],
  courriel: ['M3.5 6h17v12h-17z', 'M3.5 7l8.5 6 8.5-6'],
  epingle: ['M12 21s6.5-5.8 6.5-11.2a6.5 6.5 0 0 0-13 0C5.5 15.2 12 21 12 21z', {
    c: [12, 9.8, 2.4]
  }],
  graphique: ['M4 20h16', 'M7 16.5v-4', 'M12 16.5V7.5', 'M17 16.5v-7'],
  document: ['M6.5 3h7.5l4.5 4.5V21h-12z', 'M14 3v4.5h4.5', 'M9.5 12.5h6', 'M9.5 16h6'],
  horloge: [{
    c: [12, 12, 8.5]
  }, 'M12 7.5V12l3 2'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  fleche: ['M5 12h14', 'M13 6l6 6-6 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  moins: ['M5 12h14'],
  alerte: ['M12 3.5 21.5 20h-19z', 'M12 10v4.5', 'M12 17.3v.01'],
  bouclier: ['M12 3l7.5 3v6c0 4.8-3.3 7.9-7.5 9-4.2-1.1-7.5-4.2-7.5-9V6z', 'M8.8 12l2.2 2.2 4.2-4.4'],
  porte: ['M6 21V3.5h12V21', 'M3 21h18', 'M14.5 12.5v.01'],
  cleo: ['M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z', 'M18.5 16v4', 'M16.5 18h4'],
  guillemets: ['M5 17c2.5-1 3.5-3 3.5-6V7H4.5v4.5h4', 'M15 17c2.5-1 3.5-3 3.5-6V7h-4v4.5h4'],
  carte: ['M3.5 6.5 9 4l6 2.5 5.5-2.5v13L15 19.5 9 17l-5.5 2.5z', 'M9 4v13', 'M15 6.5v13'],
  personne: [{
    c: [12, 8, 3.6]
  }, 'M4.5 20.5c1-3.8 4-5.8 7.5-5.8s6.5 2 7.5 5.8']
};
function Ico({
  n,
  t = 22,
  c = 'currentColor',
  sw
}) {
  const k = useKit(),
    w = sw || (KITS[k] || KITS.A).sw,
    d = P[n] || P.check;
  return <svg viewBox="0 0 24 24" width={t} height={t} aria-hidden="true" focusable="false" fill="none" stroke={c} strokeWidth={w} strokeLinecap={k === 'C' ? 'square' : 'round'} strokeLinejoin={k === 'C' ? 'miter' : 'round'} style={{
    display: 'block',
    flex: 'none'
  }}>{d.map((p, i) => typeof p === 'string' ? <path key={i} d={p} /> : <circle key={i} cx={p.c[0]} cy={p.c[1]} r={p.c[2]} />)}</svg>;
}
/* Pastille d'icône : carré arrondi marine (A), rond teinté (B), cadre fin (C). */
function Pastille({
  n,
  t = 48,
  clair
}) {
  const k = useKit(),
    s = {
      width: t + 'px',
      height: t + 'px',
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      boxSizing: 'border-box'
    };
  if (k === 'B') return <span aria-hidden="true" style={{
    ...s,
    borderRadius: '50%',
    background: clair ? 'rgba(255,255,255,.1)' : '#fff',
    boxShadow: clair ? 'none' : '0 1px 2px rgba(12,33,71,.06),0 8px 20px -10px rgba(12,33,71,.3)'
  }}><Ico n={n} t={Math.round(t * .46)} c={clair ? '#fff' : '#3767A2'} /></span>;
  if (k === 'C') return <span aria-hidden="true" style={{
    ...s,
    borderRadius: '2px',
    border: '1px solid ' + (clair ? 'rgba(255,255,255,.4)' : '#0C2147')
  }}><Ico n={n} t={Math.round(t * .46)} c={clair ? '#fff' : '#0C2147'} /></span>;
  return <span aria-hidden="true" style={{
    ...s,
    borderRadius: Math.round(t * .27) + 'px',
    background: clair ? 'rgba(255,255,255,.12)' : '#0C2147'
  }}><Ico n={n} t={Math.round(t * .46)} c="#fff" /></span>;
}
const aller = to => {
  window.location.hash = to;
};
function Btn({
  v = 'p',
  to,
  onClick,
  children,
  clair,
  type,
  desactive,
  etiquette,
  style
}) {
  const cls = 'k-btn k-' + v + (clair ? ' k-clair' : ''),
    fl = v === 'l' || v === 'p' ? <span className="k-fl" aria-hidden="true"><Ico n="fleche" t={18} sw={2} /></span> : null;
  if (to) return <a href={to} onClick={e => {
    e.preventDefault();
    aller(to);
  }} className={cls} aria-label={etiquette} aria-disabled={desactive ? 'true' : undefined} style={style}><span>{children}</span>{fl}</a>;
  return <button type={type || 'button'} onClick={onClick} className={cls} aria-disabled={desactive ? 'true' : undefined} aria-label={etiquette} style={style}><span>{children}</span>{fl}</button>;
}
const surl = (t, c) => String(t).split(/[{}]/).map((s, i) => i % 2 ? <span key={i} style={{
  color: c
}}>{s}</span> : s);
function TitreSec({
  sur,
  titre,
  lead,
  a = 'left',
  clair,
  id,
  max = '22ch',
  h = 'var(--titre-l)'
}) {
  const c = a === 'center';
  return <div style={{
    display: 'grid',
    gap: '14px',
    justifyItems: c ? 'center' : 'start',
    textAlign: a
  }}>
    {sur && <span data-overline="" style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: clair ? '#B5D4F7' : '#3767A2'
    }}><span aria-hidden="true" style={{
        width: '18px',
        height: '2px',
        borderRadius: '2px',
        background: 'currentColor'
      }}></span>{sur}</span>}
    <h2 id={id} style={{
      margin: 0,
      fontSize: h,
      lineHeight: 1.25,
      letterSpacing: '-0.03em',
      fontWeight: 700,
      color: clair ? '#fff' : '#0C2147',
      maxWidth: max,
      textWrap: 'balance'
    }}>{surl(titre, clair ? '#6194D3' : '#4581CB')}</h2>
    {lead && <p style={{
      margin: 0,
      fontSize: '14px',
      lineHeight: 1.65,
      color: clair ? '#C8DAF0' : '#3E4A59',
      maxWidth: '58ch',
      textWrap: 'pretty'
    }}>{lead}</p>}</div>;
}
function Carte({
  href,
  children,
  style,
  etiquette
}) {
  if (href) return <a href={href} onClick={e => {
    e.preventDefault();
    aller(href);
  }} aria-label={etiquette} className="k-carte" style={style}>{children}</a>;
  return <div className="k-carte" style={style}>{children}</div>;
}
/* Formulaires */
function Champ({
  id,
  label,
  req,
  aide,
  err,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  disabled
}) {
  const ai = aide ? id + '-aide' : null,
    ei = err ? id + '-err' : null;
  return <div><label htmlFor={id} className="k-lbl">{label}{req && <i aria-hidden="true"> *</i>}</label>
    <input id={id} className="k-in" type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode} disabled={disabled} required={req} aria-invalid={err ? 'true' : undefined} aria-describedby={[ai, ei].filter(Boolean).join(' ') || undefined} />
    {aide && !err && <span id={ai} className="k-aide">{aide}</span>}{err && <span id={ei} className="k-err" role="alert"><Ico n="alerte" t={15} sw={2} />{err}</span>}</div>;
}
function Choix({
  nom,
  label,
  options,
  value,
  onChange,
  err,
  req
}) {
  const ei = err ? nom + '-err' : null;
  return <fieldset style={{
    border: 0,
    margin: 0,
    padding: 0,
    minWidth: 0
  }} aria-describedby={ei || undefined}><legend className="k-lbl" style={{
      padding: 0
    }}>{label}{req && <i aria-hidden="true"> *</i>}</legend>
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    }}>{options.map(o => <label key={o} className="k-choix"><input type="radio" name={nom} value={o} checked={value === o} onChange={() => onChange(o)} aria-invalid={err ? 'true' : undefined} /><span className="k-rond" aria-hidden="true"></span>{o}</label>)}</div>
    {err && <span id={ei} className="k-err" role="alert"><Ico n="alerte" t={15} sw={2} />{err}</span>}</fieldset>;
}
function Case({
  id,
  checked,
  onChange,
  children,
  err
}) {
  return <div><label className="k-case" htmlFor={id}><input id={id} type="checkbox" checked={checked} onChange={onChange} aria-invalid={err ? 'true' : undefined} aria-describedby={err ? id + '-err' : undefined} /><span className="k-boite" aria-hidden="true"><Ico n="check" t={14} c="#fff" sw={2.4} /></span><span>{children}</span></label>{err && <span id={id + '-err'} className="k-err" role="alert"><Ico n="alerte" t={15} sw={2} />{err}</span>}</div>;
}
function Accordeon({
  items,
  pid = 'acc'
}) {
  const [o, setO] = React.useState(0);
  return <div style={{
    borderTop: '1px solid #E6EAEF'
  }}>{items.map((it, i) => {
      const on = o === i;
      return <div key={i} className="k-acc"><h3 style={{
          margin: 0
        }}><button type="button" id={pid + '-b' + i} className="k-acc-b" aria-expanded={on} aria-controls={pid + '-p' + i} onClick={() => setO(on ? -1 : i)}><span>{it.q}</span><span className="k-acc-ic" aria-hidden="true"><Ico n="plus" t={16} sw={2} /></span></button></h3>
    <div id={pid + '-p' + i} role="region" aria-labelledby={pid + '-b' + i} className="k-acc-p" data-ouvert={on ? '1' : '0'}><div><p style={{
              margin: '0 0 22px',
              maxWidth: '68ch',
              fontSize: '14px',
              lineHeight: 1.7,
              color: '#3E4A59'
            }}>{it.r}</p></div></div></div>;
    })}</div>;
}
function Onglets({
  items,
  value,
  onChange,
  label
}) {
  const r = React.useRef([]);
  const cl = e => {
    const i = items.findIndex(x => x[0] === value);
    let n = i;
    if (e.key === 'ArrowRight') n = (i + 1) % items.length;else if (e.key === 'ArrowLeft') n = (i + items.length - 1) % items.length;else return;
    e.preventDefault();
    onChange(items[n][0]);
    r.current[n] && r.current[n].focus();
  };
  return <div role="tablist" aria-label={label} onKeyDown={cl} style={{
    display: 'inline-flex',
    flexWrap: 'wrap',
    gap: '4px',
    padding: '4px',
    borderRadius: 'calc(var(--k-rb) + 4px)',
    background: '#F3F6FA'
  }}>{items.map(([k, t], i) => <button key={k} ref={el => r.current[i] = el} type="button" role="tab" aria-selected={value === k} tabIndex={value === k ? 0 : -1} onClick={() => onChange(k)} className="k-onglet">{t}</button>)}</div>;
}
const Badge = ({
  children,
  ton = 'bleu'
}) => {
  const T = {
    bleu: ['#ECF2F9', '#2E5788'],
    marine: ['#0C2147', '#fff'],
    succes: ['#E3F4EC', '#1F7A52']
  }[ton];
  return <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '26px',
    padding: '0 10px',
    borderRadius: 'var(--k-rb)',
    background: T[0],
    color: T[1],
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '.02em'
  }}>{children}</span>;
};
let KIT_LL = {
  KITS,
  Kit,
  useKit,
  Ico,
  ICONES: Object.keys(P),
  Pastille,
  Btn,
  TitreSec,
  Carte,
  Champ,
  Choix,
  Case,
  Accordeon,
  Onglets,
  Badge,
  surl,
  aller
};
export { KIT_LL };
