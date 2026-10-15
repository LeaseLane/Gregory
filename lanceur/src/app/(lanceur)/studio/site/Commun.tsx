import Link from 'next/link';
import { SOUS_SITE } from '../onglets';
/* Studio › Site web : 4 sous-onglets (prototype GS, GP, AR, SE). */
export function SousSite({ actif }: { actif: string }) {
  return <nav className="sous-onglets" aria-label="Site web" style={{ marginBottom: 24 }}>{SOUS_SITE.map(([h, l]) => <Link key={h} href={h} className={h === actif ? 'actif' : ''} aria-current={h === actif ? 'page' : undefined}>{l}</Link>)}</nav>;
}
export type Art = { id: string; groupe: string; langue: string; slug: string | null; titre: string; categorie: string; statut: string; score: number; criteres: { id: string; champ: string | null; p: number; ok: boolean; t: string; d?: string }[];
  mot_cle: string; relu_par: string; relu_le: string | null; publie_le: string | null; modifie_le: string; jumelle: string | null };
export type Lg = { id: string; libelle: string; type: string | null; loyer: number | null; etat: string; site_statut: string; photos: number; photos_ok: boolean; texte: boolean; relu: boolean; position: boolean; en: boolean; badges: string[]; sur_le_site: boolean };
export type DonneesSite = { articles: Art[]; logements: Lg[]; mots_cles: { id: string; idee: string; mot_cle: string; intention: string | null; volume: string | null; note: string | null; article_id: string | null; created_at: string }[];
  activite: { demandes_30: number; par_type: Record<string, number>; ia_appels_30: number; ia_jetons_30: number }; branchements: { ga4: string; search_console: string; audit_seo: string }; peut_ecrire: boolean };
export const STATUTS: Record<string, [string, string]> = { brouillon: ['Brouillon', 'neutral'], revision: ['À réviser', ''], publie: ['Publié', 'final'], archive: ['Archivé', 'inactive'], loue: ['Loué', 'info'] };
export const CATS: Record<string, string> = { proprietaires: 'Propriétaires', locataires: 'Locataires', droit: 'Droit du logement', nouvelles: 'Nouvelles Lease Lane' };
export async function revalider(quoi: 'articles' | 'logements') { await fetch('/api/site/revalider', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quoi }) }).catch(() => null); }
