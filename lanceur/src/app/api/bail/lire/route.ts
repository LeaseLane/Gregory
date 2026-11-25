import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Nouveau client › « Importer le bail » : relais vers la fonction lire-bail avec le jeton de la personne
   (les adresses du Lanceur ne sont pas dans les origines permises des fonctions; la fonction revérifie le droit clients.ecrire). */
// Type d'après l'extension quand le navigateur n'en donne pas (fréquent pour .docx, .odt) : le bail en Word, PowerPoint ou OpenDocument
// est lu aussi (2026-11-25). « action=transcrire » demande une copie modifiable (.docx).
const PAR_EXTENSION: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', txt: 'text/plain',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text' };
export const maxDuration = 300;

export async function POST(req: Request) {
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const form = await req.formData().catch(() => null), f = form?.get('fichier'), action = form?.get('action') === 'transcrire' ? 'transcrire' : undefined;
  if (!(f instanceof File)) return NextResponse.json({ error: 'Déposez le bail en PDF, Word, PowerPoint ou photo.' }, { status: 400 });
  const ext = f.name.split('.').pop()?.toLowerCase() ?? '', mime = !f.type || f.type === 'application/octet-stream' ? (PAR_EXTENSION[ext] ?? f.type) : f.type;
  if (f.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Le fichier dépasse 10 Mo." }, { status: 413 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/lire-bail`, {
    method: 'POST', cache: 'no-store',
    body: JSON.stringify({ fichier: Buffer.from(await f.arrayBuffer()).toString('base64'), mime, action }),
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
