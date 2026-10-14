import { CadreEspace } from '@/composants/CadreEspace';
import { VENTES, ongletsVentes } from '@/lib/ventes';
import { Import } from './Import';

/* Ventes · Importer un CSV (maquette e17) : Fichier → Colonnes → Doublons → Confirmation. Rien n'est créé avant la confirmation. */
export default function Page() {
  return (
    <CadreEspace icone={VENTES.icone} nom={VENTES.nom} sous={VENTES.sous} actif={2} onglets={ongletsVentes()}>
      <Import />
    </CadreEspace>
  );
}
