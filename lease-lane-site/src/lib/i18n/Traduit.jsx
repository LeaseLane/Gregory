'use client';
/* Élément traduisible : enveloppe un élément HTML qui porte du texte, des attributs lisibles ou un lien interne
   (posé par le runtime JSX de src/lib/i18n). En français, rend l'élément tel quel; en anglais, traduit son unité
   (le texte de l'élément et de ses descendants en ligne), ses attributs et ses liens internes.
   Ce module n'utilise pas le runtime traduisant (pas de pragma) : il crée les éléments avec react/jsx-runtime. */
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useContext } from 'react';
import { LangueContexte } from './contexte';
import { traduireFragments, traduireAttribut, ATTRS, lienEN } from './traduire';
import { estInline, EXCLU_TEXTE } from './elements';

const creer = (tag, props, statique) => (statique && Array.isArray(props.children) ? jsxs(tag, props) : jsx(tag, props));
const sansTexte = p => p['data-no-trad'] !== undefined || p.translate === 'no';

/* Parcours de l'unité : fragments de texte du sous-arbre en ligne (s'arrête aux blocs et aux composants). */
function collecter(n, out) {
  if (n == null || typeof n === 'boolean') return;
  if (typeof n === 'string' || typeof n === 'number') { out.push(String(n)); return; }
  if (Array.isArray(n)) { n.forEach(x => collecter(x, out)); return; }
  if (typeof n !== 'object' || !n.$$typeof) return;
  if (n.type === Fragment) { collecter(n.props.children, out); return; }
  if (n.type === Traduit) {
    const p = n.props;
    if (p.__bloc || EXCLU_TEXTE.has(p.__t) || sansTexte(p.__p)) return;
    collecter(p.__p.children, out); return;
  }
  if (typeof n.type === 'string') {
    if (!estInline(n.type, n.props) || EXCLU_TEXTE.has(n.type) || sansTexte(n.props)) return;
    collecter(n.props.children, out);
  }
}
/* Reconstruction avec les fragments traduits, dans le même ordre que collecter(). */
function remplacer(n, it) {
  if (n == null || typeof n === 'boolean') return n;
  if (typeof n === 'string' || typeof n === 'number') return it.suivant(n);
  if (Array.isArray(n)) { let ch = false; const r = n.map(x => { const y = remplacer(x, it); if (y !== x) ch = true; return y; }); return ch ? r : n; }
  if (typeof n !== 'object' || !n.$$typeof) return n;
  if (n.type === Fragment) {
    const k = remplacer(n.props.children, it);
    return k === n.props.children ? n : (Array.isArray(k) ? jsxs : jsx)(Fragment, { children: k }, n.key ?? undefined);
  }
  if (n.type === Traduit) {
    const p = n.props;
    if (p.__bloc || EXCLU_TEXTE.has(p.__t) || sansTexte(p.__p)) return n;
    const k = remplacer(p.__p.children, it);
    return jsx(Traduit, { ...p, __p: k === p.__p.children ? p.__p : { ...p.__p, children: k }, __fait: true }, n.key ?? undefined);
  }
  if (typeof n.type === 'string') {
    if (!estInline(n.type, n.props) || EXCLU_TEXTE.has(n.type) || sansTexte(n.props)) return n;
    const k = remplacer(n.props.children, it);
    if (k === n.props.children) return n;
    return (Array.isArray(k) ? jsxs : jsx)(n.type, { ...n.props, children: k }, n.key ?? undefined);
  }
  return n;
}
function traduireEnfants(enfants, D) {
  const bruts = [];
  collecter(enfants, bruts);
  if (!bruts.some(s => /\S/.test(s))) return enfants;
  /* Les fragments vides (espaces seuls) ne comptent pas dans la clé, comme dans traducteur.js. */
  const idx = [], pleins = [];
  bruts.forEach((s, i) => { if (/\S/.test(s)) { idx.push(i); pleins.push(s); } });
  const t = traduireFragments(pleins, D);
  if (!t) return enfants;
  const final = bruts.slice();
  idx.forEach((i, k) => { final[i] = t[k]; });
  let pos = 0;
  return remplacer(enfants, { suivant: v => { const r = final[pos++]; return typeof v === 'number' && r === String(v) ? v : r; } });
}

export function Traduit({ __t: tag, __p: props, __s: statique, __fait }) {
  const { lang, D, A } = useContext(LangueContexte);
  if (lang !== 'en' || !D) return creer(tag, props, statique);
  let p = props, copie = false;
  const modifier = (k, v) => { if (!copie) { p = { ...p }; copie = true; } p[k] = v; };
  for (const a of ATTRS) if (typeof p[a] === 'string') { const v = traduireAttribut(p[a], D, A); if (v !== p[a]) modifier(a, v); }
  if (tag === 'a' && typeof p.href === 'string') { const h = lienEN(p.href); if (h !== p.href) modifier('href', h); }
  if (!__fait && p.children != null && !EXCLU_TEXTE.has(tag) && !sansTexte(p)) {
    const k = traduireEnfants(p.children, D);
    if (k !== p.children) modifier('children', k);
  }
  return creer(tag, p, statique);
}
