'use client';
/* Langue de la page, fournie par le gabarit (français par défaut; le gabarit anglais fournit aussi le dictionnaire). */
import { createContext, useContext } from 'react';
import { traduireHtml, traduireFragments } from './traduire';
import { versEN, versFR } from './adresses';

export const LangueContexte = createContext({ lang: 'fr', D: null, A: null });
export const useLangue = () => useContext(LangueContexte).lang;
export const useDico = () => useContext(LangueContexte);

/* HTML brut (pages légales) : traduit côté serveur et navigateur de la même façon. */
export function useHtmlTraduit(html) {
  const { lang, D } = useContext(LangueContexte);
  return lang === 'en' && D ? traduireHtml(html, D) : html;
}

/* Changer de langue : page jumelle dans l'autre langue (rechargement complet : autre gabarit racine). */
export function allerLangue(l) {
  if (typeof window === 'undefined') return;
  const ici = decodeURIComponent(window.location.pathname) + (window.location.hash || '');
  const cible = l === 'en' ? versEN(versFR(ici)) : versFR(ici);
  try { localStorage.removeItem('ll-langue'); } catch (e) {}
  if (cible !== ici) window.location.assign(cible);
}

/* Phrase découpée en morceaux par un composant (ex. « texte {mot en couleur} suite ») : traduite d'un bloc,
   comme l'unité du DOM du prototype (les morceaux faits d'espaces seulement ne comptent pas). */
export function useMorceauxTraduits(morceaux) {
  const { lang, D } = useContext(LangueContexte);
  if (lang !== 'en' || !D) return morceaux;
  const idx = [], pleins = [];
  morceaux.forEach((m, i) => { if (/\S/.test(m)) { idx.push(i); pleins.push(m); } });
  const t = traduireFragments(pleins, D);
  if (!t) return morceaux;
  const r = morceaux.slice();
  idx.forEach((i, k) => { r[i] = t[k]; });
  return r;
}
