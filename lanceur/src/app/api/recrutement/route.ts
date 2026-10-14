import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Relais vers l'agent de recrutement (agent-recrutement) avec le jeton de la personne. La base vérifie le droit
   (maintenance.ecrire) et la 2FA. La recherche active (spécialité, secteurs) est lue en base. Jusqu'à une minute. */
export const maxDuration = 120;
export async function POST() {
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-recrutement`, {
    method: 'POST', cache: 'no-store', body: '{}',
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
