/* /en/cleo — généré par scripts/generer-pages.py */
import { metadataDe, jsonLdTexte } from '@/lib/pages';
import Vue from '@/vues/cleo';

const CHEMIN = '/cleo';
export const metadata = metadataDe(CHEMIN, 'en');

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexte(CHEMIN, 'en') }} />
      <Vue />
    </>
  );
}
