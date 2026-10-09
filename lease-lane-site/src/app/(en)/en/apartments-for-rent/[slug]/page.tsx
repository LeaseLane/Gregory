/* /en/apartments-for-rent/[slug] — généré par scripts/generer-pages.py */
import { notFound } from 'next/navigation';
import { metadataDe, jsonLdTexte, routesDe, existe } from '@/lib/pages';
import { versEN, versFR } from '@/lib/i18n/adresses';
import Vue from '@/vues/fiche';

/* Adresses connues (routes.js du prototype) : pré-rendues à la compilation. Toute autre adresse répond un vrai 404 :
   la page attend ses paramètres avant de répondre (instant = false), au lieu de diffuser une coquille en 200. */
export const instant = false;
export function generateStaticParams() {
  return routesDe('fiche').filter(r => r.path.startsWith('/logements-a-louer/')).map(r => ({ slug: versEN(r.path).slice(24) }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chemin = versFR('/en/apartments-for-rent/' + slug);
  return existe(chemin) ? metadataDe(chemin, 'en') : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chemin = versFR('/en/apartments-for-rent/' + slug);
  if (!existe(chemin)) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexte(chemin, 'en') }} />
      <Vue />
    </>
  );
}
