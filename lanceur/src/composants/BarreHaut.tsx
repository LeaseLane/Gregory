'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';

/* Barre du haut (maquette l00) : logo · Accueil · « Demandez à Cléo ou cherchez… » ⌘K · cloche · profil.
   ⌘K ouvre la palette (vide au T0 : recherche et Cléo arrivent avec leurs tranches). */
const ESPACES_FIL: [string, string][] = [['/operations', 'Opérations']];

export function BarreHaut({ initiales, courriel, aApprouver }: { initiales: string; courriel: string; aApprouver: number }) {
  const chemin = usePathname();
  const espace = ESPACES_FIL.find(([d]) => chemin.startsWith(d))?.[1];
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); }
      if (e.key === 'Escape') { setPalette(false); setMenu(false); }
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, []);
  useEffect(() => { if (palette) champ.current?.focus(); }, [palette]);

  return (
    <>
      <header className="haut">
        <img className="haut-logo" src="/img/logo-sur-blanc.svg" alt="Lease Lane" />
        <span className="haut-filet" aria-hidden="true" />
        {espace ? (
          <nav className="haut-fil" aria-label="Fil d’Ariane">
            <a href="/"><Icone nom="home" taille={20} couleur="#58697F" />Accueil</a>
            <Icone nom="chevron" taille={16} couleur="#78838F" />
            <span aria-current="page">{espace}</span>
          </nav>
        ) : (
          <a className="haut-lieu" href="/"><Icone nom="home" taille={20} couleur="#0C2147" />Accueil</a>
        )}
        <button type="button" className="haut-cherche" onClick={() => setPalette(true)}>
          <img src="/img/cleo.png" alt="" className="avatar-cleo" />
          <span>Demandez à Cléo ou cherchez…</span>
          <kbd className="touche"><Icone nom="command" taille={12} couleur="#3E4A59" trait={2} />K</kbd>
        </button>
        <span className="haut-espace" />
        <Link href="/operations/a-approuver" className="haut-ibtn" aria-label={aApprouver ? `${aApprouver} proposition${aApprouver > 1 ? 's' : ''} à approuver` : 'À approuver : rien en attente'} title={aApprouver ? `${aApprouver} à approuver` : 'Rien à approuver'}>
          <Icone nom="bell" taille={20} couleur="#0C2147" />
          {aApprouver > 0 && <i className="pastille-rouge" aria-hidden="true" />}
        </Link>
        <div className="haut-profil">
          <button type="button" className="haut-moi" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Mon compte">{initiales}</button>
          {menu && (
            <div className="menu" role="menu">
              <p className="menu-qui">{courriel}</p>
              <form action="/deconnexion" method="post"><button type="submit" role="menuitem">Me déconnecter</button></form>
            </div>
          )}
        </div>
      </header>
      {palette && (
        <div className="palette-fond" onClick={() => setPalette(false)}>
          <div className="palette" role="dialog" aria-label="Demandez à Cléo ou cherchez" onClick={(e) => e.stopPropagation()}>
            <div className="palette-champ">
              <img src="/img/cleo.png" alt="" className="avatar-cleo" />
              <input ref={champ} placeholder="Demandez à Cléo ou cherchez…" />
              <kbd className="touche">Échap</kbd>
            </div>
            <p className="palette-vide">La recherche et Cléo s’ajoutent ici avec les prochaines tranches (pages, dossiers, actions).</p>
          </div>
        </div>
      )}
    </>
  );
}
