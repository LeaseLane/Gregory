import type { Onglet } from '@/composants/CadreEspace';
/* Finances (maquette B.SP.fin) + Relevés (TH, e45) + Relevés 31 (TF, x15) + Débours (x14) + Fidéicommis (registre, dépôts, versements, rapprochement; 2026-11-09). */
/* 12 pages en 5 groupes (2026-11-14) : la rangée d'onglets tenait sur deux lignes. Le groupe porte l'onglet du haut; ses pages sont les
   sous-onglets, comme dans Clients › Documents. L'ordre de cette liste est celui de l'écran : « actif » d'une page est sa position ici. */
export const ONGLETS_FIN: Onglet[] = [{ libelle: 'Vue d’ensemble', href: '/finances/vue' },
  { libelle: 'Paiements', href: '/finances/paiements', groupe: 'Loyers' }, { libelle: 'Facturation et PAD', href: '/finances/facturation', groupe: 'Loyers' }, { libelle: 'Prélèvements', href: '/finances/prelevements', groupe: 'Loyers' },
  { libelle: 'Factures fournisseurs', href: '/finances/factures-fournisseurs', groupe: 'Dépenses' }, { libelle: 'Débours', href: '/finances/debours', groupe: 'Dépenses' },
  { libelle: 'Comptabilité', href: '/finances/comptabilite', groupe: 'Comptabilité' }, { libelle: 'Rapprochement', href: '/finances/rapprochement', groupe: 'Comptabilité' }, { libelle: 'Anomalies', href: '/finances/anomalies', groupe: 'Comptabilité' },
  { libelle: 'Fidéicommis', href: '/finances/fideicommis', groupe: 'Comptabilité' },
  { libelle: 'Relevés', href: '/finances/releves', groupe: 'Relevés' }, { libelle: 'Relevés 31', href: '/finances/releves-31', groupe: 'Relevés' }];
export const SOUS_FIN = 'Facturation, paiements, comptabilité et banques';
export const argent = (n: number | string | null | undefined, cents = false) => n == null ? '—' : `${Number(n).toLocaleString('fr-CA', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).replace(/[  ]/g, ' ')}\u00a0$`;
export const jour = (iso: string | null | undefined) => !iso ? '—' : new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
export const moisLong = (iso: string) => new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString('fr-CA', { month: 'long' });
