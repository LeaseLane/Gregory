import { cache } from 'react';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Qui est connecté dans Lanceur : rôle, nom, initiales, droits (public.lanceur_moi, crm.team_members).
   null = hors équipe → écran « Accès réservé ». Lu une fois par requête. */
export type Moi = { role: string; nom: string | null; initiales: string | null; permissions: string[] };

export const lireMoi = cache(async (): Promise<Moi | null> => {
  const supabase = await supabaseServeur();
  const { data, error } = await supabase.rpc('lanceur_moi');
  if (error) return null;
  return (data as Moi | null) ?? null;
});

export const peut = (moi: Moi, permission: string) => moi.role === 'admin' || moi.permissions.includes('*') || moi.permissions.includes(permission);

export const ROLES: Record<string, string> = {
  admin: 'administrateur', gestionnaire: 'gestionnaire', location: 'location', prospection: 'prospection', comptabilite: 'comptabilité', lecture: 'lecture',
};
