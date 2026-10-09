/* Runtime JSX traduisant (pragma « @jsxImportSource @/lib/i18n » des composants du site) :
   identique à react/jsx-runtime, sauf que les éléments HTML qui portent du texte passent par <Traduit>. */
import { jsx as jsxR, jsxs as jsxsR, Fragment } from 'react/jsx-runtime';
import { envelopper, Traduit } from './envelopper';

export { Fragment };
export function jsx(type, props, key) {
  const e = envelopper(type, props, false);
  return e ? jsxR(Traduit, e, key) : jsxR(type, props, key);
}
export function jsxs(type, props, key) {
  const e = envelopper(type, props, true);
  return e ? jsxR(Traduit, e, key) : jsxsR(type, props, key);
}
