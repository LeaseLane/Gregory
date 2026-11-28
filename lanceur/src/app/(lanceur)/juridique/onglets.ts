import type { Vue } from './Juridique';
/* Onglets de l'espace Juridique : un seul endroit pour l'en-tête (PageJuridique) et le menu des espaces (MegaMenu). */
export const ONGLETS_JUR: [Vue, string, string][] = [['dossiers', 'Dossiers', '/juridique'], ['rappels', 'Rappels', '/juridique/rappels'], ['mises', 'Mises en demeure', '/juridique/mises-en-demeure'],
  ['tal', 'Tribunal (TAL)', '/juridique/tal'], ['modeles', 'Modèles', '/juridique/modeles']];
export const SOUS_JUR = 'Rappels, mises en demeure et dossiers au TAL : rédigés par l’IA, approuvés par une personne';
