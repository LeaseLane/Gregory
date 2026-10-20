/* /en/list-your-business — jumelle anglaise de /inscrire-mon-entreprise (page faite main, hors de routes.json).
   Le composant est traduit au rendu par le gabarit anglais; métadonnées et JSON-LD écrits ici en anglais. */
import type { Metadata } from 'next';
import { LL_SITE } from '@/proto/routes';
import InscriptionEntreprise from '@/components/InscriptionEntreprise';

const D = (LL_SITE as { domaine: string }).domaine;
const FR = D + '/inscrire-mon-entreprise', EN = D + '/en/list-your-business';
const TITRE = 'List Your Business | Lease Lane';
const DESCRIPTION = 'Contractors and self-employed workers: list your business for free on Lease Lane. Proof of insurance, phone number and email are all you need to get started.';
const IMAGE = D + '/og-lease-lane.png';
const FAQ = [
  ['Is signing up free?', 'Yes. You send your proof of insurance, your phone number and your email, free of charge.'],
  ['Will my proof of insurance be public?', 'No. It is sent to the Lease Lane team to process your sign-up and is never shown publicly.'],
  ['Why don’t you ask for my services right away?', 'To keep sign-up short. Your services, your regions, your business description and your photos are filled in afterwards in the platform.'],
  ['Can I send a photo of my document?', 'Yes. On a phone, choose “Take a photo”. Make sure the document is readable. Accepted formats: PDF, JPG and PNG, 10 MB maximum.'],
  ['My email is already registered. What should I do?', 'Sign in to the platform or recover your access. There is no need to sign up a second time.'],
];

export const metadata: Metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: EN, languages: { 'fr-CA': FR, 'en-CA': EN, 'x-default': FR } },
  openGraph: { title: TITRE, description: DESCRIPTION, url: EN, siteName: 'Lease Lane', locale: 'en_CA', alternateLocale: ['fr_CA'], type: 'website', images: [{ url: IMAGE, width: 1200, height: 630, alt: 'Lease Lane, smart rental solutions' }] },
  twitter: { card: 'summary_large_image', title: TITRE, description: DESCRIPTION, images: [IMAGE] },
};

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebPage', url: EN, name: TITRE, description: DESCRIPTION, inLanguage: 'en-CA', isPartOf: { '@id': D + '/#site' }, about: { '@id': D + '/#organisation' }, breadcrumb: { '@id': EN + '#fil' } },
    { '@type': 'BreadcrumbList', '@id': EN + '#fil', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: D + '/en' }, { '@type': 'ListItem', position: 2, name: 'List your business', item: EN }] },
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })) },
  ],
}).replace(/</g, '\\u003c');

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      <InscriptionEntreprise />
    </>
  );
}
