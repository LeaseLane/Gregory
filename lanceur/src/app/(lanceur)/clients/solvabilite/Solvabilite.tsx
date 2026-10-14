'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { initiales } from '@/lib/ventes';
import { resumePaiements, type Rapport } from '@partage/solvabilite';

type Enquete = { id: string; nom: string; logement: string | null; motif: string; statut: string; resultat: string | null; avis: string | null; cote: number | null; cout: number | null;
  consentement: string | null; consentement_expire: string | null; moyen: string | null; demande: string | null; simule: boolean; recu: string | null; purge: boolean;
  verifs: { consentement: boolean; donnees: boolean; aucune_autre: boolean } | null };
export type DonneesSolva = { enquetes: Enquete[]; budget: { mensuel: number; cout_unitaire: number; fournisseur: string; conservation_mois: number; paye: number; payees: number }; peut_enqueter: boolean };
type Lu = { nom: string; resultat: string | null; rapport: Rapport | null; recu: string | null; expire: string | null; purge: string | null; fournisseur: string | null; simule: boolean };

const COTES = ['Faible', 'Passable', 'Bonne', 'Très bonne', 'Excellente'];
const MOTIFS: Record<string, string> = { candidature: 'Candidature', cession: 'Cession', sous_location: 'Sous-location' };
const AVIS: Record<string, string> = { favorable: 'favorable', reserve: 'avec réserve', defavorable: 'défavorable' };
const d = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
const argent = (n: number) => `${n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ /g, ' ')} $`;
const MOIS = new Date().toLocaleDateString('fr-CA', { month: 'long' });

function statut(e: Enquete, fournisseur: string): [string, string] {
  if (e.statut === 'done') return e.resultat === 'ok' ? [`Terminée · ${e.cote ? COTES[e.cote - 1].toLowerCase() : 'reçue'}`, 'neutral'] : e.resultat === 'empty' ? ['Terminée · dossier vide', 'neutral']
    : e.resultat === 'error' ? ['Erreur du fournisseur', 'todo'] : ['Fournisseur non branché', 'inactive'];
  return ({ consent_pending: ['En attente', 'neutral'], to_approve: ['À approuver', 'action'], running: [`En cours chez ${fournisseur}`, 'neutral'],
    refused: ['Refusée par la personne', 'neutral'], cancelled: ['Annulée', 'neutral'] } as Record<string, [string, string]>)[e.statut] ?? [e.statut, 'neutral'];
}

