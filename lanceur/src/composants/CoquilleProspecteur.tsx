'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';

/* Coquille du prospecteur (Octa, 2026-11-11) : au lieu de l'accueil et des espaces de l'équipe, une barre à gauche comme le portail
   locataire, avec ses trois modules. Les styles sont ceux de la coquille locataire (.lo, .lo-rail; en bas sur téléphone). */
const MENU: [string, string, string][] = [
  ['users', 'Mes prospects', '/ventes/mes-prospects'],
  ['building', 'Immeubles', '/ventes/immeubles'],
  ['spark', 'Prospection IA', '/ventes/prospection'],
];

export function CoquilleProspecteur({ initiales, nom, children }: { initiales: string; nom: string; children: React.ReactNode }) {
  const chemin = usePathname();
  // La fiche d'un prospect (/ventes/deals/…) fait partie de « Mes prospects ».
  const actif = (href: string) => chemin.startsWith(href) || (href === '/ventes/mes-prospects' && chemin.startsWith('/ventes/deals'));
  return (
    <div className="lo lo-gauche">
      <nav className="lo-rail lo-rail-pr" aria-label="Espace prospecteur">
        <img className="lo-logo" src="/img/logo-icone-blanc.svg" alt="Lease Lane" />
        {MENU.map(([ic, l, href]) => <Link key={href} href={href} className={actif(href) ? 'actif' : ''} aria-current={actif(href) ? 'page' : undefined}>
          <span className="lo-ic"><Icone nom={ic} taille={22} couleur="currentColor" /></span><span>{l}</span></Link>)}
        <span className="lo-sep" />
        <Link href="/compte" className={`lo-profil ${actif('/compte') ? 'actif' : ''}`} aria-label={`${nom} · mon compte`}><b>{initiales}</b><span>Mon compte</span></Link>
        <form action="/deconnexion" method="post" className="lo-sortir-f"><button className="lo-sortir" title="Me déconnecter"><Icone nom="sortir" taille={20} couleur="currentColor" /><span>Déconnexion</span></button></form>
      </nav>
      <div className="lo-contenu lo-prospecteur">{children}</div>
    </div>
  );
}
