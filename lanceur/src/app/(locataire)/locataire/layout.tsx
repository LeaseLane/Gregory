import { moiPortail } from '@/composants/portail/Moi';
import { CoquilleLocataire, type Pastilles } from '@/composants/portail/CoquilleLocataire';
import { supabaseServeur } from '@/lib/supabase/serveur';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const moi = await moiPortail('locataire');
  const { data } = await (await supabaseServeur()).rpc('portail_locataire_pastilles');
  return <CoquilleLocataire moi={moi} pastilles={(data as Pastilles) ?? null}>{children}</CoquilleLocataire>;
}
