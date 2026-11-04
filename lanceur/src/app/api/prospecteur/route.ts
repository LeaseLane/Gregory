import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Relais de l'espace prospecteur vers caller-api avec le jeton de la personne (la fonction vérifie le compte d'appelant et ses prospects). */
const ACTIONS = new Set(['create_prospect', 'update_my_stage']);
export async function POST(req: Request) {
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const corps = await req.json().catch(() => ({}));
  if (!ACTIONS.has(corps?.action)) return NextResponse.json({ error: 'Demande invalide.' }, { status: 400 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/caller-api`, {
    method: 'POST', cache: 'no-store', body: JSON.stringify(corps),
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
