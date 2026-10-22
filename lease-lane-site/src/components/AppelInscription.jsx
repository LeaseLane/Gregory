/** @jsxImportSource @/lib/i18n */
/* Bande d'appel « Inscrire mon entreprise » dans son propre fichier : l'accueil l'affiche sans charger tout le formulaire
   d'inscription (InscriptionEntreprise.jsx, ≈ 18 Ko; PageSpeed, 22 oct. 2026). Styles : src/styles/inscription.css. */
import React from 'react';
import { Icon } from '@/components/ds';

const Ic = ({ n, s = 20, cls = '' }) => <Icon name={n} size={s} className={'ie-ic ' + cls} />;
/* Bande d'appel : bas de la page d'inscription (ramène au formulaire) et page d'accueil (ouvre la page). */
export function AppelInscription({ accueil = false }) {
  return <section className={'ie-appel' + (accueil ? ' ie-appel-accueil' : '')} aria-labelledby={accueil ? 't-appel-accueil' : 't-appel'}>
    <div className="ie-conteneur">
      <div className="ie-bande">
        <svg className="ie-chevrons" viewBox="0 0 300 200" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><g fill="none" stroke="#2E5788" strokeWidth="40" opacity=".5"><path d="M20 -30 L150 100 L20 230" /><path d="M120 -30 L250 100 L120 230" /></g></svg>
        {accueil
          ? <div><span className="ie-surtitre">Entrepreneurs et travailleurs autonomes</span><h2 id="t-appel-accueil">Faites découvrir votre entreprise</h2><p>Inscription gratuite : preuve d’assurance, téléphone et courriel suffisent pour commencer.</p></div>
          : <div><h2 id="t-appel">Prêt à vous faire découvrir?</h2><p>Trois éléments, et votre inscription gratuite est envoyée.</p></div>}
        <a className="ie-btn ie-btn-inverse" href={accueil ? '/inscrire-mon-entreprise' : '#inscription'}>Inscrire mon entreprise <Ic n="arrow-right" /></a>
      </div>
    </div>
  </section>;
}
