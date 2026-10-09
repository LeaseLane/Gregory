/* Gabarit racine des pages françaises (rendu serveur, français du Québec). */
import type { Metadata, Viewport } from 'next';
import '../feuilles';
import Coquille from '@/components/Coquille';
import { LL_SITE } from '@/proto/routes';

export const metadata: Metadata = {
  metadataBase: new URL(LL_SITE.domaine),
  applicationName: 'Lease Lane',
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0C2147' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA" data-site="principal">
      <body>
        <Coquille>{children}</Coquille>
      </body>
    </html>
  );
}
