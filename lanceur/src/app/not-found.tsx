import { LienRetour } from '@/composants/LienRetour';

export const metadata = { title: 'Page introuvable · Lease Lane' };

/* Remplace la page 404 anglaise de Next.js (« This page could not be found. », sans issue) pour les trois portails. */
export default function PageIntrouvable() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px 16px', background: '#F3F6FA' }}>
      <div className="carte-vide" style={{ width: '100%' }}>
        <p className="surtitre">Erreur 404</p>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.3, color: '#0C2147' }}>Cette page est introuvable</h1>
        <p style={{ margin: 0, color: '#3E4A59', fontSize: 14, lineHeight: 1.5 }}>Le lien est peut-être périmé, ou la page a été déplacée. Vérifiez l’adresse, ou repartez de votre accueil.</p>
        <LienRetour />
      </div>
    </main>
  );
}
