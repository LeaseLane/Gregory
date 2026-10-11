/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/locataires-v3-commun.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Badge } from '@/components/ds';
import { LL_SITE, LL_TEL_URGENCE } from '@/proto/routes';
import { gab, FilAriane } from '@/proto/blocs';
import { LL_FAQ } from '@/proto/faq';
import { LocatairesB } from '@/proto/locataires-v3-b';
import { __ssr } from '@/lib/hydratation';
const RMQ = () => !!(((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : undefined));
const scroller = () => (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;
const cleo = t => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.dispatchEvent(new CustomEvent('ll-cleo', {
  detail: {
    texte: t
  }
})) : undefined;
const port = () => LL_SITE.portail || '#';
const tel = () => LL_TEL_URGENCE();
const numero = () => LL_SITE.urgence || '[numéro de garde]';
const G = t => gab ? gab(t) : t;
const URG_TXT = 'Fuite d\u2019eau importante, panne de chauffage en hiver, panne électrique, porte ou serrure qui ne ferme plus, détecteur défectueux : appelez, une personne de garde répond.',
  URG_911 = 'En cas de danger, faites le 911.';
const LEAD = 'Vos demandes, leur suivi, votre loyer et votre bail se gèrent dans le portail locataire. Cléo vous répond 24/7, vous explique vos droits selon les règles du TAL (Tribunal administratif du logement, l\u2019ancienne Régie du logement) et trie les urgences; l\u2019équipe prend le relais quand il le faut.';

/* lieu : site = page publique, port = portail locataire (connexion). k = mots de recherche (option B). */
const SV = {
  urgence: {
    ic: 'triangle-alert',
    t: 'Urgence 24/7',
    d: 'Fuite, chauffage, électricité, serrure : quoi faire, quel numéro.',
    href: '#urgence',
    lieu: 'site',
    k: 'urgence fuite eau dégât chauffage froid électricité électrique panne serrure porte barré détecteur fumée danger 911 garde'
  },
  plainte: {
    ic: 'message-square',
    t: 'Commentaire ou plainte',
    d: 'Accusé de réception et délai de réponse publié.',
    href: "/locataires/commentaire-ou-plainte",
    lieu: 'site',
    k: 'commentaire plainte bruit voisin conflit administratif insatisfait suggestion'
  },
  faq: {
    ic: 'circle-help',
    t: 'FAQ locataires',
    d: 'Réponses immédiates, aussi par Cléo.',
    href: "/faq",
    lieu: 'site',
    k: 'faq questions tal régie droits hausse'
  },
  travaux: {
    ic: 'wrench',
    t: 'Nouvelle demande de travaux',
    d: 'Photos, urgence et disponibilités; numéro de suivi immédiat.',
    lieu: 'port',
    k: 'travaux réparation bris entretien plomberie fuite chauffage moisissure photo rendez-vous'
  },
  suivi: {
    ic: 'search',
    t: 'Suivi d\u2019une demande',
    d: 'Le statut à jour et vos avis par courriel ou texto.',
    lieu: 'port',
    k: 'suivi statut demande avancement numéro avis texto courriel'
  },
  loyer: {
    ic: 'credit-card',
    t: 'Paiement du loyer',
    d: 'Portail ou virement; reçu automatique.',
    lieu: 'port',
    k: 'loyer payer paiement virement reçu'
  },
  ajout: {
    ic: 'users',
    t: 'Ajout d\u2019une personne au bail',
    d: 'Colocataire ou occupant, avec l\u2019accord du propriétaire.',
    lieu: 'port',
    k: 'ajout personne bail colocataire coloc occupant conjoint'
  },
  endos: {
    ic: 'pencil',
    t: 'Endossement du bail',
    d: 'Cinq étapes, signature électronique comprise.',
    lieu: 'port',
    k: 'endossement endosseur caution garant signature'
  },
  cession: {
    ic: 'share-2',
    t: 'Cession de bail ou sous-location',
    d: 'Ce que prévoit la Loi 31, puis votre avis en ligne.',
    lieu: 'port',
    k: 'cession sous-location sous-louer céder transférer loi 31'
  },
  docs: {
    ic: 'files',
    t: 'Documents : bail, Relevé 31',
    d: 'Téléchargement en tout temps.',
    lieu: 'port',
    phase: 2,
    k: 'documents bail relevé 31 impôt télécharger copie'
  },
  depart: {
    ic: 'log-out',
    t: 'Avis de départ',
    d: 'Visites de relocation planifiées par Cléo.',
    lieu: 'port',
    phase: 2,
    k: 'départ quitter déménager avis fin bail relocation clés'
  }
};
const hrefDe = s => s.lieu === 'port' ? port() : s.href;
/* Statuts d'exemple du suivi (aperçu du portail). */
const ST = [['Reçue', '29 sept. · 19 h 12', 'Demande classée et numérotée', 'mail'], ['Planifiée', 'Jeudi 2 oct. · 9 h à 12 h', 'Menuiserie Lauzon, préavis envoyé', 'calendar-check'], ['En cours', '—', 'Intervention dans le logement', 'wrench'], ['Terminée', '—', 'Fermeture confirmée avec vous', 'circle-check']];
const FAQ_IDS = ['l5', 'l4', 'l6', 'l7', 'l8', 'l9', 'l10', 'l1'];
const FL_NE = (t = 16) => <svg viewBox="0 0 24 24" width={t} height={t} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7M8 7h9v9" /></svg>;
const FL_E = (t = 16) => <svg viewBox="0 0 24 24" width={t} height={t} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const Fleche = ({
  lieu,
  t
}) => lieu === 'port' ? FL_NE(t) : FL_E(t);
const SR = ({
  children
}) => <span className="lv-sr">{children}</span>;
const Phase = () => <Badge ton="neutre" taille="s">Phase 2</Badge>;
const Ex = () => <Badge ton="alerte" taille="s">Exemple</Badge>;
const Fil = ({
  route,
  clair
}) => typeof FilAriane !== 'undefined' && route && route.fil ? <FilAriane fil={route.fil} clair={clair} /> : null;

/* Apparition une seule fois, quand l'élément entre dans la zone de défilement du site. */
function useVu(seuil = .18) {
  const ref = React.useRef(null),
    [vu, setVu] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window) || RMQ()) {
      setVu(true);
      return;
    }
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) {
        setVu(true);
        io.disconnect();
      }
    }, {
      root: scroller(),
      threshold: seuil,
      rootMargin: '0px 0px -6% 0px'
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, vu];
}
const defiler = (el, dec = 120) => {
  const s = scroller();
  if (!s || !el) return;
  s.scrollTo({
    top: el.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop - dec,
    behavior: RMQ() ? 'auto' : 'smooth'
  });
};

