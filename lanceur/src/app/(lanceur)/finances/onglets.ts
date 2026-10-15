import type { Onglet } from '@/composants/CadreEspace';
/* Finances (maquette B.SP.fin) + Relevés (TH, e45) + Relevés 31 (TF, x15) + Débours (x14). */
export const ONGLETS_FIN: Onglet[] = [{ libelle: 'Paiements', href: '/finances/paiements' }, { libelle: 'Facturation et PAD', href: '/finances/facturation' }, { libelle: 'Comptabilité', href: '/finances/comptabilite' },
  { libelle: 'Rapprochement', href: '/finances/rapprochement' }, { libelle: 'Anomalies', href: '/finances/anomalies' }, { libelle: 'Factures fournisseurs', href: '/finances/factures-fournisseurs' },
  { libelle: 'Relevés', href: '/finances/releves' }, { libelle: 'Relevés 31', href: '/finances/releves-31' }, { libelle: 'Débours', href: '/finances/debours' }];
export const SOUS_FIN = 'Facturation, paiements, comptabilité et banques';
export const argent = (n: number | string | null | undefined, cents = false) => n == null ? '—' : `${Number(n).toLocaleString('fr-CA', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).replace(/[  ]/g, ' ')} $`;
export const jour = (iso: string | null | undefined) => !iso ? '—' : new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
export const moisLong = (iso: string) => new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString('fr-CA', { month: 'long' });
