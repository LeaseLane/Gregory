/* /blogue/hausse-de-loyer-2027 — article + calculateur fait main (hors de routes.json : le générateur n'y touche pas;
   ce dossier statique a priorité sur blogue/[slug]). Jumelle : /en/blog/rent-increase-2027. */
import type { Metadata } from 'next';
import { LL_SITE } from '@/proto/routes';
import ArticleHausse2027 from '@/components/ArticleHausse2027';
import { FAQ_2027 } from '@/lib/hausse-2027';

const D = (LL_SITE as { domaine: string }).domaine;
const FR = D + '/blogue/hausse-de-loyer-2027', EN = D + '/en/blog/rent-increase-2027';
const TITRE = 'Hausse de loyer 2027 au Québec : calculateur | Lease Lane';
const DESCRIPTION = 'Calculez la hausse de loyer 2027 selon la méthode du TAL en vigueur depuis janvier 2026 : taux de base, taxes, assurance et travaux. Délais d’avis et refus du locataire.';
const IMAGE = D + '/og-lease-lane.png';
const PUBLIE = '2026-10-21';

export const metadata: Metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: FR, languages: { 'fr-CA': FR, 'en-CA': EN, 'x-default': FR } },
  openGraph: { title: TITRE, description: DESCRIPTION, url: FR, siteName: 'Lease Lane', locale: 'fr_CA', alternateLocale: ['en_CA'], type: 'article', publishedTime: PUBLIE, modifiedTime: PUBLIE, images: [{ url: IMAGE, width: 1200, height: 630, alt: 'Lease Lane, solutions locatives' }] },
  twitter: { card: 'summary_large_image', title: TITRE, description: DESCRIPTION, images: [IMAGE] },
};

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'BlogPosting', '@id': FR + '#article', headline: 'Hausse de loyer 2027 : calculez la vôtre', description: DESCRIPTION, url: FR, inLanguage: 'fr-CA', image: IMAGE,
      datePublished: PUBLIE, dateModified: PUBLIE, author: { '@type': 'Organization', name: 'Équipe Lease Lane', url: D + '/a-propos' }, publisher: { '@id': D + '/#organisation' },
      mainEntityOfPage: FR, isPartOf: { '@id': D + '/#site' }, breadcrumb: { '@id': FR + '#fil' } },
    { '@type': 'WebApplication', name: 'Calculateur de hausse de loyer 2027', url: FR + '#calculateur', applicationCategory: 'FinanceApplication', operatingSystem: 'Tous', inLanguage: 'fr-CA', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' } },
    { '@type': 'FAQPage', mainEntity: FAQ_2027.map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })) },
    { '@type': 'BreadcrumbList', '@id': FR + '#fil', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: D + '/' }, { '@type': 'ListItem', position: 2, name: 'Blogue & nouvelles', item: D + '/blogue' }, { '@type': 'ListItem', position: 3, name: 'Hausse de loyer 2027', item: FR }] },
  ],
}).replace(/</g, '\\u003c');

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      <ArticleHausse2027 />
    </>
  );
}
