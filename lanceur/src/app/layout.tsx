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
    <html lang="fr-CA" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
