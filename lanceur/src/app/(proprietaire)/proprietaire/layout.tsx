import { moiPortail } from '@/composants/portail/Moi';
import { CoquilleProprietaire } from '@/composants/portail/CoquilleProprietaire';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const moi = await moiPortail('proprietaire');
  return <CoquilleProprietaire moi={moi}>{children}</CoquilleProprietaire>;
}
