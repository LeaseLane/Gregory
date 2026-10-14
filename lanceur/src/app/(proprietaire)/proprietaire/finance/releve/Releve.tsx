'use client';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';

/* Propriétaire · 11 Relevé mensuel : loyers payés chez vous (suivis), puis la facture d'honoraires du 5 (honoraires, coordination, taxes).
   Aucun « total versé » (décision du 13 oct.). Imprimable; « Télécharger le PDF » passe par l'impression du navigateur. */
export type DonneesReleve = { numero: string; mois: string; emis_le: string; destinataire: { nom: string; entreprise: string | null; courriel: string | null; logements: number; immeubles: number };
  lignes: { libelle: string; categorie: string; le: string; montant: number; immeuble: string | null }[]; facture: { honoraires: number; coordination: number; tps: number; tvq: number; total: number } };
const argent = (n: number) => `${n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ /g, ' ')} $`;
const jour = (iso: string) => { const x = new Date(`${iso}T12:00:00`); return `${x.getDate() === 1 ? '1er' : x.getDate()} ${x.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}`; };
const moisNom = (iso: string) => new Date(`${iso.slice(0, 7)}-15T12:00:00`).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });

export function Releve({ donnees, erreur }: { donnees: DonneesReleve | null; erreur: string | null }) {
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? 'Ce relevé n’a pas pu être lu.'}</div>;
  const R = donnees, loyers = R.lignes.filter((l) => l.montant > 0), frais = R.lignes.filter((l) => l.montant < 0 && l.categorie !== 'Honoraires' && l.categorie !== 'Coordination');
  return (
    <>
      <div className="po-entete no-print"><div><Link className="lien po-retour" href="/proprietaire/finance"><Icone nom="arrow" taille={14} couleur="#2E5788" />Retour à la finance</Link><h1 className="po-titre">Relevé mensuel · {moisNom(R.mois)}</h1></div>
        <div className="a-faire-actions"><button className="bouton bouton-contour po-bouton" onClick={() => window.print()}><Icone nom="file" taille={16} couleur="#0C2147" />Imprimer</button>
          <button className="bouton bouton-principal po-bouton" onClick={() => window.print()}><Icone nom="download" taille={16} couleur="#fff" />Télécharger le PDF</button></div></div>
      <article className="releve">
        <header><img src="/img/logo-sur-blanc.svg" alt="Lease Lane" /><div><h2>Relevé mensuel</h2><p>N° {R.numero} · émis le {jour(R.emis_le)}</p></div></header>
        <div className="releve-parties"><div><p className="surtitre gris">Émis par</p><strong>Solutions locatives Lease Lane</strong><span>Québec (Québec)</span><span>info@leaselane.ca</span></div>
          <div><p className="surtitre gris">Destinataire</p><strong>{R.destinataire.nom}</strong>{R.destinataire.entreprise && <span>{R.destinataire.entreprise}</span>}<span>{R.destinataire.logements} logements · {R.destinataire.immeubles} immeubles</span>{R.destinataire.courriel && <span>{R.destinataire.courriel}</span>}</div></div>
        <table className="tableau"><thead><tr><th>Loyers payés chez vous (suivis)</th><th>Période</th><th className="droite">Montant</th></tr></thead>
          <tbody>{loyers.map((l, i) => <tr key={i}><td>{l.libelle.replace('Loyers payés chez vous — ', '')}{l.categorie === 'Loyer partiel' ? ' (partiel)' : ''}</td><td>{moisNom(R.mois)}</td><td className="droite">{argent(l.montant)}</td></tr>)}
            {!loyers.length && <tr><td colSpan={3} className="gris">Aucun loyer payé ce mois-ci.</td></tr>}</tbody></table>
        {frais.length > 0 && <table className="tableau"><thead><tr><th>Travaux (factures remises telles quelles)</th><th>Date</th><th className="droite">Montant</th></tr></thead>
          <tbody>{frais.map((l, i) => <tr key={i}><td>{l.libelle.replace(/(\d+)\.(\d*?)0* %/, (_, a, b) => `${a}${b ? `,${b}` : ''} %`)}</td><td>{jour(l.le)}</td><td className="droite">{argent(-l.montant)}</td></tr>)}</tbody></table>}
        <table className="tableau"><thead><tr><th>Facture d’honoraires du 5</th><th /><th className="droite">Montant</th></tr></thead>
          <tbody>{[['Honoraires de gestion', R.facture.honoraires], ['Coordination 10 % (travaux de plus de 1 000 $)', R.facture.coordination], ['TPS 5 %', R.facture.tps], ['TVQ 9,975 %', R.facture.tvq]].filter(([, v]) => (v as number) > 0 || true).map(([t, v]) =>
            <tr key={t as string}><td>{t}</td><td /><td className="droite">{argent(v as number)}</td></tr>)}</tbody></table>
        <p className="releve-total"><span>Total de la facture du 5</span><b>{argent(R.facture.total)}</b></p>
        <p className="po-note">Les loyers sont payés directement à vous; Lease Lane les suit et relance les retards. La facture d’honoraires est prélevée ou payable le 5. Les factures des fournisseurs sont jointes telles quelles au dossier; les frais de coordination de 10 % s’appliquent seulement au-delà de 1 000 $.</p>
      </article>
    </>
  );
}
