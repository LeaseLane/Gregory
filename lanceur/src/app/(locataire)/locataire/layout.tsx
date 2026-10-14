import { moiPortail } from '@/composants/portail/Moi';
import { CoquilleLocataire } from '@/composants/portail/CoquilleLocataire';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const moi = await moiPortail('locataire');
  return <CoquilleLocataire moi={moi}>{children}</CoquilleLocataire>;
}
