/* Racine du runtime JSX traduisant : createElement (utilisé par le compilateur quand une « key » suit un {...props}). */
import { createElement as ceR } from 'react';
import { envelopper, Traduit } from './envelopper';

export function createElement(type, config, ...enfants) {
  const props = { ...(config || {}) };
  const key = props.key;
  delete props.key;
  if (enfants.length) props.children = enfants.length === 1 ? enfants[0] : enfants;
  const e = envelopper(type, props, enfants.length > 1);
  if (!e) return ceR(type, config, ...enfants);
  return ceR(Traduit, key == null ? e : { ...e, key });
}
