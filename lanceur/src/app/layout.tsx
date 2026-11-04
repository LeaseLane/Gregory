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

/* Dates et heures à l'heure du Québec dans le navigateur, comme au serveur (TZ=America/Toronto, Dockerfile) : un format de date
   sans fuseau prend America/Toronto, sinon un appareil hors Québec affiche une autre date que le rendu serveur (écart
   d'hydratation, React #418). Un fuseau donné explicitement est respecté. Les lectures locales (getDate, getHours…) ne sont
   pas couvertes : utiliser qc() de lib/format pour un horodatage.
   ponytail: correctif global du navigateur au lieu de 92 appels; plafond : un appareil à UTC+12 ou plus lit une date
   « AAAA-MM-JJT12:00 » locale la veille à Québec. */
const FUSEAU_QC = "(function(){var Z='America/Toronto',D=Intl.DateTimeFormat;var o=function(x){return x&&x.timeZone?x:Object.assign({},x,{timeZone:Z})};"
  + "function F(l,x){return new D(l,o(x))}F.prototype=D.prototype;F.supportedLocalesOf=D.supportedLocalesOf;Intl.DateTimeFormat=F;"
  + "['toLocaleString','toLocaleDateString','toLocaleTimeString'].forEach(function(m){var f=Date.prototype[m];Date.prototype[m]=function(l,x){return f.call(this,l,o(x))}})})();";

export default function RacineLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA" className={poppins.variable} suppressHydrationWarning>
      {/* Heure du Québec pour les dates (avant tout script de page), puis thème choisi dans le menu du profil, appliqué avant l'affichage (pas d'éclair blanc) */}
      <head><script dangerouslySetInnerHTML={{ __html: FUSEAU_QC }} /><script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('ll-theme');if(t==='systeme')t=matchMedia('(prefers-color-scheme: dark)').matches?'sombre':'clair';if(t)document.documentElement.dataset.theme=t}catch(e){}" }} /></head>
      <body>{children}</body>
    </html>
  );
}
