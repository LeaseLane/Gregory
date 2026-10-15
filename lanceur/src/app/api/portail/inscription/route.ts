import { NextResponse } from 'next/server';

/* Relais vers la fonction « portail-inscription » (A2). Aucune session : le code d'invitation et le courriel invité sont vérifiés en base. */
export async function POST(req: Request) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/portail-inscription`, {
    method: 'POST', cache: 'no-store', body: await req.text(),
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 'Content-Type': 'application/json', 'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
