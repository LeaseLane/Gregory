/* /en/neighbourhoods/[quartier] — généré par scripts/generer-pages.py */
import { notFound } from 'next/navigation';
import { metadataDe, jsonLdTexte, routesDe, existe } from '@/lib/pages';
import { versEN, versFR } from '@/lib/i18n/adresses';
import Vue from '@/vues/quartier';

/* Adresses connues (routes.js du prototype) : pré-rendues à la compilation. Toute autre adresse répond un vrai 404 :
   la page attend ses paramètres avant de répondre (instant = false), au lieu de diffuser une coquille en 200. */
export const instant = false;
export function generateStaticParams() {
  return routesDe('quartier').filter(r => r.path.startsWith('/quartiers/')).map(r => ({ quartier: versEN(r.path).slice(19) }));
}
export async function generateMetadata({ params }: { params: Promise<{ quartier: string }> }) {
  const { quartier } = await params;
  const chemin = versFR('/en/neighbourhoods/' + quartier);
  return existe(chemin) ? metadataDe(chemin, 'en') : {};
}
export default async function Page({ params }: { params: Promise<{ quartier: string }> }) {
  const { quartier } = await params;
  const chemin = versFR('/en/neighbourhoods/' + quartier);
  if (!existe(chemin)) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexte(chemin, 'en') }} />
      <Vue />
    </>
  );
}
