import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_CLI, SOUS_CLI } from '../onglets';
import { ImportParc } from './ImportParc';

/* Clients · Import et export (phase 1 du plan du 12 nov. 2026) : le parc d'un client depuis un fichier Excel ou CSV (un logement par ligne),
   avec vérification des colonnes et de la segmentation avant toute création; export du parc au même format. */
export default function Page() {
  return <CadreEspace icone="users" nom="Clients" sous={SOUS_CLI} actif={5} onglets={ONGLETS_CLI}><ImportParc /></CadreEspace>;
}
