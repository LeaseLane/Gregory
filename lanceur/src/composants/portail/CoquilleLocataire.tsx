'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import type { MoiPortail } from './Moi';

/* Coquille du locataire (maquette 01 à 04) : barre d'icônes à 4 positions (préférence gardée côté serveur, écran 19), Cléo, profil.
   Le bandeau marine (date, salutation, Urgence 24/7, recherche, cloche) est propre à chaque page; l'accueil le porte. */
const MENU: [string, string, string | null][] = [['home', 'Accueil', '/locataire'], ['key', 'Logement', null], ['wrench', 'Demandes', null], ['card', 'Paiements', null],
  ['folder', 'Documents', null], ['message', 'Messages', null], ['calendar', 'Calendrier', null], ['help', 'Aide', null]];

export function CoquilleLocataire({ moi, children }: { moi: MoiPortail; children: React.ReactNode }) {
  const chemin = usePathname();
  return (
    <div className={`lo lo-${moi.menu}`}>
      <nav className="lo-rail" aria-label="Espace locataire">
        <img className="lo-logo" src="/img/logo-icone-blanc.svg" alt="Lease Lane" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        {MENU.map(([ic, l, href]) => { const corps = <><Icone nom={ic} taille={22} couleur="currentColor" /><span>{l}</span></>;
          return href ? <Link key={l} href={href} className={chemin === href ? 'actif' : ''} aria-current={chemin === href ? 'page' : undefined}>{corps}</Link>
            : <span key={l} className="inactif" aria-disabled="true" title="Arrive bientôt">{corps}</span>; })}
        <span className="lo-sep" />
        <span className="lo-cleo inactif" title="Arrive bientôt"><span className="po-cleo-av"><img src="/img/cleo.png" alt="" /><i /></span><span>Cléo</span></span>
        <form action="/deconnexion?p=locataire" method="post" className="lo-profil"><button title="Me déconnecter" aria-label={`${moi.nom} · me déconnecter`}><b>{moi.initiales}</b><span>Profil</span></button></form>
      </nav>
      <main className="lo-contenu">{children}</main>
    </div>
  );
}
