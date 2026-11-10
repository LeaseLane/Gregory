'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* Lien « retour » de la page introuvable : chaque portail a sa propre porte d'entrée (un locataire ne doit pas atterrir dans l'admin). */
export function LienRetour() {
  const chemin = usePathname() ?? '/';
  const [href, libelle] = chemin.startsWith('/proprietaire') ? ['/proprietaire', 'Retour à mon espace']
    : chemin.startsWith('/locataire') ? ['/locataire', 'Retour à mon espace']
    : chemin.startsWith('/espace') ? ['/espace/connexion', 'Aller à la connexion']
    : ['/', 'Retour à l’accueil'];
  return <Link className="bouton bouton-principal" href={href} style={{ width: 'auto', justifySelf: 'start', marginTop: 8 }}>{libelle}</Link>;
}
