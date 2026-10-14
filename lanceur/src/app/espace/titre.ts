import type { Espace } from '../(auth)/connexion/FormulaireConnexion';
/* ?p=proprietaire|locataire → l'espace affiché (locataire par défaut). */
export const espaceDe = (p?: string): Espace => (p === 'proprietaire' ? 'proprietaire' : 'locataire');
export const libelle = (e: Espace) => (e === 'proprietaire' ? 'propriétaire' : 'locataire') as 'propriétaire' | 'locataire';
