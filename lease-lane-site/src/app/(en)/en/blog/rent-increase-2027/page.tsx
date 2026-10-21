/* /en/blog/rent-increase-2027 — English twin of /blogue/hausse-de-loyer-2027 (same component, translated by the EN layout).
   Hand-made, outside routes.json; this static folder takes priority over blog/[slug]. */
import type { Metadata } from 'next';
import { LL_SITE } from '@/proto/routes';
import ArticleHausse2027 from '@/components/ArticleHausse2027';

const D = (LL_SITE as { domaine: string }).domaine;
const FR = D + '/blogue/hausse-de-loyer-2027', EN = D + '/en/blog/rent-increase-2027';
const TITRE = '2027 Rent Increase in Québec: Calculator | Lease Lane';
const DESCRIPTION = 'Calculate your 2027 rent increase with the TAL method in force since January 2026: base rate, taxes, insurance and major work. Notice deadlines and tenant refusal.';
const IMAGE = D + '/og-lease-lane.png';
const PUBLIE = '2026-10-21';
const FAQ = [
  ['When will the 2027 rate be published?', 'The TAL publishes the annual rate in January. The calculator switches to the 2027 rate as soon as it is published; until then, it uses the 2026 rate.'],
  ['Can the tenant refuse the increase?', 'Yes, within one month of the notice. The lease is then renewed and the landlord can ask the TAL to fix the rent within the following month.'],
  ['Can I raise the rent of a new unit?', 'If the building was built, or its use changed, five years ago or less, and this is noted in the lease (section F), the tenant cannot ask the TAL to fix the rent during that period.'],
  ['What if the building had major work?', 'Enter their cost under “Major work” and keep the invoices: the TAL asks for them if the tenant refuses.'],
  ['Does the calculator replace legal advice?', 'No. It is a general information tool. Check with the TAL before sending the notice.'],
];

export const metadata: Metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: EN, languages: { 'fr-CA': FR, 'en-CA': EN, 'x-default': FR } },
  openGraph: { title: TITRE, description: DESCRIPTION, url: EN, siteName: 'Lease Lane', locale: 'en_CA', alternateLocale: ['fr_CA'], type: 'article', publishedTime: PUBLIE, modifiedTime: PUBLIE, images: [{ url: IMAGE, width: 1200, height: 630, alt: 'Lease Lane, rental solutions' }] },
  twitter: { card: 'summary_large_image', title: TITRE, description: DESCRIPTION, images: [IMAGE] },
};

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'BlogPosting', '@id': EN + '#article', headline: '2027 rent increase: calculate yours', description: DESCRIPTION, url: EN, inLanguage: 'en-CA', image: IMAGE,
      datePublished: PUBLIE, dateModified: PUBLIE, author: { '@type': 'Organization', name: 'Lease Lane team', url: D + '/en/about' }, publisher: { '@id': D + '/#organisation' },
      mainEntityOfPage: EN, isPartOf: { '@id': D + '/#site' }, breadcrumb: { '@id': EN + '#fil' } },
    { '@type': 'WebApplication', name: '2027 rent increase calculator', url: EN + '#calculateur', applicationCategory: 'FinanceApplication', operatingSystem: 'All', inLanguage: 'en-CA', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' } },
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })) },
    { '@type': 'BreadcrumbList', '@id': EN + '#fil', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: D + '/en' }, { '@type': 'ListItem', position: 2, name: 'Blog & news', item: D + '/en/blog' }, { '@type': 'ListItem', position: 3, name: '2027 rent increase', item: EN }] },
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
