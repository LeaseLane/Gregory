/* /en/property-management/levis — généré par scripts/generer-pages.py */
import { metadataDe, jsonLdTexte } from '@/lib/pages';
import Vue from '@/vues/levis';

const CHEMIN = '/gestion-immobiliere/levis';
export const metadata = metadataDe(CHEMIN, 'en');

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexte(CHEMIN, 'en') }} />
      <Vue />
    </>
  );
}
