import type { Onglet } from '@/composants/CadreEspace';

/* Espace Ventes (B.SP.ventes) : onglets de la maquette + Prospecteurs (x18). */
export const VENTES = { icone: 'trend', nom: 'Ventes', sous: 'Pipelines, leads et prospection : de la première demande au mandat signé' };
/* Immeubles du rôle d'évaluation (et la file « À appeler » qui en découle) : tenus hors de la production pour l'instant (Octa, 2026-11-04);
   visibles sur la démo et en local. La base de production n'est pas touchée. Réafficher : retirer la condition. */
export const ROLE_VISIBLE = !(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes('kdmwfbcziokygfcmjxeq');
export const ongletsVentes = (): Onglet[] => [
  { libelle: 'Mandats propriétaires', href: '/ventes/mandats' }, { libelle: 'Location', href: '/ventes/location' },
  { libelle: 'Leads entrants', href: '/ventes/leads' }, { libelle: 'Contacts', href: '/ventes/contacts' }, { libelle: 'Prospection IA', href: '/ventes/prospection' }, { libelle: 'Prospecteurs', href: '/ventes/prospecteurs' }, ...(ROLE_VISIBLE ? [{ libelle: 'Immeubles (rôle)', href: '/ventes/immeubles' }, { libelle: 'À appeler', href: '/ventes/a-appeler' }] : []),
  { libelle: 'Mes prospects', href: '/ventes/mes-prospects' },   // prospects des prospecteurs téléphoniques (le prospecteur ne voit que cet onglet)
];
export const argent = (cents: number | null | undefined) => cents == null ? '—' : `${Math.round(cents / 100).toLocaleString('fr-CA').replace(/ |,/g, ' ')} $`;
export const initiales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase();
export const joursDepuis = (iso: string | null) => iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 864e5)) : 0;
