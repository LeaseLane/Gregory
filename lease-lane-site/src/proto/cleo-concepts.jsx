/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/cleo-concepts.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { useMorceauxTraduits } from '@/lib/i18n/contexte';
import { Icon } from '@/components/ds';
import { gab, FAQListe, FilAriane, MentionJuridique } from '@/proto/blocs';
import { LL_FAQ } from '@/proto/faq';
import { ouvrirCleo } from '@/proto/seo';
import { LL_TEL_URGENCE } from '@/proto/routes';
import { PBSommaire } from '@/proto/pages-proprio-b';
import { __ssr } from '@/lib/hydratation';
const uS = React.useState,
  uE = React.useEffect,
  uR = React.useRef;
const g = t => gab ? gab(t) : t;
const RMQ = () => !!(((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? matchMedia('(prefers-reduced-motion: reduce)').matches : undefined));
const SC = () => (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById('ll-scroll') : undefined;
const IMG = "/assets/img/",
  AV = IMG + 'cleo-avatar.png',
  DET = IMG + 'cleo/cleo-1024-detoure.png';
const F = id => LL_FAQ[id] || {
  q: '',
  r: ''
};
const ecrire = t => ouvrirCleo && ouvrirCleo(t);
const lireProfil = () => {
  try {
    const v = typeof sessionStorage !== "undefined" ? sessionStorage.getItem('ll-cleo-profil') : undefined;
    return ['proprio', 'locataire', 'prospect'].includes(v) ? v : null;
  } catch (e) {
    return null;
  }
};
const telUrg = () => LL_TEL_URGENCE();
/* « texte {mis en valeur} » → la partie entre accolades prend la couleur de marque */
const Em = ({
  t
}) => {
  const parties = String(t).split(/(\{[^}]+\})/).filter(x => x !== '');
  const traduits = useMorceauxTraduits(parties.map(x => x[0] === '{' ? x.slice(1, -1) : x));
  return parties.map((x, i) => x[0] === '{' ? <span key={i} className="cp-em">{traduits[i]}</span> : <React.Fragment key={i}>{traduits[i]}</React.Fragment>);
};

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
const Tete = ({
  id,
  lib,
  titre,
  intro,
  action,
  centre
}) => <Vu className={'cp-tete' + (centre ? ' cp-tete-c' : '')}><div className="cp-tete-g"><span className="cp-lib cp-r">{lib}</span><h2 id={id} className="cp-h2 cp-r" style={{
      '--d': '80ms'
    }}><Em t={titre} /></h2></div>
  {(intro || action) && <div className="cp-tete-d cp-r" style={{
    '--d': '160ms'
  }}>{intro && <p className="cp-p">{intro}</p>}{action}</div>}</Vu>;
const Statut = ({
  clair
}) => <span className={'cp-statut' + (clair ? ' c' : '')}><span className="cp-pouls" aria-hidden="true" />En ligne · répond 24/7</span>;
const Bouton = ({
  onClick,
  to,
  children,
  ic = 'arrow-right',
  v = 'p',
  type = 'button',
  avant
}) => {
  const c = 'cp-btn cp-btn-' + v + (avant ? ' cp-btn-av' : '');
  const fl = <span className="cp-btn-fl" aria-hidden="true"><Icon name={ic} size={16} color="currentColor" /></span>;
  const inner = avant ? <>{fl}{children}</> : <>{children}{fl}</>;
  return to ? <a href={to} className={c} onClick={onClick}>{inner}</a> : <button type={type} className={c} onClick={onClick}>{inner}</button>;
};

/* ——— Contenu (repris de la page actuelle et de la banque FAQ) ——— */
const QUI = [['clock', 'En tout temps', 'Jour, soir, fin de semaine et jours fériés : il répond 24/7, sans file d’attente.'], ['message-square', 'En français d’abord', 'Puis dans la langue de votre message, dont l’anglais. Un ton clair et calme, le vouvoiement par défaut.'], ['scale', 'Les deux côtés du bail', 'Propriétaire ou locataire : la même qualité de réponse, et le droit qui s’applique à chaque partie.'], ['files', 'Une FAQ validée', 'Une question posée 3 fois en 30 jours devient une réponse, approuvée par une personne avant sa publication.']];
const POUR = {
  locataire: ['Vos droits expliqués : hausse de loyer, reprise, cession, réparations, TAL', 'Urgences triées en 4 niveaux et transmises à la bonne personne', 'Un numéro de billet, puis un suivi 48 h après l’intervention', 'Visites et rendez-vous réservés, rappels 24 h et 2 h avant', 'Préavis de 24 h et plage de 9 h à 21 h respectés chez vous', 'Une alerte quand un logement correspond à vos critères'],
  proprio: ['Les règles du TAL appliquées à vos baux : avis, délais, fixation, recours', 'Rappel des fenêtres d’avis, 7 mois et 4 mois avant la fin du bail', 'Chaque demande attribuée à un responsable, avec un délai cible', 'Visites réservées et prospects relancés, au plus 3 fois', 'Relances de loyer factuelles et courtoises, entre 8 h et 21 h', 'Chaque échange résumé et consigné au dossier de l’immeuble']
};
const DONNEES = [['bot', 'Toujours identifié', 'Cléo se présente comme un agent IA dès le premier message et ne se fait jamais passer pour une personne.'], ['clock', 'Conservation limitée', 'Conversations et billets : durée du bail plus 3 ans. Candidats refusés : 90 jours. Prospects inactifs : 24 mois. Puis destruction sécurisée.'], ['user', 'Une personne décide', 'Aucune décision fondée uniquement sur un traitement automatisé : Cléo trie et propose, une personne décide.'], ['shield-check', 'Vos droits', 'Accès, rectification, retrait du consentement : Cléo ouvre une demande confidentielle, avec réponse sous 30 jours (Loi 25).']];

/* Questions servies par profil : propriétaire = siennes + TAL; locataire et futur locataire = questions locataires */

/* ——— Blocs communs ——— */

const FAQ = ({
  route,
  titre
}) => route.faq ? <FAQListe ids={route.faq} titre={titre || 'Les questions sur {Cléo}.'} /> : null;
const Ariane = ({
  route,
  clair
}) => route.fil ? <FilAriane fil={route.fil} clair={clair} /> : null;
const Mention = ({
  clair
}) => <MentionJuridique clair={clair} />;
function Donnees({
  liste
}) {
  return <Vu className={liste ? 'cp-don-l' : 'cp-don'}>{DONNEES.map(([ic, t, d], i) => <div key={t} className="cp-don-i cp-r" style={{
      '--d': i * 80 + 'ms'
    }}><span className="cp-ic" aria-hidden="true"><Icon name={ic} size={18} color="currentColor" /></span><span className="cp-don-tx"><h3 className="cp-h4">{t}</h3><p className="cp-p">{d}</p></span></div>)}</Vu>;
}
/* Relais humain : 4 étapes reliées; le trait se dessine à l'apparition */

const Coches = ({
  items,
  clair
}) => <ul className={'cp-coches' + (clair ? ' c' : '')}>{items.map(t => <li key={t}><span aria-hidden="true"><Icon name="check" size={14} color="currentColor" /></span>{g(t)}</li>)}</ul>;

/* ——— Formulaires (même apparence que les formulaires du site) ——— */
const Lib = ({
  id,
  children,
  req
}) => <span id={id} className="cp-lib-f">{children}{req && <span aria-hidden="true" className="cp-req"> *</span>}</span>;
const Err = ({
  id,
  children
}) => children ? <span id={id} className="cp-err" role="alert"><Icon name="triangle-alert" size={14} color="currentColor" />{children}</span> : null;
function Champ({
  id,
  lab,
  type = 'text',
  v,
  set,
  err,
  auto,
  ic,
  req,
  mode
}) {
  return <div><div className="fp-c" data-err={err ? 1 : 0} data-ok={v && !err ? 1 : 0} data-ic={ic ? 1 : 0}><input id={id} type={type} value={v} placeholder=" " autoComplete={auto} inputMode={mode} onChange={e => set(e.target.value)} aria-invalid={err ? 'true' : undefined} aria-describedby={err ? id + '-e' : undefined} aria-required={req || undefined} />
    <label htmlFor={id}>{lab}{req && <span aria-hidden="true" className="cp-req"> *</span>}</label>{ic && <span className="fp-ic" aria-hidden="true"><Icon name={ic} size={17} color="currentColor" /></span>}<span className="fp-ok" aria-hidden="true"><Icon name="circle-check" size={18} color="#1F7A52" /></span></div><Err id={id + '-e'}>{err}</Err></div>;
}
/* Choix en boutons radio : flèches pour se déplacer, la sélection suit le focus */
function Choix({
  id,
  lab,
  options,
  v,
  set,
  err,
  req,
  cartes
}) {
  const refs = uR([]);
  const cle = (e, i) => {
    const n = options.length;
    let j = null;
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) j = (i + 1) % n;else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) j = (i - 1 + n) % n;
    if (j === null) return;
    e.preventDefault();
    set(options[j][0]);
    refs.current[j] && refs.current[j].focus();
  };
  return <div role="radiogroup" aria-labelledby={id} aria-describedby={err ? id + '-e' : undefined} aria-required={req || undefined}><Lib id={id} req={req}>{lab}</Lib>
    <div className={cartes ? 'cp-cartes' : 'cp-segs'}>{options.map(([k, t, ic, d], i) => {
        const on = v === k;
        return <button key={k} ref={el => refs.current[i] = el} type="button" role="radio" aria-checked={on} tabIndex={on || !v && i === 0 ? 0 : -1} onKeyDown={e => cle(e, i)} onClick={() => set(k)} className={cartes ? 'cp-carte-c' : 'cp-seg'}>
      {ic && <span className="cp-ic" aria-hidden="true"><Icon name={ic} size={cartes ? 18 : 15} color="currentColor" /></span>}{cartes ? <span className="cp-carte-tx"><b>{t}</b>{d && <small>{d}</small>}</span> : t}{cartes && <span className="cp-coche" aria-hidden="true"><Icon name="check" size={13} color="#fff" /></span>}</button>;
      })}</div><Err id={id + '-e'}>{err}</Err></div>;
}
function Consentement({
  id,
  v,
  set,
  err,
  children
}) {
  return <div><label className="cp-case" data-err={err ? 1 : 0}><input id={id} type="checkbox" checked={v} onChange={e => set(e.target.checked)} aria-invalid={err ? 'true' : undefined} aria-describedby={err ? id + '-e' : undefined} /><span>{children}</span></label><Err id={id + '-e'}>{err}</Err></div>;
}
const courrielOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const focusPremiere = (errs, ordre) => {
  const k = ordre.find(x => errs[x]);
  if (!k) return;
  setTimeout(() => {
    const el = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById(k) : undefined;
    if (!el) return;
    const zone = el.matches('input,textarea,button') ? null : el.closest('[role=radiogroup]') || el.parentElement;
    const cible = zone ? zone.querySelector('[role=radio][tabindex="0"],input,textarea,button') : el;
    cible && cible.focus();
  }, 0);
};
function Succes({
  titre,
  children,
  actions
}) {
  const ref = uR(null);
  uE(() => {
    ref.current && ref.current.focus();
  }, []);
  return <div ref={ref} tabIndex={-1} role="status" className="cp-succes"><span className="cp-succes-ic" aria-hidden="true"><svg viewBox="0 0 52 52" width="52" height="52"><circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
    <h3 className="cp-h3">{titre}</h3><div className="cp-p">{children}</div>{actions && <div className="cp-actions">{actions}</div>}</div>;
}

