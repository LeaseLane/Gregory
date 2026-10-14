'use client';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';

/* Propriétaire · 10 Finance (décisions du 13 oct.) : les loyers sont payés directement chez vous et suivis par Lease Lane; Lease Lane
   facture le 5 ses honoraires et, pour une facture de travaux de plus de 1 000 $, 10 % de coordination. Aucun « net », aucun « versé ».
   Relevés 31 : la production arrive avec TF (février); la liste des locataires au 31 décembre est déjà là. */
type Ecriture = { le: string; libelle: string; categorie: string; montant: number };
export type DonneesFinance = { mois: string; taux: number; ecritures: Ecriture[]; precedent: { loyers: number; travaux: number }; releves: string[]; releves_31: { immeuble: string; logement: string; locataire: string }[] };
const argent = (n: number) => `${n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ /g, ' ')} $`;
const moisNom = (ym: string) => new Date(`${ym.slice(0, 7)}-15T12:00:00`).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase());
const jour = (iso: string) => { const x = new Date(`${iso}T12:00:00`); return `${x.getDate() === 1 ? '1er' : x.getDate()} ${x.toLocaleDateString('fr-CA', { month: 'short' })}`; };
const ecart = (a: number, b: number) => b ? `${a >= b ? '+' : ''}${(((a - b) / b) * 100).toFixed(1).replace('.', ',')} %` : '';
const CAT: Record<string, string> = { Loyers: '', 'Loyer partiel': 'todo', Honoraires: 'neutral', Entretien: 'neutral', Coordination: 'neutral' };

