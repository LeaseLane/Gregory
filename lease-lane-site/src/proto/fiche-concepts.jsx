/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/fiche-concepts.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import ReactDOM from 'react-dom';
import { Icon } from '@/components/ds';
import { gab } from '@/proto/blocs';
import { LL_DATA } from '@/proto/data';
import { CarteFiche } from '@/proto/fiche';
import { FicheDetails } from '@/proto/fiche-details';
import { __maintenant, useEtatClient, __ssr } from '@/lib/hydratation';
const uS = React.useState,
  uE = React.useEffect,
  uR = React.useRef;
const g = t => gab ? gab(t) : t;
const IMG = "/assets/img/";
const reduit = () => ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : undefined);
/* ——— Données du logement (une seule source pour les trois options) ——— */
const L = {
  ref: 'LOG-2026-0114',
  grandeur: '4 ½',
  titre: '4 ½ rénové',
  secteur: 'Montcalm',
  arr: 'La Cité-Limoilou',
  adresse: '1180, avenue Cartier',
  ville: 'Québec (Québec) G1R 2S7',
  prix: 1450,
  chambres: 2,
  sdb: 1,
  sup: 880,
  etage: '2e étage',
  stationnement: 1,
  annee: 1925,
  batiment: 'Plex (2 à 5 logements)',
  propriete: 'Appartement',
  statut: 'Bientôt libre',
  dispo: 'Libre le 1er juillet',
  emmenagement: '1er juillet',
  bail: '12 mois',
  lat: 46.8045,
  lng: -71.2235
};
/* Inclus : true = inclus · false = non inclus · 'cond' = sous conditions · null = à confirmer */
const INCL = [['chauff', 'Chauffé', 'flame', null], ['eclaire', 'Éclairé', 'lightbulb', false], ['meuble', 'Meublé', 'house', false], ['station', 'Stationnement', 'car', true], ['animaux', 'Animaux acceptés', 'key', 'cond'], ['laveuse', 'Entrées laveuse-sécheuse', 'zap', false]];
const etatIncl = v => v === true ? ['Inclus', 'oui'] : v === false ? ['Non inclus', 'non'] : v === 'cond' ? ['Sous conditions', 'cond'] : [g('[à confirmer]'), 'nc'];
const DESC = 'Logement de deux chambres au deuxième étage d’un triplex entretenu, à dix minutes à pied du traversier. Cuisine et salle de bain refaites en 2024, planchers de bois franc d’origine, fenêtres pleine hauteur sur la façade sud.';
const DESC2 = 'Buanderie commune au sous-sol, un stationnement extérieur inclus.';
const PHOTOS = [{
  src: IMG + 'logements/montcalm-cartier.jpg',
  lib: 'L’immeuble',
  alt: 'L’immeuble du 1180, avenue Cartier, Montcalm'
}, {
  lib: 'Salon'
}, {
  lib: 'Cuisine refaite en 2024'
}, {
  lib: 'Chambre principale'
}, {
  lib: 'Salle de bain refaite en 2024'
}];
const PROCHE = [['shopping-cart', 'Épicerie et pharmacie', 'moins de 600 m', 600], ['school', 'Écoles primaires', 'moins de 600 m', 600], ['train-front', 'Arrêt du RTC', '120 m', 120], ['map', 'Plaines d’Abraham', '500 m', 500]];
const GROUPES = [['Le logement', 'layers', [['Grandeur', L.grandeur], ['Chambres', L.chambres], ['Salles de bain', L.sdb], ['Superficie', L.sup + ' pi²'], ['Étage', L.etage]]], ['L’immeuble', 'building-2', [['Type de bâtiment', L.batiment], ['Type de propriété', L.propriete], ['Année de construction', L.annee], ['Stationnement', L.stationnement + ' extérieur']]], ['Disponibilité', 'calendar-check', [['Statut', L.statut], ['Emménagement', L.emmenagement], ['Bail', L.bail], ['Secteur', L.secteur]]]];
const prixN = p => +String(p).replace(/[^\d]/g, '');
const similaires = () => {
  const t = (LL_DATA.logements || []).filter(l => l.id !== 'L1');
  return t.sort((a, b) => Math.abs(prixN(a.prix) - L.prix) - Math.abs(prixN(b.prix) - L.prix)).slice(0, 3);
};
const visiter = (ouvrir, txt) => {
  try {
    window.dispatchEvent(new CustomEvent('ll-cleo', {
      detail: {
        texte: txt || 'Je voudrais visiter le ' + L.titre + ', ' + L.secteur + ' (' + L.ref + ').'
      }
    }));
  } catch (e) {
    ouvrir && ouvrir();
  }
};
const DEMANDE = "/locataires/demande-de-location";