export function Solvabilite({ donnees, erreurLecture }: { donnees: DonneesSolva | null; erreurLecture: string | null }) {
  const router = useRouter();
  const E = donnees?.enquetes ?? [];
  const [sel, setSel] = useState<string | null>(E.find((e) => e.resultat === 'ok')?.id ?? E[0]?.id ?? null);
  const [lu, setLu] = useState<Lu | null>(null), [lecture, setLecture] = useState(false);
  const [confirmer, setConfirmer] = useState(false), [envoi, setEnvoi] = useState(false), [preuve, setPreuve] = useState('');
  const [bandeau, setBandeau] = useState<string | null>(null), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  if (erreurLecture || !donnees) return <div className="bandeau erreur" role="alert">{erreurLecture}</div>;
  const B = donnees.budget, choisie = E.find((e) => e.id === sel) ?? null;
  const aApprouver = choisie && ['to_approve', 'consent_pending'].includes(choisie.statut) ? choisie : E.find((e) => e.statut === 'to_approve') ?? null;

  // Lecture sensible : seulement à la demande, et inscrite au journal par la base.
  async function lire(id: string) {
    setLecture(true); setBandeau(null);
    const { data, error } = await supabaseNavigateur().rpc('lanceur_rapport_enquete', { p_id: id });
    setLecture(false); if (error) { setBandeau(error.message); return; } setLu(data as Lu);
  }
  async function rpc(nom: string, args: Record<string, unknown>, ok: string) {
    setEnvoi(true); setBandeau(null); const { error } = await supabaseNavigateur().rpc(nom, args); setEnvoi(false);
    if (error) { setBandeau(error.message); return; } setToast(ok); router.refresh();
  }
  async function payer(id: string) {
    setEnvoi(true); setBandeau(null);
    const r = await fetch('/api/solvabilite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) });
    const j = await r.json().catch(() => ({})); setEnvoi(false); setConfirmer(false);
    if (!r.ok) { setBandeau(j.error ?? 'L’enquête n’a pas pu partir.'); return; }
    const res = j.enquetes?.[0]?.result;
    setToast(res === 'ok' ? `Rapport reçu${j.simule ? ' (simulateur)' : ''}.` : res === 'unconfigured' ? 'Fournisseur non branché : aucune enquête faite, aucuns frais.' : res === 'empty' ? 'Dossier vide chez le fournisseur.' : 'Erreur du fournisseur : aucuns frais.');
    setSel(id); setLu(null); router.refresh();
  }
  const apres = B.paye + B.cout_unitaire;

  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="studio">
        <div className="colonne-l18">
          <section className="studio-liste" aria-label="Enquêtes de solvabilité">
            <header className="carte-tete"><h2>Enquêtes de solvabilité</h2><p>{B.fournisseur} · toujours avec le consentement écrit de la personne</p></header>
            <table className="tableau">
              <colgroup><col style={{ width: '29%' }} /><col style={{ width: '13%' }} /><col style={{ width: '18%' }} /><col style={{ width: '12%' }} /><col /></colgroup>
              <thead><tr><th>Personne</th><th>Motif</th><th>Consentement</th><th className="droite" style={{ paddingRight: 32 }}>Coût</th><th>Statut</th></tr></thead>
              <tbody>{E.map((e) => { const [t, k] = statut(e, B.fournisseur); return (
                <tr key={e.id} className={e.id === sel ? 'sel' : ''} onClick={() => { setSel(e.id); setLu(null); }}>
                  <td><span className="cellule-ini"><span className="ini" style={{ width: 32, height: 32, fontSize: 12 }}>{initiales(e.nom)}</span><span><strong className="fort">{e.nom}</strong><span className="sous gris">{e.logement ?? '—'}</span></span></span></td>
                  <td>{MOTIFS[e.motif] ?? e.motif}</td>
                  <td>{e.consentement ? <span className="pastille-c"><i className="point ok" />reçu le {d(e.consentement)}</span> : e.statut === 'refused' ? <span className="gris">refusé</span>
                    : <span className="pastille-c"><i className="point" />{e.demande ? `demandé le ${d(e.demande)}` : 'à demander'}</span>}</td>
                  <td className="droite" style={{ paddingRight: 32 }}>{e.cout != null && e.cout > 0 ? argent(e.cout) : e.statut === 'to_approve' ? argent(B.cout_unitaire) : <span className="gris">—</span>}</td>
                  <td><span className={`puce ${k}`}>{t}</span></td></tr>); })}
                {!E.length && <tr><td colSpan={5} className="gris">Aucune enquête. Elles se demandent depuis l’emménagement d’un locataire (Processus).</td></tr>}</tbody>
            </table>
          </section>

          <section className="carte-l18" aria-label="Rapport">
            {!choisie || choisie.resultat !== 'ok' ? <p className="gris" style={{ margin: 0 }}>{choisie ? `Aucun rapport pour ${choisie.nom} : ${statut(choisie, B.fournisseur)[0].toLowerCase()}.` : 'Choisissez une enquête.'}</p>
              : !lu ? <div className="rapport-ferme"><div><h2>Rapport de {choisie.nom}{choisie.avis ? ` : ${AVIS[choisie.avis]}` : ''}</h2><p className="gris">Chaque consultation est inscrite au journal (Loi 25).</p></div>
                  <button className="bouton bouton-contour" disabled={lecture || choisie.purge} onClick={() => lire(choisie.id)}>{choisie.purge ? 'Rapport supprimé' : 'Afficher le rapport'}</button></div>
              : lu.rapport ? <Rapport lu={lu} conservation={B.conservation_mois} /> : <p className="gris" style={{ margin: 0 }}>Rapport supprimé (conservation de {B.conservation_mois} mois).</p>}
          </section>
        </div>

        <div className="colonne-l18">
          <section className="carte-l18 e2" aria-label="Enquête à approuver">
            <header className="carte-tete sans-marge"><h2>Enquête à approuver</h2><p>{aApprouver ? `${aApprouver.nom}${aApprouver.logement ? ` · ${aApprouver.logement}` : ''}` : 'Aucune pour le moment'}</p></header>
            {aApprouver?.statut === 'to_approve' && aApprouver.verifs && <>
              <ul className="garde-fous">
                <Verif ok={aApprouver.verifs.consentement}>Vérifier : consentement reçu le {d(aApprouver.consentement!)}{aApprouver.moyen === 'ecrit' ? ' (écrit)' : ''}</Verif>
                <Verif ok={aApprouver.verifs.donnees}>Vérifier : courriel et logement présents</Verif>
                <Verif ok={aApprouver.verifs.aucune_autre}>Vérifier : aucune autre enquête en cours</Verif>
                <li className="fort"><i className="vide-c actuel" />Approuver : vous</li>
                <li className="gris"><i className="vide-c" />Payer {argent(B.cout_unitaire)} à {B.fournisseur}, puis recevoir le rapport</li></ul>
              <p className="gris" style={{ fontSize: 12, margin: '16px 0' }}>Rien n’est payé sans l’accord d’une personne.</p>
              {donnees.peut_enqueter && <div className="studio-actions sans-marge" style={{ gridTemplateColumns: '1fr auto' }}>
                <button className="bouton bouton-principal" disabled={envoi || !Object.values(aApprouver.verifs).every(Boolean)} onClick={() => setConfirmer(true)}>Approuver et payer {argent(B.cout_unitaire)}</button>
                <button className="bouton bouton-contour" disabled={envoi} onClick={() => rpc('lanceur_refuser_enquete', { p_id: aApprouver.id }, 'Enquête refusée : elle ne part pas.')}>Refuser</button></div>}
            </>}
            {aApprouver?.statut === 'consent_pending' && <>
              <p className="fenetre-texte" style={{ marginBottom: 12 }}>Consentement demandé{aApprouver.demande ? ` le ${d(aApprouver.demande)}` : ''} (LOC-14). L’enquête attend la réponse de la personne.</p>
              {donnees.peut_enqueter && <>
                <label className="fenetre-lib" htmlFor="pv">Consentement écrit reçu autrement<span>preuve</span></label>
                <div className="ligne-champ"><input id="pv" className="e70-raison" value={preuve} onChange={(e) => setPreuve(e.target.value)} placeholder="Ex. : formulaire signé du 12 oct." />
                  <button className="bouton bouton-contour" disabled={envoi || !preuve.trim()} onClick={() => rpc('lanceur_consigner_consentement', { p_id: aApprouver.id, p_preuve: preuve }, 'Consentement consigné.')}>Consigner</button></div>
                <button className="lien" style={{ marginTop: 12 }} disabled={envoi} onClick={() => rpc('lanceur_refuser_enquete', { p_id: aApprouver.id }, 'Demande annulée.')}>Annuler la demande</button></>}
            </>}
          </section>
          <section className="carte-l18" aria-label="Budget des enquêtes">
            <header className="carte-tete sans-marge"><h2>Budget des enquêtes</h2><p>{MOIS.charAt(0).toUpperCase() + MOIS.slice(1)} · {B.payees} enquête{B.payees > 1 ? 's' : ''} payée{B.payees > 1 ? 's' : ''}</p></header>
            <p className="montant-budget"><b>{argent(B.paye)}</b> sur {argent(B.mensuel).replace(',00', '')}</p>
            <span className="jauge large"><i style={{ width: `${Math.min(100, (100 * B.paye) / B.mensuel)}%` }} /></span>
          </section>
          <section className="carte-l18" aria-label="Conservation des rapports">
            <h2 className="titre-carte">Conservation des rapports</h2>
            <p className="ligne-ic"><Icone nom="shield" taille={18} couleur="#2E5788" />Supprimés après {B.conservation_mois} mois · chaque consultation est inscrite au journal (Loi 25).</p>
          </section>
        </div>
      </div>

      {confirmer && aApprouver && (
        <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !envoi && setConfirmer(false)}>
          <div className="fenetre" role="dialog" aria-modal="true" aria-labelledby="e25-t" style={{ marginTop: 160, width: 'min(480px, 100%)' }}>
            <div className="fenetre-tete"><h2 id="e25-t">Approuver et payer l’enquête de {aApprouver.nom}?</h2><button className="fermer" onClick={() => setConfirmer(false)} aria-label="Fermer"><Icone nom="close" taille={16} couleur="#3E4A59" trait={2} /></button></div>
            <p className="fenetre-texte" style={{ marginBottom: 20 }}>{argent(B.cout_unitaire)} seront facturés par {B.fournisseur} au compte de Lease Lane. Le rapport arrive en moins de 2 minutes.</p>
            <div className="details-e25">
              <div><span>Consentement</span><b className="ok"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>reçu le {d(aApprouver.consentement!)}</b></div>
              <div><span>Données</span><b className="ok"><span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span>courriel et logement</b></div>
              <div><span>Coût</span><b>{argent(B.cout_unitaire)}</b></div>
              <div><span>Budget après paiement</span><b>{argent(apres)} sur {argent(B.mensuel).replace(',00', '')}</b></div>
              <span className="jauge large"><i style={{ width: `${Math.min(100, (100 * apres) / B.mensuel)}%` }} /></span>
            </div>
            <div className="fenetre-actions"><button className="bouton bouton-principal" disabled={envoi} onClick={() => payer(aApprouver.id)}>{envoi ? 'Enquête en cours…' : `Approuver et payer ${argent(B.cout_unitaire)}`}</button>
              <button className="bouton bouton-contour" disabled={envoi} onClick={() => setConfirmer(false)}>Annuler</button></div>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}

function Verif({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <li>{ok ? <span className="okdot"><Icone nom="check" taille={11} couleur="#fff" trait={2.4} /></span> : <span className="okdot non"><Icone nom="close" taille={10} couleur="#fff" trait={2.4} /></span>}{children}</li>;
}

// Rapport : cote (5 bandes), loyer sur revenu (seuil 33 %), 12 mois de paiements (le retard en accent), recommandation.
function Rapport({ lu, conservation }: { lu: Lu; conservation: number }) {
  const r = lu.rapport!;
  return (
    <div className="rapport">
      <header><h2>Rapport de {lu.nom} : {AVIS[r.avis]}</h2><span className="gris">Reçu le {d(lu.recu!)} · conservé {conservation} mois{lu.simule ? ' · simulateur' : ''}</span></header>
      <div className="rapport-cols">
        <div>
          <p className="surtitre gris">Cote de crédit</p>
          <ol className="bandes5">{COTES.map((c, i) => <li key={c} className={i === r.cote - 1 ? 'choisi' : ''}>{c}</li>)}</ol>
          <p className="surtitre gris" style={{ marginTop: 28 }}>Loyer sur revenu</p>
          <div className="seuil"><span className="piste"><i style={{ width: `${Math.min(100, r.ratio * 2)}%` }} className={r.ratio > 33 ? 'au-dessus' : ''} /><b style={{ left: '66%' }} title="seuil de 33 %" /></span><strong>{Math.round(r.ratio)} %</strong></div>
          <span className="gris" style={{ fontSize: 12 }}>seuil de 33 %</span>
        </div>
        <div>
          <p className="surtitre gris">Paiements des 12 derniers mois</p>
          <ol className="mois12">{r.paiements.map((j, i) => <li key={i} className={j ? 'retard' : ''} title={j ? `En retard de ${j} jours` : 'Payé à temps'}><Icone nom={j ? 'alert' : 'check'} taille={14} couleur={j ? '#fff' : '#58697F'} trait={2} /></li>)}</ol>
          <p className="texte-13">{resumePaiements(r.paiements)}</p>
          <p className="surtitre gris" style={{ marginTop: 28 }}>Recommandation de Cléo</p>
          <p className="ligne-ic"><img src="/img/cleo.png" alt="" className="avatar-cleo" />{r.recommandation}</p>
        </div>
      </div>
    </div>
  );
}
