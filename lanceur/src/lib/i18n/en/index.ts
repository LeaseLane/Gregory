// Tous les dictionnaires anglais, un fichier par section (une section = un fichier, pour travailler en parallèle).
import d_commun from './commun';
import d_operations from './operations';
import d_ventes from './ventes';
import d_clients from './clients';
import d_finances_a from './finances-a';
import d_finances_b from './finances-b';
import d_immeubles_juridique from './immeubles-juridique';
import d_maintenance from './maintenance';
import d_reglages from './reglages';
import d_studio from './studio';
import d_proprietaire from './proprietaire';
import d_locataire from './locataire';
import d_motifs from './motifs';
import d_arbitrage from './arbitrage';

export const DICO_EN: Record<string, string> = {
  ...d_commun,
  ...d_operations,
  ...d_ventes,
  ...d_clients,
  ...d_finances_a,
  ...d_finances_b,
  ...d_immeubles_juridique,
  ...d_maintenance,
  ...d_reglages,
  ...d_studio,
  ...d_proprietaire,
  ...d_locataire,
  ...d_motifs,
  ...d_arbitrage,   // en dernier : tranche les mots traduits différemment selon la section
};
