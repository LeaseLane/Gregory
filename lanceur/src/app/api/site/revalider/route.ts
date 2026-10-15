import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Après une publication dans le Studio : demande au site de régénérer ses pages (ISR, revalidateTag). Le secret reste côté serveur (SITE_REVALIDATION_SECRET).
   Sans SITE_URL configuré, rien ne part : la page reste à jour à la prochaine régénération normale. */
export async function POST(req: Request) {
  const supabase = await supabaseServeur();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const { data: site } = await supabase.rpc('lanceur_site');
  if (!(site as { peut_ecrire?: boolean } | null)?.peut_ecrire) return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  const { quoi } = await req.json().catch(() => ({ quoi: '' }));
  if (!['articles', 'logements'].includes(quoi)) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  if (!process.env.SITE_URL || !process.env.SITE_REVALIDATION_SECRET) return NextResponse.json({ ok: false, raison: 'site non configuré' });
  const r = await fetch(`${process.env.SITE_URL}/api/revalider`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-revalidation-secret': process.env.SITE_REVALIDATION_SECRET }, body: JSON.stringify({ tag: quoi }) }).catch(() => null);
  return NextResponse.json({ ok: !!r?.ok });
}
