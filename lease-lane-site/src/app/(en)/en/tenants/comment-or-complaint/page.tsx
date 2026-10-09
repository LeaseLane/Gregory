/* /en/tenants/comment-or-complaint — généré par scripts/generer-pages.py */
import { metadataDe, jsonLdTexte } from '@/lib/pages';
import Vue from '@/vues/formulaire';

const CHEMIN = '/locataires/commentaire-ou-plainte';
export const metadata = metadataDe(CHEMIN, 'en');

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexte(CHEMIN, 'en') }} />
      <Vue />
    </>
  );
}
