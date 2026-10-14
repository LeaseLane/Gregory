'use client';
import { useState } from 'react';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { heureQc, jourQc, memeJourQc } from '@/composants/portail/dates';

/* Propriétaire · 14 Utilisateurs et accès (lecture) : qui accède à vos données, 2FA, journal des accès, décisions automatisées.
   Inviter un copropriétaire ou un comptable arrive avec les invitations (jalon 4); aucune suppression directe (D14). */
type U = { nom: string; courriel: string; role: string; portee: string; deux_fa: boolean; actif: boolean; derniere: string | null; vous: boolean };
export type DonneesAcces = { utilisateurs: U[]; journal: { le: string; qui: string; quoi: string; canal: string; sensible: boolean }[]; decisions: { le: string; resume: string; revision: string | null; issue: string | null }[] };
const quand = (iso: string | null) => !iso ? '—' : memeJourQc(iso, new Date()) ? `Aujourd’hui · ${heureQc(iso)}` : jourQc(iso);

export function Acces({ donnees, erreur }: { donnees: DonneesAcces | null; erreur: string | null }) {
  const [onglet, setOnglet] = useState<'utilisateurs' | 'journal' | 'securite'>('utilisateurs');
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? 'Les accès n’ont pas pu être lus.'}</div>;
  const U = donnees.utilisateurs, fa = Math.round((100 * U.filter((u) => u.deux_fa).length) / Math.max(1, U.length));
  function csv() {
    const l = [['Date', 'Qui', 'Action', 'Canal', 'Lecture sensible'], ...donnees!.journal.map((j) => [j.le, j.qui, j.quoi, j.canal, j.sensible ? 'oui' : 'non'])].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + l], { type: 'text/csv' })); a.download = 'journal-acces.csv'; a.click();
  }
  return (
    <>
      <div><h1 className="po-titre">Utilisateurs et accès</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>Qui voit vos données; Lease Lane n’accède qu’au périmètre du mandat</p></div>
      <div className="po-kpis">
        <div className="carte-l18 kpi-po"><span>Comptes<Icone nom="users" taille={18} couleur="#58697F" /></span><b>{U.length}</b><small>{U.filter((u) => u.actif).length} actifs</small></div>
        <div className="carte-l18 kpi-po"><span>Double authentification<Icone nom="shield" taille={18} couleur="#58697F" /></span><b>{fa} %</b><small>{fa === 100 ? 'aucun compte à configurer' : `${U.filter((u) => !u.deux_fa).length} compte(s) sans 2FA`}</small></div>
        <div className="carte-l18 kpi-po"><span>Consultations (90 j)<Icone nom="lock" taille={18} couleur="#58697F" /></span><b>{donnees.journal.filter((j) => j.sensible).length}</b><small>lectures sensibles journalisées</small></div>
        <div className="carte-l18 kpi-po"><span>Décisions automatisées<Icone nom="calendar" taille={18} couleur="#58697F" /></span><b>{donnees.decisions.length}</b><small>révisables par une personne</small></div>
      </div>
      <section className="studio-liste" aria-label="Accès">
        <nav className="po-onglets tete-onglets">{([['utilisateurs', `Utilisateurs (${U.length})`], ['journal', 'Journal d’accès'], ['securite', 'Sécurité']] as const).map(([k, l]) => <button key={k} className={onglet === k ? 'actif' : ''} onClick={() => setOnglet(k)}>{l}</button>)}
          <span className="a-faire-actions" style={{ marginLeft: 'auto' }}><button className="bouton bouton-contour po-bouton" onClick={csv}><Icone nom="download" taille={16} couleur="#0C2147" />Journal (CSV)</button>
            <button className="bouton bouton-principal po-bouton" disabled title="Arrive avec les invitations"><Icone nom="plus" taille={16} couleur="#fff" />Inviter</button></span></nav>
        {onglet === 'utilisateurs' && <table className="tableau"><thead><tr><th>Utilisateur</th><th>Rôle · portée</th><th>2FA</th><th>Statut</th><th>Dernière connexion</th></tr></thead>
          <tbody>{U.map((u) => <tr key={u.courriel}><td><span className="cellule-ini"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(u.nom)}</span><span><strong className="fort">{u.nom}{u.vous ? ' (vous)' : ''}</strong><span className="sous gris">{u.courriel}</span></span></span></td>
            <td><span className="cellule-doc"><span className={`puce ${u.vous ? '' : 'neutral'}`} style={{ justifySelf: 'start' }}>{u.role}</span><span className="gris">{u.portee}</span></span></td>
            <td>{u.deux_fa ? <span className="ligne-ic"><span className="okdot" style={{ marginTop: 0 }}><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>Active</span> : <span className="rouge fort">À activer</span>}</td>
            <td>{u.actif ? 'Actif' : 'Inactif'}</td><td>{quand(u.derniere)}</td></tr>)}</tbody></table>}
        {onglet === 'journal' && <ul className="planifier po-liste-simple">{donnees.journal.map((j, i) => <li key={i}><div><strong>{j.qui}</strong><span>{j.quoi}</span></div><span className="gris texte-13">{quand(j.le)}</span><span className={`puce ${j.sensible ? 'neutral' : ''}`}>{j.sensible ? 'Lecture sensible' : 'OK'}</span></li>)}
          {!donnees.journal.length && <li className="gris">Aucun accès depuis 90 jours.</li>}</ul>}
        {onglet === 'securite' && <ul className="garde-fous" style={{ padding: 24 }}>{['Double authentification obligatoire pour les propriétaires', 'Chaque consultation d’une fiche locataire est inscrite au journal (Loi 25)', 'Les données sont chiffrées au repos; les fichiers s’ouvrent par un lien valable 10 minutes', 'Lease Lane n’accède qu’au périmètre de votre mandat de gestion'].map((t) =>
          <li key={t}><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t}</li>)}</ul>}
      </section>
      <section className="carte-l18" aria-label="Décisions automatisées">
        <h2 className="titre-carte" style={{ margin: 0 }}>Décisions automatisées récentes</h2><p className="gris texte-13" style={{ margin: '4px 0 12px' }}>Chacune peut être révisée par une personne : demandez-le depuis le dossier.</p>
        <ul className="planifier">{donnees.decisions.map((d, i) => <li key={i}><div><strong>{d.resume}</strong><span>{quand(d.le)}</span></div><span className="puce neutral">{d.issue ? `Révisée · ${d.issue}` : d.revision ? 'Révision demandée' : 'Système'}</span></li>)}
          {!donnees.decisions.length && <li className="gris">Aucune décision automatisée.</li>}</ul>
      </section>
    </>
  );
}
