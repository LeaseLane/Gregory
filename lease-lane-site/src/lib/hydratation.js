/* Hydratation sans écart (rendu serveur ↔ navigateur).
   Les composants du prototype initialisent parfois un état à partir du navigateur (matchMedia, IntersectionObserver…).
   - __ssr() : vrai pendant le calcul d'un état « comme sur le serveur » (les lectures protégées du navigateur rendent alors leur repli).
   - useEtatClient(init) : remplace useState(init) quand init lit le navigateur. Pendant l'hydratation, l'état vaut ce que le
     serveur a rendu (aucun écart); juste après, avant l'affichage, il prend la vraie valeur du navigateur.
     Hors hydratation (page ouverte par navigation client), la vraie valeur est utilisée tout de suite. */
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

let modeServeur = false;
export const __ssr = () => modeServeur;
function commeServeur(f) {
  const avant = modeServeur;
  modeServeur = true;
  try { return f(); } finally { modeServeur = avant; }
}
const calculer = init => (typeof init === 'function' ? init() : init);
const abonner = () => () => {};

export function useEtatClient(init) {
  const client = useSyncExternalStore(abonner, () => true, () => false);
  const [v, setV] = useState(() => (client ? calculer(init) : commeServeur(() => calculer(init))));
  const aCorriger = useRef(!client);
  useLayoutEffect(() => {
    if (!aCorriger.current) return;
    aCorriger.current = false;
    setV(calculer(init));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return [v, setV];
}

/* Heure courante. Côté serveur (pré-rendu) et pendant l'hydratation : date de référence fixe, pour un HTML stable et
   identique des deux côtés; dans le navigateur : la vraie date. Les états qui en dépendent passent par useEtatClient. */
const REFERENCE = Date.UTC(2026, 9, 9, 16, 0, 0);
const serveur = () => typeof window === 'undefined' || modeServeur;
export const __maintenant = () => (serveur() ? new Date(REFERENCE) : new Date());
export const __maintenantMs = () => (serveur() ? REFERENCE : Date.now());
