import { NextResponse } from 'next/server';
import { supabaseServeur } from '@/lib/supabase/serveur';

/* Relais de Maintenance vers les fonctions existantes, avec le jeton de la personne (les fonctions revérifient tout) :
   inviter (inscription du site → onboarding-api inviter_inscription), assurance (preuve d'une inscription → ops-api inscription_document),
   acces_fournisseur (fiche fournisseur → onboarding-api grant_worker_access, ce que faisait l'ancien admin),
   document (pièce de maintenance → chemin vérifié en base par lanceur_maintenance_document, puis lien signé de 5 min par ops-api). */
export async function POST(req: Request) {
  const supabase = await supabaseServeur();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  const { action, id } = await req.json().catch(() => ({}));
  if (typeof id !== 'string') return NextResponse.json({ error: 'Demande invalide.' }, { status: 400 });
  let cible: [string, Record<string, unknown>];
  if (action === 'inviter') cible = ['onboarding-api', { action: 'inviter_inscription', id }];
  else if (action === 'assurance') cible = ['ops-api', { action: 'inscription_document', id }];
  else if (action === 'acces_fournisseur') cible = ['onboarding-api', { action: 'grant_worker_access', worker_id: id }];
  else if (action === 'document') {
    const { data: chemin, error } = await supabase.rpc('lanceur_maintenance_document', { p_id: id });
    if (error || !chemin) return NextResponse.json({ error: error?.message ?? 'Document introuvable.' }, { status: 404 });
    cible = ['ops-api', { action: 'get_signed_url', bucket: 'documents', path: chemin }];
  } else return NextResponse.json({ error: 'Demande invalide.' }, { status: 400 });
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${cible[0]}`, {
    method: 'POST', cache: 'no-store', body: JSON.stringify(cible[1]),
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
  });
  return NextResponse.json(await res.json().catch(() => ({ error: 'Réponse illisible.' })), { status: res.status });
}
