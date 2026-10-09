/* Gabarit racine des pages anglaises (/en/…) : même gabarit, texte traduit pendant le rendu (src/lib/i18n). */
import type { Metadata, Viewport } from 'next';
import '../feuilles';
import Coquille from '@/components/Coquille';
import FournisseurEN from '@/lib/i18n/FournisseurEN';
import { LL_SITE } from '@/proto/routes';

export const metadata: Metadata = {
  metadataBase: new URL(LL_SITE.domaine),
  applicationName: 'Lease Lane',
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0C2147' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" data-site="principal">
      <body>
        <FournisseurEN>
          <Coquille>{children}</Coquille>
        </FournisseurEN>
      </body>
    </html>
  );
}
