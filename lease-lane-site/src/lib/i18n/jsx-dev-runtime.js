/* Runtime JSX traduisant, version développement (voir jsx-runtime.js). */
import { jsxDEV as jsxDEVR, Fragment } from 'react/jsx-dev-runtime';
import { envelopper, Traduit } from './envelopper';

export { Fragment };
export function jsxDEV(type, props, key, statique, source, self) {
  const e = envelopper(type, props, statique);
  return e ? jsxDEVR(Traduit, e, key, false, source, self) : jsxDEVR(type, props, key, statique, source, self);
}
