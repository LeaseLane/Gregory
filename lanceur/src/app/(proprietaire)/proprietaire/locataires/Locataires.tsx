'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';

/* Propriétaire · 05 Locataires : chiffres, recherche, filtre par immeuble, une carte par locataire (loyer du mois, retard et relance). */
type Loc = { id: string; nom: string; immeuble_id: string; logement: string; loyer: number; depuis: number | null; retard_jours: number | null; paye_ce_mois: boolean };
export type DonneesLocataires = { locataires: Loc[]; occupes: number; documents: number; documents_semaine: number; immeubles: { id: string; adresse: string }[] };
const argent = (n: number) => `${Math.round(n).toLocaleString('fr-CA').replace(/ /g, ' ')} $`;
const MOIS = new Date().toLocaleDateString('fr-CA', { month: 'long' });
const DE = /^[aeiouéèêh]/i.test(MOIS) ? 'd’' : 'de ';
const relance = (j: number) => (j >= 12 ? 'mise en demeure' : j >= 7 ? 'relance J+7' : 'rappel J+1');

export function Locataires({ donnees, erreur }: { donnees: DonneesLocataires | null; erreur: string | null }) {
  const [q, setQ] = useState(''), [imm, setImm] = useState('');
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? 'Vos locataires n’ont pas pu être lus.'}</div>;
  const L = donnees.locataires, enRetard = L.filter((l) => l.retard_jours), aJour = L.length - enRetard.length;
  const liste = L.filter((l) => (!imm || l.immeuble_id === imm) && (!q || `${l.nom} ${l.logement}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <div className="po-entete"><div><h1 className="po-titre">Locataires</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>Baux, paiements et demandes par personne</p></div>
        <button className="bouton bouton-contour po-bouton" disabled title="Arrive avec « Proposer un locataire » : vous proposez, l’équipe valide"><Icone nom="plus" taille={18} couleur="#0C2147" />Proposer un locataire</button></div>
      <div className="po-kpis">
        <div className="carte-l18 kpi-po"><span>Locataires<Icone nom="users" taille={18} couleur="#58697F" /></span><b>{L.length}</b><small>sur {donnees.occupes} logements occupés</small></div>
        <div className="carte-l18 kpi-po"><span>À jour<Icone nom="check" taille={18} couleur="#58697F" /></span><b>{aJour}</b><small>loyers {DE}{MOIS} reçus</small></div>
        <div className="carte-l18 kpi-po"><span><i className="point" style={{ background: '#9B2E28' }} />En retard<Icone nom="clock" taille={18} couleur="#58697F" /></span><b className={enRetard.length ? 'rouge' : ''}>{enRetard.length}</b><small>relances automatiques envoyées</small></div>
        <div className="carte-l18 kpi-po"><span>Documents<Icone nom="folder" taille={18} couleur="#58697F" /></span><b>{donnees.documents}</b><small>{donnees.documents_semaine} cette semaine</small></div>
      </div>
      <div className="po-filtres">
        <label className="po-recherche"><Icone nom="search" taille={18} couleur="#58697F" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un locataire" aria-label="Rechercher" /></label>
        <select className="e70-raison po-select" value={imm} onChange={(e) => setImm(e.target.value)} aria-label="Immeuble"><option value="">Tous les immeubles</option>{donnees.immeubles.map((b) => <option key={b.id} value={b.id}>{b.adresse}</option>)}</select>
      </div>
      <div className="po-cartes">{liste.map((l) => <Link key={l.id} href={`/proprietaire/locataires/${l.id}`} className="carte-l18 po-carte-loc">
        <div className="personne-ligne"><span className="ini" style={{ width: 48, height: 48, fontSize: 14 }}>{initiales(l.nom)}</span><div><strong>{l.nom}</strong><span className="gris">{l.logement}</span></div></div>
        {l.retard_jours ? <span className="puce todo" style={{ justifySelf: 'start' }}>En retard · {relance(l.retard_jours)}</span>
          : <span className="ligne-ic texte-13"><span className="okdot" style={{ marginTop: 0 }}><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{l.paye_ce_mois ? `Loyer ${DE}${MOIS} reçu` : 'À jour'}</span>}
        <dl className="po-carte-pied"><div><dt>Loyer</dt><dd>{argent(l.loyer)}</dd></div><div className="droite"><dt>Depuis</dt><dd>{l.depuis ?? '—'}</dd></div></dl></Link>)}
        {!liste.length && <p className="gris">Aucun locataire.</p>}</div>
    </>
  );
}
