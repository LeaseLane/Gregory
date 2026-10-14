'use client';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Fichiers des portails : lien signé (vérifié en base) et téléversement dans le dossier du propriétaire (bucket « portail »). */
export async function lienFichier(type: 'document' | 'photo', id: string, telecharger = false): Promise<string | null> {
  const r = await fetch('/api/portail/fichier', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, id, telecharger }) });
  const j = await r.json().catch(() => ({}));
  return r.ok ? j.url : null;
}
export async function ouvrirFichier(id: string, telecharger = false) {
  const fenetre = window.open('', '_blank');
  const u = await lienFichier('document', id, telecharger);
  if (u && fenetre) fenetre.location.href = u; else fenetre?.close();
  return !!u;
}
const MAX = 25 * 1024 * 1024;
export async function televerser(f: File, sousDossier: string): Promise<{ chemin: string; taille: number } | { erreur: string }> {
  if (f.size > MAX) return { erreur: `${f.name} dépasse 25 Mo.` };
  if (!/\.(pdf|jpe?g|png|heic)$/i.test(f.name)) return { erreur: `${f.name} : PDF, JPG ou PNG seulement.` };
  const sb = supabaseNavigateur();
  const { data: proprio } = await sb.rpc('auth_owner_id');
  if (!proprio) return { erreur: 'Session expirée : reconnectez-vous.' };
  const nom = f.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').toLowerCase();
  const chemin = `proprietaires/${proprio}/${sousDossier}/${crypto.randomUUID().slice(0, 8)}-${nom}`;
  const { error } = await sb.storage.from('portail').upload(chemin, f, { contentType: f.type || undefined, upsert: false });
  return error ? { erreur: `${f.name} n’a pas été téléversé : ${error.message}` } : { chemin, taille: f.size };
}
