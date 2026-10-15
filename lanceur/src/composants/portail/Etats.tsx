'use client';
import { Icone } from '@/composants/Icones';

/* États communs des portails : chargement (squelette) et erreur (message clair, réessayer, joindre l'équipe). */
export function Chargement() {
  return <div className="etat-chargement" role="status" aria-label="Chargement"><i className="sq titre" /><div className="sq-grille"><i className="sq" /><i className="sq" /><i className="sq" /></div><i className="sq grand" /></div>;
}
export function Erreur({ reset, espace }: { reset: () => void; espace: 'locataire' | 'proprietaire' }) {
  return (
    <div className="carte-l18 etat-erreur" role="alert">
      <span className="a-faire-ic rouge"><Icone nom="alert" taille={22} couleur="#9B2E28" /></span>
      <h1>Cette page n’a pas pu s’afficher</h1>
      <p className="gris">Vos données sont intactes. Réessayez dans un instant; si le problème persiste, écrivez-nous.</p>
      <p className="a-faire-actions" style={{ justifyContent: 'center' }}><button className="bouton bouton-principal po-bouton" onClick={reset}>Réessayer</button>
        <a className="lien" href={`/${espace}/messages?nouveau=1`}>Écrire à l’équipe</a></p>
      {espace === 'locataire' && <p className="gris texte-13">Une urgence (fuite, chauffage, électricité, serrure) ? Utilisez le bouton Urgence 24/7.</p>}
    </div>
  );
}
