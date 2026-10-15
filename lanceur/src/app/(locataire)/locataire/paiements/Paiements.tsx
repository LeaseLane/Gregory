'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BandeauLocataire } from '@/composants/portail/CoquilleLocataire';
import { ouvrirFichier } from '@/composants/portail/fichiers';
import { argent, dateCourte, dateLongue, moisAnnee } from '@/composants/portail/format';

/* Locataire · 08 Paiements, 09 Reçu de loyer (art. 1568 C.c.Q.), 10 Changer de mode de paiement. Les loyers sont déposés directement
   chez le propriétaire (décision du 13 oct.). Carte de crédit : hors lancement, non offerte. États « en retard » et « prélèvement
   refusé » sans blâme, avec la marche à suivre (CONCORDANCE 2.10, 2.14). */
export type PaiementsLoc = { prochain: { echeance: string; montant: number; en_retard: boolean; jours: number; echec: boolean } | null; annee: { paye: number; loyers: number; prevus: number };
  retards: number; en_retard: number; historique: { id: string; periode: string; recu_le: string | null; mode: string | null; montant: number; statut: string }[];
  mode: { type: string; depuis?: string; compte?: string | null }; interac: string | null; reference: string | null; releve31: { id: string; annee: number } | null };
export type RL31 = { id: string; annee: number; code: string; remis_le: string; donnees: { numero_logement: string; logement: { adresse: string; ville: string | null; code_postal: string | null };
  locateur: { nom: string; adresse: string | null }; mandataire: { nom: string; neq: string | null } | null; occupant: { nom: string }; motif_correction?: string } };
export type Recu = { numero: string; emis_le: string; periode: string; montant: number; mode: string; emetteur: { nom: string; pour: string; neq: string | null; adresse: string | null };
  locataire: { nom: string; logement: string; ville: string } };

