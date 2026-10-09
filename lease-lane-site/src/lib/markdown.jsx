/** @jsxImportSource @/lib/i18n */
/* Markdown léger pour les réponses de Cléo : **gras**, *italique*, `code`, [lien](url), listes à puces ou
   numérotées, titres (#) et paragraphes. Construit des éléments React, jamais de HTML brut : aucun risque
   d'injection. Liens permis : http(s), mailto, tel et adresses du site (/…).
   ponytail: pas de tableaux ni de blocs de code; ajouter si Cléo en produit. */
import React from 'react';

const LIEN_OK = /^(https?:\/\/|mailto:|tel:|\/)/i;
const MOTIF = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function enLigne(texte, cle) {
  return texte.split(MOTIF).map((p, i) => {
    const k = cle + '-' + i;
    if (/^(\*\*|__).+\1$/.test(p)) return <strong key={k}>{enLigne(p.slice(2, -2), k)}</strong>;
    if (/^`.+`$/.test(p)) return <code key={k}>{p.slice(1, -1)}</code>;
    const lien = p.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (lien) {
      if (!LIEN_OK.test(lien[2])) return lien[1];
      const externe = /^https?:/i.test(lien[2]);
      return <a key={k} href={lien[2]} {...(externe ? { target: '_blank', rel: 'noopener noreferrer' } : {})} style={{ color: '#3767A2', fontWeight: 600 }}>{lien[1]}</a>;
    }
    if (/^([*_]).+\1$/.test(p)) return <em key={k}>{p.slice(1, -1)}</em>;
    return p;
  });
}

export function Markdown({ texte }) {
  const blocs = [];
  let liste = null;
  const fermer = () => { if (liste) { blocs.push(liste); liste = null; } };
  String(texte || '').replace(/\r/g, '').split('\n').forEach((ligne, i) => {
    const puce = ligne.match(/^\s*[-*•]\s+(.*)$/), num = ligne.match(/^\s*\d+[.)]\s+(.*)$/), titre = ligne.match(/^\s*#{1,6}\s+(.*)$/);
    if (puce || num) {
      const type = puce ? 'ul' : 'ol';
      if (!liste || liste.type !== type) { fermer(); liste = { type, items: [] }; }
      liste.items.push(enLigne((puce || num)[1], 'l' + i));
      return;
    }
    fermer();
    if (!ligne.trim()) blocs.push(null);
    else if (titre) blocs.push({ type: 'b', contenu: enLigne(titre[1], 't' + i) });
    else blocs.push({ type: 'p', contenu: enLigne(ligne, 'p' + i) });
  });
  fermer();
  const marge = { margin: 0 };
  return <>{blocs.filter(Boolean).map((b, i) =>
    b.type === 'ul' || b.type === 'ol'
      ? React.createElement(b.type, { key: i, style: { margin: i ? '6px 0 0' : 0, paddingLeft: '20px' } }, b.items.map((it, j) => <li key={j} style={{ margin: '2px 0' }}>{it}</li>))
      : b.type === 'b'
        ? <p key={i} style={{ ...marge, marginTop: i ? '8px' : 0, fontWeight: 700 }}>{b.contenu}</p>
        : <p key={i} style={{ ...marge, marginTop: i ? '6px' : 0 }}>{b.contenu}</p>)}</>;
}
