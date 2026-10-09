/* Classement des éléments HTML pour la traduction (équivalent du display calculé par traducteur.js).
   En ligne : le texte appartient à l'unité du bloc parent. Bloc : l'élément est sa propre unité. */
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'data', 'dfn', 'em', 'i', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'label']);
/* Texte jamais traduit (comme EXCLU de traducteur.js; le texte des SVG est ignoré, leurs attributs sont traduits). */
export const EXCLU_TEXTE = new Set(['script', 'style', 'noscript', 'textarea', 'code', 'svg', 'title', 'text', 'tspan', 'path', 'g']);

export function estInline(tag, props) {
  const d = props && props.style && props.style.display;
  if (d) return d === 'inline' || d === 'contents';
  return INLINE.has(tag);
}