/* FAQ : boutons aria-expanded, réponses présentes dans le HTML (référencement), hauteur animée. */
function Faq({
  ids = FAQ_IDS,
  num,
  ouvert = 0
}) {
  const F = LL_FAQ,
    [o, setO] = React.useState(ouvert);
  return <div className={'lv-faq' + (num ? ' num' : '')}>{ids.filter(id => F[id]).map((id, i) => {
      const f = F[id],
        on = o === i,
        b = 'lv-fq-' + id,
        p = 'lv-fr-' + id;
      return <div key={id} className={'lv-fq' + (on ? ' on' : '')}>
      <h3 className="lv-fq-h"><button id={b} type="button" aria-expanded={on} aria-controls={p} onClick={() => setO(on ? -1 : i)}>
        {num && <span className="lv-fq-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>}<span className="lv-fq-q">{f.q}</span><span className="lv-fq-ic" aria-hidden="true"></span></button></h3>
      <div id={p} role="region" aria-labelledby={b} className="lv-fq-r"><div><p>{G(f.r)}</p></div></div></div>;
    })}</div>;
}
const CSS = `.lv{--e:cubic-bezier(.22,1,.36,1)}
.lv :focus-visible{outline:2px solid var(--bleu-500);outline-offset:3px}.lv .ll-sombre :focus-visible{outline-color:#B5D4F7}
.lv-cont{max-width:var(--web-conteneur);margin:0 auto;padding-left:var(--web-gouttiere);padding-right:var(--web-gouttiere);box-sizing:border-box}
.lv-h2 span{color:var(--bleu-600)}.ll-sombre .lv-h2{color:#fff}.ll-sombre .lv-h2 span{color:var(--bleu-300)}.ll-sombre .lv-p{color:var(--bleu-100)}
.lv-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.lv-r{opacity:0;transform:translateY(14px);transition:opacity .7s var(--e),transform .7s var(--e);transition-delay:var(--d,0ms)}.vu .lv-r,.lv-r.vu{opacity:1;transform:none}
.lv-in{animation:lv-in .8s var(--e) both;animation-delay:var(--d,0ms)}@keyframes lv-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes lv-onde{0%{opacity:.85;transform:scale(.92)}80%,100%{opacity:0;transform:scale(1.22)}}
.lv-h2{margin:0;font-size:var(--titre-l);line-height:1.2;letter-spacing:-.03em;font-weight:700;color:var(--marine-900);text-wrap:balance}
.lv-p{margin:0;font-size:14px;line-height:1.65;color:var(--gris-700);text-wrap:pretty}
.lv-lien{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0;border:0;background:none;cursor:pointer;white-space:nowrap;font:600 14px var(--police-corps);color:var(--bleu-600);text-decoration:none;transition:color .2s}.lv-lien:hover{color:var(--marine-900)}.lv-lien svg{transition:transform .3s var(--e)}.lv-lien:hover svg{transform:translateX(3px)}
.ll-sombre .lv-lien{color:#fff}.ll-sombre .lv-lien:hover{color:#B5D4F7}
.lv-faq{border-top:1px solid var(--bordure-fine)}.lv-fq{border-bottom:1px solid var(--bordure-fine)}.lv-fq-h{margin:0;font-size:inherit}
.lv-fq-h button{display:grid;grid-template-columns:minmax(0,1fr) 32px;align-items:center;gap:16px;width:100%;min-height:64px;padding:16px 0;border:0;background:none;cursor:pointer;text-align:left;font:600 15px/1.45 var(--police-corps);color:var(--marine-900);transition:color .2s}
.lv-faq.num .lv-fq-h button{grid-template-columns:32px minmax(0,1fr) 32px}.lv-fq-n{font-size:13px;font-weight:700;color:var(--bleu-600);font-variant-numeric:tabular-nums}
.lv-fq-h button:hover{color:var(--bleu-600)}
.lv-fq-ic{position:relative;width:32px;height:32px;box-sizing:border-box;border-radius:8px;border:1px solid var(--bordure);transition:background-color .3s,border-color .3s}
.lv-fq-ic::before,.lv-fq-ic::after{content:"";position:absolute;left:50%;top:50%;width:12px;height:2px;margin:-1px 0 0 -6px;border-radius:1px;background:var(--marine-900);transition:transform .4s var(--e),background-color .3s}.lv-fq-ic::after{transform:rotate(90deg)}
.lv-fq.on .lv-fq-ic{background:var(--marine-900);border-color:var(--marine-900)}.lv-fq.on .lv-fq-ic::before,.lv-fq.on .lv-fq-ic::after{background:#fff}.lv-fq.on .lv-fq-ic::after{transform:rotate(0deg)}
.lv-fq-r{display:grid;grid-template-rows:0fr;visibility:hidden;transition:grid-template-rows .45s var(--e),visibility 0s .45s}.lv-fq.on .lv-fq-r{grid-template-rows:1fr;visibility:visible;transition:grid-template-rows .45s var(--e),visibility 0s}
.lv-fq-r>div{overflow:hidden}.lv-fq-r p{margin:0;padding:0 48px 22px 0;font-size:14px;line-height:1.7;color:var(--gris-700);max-width:70ch;text-wrap:pretty}.lv-faq.num .lv-fq-r p{padding-left:48px}
.lv-bas{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:1100;display:flex;align-items:center;gap:4px;padding:6px 6px 6px 14px;border-radius:12px;background:var(--marine-900);box-shadow:0 16px 36px -12px rgba(12,33,71,.55)}
.lv-bas span{font-size:12px;font-weight:600;color:var(--bleu-100);margin-right:6px}.lv-bas button{height:40px;padding:0 14px;border:0;border-radius:8px;cursor:pointer;font:600 13px var(--police-corps);white-space:nowrap;background:transparent;color:#fff;transition:background-color .2s,color .2s}
.lv-bas button:hover{background:rgba(255,255,255,.1)}.lv-bas button[aria-pressed="true"]{background:#fff;color:var(--marine-900)}.lv-bas :focus-visible{outline:2px solid #B5D4F7;outline-offset:2px}
@media print{.lv .lv-r{opacity:1!important;transform:none!important}.lv-bas{display:none}}
@media (max-width:640px){.lv-fq-r p,.lv-faq.num .lv-fq-r p{padding:0 0 20px}.lv-bas{bottom:12px}.lv-bas span{display:none}}
@media (prefers-reduced-motion:reduce){.lv *,.lv *::before,.lv *::after{animation:none!important;transition:none!important}.lv .lv-r{opacity:1!important;transform:none!important}}`;

/* Bascule de revue, en bas au centre. Le choix est gardé dans le navigateur. */

/* Ancre interne (#urgence…) : défilement dans #ll-scroll sans toucher au routage par fragment. */
const interne = e => {
  const h = e.currentTarget.getAttribute('href');
  if (!h || h[0] !== '#' || h[1] === '/') return;
  const el = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById(h.slice(1)) : undefined;
  if (!el) return;
  e.preventDefault();
  defiler(el, 130);
  const f = el.querySelector('h2,h3') || el;
  f.setAttribute('tabindex', '-1');
  f.focus({
    preventScroll: true
  });
};
let LV3 = {
  SV,
  ST,
  FAQ_IDS,
  URG_TXT,
  URG_911,
  LEAD,
  interne,
  RMQ,
  scroller,
  cleo,
  port,
  tel,
  numero,
  G,
  hrefDe,
  FL_NE,
  FL_E,
  Fleche,
  SR,
  Phase,
  Ex,
  Fil,
  useVu,
  defiler,
  Faq
};
let __exp_PageLocatairesV3_0 = ({
  route
}) => <React.Fragment><style>{CSS}</style><LocatairesB route={route} /></React.Fragment>;
export { LV3, __exp_PageLocatairesV3_0 as PageLocatairesV3 };
