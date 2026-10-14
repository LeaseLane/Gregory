import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Relais vers enquetes-credit avec le jeton de la personne : { ids } = la liste explicite approuvée. La base vérifie le
   droit, la 2FA, le consentement, l'unicité et le budget avant que quoi que ce soit parte au fournisseur. */
export const maxDuration = 120;
export async function POST(req: Request) {
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enquetes-credit`, {
    method: 'POST', cache: 'no-store', body: await req.text(),
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
