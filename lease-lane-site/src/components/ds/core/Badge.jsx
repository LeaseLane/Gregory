/** @jsxImportSource @/lib/i18n */
import React from 'react';

const llBadgeTons={
  neutre:{background:'var(--gris-050)',color:'var(--texte-corps)',border:'var(--bordure-fine)'},
  bleu:{background:'var(--bleu-025)',color:'var(--bleu-700)',border:'var(--bleu-100)'},
  marine:{background:'var(--marine-900)',color:'#fff',border:'transparent'},
  succes:{background:'var(--succes-100)',color:'var(--succes-600)',border:'transparent'},
  alerte:{background:'var(--alerte-100)',color:'var(--alerte-600)',border:'transparent'},
  urgence:{background:'var(--urgence-100)',color:'var(--urgence-600)',border:'transparent'},
  inverse:{background:'rgba(255,255,255,.12)',color:'#fff',border:'var(--bordure-marine)'}
};

export function Badge({ton='neutre',icone,taille='m',style,children,...rest}){
  const t=llBadgeTons[ton];
  const s=taille==='s';
  return <span style={{display:'inline-flex',alignItems:'center',gap:'6px',
    height:(s?20:24)+'px',padding:s?'0 8px':'0 10px',borderRadius:'var(--rayon-pilule)',
    fontSize:(s?11:12)+'px',fontWeight:600,letterSpacing:'.01em',whiteSpace:'nowrap',
    background:t.background,color:t.color,border:'1px solid '+t.border,...style}} {...rest}>
    {icone}{children}</span>;
}
