import { CadreAuth } from '../../(auth)/CadreAuth';
import { FormulaireCode } from '../../(auth)/connexion/code/FormulaireCode';
import { espaceDe, libelle } from '../titre';

export default async function Page({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const e = espaceDe((await searchParams).p);
  return <CadreAuth espace={libelle(e)}><FormulaireCode apres="/espace" inscription="/espace/2fa" sortie={`/espace/connexion?p=${e}`} titre="Connexion à votre espace" rappel="Chaque connexion à votre espace est inscrite au journal de votre compte." /></CadreAuth>;
}
