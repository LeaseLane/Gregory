/* Décide si un élément HTML créé par le runtime JSX doit passer par <Traduit> (texte, attribut lisible ou lien interne). */
import { Fragment } from 'react';
import { Traduit } from './Traduit';
import { ATTRS, alpha } from './traduire';
import { estInline, EXCLU_TEXTE } from './elements';

function contientTexte(n) {
  if (n == null || typeof n === 'boolean') return false;
  if (typeof n === 'string') return /\S/.test(n);
  if (typeof n === 'number') return true;
  if (Array.isArray(n)) return n.some(contientTexte);
  if (typeof n !== 'object' || !n.$$typeof) return false;
  if (n.type === Fragment) return contientTexte(n.props.children);
  if (n.type === Traduit) return !!n.props.__texte && !n.props.__bloc;
  if (typeof n.type === 'string') return estInline(n.type, n.props) && !EXCLU_TEXTE.has(n.type) && contientTexte(n.props.children);
  return false;
}

export function envelopper(type, props, statique) {
  if (typeof type !== 'string' || !props) return null;
  const texte = !EXCLU_TEXTE.has(type) && contientTexte(props.children);
  const attr = ATTRS.some(a => typeof props[a] === 'string' && alpha(props[a]));
  const lien = type === 'a' && typeof props.href === 'string' && props.href.startsWith('/');
  if (!texte && !attr && !lien) return null;
  return { __t: type, __p: props, __s: !!statique, __bloc: !estInline(type, props), __texte: texte };
}
export { Traduit };
