'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import type { MoiPortail } from './Moi';

/* Coquille du propriétaire (maquette 01) : rail à gauche avec libellés, Cléo, carte du compte; recherche « Demandez à Cléo » et cloche.
   Une rubrique sans page n'est pas un lien (elle arrive avec son jalon). Pastille marine; rouge seulement pour une urgence (D4). */
const MENU: [string, string, string | null][] = [['grid', 'Tableau de bord', '/proprietaire'], ['building', 'Immeubles', '/proprietaire/immeubles'], ['users', 'Locataires', '/proprietaire/locataires'], ['wrench', 'Demandes', null],
  ['message', 'Messages', null], ['card', 'Finance', null], ['folder', 'Documents', null], ['calendar', 'Calendrier', null], ['shield', 'Utilisateurs et accès', null],
  ['scale', 'Conformité Loi 25', null], ['help', 'Aide', null]];

export function CoquilleProprietaire({ moi, comptes, children }: { moi: MoiPortail; comptes?: { demandes?: number; urgence?: boolean; messages?: number }; children: React.ReactNode }) {
  const chemin = usePathname();
  return (
    <div className="po">
      <aside className="po-rail">
        <img className="po-logo" src="/img/logo-sur-marine.svg" alt="Lease Lane" />
        <p className="po-espace">Espace propriétaire</p>
        <nav className="po-menu" aria-label="Espace propriétaire">{MENU.map(([ic, l, href]) => {
          const n = l === 'Demandes' ? comptes?.demandes : l === 'Messages' ? comptes?.messages : 0;
          const corps = <><Icone nom={ic} taille={18} couleur="currentColor" /><span>{l}</span>{!!n && <b className={l === 'Demandes' && comptes?.urgence ? 'rouge' : ''}>{n}</b>}</>;
          const actif = href === '/proprietaire' ? chemin === href : !!href && chemin.startsWith(href);
          return href ? <Link key={l} href={href} className={actif ? 'actif' : ''} aria-current={actif ? 'page' : undefined}>{corps}</Link>
            : <span key={l} className="inactif" aria-disabled="true" title="Arrive bientôt">{corps}</span>;
        })}</nav>
        <div className="po-bas">
          <div className="po-cleo"><span className="po-cleo-av"><img src="/img/cleo.png" alt="" /><i /></span><div><strong>Cléo</strong><span>Assistante · en ligne</span></div></div>
          <div className="po-compte"><span className="po-ini">{moi.initiales}</span><div><strong>{moi.nom}</strong><span>{moi.portes} logement{moi.portes > 1 ? 's' : ''} · {moi.immeubles} immeuble{moi.immeubles > 1 ? 's' : ''}</span></div>
            <form action="/deconnexion?p=proprietaire" method="post"><button className="po-sortir" aria-label="Me déconnecter" title="Me déconnecter"><Icone nom="arrow" taille={16} couleur="#C8DAF0" /></button></form></div>
        </div>
      </aside>
      <div className="po-principal">
        <header className="po-haut">
          <button type="button" className="po-cherche"><img src="/img/cleo.png" alt="" className="avatar-cleo" /><span>Demandez à Cléo ou cherchez : « approuver la soumission », « relevé de septembre »…</span></button>
          <button type="button" className="haut-ibtn" aria-label="Notifications" style={{ margin: 0 }}><Icone nom="bell" taille={20} couleur="#0C2147" /></button>
        </header>
        <main className="po-contenu">{children}</main>
      </div>
    </div>
  );
}
