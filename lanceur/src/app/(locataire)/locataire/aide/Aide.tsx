'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { BandeauLocataire, useLocataire } from '@/composants/portail/CoquilleLocataire';

/* Locataire · 14 Aide : foire aux questions (loyer, demandes, bail et départ), écrire à la gestionnaire, urgence 24/7, suggérer une
   amélioration (CONCORDANCE 2.14). Carte de crédit non offerte au lancement (décision du 13 oct.). Renseignements généraux, pas un avis juridique. */
const FAQ: [string, [string, string][]][] = [
  ['Loyer et paiements', [
    ['Comment payer mon loyer ?', 'Par prélèvement automatique le 1er du mois, ou par virement Interac en inscrivant la référence de votre logement dans le message. Le reçu apparaît dans Paiements dès réception.'],
    ['Que se passe-t-il si je paie en retard ?', 'Vous recevez d’abord un rappel. Si vous traversez une période difficile, écrivez-nous : une entente de paiement est souvent possible. Le loyer reste dû au propriétaire; un retard de plus de trois semaines lui permet de s’adresser au Tribunal administratif du logement.'],
    ['Puis-je obtenir un reçu pour mes impôts ?', 'Oui. Chaque loyer payé a son reçu dans Paiements (imprimable ou en PDF). Votre Relevé 31 vous est remis au plus tard le 28 février, dans vos documents.']]],
  ['Demandes et réparations', [
    ['Combien de temps pour une réparation ?', 'Une demande normale est prise en charge en 48 heures; une urgence, en tout temps. La durée des travaux dépend du fournisseur et des pièces : vous suivez chaque étape dans Mes demandes.'],
    ['Dois-je être présent lors de l’intervention ?', 'Non. Vous pouvez autoriser l’accès en votre absence. Sauf urgence, vous recevez un préavis d’au moins 24 heures; le fournisseur est identifié et l’heure de passage est consignée au dossier.'],
    ['Qu’est-ce qu’une urgence ?', 'Une situation qui menace les lieux ou votre sécurité : fuite d’eau active, plus de chauffage en hiver, panne électrique, serrure brisée. Appelez la ligne d’urgence : une personne répond jour et nuit. En cas de danger immédiat, composez le 911.']]],
  ['Bail et départ', [
    ['Comment renouveler mon bail ?', 'Votre bail se reconduit automatiquement aux mêmes conditions. Si le propriétaire propose un changement (une hausse, par exemple), il vous envoie un avis; vous avez un mois après sa réception pour l’accepter ou le refuser. Sans réponse, le changement est réputé accepté.'],
    ['Puis-je céder mon bail ?', 'Oui, avec l’accord du propriétaire, qui ne peut refuser sans motif sérieux. Il a 15 jours pour répondre; sans réponse, la cession est réputée acceptée. Faites la demande dans Nouvelle demande › Cession de bail.'],
    ['Puis-je sous-louer mon logement ?', 'Oui, aux mêmes conditions que la cession (accord du propriétaire, réponse sous 15 jours). Vous restez responsable du bail pendant la sous-location. Faites la demande dans Nouvelle demande › Sous-location.']]],
];

export function Aide() {
  const { pastilles, ouvrirCleo } = useLocataire();
  const [ouvert, setOuvert] = useState('Comment payer mon loyer ?');
  const C = pastilles?.contact, prenom = C?.nom?.split(' ')[0] ?? 'l’équipe';
  return (
    <>
      <BandeauLocataire titre="Aide" sous="Questions fréquentes des locataires" />
      <div className="lo-grille lo-remonte">
        <div className="lo-colonne">{FAQ.map(([theme, qs], i) => <section key={theme} className={`carte-l18 ${i === 0 ? 'e2' : ''}`} aria-label={theme}><h2 className="titre-carte">{theme}</h2>
          <ul className="lo-faq">{qs.map(([q, r]) => <li key={q}><button aria-expanded={ouvert === q} onClick={() => setOuvert(ouvert === q ? '' : q)}>{q}<Icone nom="chevD" taille={18} couleur="#0C2147" /></button>
            {ouvert === q && <p>{r}</p>}</li>)}</ul></section>)}</div>
        <div className="lo-colonne">
          <section className="carte-l18 e2" aria-label="Une question qui n’est pas ici ?"><span className="a-faire-ic"><Icone nom="message" taille={20} couleur="#0C2147" /></span>
            <h2 className="titre-carte" style={{ margin: '16px 0 4px' }}>Une question qui n’est pas ici ?</h2>
            <p className="gris texte-13">{prenom} répond le jour ouvrable suivant. <button className="lien" onClick={() => ouvrirCleo('')}>Cléo</button>, dans le menu, répond tout de suite.</p>
            <Link className="bouton bouton-principal pleine" href="/locataire/messages?nouveau=1"><Icone nom="message" taille={16} couleur="#fff" />Écrire à {prenom}</Link></section>
          <section id="urgence" className="carte-l18" aria-label="Urgence 24/7"><div className="personne-ligne"><span className="a-faire-ic rouge"><Icone nom="siren" taille={20} couleur="#9B2E28" /></span>
            <div><strong style={{ fontSize: 18 }}>Urgence 24/7</strong>{C?.urgence ? <a className="rouge fort" href={`tel:+1${C.urgence.replace(/\D/g, '').slice(-10)}`}>{C.urgence}</a> : <span className="gris texte-13">Numéro communiqué à la signature du bail</span>}</div></div>
            <p className="texte-13">Fuite, chauffage, électricité, serrure. Une personne répond, jour et nuit.</p>
            <p className="ligne-ic gris texte-12"><Icone nom="alert" taille={14} couleur="#58697F" />En cas de danger immédiat, composez le 911.</p></section>
          <section className="carte-l18" aria-label="Suggérer une amélioration"><h2 className="titre-carte">Suggérer une amélioration</h2>
            <p className="gris texte-13">Une idée pour rendre votre espace plus simple ? Elle est lue par l’équipe.</p>
            <Link className="bouton bouton-contour pleine" href="/locataire/messages?nouveau=1&sujet=Suggestion%20d%E2%80%99am%C3%A9lioration">Suggérer une amélioration</Link></section>
        </div>
      </div>
    </>
  );
}