export function Paiements({ donnees: D, recu, rl31, erreurRecu, mode, maintenant, erreur }: { donnees: PaiementsLoc | null; recu: Recu | null; rl31: RL31 | null; erreurRecu: string | null; mode: boolean; maintenant: string; erreur: string | null }) {
  const router = useRouter();
  const [fenetreMode, setFenetreMode] = useState(mode), [toast, setToast] = useState<string | null>(null), [bandeau, setBandeau] = useState<string | null>(erreurRecu);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  if (erreur || !D) return <><BandeauLocataire titre="Paiements" /><div className="bandeau erreur" role="alert">{erreur ?? 'Vos paiements n’ont pas pu être lus.'}</div></>;
  const annee = new Date(maintenant).getFullYear(), P = D.prochain, pad = D.mode.type === 'prelevement';
  async function demanderMode(m: string) {
    const { error } = await supabaseNavigateur().rpc('portail_locataire_mode_paiement', { p: { mode: m } });
    if (error) return setBandeau(error.message);
    setFenetreMode(false); setToast('Demande transmise : l’équipe vous écrit pour finaliser le changement.');
  }
  const fermerRecu = () => router.replace('/locataire/paiements', { scroll: false });

  return (
    <>
      <BandeauLocataire titre="Paiements" sous="Loyers reçus et reçus de loyer" />
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="lo-grille trois lo-remonte">
        <section className="carte-l18 e2 lo-kpi" aria-label="Prochain loyer">
          {P?.en_retard ? <><span className="texte-13 fort">{P.echec ? 'Prélèvement refusé' : 'Loyer en retard'}</span><b className="rouge">{argent(P.montant)}</b>
              <small>{P.echec ? `Le prélèvement du ${dateCourte(P.echeance)} n’a pas abouti. Un nouvel essai est prévu; vous pouvez aussi payer par virement Interac.` : `dû depuis le ${dateCourte(P.echeance)} (${P.jours} jour${P.jours > 1 ? 's' : ''}) · payable au propriétaire`}</small>
              <Link className="lien ligne-ic" href="/locataire/messages?nouveau=1&sujet=Entente%20de%20paiement">Proposer une entente de paiement<Icone nom="arrow" taille={16} couleur="#2E5788" /></Link></>
            : <><span className="texte-13 fort">{pad ? 'Prochain prélèvement' : 'Prochain loyer'}</span><b>{P ? dateCourte(P.echeance, true) : '—'}</b>
              <small>{P ? `${argent(P.montant)}${pad ? ` · ${D.mode.compte ? `compte ${D.mode.compte.replace(/^.*?(·+ ?\d+)$/, '$1')}` : 'prélèvement automatique'}` : ' · à payer au propriétaire'}` : 'Aucun loyer à venir'}</small>
              <button className="lien ligne-ic" onClick={() => setFenetreMode(true)}>Changer de mode de paiement<Icone nom="arrow" taille={16} couleur="#2E5788" /></button></>}
        </section>
        <section className="carte-l18 e2 lo-kpi" aria-label={`Payé en ${annee}`}><span className="texte-13 fort">Payé en {annee}</span><b>{argent(D.annee.paye)}</b>
          <small>{D.annee.loyers} loyer{D.annee.loyers > 1 ? 's' : ''} sur 12{D.annee.loyers === D.annee.prevus ? ' · tous reçus' : ''}</small><span className="jauge large"><i style={{ width: `${Math.min(100, (100 * D.annee.loyers) / 12)}%` }} /></span></section>
        <section className="carte-l18 e2 lo-kpi" aria-label="Retards"><header className="tete-action"><span className="texte-13 fort">Retards</span><span className={`puce ${D.en_retard > 0 ? 'todo' : 'ok'}`}>{D.en_retard > 0 ? 'En retard' : 'À jour'}</span></header>
          <b>{D.retards}</b><small>depuis le début du bail</small></section>
      </div>

      <div className="lo-grille">
        <section className="carte-l18" aria-label="Historique">
          <header className="tete-action"><div><h2 className="titre-carte" style={{ margin: 0 }}>Historique</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>Chaque loyer, daté et reçu</p></div>
            <button className="bouton bouton-contour" onClick={() => window.print()}><Icone nom="download" taille={16} couleur="#0C2147" />Relevé annuel</button></header>
          <table className="tableau lo-histo"><colgroup><col style={{ width: '20%' }} /><col style={{ width: '18%' }} /><col style={{ width: '14%' }} /><col style={{ width: '16%' }} /><col style={{ width: '18%' }} /><col /></colgroup><thead><tr><th>Période</th><th>Réception</th><th>Mode</th><th className="droite">Montant</th><th>État</th><th /></tr></thead>
            <tbody>{D.historique.map((p) => <tr key={p.id}><td className="fort">{moisAnnee(p.periode)}</td><td>{p.recu_le ? `Reçu le ${dateCourte(p.recu_le)}` : '—'}</td><td>{p.mode ?? '—'}</td>
              <td className="droite fort">{argent(p.montant, true)}</td>
              <td>{p.statut === 'paye' ? <span className="ligne-ic"><span className="okdot" style={{ marginTop: 0 }}><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>Payé</span> : p.statut === 'retard' ? <span className="puce todo">En retard</span> : <span className="puce neutral">À venir</span>}</td>
              <td className="droite">{p.statut === 'paye' && <Link className="lien ligne-ic" scroll={false} href={`/locataire/paiements?r=${p.id}`}><Icone nom="receipt" taille={16} couleur="#2E5788" />Reçu</Link>}</td></tr>)}
              {!D.historique.length && <tr><td colSpan={6} className="gris">Aucun loyer pour l’instant.</td></tr>}</tbody></table>
        </section>
        <div className="lo-colonne">
          <section className="carte-l18" aria-label="Mode de paiement">
            <header className="tete-action"><h2 className="titre-carte" style={{ margin: 0 }}>Mode de paiement</h2><button className="lien" onClick={() => setFenetreMode(true)}>Modifier</button></header>
            <div className="lo-mode"><span className="a-faire-ic"><Icone nom={pad ? 'card' : 'send'} taille={18} couleur="#0C2147" /></span>
              <div><strong>{pad ? 'Prélèvement automatique' : 'Virement Interac'}</strong><span className="gris texte-13">{pad ? `${D.mode.compte ? `${D.mode.compte} · ` : ''}le 1er du mois` : D.interac ? `À chaque terme, à ${D.interac}` : 'À chaque terme, au propriétaire'}</span></div></div>
            {!pad && D.reference && <p className="texte-13">Référence à écrire dans le message du virement : <b>{D.reference}</b></p>}
            <p className="gris texte-12">Les loyers sont déposés directement dans le compte du propriétaire. Lease Lane n’a pas accès à vos identifiants bancaires.</p>
          </section>
          <section className="carte-l18" aria-label="Relevé 31"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Relevé 31 — {D.releve31?.annee ?? annee}</h2><p className="gris texte-13" style={{ margin: '0 0 16px' }}>Relevé fiscal annuel</p>
            {D.releve31 ? <Link className="bouton bouton-contour" style={{ width: 'auto', display: 'inline-flex', padding: '0 20px' }} scroll={false} href={`/locataire/paiements?rl31=${D.releve31.id}`}><Icone nom="download" taille={16} couleur="#0C2147" />Voir et télécharger</Link> : <span className="puce neutral">Disponible en février</span>}
            <p className="texte-13">Il vous est remis au plus tard le 28 février, pour votre déclaration de revenus (crédit d’impôt pour solidarité).</p></section>
        </div>
      </div>

      {recu && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermerRecu()}>
        <div className="modale lo-recu" role="dialog" aria-modal="true" aria-labelledby="recu-t">
          <header className="tete-action"><div><h2 id="recu-t" className="ligne-ic" style={{ margin: 0, fontSize: 20 }}>Reçu de loyer <span className="puce ok">Payé</span></h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>{recu.numero} · émis le {dateLongue(recu.emis_le)}</p></div>
            <button className="haut-ibtn non-imprime" onClick={fermerRecu} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="lo-recu-parties"><div><p className="surtitre">Émis par</p><p>{recu.emetteur.nom}<br />{recu.emetteur.pour.replace(/, Québec$/, '')}<br />{[recu.emetteur.neq && `NEQ ${recu.emetteur.neq}`, recu.emetteur.adresse].filter(Boolean).join(' · ')}</p></div>
            <div><p className="surtitre">Reçu de</p><p>{recu.locataire.nom}<br />{recu.locataire.logement.replace(/, Québec(?= —)/, '')}<br />{recu.locataire.ville.replace(/^([^,]+), Québec \(Québec\)/, '$1 (Québec)')}</p></div></div>
          <table className="tableau lo-recu-table"><thead><tr><th>Description</th><th>Période</th><th className="droite">Montant</th></tr></thead>
            <tbody><tr><td>Loyer mensuel</td><td>{moisAnnee(recu.periode)}</td><td className="droite">{argent(recu.montant, true)}</td></tr></tbody>
            <tfoot><tr><td colSpan={2} className="fort">Total payé</td><td className="droite lo-recu-total">{argent(recu.montant, true)}</td></tr></tfoot></table>
          <p className="lo-recu-note">Reçu par {recu.mode} le {dateLongue(recu.emis_le)}. Ce reçu atteste du paiement complet du loyer pour la période indiquée (art. 1568 C.c.Q.). Votre Relevé 31 annuel vous sera remis au plus tard le 28 février.</p>
          <div className="a-faire-actions non-imprime" style={{ justifyContent: 'flex-end' }}><button className="bouton bouton-contour" onClick={() => window.print()}><Icone nom="printer" taille={16} couleur="#0C2147" />Imprimer</button>
            <button className="bouton bouton-principal" onClick={() => window.print()}><Icone nom="download" taille={16} couleur="#fff" />Télécharger le PDF</button></div>
        </div></div>}

      {rl31 && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fermerRecu()}>
        <div className="modale lo-recu" role="dialog" aria-modal="true" aria-labelledby="rl31-t">
          <header className="tete-action"><div><h2 id="rl31-t" style={{ margin: 0, fontSize: 20 }}>Relevé 31 — {rl31.annee}</h2><p className="gris texte-13" style={{ margin: '4px 0 0' }}>Renseignements sur l’occupation d’un logement au 31 décembre {rl31.annee}{rl31.code === 'A' ? ' · relevé modifié' : ''}</p></div>
            <button className="haut-ibtn non-imprime" onClick={fermerRecu} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          <div className="lo-recu-parties"><div><p className="surtitre">Locateur</p><p>{rl31.donnees.locateur.nom}{rl31.donnees.locateur.adresse ? <><br />{rl31.donnees.locateur.adresse}</> : null}
              {rl31.donnees.mandataire?.nom ? <><br /><span className="gris">par {rl31.donnees.mandataire.nom}{rl31.donnees.mandataire.neq ? ` · NEQ ${rl31.donnees.mandataire.neq}` : ''}</span></> : null}</p></div>
            <div><p className="surtitre">Occupant au 31 décembre</p><p>{rl31.donnees.occupant.nom}</p></div></div>
          <table className="tableau lo-recu-table"><tbody>
            <tr><td className="fort">Numéro d’identification du logement</td><td className="droite fort">{rl31.donnees.numero_logement}</td></tr>
            <tr><td className="fort">Adresse du logement</td><td className="droite">{rl31.donnees.logement.adresse.replace(/, Québec(?= —)/, '')}{rl31.donnees.logement.code_postal ? `, ${rl31.donnees.logement.code_postal}` : ''}</td></tr>
            <tr><td className="fort">Remis le</td><td className="droite">{dateLongue(rl31.remis_le)}</td></tr></tbody></table>
          <p className="lo-recu-note">Conservez ce relevé : Revenu Québec le demande pour le crédit d’impôt pour solidarité. Une erreur ? Écrivez à votre gestionnaire; un relevé modifié vous sera remis.</p>
          <div className="a-faire-actions non-imprime" style={{ justifyContent: 'flex-end' }}><button className="bouton bouton-contour" onClick={() => window.print()}><Icone nom="printer" taille={16} couleur="#0C2147" />Imprimer</button>
            <button className="bouton bouton-principal" onClick={() => window.print()}><Icone nom="download" taille={16} couleur="#fff" />Télécharger le PDF</button></div>
        </div></div>}
      {fenetreMode && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setFenetreMode(false)}>
        <div className="modale lo-modes" role="dialog" aria-modal="true" aria-labelledby="mode-t">
          <header className="tete-action"><div><p className="surtitre">Paiements</p><h2 id="mode-t" style={{ margin: 0 }}>Changer de mode de paiement</h2></div>
            <button className="haut-ibtn" onClick={() => setFenetreMode(false)} aria-label="Fermer"><Icone nom="close" taille={20} couleur="#0C2147" /></button></header>
          {([['prelevement', 'card', 'Prélèvement automatique', 'Le 1er du mois, depuis votre compte bancaire'], ['interac', 'send', 'Virement Interac', D.interac ? `À chaque terme, à ${D.interac}` : 'À chaque terme'],
            ['cheque', 'file', 'Chèque à chaque terme', '']] as const).map(([k, ic, t, s]) => { const actuel = (k === 'prelevement') === pad && k !== 'cheque';
            return <button key={k} className={`lo-mode-choix ${actuel ? 'actuel' : ''}`} disabled={actuel} onClick={() => demanderMode(k)}><span className="a-faire-ic"><Icone nom={ic} taille={18} couleur="#0C2147" /></span>
              <div><strong>{t}</strong>{s && <span className="gris texte-13">{s}</span>}</div>{actuel && <span className="puce info">Actuel</span>}</button>; })}
          <p className="bandeau info"><Icone nom="info" taille={16} couleur="#2E5788" />Le prélèvement automatique est optionnel. Vous pouvez y mettre fin en tout temps avec un préavis de 10 jours.</p>
          <div className="a-faire-actions" style={{ justifyContent: 'flex-end' }}><button className="bouton bouton-contour" onClick={() => setFenetreMode(false)}>Fermer</button></div>
        </div></div>}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
