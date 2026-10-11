/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/menu-options.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { LLC } from '@/proto/menu-cleo';
import { LL_TEL_URGENCE, LL_SITE } from '@/proto/routes';
import { ouvrirCleo } from '@/proto/seo';
import { __ssr } from '@/lib/hydratation';
const uS = React.useState,
  uE = React.useEffect,
  uR = React.useRef,
  uM = React.useMemo;
const IMG = "/assets/img/",
  POR = IMG + 'cleo/cleo-hd.jpg',
  AV = IMG + 'cleo-avatar.png';
const bureau = () => !!(((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? matchMedia('(min-width:961px)').matches : undefined));

/* Pages hors de l'index du menu actuel */
const EXTRA = {
  quartiers: {
    id: 'quartiers',
    t: 'Quartiers de Québec',
    d: 'Montcalm, Limoilou, Saint-Roch…',
    ic: 'map-pin',
    to: '/quartiers',
    type: 'page'
  }
};
const P = id => LLC.PAR[id] || EXTRA[id];

/* Profils : mêmes clés que le panneau Cléo (app.jsx). « info » ne fixe aucun profil. */
const PROFILS = [{
  k: 'proprio',
  t: 'Propriétaire',
  court: 'Propriétaires',
  d: 'Je possède un immeuble',
  ic: 'building-2',
  ids: ['gestion', 'location', 'expertise', 'changer', 'offre', 'pprop', 'tal']
}, {
  k: 'locataire',
  t: 'Locataire',
  court: 'Locataires',
  d: 'J’habite un logement géré',
  ic: 'key-round',
  ids: ['service', 'travaux', 'suivi', 'plainte', 'endossement', 'cession', 'ploc', 'tal']
}, {
  k: 'info',
  t: 'Informations générales',
  court: 'Lease Lane',
  d: 'L’équipe, la FAQ, vos droits',
  ic: 'info',
  ids: ['apropos', 'joindre', 'faq', 'blogue', 'cleo', 'confid']
}];
const fixerProfil = k => {
  const v = k === 'info' ? null : k;
  try {
    v ? typeof sessionStorage !== "undefined" ? sessionStorage.setItem('ll-cleo-profil', v) : undefined : typeof sessionStorage !== "undefined" ? sessionStorage.removeItem('ll-cleo-profil') : undefined;
  } catch (e) {}
  window.dispatchEvent(new CustomEvent('ll-cleo-profil', {
    detail: {
      profil: v
    }
  }));
};
const lireProfil = () => {
  try {
    const v = typeof sessionStorage !== "undefined" ? sessionStorage.getItem('ll-cleo-profil') : undefined;
    return PROFILS.some(p => p.k === v) ? v : null;
  } catch (e) {
    return null;
  }
};
const telUrg = () => LL_TEL_URGENCE();

/* Comportement commun : Échap ferme (sauf champ rempli), défilement de la page bloqué, Cléo flottant masqué. */
function useMenu(fermer) {
  const f = uR(fermer);
  f.current = fermer;
  uE(() => {
    const esc = e => {
      if (e.key === 'Escape' && !(e.target && e.target.tagName === 'INPUT' && e.target.value)) f.current();
    };
    addEventListener('keydown', esc);
    const sc = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined,
      prev = sc ? sc.style.overflowY : '';
    if (sc) sc.style.overflowY = 'hidden';
    document.body.classList.add('llc-ouvert');
    return () => {
      removeEventListener('keydown', esc);
      if (sc) sc.style.overflowY = prev || 'auto';
      document.body.classList.remove('llc-ouvert');
    };
  }, []);
}
const Racine = ({
  sortie,
  cls = '',
  children,
  style
}) => <div className={'ll-menu lm ' + cls + ' ' + (sortie ? 'll-menu-ferme' : 'll-menu-ouvre')} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={sortie || undefined} style={{
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  top: 'calc(var(--web-entete) + 1px)',
  zIndex: 1000,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  ...style
}}>{children}</div>;
const st = (i, pas = 60, base = 0) => ({
  '--d': base + i * pas + 'ms'
});

/* Champ « Écrire à Cléo » : liste de pages suggérées (flèches, Entrée), sinon la question part à Cléo. Urgence en tête. */
function Demander({
  fermer,
  auto,
  id = 'lm-q',
  h = 60,
  ph = 'Posez une question ou cherchez une page',
  haut
}) {
  const [q, setQ] = uS(''),
    [act, setAct] = uS(-1),
    champ = uR(null),
    lid = id + '-l';
  const res = uM(() => q.trim() ? LLC.chercher(q, 3) : [], [q]);
  const opts = q.trim() ? [...res.map(it => ({
    t: 'page',
    it
  })), {
    t: 'cleo'
  }] : [];
  uE(() => setAct(-1), [q]);
  uE(() => {
    if (auto && bureau() && champ.current) champ.current.focus({
      preventScroll: true
    });
  }, []);
  const choisir = o => {
    if (o.t === 'page') {
      fermer();
      location.href = LLC.href(o.it);
      return;
    }
    const x = q.trim();
    if (!x) {
      champ.current && champ.current.focus();
      return;
    }
    fermer();
    ouvrirCleo && ouvrirCleo(x);
  };
  const touche = e => {
    const n = opts.length;
    if (e.key === 'ArrowDown' && n) {
      e.preventDefault();
      setAct((act + 1) % n);
    } else if (e.key === 'ArrowUp' && n) {
      e.preventDefault();
      setAct(act <= 0 ? n - 1 : act - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (act >= 0) choisir(opts[act]);else if (res[0] && res[0].urg) choisir({
        t: 'page',
        it: res[0]
      });else choisir({
        t: 'cleo'
      });
    } else if (e.key === 'Escape' && q) {
      e.preventDefault();
      setQ('');
    }
  };
  return <div className="lm-dem">
    <div className="lm-champ" style={{
      height: h + 'px'
    }}>
      <span className="lm-champ-ic" aria-hidden="true"><LLC.Ic n="sparkles" t={18} /></span>
      <input ref={champ} id={id} role="combobox" aria-label="Écrire à Cléo ou chercher une page" aria-expanded={opts.length > 0} aria-controls={lid} aria-autocomplete="list" aria-activedescendant={act >= 0 ? lid + '-' + act : undefined} value={q} onChange={e => setQ(e.target.value)} onKeyDown={touche} autoComplete="off" placeholder={ph} />
      <button type="button" className="lm-envoi" aria-label="Envoyer à Cléo" onClick={() => choisir({
        t: 'cleo'
      })}><LLC.Ic n="send" t={18} /></button>
    </div>
    {opts.length > 0 && <ul id={lid} role="listbox" aria-label="Suggestions" className={'lm-sugg' + (haut ? ' lm-sugg-haut' : '')}>{opts.map((o, i) => {
        const a = act === i;
        if (o.t === 'cleo') return <li key="cleo" id={lid + '-' + i} role="option" aria-selected={a} data-a={a ? 1 : 0} onMouseDown={e => e.preventDefault()} onClick={() => choisir(o)} className="lm-sug lm-sug-cleo">
        <img src={AV} alt="" width="32" height="32" /><span className="lm-sug-tx"><b>Demander à Cléo</b><small>« {q.trim()} »</small></span><span className="lm-fl"><LLC.Fl t={16} /></span></li>;
        const it = o.it;
        return <li key={it.id} id={lid + '-' + i} role="option" aria-selected={a} data-a={a ? 1 : 0} onMouseDown={e => e.preventDefault()} onClick={() => choisir(o)} className={'lm-sug' + (it.urg ? ' lm-sug-urg' : '')}>
        <span className="lm-sug-ic" aria-hidden="true"><LLC.Ic n={it.ic} t={16} /></span><span className="lm-sug-tx"><b><LLC.Surligne t={it.t} q={q} /></b><small>{it.d}</small></span><span className={'lm-fl' + (it.to ? '' : ' lm-ne')}><LLC.Fl ne={!it.to} t={16} /></span></li>;
      })}</ul>}
    <span className="lm-sr" aria-live="polite">{q.trim() ? res.length ? res.length + ' page' + (res.length > 1 ? 's' : '') + ' suggérée' + (res.length > 1 ? 's' : '') + '. Flèches pour choisir, Entrée pour ouvrir.' : 'Aucune page. Entrée envoie la question à Cléo.' : ''}</span>
  </div>;
}

/* Lien de destination (toutes options) */

const Statut = ({
  clair
}) => <span className={'lm-statut' + (clair ? ' lm-statut-c' : '')}><span className="lm-pouls" aria-hidden="true" /><span className="lm-st-l">En ligne · répond 24/7</span><span className="lm-st-c">En ligne - 24/7</span></span>;
/* Profils en boutons radio (flèches gauche/droite) */

/* ——— 1 · Halo ——— */

/* ——— 2 · Portrait ——— */
function Portrait({
  fermer,
  sortie
}) {
  useMenu(fermer);
  const [pr, setPr] = uS(() => lireProfil() || 'proprio'),
    choisir = k => {
      setPr(k);
      fixerProfil(k);
    };
  const tabs = uR([]),
    pf = PROFILS.find(p => p.k === pr) || PROFILS[0],
    ix = PROFILS.indexOf(pf);
  const cle = (e, i) => {
    const n = PROFILS.length;
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % n;else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;else if (e.key === 'Home') j = 0;else if (e.key === 'End') j = n - 1;
    if (j === null) return;
    e.preventDefault();
    choisir(PROFILS[j].k);
    tabs.current[j] && tabs.current[j].focus();
  };
  return <Racine sortie={sortie} cls="lm2">
    <section className="lm2-g" aria-label="Cléo">
      <img className="lm2-img" src={POR} alt="Portrait de Cléo, l’agent IA de Lease Lane" width="1024" height="1024" />
      <div className="lm2-voile" aria-hidden="true" />
      <div className="lm2-haut"><span className="lm2-nom"><img src={AV} alt="" width="36" height="36" /><span><b>Cléo</b><small>Agent IA · Lease Lane</small></span></span><Statut /></div>
      <div className="lm2-bas"><Demander fermer={fermer} auto h={60} ph="Écrivez à Cléo…" haut /><a href="/cleo" onClick={fermer} className="lm2-plus">En savoir plus sur Cléo<span className="lm-fl"><LLC.Fl t={14} /></span></a></div>
    </section>
    <section className="lm2-d" aria-label="Pages du site">
      <div role="tablist" aria-label="Profil" className="lm2-tabs lm-st" style={{
        ...st(0, 0, 200),
        '--i': ix
      }}>
        <span className="lm2-ind" aria-hidden="true" />
        {PROFILS.map((p, i) => {
          const on = p.k === pf.k;
          return <button key={p.k} ref={el => tabs.current[i] = el} type="button" role="tab" id={'lm2-tab-' + p.k} aria-selected={on} aria-controls="lm2-pan" tabIndex={on ? 0 : -1} onKeyDown={e => cle(e, i)} onClick={() => choisir(p.k)}><LLC.Ic n={p.ic} t={16} /><span>{p.court}</span></button>;
        })}
      </div>
      <div id="lm2-pan" role="tabpanel" aria-labelledby={'lm2-tab-' + pf.k} className="lm2-pan">
        <ol key={pf.k} className="lm2-liste">{pf.ids.filter(id => id !== 'pprop' && id !== 'ploc').map((id, i) => {
            const it = P(id);
            return <li key={id} className="lm-st" style={st(i, 45)}><a href={it.type === 'urgence' ? telUrg() : LLC.href(it)} onClick={fermer} className="lm2-rang">
          <span className="lm2-ic" aria-hidden="true"><LLC.Ic n={it.ic} t={18} c="#fff" /></span><span className="lm-tx"><b>{it.t}</b></span><span className={'lm-fl' + (it.to ? '' : ' lm-ne')}><LLC.Fl ne={!it.to} t={18} /></span></a></li>;
          })}</ol>
      </div>
      <div className="lm2-pied lm-st" style={st(0, 0, 420)}>
        <a href={telUrg()} onClick={fermer} className="lm2-btn lm2-btn-u"><span className="lm2-btn-ic" aria-hidden="true"><LLC.Ic n="phone" t={16} /></span><span><small>Urgence 24/7</small><b>{LLC.NUM_GARDE}</b></span></a>
        {[['Propriétaire', 'building-2'], ['Locataire', 'key-round']].map(([t, ic]) => <a key={t} href={LLC.PORTAIL} onClick={fermer} className="lm2-btn" aria-label={'Connexion ' + t.toLowerCase()}><span className="lm2-btn-ic" aria-hidden="true"><LLC.Ic n={ic} t={16} /></span><span aria-hidden="true"><small>Connexion</small><b>{t}</b></span><span className="lm-fl lm-ne"><LLC.Fl ne t={16} /></span></a>)}
      </div>
      <nav aria-label="Liens légaux" className="lm2-legal lm-st" style={st(0, 0, 480)}><ul><li><a href="/confidentialite" onClick={fermer}>Politique de confidentialité</a></li><li><button type="button" onClick={() => {
              fermer();
              window.dispatchEvent(new Event('ll-temoins'));
            }}>Gérer mes témoins</button></li><li><a href="/temoins" onClick={fermer}>Témoins de navigation</a></li><li><a href="/conditions-utilisation" onClick={fermer}>Conditions d’utilisation</a></li><li><a href="/gouvernance" onClick={fermer}>Gouvernance des renseignements</a></li></ul><p className="lm2-ligne2"><span>Responsable de la protection des données : <a href={'mailto:' + ((LL_SITE.responsable || {}).courriel || '')}>{(LL_SITE.responsable || {}).courriel}</a></span><span aria-hidden="true" className="lm2-sep">·</span><span>© 2026 {LL_SITE.raison || 'Lease Lane'}</span></p></nav>
    </section>
  </Racine>;
}

/* ——— 3 · Mosaïque ——— */

/* ——— 4 · Index ——— */

/* ——— 5 · Intentions ——— */

/* ——— Styles ——— */
const CSS = `.lm{--e:cubic-bezier(.22,1,.36,1);--fin:1px solid rgba(12,33,71,.14);--verre:rgba(255,255,255,.06);--verre-b:1px solid rgba(255,255,255,.14);font-family:var(--police-corps);color:var(--texte-corps);box-sizing:border-box}
.lm *,.lm *::before,.lm *::after{box-sizing:border-box}
.lm :focus-visible{outline:2px solid var(--bleu-500);outline-offset:3px}.lm .ll-sombre :focus-visible,.lm1 :focus-visible,.lm2-g :focus-visible{outline-color:#fff}
.lm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
:where(.lm) :is(h2,h3,p){margin:0}:where(.lm) :is(ul,ol){list-style:none;margin:0;padding:0}
.lm-lib{display:block;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--bleu-600)}
.lm-h2{font-size:var(--titre-m);line-height:1.2;font-weight:700;letter-spacing:-.02em;color:var(--marine-900)}
.lm-p-s{font-size:14px;line-height:1.6;color:var(--bleu-100)}
/* Apparition en cascade (ouverture seulement) */
@keyframes lm-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes lm-pop{0%{opacity:0;transform:translateY(10px) scale(.96)}100%{opacity:1;transform:none}}
.ll-menu-ouvre .lm-st,.ll-menu-ouvre .lm-mot{animation:lm-up 620ms var(--e) both;animation-delay:var(--d,0ms)}.lm-mot{display:inline-block}
/* Flèches */
.lm-fl{display:grid;flex:none;transition:transform 280ms var(--e)}
:is(.lm-tuile,.lm2-rang,.lm4-l,.lm5-i,.lm3-l,.lm-bouton,.lm-sug,.lm3-cta,.lm2-plus,.lm5-plus):is(:hover,:focus-visible,[data-a="1"]) .lm-fl{transform:translateX(4px)}
:is(.lm-tuile,.lm2-rang,.lm5-i,.lm3-l,.lm-bouton,.lm-sug):is(:hover,:focus-visible,[data-a="1"]) .lm-ne{transform:translate(3px,-3px)}
/* Statut en ligne */
.lm-statut{display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 12px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);font-size:12px;font-weight:600;color:#fff;white-space:nowrap}
.lm-statut-c{background:var(--bleu-025);border-color:var(--bleu-050);color:var(--marine-900)}
.lm-pouls{position:relative;width:8px;height:8px;border-radius:50%;background:#3FB37F}.lm-pouls::after{content:'';position:absolute;inset:0;border-radius:50%;background:#3FB37F;animation:lm-pouls 1.8s ease-out infinite}
@keyframes lm-pouls{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.8);opacity:0}}
/* Champ Cléo */
.lm-dem{position:relative;width:100%}
.lm-champ{display:flex;align-items:center;gap:12px;padding:0 8px 0 18px;border-radius:18px;background:#fff;border:1px solid var(--bordure);box-shadow:0 10px 30px rgba(7,26,46,.16);transition:border-color 200ms,box-shadow 200ms}
.lm-champ:focus-within{border-color:var(--marine-900);box-shadow:0 0 0 4px rgba(69,129,203,.28),0 10px 30px rgba(7,26,46,.16)}
.lm-champ-ic{display:grid;color:var(--bleu-600)}
.lm-champ input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;font:600 15px var(--police-corps);color:var(--marine-900)}
.lm-champ input::placeholder{color:var(--gris-600);opacity:1}
.lm .lm-champ input:focus-visible{outline:none}
.lm-envoi{flex:none;width:46px;height:46px;border:0;border-radius:13px;background:var(--marine-900);color:#fff;display:grid;place-items:center;cursor:pointer;transition:background-color 200ms,transform 200ms var(--e)}.lm-envoi:hover{background:var(--bleu-600)}.lm-envoi:active{transform:scale(.94)}
.lm-sugg{position:absolute;left:0;right:0;top:calc(100% + 8px);z-index:20;padding:6px;border-radius:16px;background:#fff;border:1px solid var(--bordure-fine);box-shadow:0 24px 48px rgba(7,26,46,.22);animation:lm-pop 220ms var(--e) both;text-align:left}
.lm-sugg-haut{top:auto;bottom:calc(100% + 8px)}
.lm-sug{display:grid;grid-template-columns:32px minmax(0,1fr) 18px;align-items:center;gap:12px;min-height:52px;padding:8px 12px 8px 8px;border-radius:12px;cursor:pointer;color:var(--marine-900)}
.lm-sug[data-a="1"],.lm-sug:hover{background:var(--bleu-025)}
.lm-sug-ic{width:32px;height:32px;border-radius:9px;background:var(--bleu-025);display:grid;place-items:center;color:var(--bleu-600)}.lm-sug[data-a="1"] .lm-sug-ic{background:#fff}
.lm-sug-urg .lm-sug-ic{background:var(--urgence-100);color:var(--urgence-500)}
.lm-sug img{width:32px;height:32px;border-radius:50%;object-fit:cover}
.lm-sug-tx{display:grid;min-width:0}.lm-sug-tx b{font-size:14px;font-weight:600}.lm-sug-tx small{font-size:12px;color:var(--gris-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lm-sug-cleo{border-top:1px solid var(--bordure-fine);margin-top:4px;padding-top:10px}
/* Profils en pastilles */
.lm-profils{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}
.lm-pro{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 16px 0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.28);background:transparent;color:#fff;font:600 14px var(--police-corps);cursor:pointer;transition:background-color 200ms,border-color 200ms,color 200ms}
.lm-pro:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.5)}.lm-pro[aria-checked="true"]{background:#fff;border-color:#fff;color:var(--marine-900)}
/* Tuiles de destination (sombre) */
.lm-tuile{display:grid;grid-template-columns:36px minmax(0,1fr) 16px;align-items:center;gap:12px;min-height:68px;padding:12px 14px 12px 12px;border-radius:14px;background:var(--verre);border:var(--verre-b);color:#fff;text-decoration:none;transition:background-color 220ms,border-color 220ms,transform 280ms var(--e)}
.lm-tuile:hover,.lm-tuile:focus-visible{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.36);transform:translateY(-2px)}
.lm-tuile .lm-ic{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.1);display:grid;place-items:center}
.lm-tx{display:grid;gap:2px;min-width:0}.lm-tx b{font-size:14px;font-weight:600;line-height:1.3}.lm-tx small{font-size:12.5px;line-height:1.4;color:var(--bleu-100)}
.lm-tuile.lm-urg{background:var(--urgence-500);border-color:var(--urgence-500)}.lm-tuile.lm-urg small{color:rgba(255,255,255,.9)}
/* Urgence, portails, liens utiles */
.lm-urgence{display:inline-flex;align-items:center;gap:12px;min-height:52px;padding:6px 18px 6px 8px;border-radius:14px;background:var(--urgence-500);color:#fff;text-decoration:none;transition:background-color 200ms}
.lm-urgence:hover{background:var(--urgence-600)}.lm-urg-ic{width:36px;height:36px;border-radius:50%;background:#fff;color:var(--urgence-500);display:grid;place-items:center;flex:none}
.lm-urgence span{display:grid}.lm-urgence small{font-size:11.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;opacity:.92}.lm-urgence b{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}
.lm-portails{display:flex;flex-wrap:wrap;gap:8px}
.lm-bouton{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font:600 13.5px var(--police-corps);text-decoration:none;cursor:pointer;white-space:nowrap;transition:background-color 200ms,color 200ms,border-color 200ms}
.lm-bouton:hover{background:#fff;color:var(--marine-900);border-color:#fff}
.lm-bouton-p{background:var(--marine-900);border-color:var(--marine-900)}.lm-bouton-p:hover{background:var(--bleu-600);border-color:var(--bleu-600);color:#fff}
.lm-utiles ul{display:flex;flex-wrap:wrap;gap:0 16px}.lm-utiles :is(a,button){display:inline-flex;align-items:center;min-height:44px;padding:0;border:0;background:none;font:500 13px var(--police-corps);color:var(--bleu-100);text-decoration:none;cursor:pointer;text-underline-offset:4px}
.lm-utiles :is(a,button):hover{color:#fff;text-decoration:underline}
/* ——— 1 Halo ——— */
.lm1{background:radial-gradient(60% 55% at 50% 22%,rgba(69,129,203,.32) 0%,rgba(12,33,71,0) 70%),linear-gradient(180deg,#0E2340 0%,#081729 100%);isolation:isolate;display:flex;flex-direction:column;color:#fff}
.lm1-c{flex:1 0 auto;width:100%;max-width:1200px;margin:0 auto;padding:clamp(16px,3vh,32px) clamp(20px,3vw,40px) 24px;display:flex;flex-direction:column;align-items:center;gap:clamp(10px,1.7vh,16px);text-align:center}
.lm1-por{position:relative;flex:none;width:clamp(92px,12vh,120px);height:clamp(92px,12vh,120px);display:grid;place-items:center}
.lm1-rond{position:relative;z-index:1;width:100%;height:100%;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#4F7FBE 0%,#1C3B66 70%);border:2px solid rgba(255,255,255,.5);box-shadow:0 20px 50px rgba(2,8,18,.5)}
.lm1-rond img{width:122%;height:auto;margin:6% 0 0 -11%;display:block}
.lm1-onde{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(145,181,224,.55);animation:lm-onde 3.2s cubic-bezier(.22,1,.36,1) infinite}.lm1-onde2{animation-delay:1.6s}
@keyframes lm-onde{0%{transform:scale(1);opacity:.9}100%{transform:scale(1.7);opacity:0}}
.lm1-h{font-size:clamp(28px,3.4vw,44px);line-height:1.12;font-weight:700;letter-spacing:-.025em;color:#fff;text-wrap:balance}
.lm1-p{font-size:14px;line-height:1.6;color:var(--bleu-100);max-width:52ch}
.lm1-q{position:relative;z-index:6;width:100%;max-width:720px;margin-top:4px}
.lm1-pages{width:100%;display:grid;gap:12px;margin-top:clamp(4px,1.4vh,14px);text-align:left}.lm1-pages .lm-lib{color:var(--bleu-300);text-align:center}
.lm1-grille{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.lm1-pied{flex:none;display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px;padding:14px clamp(20px,3vw,40px) calc(16px + var(--lm-rev,0px));border-top:1px solid rgba(255,255,255,.12);background:rgba(8,23,41,.6);backdrop-filter:blur(8px)}
.lm1-pied .lm-utiles{margin-left:auto}.lm1-pied .lm-utiles ul{justify-content:flex-end}
/* ——— 2 Portrait ——— */
.lm2{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);background:var(--bleu-025)}
.lm2-g{position:sticky;top:0;height:calc(100vh - var(--web-entete) - 1px);min-height:560px;overflow:hidden;background:#0C2147;color:#fff;display:flex;flex-direction:column;padding:28px clamp(24px,3vw,48px) 28px}
.lm2-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;animation:lm-zoom 1600ms var(--e) both}
@keyframes lm-zoom{from{transform:scale(1.08)}to{transform:none}}
.lm2-voile{position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,33,71,.55) 0%,rgba(12,33,71,0) 28%,rgba(12,33,71,.15) 48%,rgba(12,33,71,.92) 76%,#0C2147 100%)}
.lm2-haut,.lm2-bulles,.lm2-bas{position:relative;z-index:1}
.lm2-haut{display:flex;align-items:center;justify-content:space-between;gap:12px}
.lm2-nom{display:flex;align-items:center;gap:10px}.lm2-nom img{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.6)}.lm2-nom span{display:grid}.lm2-nom b{font-size:15px}.lm2-nom small{font-size:12px;color:var(--bleu-100)}
.lm2-bulles{margin-top:auto;display:grid;gap:8px;justify-items:start;padding-bottom:16px}
.lm2-bulle{max-width:340px;padding:12px 16px;border-radius:6px 18px 18px 18px;background:rgba(255,255,255,.94);color:var(--marine-900);font-size:14px;font-weight:500;line-height:1.5;box-shadow:0 12px 30px rgba(2,8,18,.3);transform-origin:0 0}
.ll-menu-ouvre .lm2-bulle{animation:lm-pop 520ms var(--e) both;animation-delay:var(--d,0ms)}
.lm2-bas{display:grid;gap:12px;margin-top:auto}
.lm2-plus{justify-self:center;display:inline-flex;align-items:center;gap:8px;min-height:44px;font-size:13.5px;font-weight:600;color:#fff;text-decoration:none}.lm2-plus:hover{text-decoration:underline;text-underline-offset:4px}
.lm2-d{display:flex;flex-direction:column;gap:20px;padding:clamp(28px,4.4vh,48px) clamp(24px,4vw,64px) calc(28px + var(--lm-rev,0px));min-width:0}
.lm2-tabs{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:4px;border-radius:14px;background:#fff;border:var(--fin)}
.lm2-ind{position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px) / 4);border-radius:10px;background:var(--marine-900);transform:translateX(calc(var(--i,0) * 100%));transition:transform 420ms var(--e)}
.lm2-tabs button{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 10px;border:0;border-radius:10px;background:transparent;font:600 13.5px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:color 300ms}
.lm2-tabs button[aria-selected="true"]{color:#fff}.lm2-tabs button:not([aria-selected="true"]):hover{background:var(--bleu-025)}
.lm2-tabs button span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lm2-d-p{font-size:14px;color:var(--gris-700);animation:lm-up 420ms var(--e) both}
.lm2-pan{display:grid;gap:12px}
.lm2-liste{display:grid}.lm2-liste>li:last-child .lm2-rang{border-bottom:0}
.lm2-rang{display:grid;grid-template-columns:40px minmax(0,1fr) 24px;align-items:center;gap:16px;min-height:73.6px;padding:10px 16px;border-bottom:1px solid rgba(12,33,71,.1);color:var(--marine-900);text-decoration:none;border-radius:12px;transition:background-color 220ms,transform 280ms var(--e)}
.lm2-rang:hover,.lm2-rang:focus-visible{background:#fff;transform:translateX(6px)}
.lm2-n{font-size:13px;font-weight:700;color:var(--bleu-600);font-variant-numeric:tabular-nums;text-align:center}
.lm2-rang .lm-tx b{font-size:24.68px;line-height:1.25;font-weight:660;letter-spacing:-.015em}.lm2-rang,.lm2-rang:hover,.lm2-rang:focus-visible{text-decoration:none!important}.lm2-rang .lm-fl svg{width:21.6px;height:21.6px}
.lm2-ic{width:40px;height:40px;border-radius:10px;background:var(--marine-900);display:grid;place-items:center;transition:background-color 220ms,transform 280ms var(--e)}.lm2-rang:hover .lm2-ic,.lm2-rang:focus-visible .lm2-ic{background:var(--bleu-600)}
.lm2-pied{margin-top:8px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding-top:8px}
/* Trois boutons de même taille : ensemble, la largeur de la bande des onglets; chacun, sa hauteur (58 px) */
.lm2-legal ul{display:flex;flex-wrap:wrap;align-items:center;gap:0 14px}.lm2-copy{display:inline-flex;align-items:center;min-height:44px;font-size:11.25px;font-weight:500;color:var(--gris-600)}.lm2-legal :is(a,button){display:inline-flex;align-items:center;min-height:44px;padding:0;border:0;background:none;cursor:pointer;font:500 11.25px var(--police-corps);color:var(--gris-700);text-decoration:underline;text-underline-offset:4px;text-decoration-color:rgba(62,74,89,.45)}.lm2-legal :is(a,button):hover{color:var(--marine-900);text-decoration:none}
.lm2-btn{display:flex;align-items:center;gap:10.5px;min-width:0;height:50.4px;padding:0 12.6px 0 8.4px;border-radius:10px;border:var(--fin);background:#fff;color:var(--marine-900);text-decoration:none;transition:border-color 200ms,background-color 200ms}
.lm2-btn:hover{border-color:var(--marine-900)}.lm2-btn,.lm2-btn:hover,.lm2-btn:focus-visible,.lm2-btn *{text-decoration:none!important}
.lm2-btn-ic{flex:none;width:33.6px;height:33.6px;border-radius:8px;background:var(--marine-900);color:#fff;display:grid;place-items:center}
.lm2-btn>span:nth-child(2){display:grid;min-width:0;margin-right:auto}
.lm2-btn small{font-size:9.24px;line-height:1.3;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--gris-600)}
.lm2-btn b{font-size:14.18px;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lm2-btn-u{background:var(--urgence-500);border-color:var(--urgence-500);color:#fff}.lm2-btn-u:hover{background:var(--urgence-600);border-color:var(--urgence-600)}
.lm2-btn-ic svg{width:16.8px;height:16.8px}.lm2-btn .lm-fl svg{width:16.8px;height:16.8px}
.lm2-btn-u .lm2-btn-ic{background:#fff;color:var(--urgence-500);border-radius:50%}.lm2-btn-u small{color:rgba(255,255,255,.9)}
.lm2-pied .lm-bouton{border-color:rgba(12,33,71,.2);color:var(--marine-900);background:#fff}.lm2-pied .lm-bouton:hover{background:var(--marine-900);color:#fff;border-color:var(--marine-900)}
.lm2-d .lm-utiles :is(a,button){color:var(--gris-700)}.lm2-d .lm-utiles :is(a,button):hover{color:var(--marine-900)}
/* ——— 3 Mosaïque ——— */
.lm3{background:var(--bleu-025)}
.lm3-g{max-width:1440px;margin:0 auto;padding:clamp(20px,3vh,32px) clamp(20px,3vw,48px) calc(28px + var(--lm-rev,0px));display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-template-rows:auto auto auto;gap:16px}
.lm3-t{position:relative;border-radius:20px;background:#fff;border:var(--fin);padding:20px;min-width:0;overflow:hidden}
.lm3-tt{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--marine-900)}.lm3-tt>span{width:28px;height:28px;border-radius:8px;background:var(--bleu-025);display:grid;place-items:center;color:var(--bleu-600)}
.lm3-cleo{grid-column:1/span 5;grid-row:1/span 2;isolation:isolate;overflow:visible;z-index:4;display:flex;flex-direction:column;justify-content:space-between;gap:20px;background:var(--degrade-marine);border:0;color:#fff;padding:clamp(24px,3vw,36px);min-height:380px}
.lm3-det{position:absolute;right:0;top:12px;width:44%;height:auto;z-index:0;pointer-events:none;-webkit-mask-image:linear-gradient(to bottom,#000 62%,transparent 92%);mask-image:linear-gradient(to bottom,#000 62%,transparent 92%);filter:drop-shadow(0 20px 40px rgba(2,8,18,.5));animation:lm-flotte 6s ease-in-out infinite}
@keyframes lm-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.lm3-cleo-c{position:relative;z-index:1;display:grid;gap:14px;justify-items:start;max-width:58%}
.lm3-cleo-bas{position:relative;z-index:2;display:grid;gap:12px;padding:14px;border-radius:18px;background:rgba(8,23,41,.72);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(10px)}
.lm3-h{font-size:clamp(26px,2.4vw,34px);line-height:1.15;font-weight:700;letter-spacing:-.02em;color:#fff;max-width:14ch}.lm3-h span{color:var(--bleu-300)}
.lm3-ex{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:4px}.lm3-ex>span{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--bleu-300);margin-right:4px}
.lm3-ex button{height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(12,33,71,.5);backdrop-filter:blur(4px);color:#fff;font:600 13px var(--police-corps);cursor:pointer;transition:background-color 200ms,color 200ms}.lm3-ex button:hover{background:#fff;color:var(--marine-900)}
.lm3-prop{grid-column:6/span 4}.lm3-loc{grid-column:10/span 3}
.lm3-l{display:grid;grid-template-columns:32px minmax(0,1fr) 16px;align-items:center;gap:12px;min-height:48px;padding:6px 10px 6px 6px;border-radius:12px;color:var(--marine-900);text-decoration:none;transition:background-color 200ms}
.lm3-l:hover,.lm3-l:focus-visible{background:var(--bleu-025)}
.lm3-l .lm-ic{width:32px;height:32px;border-radius:9px;background:var(--bleu-025);display:grid;place-items:center;color:var(--bleu-600);transition:background-color 200ms,color 200ms}.lm3-l:hover .lm-ic{background:var(--marine-900);color:#fff}
.lm3-l .lm-tx b{font-size:14px}
.lm3-cta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;min-height:48px;padding:0 16px;border-radius:12px;background:var(--marine-900);color:#fff;font-size:14px;font-weight:600;text-decoration:none;transition:background-color 200ms}.lm3-cta:hover{background:var(--bleu-600)}
.lm3-log{grid-column:6/span 4;display:flex;align-items:flex-end;min-height:190px;padding:0;border:0;color:#fff;text-decoration:none;background:var(--marine-900)}
.lm3-log img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 900ms var(--e)}.lm3-log:hover img{transform:scale(1.06)}
.lm3-log::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,33,71,.1) 0%,rgba(12,33,71,.55) 45%,rgba(12,33,71,.95) 100%)}
.lm3-log-tx{position:relative;z-index:1;display:grid;gap:4px;padding:20px}.lm3-log-tx small{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--bleu-200)}.lm3-log-tx b{font-size:22px;font-weight:700;letter-spacing:-.01em}.lm3-log-tx span{font-size:13px;color:var(--bleu-100)}
.lm3-rond{position:absolute;z-index:1;right:18px;top:18px;width:44px;height:44px;border-radius:50%;background:#fff;color:var(--marine-900);display:grid;place-items:center;transition:transform 320ms var(--e)}.lm3-log:hover .lm3-rond{transform:rotate(-45deg)}
.lm3-urg{grid-column:10/span 3;display:grid;align-content:end;gap:4px;background:var(--urgence-500);border:0;color:#fff;text-decoration:none;transition:background-color 200ms}
.lm3-urg:hover{background:var(--urgence-600)}.lm3-urg-ic{position:absolute;top:18px;left:18px;width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.18);display:grid;place-items:center}
.lm3-urg small{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;opacity:.92}.lm3-urg b{font-size:24px;font-weight:700;letter-spacing:-.01em;font-variant-numeric:tabular-nums}.lm3-urg span{font-size:13px;opacity:.92}
.lm3-por{grid-column:1/span 5;display:grid;align-content:start;gap:12px}.lm3-por .lm-p-s{color:var(--gris-700)}
.lm3-por .lm-bouton,.lm5-pied .lm-bouton{border-color:rgba(12,33,71,.2);color:var(--marine-900);background:#fff}.lm3-por .lm-bouton:hover,.lm5-pied .lm-bouton:hover{background:var(--marine-900);color:#fff;border-color:var(--marine-900)}
.lm3-ut{grid-column:6/span 7}.lm3-ut-g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 12px}
.lm3-ut-bas{margin-top:8px;padding-top:6px;border-top:1px solid var(--bordure-fine)}.lm3-ut-bas :is(a,button){color:var(--gris-700)}.lm3-ut-bas :is(a,button):hover{color:var(--marine-900)}
.lm3-t:not(.lm3-cleo){transition:transform 320ms var(--e),box-shadow 320ms var(--e),border-color 320ms}.lm3-t:not(.lm3-cleo):hover{transform:translateY(-3px);box-shadow:0 18px 40px rgba(12,33,71,.12);border-color:rgba(12,33,71,.24)}
/* ——— 4 Index ——— */
.lm4{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);background:#fff}
.lm4-g{display:flex;flex-direction:column;gap:12px;padding:clamp(24px,4vh,44px) clamp(24px,4.4vw,72px) calc(28px + var(--lm-rev,0px))}
.lm4-liste{counter-reset:x;border-top:1px solid rgba(12,33,71,.14)}
.lm4-l{position:relative;display:grid;grid-template-columns:40px minmax(0,1fr) auto 24px;align-items:center;gap:16px;min-height:clamp(52px,7.2vh,68px);padding:6px 4px;border-bottom:1px solid rgba(12,33,71,.1);color:var(--marine-900);text-decoration:none}
.lm4-l::after{content:'';position:absolute;left:0;bottom:-1px;height:2px;width:100%;background:var(--marine-900);transform:scaleX(0);transform-origin:0 50%;transition:transform 420ms var(--e)}
.lm4-l[data-a="1"]::after{transform:none}
.lm4-n{font-size:13px;font-weight:700;color:var(--bleu-600);font-variant-numeric:tabular-nums}
.lm4-t{font-size:clamp(22px,2.2vw,32px);line-height:1.15;font-weight:700;letter-spacing:-.025em;transition:color 260ms,transform 360ms var(--e)}
.lm4-l[data-a="1"] .lm4-t{color:var(--bleu-600);transform:translateX(8px)}
.lm4-pub{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--gris-600);white-space:nowrap}
.lm4-sec{margin-top:auto;display:grid;gap:8px;padding-top:16px}
.lm4-sec .lm-bouton{border-color:rgba(12,33,71,.2);color:var(--marine-900)}.lm4-sec .lm-bouton:hover{background:var(--marine-900);color:#fff;border-color:var(--marine-900)}
.lm4-sec .lm-utiles :is(a,button){color:var(--gris-700)}.lm4-sec .lm-utiles :is(a,button):hover{color:var(--marine-900)}
.lm4-d{position:sticky;top:0;height:calc(100vh - var(--web-entete) - 1px);min-height:560px;isolation:isolate;overflow:hidden;background:linear-gradient(180deg,#0E2340 0%,#081729 100%);color:#fff;display:flex;flex-direction:column;gap:16px;padding:28px clamp(24px,3vw,44px) calc(28px + var(--lm-rev,0px))}
.lm4-tete{display:flex;align-items:center;gap:12px}.lm4-tete img{width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.6)}.lm4-tete>span:not(.lm-statut){display:grid;margin-right:auto}.lm4-tete b{font-size:15px}.lm4-tete small{font-size:12px;color:var(--bleu-100)}
.lm4-bulle{position:relative;z-index:2;padding:18px 20px;border-radius:6px 20px 20px 20px;background:#fff;color:var(--marine-900);box-shadow:0 20px 40px rgba(2,8,18,.35);min-height:96px}
.lm4-bulle-p{font-size:14px;line-height:1.6;color:var(--gris-800);animation:lm-up 360ms var(--e) both}.lm4-bulle-p b{color:var(--marine-900)}
.lm4-det{position:absolute;z-index:0;left:50%;bottom:0;width:min(88%,520px);height:auto;transform:translateX(-50%);filter:drop-shadow(0 30px 50px rgba(2,8,18,.6));pointer-events:none;-webkit-mask-image:linear-gradient(to top,transparent 0%,#000 30%);mask-image:linear-gradient(to top,transparent 0%,#000 30%)}
.lm4-bas{position:relative;z-index:2;margin-top:auto;display:grid;gap:10px}
.lm4-urg{justify-self:start}
/* ——— 5 Intentions ——— */
.lm5{background:#fff;display:flex;flex-direction:column}
.lm5-bande{position:relative;isolation:isolate;overflow:visible;z-index:4;flex:none;background:linear-gradient(90deg,#0C2147 0%,#122744 60%,#1C3053 100%);color:#fff}
.lm5-bande-in{max-width:1280px;margin:0 auto;padding:0 var(--web-gouttiere);display:grid;grid-template-columns:clamp(150px,15vw,210px) minmax(0,1fr) minmax(300px,440px);align-items:end;gap:clamp(20px,3vw,40px)}
.lm5-det{width:100%;height:auto;display:block;margin-top:18px;filter:drop-shadow(0 20px 40px rgba(2,8,18,.55))}
.lm5-parle,.lm5-ecrire{align-self:center;display:grid;gap:12px;justify-items:start;padding:24px 0}.lm5-ecrire{justify-items:stretch}.lm5-ecrire .lm-lib{color:var(--bleu-300)}
.lm5-bulle{min-height:64px;display:flex;align-items:center;padding:14px 24px;border-radius:6px 22px 22px 22px;background:#fff;box-shadow:0 18px 40px rgba(2,8,18,.35)}
.lm5-h{font-size:clamp(22px,2.3vw,32px);line-height:1.2;font-weight:700;letter-spacing:-.02em;color:var(--marine-900);animation:lm-up 420ms var(--e) both}
.lm5-points{display:inline-flex;gap:5px}.lm5-points span{width:8px;height:8px;border-radius:50%;background:var(--gris-500)}
.lm5-c{flex:1 0 auto;width:100%;max-width:1280px;margin:0 auto;padding:24px var(--web-gouttiere);display:grid;gap:16px;align-content:start}
.lm5-barre{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px}
.lm5-recherche{position:relative;flex:0 1 320px}.lm5-recherche>span{position:absolute;left:14px;top:50%;transform:translateY(-50%);display:grid;color:var(--bleu-600)}
.lm5-recherche input{width:100%;height:44px;padding:0 14px 0 42px;border-radius:12px;border:1px solid rgba(12,33,71,.16);background:#F7F9FB;font:500 14px var(--police-corps);color:var(--marine-900);outline:none;transition:border-color 200ms,box-shadow 200ms,background-color 200ms}
.lm5-recherche input:hover{background:#fff;border-color:rgba(12,33,71,.36)}.lm5-recherche input:focus{background:#fff;border-color:var(--marine-900);box-shadow:0 0 0 4px rgba(69,129,203,.18)}.lm5-recherche input::placeholder{color:var(--gris-600)}
.lm5-filtres{display:flex;flex-wrap:wrap;gap:8px}
.lm5-filtres button{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 16px 0 14px;border-radius:12px;border:1px solid rgba(12,33,71,.16);background:#fff;color:var(--marine-900);font:600 14px var(--police-corps);cursor:pointer;transition:background-color 200ms,border-color 200ms,color 200ms}
.lm5-filtres button:hover{border-color:var(--marine-900)}.lm5-filtres button[aria-pressed="true"]{background:var(--marine-900);border-color:var(--marine-900);color:#fff}
.lm5-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.lm5-i{position:relative;height:100%;display:grid;grid-template-columns:40px minmax(0,1fr) 16px;grid-template-rows:auto auto;align-items:center;column-gap:14px;row-gap:2px;min-height:84px;padding:14px 16px 14px 14px;border-radius:16px;border:1px solid rgba(12,33,71,.14);background:#fff;color:var(--marine-900);text-decoration:none;transition:border-color 220ms,transform 300ms var(--e),box-shadow 300ms var(--e)}
.lm5-i:hover,.lm5-i:focus-visible{border-color:var(--marine-900);transform:translateY(-3px);box-shadow:0 16px 32px rgba(12,33,71,.1)}
.lm5-ic{grid-row:1/span 2;width:40px;height:40px;border-radius:11px;background:var(--bleu-025);display:grid;place-items:center;color:var(--bleu-600);transition:background-color 220ms,color 220ms}.lm5-i:hover .lm5-ic{background:var(--marine-900);color:#fff}
.lm5-i b{font-size:14px;font-weight:600;line-height:1.35;align-self:end}.lm5-pub,.lm5-num{grid-column:2;font-size:12px;color:var(--gris-600);align-self:start}
.lm5-i .lm-fl{grid-column:3;grid-row:1/span 2}
.lm5-urg{background:var(--urgence-500);border-color:var(--urgence-500);color:#fff}.lm5-urg:hover{border-color:var(--urgence-600);background:var(--urgence-600)}.lm5-urg .lm5-ic{background:rgba(255,255,255,.18);color:#fff}.lm5-urg:hover .lm5-ic{background:#fff;color:var(--urgence-500)}.lm5-urg .lm5-num{color:#fff;font-weight:700;font-size:13px}
.lm5-vide{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:16px;padding:20px;border-radius:16px;background:var(--bleu-025)}.lm5-vide img{width:40px;height:40px;border-radius:50%}.lm5-vide span{display:grid;margin-right:auto}.lm5-vide b{font-size:15px;color:var(--marine-900)}.lm5-vide small{font-size:13px;color:var(--gris-700)}
.lm5-pied{flex:none;display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px;padding:14px var(--web-gouttiere) calc(14px + var(--lm-rev,0px));border-top:1px solid var(--bordure-fine);background:var(--surface-douce)}
.lm5-pied .lm-utiles :is(a,button){color:var(--gris-700)}.lm5-pied .lm-utiles :is(a,button):hover{color:var(--marine-900)}
.lm5-plus{margin-left:auto;display:inline-flex;align-items:center;gap:10px;min-height:44px;font-size:13.5px;font-weight:600;color:var(--marine-900);text-decoration:none}.lm5-plus img{width:28px;height:28px;border-radius:50%}.lm5-plus:hover{text-decoration:underline;text-underline-offset:4px}
/* Écrans moyens et petits */
@media (max-width:1200px){.lm1-grille,.lm5-g{grid-template-columns:repeat(3,minmax(0,1fr))}.lm3-cleo{grid-column:1/span 6}.lm3-prop,.lm3-log{grid-column:7/span 6}.lm3-loc,.lm3-urg{grid-column:span 6}.lm3-por{grid-column:1/span 6}.lm3-ut{grid-column:7/span 6}.lm3-ut-g{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:960px){
  .lm1-grille,.lm5-g{grid-template-columns:repeat(2,minmax(0,1fr))}.lm1-pied .lm-utiles{margin-left:0}
  .lm2,.lm4{grid-template-columns:minmax(0,1fr);grid-auto-rows:max-content}.lm2-g{position:relative;height:auto;min-height:0}.lm2-img{opacity:.55}.lm2-bulles{margin-top:24px}.lm2-bulle:not(:last-child){display:none}
  .lm2-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}.lm2-ind{display:none}.lm2-tabs button[aria-selected="true"]{background:var(--marine-900)}
  .lm3-g>*{grid-column:1/-1!important;grid-row:auto!important}.lm3-cleo{min-height:0}.lm3-det{width:min(220px,46%);bottom:auto;top:16px}.lm3-det{width:min(260px,60%);right:-4%}
  .lm4-d{position:relative;height:auto;min-height:0;order:-1}.lm4-det{display:none}.lm4-pub{display:none}.lm4-l{grid-template-columns:32px minmax(0,1fr) 22px}
  .lm5-plus{margin-left:0}.lm5-bande-in{grid-template-columns:110px minmax(0,1fr)}.lm5-ecrire{grid-column:1/-1;padding-top:0}.lm5-parle{padding:20px 0}
}
.lm2-x{}
@media (max-width:560px){.lm2-pied{grid-template-columns:minmax(0,1fr)}.lm1-grille,.lm5-g,.lm3-ut-g{grid-template-columns:minmax(0,1fr)}.lm-profils{justify-content:flex-start}.lm1-c{text-align:left;align-items:stretch}.lm1-por{align-self:center}.lm-statut{align-self:center}
  .lm2-tabs button span{font-size:12.5px}}
@media (prefers-reduced-motion:reduce){.lm *,.lm *::before,.lm *::after{animation:none!important;transition:none!important}.lm .lm-mot,.lm .lm-st{opacity:1!important;transform:none!important}}`;

/* ——— Menu retenu : option 2 « Portrait » (8 oct. 2026). Bascule de revue retirée; les autres options restent dans ce fichier, inactives. ——— */

function MenuOptions(p) {
  return <React.Fragment><style>{CSS}</style><Portrait {...p} /></React.Fragment>;
}
export { MenuOptions as MenuCleo };
