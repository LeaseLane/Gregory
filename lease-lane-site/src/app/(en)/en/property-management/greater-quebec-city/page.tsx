/* /en/property-management/greater-quebec-city — généré par scripts/generer-pages.py */
import { metadataDe, jsonLdTexte } from '@/lib/pages';
import Vue from '@/vues/region';

const CHEMIN = '/gestion-immobiliere/grande-region-de-quebec';
export const metadata = metadataDe(CHEMIN, 'en');

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexte(CHEMIN, 'en') }} />
      <Vue />
    </>
  );
}
