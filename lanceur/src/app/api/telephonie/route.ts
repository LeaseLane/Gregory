import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Relais vers la fonction edge « telephonie » avec le jeton de la personne (pas de CORS côté navigateur).
   Les droits (2FA, rôle) sont vérifiés par la base dans lanceur_preparer_appel / lanceur_appels. */
const ROUTES = new Set(['demarrer', 'simuler_entrant']);

export async function POST(req: Request) {
  const { r, ...corps } = await req.json().catch(() => ({}));
  if (!ROUTES.has(r)) return NextResponse.json({ error: 'Route inconnue.' }, { status: 400 });
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/telephonie?r=${r}`, {
    method: 'POST', cache: 'no-store',
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
