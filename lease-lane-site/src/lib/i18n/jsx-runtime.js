/* Runtime JSX traduisant (pragma « @jsxImportSource @/lib/i18n » des composants du site) :
   identique à react/jsx-runtime, sauf que les éléments HTML qui portent du texte passent par <Traduit>. */
import { jsx as jsxR, jsxs as jsxsR, Fragment } from 'react/jsx-runtime';
import { envelopper, Traduit } from './envelopper';

export { Fragment };
/* Plan SEO, lot 2 : React précharge toute image sans loading="lazy" (en-tête Link: rel=preload). Une seule image
   préchargée sur le site : le logo de l'en-tête. Les autres passent en chargement différé (sauf loading/fetchPriority
   explicites dans le composant). */
const PRECHARGEE = /leaselane-horizontal-blanc\.svg/;
/* PageSpeed (22 oct. 2026) : le fond de la section d'ouverture de l'accueil est l'élément le plus grand (LCP) :
   chargé tout de suite, en priorité haute, au lieu d'en différé. */
const LCP = /fond-lignes-neon\.jpg/;
const img = (type, props) => (type !== 'img' || !props || props.loading != null || props.fetchPriority != null ? props
  : LCP.test(String(props.src || '')) ? { ...props, loading: 'eager', fetchPriority: 'high' }
  : PRECHARGEE.test(String(props.src || '')) ? props : { ...props, loading: 'lazy', decoding: props.decoding || 'async' });
export function jsx(type, props, key) {
  props = img(type, props);
  const e = envelopper(type, props, false);
  return e ? jsxR(Traduit, e, key) : jsxR(type, props, key);
}
export function jsxs(type, props, key) {
  props = img(type, props);
  const e = envelopper(type, props, true);
  return e ? jsxR(Traduit, e, key) : jsxsR(type, props, key);
}
