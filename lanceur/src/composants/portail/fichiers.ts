'use client';
import { supabaseNavigateur } from '@/lib/supabase/client';
import type { T } from '@/lib/i18n/langue';

const fr: T = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k] ?? '') : m)) : s);   // sans traducteur : français

/* Fichiers des portails : lien signé (accès vérifié en base) et téléversement dans le dossier de la personne, bucket « portail » :
   proprietaires/<owner_id>/… ou locataires/<tenant_id>/… (les règles de stockage n'acceptent que son propre dossier). */
type Cible = { type: 'document' | 'photo'; id: string } | { type: 'photo_demande'; id: string; index: number } | { type: 'piece'; source: 'message' | 'demande'; id: string; index: number };
export async function lienFichier(cible: Cible | 'document' | 'photo', id?: string, telecharger = false): Promise<string | null> {
  const c = typeof cible === 'string' ? { type: cible, id: id! } : cible;
  const r = await fetch('/api/portail/fichier', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...c, telecharger }) });
  const j = await r.json().catch(() => ({}));
  return r.ok ? j.url : null;
}
export async function ouvrirFichier(id: string | Cible, telecharger = false) {
  const fenetre = window.open('', '_blank');
  const u = await lienFichier(typeof id === 'string' ? { type: 'document', id } : id, undefined, telecharger);
  if (u && fenetre) fenetre.location.href = u; else fenetre?.close();
  return !!u;
}
const MAX = 25 * 1024 * 1024;
const TYPES = /\.(pdf|jpe?g|png|heic|webm|ogg|m4a|mp3|xlsx|docx)$/i;
export async function televerser(f: File, sousDossier: string, t: T = fr): Promise<{ chemin: string; taille: number } | { erreur: string }> {
  if (f.size > MAX) return { erreur: t('{nom} dépasse 25 Mo.', { nom: f.name }) };
  if (!TYPES.test(f.name)) return { erreur: t('{nom} : PDF, image, document ou enregistrement seulement.', { nom: f.name }) };
  const sb = supabaseNavigateur();
  const [{ data: proprio }, { data: locataire }] = await Promise.all([sb.rpc('auth_owner_id'), sb.rpc('auth_tenant_id')]);
  const racine = proprio ? `proprietaires/${proprio}` : locataire ? `locataires/${locataire}` : null;
  if (!racine) return { erreur: t('Session expirée : reconnectez-vous.') };
  const nom = f.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').toLowerCase();
  const chemin = `${racine}/${sousDossier}/${crypto.randomUUID().slice(0, 8)}-${nom}`;
  const { error } = await sb.storage.from('portail').upload(chemin, f, { contentType: f.type || undefined, upsert: false });
  return error ? { erreur: t('{nom} n’a pas été téléversé : {message}', { nom: f.name, message: error.message }) } : { chemin, taille: f.size };
}
// Photos d'une demande : bucket « service-request-photos », dossier <tenant_id>/ (règle de stockage existante; lues par l'équipe et le propriétaire).
export async function televerserPhotoDemande(f: File, t: T = fr): Promise<string | { erreur: string }> {
  if (f.size > MAX) return { erreur: t('{nom} dépasse 25 Mo.', { nom: f.name }) };
  if (!/\.(jpe?g|png|heic|webp|mp4|mov)$/i.test(f.name)) return { erreur: t('{nom} : photo ou vidéo seulement.', { nom: f.name }) };
  const sb = supabaseNavigateur();
  const { data: ta } = await sb.rpc('auth_tenant_id');
  if (!ta) return { erreur: t('Session expirée : reconnectez-vous.') };
  const chemin = `${ta}/${Date.now()}_${f.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').toLowerCase()}`;
  const { error } = await sb.storage.from('service-request-photos').upload(chemin, f, { contentType: f.type || undefined, upsert: false });
  return error ? { erreur: t('{nom} n’a pas été téléversée : {message}', { nom: f.name, message: error.message }) } : chemin;
}
