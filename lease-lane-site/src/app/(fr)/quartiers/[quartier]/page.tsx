/* /quartiers/[quartier] — généré par scripts/generer-pages.py */
import { notFound } from 'next/navigation';
import { metadataDe, jsonLdTexte, routesDe, existe } from '@/lib/pages';
import Vue from '@/vues/quartier';

/* Adresses connues (routes.js du prototype) : pré-rendues à la compilation. Toute autre adresse répond un vrai 404 :
   la page attend ses paramètres avant de répondre (instant = false), au lieu de diffuser une coquille en 200. */
export const instant = false;
export function generateStaticParams() {
  return routesDe('quartier').filter(r => r.path.startsWith('/quartiers/')).map(r => ({ quartier: r.path.slice(11) }));
}
export async function generateMetadata({ params }: { params: Promise<{ quartier: string }> }) {
  const { quartier } = await params;
  const chemin = '/quartiers/' + quartier;
  return existe(chemin) ? metadataDe(chemin, 'fr') : {};
}
export default async function Page({ params }: { params: Promise<{ quartier: string }> }) {
  const { quartier } = await params;
  const chemin = '/quartiers/' + quartier;
  if (!existe(chemin)) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdTexte(chemin, 'fr') }} />
      <Vue />
    </>
  );
}
