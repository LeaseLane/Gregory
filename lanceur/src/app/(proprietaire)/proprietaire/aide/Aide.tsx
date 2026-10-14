'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';

/* Propriétaire · 16 Aide : questions fréquentes, réponses alignées sur les décisions du 13 oct. (loyers payés chez vous, honoraires
   facturés le 5, coordination de 10 % au-delà de 1 000 $, le propriétaire propose un locataire et l'équipe valide, prise en charge en 48 h). */
const FAQ: [string, [string, string][]][] = [
  ['Frais et facturation', [
    ['Comment sont calculés les honoraires ?', 'Un pourcentage des loyers effectivement payés sur les logements occupés (6 % par défaut, selon votre mandat). Un logement vacant ne génère aucuns frais. Lease Lane vous facture le 5 du mois, taxes en sus.'],
    ['Est-ce que Lease Lane me verse les loyers ?', 'Non. Vos locataires paient directement chez vous. Lease Lane suit chaque paiement, relance les retards et vous envoie le relevé et la facture d’honoraires le 5.'],
    ['Prenez-vous une marge sur les travaux ?', 'Non. La facture du fournisseur vous est remise telle quelle. Des frais de coordination de 10 % s’ajoutent seulement pour une facture de plus de 1 000 $ (rien à 1 000 $ ou moins).']]],
  ['Travaux et autorisations', [
    ['Qu’est-ce que le seuil d’autorisation ?', 'Le montant au-delà duquel une dépense vous est soumise avant d’être commandée (500 $ par défaut, selon votre mandat). Sous ce seuil, l’équipe agit pour vous.'],
    ['Que se passe-t-il en cas d’urgence ?', 'Une urgence (sécurité, eau, chauffage) est prise en charge tout de suite, jour et nuit; vous êtes avisé aussitôt. Une demande normale est prise en charge en 48 h.'],
    ['Puis-je choisir mes fournisseurs ?', 'Oui : indiquez-les à votre gestionnaire. L’équipe compare jusqu’à 3 soumissions sur la même portée et vous recommande la meilleure; vous décidez au-delà du seuil.']]],
  ['Locataires et baux', [
    ['Qui décide de la sélection d’un locataire ?', 'Vous proposez un locataire ou nous vous en présentons; l’équipe valide (vérifications, enquête de crédit avec consentement). Vous gardez la décision finale si vous l’avez choisi dans vos règles.'],
    ['Comment gérez-vous les retards de loyer ?', 'Rappel par SMS à J+1, courriel à J+7, puis mise en demeure à J+12 approuvée par une personne. Le dossier peut ensuite aller au Tribunal administratif du logement.']]],
];

export function Aide({ gestionnaire }: { gestionnaire: { nom: string; initiales: string; courriel: string } | null }) {
  const [ouvert, setOuvert] = useState('Comment sont calculés les honoraires ?');
  return (
    <>
      <div><h1 className="po-titre">Aide</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>Questions fréquentes des propriétaires</p></div>
      <div className="po-grille-haut">
        <div className="colonne-l18">{FAQ.map(([titre, qs], k) => <section key={titre} className={`carte-l18 ${k === 0 ? 'e2' : ''}`}><h2 className="titre-carte">{titre}</h2>
          <ul className="po-faq">{qs.map(([q, r]) => <li key={q}><button aria-expanded={ouvert === q} onClick={() => setOuvert(ouvert === q ? '' : q)}><strong>{q}</strong><Icone nom="chevron" taille={18} couleur="#0C2147" /></button>{ouvert === q && <p>{r}</p>}</li>)}</ul></section>)}</div>
        <div className="colonne-l18">
          <section className="carte-l18 e2"><img src="/img/cleo.png" alt="" className="avatar-cleo" style={{ width: 48, height: 48 }} /><h2 className="titre-carte" style={{ margin: '16px 0 8px' }}>Une question qui n’est pas ici ?</h2>
            <p className="gris texte-13">Cléo répond tout de suite, jour et nuit. {gestionnaire ? `${gestionnaire.nom.split(' ')[0]} répond` : 'L’équipe répond'} le jour ouvrable suivant.</p>
            <p className="gris texte-13" style={{ margin: '16px 0 8px' }}>Ouvrez Cléo depuis la barre de recherche, en haut.</p>
            <Link className="lien" href="/proprietaire/messages?nouveau=1">Écrire à l’équipe</Link></section>
          {gestionnaire && <section className="carte-l18"><h2 className="titre-carte">Votre équipe Lease Lane</h2>
            <div className="personne-ligne"><span className="ini" style={{ width: 44, height: 44, fontSize: 13 }}>{gestionnaire.initiales}</span><div><strong>{gestionnaire.nom}</strong><span className="gris">Gestionnaire attitrée</span></div></div>
            <p className="ligne-ic" style={{ margin: '16px 0 8px' }}><Icone nom="mail" taille={16} couleur="#3E4A59" />{gestionnaire.courriel}</p><p className="ligne-ic" style={{ margin: 0 }}><Icone nom="clock" taille={16} couleur="#3E4A59" />Lun.–ven., 8 h à 17 h</p></section>}
        </div>
      </div>
    </>
  );
}
