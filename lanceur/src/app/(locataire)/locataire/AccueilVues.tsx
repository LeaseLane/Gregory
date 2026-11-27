'use client';
import { useEffect, useState } from 'react';
import { useT } from '@/composants/Langue';

/* TEMPORAIRE (27 nov. 2026) : Steven compare 3 options pour « Mes indicateurs » + graphique du loyer (AccueilIndicateurs.tsx) et 3 options pour l'en-tête
   de la page (AccueilEntete.tsx). Le choix se fait ici :
     - VUE_INDICATEURS / VUE_ENTETE = option par défaut ('a' | 'b' | 'c'); localStorage['ll-indicateurs-vue'] / ['ll-entete-vue'] la remplace (relue à l'événement « storage »);
     - CHOIX_VUE_INDICATEURS / CHOIX_VUE_ENTETE = true : affiche la petite commande « Vue : A · B · C » dans le bloc (à mettre à false, puis à retirer).
   Après le choix : garder l'option retenue, supprimer les deux autres, ce fichier et le CSS « Accueil locataire : indicateurs et en-tête » (globals.css, fin du fichier). */
export type Vue3 = 'a' | 'b' | 'c';
export const VUE_INDICATEURS: Vue3 = 'a';  // retenue par Steven le 27 nov. 2026 (« option A go the way it is right now »)
export const VUE_ENTETE: Vue3 = 'c';  // choisi par Steven le 27 nov. 2026 (« OPTION C ») : EnteteAccueil n'affiche plus que C
export const CHOIX_VUE_INDICATEURS = false;
export const CHOIX_VUE_ENTETE = false;

const lire = (cle: string, defaut: Vue3): Vue3 => {
  try { const v = localStorage.getItem(cle); if (v === 'a' || v === 'b' || v === 'c') return v; } catch {}
  return defaut;
};

export function useVue(cle: string, defaut: Vue3): [Vue3, (v: Vue3) => void] {
  const [vue, setVue] = useState<Vue3>(defaut);
  useEffect(() => {
    setVue(lire(cle, defaut));
    const surStockage = (e: StorageEvent) => { if (e.key === null || e.key === cle) setVue(lire(cle, defaut)); };
    window.addEventListener('storage', surStockage);
    return () => window.removeEventListener('storage', surStockage);
  }, [cle, defaut]);
  const choisir = (v: Vue3) => { try { localStorage.setItem(cle, v); } catch {} setVue(v); };
  return [vue, choisir];
}

/* Commande « Vue : A · B · C » (carré aux coins adoucis, boutons à bascule). `classe` = ind-choix | ent-choix (CSS en fin de globals.css). */
export function ChoixVue({ vue, choisir, noms, classe }: { vue: Vue3; choisir: (v: Vue3) => void; noms: Record<Vue3, string>; classe: string }) {
  const { t } = useT();
  return (
    <div className={classe} role="group" aria-label={t('Vue :').replace(/\s*:\s*$/, '')}>
      <span aria-hidden="true">{t('Vue :')}</span>
      {(['a', 'b', 'c'] as const).map((k) => (
        <button key={k} type="button" aria-pressed={vue === k} title={noms[k]} aria-label={`${t('Option {x}', { x: k.toUpperCase() })} : ${noms[k]}`} onClick={() => choisir(k)}>{k.toUpperCase()}</button>
      ))}
    </div>
  );
}
