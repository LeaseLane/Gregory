import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Relais vers l'agent de prospection (find-prospects-ai) avec le jeton de la personne. La base vérifie le droit
   (ventes.prospection.ecrire) et la 2FA. Une recherche web prend jusqu'à une minute. */
export const maxDuration = 120;
export async function POST(req: Request) {
  const corps = await req.json().catch(() => ({}));
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/find-prospects-ai`, {
    method: 'POST', cache: 'no-store',
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corps.action === 'coordonnees' ? { action: 'coordonnees', cle: String(corps.cle ?? '').slice(0, 200) }
      : corps.action === 'proprietaire' ? { action: 'proprietaire', id: String(corps.id ?? '').slice(0, 36) }
      : { action: 'run', territoire: String(corps.territoire ?? '').slice(0, 80), portes_min: Number(corps.portes_min) || 4 }),
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
