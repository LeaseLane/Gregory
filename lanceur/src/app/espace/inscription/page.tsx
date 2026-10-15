import { CadreAuth } from '../../(auth)/CadreAuth';
import { FormulaireInscription } from './FormulaireInscription';
import { espaceDe, libelle } from '../titre';

/* A2 · Inscription avec un code d'invitation (onglets Locataire / Propriétaire). */
export default async function Inscription({ searchParams }: { searchParams: Promise<{ p?: string; code?: string }> }) {
  const { p, code } = await searchParams, e = espaceDe(p);
  return <CadreAuth espace={p === 'equipe' ? undefined : libelle(e)}><FormulaireInscription espace={e} code={code ?? ''} equipe={p === 'equipe'} /></CadreAuth>;
}
