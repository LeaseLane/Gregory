import { CadreAuth } from '../../(auth)/CadreAuth';
import { InscriptionFacteur } from '../../(auth)/connexion/inscription-2fa/InscriptionFacteur';
import { espaceDe, libelle } from '../titre';

/* p09 / t05 · Double authentification : obligatoire pour les propriétaires, offerte aux locataires. */
export default async function Page({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const e = espaceDe((await searchParams).p);
  return <CadreAuth espace={libelle(e)}><InscriptionFacteur apres="/espace" sortie={`/espace/connexion?p=${e}`} /></CadreAuth>;
}
