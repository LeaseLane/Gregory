'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import type { MoiPortail } from './Moi';
import { Cloche } from './Cloche';
import { Cleo } from '@/composants/Cleo';

/* Coquille du propriétaire (maquette 01) : rail à gauche avec libellés, Cléo, carte du compte; recherche « Demandez à Cléo » et cloche.
   Une rubrique sans page n'est pas un lien. Pastille marine; rouge seulement pour une urgence (D4). La comptabilité (lecture seulement) ne voit
   que le tableau de bord, la finance, les documents, le calendrier et l'aide (la base refuse de toute façon ses écritures). */
const COMPTABLE = ['Tableau de bord', 'Finance', 'Documents', 'Calendrier', 'Aide'];
const MENU: [string, string, string | null][] = [['grid', 'Tableau de bord', '/proprietaire'], ['building', 'Immeubles', '/proprietaire/immeubles'], ['users', 'Locataires', '/proprietaire/locataires'], ['wrench', 'Demandes', '/proprietaire/demandes'],
  ['message', 'Messages', '/proprietaire/messages'], ['card', 'Finance', '/proprietaire/finance'], ['folder', 'Documents', '/proprietaire/documents'], ['calendar', 'Calendrier', '/proprietaire/calendrier'], ['shield', 'Utilisateurs et accès', '/proprietaire/acces'],
  ['scale', 'Conformité Loi 25', '/proprietaire/loi25'], ['help', 'Aide', '/proprietaire/aide']];

export function CoquilleProprietaire({ moi, comptes, children }: { moi: MoiPortail; comptes?: { demandes?: number; urgence?: boolean; messages?: number }; children: React.ReactNode }) {
  const chemin = usePathname();
  const [cleo, setCleo] = useState<string | null>(null);
  return (
    <div className="po">
      <aside className="po-rail">
        <img className="po-logo" src="/img/logo-sur-marine.svg" alt="Lease Lane" />
        <p className="po-espace">Espace propriétaire</p>
        <nav className="po-menu" aria-label="Espace propriétaire">{MENU.filter(([, l]) => moi.acces !== 'comptable' || COMPTABLE.includes(l)).map(([ic, l, href]) => {
          const n = l === 'Demandes' ? comptes?.demandes : l === 'Messages' ? comptes?.messages : 0;
          const corps = <><Icone nom={ic} taille={18} couleur="currentColor" /><span>{l}</span>{!!n && <b className={l === 'Demandes' && comptes?.urgence ? 'rouge' : ''}>{n}</b>}</>;
          const actif = href === '/proprietaire' ? chemin === href : !!href && chemin.startsWith(href);
          return href ? <Link key={l} href={href} className={actif ? 'actif' : ''} aria-current={actif ? 'page' : undefined}>{corps}</Link>
            : <span key={l} className="inactif" aria-disabled="true" title="Arrive bientôt">{corps}</span>;
        })}</nav>
        <div className="po-bas">
          <button type="button" className="po-cleo" onClick={() => setCleo('')}><span className="po-cleo-av"><img src="/img/cleo.png" alt="" /><i /></span><div><strong>Cléo</strong><span>Assistante · en ligne</span></div></button>
          <div className="po-compte"><Link href="/proprietaire/profil" className="po-compte-lien" aria-label={`${moi.nom} · mon profil`}><span className="po-ini">{moi.initiales}</span><div><strong>{moi.nom}</strong>
            <span>{moi.pour ? `${moi.acces === 'comptable' ? 'Comptabilité' : 'Copropriétaire'} · ${moi.pour}` : `${moi.portes} logement${moi.portes > 1 ? 's' : ''} · ${moi.immeubles} immeuble${moi.immeubles > 1 ? 's' : ''}`}</span></div></Link>
</div>
          <form action="/deconnexion?p=proprietaire" method="post"><button className="po-sortir" title="Me déconnecter"><Icone nom="sortir" taille={18} couleur="#C8DAF0" /><span>Me déconnecter</span></button></form>
        </div>
      </aside>
      <div className="po-principal">
        <header className="po-haut">
          <button type="button" className="po-cherche" onClick={() => setCleo('')}><img src="/img/cleo.png" alt="" className="avatar-cleo" /><span>Demandez à Cléo ou cherchez : « approuver la soumission », « relevé de septembre »…</span></button>
          <Cloche toutVoir="/proprietaire/notifications" />
        </header>
        <main className="po-contenu">{children}</main>
      </div>
      {cleo !== null && <Cleo question={cleo} fermer={() => setCleo(null)} />}
    </div>
  );
}
