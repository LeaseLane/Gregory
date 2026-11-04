'use client';
import { supabaseNavigateur } from '@/lib/supabase/client';

/* Pièces jointes de maintenance : dépôt dans le bucket « documents » (dossier imposé, vérifié ensuite en base) et ouverture par lien signé. */
export const ACCEPTE = '.pdf,.jpg,.jpeg,.png';
export async function deposer(dossier: string, f: File): Promise<{ chemin: string; taille: number }> {
  if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) throw new Error('Formats acceptés : PDF, JPG ou PNG.');
  if (f.size > 10 * 1024 * 1024) throw new Error('Fichier trop lourd : 10 Mo maximum.');
  const chemin = `${dossier}/${crypto.randomUUID()}.${f.name.split('.').pop()!.toLowerCase()}`;
  const { error } = await supabaseNavigateur().storage.from('documents').upload(chemin, f, { contentType: f.type || 'application/octet-stream' });
  if (error) throw new Error(`Le fichier n’a pas pu être déposé : ${error.message}`);
  return { chemin, taille: f.size };
}
// Si le rattachement échoue, le fichier déposé est retiré (la base le permet tant qu'aucun document ne le cite).
export const retirer = (chemin: string) => supabaseNavigateur().storage.from('documents').remove([chemin]);
export async function ouvrir(id: string): Promise<string | null> {
  const r = await fetch('/api/inscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'document', id }) });
  const x = await r.json().catch(() => ({}));
  if (!r.ok || !x.signed_url) return x.error ?? 'Lien indisponible.';
  window.open(x.signed_url, '_blank', 'noopener'); return null;
}
