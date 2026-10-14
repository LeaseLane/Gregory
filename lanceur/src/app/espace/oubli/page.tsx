import { CadreAuth } from '../../(auth)/CadreAuth';
import { Oubli } from './Oubli';
import { espaceDe, libelle } from '../titre';

export default async function Page({ searchParams }: { searchParams: Promise<{ p?: string; courriel?: string }> }) {
  const s = await searchParams, e = espaceDe(s.p);
  return <CadreAuth espace={libelle(e)}><Oubli espace={e} initial={s.courriel ?? ''} /></CadreAuth>;
}