/* ——— Outils ——— */
function useVu(seuil = .18) {
  const r = uR(null),
    [v, setV] = uS(false);
  uE(() => {
    const el = r.current;
    if (!el) return;
    if (reduit() || !('IntersectionObserver' in window)) {
      setV(true);
      return;
    }
    const io = new IntersectionObserver(([x]) => {
      if (x.isIntersecting) {
        setV(true);
        io.disconnect();
      }
    }, {
      threshold: seuil
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [r, v];
}
function Vu({
  as = 'div',
  className = '',
  children,
  ...p
}) {
  const [r, v] = useVu();
  const T = as;
  return <T ref={r} className={'fx-r ' + className} data-vu={v ? '1' : undefined} {...p}>{children}</T>;
}
function Compte({
  n,
  suf = '',
  fmt
}) {
  const [r, v] = useVu(.4),
    [x, setX] = useEtatClient(reduit() ? n : 0);
  uE(() => {
    if (!v || reduit()) {
      setX(n);
      return;
    }
    let raf, t0;
    const f = t => {
      t0 = t0 || t;
      const k = Math.min(1, (t - t0) / 900),
        e = 1 - Math.pow(1 - k, 3);
      setX(Math.round(n * e));
      if (k < 1) raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;
    };
    raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? cancelAnimationFrame(raf) : undefined;
  }, [v]);
  return <span ref={r}>{fmt ? fmt(x) : x}{suf}</span>;
}
function Photo({
  p,
  className = '',
  style,
  eager
}) {
  return p.src ? <img className={'fx-img ' + className} src={p.src} alt={p.alt} loading={eager ? 'eager' : 'lazy'} decoding="async" style={style} /> : <span className={'fx-ph ' + className} role="img" aria-label={p.lib + ' · photo à fournir'} style={style}><Icon name="camera" size={22} color="currentColor" /><b>{p.lib}</b><small>Photo à fournir</small></span>;
}
function Inclus({
  cols
}) {
  return <ul className="fx-incl" style={cols ? {
    gridTemplateColumns: cols
  } : null}>{INCL.map(([k, t, ic, v]) => {
      const [lab, c] = etatIncl(v);
      return <li key={k} data-e={c}>
  <span className="fx-incl-ic" aria-hidden="true"><Icon name={ic} size={17} color="currentColor" /></span><span><b>{t}</b><small>{lab}</small></span>
  <span className="fx-incl-e" aria-hidden="true"><Icon name={c === 'oui' ? 'check' : c === 'non' ? 'minus' : c === 'cond' ? 'info' : 'clock'} size={14} color="currentColor" /></span></li>;
    })}</ul>;
}
function Groupes({
  className = ''
}) {
  return <div className={'fx-grp ' + className}>{GROUPES.map(([t, ic, l], i) => <Vu key={t} className="fx-grp-c" style={{
      '--d': i * 90 + 'ms'
    }}>
  <h3><span aria-hidden="true"><Icon name={ic} size={16} color="currentColor" /></span>{t}</h3>
  <dl>{l.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl></Vu>)}</div>;
}
function Proche() {
  return <ul className="fx-proche">{PROCHE.map(([ic, t, d, m], i) => <li key={t}><span aria-hidden="true"><Icon name={ic} size={16} color="currentColor" /></span><b>{t}</b><span className="fx-proche-d">{d}</span>
  <i aria-hidden="true" style={{
        '--w': Math.max(14, 100 - m / 7) + '%',
        '--d': i * 120 + 'ms'
      }} /></li>)}</ul>;
}
function Carte() {
  return <CarteFiche quartier={L.secteur} lat={L.lat} lng={L.lng} />;
}
function Similaires({
  titre = 'Logements semblables'
}) {
  const s = similaires();
  return <section className="fx-sim" aria-labelledby="fx-sim-t">
  <div className="fx-sim-tete"><h2 id="fx-sim-t" className="fx-h2">{titre}</h2><a href="/logements-a-louer" className="fx-lien">Tous les logements<Icon name="arrow-right" size={15} color="currentColor" /></a></div>
  <ul>{s.map((l, i) => <Vu as="li" key={l.id} style={{
        '--d': i * 90 + 'ms'
      }}><a href="/logements-a-louer" className="fx-sim-c">
    <span className="fx-sim-im" aria-hidden="true"><Icon name="building-2" size={26} color="currentColor" /></span>
    <span className="fx-sim-tx"><b>{l.prix} <small>/ mois</small></b><span>{l.titre}</span><small>{l.chambres} ch. · {l.sallesDeBain} sdb · {l.superficie} pi² · {l.dispo}</small></span></a></Vu>)}</ul></section>;
}
function Retour({
  clair,
  court
}) {
  return <a href="/logements-a-louer" className={'fx-retour' + (clair ? ' c' : '')} aria-label={court ? 'Retour aux résultats' : undefined}><Icon name="arrow-left" size={16} color="currentColor" />{court ? 'Retour' : 'Retour aux résultats'}</a>;
}
function Actions({
  ouvrir,
  sombre
}) {
  return <div className="fx-act"><button type="button" className={'fx-btn p' + (sombre ? ' inv' : '')} onClick={() => visiter(ouvrir)}><Icon name="calendar-check" size={18} color="currentColor" />Planifier une visite</button>
  <a href={DEMANDE} className={'fx-btn s' + (sombre ? ' inv' : '')}><Icon name="file-text" size={18} color="currentColor" />Demande de location</a></div>;
}

/* Visionneuse (galerie plein écran) : Échap ferme, ← → naviguent, le focus revient au bouton d'origine. */
function Visionneuse({
  i,
  setI,
  fermer
}) {
  const b = uR(null),
    retour = uR((__ssr() ? "undefined" : typeof document) !== "undefined" ? document.activeElement : undefined),
    n = PHOTOS.length,
    p = PHOTOS[i];
  uE(() => {
    b.current && b.current.focus();
    const k = e => {
      if (e.key === 'Escape') fermer();
      if (e.key === 'ArrowRight') setI((i + 1) % n);
      if (e.key === 'ArrowLeft') setI((i - 1 + n) % n);
      if (e.key === 'Tab') {
        const f = [...((__ssr() ? "undefined" : typeof document) !== "undefined" ? document.querySelectorAll('.fx-vis button') : undefined)];
        if (!f.length) return;
        const a = f[0],
          z = f[f.length - 1];
        if (e.shiftKey && ((__ssr() ? "undefined" : typeof document) !== "undefined" ? document.activeElement : undefined) === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && ((__ssr() ? "undefined" : typeof document) !== "undefined" ? document.activeElement : undefined) === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener('keydown', k);
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.removeEventListener('keydown', k) : undefined;
  }, [i]);
  uE(() => () => {
    try {
      retour.current && retour.current.focus();
    } catch (e) {}
  }, []);
  return ReactDOM.createPortal(<div className="fx-vis" role="dialog" aria-modal="true" aria-label={'Photos du logement, ' + (i + 1) + ' sur ' + n}>
    <div className="fx-vis-tete"><span aria-live="polite">{i + 1} / {n} · {p.lib}</span><button ref={b} type="button" onClick={fermer} aria-label="Fermer la galerie"><Icon name="x" size={20} color="currentColor" /></button></div>
    <div className="fx-vis-sc" key={i}><Photo p={p} eager /></div>
    <button type="button" className="fx-vis-n g" onClick={() => setI((i - 1 + n) % n)} aria-label="Photo précédente"><Icon name="chevron-left" size={22} color="currentColor" /></button>
    <button type="button" className="fx-vis-n d" onClick={() => setI((i + 1) % n)} aria-label="Photo suivante"><Icon name="chevron-right" size={22} color="currentColor" /></button>
    <div className="fx-vis-mini">{PHOTOS.map((q, k) => <button key={k} type="button" aria-label={'Photo ' + (k + 1) + ' : ' + q.lib} aria-current={k === i ? 'true' : undefined} onClick={() => setI(k)}><Photo p={q} /></button>)}</div>
  </div>, (__ssr() ? "undefined" : typeof document) !== "undefined" ? document.body : undefined);
}
function useVis() {
  const [v, setV] = uS(null);
  return [v === null ? null : <Visionneuse i={v} setI={setV} fermer={() => setV(null)} />, setV];
}

/* ======================= A · Vitrine ======================= */

/* ======================= B · Dossier ======================= */
const CRIT = [['ch2', '2 chambres et +', () => L.chambres >= 2], ['budget', 'Moins de 1 500 $', () => L.prix < 1500], ['station', 'Stationnement', () => INCL[3][3] === true], ['animaux', 'Animaux acceptés', () => !!INCL[4][3]], ['libre', 'Libre immédiatement', () => /immédiat/i.test(L.dispo)], ['meuble', 'Meublé', () => INCL[2][3] === true], ['laveuse', 'Entrées laveuse-sécheuse', () => INCL[5][3] === true], ['sup', '900 pi² et +', () => L.sup >= 900], ['recent', 'Construit en 2000 et +', () => L.annee >= 2000]];
function Criteres() {
  const [sel, setSel] = uS(['ch2', 'budget', 'station', 'animaux']);
  const ok = sel.filter(k => CRIT.find(c => c[0] === k)[2]()).length,
    n = sel.length,
    p = n ? ok / n : 0;
  return <div className="fx-crit">
    <div className="fx-crit-ch"><p className="fx-lab" id="fb-crit-l">Vos critères</p><div role="group" aria-labelledby="fb-crit-l" className="fx-puces">{CRIT.map(([k, t]) => {
          const on = sel.includes(k);
          return <button key={k} type="button" aria-pressed={on} className="fx-puce" onClick={() => setSel(v => on ? v.filter(x => x !== k) : [...v, k])}>{on && <Icon name="check" size={13} color="currentColor" />}{t}</button>;
        })}</div></div>
    {/* Compatibilité : carte marine, pourcentage, une barre par critère (verte si respecté), verdict et critères en pastilles. */}
    <div className={'fx-match ll-sombre' + (n && ok === n ? ' tout' : '')} aria-live="polite">
      <div className="fx-match-h"><span className="fx-match-lab"><Icon name="sparkles" size={15} color="currentColor" />Compatibilité</span>
        <b key={ok + '/' + n} className="fx-match-pct">{n ? Math.round(p * 100) : 0}<small> %</small></b></div>
      <div className="fx-match-seg" aria-hidden="true">{sel.map((k, i) => <span key={k + i} data-ok={CRIT.find(c => c[0] === k)[2]() ? '1' : '0'} style={{
          '--d': i * 90 + 'ms'
        }} />)}</div>
      <p className="fx-crit-t">{n ? ok === n ? 'Ce logement répond à tous vos critères.' : ok + ' critère' + (ok > 1 ? 's' : '') + ' sur ' + n + ' respecté' + (ok > 1 ? 's' : '') + '.' : 'Choisissez vos critères.'}</p>
      <ul className="fx-crit-l">{sel.map(k => {
          const c = CRIT.find(x => x[0] === k),
            v = c[2]();
          return <li key={k} data-ok={v ? '1' : '0'}><Icon name={v ? 'check' : 'x'} size={14} color="currentColor" />{c[1]}<span className="fx-sr">{v ? ' : oui' : ' : non'}</span></li>;
        })}</ul>
    </div></div>;
}
function Moment({
  ouvrir
}) {
  const [jours] = useEtatClient(() => {
    const r = [],
      d = __maintenant();
    for (let k = 1; r.length < 5; k++) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k);
      r.push(x);
    }
    return r;
  });
  const [j, setJ] = uS(0),
    [m, setM] = uS('soir');
  const fj = x => x.toLocaleDateString('fr-CA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  return <div className="fx-moment"><p className="fx-lab" id="fb-j">Jour</p><div role="radiogroup" aria-labelledby="fb-j" className="fx-jours">{jours.map((x, k) => <button key={k} type="button" role="radio" aria-checked={j === k} onClick={() => setJ(k)} className="fx-jour"><small>{x.toLocaleDateString('fr-CA', {
            weekday: 'short'
          })}</small><b>{x.getDate()}</b><small>{x.toLocaleDateString('fr-CA', {
            month: 'short'
          })}</small></button>)}</div>
    <p className="fx-lab" id="fb-m">Moment</p><div role="radiogroup" aria-labelledby="fb-m" className="fx-puces">{[['matin', 'Matin', 'sun'], ['apm', 'Après-midi', 'clock'], ['soir', 'Soir', 'lightbulb']].map(([k, t, ic]) => <button key={k} type="button" role="radio" aria-checked={m === k} className="fx-puce" onClick={() => setM(k)}><Icon name={ic} size={14} color="currentColor" />{t}</button>)}</div>
    <button type="button" className="fx-btn p inv" onClick={() => visiter(ouvrir, 'Je voudrais visiter le ' + L.titre + ', ' + L.secteur + ' (' + L.ref + ') le ' + fj(jours[j]) + ', ' + {
      matin: 'en matinée',
      apm: 'en après-midi',
      soir: 'en soirée'
    }[m] + '.')}><Icon name="message-circle" size={18} color="currentColor" />Demander ce moment à Cléo</button>
    <small className="fx-moment-n">Cléo confirme par écrit et vous rappelle 24 h et 2 h avant.</small></div>;
}
/* Contenus partagés avec fiche-details.jsx (6 options de la section « Le logement en détail »). */
const ImmeubleT = () => <ol className="fx-temps">{[[L.annee, 'Construction du plex', 'building-2'], [2024, 'Cuisine et salle de bain refaites', 'hammer'], ['Aujourd’hui', 'Entretien suivi : chaque demande est rattachée au logement jusqu’à la fermeture du dossier', 'wrench']].map(([a, t, ic]) => <li key={t}><span aria-hidden="true"><Icon name={ic} size={16} color="currentColor" /></span><b>{a}</b><p>{t}</p></li>)}</ol>;
const SecteurT = () => <div className="fx-a-sect"><Proche /><Carte /></div>;
const ConditionsT = () => <><p className="fx-p">Bail de {L.bail}. Animaux acceptés sous conditions. La sélection suit des critères objectifs, dans le respect de la loi et de la Charte des droits et libertés de la personne.</p><p className="fx-note"><Icon name="shield-check" size={17} color="currentColor" />Décision automatisée : vous pouvez en connaître les motifs et demander qu’une personne la révise.</p></>;
const ONG = [['apercu', 'Aperçu'], ['inclus', 'Inclus'], ['immeuble', 'L’immeuble'], ['secteur', 'Le secteur'], ['conditions', 'Conditions']];
function Onglets() {
  const [o, setO] = uS('apercu'),
    refs = uR([]),
    barre = uR(null);
  uE(() => {
    const b = refs.current[ONG.findIndex(x => x[0] === o)],
      t = barre.current;
    if (b && t) {
      t.style.width = b.offsetWidth + 'px';
      t.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    }
  }, [o]);
  const cle = (e, k) => {
    let n = null;
    if (e.key === 'ArrowRight') n = (k + 1) % ONG.length;
    if (e.key === 'ArrowLeft') n = (k - 1 + ONG.length) % ONG.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = ONG.length - 1;
    if (n !== null) {
      e.preventDefault();
      setO(ONG[n][0]);
      refs.current[n].focus();
    }
  };
  return <div className="fx-ong"><div role="tablist" aria-label="Détails du logement" className="fx-ong-l">{ONG.map(([k, t], i) => <button key={k} ref={el => refs.current[i] = el} type="button" role="tab" id={'fb-t-' + k} aria-controls={'fb-p-' + k} aria-selected={o === k} tabIndex={o === k ? 0 : -1} onClick={() => setO(k)} onKeyDown={e => cle(e, i)}>{t}</button>)}<i ref={barre} aria-hidden="true" /></div>
    <div role="tabpanel" id={'fb-p-' + o} aria-labelledby={'fb-t-' + o} tabIndex={0} className="fx-ong-p" key={o}>
      {o === 'apercu' && <><p className="fx-p">{DESC}</p><p className="fx-p">{DESC2}</p><p className="fx-ref">Réf. {L.ref}</p><Groupes className="fx-grp-3" /></>}
      {o === 'inclus' && <Inclus cols="repeat(3,minmax(0,1fr))" />}
      {o === 'immeuble' && <ol className="fx-temps">{[[L.annee, 'Construction du plex', 'building-2'], [2024, 'Cuisine et salle de bain refaites', 'hammer'], ['Aujourd’hui', 'Entretien suivi : chaque demande est rattachée au logement jusqu’à la fermeture du dossier', 'wrench']].map(([a, t, ic]) => <li key={t}><span aria-hidden="true"><Icon name={ic} size={16} color="currentColor" /></span><b>{a}</b><p>{t}</p></li>)}</ol>}
      {o === 'secteur' && <div className="fx-a-sect"><Proche /><Carte /></div>}
      {o === 'conditions' && <><p className="fx-p">Bail de {L.bail}. Animaux acceptés sous conditions. La sélection suit des critères objectifs, dans le respect de la loi et de la Charte des droits et libertés de la personne.</p><p className="fx-note"><Icon name="shield-check" size={17} color="currentColor" />Décision automatisée : vous pouvez en connaître les motifs et demander qu’une personne la révise.</p></>}
    </div></div>;
}
/* ——— Option B · en-tête (héros) : trois options visuelles en revue (9 oct. 2026) + l'actuel ———
   1 « Plein cadre » : la photo occupe tout l'en-tête, voile marine, texte sur la photo, vignettes en bas.
   2 « Fiche claire » : fond pâle, mosaïque de 3 photos (glissement sur mobile), carte d'information avec prix, actions et les 6 caractéristiques.
   3 « Cinéma »       : bandeau marine centré, grande photo panoramique, barre de décision blanche (prix · caractéristiques · actions) qui chevauche la photo.
   Bascule en bas d'écran, mémorisée dans localStorage « ll-fiche-heros » ou ?heros=0|1|2|3. */
const RUBAN = [[L.grandeur, 'Grandeur'], [L.chambres, 'Chambres', 1], [L.sdb, 'Salle de bain', 1], [L.sup, 'Superficie', 1, ' pi²'], [L.annee, 'Construit en'], [L.emmenagement, 'Libre le']];
const RubanItems = () => RUBAN.map(([v, t, c, suf], i) => <div key={t} style={{
  '--d': i * 70 + 'ms'
}}><dt>{t}</dt><dd>{c ? <Compte n={v} suf={suf || ''} /> : v}</dd></div>);
const Ruban = () => <div className="fx-in"><Vu as="dl" className="fx-ruban"><RubanItems /></Vu></div>;
const Prix = ({
  c
}) => <p className={'fx-prix' + (c ? ' c' : '')}><b><Compte n={L.prix} fmt={x => x.toLocaleString('fr-CA')} /> $</b><small>/ mois</small></p>;
const Pastilles = ({
  sombre,
  texte,
  sansRef
}) => <div className="fx-pastilles"><span className={'fx-pas v' + (sombre ? ' sombre' : '')}><i aria-hidden="true" />{texte || L.dispo}</span>{!sansRef && <span className={'fx-ref' + (sombre ? ' c' : '')}>Réf. {L.ref}</span>}</div>;
const Titre = ({
  c
}) => <h1 id="fb-h1" className={'fx-h1' + (c ? ' c' : '')}>{L.titre}, <span>{L.secteur}</span></h1>;
const Adresse = ({
  c,
  simple
}) => simple ? <p className={'fx-adr' + (c ? ' c' : '')}>{L.adresse}, {L.ville.replace(/\s*\(Québec\)/, '')}</p> : <p className={'fx-adr' + (c ? ' c' : '')}><Icon name="map-pin" size={16} color="currentColor" />{L.adresse}, {L.ville}</p>;
const Vignettes = ({
  ph,
  setPh,
  className
}) => <div className={className} role="group" aria-label="Choisir une photo">{PHOTOS.map((p, k) => <button key={k} type="button" aria-pressed={k === ph} aria-label={p.lib} onClick={() => setPh(k)}><Photo p={p} /></button>)}</div>;
/* Galerie à glisser (mobile) : une photo par écran, compteur à jour au glissement, toucher = plein écran. */

function HerosPlein({
  ouvrir,
  ph,
  setPh,
  ouvrirVis
}) {
  return <>
    <section className="fh1 ll-sombre" aria-labelledby="fb-h1">
      <div className="fh1-fond" aria-hidden="true"><span key={ph} className="fh1-fond-i"><Photo p={PHOTOS[ph]} eager /></span></div>
      <div className="fx-in fh1-in">
        <div className="fh1-haut"><Retour clair court /><Pastilles sombre texte={L.emmenagement} sansRef /><button type="button" className="fh1-agr" onClick={() => ouvrirVis(ph)} aria-label={'Voir les ' + PHOTOS.length + ' photos'}><Icon name="camera" size={16} color="currentColor" />{PHOTOS.length} photos</button></div>
        <div className="fh1-bas">
          <div className="fh1-tx"><Titre c /><Adresse c simple /><Prix c /><Actions ouvrir={ouvrir} sombre /></div>
          <Vignettes ph={ph} setPh={setPh} className="fh1-mini" /></div>
      </div></section>
    <Ruban /></>;
}
const CSS_H = `
/* Compatibilité (remplace l'anneau 4/4) */
.fx-match{position:relative;overflow:hidden;display:grid;gap:14px;padding:22px 22px 20px;border-radius:18px;background:var(--degrade-marine,#0C2147);color:#fff;box-shadow:0 24px 50px -30px rgba(12,33,71,.7)}
.fx-match::before{content:'';position:absolute;inset:0;background:radial-gradient(60% 80% at 100% 0%,rgba(91,154,232,.3),transparent 60%);pointer-events:none}
.fx-match.tout::before{background:radial-gradient(60% 80% at 100% 0%,rgba(63,179,127,.35),transparent 60%)}
.fx-match>*{position:relative}
.fx-match-h{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
.fx-match-lab{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#B5CDEA}
.fx-match.tout .fx-match-lab{color:#8FE3B9}
.fx-match-pct{font-size:44px;font-weight:700;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums;animation:fx-pop .5s cubic-bezier(.34,1.56,.64,1) both}
.fx-match-pct small{font-size:18px;font-weight:600;color:#B5CDEA;letter-spacing:0}
@keyframes fx-pop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
.fx-match-seg{display:flex;gap:5px;height:10px}
.fx-match-seg span{flex:1;border-radius:5px;background:rgba(255,255,255,.16);overflow:hidden;position:relative}
.fx-match-seg span::after{content:'';position:absolute;inset:0;border-radius:5px;transform-origin:0 50%;transform:scaleX(0);animation:fx-seg .6s cubic-bezier(.22,1,.36,1) var(--d,0ms) forwards}
.fx-match-seg span[data-ok="1"]::after{background:linear-gradient(90deg,#3FB37F,#6FD3A3)}
.fx-match-seg span[data-ok="0"]::after{background:rgba(255,255,255,.08)}
@keyframes fx-seg{to{transform:none}}
.fx-match .fx-crit-t{margin:2px 0 0;font-size:15px;font-weight:700;color:#fff}
.fx-match .fx-crit-l{gap:8px}
.fx-match .fx-crit-l li{gap:6px;min-height:30px;padding:0 11px 0 9px;border-radius:9px;background:rgba(63,179,127,.16);border:1px solid rgba(63,179,127,.4);color:#BFEEDD;font-size:12.5px}
.fx-match .fx-crit-l li[data-ok="0"]{background:rgba(255,255,255,.06);border-color:rgba(181,205,234,.25);color:#B5CDEA;text-decoration:line-through;text-decoration-color:rgba(181,205,234,.5)}
@media (max-width:620px){.fx-match{text-align:center}.fx-match-h{flex-direction:column;align-items:center;gap:6px}.fx-match .fx-crit-l{justify-content:center}}
/* Mobile : carte carrée (1:1), composition centrée et aérée. Les critères respectés sont déjà visibles dans les puces au-dessus :
   seuls les critères manquants restent affichés; les autres restent lus par les lecteurs d'écran. */
@media (max-width:620px){
  .fx-match{aspect-ratio:1/1;align-content:center;justify-items:center;gap:20px;padding:30px 26px}
  .fx-match-h{gap:12px}
  .fx-match-pct{font-size:60px}.fx-match-pct small{font-size:22px}
  .fx-match-seg{width:100%;gap:6px;height:8px}
  .fx-match .fx-crit-t{margin:0;max-width:22ch;line-height:1.4}
  .fx-match .fx-crit-l li[data-ok="1"],.fx-match.tout>.fx-crit-l{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
}
@media (prefers-reduced-motion:reduce){.fx-match-pct{animation:none}.fx-match-seg span::after{animation:none;transform:none}}

/* 1 · Plein cadre */
.fh1{position:relative;isolation:isolate;overflow:hidden;display:flex;min-height:clamp(560px,80vh,760px);background:var(--marine-900);color:#fff}
.fh1-fond{position:absolute;inset:0;z-index:-2}
.fh1-fond-i{position:absolute;inset:0;display:block;animation:fx-kb 12s ease-out both}.fh1-fond-i>*{width:100%;height:100%;object-fit:cover}
.fh1-fond .fx-ph{background:#12305A;color:rgba(255,255,255,.45)}.fh1-fond .fx-ph b,.fh1-fond .fx-ph small{display:none}
.fh1::after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(12,33,71,.95) 0%,rgba(12,33,71,.78) 40%,rgba(12,33,71,.12) 78%),linear-gradient(0deg,rgba(12,33,71,.92) 0%,rgba(12,33,71,0) 45%)}
.fh1-in{width:100%;display:grid;grid-template-rows:auto 1fr;gap:24px;padding-top:24px;padding-bottom:104px}
.fh1-haut{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:12px}.fh1-haut>:first-child{justify-self:start}.fh1-haut>:last-child{justify-self:end}.fh1-haut .fx-pastilles{margin:0;justify-self:center}
.fh1-agr{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border-radius:10px;border:1px solid rgba(255,255,255,.35);background:rgba(12,33,71,.4);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#fff;font:600 13.5px var(--police-corps);cursor:pointer;transition:background-color .2s,border-color .2s}
.fh1-agr:hover{background:rgba(255,255,255,.14);border-color:#fff}
.fh1-haut .fh1-agr{min-height:30px;height:30px;padding:0 12px;border-radius:8px;font-size:12.5px;gap:6px}
.fh1-haut .fx-pas{color:#fff}.fh1-haut .fx-pas i{background:#3FB37F;animation-name:fh-pouls-b}
@keyframes fh-pouls-b{0%{box-shadow:0 0 0 0 rgba(63,179,127,.55)}70%{box-shadow:0 0 0 7px rgba(63,179,127,0)}100%{box-shadow:0 0 0 0 rgba(63,179,127,0)}}
.fh1-haut :is(.fh1-agr,.fx-pas){min-width:106px;justify-content:center;box-sizing:border-box}
.fh1-bas{align-self:end;display:flex;justify-content:space-between;align-items:flex-end;gap:32px}
.fh1-tx{display:grid;gap:4px;justify-items:start;max-width:600px}.fh1-tx .fx-prix{margin:18px 0 22px}.fh1-tx .fx-act{width:100%;max-width:380px}
.fh1-tx>*{animation:fx-monte .8s var(--e) both}.fh1-tx>*:nth-child(2){animation-delay:.07s}.fh1-tx>*:nth-child(3){animation-delay:.14s}.fh1-tx>*:nth-child(4){animation-delay:.21s}.fh1-tx>*:nth-child(5){animation-delay:.28s}
.fh1-mini{display:flex;gap:8px;flex:none}
.fh1-mini button{width:72px;aspect-ratio:4/3;padding:0;border-radius:10px;overflow:hidden;border:2px solid rgba(255,255,255,.25);background:#12305A;opacity:.7;cursor:pointer;transition:opacity .2s,border-color .2s,transform .25s var(--e)}
.fh1-mini button[aria-pressed=true]{opacity:1;border-color:#fff;transform:translateY(-4px)}.fh1-mini button:hover{opacity:1}
.fh1-mini .fx-ph b,.fh1-mini .fx-ph small{display:none}.fh1-mini .fx-ph{padding:0}
/* 2 · Fiche claire */
.fh2{background:var(--surface-douce,#F4F7FB);padding:16px 0 56px}
.fh2-haut{margin-bottom:8px}
.fh2-g{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:24px;align-items:stretch}
.fh2-mos{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:10px;height:100%;min-height:480px}
.fh2-mos button{position:relative;padding:0;border:0;border-radius:18px;overflow:hidden;cursor:zoom-in;background:#DCE6F2;animation:fx-monte .8s var(--e) both}
.fh2-m0{grid-row:1/3}.fh2-m1{animation-delay:.08s!important}.fh2-m2{animation-delay:.16s!important}
.fh2-mos button>:is(.fx-img,.fx-ph){position:absolute;inset:0;transition:transform .7s var(--e)}
.fh2-mos button:hover>:is(.fx-img,.fx-ph){transform:scale(1.04)}
.fh2-m2:has(.fh2-plus) .fx-ph>*{visibility:hidden}
.fh2-plus{position:absolute;inset:0;display:grid;place-items:center;background:rgba(12,33,71,.6);color:#fff;font:600 15px var(--police-corps)}
.fh2-carte{display:grid;gap:4px;align-content:start;justify-items:start;padding:28px;border-radius:20px;background:#fff;border:var(--fx-b);box-shadow:0 30px 60px -40px rgba(12,33,71,.45);animation:fx-monte .8s var(--e) .12s both}
.fh2-carte .fx-h1{font-size:clamp(28px,3vw,40px)}.fh2-carte .fx-prix{margin:16px 0 0}.fh2-carte .fx-act{width:100%;max-width:none;margin-top:20px}
.fh2-specs{width:100%;margin:18px 0 0;padding:18px 0 0;border-top:var(--fx-b);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px 12px}
.fh2-specs dt{font-size:12px;color:var(--gris-600)}.fh2-specs dd{margin:2px 0 0;font-size:18px;font-weight:700;letter-spacing:-.01em;color:var(--marine-900);font-variant-numeric:tabular-nums}
.fh-glisse{display:none;position:relative}
.fh-glisse-r{display:grid;grid-auto-flow:column;grid-auto-columns:100%;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none;border-radius:18px}
.fh-glisse-r::-webkit-scrollbar{display:none}.fh-glisse-r:focus-visible{outline:2px solid var(--bleu-500);outline-offset:3px}
.fh-glisse-p{position:relative;aspect-ratio:4/3;padding:0;border:0;scroll-snap-align:start;background:#DCE6F2;cursor:zoom-in}
.fh-glisse-p>*{position:absolute;inset:0}
.fh-glisse-ct{position:absolute;right:12px;bottom:12px;padding:6px 10px;border-radius:8px;background:rgba(12,33,71,.78);color:#fff;font-size:12.5px;font-weight:600;pointer-events:none}
/* 3 · Cinéma */
.fh3-bande{position:relative;overflow:hidden;background:var(--degrade-marine);color:#fff;padding:20px 0 168px}
.fh3-bande::before{content:'';position:absolute;inset:0;background:radial-gradient(55% 80% at 50% 0%,rgba(91,154,232,.3),transparent 65%);pointer-events:none}
.fh3-retour{position:relative}
.fh3-tx{position:relative;display:grid;gap:6px;justify-items:center;text-align:center;max-width:820px;margin:8px auto 0}
.fh3-tx .fx-pastilles,.fh3-tx .fx-adr{justify-content:center}
.fh3-tx>*{animation:fx-monte .8s var(--e) both}.fh3-tx>*:nth-child(2){animation-delay:.08s}.fh3-tx>*:nth-child(3){animation-delay:.16s}
.fh3-media{position:relative;margin-top:-136px}
.fh3-ph{position:relative;display:block;width:100%;aspect-ratio:21/9;padding:0;border:0;border-radius:24px;overflow:hidden;cursor:zoom-in;background:#12305A;box-shadow:0 40px 80px -44px rgba(12,33,71,.6);animation:fx-monte .9s var(--e) .1s both}
.fh3-ph-i{position:absolute;inset:0;display:block;animation:fx-kb 12s ease-out both}.fh3-ph-i>*{height:100%}
.fh3-mini{position:absolute;top:18px;right:calc(var(--web-gouttiere) + 18px);display:flex;gap:6px}
.fh3-mini button{width:60px;aspect-ratio:4/3;padding:0;border-radius:8px;overflow:hidden;border:2px solid rgba(255,255,255,.45);background:#12305A;opacity:.75;cursor:pointer;transition:opacity .2s,border-color .2s}
.fh3-mini button[aria-pressed=true]{opacity:1;border-color:#fff}.fh3-mini .fx-ph b,.fh3-mini .fx-ph small{display:none}.fh3-mini .fx-ph{padding:0}
.fh3-carte{position:relative;z-index:2;margin:-64px 32px 0;display:grid;grid-template-columns:auto minmax(0,1fr) 250px;gap:28px;align-items:center;padding:22px 28px;border-radius:20px;background:#fff;border:var(--fx-b);box-shadow:0 30px 60px -36px rgba(12,33,71,.45);animation:fx-monte .8s var(--e) .25s both}
.fh3-carte .fx-prix b{font-size:32px}.fh3-carte .fx-act{max-width:none;margin:0}
.fh3-specs{margin:0;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;text-align:center}
.fh3-specs>div{padding:0 4px;border-left:var(--fx-b)}.fh3-specs>div:first-child{border-left:0}
.fh3-specs dt{font-size:12px;color:var(--gris-600)}.fh3-specs dd{margin:3px 0 0;font-size:17px;font-weight:700;color:var(--marine-900);font-variant-numeric:tabular-nums}
/* Tablette */
@media (max-width:960px){
  .fh1-bas{flex-direction:column;align-items:flex-start}
  .fh2-g{grid-template-columns:minmax(0,1fr)}.fh2-mos{min-height:380px}
  .fh2-carte{grid-template-columns:minmax(0,1fr)}
  .fh3-carte{margin:-48px 16px 0;grid-template-columns:auto minmax(0,1fr)}.fh3-carte .fx-act{grid-column:1/-1;grid-template-columns:1fr 1fr}
  .fh3-specs{grid-template-columns:repeat(3,minmax(0,1fr));row-gap:14px}.fh3-specs>div:nth-child(4){border-left:0}
  .fh3-ph{aspect-ratio:16/9}
}
/* Mobile : tout centré */
@media (max-width:620px){
  .fh1{min-height:0}.fh1-fond{bottom:auto;height:448px}.fh1::after{background:linear-gradient(180deg,rgba(12,33,71,.28) 0,rgba(12,33,71,0) 120px,rgba(12,33,71,0) 147.4px,rgba(12,33,71,.55) 372.3px,var(--marine-900) 448px)}/* dégradé sombre −15 % d'opacité (.33/.65 → .28/.55); voile marine à 15 % derrière le bloc texte */.fh1-tx{position:relative;isolation:isolate}.fh1-tx::before{content:'';position:absolute;z-index:-1;left:-24px;right:-24px;top:-28px;bottom:-20px;background:radial-gradient(closest-side,rgba(12,33,71,.15),rgba(12,33,71,.15) 55%,rgba(12,33,71,0));pointer-events:none}/* dégradé étiré de 20 % de plus vers le haut (début 184,9 → 147,4 px), voile à 65 %, puis marine plein au bas de la photo (aucune ligne de coupe) *//* bloc titre 25 % plus bas (190 → 237,5 px); titre → adresse −25 % (16 → 12 px); adresse → prix −35 % (22 → 14,3 px) */.fh1-bas{padding-top:237.5px}.fh1-tx .fx-adr{margin-top:8px;position:relative;top:5px;font-size:11.9px;color:#CBDCF0;-webkit-text-stroke:.22px currentColor}/* adresse seule descendue de 20 % de sa hauteur (≈ 5 px), sans déplacer le reste */.fh1-tx .fx-prix{margin-top:10.3px}
  .fh1-in{padding-top:12px;padding-bottom:88px}.fh1-haut{display:flex;justify-content:space-between;flex-wrap:nowrap;gap:6px;padding:0 8px}.fh1-haut .fx-retour{white-space:nowrap}.fh1-haut .fx-pastilles{zoom:.85}.fh1-haut .fx-retour{zoom:.81}.fh1-haut .fh1-agr{zoom:.85}
  .fh1-bas{align-items:center}.fh1-tx{justify-items:center;text-align:center;margin:0 auto;max-width:none}.fh1-tx :is(.fx-pastilles,.fx-adr,.fx-prix){justify-content:center}.fh1-tx .fx-act{max-width:none;zoom:1.0125;justify-self:center;width:100%!important}/* boutons +20 % (0,84375 → 1,0125), pleine largeur */.fh1-tx .fx-h1{font-size:26.25px!important;text-shadow:0 2px 14px rgba(0,0,0,.4)}.fh1-tx{zoom:1.1}/* boutons +12,5 % (0,75 → 0,84); titre −12,5 % (30 → 26,25 px) */
  .fh1-mini{justify-content:center;flex-wrap:wrap;width:100%}.fh1-mini button{width:54px}
  .fh2{padding-top:8px}.fh2-haut{text-align:center}.fh2-mos{display:none}.fh-glisse{display:block}
  .fh2-carte{justify-items:center;text-align:center;padding:24px 20px}.fh2-carte :is(.fx-pastilles,.fx-adr,.fx-prix){justify-content:center}.fh2-specs{text-align:center}
  .fh3-bande{padding-bottom:120px}.fh3-retour{text-align:center}.fh3-media{margin-top:-96px}.fh3-ph{aspect-ratio:4/3;border-radius:18px}.fh3-mini{display:none}
  .fh3-carte{margin:-36px 6px 0;grid-template-columns:minmax(0,1fr);justify-items:center;text-align:center;gap:18px;padding:22px 18px}.fh3-carte .fx-act{grid-template-columns:1fr;width:100%}
}
@media (prefers-reduced-motion:reduce){.fh1-fond-i,.fh3-ph-i,.fh1-tx>*,.fh3-tx>*,.fh2-mos button,.fh2-carte,.fh3-ph,.fh3-carte{animation:none!important}.fh2-mos button>*{transition:none!important}}
/* 4 · Diptyque */
.fh4{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);min-height:clamp(540px,74vh,720px)}
.fh4-tx{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:flex-end;padding:32px clamp(24px,5vw,72px) 112px;background:var(--degrade-marine);color:#fff}
.fh4-tx::before{content:'';position:absolute;inset:0;background:radial-gradient(70% 60% at 0% 0%,rgba(91,154,232,.25),transparent 60%);pointer-events:none}
.fh4-tx-in{position:relative;width:100%;max-width:520px;display:grid;gap:4px;justify-items:start}.fh4-tx-in .fx-retour{margin-bottom:12px}.fh4-tx-in .fx-prix{margin:18px 0 22px}.fh4-tx-in .fx-act{width:100%;max-width:380px}
.fh4-tx-in>*{animation:fx-monte .8s var(--e) both}.fh4-tx-in>*:nth-child(2){animation-delay:.06s}.fh4-tx-in>*:nth-child(3){animation-delay:.12s}.fh4-tx-in>*:nth-child(4){animation-delay:.18s}.fh4-tx-in>*:nth-child(5){animation-delay:.24s}.fh4-tx-in>*:nth-child(6){animation-delay:.3s}
.fh4-media{position:relative;min-height:320px;background:#12305A}
.fh4-ph{position:absolute;inset:0;display:block;padding:0;border:0;overflow:hidden;cursor:zoom-in;background:#12305A}
.fh4 .fx-b-ct{top:16px;bottom:auto;right:16px}
.fh4-ph-i{position:absolute;inset:0;display:block;animation:fh-glisse-g 1s var(--e) both}.fh4-ph-i>*{height:100%}
@keyframes fh-glisse-g{from{opacity:0;transform:scale(1.06) translateX(24px)}to{opacity:1;transform:none}}
.fh4-mini{position:absolute;right:20px;top:50%;transform:translateY(-50%);display:grid;gap:8px}
.fh4-mini button{width:64px;aspect-ratio:4/3;padding:0;border-radius:10px;overflow:hidden;border:2px solid rgba(255,255,255,.4);background:#12305A;opacity:.8;cursor:pointer;transition:opacity .2s,border-color .2s,transform .25s var(--e)}
.fh4-mini button[aria-pressed=true]{opacity:1;border-color:#fff;transform:translateX(-4px)}.fh4-mini .fx-ph b,.fh4-mini .fx-ph small{display:none}.fh4-mini .fx-ph{padding:0}
/* 5 · Bento */
.fh5{background:#fff;padding:16px 0 8px}.fh5-haut{margin-bottom:8px}
.fh5-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,250px));grid-template-areas:"info big big s1" "info big big s2";gap:12px}
.fh5-info{grid-area:info;position:relative;overflow:hidden;display:grid;gap:4px;align-content:center;justify-items:start;padding:28px 24px;border-radius:22px;background:var(--degrade-marine);color:#fff;animation:fx-monte .8s var(--e) both}
.fh5-info::before{content:'';position:absolute;inset:0;background:radial-gradient(80% 60% at 100% 0%,rgba(91,154,232,.28),transparent 60%);pointer-events:none}
.fh5-info>*{position:relative}.fh5-info .fx-h1{font-size:clamp(28px,2.6vw,38px)}.fh5-info .fx-prix{margin:14px 0 18px}.fh5-info .fx-prix b{font-size:32px}.fh5-info .fx-act{width:100%;max-width:none}
.fh5-ph{position:relative;padding:0;border:0;border-radius:22px;overflow:hidden;cursor:zoom-in;background:#DCE6F2;animation:fx-monte .8s var(--e) both}
.fh5-ph>:is(.fx-img,.fx-ph){position:absolute;inset:0;transition:transform .7s var(--e)}.fh5-ph:hover>:is(.fx-img,.fx-ph){transform:scale(1.04)}
.fh5-p0{grid-area:big;animation-delay:.08s}.fh5-p1{grid-area:s1;animation-delay:.16s}.fh5-p2{grid-area:s2;animation-delay:.24s}
.fh5-p2:has(.fh2-plus) .fx-ph>*{visibility:hidden}
.fh5-ruban{margin:16px 0 0!important}
/* 6 · Fenêtre */
.fh6{background:linear-gradient(180deg,#fff 0%,var(--bleu-025) 100%);padding:16px 0 8px;overflow:hidden}.fh6-haut{margin-bottom:8px}
.fh6-g{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:56px;align-items:center}
.fh6-tx{display:grid;gap:4px;justify-items:start}.fh6-tx .fx-h1{font-size:clamp(34px,4.6vw,60px)}.fh6-tx .fx-prix{margin:18px 0 22px}.fh6-tx .fx-act{width:100%;max-width:380px}
.fh6-tx>*{animation:fx-monte .8s var(--e) both}.fh6-tx>*:nth-child(2){animation-delay:.06s}.fh6-tx>*:nth-child(3){animation-delay:.12s}.fh6-tx>*:nth-child(4){animation-delay:.18s}.fh6-tx>*:nth-child(5){animation-delay:.24s}
.fh6-media{position:relative;display:grid;justify-items:center;gap:16px;padding-top:6%}
.fh6-toit{position:absolute;left:-3%;right:-3%;top:0;width:106%;height:22%;color:var(--bleu-300);animation:fh-trace 1.4s var(--e) .3s both}
@keyframes fh-trace{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.fh6-ph{position:relative;display:block;width:100%;aspect-ratio:5/4;padding:0;border:0;cursor:zoom-in;background:#12305A;clip-path:polygon(50% 0,100% 26%,100% 100%,0 100%,0 26%);animation:fh-fenetre 1.1s var(--e) both;filter:drop-shadow(0 30px 50px rgba(12,33,71,.3))}
@keyframes fh-fenetre{from{clip-path:polygon(50% 100%,100% 100%,100% 100%,0 100%,0 100%)}to{clip-path:polygon(50% 0,100% 26%,100% 100%,0 100%,0 26%)}}
.fh6-ph-i{position:absolute;inset:0;display:block;animation:fx-fondu .6s ease both}.fh6-ph-i>*{height:100%}
.fh6-pts{display:flex;gap:4px}
.fh6-pts button{position:relative;width:28px;height:28px;padding:0;border:0;background:none;cursor:pointer}
.fh6-pts button::before{content:'';position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:4px;background:rgba(12,33,71,.22);transition:width .3s var(--e),margin .3s var(--e),background-color .3s}
.fh6-pts button[aria-pressed=true]::before{width:22px;margin-left:-11px;background:var(--marine-900)}
.fh6-ruban{margin:32px 0 0!important}
/* 7 · Pellicule */
.fh7{background:var(--degrade-marine);color:#fff;padding:20px 0 104px;overflow:hidden}
.fh7-haut{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.fh7-haut .fx-pastilles{margin:0}
.fh7-film{position:relative}
.fh7-r{display:grid;grid-auto-flow:column;grid-auto-columns:clamp(280px,42vw,620px);gap:12px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none;padding:0 var(--web-gouttiere);scroll-padding:0 var(--web-gouttiere)}
.fh7-r::-webkit-scrollbar{display:none}.fh7-r:focus-visible{outline:2px solid var(--bleu-300);outline-offset:-2px}
.fh7-p{position:relative;aspect-ratio:4/3;padding:0;border:0;border-radius:18px;overflow:hidden;scroll-snap-align:start;cursor:zoom-in;background:#12305A;animation:fh-film .8s var(--e) var(--d,0ms) both}
@keyframes fh-film{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
.fh7-p>:is(.fx-img,.fx-ph){position:absolute;inset:0}.fh7-p .fx-ph{background:linear-gradient(150deg,#1A3A66,#12305A);color:rgba(255,255,255,.6)}
.fh7-lib{position:absolute;left:12px;bottom:12px;padding:6px 10px;border-radius:8px;background:rgba(12,33,71,.75);color:#fff;font-size:12.5px;font-weight:600}
.fh7-p .fx-ph b,.fh7-p .fx-ph small{display:none}
.fh7-fl{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;display:grid;place-items:center;border-radius:12px;border:1px solid rgba(255,255,255,.4);background:rgba(12,33,71,.7);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:#fff;cursor:pointer;transition:background-color .2s}
.fh7-fl:hover{background:var(--marine-900)}.fh7-fl.g{left:calc(var(--web-gouttiere) + 10px)}.fh7-fl.d{right:calc(var(--web-gouttiere) + 10px)}
.fh7-bas{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:24px 48px;margin-top:28px}
.fh7-tx{display:grid;gap:4px;max-width:640px;animation:fx-monte .8s var(--e) .2s both}
.fh7-act{display:grid;gap:12px;justify-items:start;animation:fx-monte .8s var(--e) .3s both}.fh7-act .fx-act{grid-template-columns:auto auto;width:auto;max-width:none}
/* Tablette */
@media (max-width:960px){
  .fh4{grid-template-columns:minmax(0,1fr);min-height:0}.fh4-media{order:-1;aspect-ratio:16/9;min-height:0}.fh4-mini{top:auto;bottom:14px;right:50%;transform:translateX(50%);grid-auto-flow:column}.fh4-mini button[aria-pressed=true]{transform:translateY(-4px)}
  .fh4-tx{justify-content:center;padding:32px var(--web-gouttiere) 104px}.fh4-tx-in{max-width:620px}
  .fh5-g{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:auto;grid-template-areas:"big big" "info info" "s1 s2"}.fh5-p0{aspect-ratio:16/9}.fh5-p1,.fh5-p2{aspect-ratio:4/3}
  .fh6-g{grid-template-columns:minmax(0,1fr);gap:28px}.fh6-media{order:-1;width:min(560px,100%);margin:0 auto}
  .fh7-act .fx-act{grid-template-columns:1fr 1fr}
}
/* Mobile : tout centré */
@media (max-width:620px){
  .fh4-media{aspect-ratio:4/3}.fh4-mini button{width:52px}
  .fh4-tx{padding:28px var(--web-gouttiere) 88px}.fh4-tx-in{justify-items:center;text-align:center}.fh4-tx-in :is(.fx-pastilles,.fx-adr,.fx-prix){justify-content:center}.fh4-tx-in .fx-act{max-width:none}
  .fh5-haut,.fh6-haut{text-align:center}.fh5-g{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}.fh5-p0{aspect-ratio:4/3}
  .fh5-info{justify-items:center;text-align:center;padding:24px 18px}.fh5-info :is(.fx-pastilles,.fx-adr,.fx-prix){justify-content:center}
  .fh6-media{width:100%}.fh6-tx{justify-items:center;text-align:center}.fh6-tx :is(.fx-pastilles,.fx-adr,.fx-prix){justify-content:center}.fh6-tx .fx-act{max-width:none}.fh6-ruban{margin-top:24px!important}
  .fh7{padding-bottom:88px}.fh7-haut{flex-direction:column}.fh7-r{grid-auto-columns:86%}.fh7-fl{display:none}
  .fh7-bas{flex-direction:column;align-items:stretch;text-align:center}.fh7-tx{justify-items:center;margin:0 auto}.fh7-tx .fx-adr{justify-content:center}
  .fh7-act{justify-items:center}.fh7-act .fx-prix{justify-content:center}.fh7-act .fx-act{grid-template-columns:1fr;width:100%}
}
@media (prefers-reduced-motion:reduce){.fh4-ph-i,.fh4-tx-in>*,.fh5-info,.fh5-ph,.fh6-tx>*,.fh6-toit,.fh6-ph,.fh6-ph-i,.fh7-p,.fh7-tx,.fh7-act{animation:none!important}.fh5-ph>*{transition:none!important}}
`;

/* 4 « Diptyque » : moitié marine (texte) / moitié photo pleine hauteur jusqu'au bord de l'écran, vignettes verticales sur la photo. */

/* 5 « Bento » : grille de tuiles — une tuile marine d'information parmi les photos; caractéristiques en ruban dessous. */

/* 6 « Fenêtre » : fond clair, photo découpée en forme de maison (le toit rappelle les chevrons du logo), révélée de bas en haut. */

/* 7 « Pellicule » : bandeau marine, pellicule de photos qui défile à l'horizontale (flèches et glissement), information en rangée dessous. */

/* En-tête retenu : 1 « Plein cadre » (choix final du 9 oct. 2026); bandeau de revue retiré. Les autres en-têtes restent dans ce fichier, inactifs. */
function FicheB({
  ouvrir
}) {
  const [vis, ouvrirVis] = useVis(),
    [ph, setPh] = uS(0);
  const hp = {
      ouvrir,
      ph,
      setPh,
      ouvrirVis
    },
    H = HerosPlein;
  return <div className="fx fx-b"><style>{CSS_H}</style>
    <H {...hp} />
    <div className="fx-in fx-b-corps">
      <section className="fx-sec" aria-labelledby="fb-2"><h2 id="fb-2" className="fx-h2">Le logement en détail</h2>{<FicheDetails />}</section>
      <section className="fx-sec fx-b-duo" aria-label="Vos critères et votre visite">
        <Vu className="fx-panneau"><h2 className="fx-h3">Ce logement et vos critères</h2><p className="fx-p">Les mêmes critères que la recherche avancée. Cochez ce qui compte pour vous.</p><Criteres /></Vu>
        <Vu className="fx-panneau sombre ll-sombre" style={{
          '--d': '120ms'
        }}><h2 className="fx-h3 c">Choisir un moment de visite</h2><p className="fx-p c">Proposez un moment; Cléo vérifie les disponibilités et confirme.</p><Moment ouvrir={ouvrir} /></Vu>
      </section>
    </div>
    <div className="fx-in"><Similaires /></div>
    {/* Barre d’actions mobile retirée (9 oct. 2026, jugée encombrante) */}{vis}
  </div>;
}

/* ======================= C · Parcours ======================= */

/* ——— Styles ——— */
const CSS = `.fx{--fx-b:1px solid var(--gris-100);--e:cubic-bezier(.22,1,.36,1);color:var(--texte-corps);font-family:var(--police-corps);padding-bottom:72px}
.fx-in{max-width:var(--web-conteneur);margin:0 auto;padding:0 var(--web-gouttiere);box-sizing:border-box}
.fx-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.fx-r{opacity:0;transform:translateY(18px);transition:opacity .7s var(--e) var(--d,0ms),transform .8s var(--e) var(--d,0ms)}.fx-r[data-vu]{opacity:1;transform:none}
.fx-h1{margin:0;font-size:clamp(30px,4.2vw,52px);line-height:1.12;letter-spacing:-.03em;font-weight:700;color:var(--marine-900);text-wrap:balance}.fx-h1 span{color:var(--bleu-500)}.fx-h1.c{color:#fff}.fx-h1.c span{color:var(--bleu-300)}
.fx-h2{margin:0 0 20px;font-size:clamp(22px,2.2vw,28px);line-height:1.25;letter-spacing:-.02em;font-weight:700;color:var(--marine-900)}.fx-h2.c{color:#fff}
.fx-h3{margin:0 0 8px;font-size:20px;line-height:1.3;font-weight:700;color:var(--marine-900)}.fx-h3.c{color:#fff}
.fx-p{margin:0 0 12px;max-width:62ch;font-size:14px;line-height:1.7;color:var(--texte-corps)}.fx-p.c{color:var(--bleu-100)}.fx-p b{color:var(--marine-900)}
.fx-lab{margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--gris-600)}
.fx-num{margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.14em;color:var(--bleu-600)}.fx-num.c{color:var(--bleu-300)}
.fx-adr{display:flex;align-items:center;gap:8px;margin:12px 0 0;font-size:14px;color:var(--gris-600)}.fx-adr svg{color:var(--bleu-500)}.fx-adr.c{color:var(--bleu-100)}.fx-adr.c svg{color:var(--bleu-300)}
.fx-pastilles{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:16px}
.fx-pas{display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 12px;border-radius:8px;background:var(--bleu-025);color:var(--bleu-700);font-size:12.5px;font-weight:600}
.fx-pas.v{background:var(--succes-100);color:var(--succes-600)}.fx-pas.v i{width:7px;height:7px;border-radius:50%;background:currentColor;animation:fx-pouls 2s infinite}
.fx-pas.sombre{background:rgba(63,179,127,.16);color:#bfeedd;border:1px solid rgba(63,179,127,.4)}
@keyframes fx-pouls{0%{box-shadow:0 0 0 0 rgba(23,121,94,.45)}70%{box-shadow:0 0 0 7px rgba(23,121,94,0)}100%{box-shadow:0 0 0 0 rgba(23,121,94,0)}}
.fx-ref{font-size:12.5px;color:var(--gris-600);font-variant-numeric:tabular-nums}.fx-ref.c{color:var(--bleu-100)}
.fx-retour{display:inline-flex;align-items:center;gap:8px;min-height:44px;font-size:13.5px;font-weight:600;color:var(--bleu-600);text-decoration:none}.fx-retour.c{color:#fff}
.fx-retour svg{transition:transform .25s var(--e)}.fx-retour:hover svg{transform:translateX(-3px)}
.fx-lien{display:inline-flex;align-items:center;gap:8px;min-height:44px;font-size:14px;font-weight:600;color:var(--bleu-600);text-decoration:none}.fx-lien svg{transition:transform .25s var(--e)}.fx-lien:hover svg{transform:translateX(3px)}
.fx-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 20px;border-radius:12px;border:1px solid transparent;font:600 15px var(--police-corps);text-decoration:none;cursor:pointer;transition:background-color .2s,border-color .2s,color .2s,transform .2s var(--e),box-shadow .2s;box-sizing:border-box}
.fx-btn:active{transform:scale(.98)}.fx-btn.p{background:var(--marine-900);color:#fff}.fx-btn.p:hover{background:var(--marine-700);box-shadow:0 10px 24px -12px rgba(12,33,71,.6)}
.fx-btn.s{background:#fff;color:var(--marine-900);border-color:rgba(12,33,71,.22)}.fx-btn.s:hover{border-color:var(--marine-900)}
.fx-btn.p.inv{background:#fff;color:var(--marine-900)}.fx-btn.p.inv:hover{background:var(--bleu-025)}.fx-btn.s.inv{background:transparent;color:#fff;border-color:rgba(255,255,255,.4)}.fx-btn.s.inv:hover{border-color:#fff}
.fx-btn:focus-visible,.fx-puce:focus-visible,.fx a:focus-visible,.fx button:focus-visible{outline:2px solid var(--bleu-500);outline-offset:3px}
.fx-btn-t{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:10px;border:var(--fx-b);background:#fff;font:600 13.5px var(--police-corps);color:var(--marine-900);cursor:pointer}
.fx-act{display:grid;gap:10px}
.fx-prix{display:flex;align-items:baseline;gap:8px;margin:0}.fx-prix b{font-size:36px;letter-spacing:-.03em;font-weight:700;color:var(--marine-900);font-variant-numeric:tabular-nums}.fx-prix small{font-size:14px;color:var(--gris-600)}.fx-prix.c b{color:#fff}.fx-prix.c small{color:var(--bleu-100)}
.fx-img{display:block;width:100%;height:100%;object-fit:cover}
.fx-ph{display:grid;place-items:center;align-content:center;gap:6px;width:100%;height:100%;background:linear-gradient(150deg,#EEF3F9,#DCE6F2);color:var(--bleu-500);text-align:center;padding:8px;box-sizing:border-box}
.fx-ph b{font-size:13px;font-weight:600;color:var(--marine-900)}.fx-ph small{font-size:12px;color:var(--gris-600)}
.fx-sec{padding:44px 0;border-top:var(--fx-b)}
.fx-grp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.fx-grp-c{border:var(--fx-b);border-radius:16px;padding:20px;background:#fff}
.fx-grp-c h3{display:flex;align-items:center;gap:10px;margin:0 0 12px;font-size:15px;font-weight:700;color:var(--marine-900)}
.fx-grp-c h3 span{display:grid;place-items:center;width:32px;height:32px;border-radius:9px;background:var(--marine-900);color:#fff}
.fx-grp-c dl{margin:0;display:grid}.fx-grp-c dl>div{display:grid;gap:2px;padding:10px 0;border-top:var(--fx-b)}
.fx-grp-c dt{font-size:12.5px;color:var(--gris-600)}.fx-grp-c dd{margin:0;font-size:14.5px;font-weight:600;color:var(--marine-900)}
.fx-incl{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.fx-incl li{position:relative;display:grid;grid-template-columns:40px minmax(0,1fr);gap:12px;align-items:center;padding:14px 40px 14px 14px;border-radius:14px;border:var(--fx-b);background:#fff}
.fx-incl-ic{display:grid;place-items:center;width:40px;height:40px;border-radius:10px;background:var(--bleu-025);color:var(--bleu-600)}
.fx-incl b{display:block;font-size:14px;font-weight:600;color:var(--marine-900)}.fx-incl small{font-size:12.5px;color:var(--gris-600)}
.fx-incl-e{position:absolute;right:12px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--gris-050);color:var(--gris-500)}
.fx-incl li[data-e=oui]{border-color:rgba(23,121,94,.3)}.fx-incl li[data-e=oui] .fx-incl-e{background:var(--succes-500);color:#fff}.fx-incl li[data-e=oui] .fx-incl-ic{background:var(--succes-100);color:var(--succes-600)}
.fx-incl li[data-e=non]{opacity:.78}.fx-incl li[data-e=cond] .fx-incl-e{background:var(--bleu-025);color:var(--bleu-600)}
.fx-proche{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.fx-proche li{position:relative;display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 0 16px;border-bottom:var(--fx-b)}
.fx-proche li>span:first-child{display:grid;place-items:center;width:32px;height:32px;border-radius:9px;background:var(--bleu-025);color:var(--bleu-600)}
.fx-proche b{font-size:14px;font-weight:600;color:var(--marine-900)}.fx-proche-d{font-size:13px;font-weight:600;color:var(--bleu-600);font-variant-numeric:tabular-nums}
.fx-proche i{position:absolute;left:44px;bottom:6px;height:3px;border-radius:3px;background:linear-gradient(90deg,var(--bleu-500),var(--bleu-200));width:var(--w);transform-origin:0 50%;transform:scaleX(0);transition:transform 1s var(--e) var(--d,0ms)}
[data-vu] .fx-proche i,.fx-ong-p .fx-proche i{transform:scaleX(1)}
.fx-a-sect{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:start;margin-bottom:8px}
.fx-note{display:flex;gap:12px;align-items:flex-start;margin:16px 0 0;padding:16px;border-radius:12px;background:var(--bleu-025);font-size:13.5px;line-height:1.6;color:var(--marine-900);max-width:62ch}.fx-note svg{flex:none;color:var(--bleu-600);margin-top:2px}
.fx-sim{padding:56px 0 24px;border-top:var(--fx-b)}.fx-sim-tete{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap}.fx-sim-tete .fx-h2{margin:0}
.fx-sim ul{list-style:none;margin:20px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.fx-sim-c{display:grid;grid-template-columns:96px minmax(0,1fr);gap:16px;align-items:center;padding:12px;border-radius:16px;border:var(--fx-b);background:#fff;text-decoration:none;color:inherit;transition:border-color .2s,transform .3s var(--e),box-shadow .3s}
.fx-sim-c:hover{border-color:var(--marine-900);transform:translateY(-3px);box-shadow:0 18px 36px -24px rgba(12,33,71,.5)}
.fx-sim-im{display:grid;place-items:center;aspect-ratio:1;border-radius:12px;background:linear-gradient(150deg,#EEF3F9,#DCE6F2);color:var(--bleu-400)}
.fx-sim-tx{display:grid;gap:3px;min-width:0}.fx-sim-tx b{font-size:17px;color:var(--marine-900)}.fx-sim-tx b small{font-size:12px;font-weight:500;color:var(--gris-600)}.fx-sim-tx>span{font-size:14px;font-weight:600;color:var(--marine-900)}.fx-sim-tx>small{font-size:12.5px;color:var(--gris-600)}
.fx-cleo{display:flex;gap:12px;align-items:center;margin:18px 0 0;padding-top:16px;border-top:var(--fx-b);font-size:13px;line-height:1.55;color:var(--gris-600)}.fx-cleo img{flex:none;border-radius:50%;object-fit:cover}
.fx-mini{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:18px 0 20px;padding:14px 0;border-top:var(--fx-b);border-bottom:var(--fx-b)}
.fx-mini dt{font-size:12px;color:var(--gris-600)}.fx-mini dd{margin:2px 0 0;font-size:14px;font-weight:700;color:var(--marine-900)}
.fx-barre{display:none}
/* Visionneuse */
.fx-vis{position:fixed;inset:0;z-index:3000;background:rgba(5,14,28,.94);display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:16px;padding:16px;animation:fx-fondu .25s ease both;font-family:var(--police-corps)}
@keyframes fx-fondu{from{opacity:0}to{opacity:1}}
.fx-vis-tete{display:flex;justify-content:space-between;align-items:center;color:#fff;font-size:14px;font-weight:600}
.fx-vis-tete button,.fx-vis-n{display:grid;place-items:center;width:48px;height:48px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;cursor:pointer}
.fx-vis-sc{display:grid;place-items:center;min-height:0;animation:fx-zoom .4s var(--e,ease) both}.fx-vis-sc>*{max-width:min(1200px,100%);max-height:100%;width:auto;height:auto;border-radius:12px}
.fx-vis-sc .fx-ph{width:min(900px,90vw);height:min(600px,60vh);border-radius:12px}
@keyframes fx-zoom{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
.fx-vis-n{position:absolute;top:50%;transform:translateY(-50%)}.fx-vis-n.g{left:16px}.fx-vis-n.d{right:16px}
.fx-vis-mini{display:flex;justify-content:center;gap:8px;overflow-x:auto}.fx-vis-mini button{flex:none;width:72px;height:52px;padding:0;border-radius:8px;overflow:hidden;border:2px solid transparent;cursor:pointer;opacity:.6}
.fx-vis-mini button[aria-current]{border-color:#fff;opacity:1}.fx-vis-mini .fx-ph b,.fx-vis-mini .fx-ph small{display:none}
/* ——— A ——— */
.fx-a-haut{display:flex;justify-content:space-between;align-items:center;padding-top:20px;padding-bottom:12px}
.fx-a-gal{position:relative;display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:repeat(2,minmax(0,220px));gap:10px;border-radius:20px;overflow:hidden}
.fx-a-cell{position:relative;padding:0;border:0;overflow:hidden;cursor:zoom-in;background:#EEF3F9}.fx-a-cell.c0{grid-row:1/3}
.fx-a-cell>*{transition:transform .9s var(--e)}.fx-a-cell:hover>*{transform:scale(1.04)}
.fx-a-cell{animation:fx-monte .8s var(--e) both}.fx-a-cell.c1{animation-delay:.08s}.fx-a-cell.c2{animation-delay:.14s}.fx-a-cell.c3{animation-delay:.2s}.fx-a-cell.c4{animation-delay:.26s}
@keyframes fx-monte{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.fx-a-tout{position:absolute;right:16px;bottom:16px;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border-radius:10px;border:0;background:#fff;box-shadow:0 8px 20px rgba(12,33,71,.2);font:600 13.5px var(--police-corps);color:var(--marine-900);cursor:pointer}
.fx-a-corps{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:56px;align-items:start;padding-top:40px}
.fx-a-tit{padding-bottom:28px}
.fx-a-cles{list-style:none;margin:0 0 8px;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.fx-a-cles li{display:grid;justify-items:start;gap:4px;padding:18px;border-radius:16px;background:var(--surface-douce);border:var(--fx-b);transition:transform .7s var(--e) var(--d),opacity .7s var(--e) var(--d)}
.fx-a-cles li>span{color:var(--bleu-500);margin-bottom:6px}.fx-a-cles b{font-size:28px;line-height:1;font-weight:700;color:var(--marine-900);font-variant-numeric:tabular-nums}.fx-a-cles small{font-size:13px;color:var(--gris-600)}
.fx-a-cote{position:sticky;top:calc(var(--web-entete,108px) + 24px)}
.fx-carte-act{padding:28px;border-radius:20px;background:#fff;border:var(--fx-b);box-shadow:0 30px 60px -40px rgba(12,33,71,.45);animation:fx-monte .8s var(--e) .2s both}
.fx-a-main .fx-sec .fx-grp{grid-template-columns:repeat(3,minmax(0,1fr))}
/* ——— B ——— */
.fx-b-heros{background:var(--degrade-marine);color:#fff;padding:24px 0 96px;position:relative;overflow:hidden}
.fx-b-heros::before{content:'';position:absolute;inset:0;background:radial-gradient(60% 70% at 85% 10%,rgba(91,154,232,.28),transparent 60%);pointer-events:none}
.fx-b-g{position:relative;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:48px;align-items:center}
.fx-b-tx{display:grid;gap:4px;justify-items:start}.fx-b-tx .fx-retour{margin-bottom:16px}.fx-b-tx .fx-prix{margin:20px 0 24px}.fx-b-tx .fx-act{width:100%;max-width:380px}
.fx-b-tx>*{animation:fx-monte .8s var(--e) both}.fx-b-tx>*:nth-child(2){animation-delay:.06s}.fx-b-tx>*:nth-child(3){animation-delay:.12s}.fx-b-tx>*:nth-child(4){animation-delay:.18s}.fx-b-tx>*:nth-child(5){animation-delay:.24s}.fx-b-tx>*:nth-child(6){animation-delay:.3s}
.fx-b-media{display:grid;gap:10px}
.fx-b-ph{position:relative;display:block;aspect-ratio:4/3;padding:0;border:0;border-radius:20px;overflow:hidden;cursor:zoom-in;background:#12305A;box-shadow:0 40px 80px -40px rgba(0,0,0,.6)}
.fx-b-ph-i{position:absolute;inset:0;display:block;animation:fx-kb 9s ease-out both}.fx-b-ph-i>*{height:100%}
@keyframes fx-kb{from{transform:scale(1.08);opacity:.4}12%{opacity:1}to{transform:scale(1)}}
.fx-b-ct{position:absolute;right:14px;bottom:14px;padding:6px 10px;border-radius:8px;background:rgba(12,33,71,.75);color:#fff;font-size:12.5px;font-weight:600}
.fx-b-mini{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.fx-b-mini button{aspect-ratio:4/3;padding:0;border-radius:10px;overflow:hidden;border:2px solid transparent;cursor:pointer;opacity:.65;transition:opacity .2s,border-color .2s;background:#12305A}
.fx-b-mini button[aria-pressed=true]{opacity:1;border-color:#fff}.fx-b-mini .fx-ph b,.fx-b-mini .fx-ph small{display:none}
.fx-ruban{position:relative;z-index:2;margin:-56px 0 0;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border-radius:20px;background:#fff;border:var(--fx-b);box-shadow:0 30px 60px -36px rgba(12,33,71,.4)}
.fx-ruban>div{padding:22px 20px;border-left:var(--fx-b)}.fx-ruban>div:first-child{border-left:0}
.fx-ruban dt{font-size:12.5px;color:var(--gris-600)}.fx-ruban dd{margin:4px 0 0;font-size:24px;font-weight:700;letter-spacing:-.02em;color:var(--marine-900);font-variant-numeric:tabular-nums}
.fx-b-corps{padding-top:16px}.fx-b-corps>.fx-sec:first-child{border-top:0}
.fx-ong-l{position:relative;display:flex;gap:4px;border-bottom:1px solid var(--gris-100);overflow-x:auto;scrollbar-width:none}
.fx-ong-l button{flex:none;min-height:48px;padding:0 16px;border:0;background:none;font:600 14px var(--police-corps);color:var(--gris-600);cursor:pointer;transition:color .2s}.fx-ong-l button[aria-selected=true]{color:var(--marine-900)}
.fx-ong-l i{position:absolute;left:0;bottom:-1px;height:3px;border-radius:3px;background:var(--marine-900);transition:transform .35s var(--e),width .35s var(--e)}
.fx-ong-p{padding-top:24px;animation:fx-monte .45s var(--e) both}.fx-ong-p:focus-visible{outline:2px solid var(--bleu-500);outline-offset:6px;border-radius:8px}
.fx-grp-3{margin-top:20px}
.fx-temps{list-style:none;margin:0;padding:0 0 0 20px;border-left:2px solid var(--bleu-050);display:grid;gap:22px}
.fx-temps li{position:relative;display:grid;gap:2px}.fx-temps li>span{position:absolute;left:-37px;top:-2px;display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--marine-900);color:#fff;box-shadow:0 0 0 4px #fff}
.fx-temps b{font-size:16px;color:var(--marine-900)}.fx-temps p{margin:0;font-size:14px;line-height:1.6}
.fx-b-duo{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:stretch}
.fx-panneau{padding:28px;border-radius:20px;border:var(--fx-b);background:#fff}.fx-panneau.sombre{background:var(--degrade-marine);border-color:transparent;color:#fff}
.fx-puces{display:flex;flex-wrap:wrap;gap:8px}
.fx-puce{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:10px;border:1px solid rgba(12,33,71,.18);background:#fff;font:600 13px var(--police-corps);color:var(--marine-900);cursor:pointer;transition:background-color .2s,border-color .2s,color .2s,transform .2s var(--e)}
.fx-puce:active{transform:scale(.97)}.fx-puce[aria-pressed=true],.fx-puce[aria-checked=true]{background:var(--marine-900);border-color:var(--marine-900);color:#fff}
.fx-panneau.sombre .fx-puce{background:transparent;border-color:rgba(255,255,255,.3);color:#fff}.fx-panneau.sombre .fx-puce[aria-checked=true]{background:#fff;color:var(--marine-900);border-color:#fff}
.fx-panneau.sombre .fx-lab{color:var(--bleu-100)}
.fx-crit{display:grid;gap:20px;margin-top:16px}
.fx-crit-r{display:grid;grid-template-columns:96px minmax(0,1fr);gap:8px 20px;align-items:center;padding:20px;border-radius:16px;background:var(--surface-douce)}
.fx-anneau{position:relative;width:96px;height:96px;grid-row:span 2}.fx-anneau svg{width:100%;height:100%;transform:rotate(-90deg)}
.fx-anneau circle{fill:none;stroke:var(--gris-100);stroke-width:10}.fx-anneau circle.v{stroke:var(--succes-500);stroke-linecap:round;stroke-dasharray:327;stroke-dashoffset:calc(327 * (1 - var(--p)));transition:stroke-dashoffset .8s var(--e)}
.fx-anneau b{position:absolute;inset:0;display:grid;place-items:center;font-size:26px;font-weight:700;color:var(--marine-900)}.fx-anneau b small{font-size:14px;color:var(--gris-600)}
.fx-anneau b{display:flex;align-items:baseline;justify-content:center;padding-top:30px;box-sizing:border-box}
.fx-crit-t{margin:0;font-size:15px;font-weight:700;color:var(--marine-900)}
.fx-crit-l{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px 14px}.fx-crit-l li{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--succes-600);animation:fx-monte .35s var(--e) both}.fx-crit-l li[data-ok="0"]{color:var(--gris-500)}
.fx-moment{display:grid;gap:4px;margin-top:16px}.fx-moment .fx-puces{margin-bottom:20px}
.fx-jours{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:16px}
.fx-jour{display:grid;justify-items:center;gap:2px;padding:10px 4px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;cursor:pointer;font-family:var(--police-corps);transition:background-color .2s,color .2s,transform .2s var(--e)}
.fx-jour small{font-size:12px;color:inherit;opacity:.8;text-transform:capitalize}.fx-jour b{font-size:20px}.fx-jour[aria-checked=true]{background:#fff;color:var(--marine-900);transform:translateY(-2px)}
.fx-moment-n{margin-top:10px;font-size:12.5px;color:var(--bleu-100)}
/* ——— C ——— */
.fx-c-heros{position:relative;min-height:min(78vh,720px);display:grid;align-items:end;overflow:hidden;background:#0C2147;color:#fff}
.fx-c-im{position:absolute;inset:0}.fx-c-im img{width:100%;height:100%;object-fit:cover;transform:scale(calc(1.1 - var(--y,0) * .06)) translateY(calc(var(--y,0) * 40px));animation:fx-kb 2.2s var(--e) both}
.fx-c-heros::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,33,71,.15) 0%,rgba(12,33,71,.35) 40%,rgba(7,20,40,.92) 100%)}
.fx-c-tx{position:relative;z-index:1;width:100%;padding-top:96px;padding-bottom:56px;display:grid;justify-items:start;gap:6px}
.fx-c-tx>*{animation:fx-monte .9s var(--e) both}.fx-c-tx>*:nth-child(2){animation-delay:.1s}.fx-c-tx>*:nth-child(3){animation-delay:.2s}.fx-c-tx>*:nth-child(4){animation-delay:.3s}.fx-c-tx>*:nth-child(5){animation-delay:.4s}
.fx-c-haut{position:absolute;z-index:2;top:16px;left:0;right:0}
.fx-c-ligne{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;margin:14px 0 24px;font-size:15px;font-weight:600;color:var(--bleu-100)}.fx-c-ligne b{font-size:28px;color:#fff;letter-spacing:-.02em}.fx-c-ligne small{font-size:14px;margin-left:-6px}
.fx-c-cta{display:flex;flex-wrap:wrap;gap:10px}
.fx-c-g{display:grid;grid-template-columns:220px minmax(0,1fr);gap:56px;align-items:start;padding-top:48px}
.fx-som{position:sticky;top:calc(var(--web-entete,108px) + 32px);display:grid;grid-template-columns:3px minmax(0,1fr);column-gap:16px}.fx-som .fx-lab{grid-column:1/-1}
.fx-som-barre{position:relative;border-radius:3px;background:var(--gris-100);overflow:hidden}.fx-som-barre i{position:absolute;inset:0;background:var(--marine-900);transform-origin:50% 0;transition:transform .5s var(--e)}
.fx-som ol{list-style:none;margin:0;padding:0;display:grid}
.fx-som button{display:flex;align-items:center;gap:10px;width:100%;min-height:40px;padding:0;border:0;background:none;font:500 14px var(--police-corps);color:var(--gris-600);cursor:pointer;text-align:left;transition:color .2s}
.fx-som button span{font-size:12px;font-weight:700;color:var(--gris-400);font-variant-numeric:tabular-nums}.fx-som button[aria-current]{color:var(--marine-900);font-weight:700}.fx-som button[aria-current] span{color:var(--bleu-600)}
.fx-c-ch>.fx-sec:first-child{border-top:0;padding-top:0}.fx-c-ch .fx-sec{scroll-margin-top:calc(var(--web-entete,108px) + 24px)}
.fx-c-rail{list-style:none;margin:0;padding:0 0 6px;display:grid;grid-auto-flow:column;grid-auto-columns:min(70%,420px);gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:thin}
.fx-c-rail li{scroll-snap-align:start;display:grid;gap:8px}.fx-c-rail button{display:block;aspect-ratio:4/3;padding:0;border:0;border-radius:16px;overflow:hidden;cursor:zoom-in;background:#EEF3F9}
.fx-c-rail button>*{transition:transform .9s var(--e)}.fx-c-rail button:hover>*{transform:scale(1.04)}.fx-c-rail li>span{font-size:13px;font-weight:600;color:var(--marine-900)}
.fx-bud{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px;align-items:start}
.fx-bud-ch{display:grid;gap:24px;padding:24px;border-radius:16px;border:var(--fx-b)}
.fx-champ{display:grid;gap:12px}.fx-champ>span{display:flex;justify-content:space-between;font-size:13.5px;font-weight:600;color:var(--gris-700)}.fx-champ b{color:var(--marine-900);font-variant-numeric:tabular-nums}
.fx-champ input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:28px;background:transparent;cursor:pointer}
.fx-champ input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:6px;background:linear-gradient(90deg,var(--marine-900) var(--p),var(--gris-100) var(--p))}
.fx-champ input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;margin-top:-9px;border-radius:50%;background:#fff;border:2px solid var(--marine-900);box-shadow:0 4px 10px rgba(12,33,71,.25)}
.fx-champ input[type=range]::-moz-range-track{height:6px;border-radius:6px;background:linear-gradient(90deg,var(--marine-900) var(--p),var(--gris-100) var(--p))}
.fx-champ input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid var(--marine-900)}
.fx-champ input[type=range]:focus-visible{outline:2px solid var(--bleu-500);outline-offset:4px;border-radius:6px}
.fx-bud-r{display:grid;gap:14px;padding:24px;border-radius:16px;background:var(--surface-douce)}
.fx-bud-v{display:flex;align-items:center;gap:10px;margin:0;font-size:17px;font-weight:700}.fx-bud-v.ok{color:var(--succes-600)}.fx-bud-v.non{color:var(--urgence-500)}
.fx-bud-barre{position:relative;height:12px;border-radius:12px;background:var(--gris-100);margin:10px 0 18px}.fx-bud-barre i{position:absolute;left:0;top:0;bottom:0;border-radius:12px;background:var(--succes-500);transition:width .5s var(--e),background-color .3s}.fx-bud-barre i[data-h]{background:var(--urgence-500)}
.fx-bud-barre span{position:absolute;top:16px;transform:translateX(-50%);font-size:12px;font-weight:600;color:var(--gris-600)}.fx-bud-barre span::before{content:'';position:absolute;left:50%;top:-18px;width:2px;height:16px;background:var(--marine-900)}
.fx-note-p{font-size:12.5px;color:var(--gris-600)}
.fx-c-fin{display:grid;gap:4px;justify-items:start}.fx-c-fin .fx-act{width:100%;max-width:420px;margin-top:12px}
/* ——— Bascule de revue ——— */
.fx-bas{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:1100;display:flex;align-items:center;gap:4px;padding:6px 6px 6px 16px;border-radius:16px;background:var(--marine-900);box-shadow:0 14px 36px rgba(7,26,46,.35);font-family:var(--police-corps)}
.fx-bas>span{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--bleu-100);margin-right:8px}
.fx-bas button{display:inline-flex;align-items:center;gap:6px;height:44px;padding:0 14px;border:0;border-radius:12px;cursor:pointer;font:600 13px var(--police-corps);white-space:nowrap;background:transparent;color:#fff}
.fx-bas button:hover{background:rgba(255,255,255,.1)}.fx-bas button[aria-pressed=true]{background:#fff;color:var(--marine-900)}.fx-bas button b{color:var(--bleu-300)}.fx-bas button[aria-pressed=true] b{color:var(--bleu-600)}
/* ——— Responsive ——— */
@media (max-width:1100px){.fx-a-corps{grid-template-columns:minmax(0,1fr) 320px;gap:36px}.fx-grp,.fx-a-main .fx-sec .fx-grp{grid-template-columns:minmax(0,1fr)}.fx-incl{grid-template-columns:repeat(2,minmax(0,1fr))!important}.fx-ruban{grid-template-columns:repeat(3,minmax(0,1fr))}.fx-ruban>div:nth-child(4){border-left:0}.fx-ruban>div:nth-child(n+4){border-top:var(--fx-b)}.fx-b-duo{grid-template-columns:minmax(0,1fr)}.fx-c-g{grid-template-columns:180px minmax(0,1fr);gap:36px}}
@media (max-width:900px){.fx-a-corps{grid-template-columns:minmax(0,1fr)}.fx-a-cote{position:static}.fx-b-g{grid-template-columns:minmax(0,1fr)}.fx-b-media{order:-1}.fx-c-g{grid-template-columns:minmax(0,1fr)}.fx-som{display:none}.fx-a-sect,.fx-bud{grid-template-columns:minmax(0,1fr)}.fx-sim ul{grid-template-columns:minmax(0,1fr)}}
@media (max-width:760px){.fx{padding-bottom:96px}
  .fx-barre{position:fixed;left:12px;right:88px;bottom:12px;z-index:1050;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 8px 8px 16px;border-radius:14px;background:#fff;border:var(--fx-b);box-shadow:0 14px 36px -12px rgba(12,33,71,.4);animation:fx-monte .5s var(--e) .6s both}
  .fx-barre>span{display:grid}.fx-barre b{font-size:17px;color:var(--marine-900)}.fx-barre small{font-size:12px;color:var(--gris-600)}.fx-barre .fx-btn{min-height:44px;padding:0 16px;font-size:14px}
  .fx-bas{bottom:76px;padding:4px;max-width:calc(100vw - 24px)}.fx-bas>span,.fx-bas-n{display:none}.fx-bas button{padding:0 12px}
  .fx-a-gal{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:240px 110px;border-radius:16px}.fx-a-cell.c0{grid-column:1/-1;grid-row:1}.fx-a-cell.c3,.fx-a-cell.c4{display:none}
  .fx-a-cles{grid-template-columns:repeat(2,minmax(0,1fr))}.fx-incl{grid-template-columns:minmax(0,1fr)!important}.fx-mini{grid-template-columns:repeat(3,minmax(0,1fr))}
  .fx-sec{padding:36px 0}.fx-carte-act{padding:22px}
  .fx-ruban{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:-40px}.fx-ruban>div{border-left:0!important;border-top:var(--fx-b)}.fx-ruban>div:nth-child(-n+2){border-top:0}.fx-ruban>div:nth-child(even){border-left:var(--fx-b)!important}.fx-ruban dd{font-size:20px}
  .fx-b-heros{padding:16px 0 72px}.fx-b-tx .fx-act{max-width:none}.fx-b-mini{grid-template-columns:repeat(5,minmax(0,1fr))}
  .fx-crit-r{grid-template-columns:minmax(0,1fr);justify-items:center;text-align:center}.fx-anneau{grid-row:auto}.fx-crit-l{justify-content:center}
  .fx-jours{grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.fx-panneau{padding:22px}
  /* −15 % (9 oct.) : puces des critères, jours, moments et bouton du panneau de visite */
  .fx-moment .fx-puce{zoom:.85}.fx-crit .fx-puce{zoom:.765}
  .fx-crit .fx-puces,.fx-moment .fx-puces{justify-content:center}
  .fx-sim-tete{justify-content:center;text-align:center}
  .fx-panneau.sombre>.fx-p.c{font-size:11.2px}
  .fx-moment-n{font-size:10.69px}
  .fx-panneau:has(>.fx-crit)>.fx-p{font-size:11.9px}
  /* « Jour », « Moment » et « Vos critères » retirés à l'écran; gardés pour les lecteurs d'écran (noms des groupes de boutons) */
  #fb-j,#fb-m,#fb-crit-l{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
  .fx-jours{zoom:.85;width:85%;justify-self:center;margin-inline:auto}
  .fx-moment .fx-btn{zoom:.7225;width:auto!important;max-width:none;justify-self:center;margin-inline:auto;white-space:nowrap;padding-inline:22px;gap:8px}
  .fx-c-heros{min-height:78vh}.fx-c-cta{display:grid;width:100%}.fx-c-rail{grid-auto-columns:82%}
  .fx-h1{font-size:clamp(28px,8vw,36px)}}
@media (prefers-reduced-motion:reduce){.fx *,.fx *::before,.fx-vis *{animation:none!important;transition:none!important}.fx-r{opacity:1;transform:none}.fx-proche i{transform:none}}`;

/* ——— Bascule ——— */

/* Fiche d'un logement : option B « Dossier » retenue le 9 oct. 2026, bascule retirée (A, C et l'actuelle restent dans ce fichier, inactives). */
let FX_DETAILS = {
  INCL,
  DESC,
  DESC2,
  L,
  Groupes,
  Immeuble: ImmeubleT,
  Secteur: SecteurT,
  Conditions: ConditionsT,
  OngletsActuels: Onglets
};
let __exp_FicheV2_0 = ({
  ouvrirAgent
}) => <><style>{CSS}</style><FicheB ouvrir={ouvrirAgent} /></>;
export { FX_DETAILS, __exp_FicheV2_0 as FicheV2 };
