/* /inscrire-mon-entreprise — page faite main (hors de routes.json : le générateur n'y touche pas).
   Métadonnées et JSON-LD propres (metadataDe donnerait ceux de l'accueil). Jumelle : /en/list-your-business. */
import type { Metadata } from 'next';
import { LL_SITE } from '@/proto/routes';
import InscriptionEntreprise from '@/components/InscriptionEntreprise';

const D = (LL_SITE as { domaine: string }).domaine;
const FR = D + '/inscrire-mon-entreprise', EN = D + '/en/list-your-business';
const TITRE = 'Inscrire mon entreprise | Lease Lane';
const DESCRIPTION = 'Entrepreneurs et travailleurs autonomes : inscrivez votre entreprise gratuitement sur Lease Lane. Preuve d’assurance, téléphone et courriel suffisent pour commencer.';
const IMAGE = D + '/og-lease-lane.png';
/* Mêmes questions que la page (src/components/InscriptionEntreprise.jsx). */
const FAQ = [
  ['L’inscription est-elle gratuite?', 'Oui. Vous transmettez votre preuve d’assurance, votre téléphone et votre courriel, sans frais.'],
  ['Ma preuve d’assurance sera-t-elle publique?', 'Non. Elle est transmise à l’équipe Lease Lane pour traiter votre inscription et n’est jamais affichée publiquement.'],
  ['Pourquoi ne demandez-vous pas mes services tout de suite?', 'Pour que l’inscription reste courte. Vos services, vos régions, la description de votre entreprise et vos photos se remplissent ensuite dans la plateforme.'],
  ['Puis-je envoyer une photo de mon document?', 'Oui. Sur téléphone, choisissez « Prendre une photo ». Assurez-vous que le document est lisible. Formats acceptés : PDF, JPG et PNG, 10 Mo maximum.'],
  ['Mon courriel est déjà inscrit. Que faire?', 'Connectez-vous à la plateforme ou récupérez votre accès. Inutile de vous inscrire une deuxième fois.'],
];

export const metadata: Metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: FR, languages: { 'fr-CA': FR, 'en-CA': EN, 'x-default': FR } },
  openGraph: { title: TITRE, description: DESCRIPTION, url: FR, siteName: 'Lease Lane', locale: 'fr_CA', alternateLocale: ['en_CA'], type: 'website', images: [{ url: IMAGE, width: 1200, height: 630, alt: 'Lease Lane, solutions locatives intelligentes' }] },
  twitter: { card: 'summary_large_image', title: TITRE, description: DESCRIPTION, images: [IMAGE] },
};

const JSON_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebPage', url: FR, name: TITRE, description: DESCRIPTION, inLanguage: 'fr-CA', isPartOf: { '@id': D + '/#site' }, about: { '@id': D + '/#organisation' }, breadcrumb: { '@id': FR + '#fil' } },
    { '@type': 'BreadcrumbList', '@id': FR + '#fil', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: D + '/' }, { '@type': 'ListItem', position: 2, name: 'Inscrire mon entreprise', item: FR }] },
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
