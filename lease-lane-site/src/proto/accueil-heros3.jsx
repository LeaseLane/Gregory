/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/accueil-heros3.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { PPC } from '@/proto/pages-proprietaires';
import { BoutonLien, Exemple } from '@/proto/blocs';
import { useEtatClient, __ssr } from '@/lib/hydratation';
const CT = {
  maxWidth: 'var(--web-conteneur)',
  margin: '0 auto',
  padding: '0 var(--web-gouttiere)',
  boxSizing: 'border-box',
  width: '100%'
};
const FIN = '1px solid var(--bordure-fine)';
const SUR = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase'
};
const sansMvt = () => {
  try {
    return (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : undefined;
  } catch (e) {
    return false;
  }
};
const H1 = ({
  clair,
  bleu = 'var(--bleu-500)'
}) => <h1 className="h3-monte" style={{
  margin: 0,
  fontSize: 'clamp(34.4px,3.01vw,43px)',
  fontWeight: 700,
  letterSpacing: '-0.03em',
  lineHeight: 1.29,
  color: clair ? '#fff' : 'var(--marine-900)',
  textWrap: 'balance',
  maxWidth: '24ch'
}}>Une gestion Immobilière à <span style={{
    color: bleu
  }}>Québec</span> avec <span style={{
    color: bleu
  }}>une clé d'avance</span> et ce, en permanence.</h1>;
const Lead = ({
  clair
}) => {
  const t = PPC.gestion && PPC.gestion.lead;
  return t ? <p className="h3-monte" style={{
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.65,
    color: clair ? 'var(--bleu-100)' : 'var(--texte-corps)',
    maxWidth: '54ch',
    textWrap: 'pretty',
    animationDelay: '90ms'
  }}>{t}</p> : null;
};
const Actions = ({
  clair
}) => <div className="h3-monte" style={{
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  marginTop: '8px',
  animationDelay: '180ms'
}}>
  <BoutonLien to="/offre-de-service" variant={clair ? 'inverse' : 'primaire'}>Obtenir une offre de service</BoutonLien></div>;
const Ex = () => <Exemple />;
/* Étapes minutées depuis le montage; état final immédiat si le mouvement est réduit. */
function useSequence(delais) {
  const [e, setE] = useEtatClient(() => sansMvt() ? delais.length : 0);
  React.useEffect(() => {
    if (sansMvt()) return;
    const t = delais.map((d, i) => setTimeout(() => setE(x => Math.max(x, i + 1)), d));
    return () => t.forEach(clearTimeout);
  }, []);
  return e;
}
function useCompte(cible, actif, duree = 900) {
  const [v, setV] = useEtatClient(() => sansMvt() ? cible : 0);
  React.useEffect(() => {
    if (!actif) return;
    if (sansMvt()) {
      setV(cible);
      return;
    }
    let id = 0;
    const s = performance.now();
    const pas = n => {
      const p = Math.min(1, (n - s) / duree);
      setV(Math.round(cible * (1 - Math.pow(1 - p, 3))));
      if (p < 1) id = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(pas) : undefined;
    };
    id = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(pas) : undefined;
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? cancelAnimationFrame(id) : undefined;
  }, [actif, cible]);
  return v;
}

/* 1 · Le rapport : le rapport mensuel se remplit sous les yeux. Une nuit de fuite, trois dossiers fermés, la boucle est fermée. */

/* 2 · La vitrine : photographie pleine largeur, filets de colonne du thème de référence, console à deux onglets qui chevauche la section suivante. */

/* 3 · Le tableau : les engagements de service sur un tableau à palettes, qui s'affiche caractère par caractère. Heure de Québec en direct. */

let H3 = {
  CT,
  FIN,
  SUR,
  H1,
  Lead,
  Actions,
  Ex,
  sansMvt,
  useSequence,
  useCompte
};
export { H3 };
