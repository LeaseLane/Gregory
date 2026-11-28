import '../../theme-mix/proprietaire.css';   // thème « Mix » de Steven, après base.css
import { moiPortail } from '@/composants/portail/Moi';
import { CoquilleProprietaire } from '@/composants/portail/CoquilleProprietaire';
import { tServeur } from '@/lib/i18n/serveur';

export async function generateMetadata() { const { t } = await tServeur(); return { title: t('Lease Lane · Espace propriétaire') }; }

export default async function Layout({ children }: { children: React.ReactNode }) {
  const moi = await moiPortail('proprietaire');
  return <CoquilleProprietaire moi={moi}>{children}</CoquilleProprietaire>;
}
