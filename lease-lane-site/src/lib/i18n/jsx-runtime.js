/* Runtime JSX traduisant (pragma « @jsxImportSource @/lib/i18n » des composants du site) :
   identique à react/jsx-runtime, sauf que les éléments HTML qui portent du texte passent par <Traduit>. */
import { jsx as jsxR, jsxs as jsxsR, Fragment } from 'react/jsx-runtime';
import { envelopper, Traduit } from './envelopper';

export { Fragment };
/* Plan SEO, lot 2 : React précharge toute image sans loading="lazy" (en-tête Link: rel=preload). Une seule image
   préchargée sur le site : le logo de l'en-tête. Les autres passent en chargement différé (sauf loading/fetchPriority
   explicites dans le composant). */
const PRECHARGEE = /leaselane-horizontal-blanc\.svg/;
const img = (type, props) => (type === 'img' && props && props.loading == null && props.fetchPriority == null && !PRECHARGEE.test(String(props.src || ''))
  ? { ...props, loading: 'lazy', decoding: props.decoding || 'async' } : props);
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
