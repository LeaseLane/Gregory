import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Relais des inscriptions d'entreprises (Maintenance › Recrutement) avec le jeton de la personne :
   { action: 'inviter', id } → onboarding-api inviter_inscription; { action: 'assurance', id } → ops-api inscription_document (lien de 10 min). */
const CIBLES: Record<string, [string, string]> = { inviter: ['onboarding-api', 'inviter_inscription'], assurance: ['ops-api', 'inscription_document'] };
export async function POST(req: Request) {
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const { action, id } = await req.json().catch(() => ({}));
  const cible = CIBLES[action as string];
  if (!cible || typeof id !== 'string') return NextResponse.json({ error: 'Demande invalide.' }, { status: 400 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${cible[0]}`, {
    method: 'POST', cache: 'no-store', body: JSON.stringify({ action: cible[1], id }),
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