/* Formulaire A · « Posez votre question » : profil, sujet, question, courriel facultatif, consentement */

/* Formulaire B · « Parler à une personne » : prénom, moyen de contact, moment, sujet, consentement */
function FormRappel() {
  const [n, setN] = uS(''),
    [m, setM] = uS('tel'),
    [t, setT] = uS(''),
    [c, setC] = uS(''),
    [mo, setMo] = uS(''),
    [q, setQ] = uS(''),
    [ok, setOk] = uS(false),
    [e, setE] = uS({}),
    [fait, setFait] = uS(false);
  const telOk = v => v.replace(/\D/g, '').length >= 10;
  const valider = () => ({
    'cpb-n': !n.trim() ? 'Indiquez votre prénom.' : '',
    ...(m === 'tel' ? {
      'cpb-t': !telOk(t) ? 'Indiquez un numéro à 10 chiffres.' : ''
    } : {
      'cpb-c': !courrielOk(c) ? 'Vérifiez le courriel, par exemple nom@exemple.ca.' : ''
    }),
    'cpb-mo': !mo ? 'Choisissez un moment.' : '',
    'cpb-ok': !ok ? 'Votre consentement est requis.' : ''
  });
  const envoyer = ev => {
    ev.preventDefault();
    const errs = Object.fromEntries(Object.entries(valider()).filter(([, v]) => v));
    setE(errs);
    if (Object.keys(errs).length) {
      focusPremiere(errs, ['cpb-n', 'cpb-t', 'cpb-c', 'cpb-mo', 'cpb-ok']);
      return;
    }
    setFait(true);
  };
  const MOM = [['matin', 'Matin', 'sun'], ['midi', 'Après-midi', 'clock'], ['soir', 'Soir', 'bell']];
  if (fait) return <Succes titre={'Merci ' + n.trim() + '. Une personne vous ' + (m === 'tel' ? 'rappelle.' : 'écrit.')}>
    Moment souhaité : <b>{(MOM.find(x => x[0] === mo) || [])[1]}</b>, en jour ouvrable. {m === 'tel' ? <>Au <b>{t}</b>.</> : <>À <b>{c}</b>.</>} Pour une urgence, n’attendez pas : <a href={telUrg()}>appelez la ligne de garde</a>.</Succes>;
  const nbr = Object.values(e).filter(Boolean).length;
  return <form className="cp-form cp-form-2" noValidate onSubmit={envoyer}>
    <p className="cp-aide cp-plein">Les champs marqués d’un <span className="cp-req">*</span> sont obligatoires.</p>
    {nbr > 0 && <p className="cp-resume cp-plein" role="alert">{nbr === 1 ? 'Un champ est à corriger.' : nbr + ' champs sont à corriger.'}</p>}
    <Champ id="cpb-n" lab="Prénom" ic="user" auto="given-name" req v={n} set={v => {
      setN(v);
      e['cpb-n'] && setE(x => ({
        ...x,
        'cpb-n': v.trim() ? '' : x['cpb-n']
      }));
    }} err={e['cpb-n']} />
    <Choix id="cpb-m" lab="Comment vous joindre?" req options={[['tel', 'Téléphone', 'phone'], ['courriel', 'Courriel', 'mail']]} v={m} set={v => {
      setM(v);
      setE(x => ({
        ...x,
        'cpb-t': '',
        'cpb-c': ''
      }));
    }} />
    <div key={m} className="cp-apparait">{m === 'tel' ? <Champ id="cpb-t" lab="Téléphone" type="tel" mode="tel" ic="phone" auto="tel" req v={t} set={v => {
        setT(v);
        e['cpb-t'] && setE(x => ({
          ...x,
          'cpb-t': telOk(v) ? '' : x['cpb-t']
        }));
      }} err={e['cpb-t']} /> : <Champ id="cpb-c" lab="Courriel" type="email" ic="mail" auto="email" req v={c} set={v => {
        setC(v);
        e['cpb-c'] && setE(x => ({
          ...x,
          'cpb-c': courrielOk(v) ? '' : x['cpb-c']
        }));
      }} err={e['cpb-c']} />}</div>
    <Choix id="cpb-mo" lab="Le meilleur moment" req options={MOM} v={mo} set={v => {
      setMo(v);
      setE(x => ({
        ...x,
        'cpb-mo': ''
      }));
    }} err={e['cpb-mo']} />
    <div className="cp-plein"><label htmlFor="cpb-q" className="cp-lib-f">En quelques mots (facultatif)</label><textarea id="cpb-q" className="fp-zone cp-zone-c" rows="2" maxLength={300} value={q} onChange={ev => setQ(ev.target.value)} placeholder="Ex. : Je veux comprendre l’avis de hausse que j’ai reçu." /></div>
    <div className="cp-plein"><Consentement id="cpb-ok" v={ok} set={v => {
        setOk(v);
        setE(x => ({
          ...x,
          'cpb-ok': v ? '' : x['cpb-ok']
        }));
      }} err={e['cpb-ok']}>J’accepte d’être joint par Lease Lane au sujet de cette demande. <span className="cp-req">*</span></Consentement></div>
    <div className="cp-form-pied cp-plein"><button type="submit" className="cp-btn cp-btn-p cp-btn-l">Demander un rappel<span className="cp-btn-fl" aria-hidden="true"><Icon name="phone" size={16} color="currentColor" /></span></button>
      <span className="cp-aide"><Icon name="clock" size={13} color="currentColor" /> Rappel en jour ouvrable. Pour une urgence : <a href={telUrg()}>ligne de garde 24/7</a>.</span></div>
  </form>;
}

/* ——— Conversation de démonstration (A) : trois scénarios joués automatiquement ——— */

/* ——— A · Conversation ——— */

/* ——— B · blocs refaits : TAL en deux temps, déclencheurs regroupés, limites par thème ——— */
const TAL_P = ['Avis de modification : fenêtres et délais', 'Hausse 2026 : taux de base de 3,1 % et outil du TAL', 'Loyer impayé : recours dès 3 semaines de retard', 'Reprise, éviction et moratoire de la Loi 65'];
const TAL_L = ['Accepter ou refuser une hausse, dans le mois', 'Reprise, éviction et protection des 65 ans et plus', 'Cession de bail et sous-location (Loi 31)', 'Réparations, urgences et accès au logement'];
const TAL_Q = {
  proprio: ['t5', 't7', 't6'],
  locataire: ['t2', 't3', 't4']
};
function TalSujets() {
  return <Vu className="cpb-tal">{[['Aux propriétaires', 'building-2', TAL_P], ['Aux locataires', 'key-round', TAL_L]].map(([t, ic, items], j) => <div key={t} className="cpb-tal-col cp-r" style={{
      '--d': j * 100 + 'ms'
    }}>
  <h3 className="cpb-tal-t"><span className="cp-ic" aria-hidden="true"><Icon name={ic} size={18} color="currentColor" /></span>{t}</h3>
  <ul>{items.map(x => <li key={x}><span aria-hidden="true"><Icon name="check" size={14} color="currentColor" /></span>{x}</li>)}</ul></div>)}
  <p className="cpb-tal-note cp-r" style={{
      '--d': '200ms'
    }}><span aria-hidden="true"><Icon name="refresh-cw" size={16} color="currentColor" /></span><span><b>Révisé à chaque changement publié par le TAL, date de révision affichée.</b> Taux de l’année, frais, formulaires et modèles officiels : la base est revue chaque janvier, chaque novembre et à chaque changement de loi.</span></p></Vu>;
}
function TalDemande() {
  const [p, setP] = uS(() => lireProfil() === 'proprio' ? 'proprio' : 'locataire'),
    [k, setK] = uS(0),
    ids = TAL_Q[p],
    f = F(ids[k]);
  const onglet = e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const o = p === 'proprio' ? 'locataire' : 'proprio';
    setP(o);
    setK(0);
    document.getElementById('cpb-tq-' + o).focus();
  };
  return <Vu className="cpb-dem cp-r">
    <div className="cpb-dem-tete"><img src={AV} alt="" width="40" height="40" /><span><b>Demandez à Cléo</b><small>Questions fréquentes</small></span>
      <div role="tablist" aria-label="Je suis" className="cp-onglets cpb-dem-tabs">{[['proprio', 'Propriétaire'], ['locataire', 'Locataire']].map(([kk, t]) => <button key={kk} id={'cpb-tq-' + kk} type="button" role="tab" aria-selected={p === kk} aria-controls="cpb-tq-pan" tabIndex={p === kk ? 0 : -1} onKeyDown={onglet} onClick={() => {
          setP(kk);
          setK(0);
        }}>{t}</button>)}</div></div>
    <div id="cpb-tq-pan" role="tabpanel" aria-labelledby={'cpb-tq-' + p} className="cpb-dem-corps">
      <ul className="cpb-dem-qs">{ids.map((id, j) => <li key={id}><button type="button" aria-pressed={j === k} onClick={() => setK(j)}><span>{F(id).q}</span><Icon name="chevron-right" size={16} color="currentColor" /></button></li>)}</ul>
      <div className="cpb-dem-d" aria-live="polite">
        <div key={p + k} className="cpb-dem-conv"><div className="cpa-cleo cpa-sans-av"><span>{g(f.r)}</span></div></div>
        <div className="cpb-dem-pied"><Mention /><button type="button" className="cp-lien" onClick={() => ecrire(f.q)}>Continuer avec Cléo<Icon name="arrow-right" size={14} color="currentColor" /></button></div>
      </div></div></Vu>;
}
const ETAPES_B = [['message-square', 'Vous écrivez', 'Jour et nuit, en français d’abord.'], ['triangle-alert', 'Cléo trie', 'Une urgence passe devant tout.'], ['file-text', 'Un billet est ouvert', 'Numéro, résumé et responsable.'], ['users', 'Une personne prend le relais', 'Elle reçoit tout l’échange.']];
const DECL_G = [['triangle-alert', 'Une urgence', 'Danger, chauffage, dégât d’eau.', 'u'], ['gavel', 'Un enjeu juridique', 'Litige, reprise, éviction, résiliation.'], ['users', 'Une personne en difficulté', 'Harcèlement, violence, détresse.'], ['message-circle', 'Votre demande', 'Vous voulez une personne, ou Cléo n’a pas la réponse.']];
function Etapes4() {
  return <Vu as="ol" className="cpb-etapes" seuil={.3}>{ETAPES_B.map(([ic, t, d], i) => <li key={t} style={{
      '--d': 150 + i * 140 + 'ms'
    }}>
  <span className="cpb-et-n" aria-hidden="true"><Icon name={ic} size={18} color="currentColor" /></span><span className="cpb-et-k">Étape {i + 1}</span><h3 className="cp-h4">{t}</h3><p className="cp-p">{d}</p></li>)}</Vu>;
}
function Declencheurs() {
  return <Vu className="cpb-cas cp-r" style={{
    '--d': '120ms'
  }}>
  <h3 className="cpb-cas-t">Transfert immédiat dans 4 cas</h3>
  <ul>{DECL_G.map(([ic, t, d, u]) => <li key={t}><span className={'cp-ic' + (u ? ' u' : '')} aria-hidden="true"><Icon name={ic} size={18} color="currentColor" /></span><b>{t}</b><small>{d}</small></li>)}</ul>
  <p className="cpb-cas-pied"><span className="cpb-decl2-pt" aria-hidden="true" /><span>Un agent vous contacte très rapidement.</span></p>
</Vu>;
}
const LIM_B = [['gavel', 'Aucun avis juridique', 'De l’information générale, jamais de pronostic.'], ['file-text', 'Aucun avis rédigé seul', 'Le modèle officiel du TAL, validé par une personne.'], ['triangle-alert', 'Aucune pratique illégale', 'Il le dit et propose l’option légale.'], ['users', 'Aucune décision qui vous lie', 'Candidat, dépôt, résiliation : une personne décide.'], ['calendar', 'Aucune promesse non confirmée', 'Ni date, ni montant sans confirmation.'], ['wallet', 'Aucun paiement', 'Il n’encaisse rien et ne négocie pas.'], ['banknote', 'Aucun conseil financier', 'Ni fiscal, ni hypothécaire, ni assurance.'], ['lock', 'Aucun renseignement sensible', 'Ni NAS, ni carte, ni santé.'], ['map-pin', 'Québec seulement', 'Ailleurs, il vous dirige vers votre province.']];
function LimitesB() {
  return <Vu className="cpb-lim cp-r"><ul>{LIM_B.map(([ic, t, d]) => <li key={t}><span className="cp-ic" aria-hidden="true"><Icon name={ic} size={17} color="currentColor" /></span><span><b>{t}</b><small>{d}</small></span></li>)}</ul>
  <p className="cpb-lim-note"><span aria-hidden="true"><Icon name="info" size={16} color="currentColor" /></span>Au besoin, il vous oriente vers le TAL, Éducaloi, un comité logement, une association de propriétaires, un avocat ou un notaire.</p></Vu>;
}

