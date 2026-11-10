'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';
import type { EspaceAdmin } from '@/lib/espaces';

/* Admin sur téléphone : Accueil + 3 espaces + « Plus » (les autres), en bas, à portée du pouce. Cachée au-dessus de 760 px (CSS).
   Les espaces reçus sont déjà filtrés par rôle côté serveur. */
const PREFERES = ['Opérations', 'Ventes', 'Finances'];

export function BarreBasAdmin({ espaces }: { espaces: EspaceAdmin[] }) {
  const chemin = usePathname();
  const [plus, setPlus] = useState(false);
  useEffect(() => setPlus(false), [chemin]);
  const dans = (e: EspaceAdmin) => chemin === e.racine || chemin.startsWith(e.racine + '/');
  const ordre = [...espaces.filter((e) => PREFERES.includes(e.nom)), ...espaces.filter((e) => !PREFERES.includes(e.nom))];
  const primaires = ordre.slice(0, 3), secondaires = ordre.slice(3);
  const accueil = chemin === '/';
  return (
    <>
      <nav className="bas-admin" aria-label="Espaces de l’admin">
        <Link href="/" className={accueil ? 'actif' : ''} aria-current={accueil ? 'page' : undefined}><Icone nom="home" taille={20} couleur="currentColor" /><span>Accueil</span></Link>
        {primaires.map((e) => <Link key={e.nom} href={e.href} className={dans(e) ? 'actif' : ''} aria-current={dans(e) ? 'page' : undefined}><Icone nom={e.icone} taille={20} couleur="currentColor" /><span>{e.nom}</span></Link>)}
        {secondaires.length > 0 && <button type="button" className={'bas-plus-bouton' + (plus || secondaires.some(dans) ? ' actif' : '')} aria-expanded={plus} aria-haspopup="true" onClick={() => setPlus((v) => !v)}><Icone nom="list" taille={20} couleur="currentColor" /><span>Plus</span></button>}
      </nav>
      {plus && <>
        <div className="bas-plus-fond" onClick={() => setPlus(false)} />
        <div className="bas-plus" role="menu" aria-label="Autres espaces">
          {secondaires.map((e) => <Link key={e.nom} href={e.href} role="menuitem" onClick={() => setPlus(false)} className={dans(e) ? 'actif' : ''}><Icone nom={e.icone} taille={20} couleur="currentColor" /><span>{e.nom}</span></Link>)}
        </div>
      </>}
    </>
  );
}
