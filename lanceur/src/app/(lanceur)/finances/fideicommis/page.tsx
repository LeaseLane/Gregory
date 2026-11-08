import { CadreEspace } from '@/composants/CadreEspace';
import { ONGLETS_FIN, SOUS_FIN } from '../onglets';
import { Fideicommis } from './Fideicommis';

/* Finances · Fidéicommis : registre par propriétaire, dépôts du compte (relevé BMO importé), versements du 15, rapprochement mensuel.
   Repris de l'ancien admin (ops-api fiducie_*), sans changer les règles : la base les tient. Administrateurs seulement (ops-api). */
export default async function Page({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams;
  return (
    <CadreEspace icone="dollar" nom="Finances" sous={SOUS_FIN} actif={10} onglets={ONGLETS_FIN}>
      <Fideicommis vue={['soldes', 'depots', 'versements', 'rapprochement'].includes(vue ?? '') ? vue! : 'soldes'} />
    </CadreEspace>
  );
}
