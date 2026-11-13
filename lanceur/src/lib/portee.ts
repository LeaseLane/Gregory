/* Portée « client → immeuble » de l'administration (phase 1, D01) : le choix vit dans un témoin et part dans l'en-tête
   « x-ll-portee » de chaque appel à la base, qui ne rend alors que les données de ce client (vues portee.*). */
export const TEMOIN_PORTEE = 'll_portee';
export const EN_TETE_PORTEE = 'x-ll-portee';
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
export const porteeValide = (v: string | undefined | null) => (v && new RegExp(`^${UUID}(:${UUID})?$`).test(v) ? v : null);

/* Où la portée ne s'applique pas.
   - Une fiche (adresse qui contient un identifiant) : on l'a ouverte exprès (recherche, lien, alerte), elle s'affiche en entier même si elle
     appartient à un autre client que celui du sélecteur. Sans cela, elle paraissait « introuvable ».
   - L'accueil, Réglages, Cléo et IA, et le fidéicommis : leurs données ne se lisent pas par client (tuiles d'état, équipe, compte bancaire commun). */
export const EN_TETE_CHEMIN = 'x-ll-chemin';
const FICHE = new RegExp(`/${UUID}(/|$)`);
const SANS_PORTEE = ['/reglages', '/cleo-ia', '/finances/fideicommis'];
export type EtatPortee = 'active' | 'fiche' | 'sans' | 'ventes';
export function etatPortee(chemin: string | null | undefined): EtatPortee {
  const c = chemin ?? '';
  if (FICHE.test(c)) return 'fiche';
  if (c === '/' || SANS_PORTEE.some((p) => c === p || c.startsWith(`${p}/`))) return 'sans';
  return c.startsWith('/ventes') ? 'ventes' : 'active';
}
export const porteePour = (chemin: string | null | undefined, valeur: string | undefined | null) => (['fiche', 'sans'].includes(etatPortee(chemin)) ? null : porteeValide(valeur));
