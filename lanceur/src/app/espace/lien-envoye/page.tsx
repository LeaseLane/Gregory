import { CadreAuth } from '../../(auth)/CadreAuth';
import { Renvoyer } from './Renvoyer';
import { espaceDe, libelle } from '../titre';

export default async function Page({ searchParams }: { searchParams: Promise<{ p?: string; courriel?: string }> }) {
  const s = await searchParams, e = espaceDe(s.p);
  return <CadreAuth espace={libelle(e)}><Renvoyer espace={e} courriel={s.courriel ?? ''} /></CadreAuth>;
}
