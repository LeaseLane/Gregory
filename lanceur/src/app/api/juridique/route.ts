import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Relais vers la fonction juridique avec le jeton de la personne : { action: envoyer, id } d'une mise en demeure approuvée. La base vérifie
   le droit, la 2FA et l'approbation humaine; la production attend eZsign. */
export const maxDuration = 120;
export async function POST(req: Request) {
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/juridique`, {
    method: 'POST', cache: 'no-store', body: await req.text(),
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
