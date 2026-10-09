/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/cleo-temoins.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { LL_SITE } from '@/proto/routes';
import { __maintenant, useEtatClient, __ssr } from '@/lib/hydratation';
const CLE = 'll-temoins',
  AV = "/assets/img/cleo-avatar.png";
const conf = () => LL_SITE.temoins || {};
const lire = () => {
  try {
    const v = JSON.parse((__ssr() ? "undefined" : typeof localStorage) !== "undefined" ? localStorage.getItem(CLE) : undefined);
    if (!v) return null;
    const c = conf();
    if (c.version && v.version !== c.version) return null;
    if (typeof c.validiteMois === 'number') {
      const lim = new Date(v.date);
      lim.setMonth(lim.getMonth() + c.validiteMois);
      if (lim < __maintenant()) return null;
    }
    return v;
  } catch (e) {
    return null;
  }
};
const CATS = [['preferences', 'Préférences', 'Filtres de recherche et logements consultés'], ['audience', 'Mesure d’audience', 'Statistiques de fréquentation'], ['publicite', 'Publicité et reciblage', 'Mesure de nos campagnes, annonces sur d’autres sites']];
const AUCUN = {
    preferences: false,
    audience: false,
    publicite: false
  },
  TOUS = {
    preferences: true,
    audience: true,
    publicite: true
  };
