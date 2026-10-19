import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Démonstration seulement (demo.leaselane.ca, base de préproduction, univers fictif) : donne le code à 6 chiffres
   du compte connecté pour que les testeurs n'aient pas besoin d'application d'authentification. La base exige
   toujours le deuxième facteur (aal2) : rien n'est contourné, le code est seulement calculé ici.
   Partout ailleurs (LL_ENV ≠ demo, ou base de production) : 404, comme si la route n'existait pas. */
const PROD = 'kdmwfbcziokygfcmjxeq';
const b32 = (s: string) => {
  const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...s.toUpperCase().replace(/=+$/, '')].map((c) => a.indexOf(c).toString(2).padStart(5, '0')).join('');
  return Buffer.from((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)));
};
const totp = (secret: string) => {
  const t = Buffer.alloc(8);
  t.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = createHmac('sha1', b32(secret)).update(t).digest();
  const o = h[19] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0');
};

export async function GET() {
  if (process.env.LL_ENV !== 'demo' || (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes(PROD)) return new NextResponse(null, { status: 404 });
  const { data: { user } } = await (await supabaseServeur()).auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  let secrets: Record<string, string> = {};
  try { secrets = JSON.parse(process.env.LL_DEMO_TOTP ?? '{}'); } catch { /* variable mal formée : aucun code */ }
  const secret = secrets[user.email.toLowerCase()];
  if (!secret) return NextResponse.json({ error: 'Compte sans code de démonstration.' }, { status: 404 });
  return NextResponse.json({ code: totp(secret) }, { headers: { 'Cache-Control': 'no-store' } });
}