export function Finance({ donnees, erreur }: { donnees: DonneesFinance | null; erreur: string | null }) {
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? 'Vos finances n’ont pas pu être lues.'}</div>;
  const D = donnees, E = D.ecritures, somme = (f: (e: Ecriture) => boolean) => E.filter(f).reduce((a, e) => a + e.montant, 0);
  const pos = (n: number) => (Math.abs(n) < 0.005 ? 0 : n);
  const loyers = somme((e) => e.montant > 0), honoraires = pos(-somme((e) => e.categorie === 'Honoraires')), travaux = pos(-somme((e) => e.categorie === 'Entretien')), coord = pos(-somme((e) => e.categorie === 'Coordination'));
  const facture = (honoraires + coord) * 1.14975, mois = D.mois.slice(0, 7);
  function csv() {
    const lignes = [['Date', 'Écriture', 'Catégorie', 'Montant'], ...E.map((e) => [e.le, e.libelle, e.categorie, e.montant.toFixed(2)])].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lignes], { type: 'text/csv' })); a.download = `grand-livre-${mois}.csv`; a.click();
  }
  return (
    <>
      <div><h1 className="po-titre">Finance</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>Loyers suivis, honoraires, travaux et relevés · {moisNom(mois)}</p></div>
      <div className="po-kpis">
        <div className="carte-l18 kpi-po"><span>Loyers payés chez vous<Icone nom="dollar" taille={18} couleur="#58697F" /></span><b>{argent(loyers)}</b><small>{ecart(loyers, D.precedent.loyers)} · {moisNom(mois).toLowerCase()} · suivis par Lease Lane</small></div>
        <div className="carte-l18 kpi-po"><span>Honoraires {String(D.taux).replace('.', ',')} %<Icone nom="card" taille={18} couleur="#58697F" /></span><b>{argent(honoraires)}</b><small>logements occupés seulement</small></div>
        <div className="carte-l18 kpi-po"><span>Travaux<Icone nom="wrench" taille={18} couleur="#58697F" /></span><b>{argent(travaux)}</b><small>{ecart(travaux, D.precedent.travaux)} · factures remises telles quelles</small></div>
        <div className="carte-l18 kpi-po"><span>Facture du 5<Icone nom="receipt" taille={18} couleur="#58697F" /></span><b>{argent(facture)}</b><small>honoraires{coord ? ' et coordination' : ''}, taxes incluses</small></div>
      </div>
      <div className="po-grille-haut">
        <section className="studio-liste" aria-label="Grand livre">
          <header className="carte-tete tete-action"><div><h2>Grand livre</h2><p>{moisNom(mois)} · une ligne par écriture</p></div>
            <div className="a-faire-actions"><button className="bouton bouton-contour po-bouton" onClick={csv} disabled={!E.length}><Icone nom="download" taille={16} couleur="#0C2147" />CSV</button>
              <Link className="bouton bouton-principal po-bouton" href={`/proprietaire/finance/releve?m=${mois}`}><Icone nom="receipt" taille={16} couleur="#fff" />Relevé du mois</Link></div></header>
          <table className="tableau"><colgroup><col style={{ width: '14%' }} /><col style={{ width: '48%' }} /><col style={{ width: '18%' }} /><col /></colgroup>
            <thead><tr><th>Date</th><th>Écriture</th><th>Catégorie</th><th className="droite">Montant</th></tr></thead>
            <tbody>{E.map((e, i) => <tr key={i}><td>{jour(e.le)}</td><td style={{ whiteSpace: 'normal' }}>{e.libelle.replace(/(\d+)\.(\d*?)0* %/, (_, a, b) => `${a}${b ? `,${b}` : ''} %`)}</td><td><span className={`puce ${CAT[e.categorie] ?? 'neutral'}`}>{e.categorie}</span></td>
              <td className="droite fort">{e.montant > 0 ? '+' : ''}{argent(e.montant)}</td></tr>)}
              {!E.length && <tr><td colSpan={4} className="gris">Aucune écriture pour ce mois.</td></tr>}</tbody></table>
          <p className="po-note" style={{ margin: '0 24px 24px' }}><Icone nom="help" taille={14} couleur="#3E4A59" />Les loyers sont payés directement chez vous : Lease Lane les suit et relance les retards. La facture du fournisseur vous est remise telle quelle; 10 % de coordination s’ajoute seulement au-delà de 1 000 $.</p>
        </section>
        <div className="colonne-l18">
          <section className="carte-l18" aria-label="Répartition">
            <h2 className="titre-carte" style={{ margin: 0 }}>Répartition</h2><p className="gris texte-13" style={{ margin: '4px 0 16px' }}>{moisNom(mois)} · ce que vous coûtent la gestion et les travaux</p>
            <p className="po-grand">{loyers ? Math.round((100 * (honoraires + travaux + coord)) / loyers) : 0} %</p><p className="gris texte-13" style={{ margin: '4px 0 12px' }}>des loyers payés</p>
            <span className="jauge large"><i style={{ width: `${loyers ? Math.min(100, (100 * (honoraires + travaux + coord)) / loyers) : 0}%` }} /></span>
            <dl className="po-liste">{[['Loyers payés chez vous', loyers], ['Honoraires', honoraires], ['Travaux', travaux], ['Coordination', coord]].map(([t, v]) => <div key={t as string}><dt>{t}</dt><dd>{argent(v as number)}</dd></div>)}</dl>
          </section>
          <section className="carte-l18" aria-label="Relevés">
            <h2 className="titre-carte" style={{ margin: 0 }}>Relevés</h2><p className="gris texte-13" style={{ margin: '4px 0 12px' }}>Un par mois, imprimable</p>
            <ul className="planifier">{D.releves.map((r, i) => <li key={r}><div><strong className="ligne-ic"><Icone nom="file" taille={16} couleur="#0C2147" />{moisNom(r)}</strong></div>
              <Link className="lien" href={`/proprietaire/finance/releve?m=${r}`}>{i === 0 ? 'Ouvrir' : 'PDF'}</Link></li>)}{!D.releves.length && <li className="gris">Aucun relevé.</li>}</ul>
          </section>
        </div>
      </div>
      <section className="studio-liste" aria-label="Relevés 31">
        <header className="carte-tete tete-action"><div><h2>Relevés 31 — année {new Date().getFullYear()}</h2><p>Un relevé par logement, pour chaque locataire au 31 décembre · échéance fin février</p></div>
          <div className="a-faire-actions"><button className="bouton bouton-contour po-bouton" disabled title="Production en janvier : arrive avec les Relevés 31">Produire les Relevés 31</button>
            <button className="bouton bouton-contour po-bouton" disabled title="Après la production">Remettre aux locataires</button></div></header>
        <table className="tableau"><thead><tr><th>Immeuble</th><th>Logement</th><th>Locataire au 31 décembre</th><th>Statut</th></tr></thead>
          <tbody>{D.releves_31.map((r, i) => <tr key={i}><td>{r.immeuble}</td><td>{r.logement}</td><td>{r.locataire}</td><td><span className="puce neutral">À produire</span></td></tr>)}
            {!D.releves_31.length && <tr><td colSpan={4} className="gris">Aucun bail au 31 décembre.</td></tr>}</tbody></table>
      </section>
    </>
  );
}