/* ——— B · Parcours ——— */
const CHAP = [['cpb-c1', 'Qui est Cléo'], ['cpb-c2', 'Ce qu’il fait'], ['cpb-c3', 'Le TAL expliqué'], ['cpb-c4', 'L’humain'], ['cpb-c5', 'Les limites'], ['cpb-c6', 'Vos données'], ['cpb-c7', 'Nos experts']];
const ORB = [['clock', '24/7'], ['message-square', 'FR · EN'], ['scale', 'TAL'], ['triangle-alert', 'Urgences'], ['calendar-check', 'Visites'], ['file-text', 'Suivi']];
/* Chapitre actif et avancement dans ce chapitre : même calcul que PBChapitres (pages-proprio-b.jsx) */
function usePosition(ids) {
  const [pos, setPos] = uS({
    ai: 0,
    frac: 0
  });
  uE(() => {
    const sc = SC();
    if (!sc) return;
    const f = () => {
      const h = sc.getBoundingClientRect().top + 180;
      let ai = 0,
        frac = 0;
      ids.forEach((id, i) => {
        const el = (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.getElementById(id) : undefined;
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top <= h) {
          ai = i;
          frac = Math.max(0, Math.min(1, (h - r.top) / Math.max(1, r.height)));
        }
      });
      setPos(p => p.ai === ai && Math.abs(p.frac - frac) < .005 ? p : {
        ai,
        frac
      });
    };
    f();
    sc.addEventListener('scroll', f, {
      passive: true
    });
    return () => sc.removeEventListener('scroll', f);
  }, []);
  return pos;
}
function CleoB({
  route
}) {
  const pos = usePosition(CHAP.map(c => c[0])),
    actif = CHAP[pos.ai][0],
    ix = pos.ai;
  return <>
    <section className="cp-hero cpb-hero" aria-labelledby="cpb-h1"><div className="cp-in cpb-hero-g">
      <div className="cp-r1"><Ariane route={route} /></div>
      <div className="cpb-orbite cp-r1" style={{
          '--d': '80ms'
        }}>
        <div className="cpb-anneau" aria-hidden="true" /><div className="cpb-anneau cpb-anneau2" aria-hidden="true" />
        <div className="cpb-rond"><img src={DET} alt="Cléo, l’agent IA de Lease Lane" width="1024" height="1024" /></div>
        <ul className="cpb-orb" aria-hidden="true">{ORB.map(([ic, t], i) => <li key={t} style={{
              '--a': i * 60 - 90 + 'deg'
            }}><span><Icon name={ic} size={14} color="currentColor" />{t}</span></li>)}</ul>
        <ul className="cp-sr">{ORB.map(([, t]) => <li key={t}>{t}</li>)}</ul>
      </div>
      <Statut clair />
      <h1 id="cpb-h1" className="cp-h1 cp-r1" style={{
          '--d': '160ms'
        }}><Em t="Cléo, l’agent conversationnel de {gestion immobilière} qui vous explique {le TAL}." /></h1>
      <p className="cp-lead cp-r1" style={{
          '--d': '240ms'
        }}>Un agent IA formé au droit du logement du Québec. Il répond 24/7 aux propriétaires, aux locataires et aux visiteurs, et passe la main à une personne dès qu’un dossier le demande.</p>
      <div className="cp-actions cp-r1" style={{
          '--d': '320ms'
        }}><Bouton ic="message-circle" onClick={() => ecrire()}>Écrire à Cléo</Bouton><Bouton v="s" ic="chevron-down" onClick={() => allerA('cpb-c1')}>Découvrir Cléo en 7 chapitres</Bouton></div>
    </div></section>
    <div className="cpb-corps cp-in">
      <nav aria-label="Sommaire de la page" className="cpb-sommaire">{<PBSommaire v="3" chapitres={CHAP.map(([id, t]) => ({
          id,
          t
        }))} ai={pos.ai} frac={pos.frac} aller={allerA} />}</nav>
      <div className="cpb-chapitres">
        <section id="cpb-c1" aria-labelledby="cpb-t1" className="cpb-ch"><Tete id="cpb-t1" lib="01 · Qui est Cléo" titre="Un {agent IA} formé au droit du logement du Québec." />
          <Vu className="cpb-qui">{QUI.map(([ic, t, d], i) => <div key={t} className="cpb-qui-i cp-r" style={{
              '--d': i * 80 + 'ms'
            }}><span className="cp-ic" aria-hidden="true"><Icon name={ic} size={18} color="currentColor" /></span><span className="cpb-qui-tx"><h3 className="cp-h4">{t}</h3><p className="cp-p">{d}</p></span></div>)}</Vu></section>
        <section id="cpb-c2" aria-labelledby="cpb-t2" className="cpb-ch"><Tete id="cpb-t2" lib="02 · Pour vous" titre="Ce qu’il fait, {des deux côtés du bail}." />
          <Vu className="cpb-deux">{[['locataire', 'Pour les locataires', 'key-round'], ['proprio', 'Pour les propriétaires', 'building-2']].map(([k, t, ic], i) => <div key={k} className={'cpb-deux-i cp-r' + (k === 'proprio' ? ' ll-sombre cpb-marine' : '')} style={{
              '--d': i * 120 + 'ms'
            }}><div className="cpb-deux-t"><span className="cp-ic" aria-hidden="true"><Icon name={ic} size={18} color="currentColor" /></span><h3 className="cp-h3">{t}</h3></div><Coches items={POUR[k]} clair={k === 'proprio'} /></div>)}</Vu></section>
        <section id="cpb-c3" aria-labelledby="cpb-t3" className="cpb-ch"><Tete id="cpb-t3" lib="03 · Le TAL expliqué" titre="Les règles du {Tribunal administratif du logement}, expliquées." intro="Code civil, procédures, délais et frais : chaque réponse suit le même ordre. La situation, la règle et sa source, les options de chaque partie, la prochaine étape." />
          <TalSujets /><TalDemande /></section>
        <section id="cpb-c4" aria-labelledby="cpb-t4" className="cpb-ch"><Tete id="cpb-t4" lib="04 · L’humain" titre="Quand une personne {prend le relais}." intro="Cléo annonce chaque transfert : à qui, pourquoi, dans quel délai." />
          <div className="cpb-rel4"><Etapes4 /><Declencheurs /></div></section>
        <section id="cpb-c5" aria-labelledby="cpb-t5" className="cpb-ch"><Tete id="cpb-t5" lib="05 · Les limites" titre="Ce que Cléo {ne fait pas}." intro="Quand une limite s’applique, Cléo le dit et vous oriente." /><LimitesB /></section>
        <section id="cpb-c6" aria-labelledby="cpb-t6" className="cpb-ch"><Tete id="cpb-t6" lib="06 · Vos données" titre="Ce que Cléo fait de {vos renseignements}." action={<a href="/confidentialite" className="cp-lien">Politique de confidentialité<Icon name="arrow-right" size={14} color="currentColor" /></a>} /><Donnees liste /></section>
        <section id="cpb-c7" aria-labelledby="cpb-t7" className="cpb-ch"><Tete id="cpb-t7" lib="07 · Nos experts" titre="Vous préférez {une personne}?" intro="Laissez vos coordonnées : un membre de l’équipe vous joint au moment choisi. Cléo lui transmet le contexte." />
          <Vu className="cpb-f cp-r"><FormRappel /></Vu></section>
      </div>
    </div>
    <FAQ route={route} />
  </>;
}

/* ——— C · Centre d'aide ——— */

/* ——— D · Vitrine ——— */

