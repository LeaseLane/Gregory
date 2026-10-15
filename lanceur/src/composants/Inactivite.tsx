'use client';
import { useEffect } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Déconnexion après inactivité (Réglages › Sécurité) : aucune frappe, clic ni défilement pendant le délai → fin de session, retour à la connexion. */
export function Inactivite({ minutes }: { minutes: number }) {
  useEffect(() => {
    if (!minutes) return;
    let t: ReturnType<typeof setTimeout>;
    const fin = async () => { await supabaseNavigateur().auth.signOut(); window.location.assign('/connexion?raison=inactivite'); };
    const relancer = () => { clearTimeout(t); t = setTimeout(fin, minutes * 60_000); };
    const ev = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    ev.forEach((e) => window.addEventListener(e, relancer, { passive: true })); relancer();
    return () => { clearTimeout(t); ev.forEach((e) => window.removeEventListener(e, relancer)); };
  }, [minutes]);
  return null;
}
