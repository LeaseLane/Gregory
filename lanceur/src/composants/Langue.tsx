'use client';
import { createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALES, TEMOIN_LANGUE, fabriqueT, type Dico, type Langue, type T } from '@/lib/i18n/langue';

/* Langue dans le navigateur (composants « use client ») : const { t, locale, langue } = useT();
   Le dictionnaire vient du layout racine, seulement quand l'anglais est choisi (rien de plus à télécharger en français). */
const Ctx = createContext<{ langue: Langue; dico: Dico | null }>({ langue: 'fr', dico: null });

export function LangueProvider({ langue, dico, children }: { langue: Langue; dico: Dico | null; children: React.ReactNode }) {
  const v = useMemo(() => ({ langue, dico }), [langue, dico]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useT(): { t: T; langue: Langue; locale: string } {
  const { langue, dico } = useContext(Ctx);
  return useMemo(() => ({ t: fabriqueT(dico), langue, locale: LOCALES[langue] }), [langue, dico]);
}

/* Bouton FR / EN : garde le choix un an (témoin), puis redessine la page dans l'autre langue sans la recharger. */
export function BoutonLangue({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { langue } = useT();
  const router = useRouter();
  const autre: Langue = langue === 'fr' ? 'en' : 'fr';
  return (
    <button type="button" className={className ?? 'lien'} style={style} lang={autre === 'en' ? 'en' : 'fr'}
      aria-label={autre === 'en' ? 'Switch to English' : 'Passer au français'}
      onClick={() => { document.cookie = `${TEMOIN_LANGUE}=${autre}; path=/; max-age=31536000; SameSite=Lax`; document.documentElement.lang = LOCALES[autre]; router.refresh(); }}>
      {autre === 'en' ? 'English' : 'Français'}
    </button>
  );
}

/* Bascule « FR | EN » compacte des menus (Steven, 27 nov. 2026 : « toggle french and english ») : les deux langues sont visibles, la langue
   courante est en surbrillance. Même témoin et même redessin que BoutonLangue. */
export function ToggleLangue({ className, long = false }: { className?: string; long?: boolean }) {  /* long : « Français | English » au lieu de « FR | EN » (essai du bas du menu locataire, TEMPORAIRE) */
  const { langue } = useT();
  const router = useRouter();
  const choisir = (l: Langue) => { if (l === langue) return; document.cookie = `${TEMOIN_LANGUE}=${l}; path=/; max-age=31536000; SameSite=Lax`; document.documentElement.lang = LOCALES[l]; router.refresh(); };
  return (
    <span className={'toggle-langue' + (className ? ` ${className}` : '')} role="group" aria-label={langue === 'en' ? 'Language' : 'Langue'}>
      {(['fr', 'en'] as const).map((l) => <button key={l} type="button" lang={l} className={langue === l ? 'actif' : ''} aria-pressed={langue === l} aria-label={l === 'fr' ? 'Français' : 'English'} title={l === 'fr' ? 'Français' : 'English'} onClick={() => choisir(l)}>{long ? (l === 'fr' ? 'Français' : 'English') : l.toUpperCase()}</button>)}
    </span>
  );
}

/* Choix « Français | English » (comme le thème) : la langue courante est en surbrillance. Pour une ligne « Langue » de menu
   ou de profil, où un simple bouton portant l'autre langue se lisait comme la langue courante (retour d'Octa, 2026-11-25). */
export function ChoixLangue() {
  const { langue } = useT();
  const router = useRouter();
  const choisir = (l: Langue) => { if (l === langue) return; document.cookie = `${TEMOIN_LANGUE}=${l}; path=/; max-age=31536000; SameSite=Lax`; document.documentElement.lang = LOCALES[l]; router.refresh(); };
  return (
    <span className="lo-segments" role="group" aria-label={langue === 'en' ? 'Language' : 'Langue'}>
      {(['fr', 'en'] as const).map((l) => <button key={l} type="button" lang={l} className={langue === l ? 'actif' : ''} aria-pressed={langue === l} onClick={() => choisir(l)}>{l === 'fr' ? 'Français' : 'English'}</button>)}
    </span>
  );
}