/* ——— Styles ——— */
const CSS = `.cp{--e:cubic-bezier(.22,1,.36,1);--fin:1px solid rgba(12,33,71,.16);font-family:var(--police-corps)}
.cp *,.cp *::before,.cp *::after{box-sizing:border-box}
.cp :focus-visible{outline:2px solid var(--bleu-500);outline-offset:3px}.cp .ll-sombre :focus-visible{outline-color:#fff}
.cp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
:where(.cp) :is(h1,h2,h3,p,figure){margin:0}:where(.cp) :is(ul,ol){list-style:none;margin:0;padding:0}
.cp-s{position:relative;padding:var(--web-section) 0;background:#fff}.cp-s.d{background:var(--surface-douce)}
.cp-in{max-width:var(--web-conteneur);margin:0 auto;padding:0 var(--web-gouttiere);display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(36px,4.4vw,56px)}
.cp-lib{display:block;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--bleu-600)}.ll-sombre .cp-lib{color:var(--bleu-300)}
.cp-h1{font-size:var(--titre-xl);line-height:1.1;font-weight:700;letter-spacing:-.03em;color:var(--marine-900);text-wrap:balance}.ll-sombre .cp-h1{color:#fff}
.cp-h2{font-size:var(--titre-l);line-height:1.18;font-weight:700;letter-spacing:-.025em;color:var(--marine-900);max-width:22ch;text-wrap:balance}.ll-sombre .cp-h2{color:#fff}
.cp-h3{font-size:20px;line-height:1.3;font-weight:700;letter-spacing:-.015em;color:var(--marine-900)}.ll-sombre .cp-h3{color:#fff}
.cp-h4{font-size:16px;line-height:1.35;font-weight:700;letter-spacing:-.01em;color:var(--marine-900)}.ll-sombre .cp-h4{color:#fff}
.cp-em{color:var(--bleu-600)}.ll-sombre .cp-em{color:var(--bleu-300)}
.cp-p{font-size:14px;line-height:1.7;color:var(--texte-corps);text-wrap:pretty}.ll-sombre .cp-p{color:var(--bleu-100)}
.cp-lead{font-size:14px;line-height:1.75;color:var(--texte-corps);max-width:58ch}.ll-sombre .cp-lead{color:var(--bleu-100)}
.cp-ic{flex:none;width:40px;height:40px;border-radius:11px;background:var(--bleu-025);color:var(--bleu-600);display:grid;place-items:center}.ll-sombre .cp-ic{background:rgba(255,255,255,.1);color:#fff}
/* En-têtes de section */
.cp-tete{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:20px 64px}.cp-tete-g{display:grid;gap:14px}.cp-tete-d{display:grid;gap:16px;max-width:440px;justify-items:start}
.cp-tete-c{justify-content:center;text-align:center}.cp-tete-c .cp-tete-g{justify-items:center}
/* Apparitions */
@keyframes cp-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.cp-r{opacity:0;transform:translateY(20px);transition:opacity .8s var(--e),transform .8s var(--e);transition-delay:var(--d,0ms)}.vu .cp-r,.cp-r.vu{opacity:1;transform:none}
.cp-r1{animation:cp-up .8s var(--e) both;animation-delay:var(--d,0ms)}
.cp-apparait{animation:cp-up .45s var(--e) both}
/* Pastilles, statut, liens, boutons */
.cp-statut{display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 12px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);font-size:12px;font-weight:600;color:#fff;white-space:nowrap;justify-self:start}
.cp-statut.c{background:var(--bleu-025);border-color:var(--bleu-050);color:var(--marine-900)}
.cp-pouls{position:relative;width:8px;height:8px;flex:none;border-radius:50%;background:#3FB37F}.cp-pouls::after{content:'';position:absolute;inset:0;border-radius:50%;background:#3FB37F;animation:cp-pouls 1.8s ease-out infinite}
@keyframes cp-pouls{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.8);opacity:0}}
.cp-pastille{display:inline-flex;align-items:center;gap:10px;justify-self:start;height:32px;padding:0 14px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#fff}
.cp-lien{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0;border:0;background:none;font:600 14px var(--police-corps);color:var(--marine-900);text-decoration:none;cursor:pointer}.cp-lien svg{transition:transform .3s var(--e)}.cp-lien:hover{text-decoration:underline;text-underline-offset:4px}.cp-lien:hover svg{transform:translateX(3px)}.ll-sombre .cp-lien{color:#fff}
.cp-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.cp-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:52px;padding:0 20px 0 22px;border-radius:12px;border:1px solid transparent;font:600 14px var(--police-corps);text-decoration:none;cursor:pointer;white-space:nowrap;transition:background-color .2s,color .2s,border-color .2s,transform .2s var(--e)}
.cp-btn:active{transform:scale(.98)}.cp-btn-fl{display:grid;transition:transform .3s var(--e)}.cp-btn:hover .cp-btn-fl{transform:translateX(3px)}.cp-btn-av{padding:0 22px 0 18px}.cp-btn-av:hover .cp-btn-fl{transform:translateX(-3px)}
.cp-btn-p{background:var(--marine-900);color:#fff}.cp-btn-p:hover{background:var(--bleu-600)}
.cp-btn-s{background:#fff;color:var(--marine-900);border-color:rgba(12,33,71,.2)}.cp-btn-s:hover{border-color:var(--marine-900);background:var(--bleu-025)}
.cp-btn-i{background:#fff;color:var(--marine-900)}.cp-btn-i:hover{background:var(--bleu-025)}
.cp-btn-ci{background:transparent;color:#fff;border-color:rgba(255,255,255,.4)}.cp-btn-ci:hover{background:rgba(255,255,255,.1);border-color:#fff}
.cp-btn-u{background:var(--urgence-500);color:#fff}.cp-btn-u:hover{background:var(--urgence-600)}
.cp-btn-l{height:56px;padding:0 24px 0 26px}
/* Coches */
.cp-coches{display:grid;gap:12px}.cp-coches li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:12px;align-items:start;font-size:14px;line-height:1.55;color:var(--texte-corps)}
.cp-coches li>span{width:22px;height:22px;margin-top:1px;border-radius:50%;background:var(--bleu-025);color:var(--bleu-600);display:grid;place-items:center}
.cp-coches.c li{color:#fff}.cp-coches.c li>span{background:rgba(255,255,255,.12);color:#fff}.cp-coches.c li>span svg{color:#fff!important;stroke:#fff}
/* Données */
.cp-don{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.cp-don-i{display:grid;gap:14px;align-content:start;padding:24px;border-radius:20px;border:var(--fin);background:#fff;transition:transform .35s var(--e),box-shadow .35s var(--e)}.cp-don-i:hover{transform:translateY(-3px);box-shadow:0 18px 40px rgba(12,33,71,.08)}
.cp-don-tx{display:grid;gap:6px}
.cp-don-l{display:grid;border-top:var(--fin)}.cp-don-l .cp-don-i{grid-template-columns:40px minmax(0,1fr);gap:16px;padding:18px 0;border:0;border-bottom:1px solid var(--bordure-fine);border-radius:0;background:transparent}.cp-don-l .cp-don-i:hover{transform:none;box-shadow:none}
/* Relais : étapes reliées */
.cp-rel{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;counter-reset:e}
.cp-rel::before{content:'';position:absolute;left:24px;right:calc(25% - 36px);top:24px;height:2px;background:var(--bleu-050)}
.cp-rel::after{content:'';position:absolute;left:24px;right:calc(25% - 36px);top:24px;height:2px;background:var(--marine-900);transform:scaleX(0);transform-origin:0 50%;transition:transform 1.4s var(--e) .2s}.cp-rel.vu::after{transform:none}
.cp-rel-e{position:relative;display:grid;gap:16px;align-content:start;opacity:0;transform:translateY(16px);transition:opacity .7s var(--e),transform .7s var(--e);transition-delay:var(--d)}.vu>.cp-rel-e{opacity:1;transform:none}
.cp-rel-n{position:relative;z-index:1;width:48px;height:48px;border-radius:14px;background:var(--marine-900);color:#fff;display:grid;place-items:center;box-shadow:0 0 0 6px #fff}.cp-s.d .cp-rel-n{box-shadow:0 0 0 6px var(--surface-douce)}
.cp-rel-tx{display:grid;gap:6px;padding-right:12px}.cp-rel-k{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--bleu-600)}
.cp-rel-v{grid-template-columns:minmax(0,1fr);gap:0}.cp-rel-v::before,.cp-rel-v::after{left:23px;right:auto;top:24px;bottom:24px;width:2px;height:auto}.cp-rel-v::after{transform:scaleY(0);transform-origin:50% 0}.cp-rel-v.vu::after{transform:none}
.cp-rel-v .cp-rel-e{grid-template-columns:48px minmax(0,1fr);gap:18px;padding-bottom:24px}
/* Formulaires */
.cp-form{display:grid;gap:22px}
.cp-lib-f{display:block;margin-bottom:10px;font-size:13px;font-weight:650;color:var(--marine-900)}.cp-req{color:var(--bleu-500)}
.cp-aide{display:block;font-size:12.5px;line-height:1.5;color:var(--gris-600)}.cp .cp-aide>svg{display:inline-block!important;vertical-align:-2px;margin-right:4px}
.cp-err{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:13px;font-weight:500;color:#C23B32}
.cp-resume{padding:12px 16px;border-radius:12px;background:#FFF4F3;border:1px solid rgba(194,59,50,.3);font-size:14px;font-weight:600;color:#A3312A}
.cp-segs{display:flex;flex-wrap:wrap;gap:8px}
.cp-seg{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 16px;border-radius:10px;border:1px solid rgba(12,33,71,.18);background:#fff;color:var(--marine-900);font:550 14px var(--police-corps);cursor:pointer;transition:background-color .2s,border-color .2s,color .2s}
.cp-seg .cp-ic{width:auto;height:auto;background:none;color:inherit}
.cp-seg:hover{border-color:var(--marine-900)}.cp-seg[aria-checked="true"]{background:var(--marine-900);border-color:var(--marine-900);color:#fff}
.cp-cartes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.cp-carte-c{position:relative;display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:12px;min-height:72px;padding:14px 30px 14px 14px;border-radius:14px;border:1px solid rgba(12,33,71,.18);background:#fff;text-align:left;cursor:pointer;font-family:var(--police-corps);transition:border-color .2s,box-shadow .2s,transform .25s var(--e)}
.cp-carte-c:hover{border-color:var(--marine-900);transform:translateY(-1px)}
.cp-carte-c[aria-checked="true"],.cp-carte-c[aria-pressed="true"]{border-color:var(--marine-900);box-shadow:0 0 0 3px rgba(69,129,203,.22)}
.cp-carte-c[aria-checked="true"] .cp-ic{background:var(--marine-900);color:#fff}
.cp-carte-tx{display:grid;gap:2px;min-width:0}.cp-carte-tx b{font-size:14px;font-weight:700;color:var(--marine-900)}.cp-carte-tx small{font-size:12.5px;color:var(--gris-600)}
.cp-coche{position:absolute;top:8px;right:8px;width:20px;height:20px;border-radius:50%;background:var(--marine-900);display:grid;place-items:center;opacity:0;transform:scale(.4);transition:opacity .2s,transform .35s cubic-bezier(.34,1.56,.64,1)}.cp-carte-c[aria-checked="true"] .cp-coche{opacity:1;transform:none}
.cp .fp-zone{background:#F7F9FB;border-color:rgba(12,33,71,.14)}.cp .fp-zone:hover{background:#fff;border-color:rgba(12,33,71,.36)}.cp .fp-zone:focus{background:#fff;border-color:var(--marine-900);box-shadow:0 0 0 4px rgba(69,129,203,.18)}.cp .fp-zone[aria-invalid="true"]{border-color:#C23B32;background:#FFF8F7}
.cp-sous-champ{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.cp-compte{margin-top:8px;margin-left:auto;font-size:12px;color:var(--gris-600);font-variant-numeric:tabular-nums}
.cp-case{display:grid;grid-template-columns:22px minmax(0,1fr);gap:12px;align-items:start;padding:14px 16px;border-radius:12px;border:1px solid rgba(12,33,71,.14);background:#F7F9FB;font-size:13.5px;line-height:1.55;color:var(--texte-corps);cursor:pointer;transition:border-color .2s,background-color .2s}
.cp-case:hover{border-color:rgba(12,33,71,.36);background:#fff}.cp-case[data-err="1"]{border-color:#C23B32;background:#FFF8F7}
.cp-case input{width:20px;height:20px;margin:1px 0 0;accent-color:var(--marine-900);cursor:pointer}.cp-case a{color:var(--marine-900);font-weight:600}
.cp-form-pied{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;padding-top:4px}
.cp-succes{display:grid;justify-items:start;gap:14px;padding:8px 0;outline:none}.cp-succes .cp-p b{color:var(--marine-900)}.cp-succes a{color:var(--marine-900);font-weight:600}
.cp-succes-ic{color:var(--succes-500)}.cp-succes-ic circle{stroke-dasharray:151;stroke-dashoffset:151;animation:cp-trait .7s var(--e) forwards}.cp-succes-ic path{stroke-dasharray:40;stroke-dashoffset:40;animation:cp-trait .45s var(--e) .55s forwards}
@keyframes cp-trait{to{stroke-dashoffset:0}}
/* Onglets */
.cp-onglets{display:inline-grid;grid-auto-flow:column;gap:4px;padding:4px;border-radius:14px;background:var(--bleu-025);border:1px solid var(--bleu-050);justify-self:start}
.cp-onglets button{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px;border:0;border-radius:10px;background:transparent;font:600 14px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:background-color .25s,color .25s}
.cp-onglets button:hover{background:#fff}.cp-onglets button[aria-selected="true"]{background:var(--marine-900);color:#fff}
/* Héros communs */
.cp-hero{position:relative;isolation:isolate;overflow:hidden}
/* ——— A ——— */
.cpa-hero{background:linear-gradient(160deg,#0C2147 0%,#122744 55%,#1C3053 100%);padding:clamp(32px,4vw,56px) 0 0}
.cpa-halo{position:absolute;right:-10%;top:-20%;width:60%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(69,129,203,.35) 0%,rgba(12,33,71,0) 65%);z-index:-1;animation:cpa-respire 8s ease-in-out infinite}
@keyframes cpa-respire{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.08);opacity:1}}
.cpa-hero-g{grid-template-columns:minmax(0,6fr) minmax(0,5fr);align-items:center;gap:clamp(32px,5vw,72px)}
.cpa-hero-tx{display:grid;gap:22px;justify-items:start;padding-bottom:clamp(24px,3vw,40px)}
.cpa-chat{display:grid;grid-template-rows:auto minmax(0,1fr) auto;height:480px;border-radius:24px;background:#fff;box-shadow:0 40px 80px -30px rgba(2,8,18,.7);overflow:hidden}
.cpa-chat-t{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--bordure-fine)}.cpa-chat-t img{width:40px;height:40px;border-radius:50%;object-fit:cover}.cpa-chat-t>span:not(.cp-statut){display:grid;margin-right:auto}.cpa-chat-t b{font-size:15px;color:var(--marine-900)}.cpa-chat-t small{font-size:12px;color:var(--gris-600)}
.cpa-fil{display:flex;flex-direction:column;gap:12px;padding:18px 16px;overflow-y:auto;background:var(--bleu-025);scroll-behavior:smooth}
.cpa-moi{align-self:flex-end;max-width:84%;padding:11px 15px;border-radius:16px 16px 4px 16px;background:var(--marine-900);color:#fff;font-size:14px;line-height:1.5;font-weight:500;animation:cp-up .4s var(--e) both}
.cpa-cleo{display:grid;grid-template-columns:28px minmax(0,1fr);gap:10px;align-items:end;max-width:92%;animation:cp-up .4s var(--e) both}.cpa-cleo img{width:28px;height:28px;border-radius:50%;object-fit:cover}
.cpa-cleo>span{padding:11px 15px;border-radius:16px 16px 16px 4px;background:#fff;border:1px solid var(--bordure-fine);font-size:14px;line-height:1.55;color:var(--gris-800)}
.cpa-ecrit{display:inline-flex!important;gap:5px;align-items:center;height:42px;justify-self:start}.cpa-ecrit i{width:7px;height:7px;border-radius:50%;background:var(--gris-500);animation:cpa-point 1.1s ease-in-out infinite}
@keyframes cpa-point{0%,80%,100%{opacity:.25}40%{opacity:1}}
.cpa-humain{display:grid;grid-template-columns:36px minmax(0,1fr);gap:12px;align-items:center;padding:12px 14px;border-radius:14px;background:#fff;border:1px solid var(--succes-500);box-shadow:0 0 0 3px rgba(23,121,94,.12);font-size:14px;color:var(--marine-900);animation:cp-up .45s var(--e) both}
.cpa-humain small{display:block;font-size:12.5px;color:var(--gris-700)}.cpa-hum-av{width:36px;height:36px;border-radius:50%;background:var(--succes-500);color:#fff;display:grid;place-items:center}
.cpa-note{display:flex;align-items:center;gap:8px;padding-left:38px;font-size:12.5px;color:var(--gris-600);animation:cp-up .4s var(--e) both}
.cpa-plages{display:grid;gap:8px;padding-left:38px;animation:cp-up .4s var(--e) both}.cpa-pl-t{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--gris-700)}
.cpa-plages div{display:flex;flex-wrap:wrap;gap:6px}.cpa-plages button{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 12px;border-radius:10px;border:1px solid rgba(12,33,71,.18);background:#fff;font:600 13px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:background-color .2s,border-color .2s}.cpa-plages button:hover{border-color:var(--marine-900);background:var(--bleu-025)}
.cpa-chat-b{display:grid;gap:8px;padding:12px 14px 14px;border-top:1px solid var(--bordure-fine)}.cpa-essai{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--gris-600)}
.cpa-chat-b div{display:flex;flex-wrap:wrap;gap:6px}.cpa-chat-b button{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 12px;border-radius:10px;border:1px solid rgba(12,33,71,.16);background:#fff;font:600 13px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:background-color .2s,border-color .2s,color .2s}
.cpa-chat-b button:hover{border-color:var(--marine-900)}.cpa-chat-b button[aria-pressed="true"]{background:var(--marine-900);border-color:var(--marine-900);color:#fff}
.cpa-faits{grid-template-columns:repeat(4,minmax(0,1fr));gap:0;margin-top:clamp(32px,4vw,48px);border-top:1px solid rgba(255,255,255,.14)}
.cpa-faits li{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto auto;column-gap:14px;align-items:center;padding:22px 20px 26px 0}.cpa-faits li+li{padding-left:20px;border-left:1px solid rgba(255,255,255,.14)}
.cpa-faits li>span{grid-row:1/span 2;width:40px;height:40px;border-radius:11px;background:rgba(255,255,255,.1);color:#fff;display:grid;place-items:center}
.cpa-faits b{font-size:22px;font-weight:700;letter-spacing:-.02em;color:#fff}.cpa-faits small{font-size:13px;color:var(--bleu-100)}
.cpa-pour{display:grid;gap:24px}
.cpa-pan{display:grid;grid-template-columns:minmax(0,6fr) minmax(0,5fr);gap:clamp(24px,4vw,56px);align-items:start;padding:clamp(24px,3vw,40px);border-radius:24px;border:var(--fin);animation:cp-up .5s var(--e) both}
.cpa-rep{display:grid;gap:14px;padding:24px;border-radius:20px;background:var(--bleu-025)}.cpa-rep-q{justify-self:end;max-width:90%;padding:11px 15px;border-radius:16px 16px 4px 16px;background:var(--marine-900);color:#fff;font-size:14px;font-weight:500;line-height:1.5}
.cpa-rep-r{display:grid;grid-template-columns:32px minmax(0,1fr);gap:10px;align-items:end}.cpa-rep-r img{width:32px;height:32px;border-radius:50%}.cpa-rep-r p{padding:12px 16px;border-radius:16px 16px 16px 4px;background:#fff;border:1px solid var(--bordure-fine);font-size:14px;line-height:1.6;color:var(--gris-800)}
.cpa-decl{display:grid;gap:18px;padding:clamp(24px,3vw,36px);border-radius:24px;border:var(--fin)}.cpa-decl .cp-coches{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:40px}
.cpa-form-g{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(32px,5vw,80px);align-items:start}
.cpa-form-tx{display:grid;gap:18px;position:sticky;top:120px}
.cpa-voies{display:grid;gap:10px;margin-top:8px}.cpa-voies a{display:grid;grid-template-columns:40px minmax(0,1fr);gap:14px;align-items:center;min-height:64px;padding:12px 16px 12px 12px;border-radius:14px;border:var(--fin);background:#fff;text-decoration:none;transition:border-color .2s,transform .3s var(--e)}.cpa-voies a:hover{border-color:var(--marine-900);transform:translateX(4px)}
.cpa-voies a>span:first-child{width:40px;height:40px;border-radius:11px;background:var(--bleu-025);color:var(--bleu-600);display:grid;place-items:center}.cpa-voies a>span.u{background:var(--urgence-500);color:#fff}
.cpa-voies a>span:last-child{display:grid}.cpa-voies b{font-size:14px;color:var(--marine-900)}.cpa-voies small{font-size:13px;color:var(--gris-700)}
.cpa-form-c{padding:clamp(24px,3.4vw,44px);border-radius:24px;background:#fff;border:var(--fin);box-shadow:0 30px 60px -40px rgba(12,33,71,.35)}
/* ——— B ——— */
.cpb-hero{background:radial-gradient(50% 60% at 50% 30%,rgba(145,181,224,.35) 0%,rgba(236,242,249,0) 70%),linear-gradient(180deg,var(--bleu-025) 0%,#fff 100%);padding:clamp(28px,3.4vw,44px) 0 clamp(56px,6vw,88px);text-align:center}
.cpb-hero-g{justify-items:center;gap:20px}.cpb-hero-g>.cp-r1:first-child{justify-self:start}
.cpb-hero .cp-h1{max-width:24ch;font-size:calc(var(--titre-xl) * 1.15);line-height:1.26}.cpb-hero .cp-statut{justify-self:center;margin-top:8px}.cpb-hero .cp-lead{text-align:center}
.cpb-orbite{position:relative;width:min(330px,80vw);aspect-ratio:1;display:grid;place-items:center;margin:4px 0}
.cpb-anneau{position:absolute;inset:6%;border-radius:50%;border:1px dashed rgba(12,33,71,.22);animation:cpb-tour 80s linear infinite}.cpb-anneau2{inset:20%;border-style:solid;border-color:rgba(69,129,203,.25);animation-direction:reverse;animation-duration:60s}
.cpb-rond{position:relative;width:54%;aspect-ratio:1;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#4F7FBE 0%,#0C2147 75%);box-shadow:0 30px 60px -20px rgba(12,33,71,.5),0 0 0 8px #fff}
.cpb-rond img{width:124%;height:auto;margin:6% 0 0 -12%;display:block}
.cpb-orb{position:absolute;inset:0;animation:cpb-tour 50s linear infinite}
.cpb-orb li{position:absolute;left:50%;top:50%;transform:rotate(var(--a)) translate(min(156px,37vw)) rotate(calc(-1 * var(--a)))}
.cpb-orb li>span{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:10px;background:#fff;border:1px solid rgba(12,33,71,.14);box-shadow:0 10px 24px rgba(12,33,71,.1);font-size:12.5px;font-weight:600;color:var(--marine-900);white-space:nowrap;transform:translate(-50%,-50%);animation:cpb-tour-i 50s linear infinite}
.cpb-orb li>span svg{color:var(--bleu-600)}
@keyframes cpb-tour{to{transform:rotate(360deg)}}@keyframes cpb-tour-i{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(-360deg)}}
.cpb-orbite:hover .cpb-orb,.cpb-orbite:hover .cpb-orb li>span,.cpb-orbite:hover .cpb-anneau{animation-play-state:paused}
.cpb-corps{grid-template-columns:240px minmax(0,1fr);align-items:start;gap:clamp(32px,5vw,80px);padding-top:clamp(40px,5vw,72px);padding-bottom:var(--web-section)}
.cpb-sommaire{position:sticky;top:112px;align-self:start;display:grid;gap:20px}
.cpb-sommaire>.cp-lib{grid-column:1/-1}.cpb-sommaire>.cp-btn{grid-column:1/-1;justify-self:start;margin-top:8px}
.cpb-prog{grid-row:2;border-radius:3px;background:var(--bleu-050);overflow:hidden}.cpb-prog span{display:block;height:100%;background:var(--marine-900);transform-origin:50% 0;transition:transform .5s var(--e)}
.cpb-sommaire ol{grid-row:2;display:grid;gap:2px}
.cpb-sommaire a{display:grid;grid-template-columns:28px minmax(0,1fr);align-items:center;min-height:44px;padding:4px 10px 4px 0;border-radius:10px;font-size:14px;font-weight:500;color:var(--gris-700);text-decoration:none;transition:color .25s,transform .3s var(--e)}
.cpb-sommaire a span{font-size:12px;font-weight:700;color:var(--gris-500);font-variant-numeric:tabular-nums;transition:color .25s}
.cpb-sommaire a:hover{color:var(--marine-900)}.cpb-sommaire a[aria-current]{color:var(--marine-900);font-weight:700;transform:translateX(4px)}.cpb-sommaire a[aria-current] span{color:var(--bleu-600)}
.cpb-chapitres{display:grid;gap:clamp(72px,8vw,112px);min-width:0}
.cpb-ch{display:grid;gap:clamp(28px,3vw,40px);scroll-margin-top:120px}
.cpb-qui{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.cpb-qui-tx{display:grid;gap:6px}.cpb-qui-i{display:grid;grid-template-columns:40px minmax(0,1fr);gap:16px;align-items:start;padding:24px;border-radius:20px;border:var(--fin);transition:border-color .3s,transform .35s var(--e)}.cpb-qui-i:hover{border-color:var(--marine-900);transform:translateY(-3px)}
.cpb-deux{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.cpb-deux-i{display:grid;gap:22px;align-content:start;padding:clamp(24px,3vw,36px);border-radius:24px;border:var(--fin);background:#fff}
.cpb-marine{background:var(--degrade-marine);border-color:transparent}.cpb-deux-t{display:flex;align-items:center;gap:14px}
.cpb-rel{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:clamp(24px,4vw,48px);align-items:start}
.cpb-frise{position:relative;display:grid;gap:28px;padding-top:8px}
.cpb-frise-l{position:absolute;left:23px;top:32px;bottom:24px;width:2px;background:var(--bleu-050)}.cpb-frise-l span{display:block;height:100%;background:var(--marine-900);transform-origin:50% 0;transform:scaleY(var(--p,0))}
.cpb-frise li{position:relative;display:grid;grid-template-columns:48px minmax(0,1fr);gap:18px;align-items:start;opacity:.55;transition:opacity .4s}.cpb-frise li>div{display:grid;gap:6px;padding-top:4px}.cpb-frise li[data-on="1"]{opacity:1}
.cpb-noeud{position:relative;z-index:1;width:48px;height:48px;border-radius:14px;background:#fff;border:2px solid var(--bleu-050);color:var(--gris-500);display:grid;place-items:center;transition:background-color .4s,border-color .4s,color .4s,transform .4s var(--e)}
.cpb-frise li[data-on="1"] .cpb-noeud{background:var(--marine-900);border-color:var(--marine-900);color:#fff;transform:scale(1.06)}
/* 03 · sujets du TAL : un cadre, deux colonnes séparées par un filet, note en pied */
.cpb-tal{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border:var(--fin);border-radius:24px;background:#fff;overflow:hidden}
.cpb-tal-col{display:grid;gap:16px;align-content:start;padding:clamp(22px,2.6vw,32px)}.cpb-tal-col+.cpb-tal-col{border-left:1px solid var(--bordure-fine)}
.cpb-tal-t{display:flex;align-items:center;gap:12px;font-size:16px;font-weight:700;color:var(--marine-900)}
.cpb-tal-col ul{display:grid}.cpb-tal-col li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:12px;align-items:start;padding:11px 0;border-top:1px solid var(--bordure-fine);font-size:14px;line-height:1.5;color:var(--texte-corps)}
.cpb-tal-col li>span{width:22px;height:22px;margin-top:0;border-radius:50%;background:var(--bleu-025);color:var(--bleu-600);display:grid;place-items:center}
.cpb-tal-note{grid-column:1/-1;display:grid;grid-template-columns:20px minmax(0,1fr);gap:12px;align-items:start;padding:16px clamp(22px,2.6vw,32px);border-top:1px solid var(--bordure-fine);background:var(--surface-douce);font-size:13.5px;line-height:1.6;color:var(--texte-corps)}.cpb-tal-note>span:first-child{color:var(--bleu-600);margin-top:2px}.cpb-tal-note b{color:var(--marine-900)}
/* 03 · Demandez à Cléo : en-tête pleine largeur, puis questions | réponse */
.cpb-dem{display:grid;border-radius:24px;overflow:hidden;border:1px solid rgba(12,33,71,.16)}
.cpb-dem-tete{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;padding:16px clamp(20px,2.4vw,28px);background:var(--marine-900)}
.cpb-dem-tete img{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.6)}.cpb-dem-tete>span{display:grid;margin-right:auto}.cpb-dem-tete b{font-size:15px;color:#fff}.cpb-dem-tete small{font-size:12.5px;color:var(--bleu-100)}
.cpb-dem-tabs{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14)}.cpb-dem-tabs button{color:#fff;height:40px}.cpb-dem-tabs button:hover{background:rgba(255,255,255,.1)}.cpb-dem-tabs button[aria-selected="true"]{background:#fff;color:var(--marine-900)}
.cpb-dem-tete :focus-visible{outline-color:#fff}
.cpb-dem-corps{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr)}
.cpb-dem-qs{display:grid;align-content:start;border-right:1px solid var(--bordure-fine);background:#fff}
.cpb-dem-qs li+li{border-top:1px solid var(--bordure-fine)}
.cpb-dem-qs button{position:relative;width:100%;display:grid;grid-template-columns:minmax(0,1fr) 16px;align-items:center;gap:12px;min-height:72px;padding:14px clamp(20px,2.4vw,28px);border:0;background:transparent;text-align:left;font:500 14px/1.45 var(--police-corps);color:var(--gris-700);cursor:pointer;transition:background-color .2s,color .2s}
.cpb-dem-qs button::before{content:'';position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:0 3px 3px 0;background:var(--marine-900);transform:scaleY(0);transition:transform .3s var(--e)}
.cpb-dem-qs button:hover{background:var(--surface-douce);color:var(--marine-900)}.cpb-dem-qs button[aria-pressed="true"]{background:var(--bleu-025);color:var(--marine-900);font-weight:600}.cpb-dem-qs button[aria-pressed="true"]::before{transform:none}
.cpb-dem-d{display:grid;grid-template-rows:minmax(0,1fr) auto;gap:16px;padding:20px clamp(20px,2.4vw,28px);background:var(--bleu-025)}
.cpb-dem-conv{display:grid;align-content:start}.cpb-dem-conv .cpa-cleo{max-width:100%}
.cpb-dem-pied{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 16px;padding-top:12px;border-top:1px solid var(--bleu-050)}.cpb-dem-pied .ll-mention-jur{flex:1 1 260px}
/* 04 · deux bandes sur la même grille de 4 colonnes : étapes reliées, puis les 4 cas de transfert */
.cpb-rel4{display:grid;gap:16px}
.cpb-etapes{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:var(--fin);border-radius:24px;background:#fff}
.cpb-etapes::before,.cpb-etapes::after{content:'';position:absolute;top:46px;left:46px;right:calc(25% - 46px);height:2px;background:var(--bleu-050)}
.cpb-etapes::after{background:var(--marine-900);transform:scaleX(0);transform-origin:0 50%;transition:transform 1.2s var(--e) .2s}.cpb-etapes.vu::after{transform:none}
.cpb-etapes li{position:relative;display:grid;gap:6px;align-content:start;padding:24px;opacity:0;transform:translateY(12px);transition:opacity .6s var(--e),transform .6s var(--e);transition-delay:var(--d,0ms)}.cpb-etapes.vu li{opacity:1;transform:none}
.cpb-et-n{position:relative;z-index:1;width:44px;height:44px;margin-bottom:10px;border-radius:12px;background:var(--marine-900);color:#fff;display:grid;place-items:center;box-shadow:0 0 0 6px #fff}
.cpb-et-k{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--bleu-600)}
.cpb-cas{display:grid;border:var(--fin);border-radius:24px;background:#fff;overflow:hidden}
.cpb-cas-t{margin:0;padding:16px 24px;border-bottom:1px solid var(--bordure-fine);font-size:15px;font-weight:700;color:var(--marine-900)}
.cpb-cas ul{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
.cpb-cas li{display:grid;grid-template-rows:auto auto 1fr;gap:6px;align-content:start;padding:20px 24px 24px}.cpb-cas li+li{border-left:1px solid var(--bordure-fine)}
.cpb-cas .cp-ic{margin-bottom:8px}.cpb-cas b{font-size:14.5px;line-height:1.35;color:var(--marine-900)}.cpb-cas small{font-size:13.5px;line-height:1.5;color:var(--texte-corps)}
.cp-ic.u{background:var(--urgence-100);color:var(--urgence-500)}
.cpb-cas-pied{display:flex;align-items:center;gap:10px;margin:0;padding:12px 24px;border-top:1px solid var(--bordure-fine);background:var(--surface-douce);font-size:13px;line-height:1.5;color:var(--texte-corps)}.cpb-cas-pied b{color:var(--marine-900)}
.cpb-decl2-pt{position:relative;flex:none;width:8px;height:8px;border-radius:50%;background:#3FB37F}.cpb-decl2-pt::after{content:'';position:absolute;inset:0;border-radius:50%;background:#3FB37F;animation:cp-pouls 1.8s ease-out infinite}
/* 05 · limites : un cadre, grille 3 × 3 à filets, rangées de même hauteur, note en pied */
.cpb-lim{border:var(--fin);border-radius:24px;background:#fff;overflow:hidden}
.cpb-lim ul{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr}
.cpb-lim li{display:grid;grid-template-columns:36px minmax(0,1fr);gap:12px;align-items:start;padding:20px clamp(16px,2vw,24px);border-top:1px solid var(--bordure-fine)}
.cpb-lim li:nth-child(-n+3){border-top:0}.cpb-lim li:not(:nth-child(3n+1)){border-left:1px solid var(--bordure-fine)}
.cpb-lim .cp-ic{width:36px;height:36px;border-radius:10px}
.cpb-lim li>span:last-child{display:grid;gap:4px}.cpb-lim b{font-size:14.5px;line-height:1.35;color:var(--marine-900)}.cpb-lim small{font-size:13.5px;line-height:1.5;color:var(--texte-corps)}
.cpb-lim-note{display:grid;grid-template-columns:20px minmax(0,1fr);gap:12px;align-items:start;margin:0;padding:16px clamp(16px,2vw,24px);border-top:1px solid var(--bordure-fine);background:var(--surface-douce);font-size:13.5px;line-height:1.55;color:var(--texte-corps)}.cpb-lim-note>span{color:var(--bleu-600);margin-top:1px}
/* 07 · formulaire de rappel : un cadre clair, deux colonnes */
.cpb-f{padding:clamp(22px,3vw,36px);border:var(--fin);border-radius:24px;background:#fff}
.cp-form-2{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:24px;row-gap:22px;align-items:start}.cp-form-2>.cp-plein{grid-column:1/-1}
/* Champs à étiquette flottante : décalés de la hauteur d'un intitulé pour s'aligner sur les groupes de boutons voisins */
.cp-form-2>div:has(>.fp-c),.cp-form-2>.cp-apparait{padding-top:var(--lib-h,33px)}
.cp-zone-c{min-height:88px!important}.cp-form-pied a{color:var(--marine-900);font-weight:600}
/* ——— C ——— */
.cpc-hero{background:linear-gradient(180deg,var(--bleu-025) 0%,#fff 100%);padding:clamp(28px,3.4vw,44px) 0 clamp(40px,5vw,64px)}
.cpc-hero-g{grid-template-columns:minmax(0,7fr) minmax(0,4fr);gap:clamp(32px,5vw,72px);align-items:start}
.cpc-hero-tx{display:grid;gap:22px}
.cpc-cherche{display:grid;gap:14px;padding:clamp(20px,2.4vw,28px);border-radius:24px;background:#fff;border:var(--fin);box-shadow:0 30px 60px -40px rgba(12,33,71,.35)}
.cpc-cherche .cp-lib-f{margin-bottom:8px}
.cpc-champ{position:relative;display:flex;align-items:center;height:64px;border-radius:16px;border:1px solid rgba(12,33,71,.2);background:#fff;transition:border-color .2s,box-shadow .2s}
.cpc-champ:focus-within{border-color:var(--marine-900);box-shadow:0 0 0 4px rgba(69,129,203,.2)}.cpc-champ>span{position:absolute;left:20px;display:grid;color:var(--bleu-600)}
.cpc-champ input{flex:1;height:100%;padding:0 56px 0 54px;border:0;border-radius:16px;background:transparent;font:600 16px var(--police-corps);color:var(--marine-900);outline:none}.cpc-champ input::placeholder{color:var(--gris-600);font-weight:500}
.cpc-champ input::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}.cpc-champ.off{background:var(--surface-douce)}.cpc-champ.off input{cursor:not-allowed}
.cpc-eff{position:absolute;right:10px;width:44px;height:44px;border:0;border-radius:10px;background:transparent;color:var(--gris-700);display:grid;place-items:center;cursor:pointer}.cpc-eff:hover{background:var(--bleu-025)}
.cpc-carte{position:relative;border-radius:24px;overflow:hidden;background:var(--marine-900);min-height:440px;display:flex;align-items:flex-end}
.cpc-carte img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 15%}
.cpc-carte::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,33,71,0) 30%,rgba(12,33,71,.95) 78%)}
.cpc-carte-b{position:relative;z-index:1;display:grid;gap:10px;justify-items:start;padding:24px;color:#fff}.cpc-carte-b b{font-size:20px;font-weight:700;letter-spacing:-.015em}.cpc-carte-b>span:not(.cp-statut){font-size:14px;line-height:1.6;color:var(--bleu-100)}
.cpc-res-s{padding-top:0}.cpc-res{display:grid;border-top:var(--fin)}
.cpc-res>li{border-bottom:1px solid var(--bordure-fine)}
.cpc-q button{width:100%;display:grid;grid-template-columns:auto minmax(0,1fr) 24px;align-items:center;gap:16px;min-height:64px;padding:14px 8px;border:0;background:none;text-align:left;font:600 16px/1.4 var(--police-corps);color:var(--marine-900);cursor:pointer;border-radius:12px;transition:background-color .2s}
.cpc-q button:hover{background:var(--bleu-025)}.cpc-tag{display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:7px;background:var(--bleu-025);font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--bleu-600)}
.cpc-chev{display:grid;transition:transform .3s var(--e)}.cpc-q button[aria-expanded="true"] .cpc-chev{transform:rotate(90deg)}
.cpc-r-in{display:grid;grid-template-columns:32px minmax(0,1fr);gap:14px;padding:4px 8px 22px;animation:cp-up .35s var(--e) both}.cpc-r-in img{width:32px;height:32px;border-radius:50%}.cpc-r-in>div{display:grid;gap:12px;justify-items:start;max-width:72ch}
.cpc-vide{display:flex;flex-wrap:wrap;align-items:center;gap:16px;padding:22px 8px}.cpc-vide img{width:40px;height:40px;border-radius:50%}.cpc-vide span{display:grid;margin-right:auto}.cpc-vide b{font-size:15px;color:var(--marine-900)}.cpc-vide small{font-size:13px;color:var(--gris-700)}
.cpc-sujets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.cpc-sujets button{width:100%;display:grid;grid-template-columns:48px minmax(0,1fr) 20px;align-items:center;gap:16px;min-height:88px;padding:18px 20px 18px 18px;border-radius:20px;border:var(--fin);background:#fff;text-align:left;font:700 16px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:border-color .25s,transform .35s var(--e),box-shadow .35s var(--e)}
.cpc-sujets .cp-ic{width:48px;height:48px;border-radius:14px;transition:background-color .25s,color .25s}.cpc-sujets button:hover{border-color:var(--marine-900);transform:translateY(-3px);box-shadow:0 16px 36px rgba(12,33,71,.1)}.cpc-sujets button:hover .cp-ic{background:var(--marine-900);color:#fff}
.cpc-fl{display:grid;transition:transform .3s var(--e)}.cpc-sujets button:hover .cpc-fl{transform:translateX(4px)}
.cpc-tri{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:clamp(24px,4vw,48px);align-items:start}
.cpc-sits{display:grid;gap:8px}.cpc-sits button{display:flex;align-items:center;gap:12px;min-height:52px;padding:0 16px;border-radius:12px;border:1px solid rgba(12,33,71,.16);background:#fff;text-align:left;font:600 14px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:border-color .2s,background-color .2s,transform .3s var(--e)}
.cpc-sits button svg{color:var(--bleu-600)}.cpc-sits button:hover{border-color:var(--marine-900)}.cpc-sits button[aria-checked="true"]{background:var(--marine-900);border-color:var(--marine-900);color:#fff;transform:translateX(6px)}.cpc-sits button[aria-checked="true"] svg{color:#fff}
.cpc-niv{position:sticky;top:120px;display:grid;grid-template-columns:minmax(0,1fr);gap:20px;padding:clamp(24px,3vw,36px);border-radius:24px;border:1px solid;animation:cp-up .45s var(--e) both}
.cpc-urg{border-color:rgba(180,54,47,.35);background:#FFF6F5}.cpc-pri{border-color:rgba(176,112,20,.35);background:#FFF9EE}.cpc-cou{border-color:rgba(12,33,71,.16);background:var(--bleu-025)}
.cpc-niv-t{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px}.cpc-niv-t>span:nth-child(2){display:grid;margin-right:auto}.cpc-niv-t small{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--gris-700)}.cpc-niv-t b{font-size:24px;font-weight:700;letter-spacing:-.02em;color:var(--marine-900)}
.cpc-niv-p{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;font-size:22px;font-weight:700;color:#fff}.cpc-urg .cpc-niv-p{background:var(--urgence-500)}.cpc-pri .cpc-niv-p{background:#9A6212}.cpc-cou .cpc-niv-p{background:var(--marine-900)}
.cpc-echelle{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.cpc-echelle li{min-width:0;display:grid;gap:4px;padding:10px;border-radius:10px;background:rgba(255,255,255,.7);font-size:12.5px;color:var(--gris-700);transition:background-color .3s,color .3s}.cpc-echelle li span{font-weight:700;color:var(--marine-900)}
.cpc-echelle li[data-on="1"]{background:var(--marine-900);color:#fff}.cpc-echelle li[data-on="1"] span{color:#fff}
.cpc-niv-a{font-size:16px;line-height:1.55;font-weight:600;color:var(--marine-900)}
.cpc-comp table{width:100%;border-collapse:separate;border-spacing:0;border:var(--fin);border-radius:24px;overflow:hidden;background:#fff}
.cpc-comp th{padding:20px 24px;text-align:left;background:var(--marine-900);color:#fff;font-size:15px;font-weight:700}.cpc-comp th+th{border-left:1px solid rgba(255,255,255,.14)}
.cpc-th{display:inline-flex;align-items:center;gap:12px}.cpc-th img{width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.6)}.cpc-th .cp-ic{width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.14);color:#fff}
.cpc-comp td{padding:16px 24px;border-top:1px solid var(--bordure-fine);font-size:14px;line-height:1.5;color:var(--texte-corps);vertical-align:top}.cpc-comp td+td{border-left:1px solid var(--bordure-fine)}
.cpc-cel{display:flex;align-items:flex-start;gap:12px}.cpc-cel svg{flex:none;margin-top:3px}
.cpc-comp tbody tr{transition:background-color .2s}.cpc-comp tbody tr:hover{background:var(--bleu-025)}
.cpc-deux{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(32px,5vw,80px);align-items:start}.cpc-deux>div{display:grid;gap:32px}
/* ——— D ——— */
.cpd-hero{background:linear-gradient(160deg,#0C2147 0%,#122744 55%,#1C3053 100%);padding:clamp(28px,3.4vw,44px) 0 0}
.cpd-hero-g{grid-template-columns:minmax(0,6fr) minmax(0,6fr);align-items:end;gap:clamp(24px,4vw,56px)}
.cpd-hero-tx{display:grid;gap:22px;justify-items:start;align-self:center;padding-bottom:clamp(40px,5vw,72px)}
.cpd-scene{position:relative;height:clamp(420px,46vw,600px)}
.cpd-disque{position:absolute;left:50%;bottom:-18%;width:92%;aspect-ratio:1;border-radius:50%;transform:translateX(-50%);background:radial-gradient(circle at 50% 40%,rgba(69,129,203,.55) 0%,rgba(12,33,71,0) 62%)}
.cpd-det{position:absolute;left:50%;bottom:0;height:100%;width:auto;max-width:none;transform:translateX(-50%);filter:drop-shadow(0 40px 60px rgba(2,8,18,.6))}
.cpd-bulle{position:absolute;display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;background:#fff;box-shadow:0 20px 40px rgba(2,8,18,.35);font-size:13px;font-weight:600;color:var(--marine-900);white-space:nowrap;animation:cpd-flotte 6s ease-in-out infinite}
.cpd-bulle svg{color:var(--bleu-600)}.cpd-bulle.b1{left:-2%;top:22%}.cpd-bulle.b1 svg{color:var(--urgence-500)}.cpd-bulle.b2{right:-2%;top:44%;animation-delay:-2s}.cpd-bulle.b3{left:4%;bottom:16%;animation-delay:-4s}
@keyframes cpd-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.cpd-bento{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.cpd-t{position:relative;overflow:hidden;display:grid;grid-template-rows:1fr auto auto;gap:10px;min-height:250px;padding:24px;border-radius:24px;border:var(--fin);background:#fff;transition:transform .35s var(--e),box-shadow .35s var(--e)}
.cpd-t:hover{transform:translateY(-4px);box-shadow:0 24px 48px rgba(12,33,71,.1)}.cpd-t>div:first-child{align-self:start;margin-bottom:12px}
.cpd-t3{background:var(--degrade-marine);border-color:transparent}
.cpd-horloge{position:relative;width:88px;height:88px;border-radius:50%;border:2px solid var(--marine-900);background:radial-gradient(circle,#fff 0 58%,var(--bleu-025) 60%)}
.cpd-horloge i{position:absolute;left:50%;bottom:50%;width:3px;border-radius:3px;background:var(--marine-900);transform-origin:50% 100%}
.cpd-horloge .h{height:24px;margin-left:-1.5px;animation:cpb-tour 24s linear infinite}.cpd-horloge .m{height:34px;width:2px;margin-left:-1px;background:var(--bleu-600);animation:cpb-tour 4s linear infinite}
.cpd-horloge .c{left:50%;top:50%;bottom:auto;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--marine-900)}
.cpd-langue{position:relative;height:56px;width:180px;overflow:hidden}.cpd-langue span{position:absolute;inset:0;display:flex;align-items:center;padding:0 18px;border-radius:14px 14px 14px 4px;background:var(--bleu-025);font-size:22px;font-weight:700;color:var(--marine-900);animation:cpd-lg 5s var(--e) infinite}
.cpd-langue span+span{background:var(--marine-900);color:#fff;animation-delay:-2.5s}
@keyframes cpd-lg{0%,40%{transform:none;opacity:1}50%,90%{transform:translateY(-110%);opacity:0}100%{transform:none;opacity:1}}
.cpd-niv{display:grid;gap:8px;width:100%;max-width:260px}.cpd-niv span{display:grid;grid-template-columns:28px minmax(0,1fr);gap:10px;align-items:center}.cpd-niv b{font-size:12px;color:#fff}
.cpd-niv i{height:8px;border-radius:4px;background:rgba(255,255,255,.14);position:relative;overflow:hidden}.cpd-niv i::after{content:'';position:absolute;inset:0;border-radius:4px;background:var(--bleu-300);transform-origin:0 50%;transform:scaleX(calc(1 - var(--i) * .22));animation:cpd-barre 2.8s var(--e) infinite;animation-delay:calc(var(--i) * 140ms)}
.cpd-niv span:first-child i::after{background:#E0675F}.cpd-niv span:nth-child(2) i::after{background:#E9A49F}
@keyframes cpd-barre{0%{transform:scaleX(0)}40%,100%{transform:scaleX(calc(1 - var(--i) * .22))}}
.cpd-cal{display:grid;grid-template-columns:repeat(7,18px);gap:6px}.cpd-cal i{height:18px;border-radius:5px;background:var(--bleu-025);border:1px solid var(--bleu-050);animation:cpd-case 4.2s linear infinite;animation-delay:calc(var(--i) * 300ms)}
@keyframes cpd-case{0%,6%{background:var(--bleu-025)}8%,18%{background:var(--marine-900);border-color:var(--marine-900)}22%,100%{background:var(--bleu-025)}}
.cpd-billet{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 16px;border-radius:12px;border:1px dashed rgba(12,33,71,.3);font-size:14px;color:var(--marine-900)}
.cpd-bouclier{position:relative;width:64px;height:64px;border-radius:18px;background:var(--bleu-025);color:var(--marine-900);display:grid;place-items:center}.cpd-bouclier::after{content:'';position:absolute;inset:0;border-radius:18px;border:2px solid var(--bleu-300);animation:cpd-onde 2.6s ease-out infinite}
@keyframes cpd-onde{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.5);opacity:0}}
.cpd-fleches{display:flex;align-items:center;gap:8px}.cpd-fleches button{width:48px;height:48px;border-radius:12px;border:1px solid rgba(12,33,71,.2);background:#fff;color:var(--marine-900);display:grid;place-items:center;cursor:pointer;transition:background-color .2s,border-color .2s}.cpd-fleches button:hover{border-color:var(--marine-900);background:var(--bleu-025)}
.cpd-rail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(280px,calc((100% - 48px) / 4));gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 4px 16px;margin:-4px;scrollbar-width:thin}
.cpd-rail li{scroll-snap-align:start;display:grid;gap:14px;align-content:start;padding:22px;border-radius:20px;background:#fff;border:var(--fin)}
.cpd-h{font-size:28px;font-weight:700;letter-spacing:-.02em;color:var(--marine-900);font-variant-numeric:tabular-nums}
.cpd-qui{display:inline-flex;align-items:center;gap:6px;justify-self:start;height:28px;padding:0 10px;border-radius:8px;background:var(--bleu-025);font-size:12px;font-weight:600;color:var(--bleu-600)}
.cpd-rail .cpa-moi{animation:none;justify-self:end}.cpd-res{display:grid;grid-template-columns:24px minmax(0,1fr);gap:10px;align-items:start;font-size:13.5px;line-height:1.55;color:var(--gris-800)}.cpd-res img{width:24px;height:24px;border-radius:50%}
.cpd-essai-g{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,7fr);gap:clamp(32px,5vw,80px);align-items:start}.cpd-essai-tx{display:grid;gap:18px}
.cpd-sim{display:grid;gap:20px;padding:clamp(24px,3vw,40px);border-radius:24px;background:#fff;border:var(--fin);box-shadow:0 30px 60px -40px rgba(12,33,71,.35)}
.cpd-et{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.cpd-et li{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--gris-600)}
.cpd-et li>span{width:28px;height:28px;flex:none;border-radius:50%;border:2px solid var(--bleu-050);display:grid;place-items:center;font-size:12px;transition:background-color .3s,border-color .3s,color .3s}
.cpd-et li[data-on="1"]{color:var(--marine-900)}.cpd-et li[data-on="1"]>span{background:var(--marine-900);border-color:var(--marine-900);color:#fff}
.cpd-barre{height:4px;border-radius:4px;background:var(--bleu-025);overflow:hidden}.cpd-barre span{display:block;height:100%;background:var(--marine-900);transform-origin:0 50%;transition:transform .5s var(--e)}
.cpd-zone{display:grid;gap:16px;min-height:240px;animation:cp-up .4s var(--e) both}.cpd-zone h3{outline:none}
.cpd-cartes{grid-template-columns:minmax(0,1fr)}.cpd-cartes .cp-carte-c{grid-template-columns:40px minmax(0,1fr) 20px}.cpd-fl{display:grid;color:var(--marine-900);transition:transform .3s var(--e)}.cpd-cartes .cp-carte-c:hover .cpd-fl{transform:translateX(4px)}
.cpd-qs{display:grid;gap:8px}.cpd-qs button{width:100%;display:flex;align-items:center;gap:12px;min-height:56px;padding:12px 16px;border-radius:12px;border:1px solid rgba(12,33,71,.16);background:#fff;text-align:left;font:600 14px/1.45 var(--police-corps);color:var(--marine-900);cursor:pointer;transition:border-color .2s,background-color .2s,transform .3s var(--e)}
.cpd-qs button svg{flex:none;color:var(--bleu-600)}.cpd-qs button:hover{border-color:var(--marine-900);background:var(--bleu-025);transform:translateX(4px)}
.cpd-conv{display:grid;gap:12px;padding:20px;border-radius:18px;background:var(--bleu-025)}.cpd-conv .cpa-moi{justify-self:end}
.cpd-nav{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding-top:16px;border-top:1px solid var(--bordure-fine)}.cpd-nav:empty{display:none}
/* Écrans moyens et petits */
@media (max-width:1100px){.cp-don{grid-template-columns:repeat(2,minmax(0,1fr))}.cpb-corps{grid-template-columns:minmax(0,1fr)}.cpb-sommaire{display:none}.cpd-bento{grid-template-columns:repeat(2,minmax(0,1fr))}.cpd-rail{grid-auto-columns:minmax(280px,calc((100% - 32px) / 3))}}
@media (max-width:960px){.cpb-etapes,.cpb-cas ul{grid-template-columns:repeat(2,minmax(0,1fr))}.cpb-etapes::before,.cpb-etapes::after{display:none}.cpb-cas li:nth-child(3){border-left:0}.cpb-cas li:nth-child(n+3){border-top:1px solid var(--bordure-fine)}
  .cpa-hero-g,.cpa-pan,.cpa-form-g,.cpb-rel,.cpb-dem-corps,.cpc-hero-g,.cpc-tri,.cpc-deux,.cpd-hero-g,.cpd-essai-g{grid-template-columns:minmax(0,1fr)}
  .cpa-chat{height:440px}.cpa-faits{grid-template-columns:repeat(2,minmax(0,1fr))}.cpa-faits li:nth-child(3){padding-left:0;border-left:0}.cpa-faits li:nth-child(n+3){border-top:1px solid rgba(255,255,255,.14)}
  .cpa-form-tx,.cpc-niv{position:static}.cp-rel{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:32px}.cp-rel::before,.cp-rel::after{display:none}
  .cpc-carte{min-height:320px}.cpc-sujets{grid-template-columns:repeat(2,minmax(0,1fr))}.cpd-scene{height:380px}.cpd-hero-tx{padding-bottom:0}.cpb-lim ul{grid-template-columns:repeat(2,minmax(0,1fr))}.cpb-lim li{border-left:0!important;border-top:1px solid var(--bordure-fine)!important}.cpb-lim li:nth-child(even){border-left:1px solid var(--bordure-fine)!important}.cpb-lim li:nth-child(-n+2){border-top:0!important}.cpb-dem-qs{border-right:0;border-bottom:1px solid var(--bordure-fine)}.cpb-frise{height:auto;grid-template-rows:none}.cpb-frise-l{height:auto;bottom:24px!important}
}
@media (max-width:620px){.cpb-etapes,.cpb-cas ul{grid-template-columns:minmax(0,1fr)}.cpb-etapes li,.cpb-cas li{grid-template-columns:44px minmax(0,1fr);grid-template-rows:none;column-gap:16px;row-gap:2px;padding:16px 20px}.cpb-etapes li+li{border-top:1px solid var(--bordure-fine)}.cpb-et-n,.cpb-cas .cp-ic{grid-row:1/span 3;margin:0!important}.cpb-cas .cp-ic{width:44px;height:44px}.cpb-cas li+li{border-left:0;border-top:1px solid var(--bordure-fine)}.cpb-lim ul{grid-template-columns:minmax(0,1fr);grid-auto-rows:auto}.cpb-lim li{padding:16px 20px;border-left:0!important;border-top:1px solid var(--bordure-fine)!important}.cpb-lim li:first-child{border-top:0!important}.cp-form-2>div:has(>.fp-c),.cp-form-2>.cp-apparait{padding-top:0}.cpb-tal,.cp-form-2{grid-template-columns:minmax(0,1fr)}.cpb-tal-col+.cpb-tal-col{border-left:0;border-top:1px solid var(--bordure-fine)}.cpa-chat-t .cp-statut{display:none}.cp-btn{white-space:normal;height:auto;min-height:52px;padding-top:12px;padding-bottom:12px;text-align:left}.cp-cartes,.cp-don,.cpb-qui,.cpb-deux,.cpc-sujets,.cpd-bento,.cp-rel,.cpa-decl .cp-coches,.cpa-faits{grid-template-columns:minmax(0,1fr)}.cpa-faits li{padding-left:0!important;border-left:0!important}.cpa-faits li+li{border-top:1px solid rgba(255,255,255,.14)}
  .cpd-rail{grid-auto-columns:82%}.cpd-bulle{display:none}.cpd-et li{font-size:0}.cpd-et li>span{font-size:12px}.cpc-echelle{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cpc-comp table,.cpc-comp thead,.cpc-comp tbody,.cpc-comp tr,.cpc-comp td,.cpc-comp th{display:block}.cpc-comp thead{display:none}.cpc-comp td+td{border-left:0;background:var(--surface-douce)}
  .cpb-orb li{transform:rotate(var(--a)) translate(min(150px,31vw)) rotate(calc(-1 * var(--a)))}.cpb-orbite{width:min(330px,74vw)}.cpb-hero .cp-actions{display:grid;grid-template-columns:minmax(0,1fr);width:100%}.cpb-hero .cp-btn{width:100%}.cp-form-pied{display:grid;gap:12px}.cp-form-pied .cp-btn{width:100%;justify-content:center}.cpb-orb li>span{font-size:11.5px;height:30px;padding:0 9px}}
@media (prefers-reduced-motion:reduce){.cp *,.cp *::before,.cp *::after{animation:none!important;transition:none!important}.cp .cp-r,.cp .cp-rel-e,.cpb-etapes li,.cpb-etapes::after{opacity:1!important;transform:none!important}.cp .cp-rel::after{transform:none!important}}`;

/* ——— Page retenue : option B « Parcours » (8 oct. 2026). Bascule de revue retirée; A, C et D restent dans ce fichier, inactives. ——— */
function PageCleoV2({
  route
}) {
  return <><style>{CSS}</style><div className="cp"><CleoB route={route} /></div></>;
}
export { PageCleoV2 };
