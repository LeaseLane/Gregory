/* Page 404 de tout le site (deux gabarits racines : français et anglais). Bilingue, sans JavaScript. */
import type { Metadata } from 'next';
import './feuilles';

export const metadata: Metadata = { title: 'Page introuvable · Page not found | Lease Lane', robots: { index: false, follow: true } };

const lien = { display: 'inline-flex', alignItems: 'center', height: '44px', padding: '0 20px', borderRadius: '12px', background: '#0C2147', color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none' } as const;

export default function GlobalNotFound() {
  return (
    <html lang="fr-CA">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F2F6FB', fontFamily: 'var(--police-corps)' }}>
        <main style={{ maxWidth: '560px', padding: '48px 24px', textAlign: 'center', display: 'grid', gap: '16px', justifyItems: 'center' }}>
          <img src="/assets/logo/lease-lane-cadre-horizontal-fond-blanc.svg" alt="Lease Lane" width={220} height={60} style={{ height: '60px', width: 'auto' }} />
          <h1 style={{ margin: '12px 0 0', fontSize: '28px', color: '#0C2147' }}>Page introuvable</h1>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#3E4A59' }}>Cette adresse n’existe pas ou a changé.</p>
          <a href="/" style={lien}>Retour à l’accueil</a>
          <p lang="en" style={{ margin: '20px 0 0', fontSize: '14px', lineHeight: 1.6, color: '#3E4A59' }}>Page not found. <a href="/en" style={{ color: '#0C2147', fontWeight: 600 }}>Go to the English home page</a></p>
        </main>
      </body>
    </html>
  );
}
