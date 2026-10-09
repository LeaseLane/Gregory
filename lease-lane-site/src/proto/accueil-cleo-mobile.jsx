/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-cleo-mobile.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { CLEO_F } from '@/proto/accueil-cleo-final';
import { ouvrirCleo } from '@/proto/seo';
import { CleoCircuit } from '@/proto/accueil-cleo-recit';
import { useEtatClient, __ssr } from '@/lib/hydratation';
const PORT = "/assets/img/cleo/cleo-hd.jpg",
  ALT = 'Portrait de Cléo, l’agent IA de Lease Lane';
const Em = ({
  t
}) => String(t).split(/(\{[^}]+\})/).map((x, i) => x[0] === '{' ? <span key={i} style={{
  color: 'var(--bleu-300)'
}}>{x.slice(1, -1)}</span> : <React.Fragment key={i}>{x}</React.Fragment>);
const ouvrir = t => {
  try {
    ouvrirCleo(t);
  } catch (e) {
    location.hash = "/cleo";
  }
};
const CSS = `.acm{position:relative;overflow:clip;background:var(--degrade-marine);color:#fff;padding:72px 0 80px}
.acm-in{max-width:560px;margin:0 auto;padding:0 20px;display:grid;gap:40px}
.acm-tete{display:grid;gap:16px;justify-items:center;text-align:center}
.acm-sur{display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 12px;border-radius:8px;background:rgba(63,179,127,.14);border:1px solid rgba(63,179,127,.4);font-size:12px;font-weight:600;color:#fff}
.acm-sur i{width:7px;height:7px;border-radius:50%;background:#3FB37F}
.acm h2{margin:0;font-size:clamp(28px,7.6vw,36px);line-height:1.2;letter-spacing:-.025em;font-weight:700;color:#fff;text-wrap:balance}
.acm-tete p{margin:0;max-width:34ch;font-size:14px;line-height:1.65;color:var(--bleu-100)}
.acm-port{position:relative;margin:0 auto;width:100%;max-width:360px;border-radius:24px;overflow:hidden;border:1px solid rgba(181,212,247,.24);aspect-ratio:1/1;background:#12305A}
.acm-port img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 20%}
.acm-caps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.acm-caps li{display:grid;justify-items:center;align-content:start;gap:12px;padding:20px 12px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(181,212,247,.16);text-align:center}
.acm-caps b{display:block;font-size:14px;line-height:1.35;font-weight:600;color:#fff;text-wrap:balance}
.acm-cta{display:grid;gap:12px}
.acm-btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 20px;border-radius:12px;border:0;background:#fff;color:var(--marine-900);font:600 15px var(--police-corps);cursor:pointer;text-decoration:none}
.acm-btn.c{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.4)}
.acm-btn:focus-visible{outline:2px solid #fff;outline-offset:3px}
.acm-mention{margin:0;text-align:center;font-size:12.5px;line-height:1.6;color:var(--bleu-200)}
@media (min-width:640px){.acm-cta{grid-template-columns:repeat(2,minmax(0,1fr))}.acm-caps{grid-template-columns:repeat(3,minmax(0,1fr))}}`;
function AccCleoMobile() {
  return <section className="acm ll-sombre" aria-labelledby="acm-t"><style>{CSS}</style><div className="acm-in">
    <div className="acm-tete"><span className="acm-sur"><i aria-hidden="true" />Cléo · en ligne 24/7</span>
      <h2 id="acm-t"><Em t={CLEO_F.TITRES[0]} /></h2><p>{CLEO_F.SOUS}</p></div>
    <figure className="acm-port"><img src={PORT} alt={ALT} loading="lazy" width="2000" height="2000" /></figure>
    <ul className="acm-caps" aria-label="Les compétences de Cléo">{CLEO_F.CAP.map(c => <li key={c.t}>{CLEO_F.Tuile ? <CLEO_F.Tuile ic={c.ic} urg={c.urg} /> : <Icon name={c.ic} size={20} />}<b>{c.t}</b></li>)}</ul>
    <div className="acm-cta"><button type="button" className="acm-btn" onClick={() => ouvrir()}><Icon name="message-circle" size={18} />Écrire à Cléo</button>
      <a href="/cleo" className="acm-btn c">Découvrir Cléo<Icon name="arrow-right" size={18} /></a></div>
    <p className="acm-mention">{CLEO_F.MENTION}</p>
  </div></section>;
}
/* Choix selon la largeur, mis à jour si l'écran tourne ou change de taille */
const MQ = '(max-width:960px)';
function AccCleoAdaptatif(p) {
  const [mob, setMob] = useEtatClient(() => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia(MQ).matches : undefined);
  React.useEffect(() => {
    const m = (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia(MQ) : {
        matches: false,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
      },
      f = () => setMob(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return mob ? <AccCleoMobile /> : <CleoCircuit />;
}
export { AccCleoMobile, AccCleoAdaptatif as AccCleo };
