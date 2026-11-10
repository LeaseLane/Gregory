'use client';
import { useEffect, useRef } from 'react';

/* Dans une barre d'onglets qui défile (téléphone), ramène l'onglet actif (aria-current) au centre : sans ça il reste hors champ. Ne rend rien. */
export function DefileActif() {
  const r = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const nav = r.current?.parentElement, a = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && a) nav.scrollLeft += a.getBoundingClientRect().left - nav.getBoundingClientRect().left - (nav.clientWidth - a.offsetWidth) / 2;
  }, []);
  return <span ref={r} hidden />;
}
