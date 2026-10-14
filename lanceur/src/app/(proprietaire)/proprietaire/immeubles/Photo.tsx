'use client';
import { useEffect, useState } from 'react';
import { Icone } from '@/composants/Icones';
import { lienFichier } from '@/composants/portail/fichiers';

/* Photo d'un immeuble (lien signé), sinon le pictogramme de la maquette. */
export function Photo({ id, aPhoto, hauteur = 176 }: { id: string; aPhoto: boolean; hauteur?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => { if (aPhoto) lienFichier('photo', id).then(setSrc); }, [id, aPhoto]);
  return <div className="po-photo" style={{ height: hauteur }}>{src ? <img src={src} alt="" /> : <Icone nom="building" taille={28} couleur="#8A99AB" />}</div>;
}
