import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Réglages › Équipe › Comptes : « Réinitialiser le mot de passe » d'un membre. onboarding-api vérifie le droit (reglages.equipe) avec le
   jeton de la personne et envoie un lien à jeton valable dans n'importe quel navigateur. */
export async function POST(req: Request) {
  const { courriel } = await req.json().catch(() => ({}));
  const { data: { session } } = await (await supabaseServeur()).auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/onboarding-api`, {
    method: 'POST', cache: 'no-store',
    body: JSON.stringify({ action: 'reinitialiser_mot_de_passe', courriel: String(courriel ?? '').slice(0, 200), origine: new URL(req.url).origin === 'http://localhost:3020' ? 'http://localhost:3020' : 'https://admin.leaselane.ca' }),
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
