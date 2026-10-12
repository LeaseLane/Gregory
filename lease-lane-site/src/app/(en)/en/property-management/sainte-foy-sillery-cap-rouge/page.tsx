/* /en/property-management/sainte-foy-sillery-cap-rouge — généré par scripts/generer-pages.py */
import { metadataDe, jsonLdTexte } from '@/lib/pages';
import Vue from '@/vues/locale';

const CHEMIN = '/gestion-immobiliere/sainte-foy-sillery-cap-rouge';
export const metadata = metadataDe(CHEMIN, 'en');

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexte(CHEMIN, 'en') }} />
      <Vue />
    </>
  );
}
