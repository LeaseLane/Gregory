/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/apropos-concepts.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { gab, BoutonLien, Fleche, Exemple, BandeauPage, AppelFinal } from '@/proto/blocs';
import { __maintenant, useEtatClient, __ssr } from '@/lib/hydratation';
const uS = React.useState,
  uE = React.useEffect,
  uR = React.useRef;
const CONT = {
  maxWidth: 'var(--web-conteneur)',
  margin: '0 auto',
  padding: '0 var(--web-gouttiere)',
  boxSizing: 'border-box'
};
const IMG = f => "/assets/equipe/" + f + '.webp',
  AV = "/assets/img/cleo-avatar.png";
const g = t => gab ? gab(t) : t;
const pad = n => String(n).padStart(2, '0');
const RMQ = () => !!(((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? matchMedia('(prefers-reduced-motion: reduce)').matches : undefined));
const SC = () => (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;

/* ——— Contenu (verbatim de la page actuelle) ——— */
const EQ = [['gregory-picard', 'Grégory Picard', 'Président'], ['steven-paradis', 'Steven Paradis', 'IA & Digital Infrastructure'], ['xavier-tavernier', 'Xavier Tavernier', 'Directeur des ventes'], ['andy-larochelle-larose', 'Andy Larochelle Larose', 'Directeur Marketing'], ['eliot-marcoux', 'Éliot Marcoux', 'Développement des affaires']];
const TECH = ['Répondre aux prospects et aux locataires, 24/7', 'Réserver les visites et envoyer les rappels', 'Classer les demandes et les documents', 'Produire le rapport mensuel et le tableau de bord'];
const HUM = ['Traiter les urgences et les situations délicates', 'Recommander un locataire, négocier avec les fournisseurs', 'Préparer les dossiers au TAL', 'Rendre des comptes au propriétaire'];
const IC_T = ['message-circle', 'calendar-check', 'files', 'chart-column'],
  IC_H = ['triangle-alert', 'handshake', 'scale', 'receipt'];
const MAUX = [['clock', 'Le suivi entre la demande et sa résolution'], ['phone', 'Les appels du soir'], ['house', 'Les logements qui restent vides faute de réponse']];
const ENG = [['message-circle', 'Répondre en tout temps', 'Cléo et une équipe de garde répondent à chaque demande, le jour, le soir et la fin de semaine.'], ['eye', 'Rendre chaque chiffre visible', 'Les frais sont publiés et chaque dépense se voit au tableau de bord. Les décisions importantes restent celles du propriétaire.']];
const PLAGES = ['Le jour', 'Le soir', 'La fin de semaine'];
const LIV = [['receipt', 'Frais publiés'], ['chart-column', 'Dépenses au tableau de bord'], ['circle-check', 'Décisions au propriétaire']];
const T = {
  pq: 'Parce qu’une demande sans réponse {coûte cher} à tout le monde.',
  pqP: 'Le plus lourd pour un propriétaire, c’est ce qu’on fera pour lui :',
  ap: 'La technologie pour répondre, {les humains pour décider}.',
  note: 'Cléo vous dit à qui il transmet, pourquoi et dans quel délai. La personne reçoit tout l’échange : vous n’avez rien à répéter.',
  eq: 'Les personnes qui {prennent le relais}.',
  terr: 'Nous desservons tout le Québec.',
  terrP: 'Immeubles locatifs résidentiels, partout au Québec, sauf la copropriété divise et la location de courte durée.',
  lic: 'Ce qui {nous engage}.'
};

/* ——— Utilitaires ——— */
function useVu(seuil = .18) {
  const ref = uR(null),
    [vu, setVu] = uS(false);
  uE(() => {
    const el = ref.current;
    if (!el) return;
    if (RMQ() || !('IntersectionObserver' in window)) {
      setVu(true);
      return;
    }
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) {
        setVu(true);
        io.disconnect();
      }
    }, {
      root: SC(),
      threshold: seuil,
      rootMargin: '0px 0px -6% 0px'
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, vu];
}
const Vu = ({
  as = 'div',
  className = '',
  seuil,
  children,
  ...r
}) => {
  const [ref, vu] = useVu(seuil);
  return React.createElement(as, {
    ref,
    className: (className + (vu ? ' vu' : '')).trim(),
    ...r
  }, children);
};
/* Appelle f(rect, hauteur) à chaque image de défilement du conteneur #ll-scroll (sans rendu React). */

function Compte({
  n,
  dec = 0,
  vu,
  suf = '',
  ms = 1500
}) {
  const [v, setV] = useEtatClient(() => RMQ() ? n : 0);
  uE(() => {
    if (!vu) return;
    if (RMQ()) {
      setV(n);
      return;
    }
    let s = null,
      raf;
    const f = t => {
      if (s === null) s = t;
      const p = Math.min(1, (t - s) / ms);
      setV(n * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;
    };
    raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? cancelAnimationFrame(raf) : undefined;
  }, [vu]);
  const fmt = x => x.toFixed(dec).replace('.', ',');
  return <><span aria-hidden="true">{fmt(v)}{suf}</span><span className="apc-sr">{fmt(n)}{suf}</span></>;
}
/* Mots d'une phrase, avec {emphase} → [[mot, emphase], …] */

/* Lumière qui suit le pointeur (cartes) */

const Lib = ({
  children,
  clair,
  style
}) => <span className="apc-lib" style={{
  color: clair ? 'var(--bleu-300)' : 'var(--bleu-600)',
  ...style
}}>{children}</span>;
const Tete = ({
  lib,
  titre,
  clair,
  centre,
  d = 0,
  children
}) => <div style={{
  display: 'grid',
  gap: '16px',
  justifyItems: centre ? 'center' : 'start',
  textAlign: centre ? 'center' : 'left'
}}>
  <span className="apc-r apc-filet" style={{
    '--d': d + 'ms',
    background: clair ? 'var(--bleu-300)' : 'var(--bleu-500)'
  }} aria-hidden="true"></span>
  {lib && <Lib clair={clair}><span className="apc-r" style={{
      '--d': d + 40 + 'ms',
      display: 'inline-block'
    }}>{lib}</span></Lib>}
  <h2 className="apc-h2 apc-r" style={{
    '--d': d + 100 + 'ms',
    color: clair ? '#fff' : undefined
  }}>{g(titre)}</h2>{children}</div>;
const Pause = ({
  on,
  set,
  clair,
  lab
}) => <button type="button" className={'apc-pause' + (clair ? ' clair' : '')} aria-pressed={!on} onClick={() => set(!on)} aria-label={(on ? 'Mettre en pause ' : 'Relancer ') + lab}><Icon name={on ? 'pause' : 'play'} size={16} /></button>;
const CSS_C = `.apc{--e:cubic-bezier(.22,1,.36,1);--e2:cubic-bezier(.65,0,.35,1)}
.apc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.apc :focus-visible{outline:2px solid var(--bleu-500);outline-offset:3px}
.apc-lib{font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}
.apc-h2{margin:0;font-size:var(--titre-l);line-height:1.18;font-weight:700;letter-spacing:-.025em;color:var(--marine-900);max-width:22ch;text-wrap:balance}
.apc-h3{margin:0;font-size:20px;line-height:1.3;font-weight:700;letter-spacing:-.015em;color:var(--marine-900);text-wrap:balance}
.apc-p{margin:0;font-size:14px;line-height:1.7;color:var(--texte-corps);max-width:54ch;text-wrap:pretty}
.apc-filet{display:block;width:48px;height:2px;border-radius:2px;transform-origin:0 50%}
.apc-r{opacity:0;transform:translateY(20px);transition:opacity .8s var(--e),transform .8s var(--e);transition-delay:var(--d,0ms)}.vu .apc-r,.apc-r.vu{opacity:1;transform:none}
.apc-filet.apc-r{transform:scaleX(0)}.vu .apc-filet.apc-r{transform:none}
.apc-pause{width:44px;height:44px;flex:none;display:grid;place-items:center;border-radius:12px;border:1px solid rgba(12,33,71,.18);background:#fff;color:var(--marine-900);cursor:pointer;transition:background-color .2s,color .2s}
.apc-pause:hover{background:var(--marine-900);color:#fff}.apc-pause.clair{background:rgba(255,255,255,.06);border-color:rgba(181,205,234,.3);color:#fff}.apc-pause.clair:hover{background:#fff;color:var(--marine-900)}
.apc-ex{display:inline-flex}
@media (prefers-reduced-motion:reduce){.apc *,.apc *::before,.apc *::after{animation:none!important;transition:none!important}.apc .apc-r{opacity:1!important;transform:none!important}}`;

/* ═══════════════════════ 1 · TRAJET ═══════════════════════ */

/* ═══════════════════════ 2 · VITRINE ═══════════════════════ */
const CSS_2 = `
.ap2-bento{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;grid-template-areas:"pq pq pq pq pq pq pq live live live live live" "pq pq pq pq pq pq pq eq eq eq eq eq" "tick tick tick tick tick tick tick tick portes portes portes portes" "maux maux maux maux maux maux maux maux occ occ occ occ"}
html:not([data-exemples="1"]) .ap2-bento{grid-template-areas:"pq pq pq pq pq pq pq live live live live live" "pq pq pq pq pq pq pq eq eq eq eq eq" "tick tick tick tick tick tick tick tick tick tick tick tick" "maux maux maux maux maux maux maux maux maux maux maux maux"}
.ap2-t{position:relative;min-width:0;display:flex;flex-direction:column;justify-content:space-between;gap:20px;padding:clamp(22px,2.2vw,28px);border-radius:20px;background:#fff;border:1px solid rgba(12,33,71,.08);box-shadow:0 1px 2px rgba(12,33,71,.04);overflow:hidden;transition:transform .5s var(--e),box-shadow .5s var(--e),border-color .4s}
.ap2-t:hover{transform:translateY(-4px);border-color:rgba(69,129,203,.35);box-shadow:0 28px 56px -34px rgba(12,33,71,.4)}
.ap2-t.m{min-height:440px;padding:clamp(28px,3.2vw,48px);background:var(--degrade-marine);border-color:transparent;color:#fff}
.ap2-pq-img{position:absolute;right:-2%;bottom:0;height:94%;width:auto;max-width:62%;object-fit:contain;object-position:right bottom;pointer-events:none;filter:drop-shadow(0 24px 40px rgba(2,8,18,.45))}
.ap2-pq-txt{position:relative;display:grid;gap:18px;max-width:min(400px,58%)}
.ap2-in{opacity:0;transform:translateY(24px) scale(.98);transition:opacity .8s var(--e),transform .8s var(--e);transition-delay:var(--d,0ms)}.vu .ap2-in{opacity:1;transform:none}
.ap2-k{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px}
.ap2-big{font-size:clamp(48px,4.6vw,68px);line-height:.9;font-weight:800;letter-spacing:-.05em;color:var(--marine-900);font-variant-numeric:tabular-nums}
.ap2-mini{font-size:14px;font-weight:600;color:var(--marine-900)}
.ap2-qui{display:flex;align-items:center;gap:12px;min-width:0}.ap2-qui img{width:40px;height:40px;border-radius:12px;object-fit:cover;flex:none}.ap2-qui strong{display:block;font-size:14px;font-weight:700;line-height:1.3;color:var(--marine-900)}.ap2-qui small{display:block;font-size:12px;color:var(--gris-600)}
.ap2-statut{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 10px;border-radius:8px;background:var(--succes-100);color:var(--succes-600);font-size:12px;font-weight:600;white-space:nowrap}
.ap2-pouls{position:relative;width:8px;height:8px;border-radius:50%;background:var(--succes-500);flex:none}.ap2-pouls::after{content:"";position:absolute;inset:0;border-radius:50%;animation:ap2-pouls 2s ease-out infinite}@keyframes ap2-pouls{0%{box-shadow:0 0 0 0 rgba(23,121,94,.5)}100%{box-shadow:0 0 0 8px rgba(23,121,94,0)}}
.ap2-heure{display:grid;gap:6px}.ap2-heure small{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--gris-600)}.ap2-heure b{font-size:clamp(44px,4vw,60px);line-height:.95;font-weight:800;letter-spacing:-.05em;color:var(--marine-900)}.ap2-heure span{font-size:13px;color:var(--texte-corps)}
.ap2-eq-b{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}
.ap2-pile{display:flex}.ap2-pile span{width:44px;height:44px;border-radius:12px;border:3px solid #fff;margin-left:-10px;background-color:#1B3A60;background-size:240%;background-position:50% 27%;box-shadow:0 4px 10px rgba(12,33,71,.12);transform:translateY(12px);opacity:0;transition:transform .6s var(--e),opacity .6s;transition-delay:calc(400ms + var(--i) * 90ms)}.ap2-pile span:first-child{margin-left:0}.vu .ap2-pile span{transform:none;opacity:1}
.ap2-nb{display:grid;justify-items:end;text-align:right}.ap2-nb b{font-size:48px;line-height:.9;font-weight:800;letter-spacing:-.05em;color:var(--marine-900)}.ap2-nb>span{font-size:13px;font-weight:600;color:var(--gris-600)}
.ap2-lienbt{display:inline-flex;align-items:center;gap:8px;white-space:nowrap;min-height:44px;padding:0;border:0;background:none;font:600 14px var(--police-corps);color:var(--texte-lien);cursor:pointer}.ap2-lienbt svg{transition:transform .3s var(--e)}.ap2-lienbt:hover{color:var(--marine-900)}.ap2-lienbt:hover svg{transform:rotate(90deg) translateX(3px)}
.ap2-barres{display:flex;align-items:flex-end;gap:6px;height:56px}.ap2-barres i{flex:1;height:100%;border-radius:4px 4px 0 0;background:linear-gradient(180deg,var(--bleu-500),var(--bleu-600));transform-origin:50% 100%;transform:scaleY(0);transition:transform .9s var(--e);transition-delay:calc(400ms + var(--i) * 80ms)}.vu .ap2-barres i{transform:scaleY(var(--h))}
.ap2-tick{container-type:inline-size}
@container (max-width:820px){.ap2-tk{grid-template-columns:minmax(0,1fr) auto!important}.ap2-pas{grid-column:1/-1;grid-row:2}}
.ap2-tk{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr) auto;gap:20px clamp(24px,3vw,48px);align-items:center}
.ap2-tk-t{display:grid;gap:10px;justify-items:start}
.ap2-pas{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
.ap2-pas li{position:relative;display:grid;gap:12px;justify-items:start;padding-right:12px;font-size:13px;font-weight:600;line-height:1.35;color:var(--gris-500);transition:color .4s}
.ap2-pas li::before,.ap2-pas li::after{content:"";position:absolute;left:36px;right:8px;top:13px;height:2px;border-radius:2px;background:rgba(12,33,71,.1)}
.ap2-pas li::after{background:var(--bleu-500);transform-origin:0 50%;transform:scaleX(0);transition:transform .6s var(--e2)}.ap2-pas li.fait::after{transform:none}
.ap2-pas li:last-child::before,.ap2-pas li:last-child::after{display:none}
.ap2-pas i{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#fff;border:2px solid rgba(12,33,71,.14);transition:background-color .4s,border-color .4s,box-shadow .4s}
.ap2-pas li.on{color:var(--marine-900)}.ap2-pas li.on i{background:var(--bleu-500);border-color:var(--bleu-500)}.ap2-pas li.cur i{box-shadow:0 0 0 5px rgba(69,129,203,.18)}.ap2-pas li.fin i{background:var(--succes-500);border-color:var(--succes-500);box-shadow:0 0 0 5px rgba(23,121,94,.15)}
.ap2-etat{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 10px;border-radius:8px;background:var(--bleu-025);font-size:12px;font-weight:600;color:var(--bleu-700);white-space:nowrap}.ap2-etat.fin{background:var(--succes-100);color:var(--succes-600)}
.ap2-etat span{display:inline-block;animation:ap2-etat .45s var(--e)}@keyframes ap2-etat{from{opacity:0;transform:translateY(8px)}}
.ap2-donut circle{fill:none;stroke-width:10}.ap2-donut .a{stroke:var(--bleu-025)}.ap2-donut .b{stroke:url(#ap2-dg);stroke-linecap:round;stroke-dasharray:283;stroke-dashoffset:283;transition:stroke-dashoffset 1.8s var(--e2) .3s;transform:rotate(-90deg);transform-origin:50% 50%}.vu .ap2-donut .b{stroke-dashoffset:calc(283 * (1 - .986))}
.ap2-maux-t{container-type:inline-size}
.ap2-maux-g{display:grid;gap:16px}
@container (min-width:880px){.ap2-maux-g{grid-template-columns:minmax(0,3fr) minmax(0,9fr);align-items:center;gap:32px}}
.ap2-maux{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.ap2-maux li{display:grid;grid-template-columns:40px minmax(0,1fr);gap:14px;align-items:center;min-height:72px;padding:14px 16px;border-radius:14px;background:color-mix(in srgb,var(--bleu-050) 25%,var(--bleu-025));font-size:14px;font-weight:600;line-height:1.4;color:var(--marine-900)}
.ap2-maux li>span{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;background:#fff;box-shadow:0 1px 2px rgba(12,33,71,.08)}
/* Engagements */
.ap2-eng-t{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:28px 64px}
.ap2-eng-d{display:grid;gap:18px;max-width:460px}
.ap2-sauts{display:flex;flex-wrap:wrap;gap:8px}
.ap2-saut{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 16px 0 6px;border-radius:12px;border:1px solid rgba(12,33,71,.14);background:#fff;font:600 13px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:background-color .25s,border-color .25s,color .25s}
.ap2-saut b{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--bleu-025);font-size:12px;font-weight:700;color:var(--bleu-600);font-variant-numeric:tabular-nums;transition:background-color .25s,color .25s;border-radius:8px}
.ap2-saut svg{transition:transform .3s var(--e)}.ap2-saut:hover{background:var(--marine-900);border-color:var(--marine-900);color:#fff}.ap2-saut:hover b{background:rgba(255,255,255,.14);color:#fff}.ap2-saut:hover svg{transform:rotate(90deg) translateX(3px)}
.ap2-ec{scroll-margin-top:24px}
.ap2-eng{display:grid;gap:16px}.ap2-ec{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(28px,4vw,64px);align-items:center;padding:clamp(28px,3.4vw,48px);border-radius:24px;background:#fff;border:1px solid rgba(12,33,71,.09)}
.ap2-grille{display:grid;grid-template-columns:120px repeat(3,minmax(0,1fr));gap:8px;align-items:center;font-size:12px;font-weight:600;color:var(--gris-600)}
.ap2-grille b{font-size:13px;font-weight:700;color:var(--marine-900);display:flex;align-items:center;gap:8px}.ap2-grille b img{width:28px;height:28px;border-radius:8px;object-fit:cover;flex:none}
.ap2-cel{height:48px;border-radius:10px;background:var(--surface-douce);display:grid;place-items:center;position:relative;overflow:hidden}
.ap2-cel::before{content:"";position:absolute;inset:0;background:var(--bleu-025);transform:scaleX(0);transform-origin:0 50%;transition:transform .6s var(--e2);transition-delay:calc(300ms + var(--i) * 140ms)}.vu .ap2-cel::before{transform:none}
.ap2-cel svg{position:relative;opacity:0;transform:scale(.4);transition:opacity .4s,transform .5s cubic-bezier(.34,1.56,.64,1);transition-delay:calc(600ms + var(--i) * 140ms)}.vu .ap2-cel svg{opacity:1;transform:none}
.ap2-tb{display:grid;gap:20px;padding:24px;border-radius:20px;background:#fff;border:1px solid rgba(12,33,71,.09);box-shadow:0 1px 2px rgba(12,33,71,.04),0 24px 48px -32px rgba(12,33,71,.3)}
.ap2-tb-h{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:12px;align-items:center}
.ap2-tb-ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--marine-900)}
.ap2-tb-h strong{display:block;font-size:14px;font-weight:700;line-height:1.3;color:var(--marine-900)}.ap2-tb-h small{display:block;font-size:12px;line-height:1.4;color:var(--gris-600)}
.ap2-puce{display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:8px;background:var(--surface-enfoncee);font-size:12px;font-weight:600;color:var(--gris-600);white-space:nowrap}
.ap2-tb-g{position:relative;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;padding:0 4px}
.ap2-tb-g::before{content:"";position:absolute;left:0;right:0;top:0;height:148px;pointer-events:none;background:repeating-linear-gradient(180deg,rgba(12,33,71,.08) 0 1px,transparent 1px 49.33px);border-bottom:1px solid rgba(12,33,71,.18)}
.ap2-col{display:grid;grid-template-rows:148px auto;gap:10px;justify-items:center;font-size:12px;font-weight:500;color:var(--gris-600)}.ap2-col.on{font-weight:700;color:var(--marine-900)}
.ap2-col>span{position:relative;width:100%;display:flex;align-items:flex-end;justify-content:center}
.ap2-col i{display:block;width:min(100%,32px);height:var(--h);border-radius:8px 8px 2px 2px;background:linear-gradient(180deg,var(--bleu-200),var(--bleu-500));transform-origin:50% 100%;transform:scaleY(0);transition:transform .9s var(--e);transition-delay:calc(300ms + var(--i) * 90ms)}.vu .ap2-col i{transform:none}
.ap2-col.on i{background:linear-gradient(180deg,var(--bleu-500),var(--marine-900));box-shadow:0 10px 20px -8px rgba(12,33,71,.5)}
.ap2-bulle{position:absolute;right:calc(50% - 16px);bottom:calc(var(--h) + 10px);transform:translateY(6px);display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:8px;background:var(--marine-900);color:#fff;font-size:12px;font-weight:600;white-space:nowrap;opacity:0;transition:opacity .5s var(--e),transform .5s var(--e);transition-delay:1.1s}
.ap2-bulle::after{content:"";position:absolute;right:12px;bottom:-4px;width:8px;height:8px;background:inherit;transform:rotate(45deg);border-radius:1px}.vu .ap2-bulle{opacity:1;transform:none}
.ap2-tb-l{list-style:none;margin:0;padding:16px 0 0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;border-top:1px solid rgba(12,33,71,.09)}
.ap2-tb-l li{display:grid;grid-template-columns:32px minmax(0,1fr);gap:10px;align-items:center;font-size:13px;font-weight:600;line-height:1.35;color:var(--marine-900)}
.ap2-tb-l li>span{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--bleu-025)}
/* Approche — sélecteur */
.ap2-ap{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(40px,6vw,96px);align-items:start}
.ap2-seg{position:relative;display:grid;grid-template-columns:1fr 1fr;padding:6px;border-radius:16px;background:var(--surface-enfoncee);width:100%;max-width:440px}
.ap2-seg::before{content:"";position:absolute;top:6px;bottom:6px;left:6px;width:calc(50% - 6px);border-radius:12px;background:var(--marine-900);box-shadow:0 10px 24px -10px rgba(12,33,71,.6);transform:translateX(calc(var(--x,0) * 100%));transition:transform .55s cubic-bezier(.34,1.3,.64,1)}
.ap2-seg button{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:10px;min-height:56px;border:0;background:none;border-radius:12px;font:600 14px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:color .35s}
.ap2-seg button[aria-selected=true]{color:#fff}.ap2-seg img{width:28px;height:28px;border-radius:8px;object-fit:cover}
.ap2-pan{display:grid;gap:12px}.ap2-li{display:grid;grid-template-columns:56px minmax(0,1fr) auto;gap:20px;align-items:center;padding:18px 22px;border-radius:18px;background:#fff;border:1px solid rgba(12,33,71,.09);animation:ap2-li .6s var(--e) both;animation-delay:calc(var(--i) * 80ms);transition:border-color .3s,transform .4s var(--e)}
.ap2-li:hover{border-color:var(--bleu-500);transform:translateX(6px)}.ap2-li.h{background:var(--degrade-marine);border-color:transparent}
.ap2-li>span:first-child{width:56px;height:56px;border-radius:14px;display:grid;place-items:center;background:var(--bleu-025)}.ap2-li.h>span:first-child{background:rgba(255,255,255,.1)}
.ap2-li strong{font-size:16px;line-height:1.4;font-weight:700;color:var(--marine-900)}.ap2-li.h strong{color:#fff}.ap2-li b{font-size:13px;font-weight:700;color:var(--bleu-600);font-variant-numeric:tabular-nums}.ap2-li.h b{color:var(--bleu-300)}
@keyframes ap2-li{from{opacity:0;transform:translateY(16px)}}
.ap2-rel{display:flex;align-items:center;gap:12px;margin-top:8px}.ap2-rel-l{position:relative;flex:1;height:2px;background:rgba(12,33,71,.12);border-radius:2px;overflow:hidden}.ap2-rel-l::after{content:"";position:absolute;top:0;bottom:0;width:30%;background:linear-gradient(90deg,transparent,var(--bleu-500),transparent);animation:ap2-rel 2.4s var(--e2) infinite}@keyframes ap2-rel{from{left:-30%}to{left:100%}}
/* Équipe — cartes inclinables */
.ap2-eq{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(12px,1.6vw,24px);perspective:1000px}
.ap2-tilt{position:relative;margin:0;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .5s var(--e);transform-style:preserve-3d}.ap2-tilt.actif{transition:transform .08s linear}
.ap2-tilt img{display:block;width:100%;height:auto;aspect-ratio:1800/2220;filter:drop-shadow(0 18px 28px rgba(12,33,71,.18))}
.ap2-tilt::after{content:"";position:absolute;inset:0;border-radius:24px 0 24px 0;background:radial-gradient(240px circle at var(--gx,50%) var(--gy,0%),rgba(255,255,255,.38),transparent 60%);opacity:0;transition:opacity .3s;pointer-events:none;mix-blend-mode:soft-light}.ap2-tilt.actif::after{opacity:1}
.ap2-eq-in{opacity:0;transform:translateY(40px) rotateX(18deg);transition:opacity .9s var(--e),transform .9s var(--e);transition-delay:var(--d,0ms)}.vu .ap2-eq-in{opacity:1;transform:none}
/* Territoire — pleine largeur */
@media (min-width:961px){.ap2 .ll-deux{grid-template-columns:minmax(0,480px) minmax(0,440px)!important;justify-content:center;gap:clamp(48px,4.5vw,64px)!important}}
.ap2-terr{position:relative;isolation:isolate;display:flex;align-items:center;min-height:clamp(440px,72vh,640px);background:var(--marine-900);overflow:hidden}
.ap2-terr::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,var(--marine-900) 0%,rgba(12,33,71,.92) 30%,rgba(12,33,71,.25) 62%,rgba(12,33,71,0) 100%)}
.ap2-terr-carte{position:absolute;inset:0;z-index:-2;width:100%;height:100%}
.ap2-terr-in{position:relative;width:100%;padding-top:var(--web-section);padding-bottom:var(--web-section)}
.ap2-terr-txt{display:grid;gap:18px;justify-items:start;max-width:480px}
.ap2-terr-lieu{position:absolute;right:var(--web-gouttiere);bottom:24px;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--bleu-100)}
.ap2-pin{transform-box:fill-box;transform-origin:50% 100%;animation:ap2-pin 2.6s ease-in-out infinite;animation-delay:var(--i)}.ap2-ond{transform-box:fill-box;transform-origin:center;animation:ap2-ond 2.6s ease-out infinite;animation-delay:var(--i)}
@keyframes ap2-pin{0%,100%{transform:none}50%{transform:translateY(-4px)}}@keyframes ap2-ond{0%{opacity:.7;transform:scale(.4)}100%{opacity:0;transform:scale(2.4)}}
@media (max-width:1100px){.ap2-bento{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-areas:"pq pq" "live eq" "tick tick" "portes occ" "maux maux"}html:not([data-exemples="1"]) .ap2-bento{grid-template-areas:"pq pq" "live eq" "tick tick" "maux maux"}.ap2-tk{grid-template-columns:minmax(0,1fr) auto}.ap2-pas{grid-column:1/-1;grid-row:2}.ap2-eq{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:960px){.ap2-terr::before{background:linear-gradient(180deg,var(--marine-900) 0%,rgba(12,33,71,.9) 45%,rgba(12,33,71,.3) 100%)}.ap2-terr{align-items:flex-start}.ap2-ec,.ap2-ap{grid-template-columns:minmax(0,1fr)}}
@media (max-width:640px){.ap2-bento{grid-template-columns:minmax(0,1fr);grid-template-areas:"pq" "live" "eq" "tick" "portes" "occ" "maux"}html:not([data-exemples="1"]) .ap2-bento{grid-template-areas:"pq" "live" "eq" "tick" "maux"}.ap2-maux{grid-template-columns:minmax(0,1fr)}.ap2-t.m{min-height:0;padding-bottom:0}.ap2-pq-txt{max-width:none}.ap2-pq-img{position:relative;order:3;right:auto;height:auto;width:86%;max-width:340px;align-self:flex-end;margin:4px -6% 0 0}.ap2-pas li{font-size:12px}.ap2-eq{grid-template-columns:repeat(2,minmax(0,1fr))}.ap2-grille{grid-template-columns:88px repeat(3,minmax(0,1fr))}.ap2-tb-l{grid-template-columns:minmax(0,1fr)}.ap2-li{grid-template-columns:48px minmax(0,1fr);padding:16px}.ap2-li b{display:none}.ap2-ec{padding:24px 20px}.ap2-tb{padding:18px 16px}.ap2-tb-h{grid-template-columns:40px minmax(0,1fr)}.ap2-puce{grid-column:2;justify-self:start}.ap2-li>span:first-child{width:48px;height:48px}}
@media (prefers-reduced-motion:reduce){.ap2-in,.ap2-eq-in,.ap2-pile span{opacity:1!important;transform:none!important}.ap2-barres i{transform:scaleY(var(--h))!important}.ap2-donut .b{stroke-dashoffset:calc(283 * (1 - .986))!important}.ap2-cel::before,.ap2-col i{transform:none!important}.ap2-bulle{opacity:1!important;transform:none!important}.ap2-cel svg{opacity:1!important;transform:none!important}.ap2-rel-l::after{display:none}}`;
function Heure() {
  const f = () => {
    try {
      return new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Toronto',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(__maintenant()).replace(':', ' h ');
    } catch (e) {
      return '';
    }
  };
  const [h, setH] = useEtatClient(f);
  uE(() => {
    const t = setInterval(() => setH(f()), 15000);
    return () => clearInterval(t);
  }, []);
  return <time style={{
    fontVariantNumeric: 'tabular-nums'
  }}>{h}</time>;
}
const ETAPES = ['Reçue par Cléo', 'Classée', 'Transmise à l’équipe', 'Résolue'];
/* Libellés d'un mot pour le mobile (responsive.css bascule .ap2-l / .ap2-c à ≤ 620 px) */
const ETAPES_C = ['Reçue', 'Classée', 'Transmise', 'Résolue'];
function Suivi() {
  const [i, setI] = useEtatClient(() => RMQ() ? 3 : 0),
    [on, setOn] = useEtatClient(() => !RMQ()),
    [ref, vu] = useVu(.3);
  uE(() => {
    if (!on || !vu) return;
    const t = setInterval(() => setI(x => (x + 1) % 5), 1700);
    return () => clearInterval(t);
  }, [on, vu]);
  const a = Math.min(i, 3);
  return <div ref={ref} className="ap2-tk">
    <div className="ap2-tk-t"><Lib>Une demande, suivie de bout en bout</Lib><span className="apc-h3">Demande d’entretien</span>
      <span className={'ap2-etat' + (a === 3 ? ' fin' : '')} aria-hidden="true"><Icon name={a === 3 ? 'circle-check' : 'loader-circle'} size={14} /><span key={a}>{ETAPES[a]}</span></span></div>
    <ol className="ap2-pas" aria-label="Étapes d’une demande">{ETAPES.map((x, k) => <li key={x} className={[k <= a ? 'on' : '', k < a ? 'fait' : '', k === a && a < 3 ? 'cur' : '', k === 3 && a === 3 ? 'fin' : ''].join(' ').trim()}><i aria-hidden="true">{k <= a && <Icon name="check" size={14} color="#fff" />}</i><span className="ap2-l">{x}</span><span className="ap2-c">{ETAPES_C[k]}</span></li>)}</ol>
    <Pause on={on} set={setOn} lab="la démonstration du suivi" />
  </div>;
}
function Donut() {
  return <svg className="ap2-donut" viewBox="0 0 100 100" width="104" height="104" aria-hidden="true"><defs><linearGradient id="ap2-dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4581CB" /><stop offset="1" stopColor="#0C2147" /></linearGradient></defs><circle className="a" cx="50" cy="50" r="45" /><circle className="b" cx="50" cy="50" r="45" /></svg>;
}
const allerA = id => {
  const sc = SC(),
    el = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById(id) : undefined;
  if (!sc || !el) return;
  sc.scrollTo({
    top: sc.scrollTop + el.getBoundingClientRect().top - 24,
    behavior: RMQ() ? 'auto' : 'smooth'
  });
  const h = el.querySelector('h2,h3');
  if (h) {
    h.setAttribute('tabindex', '-1');
    h.focus({
      preventScroll: true
    });
  }
};
function Bento2() {
  const [ref, vu] = useVu(.12);
  return <section style={{
    background: 'var(--surface-douce)',
    padding: 'var(--web-section) 0'
  }}><div ref={ref} className={vu ? 'vu' : ''} style={CONT}>
    <div className="ap2-bento">
      <article className="ap2-t m ll-sombre ap2-in" style={{
          gridArea: 'pq'
        }}>
        <div aria-hidden="true" style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--lueur-bleue)',
            opacity: .7,
            pointerEvents: 'none'
          }}></div>
        <img className="ap2-pq-img" src="/assets/img/cleo/cleo-1024-detoure.png" alt="" />
        <div className="ap2-pq-txt"><Lib clair>Pourquoi Lease Lane existe</Lib>
          <h2 style={{
              margin: 0,
              fontSize: 'clamp(28px,2.7vw,42px)',
              lineHeight: 1.14,
              fontWeight: 700,
              letterSpacing: '-.03em',
              color: '#fff',
              textWrap: 'balance'
            }}>{g(T.pq)}</h2></div>
        <div style={{
            position: 'relative',
            alignSelf: 'flex-start'
          }}><BoutonLien to="/cleo" variant="inverse">Découvrir Cléo</BoutonLien></div></article>
      <article className="ap2-t ap2-in" style={{
          gridArea: 'live',
          '--d': '100ms'
        }}>
        <div className="ap2-k"><span className="ap2-qui"><img src={AV} alt="" /><span><strong>Cléo</strong><small>Gestionnaire IA · 24/7</small></span></span><span className="ap2-statut"><span className="ap2-pouls" aria-hidden="true"></span>En ligne</span></div>
        <div className="ap2-heure"><small>Heure de Québec</small><b><Heure /></b><span>Cléo répond en ce moment.</span></div></article>
      <article className="ap2-t ap2-in" style={{
          gridArea: 'eq',
          '--d': '180ms'
        }}>
        <div className="ap2-k"><span className="ap2-qui"><span><strong>L’équipe derrière Cléo</strong><small>Direction et équipe de garde</small></span></span>
          <button type="button" className="ap2-lienbt" onClick={() => allerA('ap2-equipe')}>Voir l’équipe<Icon name="arrow-right" size={16} style={{
                transform: 'rotate(90deg)'
              }} /></button></div>
        <div className="ap2-eq-b"><div className="ap2-pile" aria-hidden="true">{EQ.map((q, i) => <span key={q[0]} style={{
                '--i': i,
                backgroundImage: 'url(' + IMG(q[0]) + ')'
              }}></span>)}</div>
          <div className="ap2-nb"><b><Compte n={5} vu={vu} /></b><span>personnes</span></div></div></article>
      <article className="ap2-t ap2-in ap2-tick" style={{
          gridArea: 'tick',
          '--d': '260ms'
        }}><Suivi /></article>
      <article className="ap2-t ap2-in" data-ll-exemple="1" style={{
          gridArea: 'portes',
          '--d': '300ms'
        }}>
        <div className="ap2-k"><span className="ap2-mini">Portes gérées</span>{<Exemple />}</div>
        <span className="ap2-big"><Compte n={340} vu={vu} /></span>
        <div className="ap2-barres" aria-hidden="true">{[.35, .5, .45, .62, .7, .84, 1].map((h, i) => <i key={i} style={{
              '--h': h,
              '--i': i
            }}></i>)}</div></article>
      <article className="ap2-t ap2-in ap2-maux-t" style={{
          gridArea: 'maux',
          '--d': '340ms'
        }}><div className="ap2-maux-g">
        <p className="apc-p" style={{
              fontWeight: 600,
              color: 'var(--marine-900)'
            }}>{T.pqP}</p>
        <ul className="ap2-maux">{MAUX.map(([ic, l]) => <li key={l}><span aria-hidden="true"><Icon name={ic} size={18} color="var(--bleu-600)" /></span>{l}</li>)}</ul></div></article>
      <article className="ap2-t ap2-in" data-ll-exemple="1" style={{
          gridArea: 'occ',
          '--d': '420ms'
        }}>
        <div className="ap2-k"><span className="ap2-mini">Taux d’occupation</span>{<Exemple />}</div>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}><Donut /><span style={{
              display: 'grid',
              gap: '4px'
            }}><b style={{
                fontSize: '32px',
                fontWeight: 800,
                letterSpacing: '-.04em',
                color: 'var(--marine-900)',
                fontVariantNumeric: 'tabular-nums'
              }}><Compte n={98.6} dec={1} suf=" %" vu={vu} ms={1800} /></b><span style={{
                fontSize: '12px',
                color: 'var(--gris-600)'
              }}>sur douze mois</span></span></div></article>
    </div></div></section>;
}
const MOIS = [['janv.', .55], ['févr.', .72], ['mars', .48], ['avr.', .86], ['mai', .64], ['juin', .78]];
function Engagements2() {
  return <section style={{
    background: '#fff',
    padding: 'var(--web-section) 0'
  }}><div style={{
      ...CONT,
      display: 'grid',
      gap: 'clamp(40px,5vw,56px)'
    }}>
  <Vu className="ap2-eng-t"><Tete lib="Nos deux engagements" titre="Deux promesses que vous pouvez {vérifier}." />
    <div className="ap2-eng-d apc-r" style={{
          '--d': '200ms'
        }}><p className="apc-p">Chaque engagement se vérifie au quotidien&nbsp;: dans nos réponses, et dans votre tableau de bord.</p>
      <nav aria-label="Aller à un engagement" className="ap2-sauts">{ENG.map(([ic, h], k) => <button key={h} type="button" className="ap2-saut" onClick={() => allerA('ap2-e' + k)}><b>{pad(k + 1)}</b>{h}<Icon name="arrow-right" size={15} style={{
                transform: 'rotate(90deg)'
              }} /></button>)}</nav></div></Vu>
  <div className="ap2-eng">
    <Vu className="ap2-ec" id="ap2-e0"><div style={{
            display: 'grid',
            gap: '14px'
          }}><span className="apc-r" style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--bleu-600)'
            }}>01</span><h3 className="apc-h3 apc-r" style={{
              fontSize: 'clamp(22px,2vw,28px)',
              '--d': '60ms'
            }}>{ENG[0][1]}</h3><p className="apc-p apc-r" style={{
              '--d': '120ms'
            }}>{ENG[0][2]}</p></div>
      <div className="ap2-grille apc-r" style={{
            '--d': '160ms'
          }} role="table" aria-label="Qui répond, et quand">
        <span role="row" style={{
              display: 'contents'
            }}><span role="columnheader"><span className="apc-sr">Qui</span></span>{PLAGES.map(x => <span key={x} role="columnheader" style={{
                textAlign: 'center'
              }}>{x}</span>)}</span>
        {[['Cléo', AV], ['Équipe', null]].map(([n, img], r) => <span role="row" key={n} style={{
              display: 'contents'
            }}><b role="rowheader">{img ? <img src={img} alt="" /> : <Icon name="users" size={18} color="var(--bleu-600)" />}{n}</b>
          {PLAGES.map((x, c) => <span key={x} role="cell" className="ap2-cel" style={{
                '--i': r * 3 + c
              }}><Icon name="check" size={18} color="var(--bleu-600)" /><span className="apc-sr">Oui</span></span>)}</span>)}
      </div></Vu>
    <Vu className="ap2-ec" id="ap2-e1"><div style={{
            display: 'grid',
            gap: '14px'
          }}><span className="apc-r" style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--bleu-600)'
            }}>02</span><h3 className="apc-h3 apc-r" style={{
              fontSize: 'clamp(22px,2vw,28px)',
              '--d': '60ms'
            }}>{ENG[1][1]}</h3><p className="apc-p apc-r" style={{
              '--d': '120ms'
            }}>{ENG[1][2]}</p></div>
      <div className="ap2-tb apc-r" style={{
            '--d': '160ms'
          }}>
        <div className="ap2-tb-h"><span className="ap2-tb-ic" aria-hidden="true"><Icon name="chart-column" size={18} color="#fff" /></span><span><strong>Tableau de bord propriétaire</strong><small>Dépenses par mois</small></span><span className="ap2-puce">Illustration</span></div>
        <div className="ap2-tb-g" aria-hidden="true">{MOIS.map(([m, h], i) => {
                const der = i === MOIS.length - 1;
                return <div key={m} className={'ap2-col' + (der ? ' on' : '')}><span><i style={{
                      '--h': Math.round(h * 100) + '%',
                      '--i': i
                    }}></i>{der && <b className="ap2-bulle" style={{
                      '--h': Math.round(h * 100) + '%'
                    }}><Icon name="file-text" size={13} color="#fff" />Rapport mensuel</b>}</span>{m}</div>;
              })}</div>
        <ul className="ap2-tb-l">{LIV.map(([c, x]) => <li key={x}><span aria-hidden="true"><Icon name={c} size={16} color="var(--bleu-600)" /></span>{x}</li>)}</ul></div></Vu>
  </div></div></section>;
}
function Approche2() {
  const [v, setV] = uS(0),
    tabs = uR(null);
  const choisir = (k, focus) => {
    setV(k);
    if (focus) requestAnimationFrame(() => {
      const b = tabs.current && tabs.current.children[k];
      b && b.focus();
    });
  };
  const L = v ? HUM : TECH,
    IC = v ? IC_H : IC_T;
  return <section style={{
    background: 'var(--surface-douce)',
    padding: 'var(--web-section) 0'
  }}><Vu className="ap2-ap" style={CONT}>
    <div style={{
        display: 'grid',
        gap: '24px',
        justifyItems: 'start',
        position: 'sticky',
        top: '120px'
      }}><Tete lib="Notre approche" titre={T.ap} />
      <div ref={tabs} className="ap2-seg apc-r" role="tablist" aria-label="Qui fait quoi" style={{
          '--x': v,
          '--d': '180ms'
        }}>
        {[['Cléo · 24/7', AV], ['Les humains', null]].map(([l, img], k) => <button key={l} type="button" role="tab" id={'ap2-tb' + k} aria-selected={v === k} aria-controls="ap2-pv" tabIndex={v === k ? 0 : -1} onClick={() => choisir(k)} onKeyDown={e => {
            if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
              e.preventDefault();
              choisir(e.key === 'Home' ? 0 : e.key === 'End' ? 1 : 1 - v, true);
            }
          }}>{img ? <img src={img} alt="" /> : <Icon name="users" size={18} />}{l}</button>)}</div>
      <p className="apc-p apc-r" style={{
          '--d': '240ms'
        }}>{T.note}</p>
      <div className="ap2-rel apc-r" aria-hidden="true" style={{
          '--d': '280ms',
          width: '100%',
          maxWidth: '440px'
        }}><img src={AV} alt="" style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px'
          }} /><span className="ap2-rel-l"></span><Icon name="handshake" size={18} color="var(--bleu-600)" /><span className="ap2-rel-l"></span><span style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--marine-900)',
            display: 'grid',
            placeItems: 'center'
          }}><Icon name="users" size={16} color="#fff" /></span></div>
      <div className="apc-r" style={{
          '--d': '320ms'
        }}><Fleche to="/cleo#relais">Quand une personne prend le relais</Fleche></div></div>
    <div id="ap2-pv" role="tabpanel" aria-labelledby={'ap2-tb' + v} className="ap2-pan" key={v}>
      <h3 className="apc-h3" style={{
          marginBottom: '8px'
        }}>{v ? 'Ce que font les humains' : 'Ce que fait la technologie'}</h3>
      {L.map((x, i) => <div key={x} className={'ap2-li' + (v ? ' h' : '')} style={{
          '--i': i
        }}><span aria-hidden="true"><Icon name={IC[i]} size={22} color={v ? '#fff' : 'var(--bleu-600)'} /></span><strong>{x}</strong><b aria-hidden="true">{pad(i + 1)}</b></div>)}
      <button type="button" className="ap2-lienbt" style={{
          justifySelf: 'start'
        }} onClick={() => choisir(1 - v, true)}>{v ? 'Voir ce que fait la technologie' : 'Voir ce que font les humains'}<Icon name="arrow-right" size={16} /></button>
    </div></Vu></section>;
}
function Tilt({
  p: [f, n, r],
  d
}) {
  const ref = uR(null),
    fin = ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? matchMedia('(hover: hover) and (pointer: fine)').matches : undefined);
  const bouge = e => {
    if (!fin || RMQ()) return;
    const el = ref.current,
      b = el.getBoundingClientRect(),
      x = (e.clientX - b.left) / b.width,
      y = (e.clientY - b.top) / b.height;
    el.classList.add('actif');
    el.style.setProperty('--ry', ((x - .5) * 14).toFixed(2) + 'deg');
    el.style.setProperty('--rx', ((.5 - y) * 12).toFixed(2) + 'deg');
    el.style.setProperty('--gx', x * 100 + '%');
    el.style.setProperty('--gy', y * 100 + '%');
  };
  const sort = () => {
    const el = ref.current;
    el.classList.remove('actif');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return <div className="ap2-eq-in" style={{
    '--d': d + 'ms'
  }}><figure ref={ref} className="ap2-tilt" onPointerMove={bouge} onPointerLeave={sort}><img src={IMG(f)} alt={n + ', ' + r} loading="lazy" /></figure></div>;
}
function Equipe2() {
  return <section id="ap2-equipe" style={{
    background: '#fff',
    padding: 'var(--web-section) 0'
  }}><Vu style={{
      ...CONT,
      display: 'grid',
      gap: 'clamp(40px,5vw,56px)'
    }}>
  <Tete lib="L’équipe derrière Cléo" titre={'Motivés, dévoués et {impossible de les arrêter}\u00A0!'} />
  <div className="ap2-eq">{EQ.map((p, k) => <Tilt key={p[0]} p={p} d={k * 100} />)}</div></Vu></section>;
}
const PINS = [[118, 44], [134, 30], [146, 52], [128, 62], [162, 36], [104, 30], [176, 58]];
function Territoire2() {
  return <section className="ap2-terr ll-sombre" aria-labelledby="ap2-terr-t">
  <svg className="ap2-terr-carte" viewBox="0 0 200 90" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
    <defs><pattern id="ap2-pt" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".35" fill="rgba(181,205,234,.3)" /></pattern></defs>
    <rect width="200" height="90" fill="url(#ap2-pt)" />
    <path d="M-5 74 C 40 66, 70 80, 105 66 S 160 44, 210 50" stroke="rgba(106,154,213,.5)" strokeWidth="5" fill="none" />
    {PINS.map(([x, y], i) => <g key={i}><circle className="ap2-ond" cx={x} cy={y} r="2.4" fill="none" stroke="#91B5E0" strokeWidth=".4" style={{
          '--i': i * .35 + 's'
        }} /><g className="ap2-pin" style={{
          '--i': i * .35 + 's'
        }}><circle cx={x} cy={y} r="1.6" fill="#fff" /><circle cx={x} cy={y} r=".7" fill="#4581CB" /></g></g>)}</svg>
  <Vu className="ap2-terr-in" style={CONT}><div className="ap2-terr-txt">
    <span className="apc-filet apc-r" style={{
          background: 'var(--bleu-300)'
        }} aria-hidden="true"></span><Lib clair><span className="apc-r" style={{
            '--d': '40ms',
            display: 'inline-block'
          }}>Territoire desservi</span></Lib>
    <h2 id="ap2-terr-t" className="apc-h2 apc-r" style={{
          '--d': '100ms',
          color: '#fff'
        }}>{T.terr}</h2>
    <p className="apc-p apc-r" style={{
          '--d': '160ms',
          color: 'var(--bleu-100)'
        }}>{T.terrP}</p>
    <div className="apc-r" style={{
          '--d': '220ms'
        }}></div></div></Vu>
  <span className="ap2-terr-lieu" aria-hidden="true">Partout au Québec</span>
</section>;
}
function PageVitrine({
  route
}) {
  return <div className="apc ap2" data-fn="1"><style>{CSS_C + CSS_2}</style>
  <BandeauPage route={route} surtitre="À propos" titre="Lease Lane, la gestion locative {qui répond} et {qui se voit}." lead="Une jeune entreprise, une équipe de gestion et Cléo : des logements loués plus vite et une gestion que les propriétaires voient, chiffre par chiffre." />
  <Bento2 /><Engagements2 /><Approche2 /><Equipe2 /><Territoire2 /><AppelFinal /></div>;
}

/* ═══════════════════════ 3 · NOCTURNE ═══════════════════════ */

/* Chevrons du logo, en grand, qui glissent au défilement */

/* ——— Bascule de revue ——— */

/* Direction retenue : 2 « Vitrine ». La bascule de revue (PageAProposConcepts) n'est plus branchée. */

export { PageVitrine as PageAProposV2, PageVitrine as PageAProposVitrine };
