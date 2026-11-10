'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/* Téléphone : un tableau de 6 colonnes ou moins devient une pile de cartes (nom en titre, puis « COLONNE  valeur »).
   Ce composant ne fait que poser la classe .en-cartes et data-label (le nom de la colonne) sur chaque cellule; l'aspect est du CSS sous 760 px.
   La matrice des droits (.matrice) et les tableaux de plus de 6 colonnes gardent le défilement horizontal. Ne rend rien. */
const MAX_COLONNES = 6;

function preparer() {
  document.querySelectorAll<HTMLTableElement>('table.tableau:not(.matrice)').forEach((t) => {
    const noms = [...t.querySelectorAll('thead th')].map((x) => (x.textContent ?? '').trim());
    if (!noms.length || noms.length > MAX_COLONNES) return;
    t.classList.add('en-cartes');
    t.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach((tr) => [...tr.children].forEach((td, i) => {
      const c = td as HTMLTableCellElement;
      if (noms[i] && c.colSpan <= 1 && c.getAttribute('data-label') !== noms[i]) c.setAttribute('data-label', noms[i]);
    }));
  });
}

export function TableauxCartes() {
  const chemin = usePathname();
  useEffect(() => {
    let image = 0;
    const planifier = () => { cancelAnimationFrame(image); image = requestAnimationFrame(preparer); };
    preparer();
    const o = new MutationObserver(planifier); o.observe(document.body, { childList: true, subtree: true });
    return () => { o.disconnect(); cancelAnimationFrame(image); };
  }, [chemin]);
  return null;
}
