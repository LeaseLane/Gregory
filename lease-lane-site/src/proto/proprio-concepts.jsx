/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/proprio-concepts.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { gab, Exemple, FAQListe, AppelFinal, Calculateur, CleoEnAction } from '@/proto/blocs';
import { PPC, BlocOffre } from '@/proto/pages-proprietaires';
import { PBHeros, PBActions } from '@/proto/pages-proprio-b';
import { useEtatClient, __ssr } from '@/lib/hydratation';
const uS = React.useState,
  uE = React.useEffect,
  uR = React.useRef;
const g = t => gab ? gab(t) : t;
const pad = n => String(n).padStart(2, '0');
const cl = x => Math.max(0, Math.min(1, x));
const RMQ = () => !!(((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? matchMedia('(prefers-reduced-motion: reduce)').matches : undefined));
const SC = () => (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;
const AV = "/assets/img/cleo-avatar.png";
const EX = () => <Exemple />;

/* ——— Utilitaires ——— */
function useVu(seuil = .15) {
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
function useDefile(ref, f, deps = []) {
  uE(() => {
    const sc = SC(),
      el = ref.current;
    if (!sc || !el) return;
    let r = 0;
    const run = () => {
        r = 0;
        f(el.getBoundingClientRect(), sc.clientHeight);
      },
      on = () => {
        if (!r) r = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(run) : undefined;
      };
    sc.addEventListener('scroll', on, {
      passive: true
    });
    addEventListener('resize', on);
    run();
    return () => {
      sc.removeEventListener('scroll', on);
      removeEventListener('resize', on);
      cancelAnimationFrame(r);
    };
  }, deps);
}
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
  return <><span aria-hidden="true">{fmt(v)}{suf}</span><span className="pc-sr">{fmt(n)}{suf}</span></>;
}
/* « 98,6 % » → compteur; « le 15 » reste tel quel */
const Valeur = ({
  v,
  vu
}) => {
  const m = String(v).match(/^(\d+(?:,\d+)?)\s*(.*)$/);
  if (!m) return <>{v}</>;
  const dec = m[1].includes(',') ? m[1].split(',')[1].length : 0;
  return <Compte n={parseFloat(m[1].replace(',', '.'))} dec={dec} suf={m[2] ? ' ' + m[2] : ''} vu={vu} />;
};
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
/* ——— Styles partagés ——— */
const CSS = `.pc{--e:cubic-bezier(.22,1,.36,1);--e2:cubic-bezier(.65,0,.35,1);--bleu-clair:color-mix(in srgb,var(--bleu-050) 25%,var(--bleu-025))}
.pc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.pc :focus-visible{outline:2px solid var(--bleu-500);outline-offset:3px}
.pc-s{position:relative;padding:var(--web-section) 0;background:#fff}.pc-s.d{background:var(--surface-douce)}
.pc-in{max-width:var(--web-conteneur);margin:0 auto;padding:0 var(--web-gouttiere);box-sizing:border-box;display:grid;gap:clamp(40px,5vw,56px)}
.pc-lib{font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--bleu-600)}.ll-sombre .pc-lib{color:var(--bleu-300)}
.pc-h2{margin:0;font-size:var(--titre-l);line-height:1.18;font-weight:700;letter-spacing:-.025em;color:var(--marine-900);max-width:22ch;text-wrap:balance}.ll-sombre .pc-h2{color:#fff}
.pc-h3{margin:0;font-size:20px;line-height:1.3;font-weight:700;letter-spacing:-.015em;color:var(--marine-900);text-wrap:balance}.ll-sombre .pc-h3{color:#fff}
.pc-p{margin:0;font-size:14px;line-height:1.7;color:var(--texte-corps);max-width:56ch;text-wrap:pretty}.ll-sombre .pc-p{color:var(--bleu-100)}
.pc-filet{display:block;width:48px;height:2px;border-radius:2px;background:var(--bleu-500);transform-origin:0 50%}.ll-sombre .pc-filet{background:var(--bleu-300)}
.pc-r{opacity:0;transform:translateY(20px);transition:opacity .8s var(--e),transform .8s var(--e);transition-delay:var(--d,0ms)}.vu .pc-r,.pc-r.vu{opacity:1;transform:none}
.pc-filet.pc-r{transform:scaleX(0)}.vu .pc-filet.pc-r{transform:none}
/* En-tête de section : titre à gauche, introduction et raccourcis à droite */
.pc-tete{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:28px 64px}
.pc-tete-g{display:grid;gap:16px;justify-items:start}.pc-tete-d{display:grid;gap:18px;max-width:460px}
.pc-sauts{display:flex;flex-wrap:wrap;gap:8px}
.pc-saut{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 16px 0 6px;border-radius:12px;border:1px solid rgba(12,33,71,.14);background:#fff;font:600 13px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:background-color .25s,border-color .25s,color .25s}
.pc-saut b{display:grid;place-items:center;width:32px;height:32px;border-radius:8px;background:var(--bleu-025);font-size:12px;font-weight:700;color:var(--bleu-600);font-variant-numeric:tabular-nums;transition:background-color .25s,color .25s}
.pc-saut svg{transition:transform .3s var(--e)}.pc-saut:hover{background:var(--marine-900);border-color:var(--marine-900);color:#fff}.pc-saut:hover b{background:rgba(255,255,255,.14);color:#fff}.pc-saut:hover svg{transform:rotate(90deg) translateX(3px)}
/* Grille 12 colonnes et tuiles */
.pc-g{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}
.pc-c3{grid-column:span 3}.pc-c4{grid-column:span 4}.pc-c5{grid-column:span 5}.pc-c6{grid-column:span 6}.pc-c7{grid-column:span 7}.pc-c8{grid-column:span 8}.pc-c12{grid-column:span 12}.pc-r2{grid-row:span 2}
.pc-t{position:relative;min-width:0;display:flex;flex-direction:column;gap:16px;padding:clamp(22px,2.2vw,28px);border-radius:20px;background:#fff;border:1px solid rgba(12,33,71,.08);box-shadow:0 1px 2px rgba(12,33,71,.04);overflow:hidden;box-sizing:border-box;transition:transform .5s var(--e),box-shadow .5s var(--e),border-color .4s}
.pc-t.sv:hover{transform:translateY(-4px);border-color:rgba(69,129,203,.35);box-shadow:0 28px 56px -34px rgba(12,33,71,.4)}
.pc-t.m{background:var(--degrade-marine);border-color:transparent;color:#fff;padding:clamp(26px,3vw,40px)}
.pc-t.m::before{content:"";position:absolute;inset:0;background:var(--lueur-bleue);opacity:.7;pointer-events:none}.pc-t.m>*{position:relative}
.pc-t.bl{background:var(--bleu-clair);border-color:transparent;box-shadow:none}
.pc-t.d{background:var(--surface-douce)}
.pc-ent{opacity:0;transform:translateY(24px) scale(.98);transition:opacity .8s var(--e),transform .8s var(--e),box-shadow .5s var(--e),border-color .4s;transition-delay:var(--d,0ms),var(--d,0ms),0s,0s}.vu .pc-ent{opacity:1;transform:none}
.pc-ic{width:44px;height:44px;flex:none;border-radius:12px;display:grid;place-items:center;background:var(--bleu-025);transition:transform .5s var(--e),background-color .4s}
.pc-t.m .pc-ic{background:rgba(255,255,255,.12)}.pc-t.bl .pc-ic{background:#fff;box-shadow:0 1px 2px rgba(12,33,71,.08)}
.pc-t.sv:hover .pc-ic{transform:rotate(-8deg) scale(1.05)}
.pc-num{font-size:13px;font-weight:700;color:var(--bleu-600);font-variant-numeric:tabular-nums}.pc-t.m .pc-num{color:var(--bleu-300)}
.pc-chip{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:8px;background:var(--bleu-025);font-size:12px;font-weight:600;color:var(--bleu-700);white-space:nowrap;align-self:flex-start}
.ll-sombre .pc-chip{background:rgba(255,255,255,.1);color:var(--bleu-100)}
.pc-k{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px}
.pc-big{font-size:clamp(44px,4.4vw,64px);line-height:.9;font-weight:800;letter-spacing:-.05em;color:var(--marine-900);font-variant-numeric:tabular-nums}.ll-sombre .pc-big,.pc-t.m .pc-big{color:#fff}
/* Coches */
.pc-sel{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:20px;align-items:stretch}
.pc-sel-l{display:grid;gap:16px;align-content:start;padding:clamp(22px,2.6vw,32px);border-radius:20px;background:#fff;border:1px solid rgba(12,33,71,.10);box-shadow:0 2px 4px rgba(12,33,71,.04),0 30px 60px -28px rgba(12,33,71,.22)}
.pc-sel-o{list-style:none;margin:6px 0 0;padding:0;display:grid}
.pc-sel-o li{position:relative;display:grid;grid-template-columns:38px minmax(0,1fr) 28px;align-items:center;gap:14px;min-height:60px}
.pc-sel-o li+li::before{content:"";position:absolute;left:18px;top:-11px;width:2px;height:22px;background:#C8DAF0}
.pc-sel-n{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#EEF4FB;color:var(--marine-900);font-size:12px;font-weight:700;transition:background .4s,color .4s}
.pc-sel-o li[data-ok="1"] .pc-sel-n{background:var(--marine-900);color:#fff}
.pc-sel-t{font-size:14px;font-weight:600;line-height:1.4;color:var(--marine-900)}
.pc-sel-c{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:#EEF4FB;opacity:0;transform:scale(.6);transition:opacity .35s,transform .35s cubic-bezier(.34,1.56,.64,1)}
.pc-sel-o li[data-ok="1"] .pc-sel-c{opacity:1;transform:none}
.pc-sel-r{display:grid;grid-template-rows:minmax(0,1.3fr) minmax(0,1fr);gap:20px}
.pc-sel-d{display:grid;gap:14px;align-content:center;padding:clamp(24px,2.8vw,36px);border-radius:20px;color:#fff;background:radial-gradient(120% 90% at 100% 0%,rgba(69,129,203,.5),rgba(69,129,203,0) 60%),linear-gradient(135deg,#173A6E,#0C2147);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 30px 60px -28px rgba(12,33,71,.5)}
.pc-sel-loi{display:flex;gap:16px;align-items:center;padding:clamp(20px,2.4vw,28px);border-radius:20px;background:#F5F8FC;border:1px solid rgba(12,33,71,.08)}
@media (max-width:960px){.pc-sel{grid-template-columns:minmax(0,1fr)}.pc-sel-r{grid-template-rows:auto}}
@media (prefers-reduced-motion:reduce){.pc-sel-n,.pc-sel-c{transition:none}}
.pc-coches{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.pc-coches li{display:grid;grid-template-columns:40px minmax(0,1fr);gap:14px;align-items:center;min-height:56px;padding:8px 14px 8px 8px;border-radius:14px;background:var(--bleu-clair);font-size:14px;font-weight:600;line-height:1.4;color:var(--marine-900)}
.pc-coches li>span{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;background:#fff;box-shadow:0 1px 2px rgba(12,33,71,.08)}
.pc-coches.anim li{opacity:0;transform:translateX(-12px);transition:opacity .5s var(--e),transform .5s var(--e);transition-delay:calc(200ms + var(--i) * 90ms)}.vu .pc-coches.anim li,.pc-coches.anim.vu li{opacity:1;transform:none}
.ll-sombre .pc-coches li{background:rgba(255,255,255,.08);color:#fff}.ll-sombre .pc-coches li>span{background:rgba(255,255,255,.12);box-shadow:none}
/* Encart */
.pc-enc{display:grid;grid-template-columns:40px minmax(0,1fr);gap:14px;align-items:start;padding:20px;border-radius:16px;background:#fff;border:1px solid rgba(12,33,71,.08)}
.pc-enc>span{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;background:var(--bleu-025)}
.pc-enc strong{display:block;font-size:15px;font-weight:700;color:var(--marine-900);margin:2px 0 4px}.pc-enc p{margin:0;font-size:14px;line-height:1.6;color:var(--texte-corps)}
/* Étapes reliées (cartes) */
.pc-et{position:relative;list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:16px}
.pc-et::before,.pc-et::after{content:"";position:absolute;left:20px;top:19px;height:2px;width:calc((100% + 16px) * (var(--n) - 1) / var(--n));border-radius:2px;background:rgba(12,33,71,.1)}
.pc-et::after{background:linear-gradient(90deg,var(--bleu-500),var(--marine-900));transform-origin:0 50%;transform:scaleX(0);transition:transform 1.6s var(--e2) .2s}.vu .pc-et::after,.pc-et.vu::after{transform:none}
.pc-et>li{display:grid;grid-template-rows:auto 1fr;gap:16px;min-width:0}
.pc-et-n{position:relative;z-index:1;width:40px;height:40px;border-radius:10px;display:grid;place-items:center;background:#fff;border:2px solid rgba(12,33,71,.14);font-size:13px;font-weight:700;color:var(--gris-600);font-variant-numeric:tabular-nums;transition:background-color .4s,border-color .4s,color .4s,box-shadow .4s;transition-delay:calc(300ms + var(--i) * 380ms)}
.vu .pc-et-n,.pc-et.vu .pc-et-n{background:var(--marine-900);border-color:var(--marine-900);color:#fff;box-shadow:0 0 0 5px rgba(69,129,203,.16)}
.pc-et .pc-t{height:100%}
/* Frise verticale */
.pc-frise{position:relative;list-style:none;margin:0;padding:0;display:grid;gap:16px}
.pc-frise::before,.pc-frise::after{content:"";position:absolute;left:23px;top:24px;bottom:24px;width:2px;border-radius:2px;background:rgba(12,33,71,.1)}
.pc-frise::after{background:linear-gradient(180deg,var(--bleu-500),var(--marine-900));transform-origin:50% 0;transform:scaleY(var(--p,0))}
.pc-frise>li{display:grid;grid-template-columns:48px minmax(0,1fr);gap:20px;align-items:start}
.pc-frise-m{position:relative;z-index:1;width:48px;height:48px;border-radius:12px;display:grid;place-items:center;background:#fff;border:2px solid rgba(12,33,71,.14);transition:background-color .4s,border-color .4s,box-shadow .4s}
.pc-frise-m svg{transition:color .4s}.pc-frise>li.on .pc-frise-m{background:var(--marine-900);border-color:var(--marine-900);box-shadow:0 0 0 6px rgba(69,129,203,.16)}.pc-frise>li.on .pc-frise-m svg{color:#fff!important}
.pc-frise>li .pc-t{opacity:.55;transform:translateX(8px);transition:opacity .5s var(--e),transform .5s var(--e),box-shadow .5s,border-color .4s}.pc-frise>li.on .pc-t{opacity:1;transform:none}
/* Parcours : index collant */
.pc-par{display:grid;grid-template-columns:240px minmax(0,1fr);gap:clamp(40px,5vw,88px);align-items:start}
.pc-idx{position:sticky;top:120px;display:grid;gap:4px}
.pc-idx>span{margin-bottom:12px}
.pc-idx button{display:grid;grid-template-columns:28px minmax(0,1fr);gap:6px;align-items:center;min-height:44px;padding:8px 0 8px 16px;border:0;border-left:2px solid rgba(12,33,71,.1);background:none;text-align:left;font:500 13px/1.4 var(--police-corps);color:var(--texte-discret);cursor:pointer;transition:color .25s,border-color .25s}
.pc-idx button b{font-weight:700;font-variant-numeric:tabular-nums}.pc-idx button:hover{color:var(--marine-900)}
.pc-idx button[aria-current="true"]{border-left-color:var(--bleu-500);color:var(--marine-900);font-weight:700}.pc-idx button[aria-current="true"] b{color:var(--bleu-600)}
.pc-idx-p{height:4px;border-radius:4px;background:rgba(12,33,71,.08);overflow:hidden;margin-top:16px}.pc-idx-p i{display:block;height:100%;background:linear-gradient(90deg,var(--bleu-500),var(--marine-900));transform-origin:0 50%;transform:scaleX(var(--p,0))}
.pc-chaps{display:grid;gap:clamp(88px,9vw,128px);min-width:0}
.pc-chap{scroll-margin-top:24px;display:grid;gap:clamp(28px,3vw,40px)}
.pc-chap-t{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px 20px;align-items:end}
.pc-chap-n{grid-row:span 2;font-size:clamp(56px,6vw,88px);line-height:.8;font-weight:800;letter-spacing:-.06em;color:var(--bleu-200);font-variant-numeric:tabular-nums}
/* Lignes (domaines, services) */
.pc-lignes{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pc-ligne{display:grid;grid-template-columns:44px minmax(0,1fr);gap:16px;padding:20px;border-radius:16px;background:#fff;border:1px solid rgba(12,33,71,.08);transition:border-color .3s,transform .4s var(--e),box-shadow .4s}
.pc-ligne:hover{border-color:rgba(69,129,203,.4);transform:translateY(-3px);box-shadow:0 20px 40px -30px rgba(12,33,71,.45)}
.pc-ligne strong{display:block;font-size:16px;font-weight:700;line-height:1.35;color:var(--marine-900);margin:2px 0 6px}.pc-ligne p{margin:0;font-size:14px;line-height:1.6;color:var(--texte-corps)}
/* Tableau comparatif */
.pc-tab{width:100%;border-collapse:separate;border-spacing:0 8px;margin-top:-8px}
.pc-tab th,.pc-tab td{padding:16px 20px;text-align:left;vertical-align:middle;font-size:14px;line-height:1.5}
.pc-tab thead th{padding-top:0;padding-bottom:4px;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--gris-600)}
.pc-tab thead th:last-child{color:var(--bleu-600)}
.pc-tab tbody th{width:28%;font-weight:700;color:var(--marine-900);background:#fff;border:1px solid rgba(12,33,71,.08);border-right:0;border-radius:14px 0 0 14px}
.pc-tab tbody td{color:var(--texte-corps);background:#fff;border-top:1px solid rgba(12,33,71,.08);border-bottom:1px solid rgba(12,33,71,.08)}
.pc-tab tbody td:last-child{background:var(--bleu-clair);color:var(--marine-900);font-weight:600;border-color:transparent;border-radius:0 14px 14px 0}
.pc-tab td>span{display:flex;align-items:flex-start;gap:10px}.pc-tab td svg{margin-top:2px}
.pc-tab tbody tr{opacity:0;transform:translateY(12px);transition:opacity .5s var(--e),transform .5s var(--e);transition-delay:calc(var(--i) * 70ms)}.vu .pc-tab tbody tr,.pc-tab.vu tbody tr{opacity:1;transform:none}
/* Onglets */
.pc-ong{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,8fr);gap:16px;align-items:stretch}
.pc-ong-l{display:grid;gap:8px;align-content:start}
.pc-ong-l button{position:relative;display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:14px;align-items:center;min-height:64px;padding:10px 16px 10px 10px;border-radius:14px;border:1px solid rgba(12,33,71,.08);background:#fff;text-align:left;font:600 14px/1.35 var(--police-corps);color:var(--marine-900);cursor:pointer;transition:background-color .3s,border-color .3s,color .3s,transform .4s var(--e)}
.pc-ong-l button>span:first-child{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;background:var(--bleu-025);transition:background-color .3s}
.pc-ong-l button b{font-size:12px;font-weight:700;color:var(--gris-500);font-variant-numeric:tabular-nums}
.pc-ong-l button:hover{border-color:rgba(69,129,203,.45);transform:translateX(3px)}
.pc-ong-l button[aria-selected="true"]{background:var(--marine-900);border-color:var(--marine-900);color:#fff}.pc-ong-l button[aria-selected="true"]>span:first-child{background:rgba(255,255,255,.12)}.pc-ong-l button[aria-selected="true"] svg{color:#fff!important}.pc-ong-l button[aria-selected="true"] b{color:var(--bleu-300)}
.pc-pan{animation:pc-pan .55s var(--e) both}@keyframes pc-pan{from{opacity:0;transform:translateY(14px)}}
.pc-pan-i>*{animation:pc-pan .55s var(--e) both}.pc-pan-i>*:nth-child(2){animation-delay:60ms}.pc-pan-i>*:nth-child(3){animation-delay:120ms}.pc-pan-i>*:nth-child(4){animation-delay:180ms}.pc-pan-i>*:nth-child(5){animation-delay:240ms}
.pc-hong{display:flex;flex-wrap:wrap;gap:8px}
.pc-hong button{display:inline-flex;align-items:center;gap:10px;min-height:48px;padding:0 16px 0 8px;border-radius:12px;border:1px solid rgba(12,33,71,.12);background:#fff;font:600 14px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:background-color .25s,border-color .25s,color .25s}
.pc-hong button>span{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;background:var(--bleu-025)}
.pc-hong button[aria-selected="true"],.pc-hong button[aria-pressed="true"]{background:var(--marine-900);border-color:var(--marine-900);color:#fff}.pc-hong button[aria-selected="true"]>span,.pc-hong button[aria-pressed="true"]>span{background:rgba(255,255,255,.12)}.pc-hong button[aria-selected="true"] svg,.pc-hong button[aria-pressed="true"] svg{color:#fff!important}
.pc-hong button:not([aria-selected="true"]):not([aria-pressed="true"]):hover{border-color:rgba(69,129,203,.45)}
/* Sélecteur à deux positions */
.pc-seg{position:relative;display:grid;grid-template-columns:1fr 1fr;padding:6px;border-radius:16px;background:var(--surface-enfoncee);width:100%;max-width:460px}
.pc-seg::before{content:"";position:absolute;top:6px;bottom:6px;left:6px;width:calc(50% - 6px);border-radius:12px;background:var(--marine-900);box-shadow:0 10px 24px -10px rgba(12,33,71,.6);transform:translateX(calc(var(--x,0) * 100%));transition:transform .55s cubic-bezier(.34,1.3,.64,1)}
.pc-seg button{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;border:0;background:none;border-radius:12px;font:600 14px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:color .35s}.pc-seg button[aria-selected="true"]{color:#fff}.pc-seg button[aria-selected="true"] svg{color:#fff!important}
/* Liste de vérification à cocher */
.pc-vf{display:grid;gap:20px}
.pc-vf-bar{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;padding:16px 20px;border-radius:16px;background:var(--marine-900);color:#fff}
.pc-vf-bar b{font-size:14px;font-weight:700}.pc-vf-bar small{font-size:13px;color:var(--bleu-100)}
.pc-vf-p{flex:1;min-width:160px;height:8px;border-radius:8px;background:rgba(255,255,255,.14);overflow:hidden}.pc-vf-p i{display:block;height:100%;background:linear-gradient(90deg,var(--bleu-300),#fff);transform-origin:0 50%;transform:scaleX(var(--p,0));transition:transform .5s var(--e)}
.pc-vf-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.pc-cb{display:grid;grid-template-columns:24px minmax(0,1fr);gap:12px;align-items:start;min-height:44px;padding:10px 12px;border-radius:12px;cursor:pointer;font-size:14px;line-height:1.45;color:var(--marine-900);transition:background-color .25s}
.pc-cb:hover{background:var(--bleu-025)}.pc-cb input{position:absolute;opacity:0;width:1px;height:1px}
.pc-cb i{width:24px;height:24px;border-radius:7px;border:2px solid rgba(12,33,71,.25);display:grid;place-items:center;background:#fff;transition:background-color .25s,border-color .25s,transform .35s cubic-bezier(.34,1.56,.64,1)}
.pc-cb i svg{opacity:0;transform:scale(.4);transition:opacity .2s,transform .35s cubic-bezier(.34,1.56,.64,1)}
.pc-cb input:checked+i{background:var(--bleu-500);border-color:var(--bleu-500);transform:scale(1.06)}.pc-cb input:checked+i svg{opacity:1;transform:none}
.pc-cb input:checked~span{color:var(--texte-discret);text-decoration:line-through;text-decoration-color:rgba(12,33,71,.3)}
.pc-cb input:focus-visible+i{outline:2px solid var(--bleu-500);outline-offset:2px}
.pc-four{display:grid;gap:4px;padding-top:14px;margin-top:auto;border-top:1px solid var(--bordure-fine);font-size:14px;line-height:1.5;color:var(--texte-corps)}.pc-four strong{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--marine-900)}
/* Citation */
.pc-cit2{margin:0;display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);border-radius:24px;overflow:hidden;border:1px solid rgba(12,33,71,.14);box-shadow:0 2px 4px rgba(12,33,71,.05),0 24px 56px -24px rgba(12,33,71,.28);background:#fff}
.pc-cit2.seule{grid-template-columns:minmax(0,1fr)}
.pc-cit2-q{position:relative;isolation:isolate;display:grid;gap:28px;align-content:space-between;padding:clamp(28px,4vw,52px);background:var(--degrade-marine);overflow:hidden}
.pc-cit2-q::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(80% 90% at 0% 0%,rgba(97,148,211,.30),transparent 60%)}
.pc-cit2-q::after{content:"“";position:absolute;right:-6px;bottom:-110px;z-index:-1;font-size:340px;line-height:1;font-weight:800;color:rgba(255,255,255,.05)}
.pc-cit2-g{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:28px;font-weight:700;line-height:1;padding-bottom:3px;box-sizing:border-box;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22)}
.pc-cit2 blockquote{margin:0;font-weight:600;font-size:clamp(21px,2vw,28px);line-height:1.4;letter-spacing:-.015em;color:#fff;max-width:30ch;text-wrap:pretty}
.pc-cit2 figcaption{display:flex;align-items:center;gap:14px;padding-top:22px;border-top:1px solid rgba(200,218,240,.18)}
.pc-cit2-av{width:44px;height:44px;flex:none;border-radius:12px;display:grid;place-items:center;background:#fff;color:var(--marine-900);font-size:14px;font-weight:700;letter-spacing:.02em}
.pc-cit2-f{display:grid;gap:20px;align-content:center;padding:clamp(24px,3vw,40px);background:var(--bleu-025)}
.pc-cit2-t{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--bleu-700)}
.pc-cit2-f ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pc-cit2-f li{display:grid;gap:4px;align-content:start;padding:16px;border-radius:14px;background:#fff;border:1px solid rgba(12,33,71,.1)}
.pc-cit2-ic{width:32px;height:32px;margin-bottom:6px;border-radius:9px;display:grid;place-items:center;background:var(--bleu-025)}
.pc-cit2-f strong{font-size:clamp(19px,1.6vw,24px);white-space:nowrap;font-weight:700;line-height:1.1;letter-spacing:-.02em;color:var(--marine-900);font-variant-numeric:tabular-nums}
.pc-cit2-f li>span:last-child{font-size:13px;line-height:1.45;color:var(--texte-corps)}
@media (max-width:960px){.pc-cit2{grid-template-columns:minmax(0,1fr)}}
@media (max-width:620px){.pc-cit2-q{text-align:center;justify-items:center}.pc-cit2 figcaption{flex-direction:column;text-align:center}.pc-cit2-f li{justify-items:center;text-align:center}.pc-cit2-f>div:first-child{justify-content:center!important;flex-wrap:wrap}}
.pc-car{display:grid;gap:20px}
.pc-car-piste{display:grid;grid-auto-flow:column;grid-auto-columns:100%;gap:24px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none;padding:4px 2px 36px;margin:-4px -2px -32px}
.pc-car-piste::-webkit-scrollbar{display:none}
.pc-car-diapo{scroll-snap-align:start;min-width:0;display:grid}
.pc-car-diapo>.pc-cit2{height:100%}
.pc-car-nav{display:flex;align-items:center;justify-content:center;gap:16px}
.pc-car-b{width:44px;height:44px;border-radius:12px;border:1px solid rgba(12,33,71,.18);background:#fff;display:grid;place-items:center;cursor:pointer;transition:border-color .2s,background-color .2s}
.pc-car-b:hover{border-color:var(--marine-900);background:var(--bleu-025)}
.pc-car-b:focus-visible,.pc-car-pts button:focus-visible{outline:2px solid var(--bleu-500);outline-offset:2px}
.pc-car-pts{display:flex;gap:2px}
.pc-car-pts button{position:relative;width:28px;height:44px;padding:0;border:0;background:none;cursor:pointer}
.pc-car-pts button span{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:4px;background:rgba(12,33,71,.22);transition:width .3s cubic-bezier(.22,1,.36,1),margin .3s cubic-bezier(.22,1,.36,1),background-color .3s}
.pc-car-pts button[aria-current="true"] span{width:22px;margin-left:-11px;background:var(--marine-900)}
@media (prefers-reduced-motion:reduce){.pc-car-pts button span,.pc-car-b{transition:none}}
.pc-cit{margin:0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:32px 48px;align-items:end;padding:clamp(28px,4vw,56px);border-radius:24px;background:var(--degrade-marine);position:relative;overflow:hidden}
.pc-cit::before{content:"";position:absolute;inset:0;background:var(--lueur-bleue);opacity:.6}.pc-cit>*{position:relative}
.pc-cit blockquote{margin:0;font-weight:600;font-size:clamp(22px,2.2vw,30px);line-height:1.38;letter-spacing:-.015em;color:#fff;max-width:34ch}
.pc-cit-q{display:block;font-size:88px;line-height:.6;height:40px;color:var(--bleu-300)}
.pc-cit figcaption{display:grid;gap:6px;justify-items:start}
/* Bascule de revue */
.pc-bas{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:1100;display:flex;align-items:center;gap:4px;padding:6px 6px 6px 16px;border-radius:16px;background:var(--marine-900);box-shadow:0 14px 36px rgba(7,26,46,.35);border:1px solid var(--bordure-marine)}
.pc-bas>span{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--bleu-100);margin-right:8px}
.pc-bas button{display:inline-flex;align-items:center;gap:6px;height:44px;padding:0 14px;border:0;border-radius:12px;cursor:pointer;font:600 13px var(--police-corps);white-space:nowrap;background:transparent;color:#fff;transition:background-color .2s,color .2s}
.pc-bas button:hover{background:rgba(255,255,255,.1)}.pc-bas button[aria-pressed=true]{background:#fff;color:var(--marine-900)}.pc-bas button b{font-weight:700;color:var(--bleu-300)}.pc-bas button[aria-pressed=true] b{color:var(--bleu-600)}
.pc-bas button:focus-visible{outline:2px solid var(--bleu-300);outline-offset:2px}
@media (max-width:1100px){.pc-c3,.pc-c4,.pc-c5,.pc-c6{grid-column:span 6}.pc-c7,.pc-c8,.pc-c12{grid-column:span 12}.pc-r2{grid-row:auto}
  .pc-par{grid-template-columns:minmax(0,1fr)}.pc-idx{position:relative;top:auto;display:flex;flex-wrap:wrap;gap:8px}.pc-idx>span,.pc-idx-p{display:none}
  .pc-idx button{min-height:44px;padding:0 14px;border:1px solid rgba(12,33,71,.12);border-radius:12px;background:#fff;grid-template-columns:auto auto}.pc-idx button[aria-current="true"]{border-color:var(--marine-900)}
  .pc-vf-g{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:960px){.pc-et{grid-template-columns:repeat(2,minmax(0,1fr))}.pc-et::before,.pc-et::after{display:none}.pc-ong{grid-template-columns:minmax(0,1fr)}.pc-lignes{grid-template-columns:minmax(0,1fr)}.pc-cit{grid-template-columns:minmax(0,1fr)}}
@media (max-width:720px){.pc-tab thead{display:none}.pc-tab,.pc-tab tbody,.pc-tab tr,.pc-tab th,.pc-tab td,.pc-tab tbody th{display:block;width:auto}.pc-tab{border-spacing:0}
  .pc-tab tbody tr{margin-bottom:12px;border-radius:14px;overflow:hidden;border:1px solid rgba(12,33,71,.08)}.pc-tab tbody th,.pc-tab tbody td{border:0!important;border-radius:0!important}.pc-tab tbody th{padding-bottom:4px;font-size:15px}
  .pc-tab td[data-l]::before{content:attr(data-l);display:block;margin-bottom:4px;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--gris-600)}}
@media (max-width:640px){.pc-st-m{display:none}.pc-g>[class*="pc-c"]{grid-column:span 12}.pc-et{grid-template-columns:minmax(0,1fr)}.pc-vf-g{grid-template-columns:minmax(0,1fr)}.pc-chap-t{grid-template-columns:minmax(0,1fr)}.pc-chap-n{grid-row:auto;font-size:48px}
  .pc-bas{bottom:12px;padding:4px}.pc-bas>span,.pc-bas button i{display:none}.pc-bas button{padding:0 12px}}
@media (prefers-reduced-motion:reduce){.pc *,.pc *::before,.pc *::after{animation:none!important;transition:none!important}
  .pc .pc-r,.pc .pc-ent,.pc .pc-coches.anim li,.pc .pc-tab tbody tr{opacity:1!important;transform:none!important}.pc .pc-et::after{transform:none!important}.pc .pc-frise::after{transform:none!important}.pc .pc-frise>li .pc-t{opacity:1!important;transform:none!important}}`;

/* ——— Briques ——— */

function Tete({
  lib,
  titre,
  intro,
  sauts,
  d = 0,
  id
}) {
  return <Vu className="pc-tete"><div className="pc-tete-g"><span className="pc-filet pc-r" aria-hidden="true"></span><span className="pc-lib pc-r" style={{
        '--d': d + 40 + 'ms'
      }}>{lib}</span>
      <h2 id={id} className="pc-h2 pc-r" style={{
        '--d': d + 100 + 'ms'
      }}>{g(titre)}</h2></div>
    {(intro || sauts) && <div className="pc-tete-d pc-r" style={{
      '--d': d + 200 + 'ms'
    }}>{intro && <p className="pc-p">{g(intro)}</p>}
      {sauts && <nav aria-label="Aller à une section" className="pc-sauts">{sauts.map(([id2, l], k) => <button key={id2} type="button" className="pc-saut" onClick={() => allerA(id2)}><b>{pad(k + 1)}</b>{l}<Icon name="arrow-right" size={15} style={{
            transform: 'rotate(90deg)'
          }} /></button>)}</nav>}</div>}
  </Vu>;
}
const Sec = ({
  id,
  douce,
  children,
  label
}) => <section id={id} className={'pc-s' + (douce ? ' d' : '')} aria-labelledby={label} style={{
  scrollMarginTop: '24px'
}}><div className="pc-in">{children}</div></section>;
const Coches = ({
  items,
  anim = true
}) => <ul className={'pc-coches' + (anim ? ' anim' : '')}>{items.map((t, i) => <li key={t} style={{
    '--i': i
  }}><span aria-hidden="true"><Icon name="check" size={17} color="var(--bleu-600)" /></span>{g(t)}</li>)}</ul>;
const Encart = ({
  ic = 'info',
  t,
  children
}) => <div className="pc-enc"><span aria-hidden="true"><Icon name={ic} size={18} color="var(--bleu-600)" /></span><div><strong>{t}</strong><p>{g(children)}</p></div></div>;
/* Étapes : [icône, titre, texte, repère?] */
function Etapes({
  items
}) {
  const [ref, vu] = useVu(.2);
  return <ol ref={ref} className={'pc-et' + (vu ? ' vu' : '')} style={{
    '--n': items.length
  }}>{items.map(([ic, t, d, m], i) => <li key={t} style={{
      '--i': i
    }}>
    <span className="pc-et-n" aria-hidden="true">{pad(i + 1)}</span>
    <div className="pc-t sv pc-ent" style={{
        '--d': 120 + i * 120 + 'ms'
      }}><span className="pc-ic" aria-hidden="true"><Icon name={ic} size={20} color="var(--bleu-600)" /></span>
      <h3 className="pc-h3" style={{
          fontSize: '18px'
        }}><span className="pc-sr">{'Étape ' + (i + 1) + ' : '}</span>{t}</h3><p className="pc-p">{g(d)}</p>{m && <span className="pc-chip" style={{
          marginTop: 'auto'
        }}><Icon name="clock" size={13} />{m}</span>}</div></li>)}</ol>;
}
/* Frise verticale qui se remplit au défilement */
function Frise({
  items,
  extra
}) {
  const ref = uR(null);
  useDefile(ref, (b, h) => {
    const el = ref.current;
    if (!el) return;
    if (RMQ()) {
      el.style.setProperty('--p', 1);
      el.querySelectorAll(':scope>li').forEach(li => li.classList.add('on'));
      return;
    }
    el.style.setProperty('--p', cl((h * .62 - b.top - 24) / (b.height - 48)).toFixed(3));
    el.querySelectorAll(':scope>li').forEach(li => li.classList.toggle('on', li.getBoundingClientRect().top < h * .62));
  });
  return <ol ref={ref} className="pc-frise">{items.map(([ic, t, d, m], i) => <li key={t}><span className="pc-frise-m" aria-hidden="true"><Icon name={ic} size={20} color="var(--bleu-600)" /></span>
    <div className="pc-t"><div className="pc-k"><span className="pc-num">Étape {pad(i + 1)}</span>{m && <span className="pc-chip"><Icon name="clock" size={13} />{m}</span>}</div>
      <h3 className="pc-h3" style={{
          fontSize: '18px'
        }}>{t}</h3><p className="pc-p">{g(d)}</p>{extra && extra(i)}</div></li>)}</ol>;
}
/* Tableau comparatif : colonnes [Poste, A, B]; la dernière colonne est celle de Lease Lane */
function Tableau({
  cols,
  lignes,
  ic = ['minus', 'check']
}) {
  const [ref, vu] = useVu(.1);
  return <div ref={ref} className={vu ? 'vu' : ''}><table className="pc-tab"><thead><tr>{cols.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
    <tbody>{lignes.map(([a, b, c], i) => <tr key={a} style={{
          '--i': i
        }}><th scope="row">{a}</th>
      <td data-l={cols[1]}><span>{g(b)}</span></td>
      <td data-l={cols[2]}><span>{c === '—' ? <span style={{
                color: 'var(--texte-discret)',
                fontWeight: 500
              }}>Rien à fournir</span> : <><span className="pc-ok" aria-hidden="true"><Icon name="check" size={13} color="#fff" /></span>{g(c)}</>}</span></td></tr>)}</tbody></table></div>;
}
/* Onglets accessibles (flèches, Début, Fin) */
function useOnglets(n) {
  const [a, setA] = uS(0),
    ref = uR(null);
  const aller = (k, focus) => {
    const v = (k + n) % n;
    setA(v);
    if (focus) requestAnimationFrame(() => {
      const b = ref.current && ref.current.querySelectorAll('[role=tab]')[v];
      b && b.focus();
    });
  };
  const clavier = e => {
    const m = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1
    }[e.key];
    if (m) {
      e.preventDefault();
      aller(a + m, true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      aller(0, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      aller(n - 1, true);
    }
  };
  return {
    a,
    aller,
    ref,
    tab: (k, id) => ({
      role: 'tab',
      id: id + '-t' + k,
      'aria-selected': a === k,
      'aria-controls': id + '-p',
      tabIndex: a === k ? 0 : -1,
      onClick: () => aller(k),
      onKeyDown: clavier
    }),
    pan: id => ({
      role: 'tabpanel',
      id: id + '-p',
      'aria-labelledby': id + '-t' + a,
      tabIndex: 0
    })
  };
}
/* Témoignage en fiche de cas : la citation (marine) et, à côté, les chiffres clés de la transition (fond clair). Sans chiffres : citation seule. */
const Citation = ({
  c
}) => {
  const [q, n, d, f] = c;
  const ini = n.replace(/ et /, ' ').split(/\s+/).filter(x => /^[A-ZÀ-Ý]/.test(x)).slice(0, 2).map(x => x[0]).join('');
  return <figure className={'pc-cit2' + (f ? '' : ' seule')}>
    <div className="pc-cit2-q ll-sombre">
      <span className="pc-cit2-g" aria-hidden="true">«</span>
      <blockquote>{q}</blockquote>
      <figcaption><span className="pc-cit2-av" aria-hidden="true">{ini}</span><span style={{
          display: 'grid',
          gap: '2px'
        }}><span style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#fff'
          }}>{n}</span><span style={{
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'var(--bleu-100)'
          }}>{d}</span></span></figcaption></div>
    {f && <div className="pc-cit2-f">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}><span className="pc-cit2-t">La transition en bref</span></div>
      <ul>{f.map(([v, t, ic]) => <li key={t}><span className="pc-cit2-ic" aria-hidden="true"><Icon name={ic} size={16} color="var(--marine-900)" /></span><strong>{v}</strong><span>{t}</span></li>)}</ul></div>}
  </figure>;
};
/* Carrousel de fiches de cas : une fiche visible, flèches, points et clavier (flèches gauche-droite). Défilement natif avec aimantation. */
function CarrouselCitations({
  items
}) {
  const piste = uR(null),
    [i, setI] = uS(0),
    n = items.length;
  const aller = k => {
    const el = piste.current;
    if (!el) return;
    const j = (k + n) % n,
      c = el.children[j];
    if (c) el.scrollTo({
      left: c.offsetLeft - el.offsetLeft,
      behavior: ((__ssr() ? "undefined" : typeof window) !== "undefined" ? matchMedia('(prefers-reduced-motion: reduce)').matches : undefined) ? 'auto' : 'smooth'
    });
    setI(j);
  };
  uE(() => {
    const el = piste.current;
    if (!el) return;
    let t = 0;
    const f = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const k = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
        setI(Math.max(0, Math.min(n - 1, k)));
      }, 80);
    };
    el.addEventListener('scroll', f, {
      passive: true
    });
    return () => el.removeEventListener('scroll', f);
  }, [n]);
  const clavier = e => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      aller(i + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      aller(i - 1);
    }
  };
  return <section className="pc-car" aria-roledescription="carrousel" aria-label="Témoignages de propriétaires" onKeyDown={clavier}>
    <div ref={piste} className="pc-car-piste">{items.map((c, k) => <div key={c[1]} className="pc-car-diapo" role="group" aria-roledescription="diapositive" aria-label={k + 1 + ' sur ' + n} aria-hidden={k !== i ? 'true' : undefined} inert={k !== i ? true : undefined}><Citation c={c} /></div>)}</div>
    <div className="pc-car-nav">
      <button type="button" className="pc-car-b" onClick={() => aller(i - 1)} aria-label="Témoignage précédent"><Icon name="arrow-left" size={18} color="var(--marine-900)" /></button>
      <div className="pc-car-pts" role="group" aria-label="Choisir un témoignage">{items.map((c, k) => <button key={c[1]} type="button" aria-current={k === i ? 'true' : undefined} aria-label={'Témoignage ' + (k + 1) + ' sur ' + n} onClick={() => aller(k)}><span aria-hidden="true" /></button>)}</div>
      <button type="button" className="pc-car-b" onClick={() => aller(i + 1)} aria-label="Témoignage suivant"><Icon name="arrow-right" size={18} color="var(--marine-900)" /></button>
    </div></section>;
}
/* Indicateurs (valeurs d'exemple : masqués hors revue) */
function Indicateurs({
  items,
  cols = 'pc-c3',
  marine
}) {
  const [ref, vu] = useVu(.3);
  return <div ref={ref} className={'pc-g' + (vu ? ' vu' : '')} data-ll-exemple="1">{items.map(([v, t, d], i) => <div key={t} className={cols + ' pc-t sv pc-ent' + (marine && !i ? ' m ll-sombre' : '')} style={{
      '--d': i * 100 + 'ms'
    }}>
    <div className="pc-k"><span className="pc-num">{pad(i + 1)}</span><EX /></div><span className="pc-big"><Valeur v={v} vu={vu} /></span>
    <div style={{
        display: 'grid',
        gap: '4px'
      }}><strong style={{
          fontSize: '16px',
          fontWeight: 700,
          color: marine && !i ? '#fff' : 'var(--marine-900)'
        }}>{t}</strong><span className="pc-p" style={{
          fontSize: '13px'
        }}>{d}</span></div></div>)}</div>;
}
/* Index collant + chapitres */
function Parcours({
  chap
}) {
  const [a, setA] = uS(0),
    box = uR(null),
    idx = uR(null);
  useDefile(box, (b, h) => {
    let k = 0;
    chap.forEach(([id], i) => {
      const el = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById(id) : undefined;
      if (el && el.getBoundingClientRect().top < h * .4) k = i;
    });
    setA(k);
    if (idx.current) idx.current.style.setProperty('--p', cl((h * .4 - b.top) / b.height).toFixed(3));
  });
  return <div ref={box} className="pc-par"><nav ref={idx} aria-label="Sur cette page" className="pc-idx"><span className="pc-lib" style={{
        color: 'var(--texte-discret)'
      }}>Sur cette page</span>
      {chap.map(([id, court], i) => <button key={id} type="button" aria-current={a === i ? 'true' : undefined} onClick={() => allerA(id)}><b>{pad(i + 1)}</b>{court}</button>)}
      <span className="pc-idx-p" aria-hidden="true"><i></i></span></nav>
    <div className="pc-chaps">{chap.map(([id, court, titre, contenu, intro], i) => <Vu as="section" key={id} id={id} className="pc-chap" aria-labelledby={id + '-t'}>
      <div className="pc-chap-t"><span className="pc-chap-n pc-r" aria-hidden="true">{pad(i + 1)}</span><span className="pc-lib pc-r" style={{
            '--d': '60ms'
          }}>{court}</span>
        <h2 id={id + '-t'} className="pc-h2 pc-r" style={{
            '--d': '120ms',
            maxWidth: '26ch'
          }}>{g(titre)}</h2></div>
      {intro && <p className="pc-p pc-r" style={{
          '--d': '180ms',
          marginTop: '-12px'
        }}>{g(intro)}</p>}
      <div className="pc-r" style={{
          '--d': '200ms'
        }}>{contenu}</div></Vu>)}</div></div>;
}
const Lignes = ({
  items
}) => <ul className="pc-lignes">{items.map(([ic, t, d]) => <li key={t} className="pc-ligne"><span className="pc-ic" aria-hidden="true"><Icon name={ic} size={20} color="var(--bleu-600)" /></span><div><strong>{t}</strong><p>{g(d)}</p></div></li>)}</ul>;
/* Liste de vérification interactive (Changer) : [n, titre, points, vous fournissez] */

