/* Runtime JSX traduisant (pragma « @jsxImportSource @/lib/i18n » des composants du site) :
   identique à react/jsx-runtime, sauf que les éléments HTML qui portent du texte passent par <Traduit>. */
import { jsx as jsxR, jsxs as jsxsR, Fragment } from 'react/jsx-runtime';
import { envelopper, Traduit } from './envelopper';

export { Fragment };
/* Plan SEO, lot 2 : React précharge toute image sans loading="lazy" (en-tête Link: rel=preload). Une seule image
   préchargée sur le site : le logo de l'en-tête. Les autres passent en chargement différé (sauf loading/fetchPriority
   explicites dans le composant). */
const PRECHARGEE = /leaselane-horizontal-blanc\.svg/;
/* PageSpeed (22 oct. 2026) : le fond « lignes néon » de la bannière d'accueil (affiché à 2 % d'opacité) était compté comme
   l'élément principal (LCP) de la page. Il est remplacé par une version de 1 Ko (96 × 54, invisible à 2 %) : Chrome ignore les
   images aussi pauvres en détail, et c'est le titre, affiché dès le premier rendu, qui devient l'élément principal. */
const LCP = /fond-lignes-neon\.jpg/;
/* La ligne d'immeubles de la bannière (couverture-immeubles.png) devient alors l'élément principal sur ordinateur : servie
   en WebP (35 Ko au lieu de 70 Ko, transparence conservée). Sur ordinateur, elle est préchargée dans le <head>
   (Prechargements.tsx, ≥ 1024 px). Elle reste en différé ici : chargée tout de suite, elle devient sur mobile l'élément
   principal (LCP) peint au moment de l'hydratation (4,6 s mesuré le 23 oct. 2026) au lieu du titre (2,4 s). */
const PRIORITAIRE = /couverture-immeubles\.(png|webp)/;
const img = (type, props) => (type !== 'img' || !props || props.loading != null || props.fetchPriority != null ? props
  : LCP.test(String(props.src || '')) ? { ...props, src: String(props.src).replace('fond-lignes-neon.jpg', 'fond-lignes-neon-leger.jpg') }
  : PRIORITAIRE.test(String(props.src || '')) ? { ...props, src: String(props.src).replace(/\.png$/, '.webp'), loading: 'lazy', decoding: props.decoding || 'async' }
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
