import { LienRetour } from '@/composants/LienRetour';
import { tServeur } from '@/lib/i18n/serveur';

export async function generateMetadata() { const { t } = await tServeur(); return { title: t('Page introuvable') + ' · Lease Lane' }; }

/* Remplace la page 404 anglaise de Next.js (« This page could not be found. », sans issue) pour les trois portails. */
export default async function PageIntrouvable() {
  const { t } = await tServeur();
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px 16px', background: '#F3F6FA' }}>
      <div className="carte-vide" style={{ width: '100%' }}>
        <p className="surtitre">{t('Erreur 404')}</p>
        <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.3, color: '#0C2147' }}>{t('Cette page est introuvable')}</h1>
        <p style={{ margin: 0, color: '#3E4A59', fontSize: 14, lineHeight: 1.5 }}>{t('Le lien est peut-être périmé, ou la page a été déplacée. Vérifiez l’adresse, ou repartez de votre accueil.')}</p>
        <LienRetour />
      </div>
    </main>
  );
}
