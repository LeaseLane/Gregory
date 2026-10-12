/* /gestion-immobiliere/stoneham-et-tewkesbury — généré par scripts/generer-pages.py */
import { metadataDe, jsonLdTexte } from '@/lib/pages';
import Vue from '@/vues/locale';

const CHEMIN = '/gestion-immobiliere/stoneham-et-tewkesbury';
export const metadata = metadataDe(CHEMIN, 'fr');

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexte(CHEMIN, 'fr') }} />
      <Vue />
    </>
  );
}
