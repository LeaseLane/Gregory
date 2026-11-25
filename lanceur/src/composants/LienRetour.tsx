'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/composants/Langue';

/* Lien « retour » de la page introuvable : chaque portail a sa propre porte d'entrée (un locataire ne doit pas atterrir dans l'admin). */
export function LienRetour() {
  const { t } = useT();
  const chemin = usePathname() ?? '/';
  const [href, libelle] = chemin.startsWith('/proprietaire') ? ['/proprietaire', t('Retour à mon espace')]
    : chemin.startsWith('/locataire') ? ['/locataire', t('Retour à mon espace')]
    : chemin.startsWith('/espace') ? ['/espace/connexion', t('Aller à la connexion')]
    : ['/', t('Retour à l’accueil')];
  return <Link className="bouton bouton-principal" href={href} style={{ width: 'auto', justifySelf: 'start', marginTop: 8 }}>{libelle}</Link>;
}
