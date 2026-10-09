/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/menu-cleo.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon } from '@/components/ds';
import { LL_SITE } from '@/proto/routes';
const IMG = "/assets/img/",
  PORTAIL = LL_SITE.portail || "/connexion";
const Ic = ({
  n,
  t = 20,
  c = 'currentColor'
}) => <Icon name={n} size={t} exact color={c} />;
const Fl = ({
  ne,
  t = 18
}) => <svg viewBox="0 0 24 24" width={t} height={t} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={ne ? 'M7 17 17 7M8 7h9v9' : 'M5 12h14M13 6l6 6-6 6'} /></svg>;
const Avatar = ({
  t = 40,
  bord = '#fff'
}) => <span style={{
  position: 'relative',
  flex: 'none',
  display: 'block'
}}><img src={IMG + 'cleo-avatar.png'} alt="" style={{
    width: t + 'px',
    height: t + 'px',
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'block'
  }} /><span style={{
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'var(--bleu-500)',
    border: '2px solid ' + bord
  }} /></span>;
/* Options de mise en page du panneau « Tout le site » (revue). Par défaut : description masquée. */

const NUM_GARDE = LL_SITE.urgence || '[numéro de garde]';

/* Index du site : id, titre, précision, icône, adresse (null = portail, flèche oblique), type, mots-clés */
const E = (id, t, d, ic, to, type, k = '') => ({
  id,
  t,
  d,
  ic,
  to,
  type,
  k
});
const IDX = [E('gestion', 'Gestion immobilière', 'Location, loyers, entretien, rapports', 'building', '/gestion-immobiliere', 'page', 'gerer gestion immeuble confier plex proprietaire'), E('location', 'Location et mise en marché', 'Louer vite, sans perdre un mois', 'tag', '/gestion-immobiliere/location', 'page', 'louer vacant annonce relocation libre'), E('expertise', 'Expertise et stratégie', 'Analyse, plan et suivi de performance', 'chart-column', '/expertise-et-strategie', 'page', 'expertise strategie analyse loyers performance conformite'), E('changer', 'Changement de gestionnaire', 'Quatre étapes, sans interruption', 'refresh-cw', '/changer-de-gestionnaire', 'page', 'changer gestionnaire transfert'), E('offre', 'Obtenir une offre de service', 'Réponse en un jour ouvrable', 'file-text', '/offre-de-service', 'action', 'soumission devis prix tarif'), E('pprop', 'Espace propriétaire', 'Rapport mensuel, loyers, dossiers', 'building-2', null, 'portail', 'connexion compte releve rapport'), E('logements', 'Logements à louer', 'Disponibilités à jour, visite avec Cléo', 'house', '/logements-a-louer', 'page', 'appartement logement louer visite visiter carte'), E('service', 'Service aux locataires', 'Urgence, demandes, paiement, bail', 'users', '/locataires', 'page', 'service locataire aide'), E('travaux', 'Demande de travaux', 'Bris, entretien, réparation', 'wrench', null, 'demande', 'reparation reparer bris entretien plomberie toilette electricite'), E('suivi', 'Suivi d’une demande', 'Où en est votre demande', 'search', null, 'demande', 'suivi statut'), E('plainte', 'Administration et plaintes', 'Commentaire ou plainte', 'message-square', '/locataires/commentaire-ou-plainte', 'demande', 'plainte commentaire administration bruit voisin'), E('candidature', 'Demande de location', 'Le dossier après une visite', 'key', '/locataires/demande-de-location', 'demande', 'location dossier candidature postuler'), E('endossement', 'Endossement au bail', 'Ajouter une personne au bail', 'pencil', null, 'demande', 'colocataire ajouter ajout conjoint'), E('cession', 'Cession de bail', 'Transférer le bail à quelqu’un', 'share-2', null, 'demande', 'transferer ceder quitter demenager'), E('ploc', 'Espace locataire', 'Bail, paiements, demandes', 'key-round', null, 'portail', 'connexion compte payer loyer paiement'), E('urgence', 'Signaler une urgence - 24/7', NUM_GARDE, 'triangle-alert', '/locataires#urgence', 'urgence', 'urgence fuite eau inondation chauffage panne feu gaz degat'), E('tal', 'Droit du logement · TAL', 'Hausse, reprise, bail, recours', 'scale', '/cleo#tal', 'page', 'tal tribunal regie logement droit hausse augmentation refuser reprise eviction expulsion depot garantie retard impaye non paiement loi 31 avis acces'), E('cleo', 'Cléo', 'Répond 24/7 et explique le TAL', 'message-circle', '/cleo', 'page', 'assistant agent ia clavarder tal droit logement'), E('apropos', 'À propos', 'L’équipe et la compagnie', 'info', '/a-propos', 'page', 'equipe compagnie'), E('joindre', 'Nous joindre', 'Téléphone, courriel ou formulaire', 'phone', '/nous-joindre', 'page', 'contact contacter joindre appeler telephone courriel adresse'), E('faq', 'Foire aux questions', 'Les réponses courantes', 'circle-help', '/faq', 'page', 'questions frequentes aide'), E('blogue', 'Blogue & nouvelles', 'Actualités et conseils', 'file-text', '/blogue', 'page', 'blogue nouvelles actualites articles conseils'), E('confid', 'Politique de confidentialité', 'Vos renseignements personnels', 'shield-check', '/confidentialite', 'page', 'vie privee loi 25 renseignements personnels'), E('gouv', 'Gouvernance des renseignements personnels', 'Responsable, incidents et plaintes', 'scale', '/gouvernance', 'page', 'gouvernance loi 25 responsable renseignements personnels plainte')];

