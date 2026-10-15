/* Où envoyer l'usager selon sa session (ARCHITECTURE.md § 4).
   Pas d'exemption « sans facteur » : sans 2FA, on va à l'inscription du facteur, jamais aux données. */
export type Niveau = { utilisateur: boolean; actuel: string | null; suivant: string | null };

export function destination(n: Niveau): '/connexion' | '/connexion/code' | '/connexion/inscription-2fa' | null {
  if (!n.utilisateur) return '/connexion';
  if (n.suivant === 'aal2' && n.actuel !== 'aal2') return '/connexion/code';
  if (n.suivant !== 'aal2') return '/connexion/inscription-2fa';
  return null;
}

/* Portails (/espace, /proprietaire, /locataire) : sans session → connexion; facteur inscrit mais code non saisi → code.
   La 2FA OBLIGATOIRE du propriétaire (inscription du facteur) est imposée par sa coquille et par la base (crm.exiger_niveau_portail). */
export const PORTAIL = /^\/(espace|proprietaire|locataire)(\/|$)/;
const LIBRES = ['/espace/connexion', '/espace/inscription', '/espace/oubli', '/espace/lien-envoye'];
export function destinationPortail(n: Niveau, chemin: string): string | null {
  const libre = LIBRES.some((l) => chemin.startsWith(l));
  if (!n.utilisateur) return libre ? null : '/espace/connexion';
  if (n.suivant === 'aal2' && n.actuel !== 'aal2') return chemin.startsWith('/espace/code') ? null : '/espace/code';
  if (libre || chemin.startsWith('/espace/code')) return '/espace';
  return null;
}
