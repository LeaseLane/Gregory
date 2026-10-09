'use client';
/* Fournisseur de la version anglaise : seul le gabarit anglais l'importe, donc le dictionnaire (≈ 370 ko) n'est
   téléchargé que sur les pages /en/… */
import { LangueContexte } from './contexte';
import { LL_EN_TXT, LL_EN_ATTR } from './dictionnaire';

const VALEUR = { lang: 'en', D: LL_EN_TXT, A: LL_EN_ATTR };
export default function FournisseurEN({ children }) {
  return <LangueContexte.Provider value={VALEUR}>{children}</LangueContexte.Provider>;
}
