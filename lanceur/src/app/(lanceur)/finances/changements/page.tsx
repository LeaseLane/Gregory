import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Changements } from './Changements';

/* Finances · Marché · Nouveaux propriétaires (phase 2 du plan du 13 nov. 2026) : immeubles dont le propriétaire est inscrit au rôle depuis peu. */
export default function Page() {
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={15} onglets={ONGLETS_FIN}>
      <Changements />
    </CadreEspace>
  );
}