const FAQ = ({
  route,
  titre,
  douce
}) => <FAQListe ids={route.faq} fond={douce ? 'douce' : undefined} titre={titre} />;

/* ═════════════ EXPERTISE ET STRATÉGIE ═════════════ */
const HerosExpertise = ({
  route
}) => {
  const c = PPC.expertise;
  return <PBHeros route={route} surtitre="Expertise et stratégie" titre={c.titre} lead={c.lead} actions={<PBActions a="Obtenir une offre" />} stats={c.indicateurs.slice(0, 3).map(([v, t]) => [v, t + ' · exemple'])} />;
};
const OffreExpertise = ({
  douce
}) => typeof BlocOffre !== 'undefined' ? <BlocOffre fond={douce ? 'douce' : 'blanc'} titre="Un {plan écrit} pour votre immeuble." /> : <AppelFinal titre="Un {plan écrit} pour votre immeuble." />;
const NoteDecide = () => <Encart ic="circle-check" t="Vous décidez">Le plan est une recommandation : chaque hausse de loyer, chaque chantier et chaque recours vous est soumis.</Encart>;
const COLS_EXP = ['Poste', 'En autogestion', 'Avec Lease Lane'];
function ExpertiseB({
  route
}) {
  const c = PPC.expertise;
  return <>
    <HerosExpertise route={route} />
    <section className="pc-s"><div className="pc-in"><Parcours chap={[['exb-domaines', 'Domaines d’expertise', 'Six sujets que nous suivons pour vous, {mois après mois}.', <Lignes items={c.domaines} />], ['exb-methode', 'Notre méthode', 'Du diagnostic au {résultat mesuré}.', <div style={{
          display: 'grid',
          gap: '24px'
        }}><Frise items={c.methode} /><NoteDecide /></div>, 'Les repères de durée sont des exemples.'], ['exb-comparatif', 'Autogestion ou gestionnaire', 'Votre temps et vos risques, {poste par poste}.', <Tableau cols={COLS_EXP} lignes={c.comparatif} />], ...(((__ssr() ? "undefined" : typeof document) !== "undefined" ? document.documentElement.dataset.exemples : undefined) === '1' ? [['exb-indicateurs', 'Indicateurs suivis', 'Les chiffres qui guident {chaque recommandation}.', <Indicateurs items={c.indicateurs} cols="pc-c6" />, 'Présentés dans votre rapport du 15 et dans votre tableau de bord.']] : [])]} /></div></section>
    <FAQ route={route} douce titre="Loyers, TAL et {conformité}." />
    <OffreExpertise />
  </>;
}
/* ═════════════ LOCATION ET MISE EN MARCHÉ ═════════════ */
const HerosLocation = ({
  route
}) => {
  const c = PPC.location;
  return <PBHeros route={route} surtitre="Location et mise en marché" titre={<>Trouver des locataires <span className="llh-l">rapidement, sans perdre</span> <span className="llh-l"><span className="ll-bleu">un mois de loyer</span>.</span></>} lead={c.lead} actions={<PBActions a="Obtenir une offre" />} stats={[['17 jours', 'Délai moyen de location · exemple'], ['24/7', 'Visites réservées par Cléo'], ['72 h', 'Logement en ligne après les clés · exemple']]} />;
};
const FinLocation = () => <AppelFinal titre="Votre prochain logement vacant, {loué plus vite}." secondaire="Notre expertise" to2="/expertise-et-strategie" />;
/* Mini-interface : deux créneaux et deux rappels, tirés du texte « Visites en ligne » */
const Creneaux = ({
  sombre
}) => <div aria-hidden="true" style={{
  display: 'grid',
  gap: '8px'
}}>
  {['Créneau 1', 'Créneau 2'].map((x, i) => <span key={x} style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    minHeight: '44px',
    padding: '0 14px',
    borderRadius: '12px',
    background: sombre ? i ? 'rgba(255,255,255,.08)' : '#fff' : i ? '#fff' : 'var(--marine-900)',
    color: sombre ? i ? '#fff' : 'var(--marine-900)' : i ? 'var(--marine-900)' : '#fff',
    fontSize: '13px',
    fontWeight: 600
  }}><span style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}><Icon name="calendar-check" size={15} />{x}</span>{!i && <Icon name="check" size={15} />}</span>)}
  <span style={{
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  }}>{['Rappel 24 h avant', 'Rappel 2 h avant'].map(x => <span key={x} className="pc-chip"><Icon name="bell" size={13} />{x}</span>)}</span></div>;
/* Aperçus de la mise en marché (illustrations : aucune donnée réelle) */
/* Diffusion (12 oct. 2026) : la fiche part vers Facebook, Instagram et TikTok (traits animés), avec SEO, GEO et prospection par IA en continu. */
const CSS_DIF = `
.dif{display:grid;gap:14px;padding:22px}
.dif-g{display:grid;grid-template-columns:104px 46px minmax(0,1fr);align-items:center}
.dif-f{display:grid;gap:7px;padding:8px 8px 10px;border-radius:14px;background:#fff;border:1px solid rgba(12,33,71,.10);box-shadow:0 2px 4px rgba(12,33,71,.05),0 18px 34px -16px rgba(12,33,71,.30);transform:rotate(-3deg)}
.dif-ph{position:relative;height:58px;border-radius:9px;overflow:hidden;background:linear-gradient(135deg,#4581CB,#173A6E)}
.dif-ph::after{content:"";position:absolute;inset:auto 0 0 0;height:26px;background:linear-gradient(transparent,rgba(12,33,71,.35))}
.dif-c{display:grid;gap:8px}
.dif-r{display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:46px;padding:0 10px 0 6px;border-radius:12px;background:#fff;border:1px solid rgba(12,33,71,.10);box-shadow:0 8px 18px -12px rgba(12,33,71,.25)}
.dif-i{width:34px;height:34px;border-radius:9px;display:grid;place-items:center}
.dif-ok{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#4581CB}
.dif-ok i{width:6px;height:6px;border-radius:50%;background:#4581CB}
.dif-l path{stroke-dasharray:4 6}
.dif-ia{position:relative;overflow:hidden;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:52px;padding:0 14px 0 8px;border-radius:14px;color:#fff;background:linear-gradient(120deg,#173A6E,#0C2147);box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 18px 34px -16px rgba(12,33,71,.55)}
.dif-ia::after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-40%;background:linear-gradient(100deg,transparent,rgba(145,181,224,.22),transparent)}
.dif-pt{position:relative;width:7px;height:7px;border-radius:50%;background:#91B5E0}
.dif-pt::after{content:"";position:absolute;inset:-5px;border-radius:50%;border:1.5px solid rgba(145,181,224,.6)}
@media (prefers-reduced-motion:no-preference){.dif-l path{animation:dif-flux 1.1s linear infinite}@keyframes dif-flux{to{stroke-dashoffset:-20}}
 .dif-ia::after{animation:dif-luit 3.2s ease-in-out infinite}@keyframes dif-luit{0%{left:-40%}60%,100%{left:110%}}
 .dif-pt::after{animation:dif-p 1.8s ease-out infinite}@keyframes dif-p{from{transform:scale(.5);opacity:1}to{transform:scale(1.6);opacity:0}}
 .dif-r{animation:dif-in .6s cubic-bezier(.2,.7,.2,1) both;animation-delay:var(--d)}@keyframes dif-in{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:none}}}
@media (max-width:420px){.dif-g{grid-template-columns:84px 30px minmax(0,1fr)}.dif-ok{display:none}}`;
const LOGO = {
  Facebook: [<path key="f" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z" fill="#fff" />, '#1877F2'],
  Instagram: [<g key="i" fill="none" stroke="#fff" strokeWidth="1.9"><rect x="4.5" y="4.5" width="15" height="15" rx="4.2" /><circle cx="12" cy="12" r="3.5" /><circle cx="16.6" cy="7.4" r=".6" fill="#fff" stroke="none" /></g>, 'linear-gradient(135deg,#F58529,#DD2A7B 50%,#8134AF)'],
  TikTok: [<path key="t" d="M16.3 4c.3 1.9 1.6 3.3 3.5 3.5v2.8c-1.3 0-2.5-.4-3.5-1.1v5.6a5 5 0 1 1-5-5h.5v2.9a2.2 2.2 0 1 0 1.7 2.1V4h2.8z" fill="#fff" />, '#111827']
};
const CANAUX = [['Facebook', 'Page et Marketplace'], ['Instagram', 'Publications et stories'], ['TikTok', 'Vidéo de présentation']];
function Diffusion() {
  return <div className="pc-t dif"><style>{CSS_DIF}</style><span className="pc-chip" style={{
      justifySelf: 'start'
    }}>Illustration</span>
    <div className="dif-g">
      <div className="dif-f"><div className="dif-ph"><svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '60%'
          }}><path d="M0 40V26h10v-8h8v8h9V14l6-6 6 6v12h12v-9h10v9h8V20h9v20z" fill="rgba(255,255,255,.18)" /></svg></div>
        <span style={{
          height: '7px',
          width: '80%',
          borderRadius: '4px',
          background: '#C8DAF0'
        }}></span><span style={{
          height: '6px',
          width: '60%',
          borderRadius: '4px',
          background: '#E1E8F1'
        }}></span>
        <span style={{
          fontSize: '10.5px',
          fontWeight: 700,
          color: 'var(--marine-900)'
        }}>Fiche du logement</span></div>
      <svg className="dif-l" viewBox="0 0 46 170" preserveAspectRatio="none" style={{
        width: '100%',
        height: '170px'
      }} aria-hidden="true"><g fill="none" stroke="#91B5E0" strokeWidth="1.6" strokeLinecap="round">
        <path d="M0 85 C24 85 22 26 46 26" /><path d="M0 85 C24 85 22 85 46 85" /><path d="M0 85 C24 85 22 144 46 144" /></g><circle cx="2" cy="85" r="3.5" fill="#4581CB" /></svg>
      <div className="dif-c">{CANAUX.map(([n, x], i) => {
          const [g, bg] = LOGO[n];
          return <div key={n} className="dif-r" style={{
            '--d': i * 120 + 'ms'
          }}>
        <span className="dif-i" style={{
              background: bg
            }}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">{g}</svg></span>
        <span style={{
              display: 'grid',
              minWidth: 0
            }}><strong style={{
                fontSize: '13px',
                color: 'var(--marine-900)'
              }}>{n}</strong><span style={{
                fontSize: '11px',
                color: 'var(--texte-discret)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>{x}</span></span>
        <span className="dif-ok"><i></i>Publié</span></div>;
        })}</div></div>
    <div className="dif-ia"><span style={{
        width: '34px',
        height: '34px',
        borderRadius: '9px',
        background: 'rgba(255,255,255,.10)',
        display: 'grid',
        placeItems: 'center'
      }}><Icon name="sparkles" size={16} color="#C8DAF0" /></span>
      <span style={{
        display: 'grid'
      }}><strong style={{
          fontSize: '13px',
          color: '#fff'
        }}>SEO, GEO et prospection par IA</strong><span style={{
          fontSize: '11px',
          color: '#B5CDEA'
        }}>Google, moteurs IA et locataires potentiels</span></span>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#C8DAF0'
      }}><span className="dif-pt"></span>En continu</span></div>
  </div>;
}
function ApercuMarche({
  k
}) {
  if (k === 0) return <div className="pc-t" style={{
    padding: 0,
    gap: 0
  }}><img src="/assets/img/logements/montcalm-cartier.jpg" alt="" loading="lazy" style={{
      width: '100%',
      height: '200px',
      objectFit: 'cover',
      display: 'block'
    }} />
    <div style={{
      display: 'grid',
      gap: '10px',
      padding: '20px'
    }}><span className="pc-chip">Illustration</span><strong style={{
        fontSize: '16px',
        color: 'var(--marine-900)'
      }}>4½ rénové · Montcalm</strong>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
      }}>{['Photos', 'Description', 'Inclusions', 'Disponibilité'].map(x => <span key={x} className="pc-chip"><Icon name="check" size={13} />{x}</span>)}</div></div></div>;
  if (k === 1) return <div className="pc-t" style={{
    gap: '14px'
  }}><span className="pc-chip">Illustration</span>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      minHeight: '44px',
      padding: '0 14px',
      borderRadius: '12px',
      background: 'var(--surface-enfoncee)',
      fontSize: '13px',
      color: 'var(--marine-900)'
    }}><Icon name="lock" size={14} color="var(--gris-500)" />leaselane.ca/logements/votre-logement</div>
    {[0, 1, 2].map(i => <div key={i} style={{
      display: 'grid',
      gap: '6px',
      padding: '12px 0',
      borderTop: '1px solid var(--bordure-fine)'
    }}><span style={{
        width: 70 - i * 12 + '%',
        height: '10px',
        borderRadius: '6px',
        background: 'var(--bleu-100)'
      }}></span><span style={{
        width: 92 - i * 8 + '%',
        height: '8px',
        borderRadius: '6px',
        background: 'var(--gris-100)'
      }}></span></div>)}</div>;
  if (k === 2) return <Diffusion />;
  return <div className="pc-t m ll-sombre" style={{
    gap: '16px'
  }}><span style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }}><img src={AV} alt="" style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px'
      }} /><strong style={{
        fontSize: '14px'
      }}>Cléo propose deux créneaux</strong></span><Creneaux sombre /></div>;
}
function LocationC({
  route
}) {
  const c = PPC.location,
    o = useOnglets(c.marche.length),
    [ref, vu] = useVu(.3),
    cur = c.marche[o.a];
  const [n, setN] = uS(0);
  uE(() => {
    if (!vu) return;
    if (RMQ()) {
      setN(c.selection.length);
      return;
    }
    let k = 0;
    const t = setInterval(() => {
      k++;
      setN(k);
      if (k >= c.selection.length) clearInterval(t);
    }, 380);
    return () => clearInterval(t);
  }, [vu]);
  return <>
    <HerosLocation route={route} />
    <Sec label="loc-cou"><Tete id="loc-cou" lib="Le coût d’un logement vide" titre="Combien vous coûte {chaque jour vacant}?" intro="Ajustez le loyer et la durée : le calcul se fait sous vos yeux." /><Vu className="pc-r">{<Calculateur />}</Vu></Sec>
    <Sec douce label="loc-mar"><Tete id="loc-mar" lib="Mise en marché" titre="Une fiche par logement, des {disponibilités à jour}." intro="Quatre leviers pour louer plus vite. Choisissez-en un." />
      <Vu className="pc-r" style={{
        display: 'grid',
        gap: '20px'
      }}><div ref={o.ref} className="pc-hong" role="tablist" aria-label="Mise en marché">{c.marche.map(([ic, t], k) => <button key={t} type="button" {...o.tab(k, 'loc-m')}><span aria-hidden="true"><Icon name={ic} size={16} color="var(--bleu-600)" /></span>{t}</button>)}</div>
        <div {...o.pan('loc-m')} key={o.a} className="pc-g pc-pan-i">
          <div className="pc-c6 pc-t" style={{
            justifyContent: 'center',
            gap: '14px'
          }}><span className="pc-ic" aria-hidden="true" style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'var(--marine-900)'
            }}><Icon name={cur[0]} size={24} color="#fff" /></span>
            <span className="pc-num">{pad(o.a + 1)} / {pad(c.marche.length)}</span><h3 className="pc-h3" style={{
              fontSize: 'clamp(22px,2.2vw,28px)'
            }}>{cur[1]}</h3><p className="pc-p">{g(cur[2])}</p></div>
          <div className="pc-c6" aria-hidden="true"><ApercuMarche k={o.a} /></div></div></Vu></Sec>
    <Sec label="loc-sel"><Tete id="loc-sel" lib="Sélection des locataires" titre="Des {vérifications complètes}, avec consentement." intro="Cinq vérifications, toujours avec le consentement écrit du candidat. Vous recevez un dossier complet et une recommandation." />
      <div className="pc-sel">
        <div ref={ref} className="pc-sel-l"><div className="pc-k"><strong style={{
              fontSize: '14px',
              color: 'var(--marine-900)'
            }} aria-hidden="true">{n} sur {c.selection.length} vérifications</strong><span className="pc-chip">Dossier type</span></div>
          <span aria-hidden="true" style={{
            height: '6px',
            borderRadius: '6px',
            background: 'rgba(12,33,71,.08)',
            overflow: 'hidden'
          }}><i style={{
              display: 'block',
              height: '100%',
              background: 'linear-gradient(90deg,var(--bleu-500),var(--marine-900))',
              transformOrigin: '0 50%',
              transform: 'scaleX(' + n / c.selection.length + ')',
              transition: 'transform .4s cubic-bezier(.22,1,.36,1)'
            }}></i></span>
          <ol className="pc-sel-o">{c.selection.map((t, i) => <li key={t} data-ok={i < n ? '1' : '0'}><span className="pc-sel-n" aria-hidden="true">{pad(i + 1)}</span><span className="pc-sel-t">{g(t)}</span><span className="pc-sel-c" aria-hidden="true"><Icon name="check" size={16} color="var(--bleu-600)" /></span></li>)}</ol></div>
        <div className="pc-sel-r">
          <Vu className="pc-r pc-sel-d" style={{
            '--d': '120ms'
          }}><span aria-hidden="true" style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,.10)',
              display: 'grid',
              placeItems: 'center'
            }}><Icon name="circle-check" size={22} color="#C8DAF0" /></span>
            <strong style={{
              fontSize: 'clamp(20px,2vw,24px)',
              letterSpacing: '-0.02em',
              color: '#fff'
            }}>Vous gardez la décision</strong><p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.65,
              color: 'var(--bleu-100)'
            }}>Nous vous présentons les dossiers complets et une recommandation. Le choix final vous revient.</p></Vu>
          <Vu className="pc-r pc-sel-loi" style={{
            '--d': '220ms'
          }}><span aria-hidden="true" style={{
              width: '40px',
              height: '40px',
              borderRadius: '11px',
              background: '#EEF4FB',
              display: 'grid',
              placeItems: 'center',
              flex: 'none'
            }}><Icon name="shield-check" size={18} color="var(--bleu-600)" /></span>
            <div style={{
              display: 'grid',
              gap: '6px'
            }}><strong style={{
                fontSize: '15px',
                color: 'var(--marine-900)'
              }}>Loi 25 : seulement ce qui est nécessaire</strong><p style={{
                margin: 0,
                fontSize: '13.5px',
                lineHeight: 1.6,
                color: 'var(--texte-corps)'
              }}>Chaque renseignement demandé sert à étudier la demande. Il est conservé pour une durée limitée, puis détruit. Le candidat peut consulter et faire corriger son dossier.</p></div></Vu></div></div></Sec>
    <Sec douce label="loc-arr"><Tete id="loc-arr" lib="Signature et arrivée" titre="Du bail signé aux {clés remises}." /><Etapes items={c.arrivee} /></Sec>
    {<CleoEnAction surtitre="Le parcours d'un locataire potentiel" titre="Question, disponibilité, {visite réservée}, relance." />}
    <FAQ route={route} douce titre="{Louer vite}, sans raccourci." />
    <FinLocation />
  </>;
}

