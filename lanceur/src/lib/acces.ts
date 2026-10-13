/* Où envoyer l'usager selon sa session (ARCHITECTURE.md § 4).
   Pas d'exemption « sans facteur » : sans 2FA, on va à l'inscription du facteur, jamais aux données. */
export type Niveau = { utilisateur: boolean; actuel: string | null; suivant: string | null };

export function destination(n: Niveau): '/connexion' | '/connexion/code' | '/connexion/inscription-2fa' | null {
  if (!n.utilisateur) return '/connexion';
  if (n.suivant === 'aal2' && n.actuel !== 'aal2') return '/connexion/code';
  if (n.suivant !== 'aal2') return '/connexion/inscription-2fa';
  return null;
}
