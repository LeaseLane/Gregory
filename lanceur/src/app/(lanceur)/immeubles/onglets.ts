import type { Onglet } from '@/composants/CadreEspace';
import { argentL } from '@/lib/format';
/* Immeubles (maquette B.SP.immeubles) + À valider (x09, TH). */
export const ongletsImm = (aValider?: number): Onglet[] => [{ libelle: 'Immeubles', href: '/immeubles' }, { libelle: 'Logements', href: '/immeubles/logements' },
  { libelle: 'Mise en marché', href: '/immeubles/mise-en-marche' }, { libelle: 'Annonces', href: '/immeubles/annonces' }, { libelle: 'À valider', href: '/immeubles/a-valider', compte: aValider }];
export const SOUS_IMM = 'Le parc, les logements et leur mise en marché';
export const argent = (n: number | null | undefined, locale = 'fr-CA') => n == null ? '—' : argentL(Math.round(Number(n)), locale);
export const dateCourte = (iso: string | null | undefined, locale = 'fr-CA', an = false) => !iso ? '—' : new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(locale, an ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
export const photoUrl = (chemin: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-photos/${chemin}`;
export const CANAUX: Record<string, string> = { site: 'Site Lease Lane', marketplace: 'Marketplace', kijiji: 'Kijiji', louer: 'Louer.ca' };
