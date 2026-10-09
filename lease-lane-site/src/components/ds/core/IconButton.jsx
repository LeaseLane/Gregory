/** @jsxImportSource @/lib/i18n */
'use client';
import React from 'react';

const llIbSizes={s:32,m:40,l:48};

export function IconButton({variant='secondaire',size='m',rond=false,disabled=false,etiquette,style,children,...rest}){
  const [survol,setSurvol]=React.useState(false);
  const d=llIbSizes[size];
  const paletteBase={
    primaire:{background:'var(--action-primaire)',color:'#fff',border:'1px solid transparent'},
    secondaire:{background:'var(--gris-000)',color:'var(--marine-900)',border:'1px solid var(--bordure)'},
    fantome:{background:'transparent',color:'var(--texte-corps)',border:'1px solid transparent'},
    marine:{background:'rgba(255,255,255,.08)',color:'#fff',border:'1px solid var(--bordure-marine)'}
  };
  const paletteSurvol={
    primaire:{background:'var(--action-primaire-survol)'},
    secondaire:{background:'var(--surface-survol)',borderColor:'var(--bleu-200)'},
    fantome:{background:'var(--surface-survol)',color:'var(--marine-900)'},
    marine:{background:'rgba(255,255,255,.16)'}
  };
  return <button aria-label={etiquette} title={etiquette} disabled={disabled}
    onMouseEnter={()=>setSurvol(true)} onMouseLeave={()=>setSurvol(false)}
    style={{width:d+'px',height:d+'px',display:'inline-flex',alignItems:'center',justifyContent:'center',
      borderRadius:'var(--rayon-bouton)',cursor:disabled?'not-allowed':'pointer',
      opacity:disabled?.45:1,transition:'var(--transition-interface)',
      ...paletteBase[variant],...(survol&&!disabled?paletteSurvol[variant]:null),...style}} {...rest}>
    {children}
  </button>;
}
