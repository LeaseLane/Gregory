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
