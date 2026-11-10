'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import { Cleo } from '@/composants/Cleo';
import { Cloche } from './Cloche';
import type { MoiPortail } from './Moi';

/* Coquille du locataire (maquettes 01 à 19) : barre d'icônes à 4 positions (préférence gardée côté serveur, écran 19; sur téléphone,
   toujours en bas), pastilles marine (D4), Cléo, profil. Le bandeau marine de chaque page porte Urgence 24/7, la recherche et la cloche. */
export type Pastilles = { demandes: number; messages: number; contact: { nom?: string; telephone?: string | null; urgence?: string | null } | null;
  a_confirmer: { id: string; quand: string; qui: string | null; quoi: string; numero: string; demande: string } | null } | null;
const MENU: [string, string, string][] = [['home', 'Accueil', '/locataire'], ['key', 'Logement', '/locataire/logement'], ['wrench', 'Demandes', '/locataire/demandes'], ['card', 'Paiements', '/locataire/paiements'],
  ['folder', 'Documents', '/locataire/documents'], ['message', 'Messages', '/locataire/messages'], ['calendar', 'Calendrier', '/locataire/calendrier'], ['help', 'Aide', '/locataire/aide']];

/* Téléphone : 4 destinations dans la barre du bas, le reste (et Cléo, Profil) sous « Plus » : la barre de 10 éléments défilait et coupait « Me… ». */
const PRIMAIRES = ['Accueil', 'Logement', 'Demandes', 'Paiements'];
const Ctx = createContext<{ ouvrirCleo: (q?: string) => void; pastilles: Pastilles; prenom: string }>({ ouvrirCleo: () => {}, pastilles: null, prenom: '' });
export const useLocataire = () => useContext(Ctx);

export function CoquilleLocataire({ moi, pastilles, children }: { moi: MoiPortail; pastilles: Pastilles; children: React.ReactNode }) {
  const chemin = usePathname();
  const [cleo, setCleo] = useState<string | null>(null);
  const actif = (href: string) => href === '/locataire' ? chemin === href : chemin.startsWith(href);
  const [plus, setPlus] = useState(false);
  useEffect(() => setPlus(false), [chemin]);
  const secondaires = MENU.filter(([, l]) => !PRIMAIRES.includes(l));
  const enPlus = secondaires.some(([, , h]) => actif(h)) || actif('/locataire/profil');
  return (
    <Ctx.Provider value={{ ouvrirCleo: (q = '') => setCleo(q), pastilles, prenom: moi.prenom }}>
      <div className={`lo lo-${moi.menu}`}>
        <nav className="lo-rail" aria-label="Espace locataire">
          <img className="lo-logo" src="/img/logo-icone-blanc.svg" alt="Lease Lane" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          {MENU.map(([ic, l, href]) => { const n = l === 'Demandes' ? pastilles?.demandes : l === 'Messages' ? pastilles?.messages : 0;
            return <Link key={l} href={href} className={(actif(href) ? 'actif' : '') + (PRIMAIRES.includes(l) ? '' : ' lo-sec')} aria-current={actif(href) ? 'page' : undefined}>
              <span className="lo-ic"><Icone nom={ic} taille={22} couleur="currentColor" />{!!n && <b aria-label={`${n} à voir`}>{n}</b>}</span><span>{l}</span></Link>; })}
          <span className="lo-sep" />
          <button type="button" className={`lo-cleo lo-sec ${cleo !== null ? 'actif' : ''}`} onClick={() => setCleo('')}><span className="po-cleo-av"><img src="/img/cleo.png" alt="" /><i /></span><span>Cléo</span></button>
          <Link href="/locataire/profil" className={`lo-profil lo-sec ${actif('/locataire/profil') ? 'actif' : ''}`} aria-label={`${moi.nom} · mon profil`}><b>{moi.initiales}</b><span>Profil</span></Link>
          <form action="/deconnexion?p=locataire" method="post" className="lo-sortir-f"><button className="lo-sortir" title="Me déconnecter"><Icone nom="sortir" taille={20} couleur="currentColor" /><span>Déconnexion</span></button></form>
          <button type="button" className={'lo-plus-bouton' + (plus || enPlus ? ' actif' : '')} aria-expanded={plus} aria-haspopup="true" onClick={() => setPlus((v) => !v)}><span className="lo-ic"><Icone nom="list" taille={22} couleur="currentColor" />{!!pastilles?.messages && <b aria-label={`${pastilles.messages} message${pastilles.messages > 1 ? 's' : ''} à voir`}>{pastilles.messages}</b>}</span><span>Plus</span></button>
        </nav>
        {plus && <><div className="lo-plus-fond" onClick={() => setPlus(false)} /><div className="lo-plus" role="menu" aria-label="Plus de rubriques">
          {secondaires.map(([ic, l, href]) => <Link key={l} href={href} role="menuitem" onClick={() => setPlus(false)} className={actif(href) ? 'actif' : ''}><Icone nom={ic} taille={20} couleur="currentColor" /><span>{l}</span>{l === 'Messages' && !!pastilles?.messages && <b>{pastilles.messages}</b>}</Link>)}
          <button type="button" role="menuitem" onClick={() => { setPlus(false); setCleo(''); }}><Icone nom="spark" taille={20} couleur="currentColor" /><span>Cléo</span></button>
          <Link href="/locataire/profil" role="menuitem" onClick={() => setPlus(false)} className={actif('/locataire/profil') ? 'actif' : ''}><Icone nom="user" taille={20} couleur="currentColor" /><span>Profil</span></Link>
        </div></>}
        <main className="lo-contenu">{children}</main>
        {cleo !== null && <Cleo question={cleo} fermer={() => setCleo(null)} locataire={{ prenom: moi.prenom, aConfirmer: pastilles?.a_confirmer ?? null, gestionnaire: pastilles?.contact?.nom ?? null }} />}
      </div>
    </Ctx.Provider>
  );
}

/* Bandeau marine des pages du locataire : titre, sous-titre (ou retour), Urgence 24/7, recherche (passe à Cléo), cloche. */
export function BandeauLocataire({ titre, sous, retour, surtitre, children, bas = false }: { titre: string; sous?: string; retour?: [string, string]; surtitre?: string; children?: React.ReactNode; bas?: boolean }) {
  const { ouvrirCleo, pastilles } = useLocataire();
  const [q, setQ] = useState('');
  const tel = pastilles?.contact?.urgence;
  return (
    <section className={`lo-bandeau ${bas ? '' : 'court'}`}>
      <div className="lo-bandeau-haut">
        <div>{retour && <Link className="lo-retour" href={retour[0]}><Icone nom="arrow" taille={14} couleur="#fff" />{retour[1]}</Link>}
          {surtitre && <p className="surtitre">{surtitre}</p>}<h1>{titre}</h1>{sous && <p className="lo-resume">{sous}</p>}</div>
        <div className="lo-bandeau-actions">
          <a className="lo-urgence" href={tel ? `tel:+1${tel.replace(/\D/g, '').slice(-10)}` : '/locataire/aide#urgence'}><Icone nom="siren" taille={18} couleur="#9B2E28" />Urgence 24/7</a>
          <form className="lo-cherche" role="search" onSubmit={(e) => { e.preventDefault(); ouvrirCleo(q.trim()); setQ(''); }}>
            <Icone nom="search" taille={18} couleur="#C8DAF0" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher ou demander à Cléo" /></form>
          <Cloche clair={false} toutVoir="/locataire/notifications" />
        </div>
      </div>
      {children}
    </section>
  );
}
