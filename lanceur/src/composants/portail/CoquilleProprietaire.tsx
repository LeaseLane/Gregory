'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import type { MoiPortail } from './Moi';
import { Cloche } from './Cloche';
import { Cleo } from '@/composants/Cleo';

/* Coquille du propriétaire (maquette 01) : rail à gauche avec libellés, Cléo, carte du compte; recherche « Demandez à Cléo » et cloche.
   Une rubrique sans page n'est pas un lien. Pastille marine; rouge seulement pour une urgence (D4). La comptabilité (lecture seulement) ne voit
   que le tableau de bord, la finance, les documents, le calendrier et l'aide (la base refuse de toute façon ses écritures). */
/* Téléphone : 4 destinations dans la barre du bas, le reste sous « Plus » (au plus 5 cibles de 12 px lisibles). */
const PRIMAIRES = ['Tableau de bord', 'Immeubles', 'Demandes', 'Messages'];
const COURT: Record<string, string> = { 'Tableau de bord': 'Accueil' };
const COMPTABLE = ['Tableau de bord', 'Finance', 'Documents', 'Calendrier', 'Aide'];
const MENU: [string, string, string | null][] = [['grid', 'Tableau de bord', '/proprietaire'], ['building', 'Immeubles', '/proprietaire/immeubles'], ['users', 'Locataires', '/proprietaire/locataires'], ['wrench', 'Demandes', '/proprietaire/demandes'],
  ['message', 'Messages', '/proprietaire/messages'], ['card', 'Finance', '/proprietaire/finance'], ['folder', 'Documents', '/proprietaire/documents'], ['calendar', 'Calendrier', '/proprietaire/calendrier'], ['shield', 'Utilisateurs et accès', '/proprietaire/acces'],
  ['scale', 'Conformité Loi 25', '/proprietaire/loi25'], ['help', 'Aide', '/proprietaire/aide']];

export function CoquilleProprietaire({ moi, comptes, children }: { moi: MoiPortail; comptes?: { demandes?: number; urgence?: boolean; messages?: number }; children: React.ReactNode }) {
  const chemin = usePathname();
  const [cleo, setCleo] = useState<string | null>(null);
  const [plus, setPlus] = useState(false);
  useEffect(() => setPlus(false), [chemin]);
  const visibles = MENU.filter(([, l]) => moi.acces !== 'comptable' || COMPTABLE.includes(l));
  const prim = new Set([...visibles.filter(([, l]) => PRIMAIRES.includes(l)), ...visibles.filter(([, l]) => !PRIMAIRES.includes(l))].slice(0, 4).map(([, l]) => l));
  const secondaires = visibles.filter(([, l]) => !prim.has(l));
  return (
    <div className="po">
      <aside className="po-rail">
        <img className="po-logo" src="/img/logo-sur-marine.svg" alt="Lease Lane" />
        <p className="po-espace">Espace propriétaire</p>
        <nav className="po-menu" aria-label="Espace propriétaire">{visibles.map(([ic, l, href]) => {
          const n = l === 'Demandes' ? comptes?.demandes : l === 'Messages' ? comptes?.messages : 0;
          const corps = <><Icone nom={ic} taille={18} couleur="currentColor" /><span>{COURT[l] ? <><span className="po-long">{l}</span><span className="po-court">{COURT[l]}</span></> : l}</span>{!!n && <b className={l === 'Demandes' && comptes?.urgence ? 'rouge' : ''}>{n}</b>}</>;
          const actif = href === '/proprietaire' ? chemin === href : !!href && chemin.startsWith(href);
          const sec = prim.has(l) ? '' : ' po-sec';
          return href ? <Link key={l} href={href} className={(actif ? 'actif' : '') + sec} aria-current={actif ? 'page' : undefined}>{corps}</Link>
            : <span key={l} className={'inactif' + sec} aria-disabled="true" title="Arrive bientôt">{corps}</span>;
        })}
          {secondaires.length > 0 && <button type="button" className={'po-plus-bouton' + (plus || secondaires.some(([, , h]) => !!h && (h === '/proprietaire' ? chemin === h : chemin.startsWith(h))) ? ' actif' : '')} aria-expanded={plus} aria-haspopup="true" onClick={() => setPlus((v) => !v)}><Icone nom="list" taille={18} couleur="currentColor" /><span>Plus</span></button>}</nav>
        {plus && <><div className="po-plus-fond" onClick={() => setPlus(false)} /><div className="po-plus" role="menu" aria-label="Plus de rubriques">{secondaires.map(([ic, l, href]) => href && <Link key={l} href={href} role="menuitem" onClick={() => setPlus(false)} className={chemin.startsWith(href) ? 'actif' : ''}><Icone nom={ic} taille={18} couleur="currentColor" /><span>{l}</span></Link>)}</div></>}
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
