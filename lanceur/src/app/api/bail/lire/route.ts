import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Nouveau client › « Importer le bail » : relais vers la fonction lire-bail avec le jeton de la personne
   (les adresses du Lanceur ne sont pas dans les origines permises des fonctions; la fonction revérifie le droit clients.ecrire). */
export async function POST(req: Request) {
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const f = (await req.formData().catch(() => null))?.get('fichier');
  if (!(f instanceof File)) return NextResponse.json({ error: 'Déposez le bail en PDF, JPG ou PNG.' }, { status: 400 });
  if (f.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Le fichier dépasse 10 Mo." }, { status: 413 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/lire-bail`, {
    method: 'POST', cache: 'no-store',
    body: JSON.stringify({ fichier: Buffer.from(await f.arrayBuffer()).toString('base64'), mime: f.type }),
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