/* Recherche : sans accents ni mots vides, une faute de frappe tolérée (mots de 4 lettres et plus), urgence en tête. */
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const VIDES = new Set('a ai au aux avec besoin ce ces chose comment d de des du en est et faire faut il j je l la le les m ma me mes mon ou peux pour puis qu que quelque qui quoi s sa se ses son suis sur un une veux voudrais vos votre nos notre y'.split(' '));
const mots = s => norm(s).split(/[^a-z0-9]+/).filter(w => w && !VIDES.has(w));
function lev1(a, b) {
  if (a === b) return true;
  const la = a.length,
    lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  if (la === lb) {
    const d = [];
    for (let k = 0; k < la && d.length < 3; k++) if (a[k] !== b[k]) d.push(k);
    return d.length === 1 || d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]];
  }
  const [s, l] = la < lb ? [a, b] : [b, a];
  let i = 0,
    j = 0,
    e = 0;
  while (i < s.length && j < l.length) {
    if (s[i] === l[j]) {
      i++;
      j++;
    } else {
      if (e) return false;
      e = 1;
      j++;
    }
  }
  return true;
}
IDX.forEach((it, i) => {
  it.i = i;
  it.urg = it.type === 'urgence';
  const tout = it.t + ' ' + it.d + ' ' + it.k;
  it.p = {
    nt: norm(it.t),
    tw: mots(it.t),
    h: norm(tout),
    w: mots(tout)
  };
});
const PAR = Object.fromEntries(IDX.map(it => [it.id, it]));
function noteMot(m, p, flou) {
  if (p.nt.startsWith(m)) return 0;
  if (p.tw.some(w => w.startsWith(m))) return 1;
  if (p.w.some(w => w.startsWith(m)) || m.length > 2 && p.h.includes(m)) return 2;
  if (flou && m.length >= 4 && p.w.some(w => [m.length - 1, m.length, m.length + 1].some(L => L >= 3 && lev1(m, w.slice(0, L))))) return 4;
  return -1;
}
function chercher(q, max = 3) {
  const m = mots(q);
  if (!m.length) return [];
  const flous = m.map(x => !IDX.some(it => noteMot(x, it.p, false) >= 0));
  const run = ou => IDX.map(it => {
    let s = 0,
      ok = 0;
    for (let j = 0; j < m.length; j++) {
      const n = noteMot(m[j], it.p, flous[j]);
      if (n < 0) {
        if (!ou) return null;
        s += 6;
      } else {
        s += n;
        ok++;
      }
    }
    return ok ? {
      ...it,
      s: s + (it.urg ? -4 : 0)
    } : null;
  }).filter(Boolean).sort((a, b) => a.s - b.s || a.i - b.i).slice(0, max);
  const r = run(false);
  return r.length || m.length < 2 ? r : run(true);
}
function Surligne({
  t,
  q
}) {
  const nt = norm(t);
  let i = -1,
    L = 0;
  for (const x of mots(q)) {
    const k = nt.indexOf(x);
    if (k >= 0) {
      i = k;
      L = x.length;
      break;
    }
  }
  if (i < 0) return t;
  return <React.Fragment>{t.slice(0, i)}<span style={{
      color: 'var(--bleu-600)'
    }}>{t.slice(i, i + L)}</span>{t.slice(i + L)}</React.Fragment>;
}
const href = it => it.to ? it.to : PORTAIL;
let LLC = {
  IDX,
  PAR,
  chercher,
  Surligne,
  href,
  NUM_GARDE,
  PORTAIL,
  Avatar,
  Fl,
  Ic
};
export { LLC };
