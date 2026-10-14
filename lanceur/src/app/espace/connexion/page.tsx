import { CadreAuth } from '../../(auth)/CadreAuth';
import { FormulaireConnexion } from '../../(auth)/connexion/FormulaireConnexion';
import { espaceDe, libelle } from '../titre';

/* A1 · Connexion des portails (onglets Locataire / Propriétaire). */
export default async function Connexion({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const e = espaceDe((await searchParams).p);
  return <CadreAuth espace={libelle(e)}><FormulaireConnexion espace={e} /></CadreAuth>;
}