const resume = p => {
  const n = CATS.filter(([k]) => p[k]).length;
  return n === 0 ? 'témoins essentiels seulement' : n === CATS.length ? 'tous les témoins acceptés' : n + ' catégorie' + (n > 1 ? 's' : '') + ' acceptée' + (n > 1 ? 's' : '') + ' en plus des essentiels';
};
const CSS = `/* Au-dessus de la bulle de Cléo (z-index 1200), qui couvrait les boutons et empêchait d’enregistrer le choix. 10 % plus petite (zoom .9) et 10 % plus haut (102 → 112 px au-dessus du bas; les valeurs sont divisées par .9 à cause du zoom). */
.ct{zoom:.9;position:fixed;right:26.7px;bottom:124.4px;z-index:1210;width:min(360px,calc(100vw - 48px));font-family:var(--police-corps);color:var(--texte-corps);
  background:#fff;border:1px solid rgba(12,33,71,.12);border-radius:18px;box-shadow:0 24px 60px -24px rgba(12,33,71,.45);transform-origin:100% 100%;animation:ct-in .45s cubic-bezier(.22,1,.36,1) both}
@keyframes ct-in{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
.ct::after{content:'';position:absolute;right:26px;bottom:-7px;width:12px;height:12px;background:#fff;border-right:1px solid rgba(12,33,71,.12);border-bottom:1px solid rgba(12,33,71,.12);transform:rotate(45deg)}
.ct-tete{display:flex;align-items:center;gap:10px;padding:16px 16px 0}
.ct-tete img{width:32px;height:32px;border-radius:50%;object-fit:cover;flex:none}
.ct-tete b{display:block;font-size:13.5px;color:var(--marine-900)}.ct-tete small{display:block;font-size:12px;color:var(--gris-600)}
.ct-x{margin-left:auto;display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:10px;background:transparent;color:var(--marine-900);cursor:pointer}
.ct-x:hover{background:var(--bleu-025)}
.ct-tx{margin:10px 16px 0;font-size:13px;line-height:1.55;color:var(--texte-corps)}.ct-tx a{color:var(--bleu-600);font-weight:600}
.ct-act{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:14px 16px 16px}
.ct-b{min-height:40px;padding:0 8px;border-radius:10px;border:1px solid var(--marine-900);background:#fff;color:var(--marine-900);font:600 13px var(--police-corps);white-space:nowrap;cursor:pointer;transition:background-color .2s,color .2s,transform .15s}
.ct-b:hover{background:var(--bleu-025)}.ct-b:active{transform:scale(.97)}
.ct-b:focus-visible,.ct-x:focus-visible,.ct-sw:focus-visible{outline:2px solid var(--bleu-500);outline-offset:2px}
.ct-cats{margin:12px 16px 0;border-top:1px solid var(--bordure-fine)}
.ct-cat{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--bordure-fine)}
.ct-cat b{display:block;font-size:13px;color:var(--marine-900)}.ct-cat small{display:block;font-size:12px;line-height:1.45;color:var(--gris-600)}
.ct-fixe{font-size:12px;font-weight:600;color:var(--gris-600)}
.ct-sw{position:relative;width:44px;height:26px;border:0;border-radius:13px;background:var(--gris-200);cursor:pointer;transition:background-color .2s;flex:none}
.ct-sw::after{content:'';position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(12,33,71,.3);transition:transform .25s cubic-bezier(.22,1,.36,1)}
.ct-sw[aria-checked="true"]{background:var(--marine-900)}.ct-sw[aria-checked="true"]::after{transform:translateX(18px)}
.ct-ok{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px 8px 12px 14px}
.ct-ok img{width:28px;height:28px;border-radius:50%;object-fit:cover}
.ct-ok p{margin:0;font-size:13px;line-height:1.5;color:var(--marine-900)}
body:has(.ll-cleo-flottant[data-ouvert="1"]) .ct{display:none}
@media (max-width:560px){.ct{left:17.8px;right:17.8px;width:auto;bottom:117.3px}.ct::after{right:30px}.ct-b{font-size:12.5px;padding:0 4px}}
@media (prefers-reduced-motion:reduce){.ct{animation:none}.ct-sw,.ct-sw::after,.ct-b{transition:none}}`;
function CleoTemoins() {
  const [choix, setChoix] = useEtatClient(lire),
    [vue, setVue] = useEtatClient(() => lire() ? null : 'bulle'),
    [prefs, setPrefs] = React.useState(AUCUN),
    [msg, setMsg] = React.useState('');
  const premier = React.useRef(null),
    boite = React.useRef(null),
    retour = React.useRef(null);
  /* « Gérer mes témoins » (pied de page, menu) : ouvre l'écran détaillé avec le choix actuel. */
  React.useEffect(() => {
    const f = () => {
      retour.current = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.activeElement : undefined;
      const v = lire();
      setPrefs(v ? {
        preferences: !!v.preferences,
        audience: !!v.audience,
        publicite: !!v.publicite
      } : AUCUN);
      setVue('detail');
    };
    window.addEventListener('ll-temoins', f);
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.removeEventListener('ll-temoins', f) : undefined;
  }, []);
  React.useEffect(() => {
    if (vue === 'detail' && premier.current) premier.current.focus({
      preventScroll: true
    });
    if (vue === 'ok') {
      const t = setTimeout(() => setVue(null), 5000);
      return () => clearTimeout(t);
    }
  }, [vue]);
  React.useEffect(() => {
    if (!vue || vue === 'ok') return;
    const k = e => {
      if (e.key !== 'Escape') return;
      if (vue === 'detail' && choix) {
        fermer();
      } else if (vue === 'detail') {
        setVue('bulle');
      }
    };
    window.addEventListener('keydown', k);
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.removeEventListener('keydown', k) : undefined;
  }, [vue, choix]);
  const fermer = () => {
    setVue(null);
    try {
      retour.current && retour.current.focus();
    } catch (e) {}
  };
  const enregistrer = p => {
    const v = {
      ...p,
      version: conf().version || null,
      date: __maintenant().toISOString()
    };
    try {
      localStorage.setItem(CLE, JSON.stringify(v));
    } catch (e) {}
    setChoix(v);
    setMsg('C’est noté : ' + resume(p) + '. Vous pouvez changer d’avis en tout temps dans « Gérer mes témoins ».');
    setVue('ok');
    try {
      window.dispatchEvent(new CustomEvent('ll-temoins-choix', {
        detail: v
      }));
    } catch (e) {}
  };
  if (!vue) return null;
  const tete = (titre, sous, x) => <div className="ct-tete"><img src={AV} alt="" /><span><b>{titre}</b><small>{sous}</small></span>{x}</div>;
  return <><style>{CSS}</style>
    {vue === 'bulle' && <section ref={boite} className="ct" role="dialog" aria-modal="false" aria-labelledby="ct-t" aria-describedby="ct-d">
      {tete(<span id="ct-t">Cléo · Vos témoins</span>, 'Agent IA de Lease Lane', null)}
      <p id="ct-d" className="ct-tx">Je n’utilise que les témoins essentiels. Vous permettez les autres pour m’aider à améliorer le site? <a href="/temoins">En savoir plus</a></p>
      <div className="ct-act"><button type="button" className="ct-b" onClick={() => enregistrer(AUCUN)}>Refuser</button><button type="button" className="ct-b" onClick={() => enregistrer(TOUS)}>Accepter</button>
        <button type="button" className="ct-b" onClick={() => {
          retour.current = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.activeElement : undefined;
          setPrefs(AUCUN);
          setVue('detail');
        }}>Choisir</button></div></section>}
    {vue === 'detail' && <section ref={boite} className="ct" role="dialog" aria-modal="false" aria-labelledby="ct-t2">
      {tete(<span id="ct-t2">Vos témoins</span>, 'Choisissez catégorie par catégorie', <button type="button" className="ct-x" onClick={() => choix ? fermer() : setVue('bulle')} aria-label={choix ? 'Fermer sans modifier' : 'Revenir'}><Icon name="x" size={18} color="currentColor" /></button>)}
      <div className="ct-cats">
        <div className="ct-cat"><span><b>Essentiels</b><small>Sécurité, session, langue, vos choix de témoins, fenêtre de Cléo</small></span><span className="ct-fixe">Toujours actifs</span></div>
        {CATS.map(([k, t, d], i) => <div key={k} className="ct-cat"><span id={'ct-l-' + k}><b>{t}</b><small>{d}</small></span>
          <button ref={i === 0 ? premier : null} type="button" role="switch" className="ct-sw" aria-checked={prefs[k]} aria-labelledby={'ct-l-' + k} onClick={() => setPrefs(p => ({
            ...p,
            [k]: !p[k]
          }))} /></div>)}
      </div>
      <p className="ct-tx" style={{
        marginTop: '10px'
      }}><a href="/temoins">Politique relative aux témoins</a></p>
      <div className="ct-act"><button type="button" className="ct-b" onClick={() => enregistrer(AUCUN)}>Tout refuser</button><button type="button" className="ct-b" onClick={() => enregistrer(prefs)}>Enregistrer</button><button type="button" className="ct-b" onClick={() => enregistrer(TOUS)}>Tout accepter</button></div></section>}
    {vue === 'ok' && <section className="ct" role="status" aria-live="polite"><div className="ct-ok"><img src={AV} alt="" /><p>{msg}</p><button type="button" className="ct-x" onClick={fermer} aria-label="Fermer le message"><Icon name="x" size={16} color="currentColor" /></button></div></section>}
  </>;
}
export { CleoTemoins };
