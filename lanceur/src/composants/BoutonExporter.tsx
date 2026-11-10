'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icone } from '@/composants/Icones';

/* « Exporter » de l'en-tête d'espace (maquette B.SP.actions) : les tableaux affichés sur la page, en un fichier CSV
   (séparateur « ; », UTF-8 avec BOM pour Excel). Rien n'est envoyé au serveur : c'est ce que la personne voit déjà. */
const cellule = (t: string) => `"${t.replace(/\s+/g, ' ').trim().replace(/"/g, '""')}"`;

export function BoutonExporter({ nom }: { nom: string }) {
  const chemin = usePathname(), [aTable, setATable] = useState(true);
  /* Sans tableau à la page (Clés d'API, Sécurité…), le bouton n'aurait aucun effet : on ne l'affiche pas. Deuxième lecture après 600 ms pour les tableaux qui arrivent après l'hydratation. */
  useEffect(() => { const lire = () => setATable(!!document.querySelector('.espace-page table')); lire(); const t = setTimeout(lire, 600); return () => clearTimeout(t); }, [chemin]);
  function exporter() {
    const tables = [...document.querySelectorAll<HTMLTableElement>('.espace-page table')];
    if (!tables.length) return;
    const lignes: string[] = [];
    tables.forEach((t, i) => {
      if (i) lignes.push('');
      const titre = t.closest('section, .carte-l18, .carte')?.querySelector('h2, h3')?.textContent;
      if (tables.length > 1 && titre) lignes.push(cellule(titre));
      t.querySelectorAll('tr').forEach((tr) => lignes.push([...tr.querySelectorAll('th, td')].map((c) => cellule((c as HTMLElement).innerText)).join(';')));
    });
    const url = URL.createObjectURL(new Blob(['﻿' + lignes.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `lease-lane-${nom}-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }
  if (!aTable) return null;
  return <button type="button" className="bouton bouton-contour" style={{ width: 136 }} onClick={exporter}><Icone nom="download" taille={20} couleur="#0C2147" />Exporter</button>;
}
