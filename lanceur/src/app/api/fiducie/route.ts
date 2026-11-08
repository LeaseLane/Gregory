import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Relais de Finances › Fidéicommis vers ops-api (registre, dépôts, versements du 15, rapprochement mensuel), avec le jeton de la personne :
   ops-api revérifie le double facteur et le rôle administrateur, et la base tient les règles (registre immuable, pas d'avance, réserve).
   Seules les actions fiducie_* passent. */
export async function POST(req: Request) {
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const corps = await req.json().catch(() => null) as { action?: unknown } | null;
  if (!corps || typeof corps.action !== 'string' || !/^fiducie_[a-z0-9_]+$/.test(corps.action)) return NextResponse.json({ error: 'Demande invalide.' }, { status: 400 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ops-api`, {
    method: 'POST', cache: 'no-store', body: JSON.stringify(corps),
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