/* ═════════════ CHANGER DE GESTIONNAIRE ═════════════ */
const HerosChanger = ({
  route
}) => {
  const c = PPC.changer;
  return <PBHeros route={route} surtitre="Changer de gestionnaire" titre={c.titre} lead={c.lead} actions={<PBActions a="Planifier un appel" />} stats={[['4 semaines', 'Transition complète · exemple'], ['1', 'Interlocuteur, du début à la fin'], ['Jour 1', 'Cléo répond à vos locataires']]} />;
};
const FinChanger = () => <AppelFinal titre="Parlons de {votre contrat actuel}." texte="Trente minutes pour lire votre situation et vous dire, concrètement, comment se ferait la transition." bouton="Planifier un appel" />;
const COLS_QF = ['Élément', 'Lease Lane prend en charge', 'Vous fournissez'];
/* Qui fait quoi en cartes : [élément, nous, vous] */

function ChangerB({
  route
}) {
  const c = PPC.changer;
  const verif = i => {
    const [,, pts, four] = c.verif[i];
    return <div style={{
      display: 'grid',
      gap: '12px',
      marginTop: '4px'
    }}><Coches items={pts} anim={false} /><div className="pc-four" style={{
        marginTop: 0
      }}><strong>Vous fournissez</strong>{four || 'Rien : nous nous en chargeons.'}</div></div>;
  };
  return <>
    <HerosChanger route={route} />
    <section className="pc-s"><div className="pc-in"><Parcours chap={[['chb-etapes', 'Les étapes', 'Quatre étapes, {un seul interlocuteur}.', <Frise items={c.etapes} extra={verif} />, 'Chaque étape avec sa liste de vérification et ce que vous fournissez. Les repères de durée sont des exemples.'], ['chb-qui', 'Qui fait quoi', 'Nous {prenons en charge}, vous fournissez l’essentiel.', <Tableau cols={COLS_QF} lignes={c.quiFait} ic={['check', 'user']} />], ['chb-temoignage', 'Témoignage', 'Ils ont {changé de gestionnaire}.', c.temoignages ? <CarrouselCitations items={[c.citation, ...c.temoignages]} /> : <Citation c={c.citation} />]]} /></div></section>
    <FAQ route={route} douce titre="Les questions sur {la transition}." />
    <FinChanger />
  </>;
}

/* ——— Bascule de revue (par page) ——— */

/* Expertise : option B « Parcours » retenue le 9 oct. 2026, bascule retirée (A et C restent dans ce fichier, inactives). */
let PageExpertiseV3 = ({
  route
}) => <><style>{CSS}</style><div className="pc" data-fn="1"><ExpertiseB route={route} /></div></>;
let PageLocationV3 = ({
  route
}) => <><style>{CSS}</style><div className="pc" data-fn="1"><LocationC route={route} /></div></>;
let PageChangerV3 = ({
  route
}) => <><style>{CSS}</style><div className="pc" data-fn="1"><ChangerB route={route} /></div></>;
export { PageExpertiseV3, PageLocationV3, PageChangerV3 };
