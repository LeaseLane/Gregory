import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const poppins = localFont({
  src: [
    { path: '../fonts/poppins-400-latin.woff2', weight: '400' },
    { path: '../fonts/poppins-500-latin.woff2', weight: '500' },
    { path: '../fonts/poppins-600-latin.woff2', weight: '600' },
    { path: '../fonts/poppins-700-latin.woff2', weight: '700' },
  ],
  variable: '--ll-police',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lease Lane · Espace admin',
  robots: { index: false, follow: false },
};

export default function RacineLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA" className={poppins.variable} suppressHydrationWarning>
      {/* Thème choisi dans le menu du profil, appliqué avant l'affichage (pas d'éclair blanc) */}
      <head><script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('ll-theme');if(t==='systeme')t=matchMedia('(prefers-color-scheme: dark)').matches?'sombre':'clair';if(t)document.documentElement.dataset.theme=t}catch(e){}" }} /></head>
      <body>{children}</body>
    </html>
  );
}
