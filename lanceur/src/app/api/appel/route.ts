import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Fiche deal › « Noter un appel » (prospecteur dans le nouvel espace) : relais vers caller-api add_call avec le jeton de la personne.
   caller-api revérifie tout (fiche d'appelant active, prospect assigné ou créé par lui) et résume l'appel (Cléo), comme dans l'ancien portail. */
export async function POST(req: Request) {
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const { prospect_id, transcript } = await req.json().catch(() => ({}));
  if (typeof prospect_id !== 'string' || typeof transcript !== 'string' || transcript.trim().length < 3) return NextResponse.json({ error: 'Écrivez ce qui s’est dit pendant l’appel.' }, { status: 400 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/caller-api`, {
    method: 'POST', cache: 'no-store', body: JSON.stringify({ action: 'add_call', prospect_id, transcript: transcript.trim().slice(0, 8000) }),
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
