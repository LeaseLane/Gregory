import { cache } from 'react';
import { cookies } from 'next/headers';
import { DICO_EN } from './en';
import { LOCALES, TEMOIN_LANGUE, fabriqueT, langueValide, type Langue, type T } from './langue';

/* Côté serveur (pages, layouts, CadreEspace…) : const { t, locale } = await tServeur();
   Le dictionnaire anglais reste au serveur; le navigateur ne le reçoit que si la personne a choisi l'anglais (LangueProvider). */
export const langueServeur = cache(async (): Promise<Langue> => langueValide((await cookies()).get(TEMOIN_LANGUE)?.value));
export async function tServeur(): Promise<{ t: T; langue: Langue; locale: string }> {
  const langue = await langueServeur();
  return { t: fabriqueT(langue === 'en' ? DICO_EN : null), langue, locale: LOCALES[langue] };
}
export { DICO_EN };
