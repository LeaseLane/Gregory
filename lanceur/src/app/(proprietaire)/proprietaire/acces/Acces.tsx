'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { heureQc, jourQc, memeJourQc } from '@/composants/portail/dates';

/* Propriétaire · 14 Utilisateurs et accès : qui accède à vos données, 2FA, journal des accès, décisions automatisées; le titulaire invite un
   copropriétaire ou un comptable (lecture seulement), annule une invitation, retire un accès. Portée par immeuble : pas encore (tous les immeubles). */
type U = { membre_id?: string; nom: string; courriel: string; role: string; portee: string; deux_fa: boolean; actif: boolean; derniere: string | null; vous: boolean; equipe?: boolean };
type Inv = { id: string; nom: string; courriel: string; role: string; envoyee: string; expire: string };
export type DonneesAcces = { titulaire: boolean; utilisateurs: U[]; invitations: Inv[]; refus: number; journal: { le: string; qui: string; quoi: string; canal: string; sensible: boolean }[]; decisions: { le: string; resume: string; revision: string | null; issue: string | null }[] };
const quand = (iso: string | null) => !iso ? '—' : memeJourQc(iso, new Date()) ? `Aujourd’hui · ${heureQc(iso)}` : jourQc(iso);

export function Acces({ donnees, erreur }: { donnees: DonneesAcces | null; erreur: string | null }) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<'utilisateurs' | 'roles' | 'journal' | 'securite'>('utilisateurs');
  const [invite, setInvite] = useState<{ nom: string; courriel: string; role: string } | null>(null), [retrait, setRetrait] = useState<U | null>(null);
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  async function inviter() {
    if (!invite) return; setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('portail_inviter', { p: invite });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setToast(`Invitation envoyée à ${invite.courriel} (valable 14 jours).`); setInvite(null); router.refresh();
  }
  async function annuler(id: string) { const { error } = await supabaseNavigateur().rpc('portail_annuler_invitation', { p_id: id }); if (error) return setBandeau(error.message); setToast('Invitation annulée.'); router.refresh(); }
  async function retirer() {
    if (!retrait?.membre_id) return; setEnvoi(true);
    const { error } = await supabaseNavigateur().rpc('portail_retirer_acces', { p_id: retrait.membre_id });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setToast(`Accès de ${retrait.nom} retiré.`); setRetrait(null); router.refresh();
  }
  if (erreur || !donnees) return <div className="bandeau erreur" role="alert">{erreur ?? 'Les accès n’ont pas pu être lus.'}</div>;
  const U = donnees.utilisateurs, fa = Math.round((100 * U.filter((u) => u.deux_fa).length) / Math.max(1, U.length));
  function csv() {
    const l = [['Date', 'Qui', 'Action', 'Canal', 'Lecture sensible'], ...donnees!.journal.map((j) => [j.le, j.qui, j.quoi, j.canal, j.sensible ? 'oui' : 'non'])].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + l], { type: 'text/csv' })); a.download = 'journal-acces.csv'; a.click();
  }
  return (
    <>
      <div><h1 className="po-titre">Utilisateurs et accès</h1><p className="po-sous" style={{ margin: '4px 0 0' }}>Qui voit vos données; Lease Lane n’accède qu’au périmètre du mandat</p></div>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="po-kpis">
        <div className="carte-l18 kpi-po"><span>Comptes<Icone nom="users" taille={18} couleur="#58697F" /></span><b>{U.length}</b><small>{U.filter((u) => u.actif).length} actifs</small></div>
        <div className="carte-l18 kpi-po"><span>Double authentification<Icone nom="shield" taille={18} couleur="#58697F" /></span><b>{fa} %</b><small>{fa === 100 ? 'aucun compte à configurer' : `${U.filter((u) => !u.deux_fa).length} compte(s) sans 2FA`}</small></div>
        <div className="carte-l18 kpi-po"><span>Accès refusés (30 j)<Icone nom="lock" taille={18} couleur="#58697F" /></span><b>{donnees.refus}</b><small>journalisés et notifiés</small></div>
        <div className="carte-l18 kpi-po"><span>Décisions automatisées<Icone nom="calendar" taille={18} couleur="#58697F" /></span><b>{donnees.decisions.length}</b><small>révisables par une personne</small></div>
      </div>
      <section className="studio-liste" aria-label="Accès">
        <nav className="po-onglets tete-onglets">{([['utilisateurs', `Utilisateurs (${U.length})`], ['roles', 'Rôles et paliers d’accès'], ['journal', 'Journal d’accès'], ['securite', 'Sécurité']] as const).map(([k, l]) => <button key={k} className={onglet === k ? 'actif' : ''} onClick={() => setOnglet(k)}>{l}</button>)}
          <span className="a-faire-actions" style={{ marginLeft: 'auto' }}><button className="bouton bouton-contour po-bouton" onClick={csv}><Icone nom="download" taille={16} couleur="#0C2147" />Journal (CSV)</button>
            <button className="bouton bouton-principal po-bouton" disabled={!donnees.titulaire} title={donnees.titulaire ? '' : 'Réservé au propriétaire titulaire'} onClick={() => setInvite({ nom: '', courriel: '', role: 'coproprietaire' })}><Icone nom="plus" taille={16} couleur="#fff" />Inviter une personne</button></span></nav>
        {onglet === 'utilisateurs' && <table className="tableau po-acces"><colgroup><col style={{ width: '27%' }} /><col style={{ width: '24%' }} /><col style={{ width: '10%' }} /><col style={{ width: '13%' }} /><col style={{ width: '17%' }} /><col /></colgroup><thead><tr><th>Utilisateur</th><th>Rôle · portée</th><th>2FA</th><th>Statut</th><th>Dernière connexion</th><th /></tr></thead>
          <tbody>{U.map((u) => <tr key={u.courriel}><td><span className="cellule-ini"><span className="ini" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(u.nom)}</span><span><strong className="fort">{u.nom}{u.vous ? ' (vous)' : ''}</strong><span className="sous gris">{u.courriel}</span></span></span></td>
            <td><span className="cellule-doc"><span className={`puce ${u.vous ? '' : 'neutral'}`} style={{ justifySelf: 'start' }}>{u.role}</span><span className="gris">{u.portee}</span></span></td>
            <td>{u.deux_fa ? <span className="ligne-ic"><span className="okdot" style={{ marginTop: 0 }}><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>Active</span> : <span className="rouge fort">À activer</span>}</td>
            <td>{u.actif ? 'Actif' : 'Inactif'}</td><td>{quand(u.derniere)}</td>
            <td className="droite">{u.membre_id && donnees.titulaire && <span className="po-actions"><button aria-label={`Retirer l’accès de ${u.nom}`} title="Retirer l’accès" onClick={() => setRetrait(u)}><Icone nom="close" taille={18} couleur="#0C2147" /></button></span>}</td></tr>)}
            {donnees.invitations.map((i) => <tr key={i.id}><td><span className="cellule-ini"><span className="ini clair" style={{ width: 36, height: 36, fontSize: 12 }}>{initiales(i.nom)}</span><span><strong className="fort">{i.nom}</strong><span className="sous gris">{i.courriel}</span></span></span></td>
              <td><span className="cellule-doc"><span className="puce neutral" style={{ justifySelf: 'start' }}>{i.role === 'comptable' ? 'Comptabilité (lecture)' : 'Copropriétaire'}</span><span className="gris">{i.role === 'comptable' ? 'Finance et relevés' : 'Tous vos immeubles'}</span></span></td>
              <td className="gris">—</td><td><span className="puce action">Invitation envoyée</span></td><td className="gris">expire le {jourQc(i.expire)}</td>
              <td className="droite">{donnees.titulaire && <button className="lien" onClick={() => annuler(i.id)}>Annuler</button>}</td></tr>)}</tbody></table>}
        {onglet === 'roles' && <table className="tableau"><thead><tr><th>Rôle</th><th>Voit</th><th>Peut faire</th></tr></thead><tbody>
          {[['Propriétaire (titulaire)', 'Tout votre espace', 'Approuver les dépenses, écrire à l’équipe, déposer des documents, inviter et retirer des personnes'],
            ['Copropriétaire', 'Tous vos immeubles', 'Comme le titulaire, sauf inviter ou retirer des personnes et modifier le profil du compte'],
            ['Comptabilité (lecture)', 'Finance, relevés, documents', 'Consulter et exporter; aucune décision, aucun message'],
            ['Équipe Lease Lane', 'Périmètre du mandat de gestion', 'Gérer selon le mandat; chaque consultation sensible est journalisée']].map(([r, v, f]) =>
            <tr key={r}><td className="fort">{r}</td><td>{v}</td><td>{f}</td></tr>)}</tbody></table>}
        {onglet === 'journal' && <ul className="planifier po-liste-simple">{donnees.journal.map((j, i) => <li key={i}><div><strong>{j.qui}</strong><span>{j.quoi}</span></div><span className="gris texte-13">{quand(j.le)}</span><span className={`puce ${j.sensible ? 'neutral' : ''}`}>{j.sensible ? 'Lecture sensible' : 'OK'}</span></li>)}
          {!donnees.journal.length && <li className="gris">Aucun accès depuis 90 jours.</li>}</ul>}
        {onglet === 'securite' && <ul className="garde-fous" style={{ padding: 24 }}>{['Double authentification obligatoire pour les propriétaires', 'Chaque consultation d’une fiche locataire est inscrite au journal (Loi 25)', 'Les données sont chiffrées au repos; les fichiers s’ouvrent par un lien valable 10 minutes', 'Lease Lane n’accède qu’au périmètre de votre mandat de gestion'].map((t) =>
          <li key={t}><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>{t}</li>)}</ul>}
      </section>
      {invite && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setInvite(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="inv-t" style={{ marginTop: 120 }} onSubmit={(e) => { e.preventDefault(); inviter(); }}>
          <div className="fenetre-tete"><h2 id="inv-t">Inviter une personne</h2><button type="button" className="fermer" onClick={() => setInvite(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-texte">Elle reçoit un code personnel par courriel (valable 14 jours, avec cette adresse seulement) et activera la double authentification.</p>
          <label className="fenetre-lib" htmlFor="inv-n">Nom</label><input id="inv-n" className="e70-raison" value={invite.nom} onChange={(e) => setInvite({ ...invite, nom: e.target.value })} />
          <label className="fenetre-lib" htmlFor="inv-c">Courriel</label><input id="inv-c" type="email" className="e70-raison" value={invite.courriel} onChange={(e) => setInvite({ ...invite, courriel: e.target.value })} />
          <label className="fenetre-lib" htmlFor="inv-r">Rôle</label><select id="inv-r" className="e70-raison" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
            <option value="coproprietaire">Copropriétaire · tous vos immeubles</option><option value="comptable">Comptabilité · lecture seulement (finance et relevés)</option></select>
          <div className="fenetre-actions"><button type="button" className="bouton bouton-contour" onClick={() => setInvite(null)}>Annuler</button>
            <button className="bouton bouton-principal" disabled={envoi || invite.nom.trim().length < 2 || !invite.courriel.includes('@')}>{envoi ? 'Envoi…' : 'Envoyer l’invitation'}</button></div>
        </form></div>}
      {retrait && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setRetrait(null)}>
        <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ret-t" style={{ marginTop: 160, width: 'min(520px, 100%)' }}>
          <div className="fenetre-tete"><h2 id="ret-t">Retirer l’accès de {retrait.nom} ?</h2><button className="fermer" onClick={() => setRetrait(null)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
          <p className="fenetre-texte">{retrait.nom} ne verra plus votre espace dès maintenant. Son historique reste au journal des accès. Vous pourrez l’inviter de nouveau.</p>
          <div className="fenetre-actions"><button className="bouton bouton-contour" onClick={() => setRetrait(null)}>Annuler</button><button className="bouton bouton-principal" disabled={envoi} onClick={retirer}>Retirer l’accès</button></div>
        </div></div>}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
      <section className="carte-l18" aria-label="Décisions automatisées">
        <h2 className="titre-carte" style={{ margin: 0 }}>Décisions automatisées récentes</h2><p className="gris texte-13" style={{ margin: '4px 0 12px' }}>Chacune peut être révisée par une personne : demandez-le depuis le dossier.</p>
        <ul className="planifier">{donnees.decisions.map((d, i) => <li key={i}><div><strong>{d.resume}</strong><span>{quand(d.le)}</span></div><span className="puce neutral">{d.issue ? `Révisée · ${d.issue}` : d.revision ? 'Révision demandée' : 'Système'}</span></li>)}
          {!donnees.decisions.length && <li className="gris">Aucune décision automatisée.</li>}</ul>
      </section>
    </>
  );
}
