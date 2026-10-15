'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { argent, dateCourte } from '@/composants/portail/format';

/* Propriétaire · Proposer un locataire (CONCORDANCE 2.12, écran N) : vous proposez, l'équipe valide (vérifications, solvabilité avec le
   consentement du candidat, LOC-14), puis bail eZsign et invitation LOC-01. Vous voyez le résultat et la raison, jamais la synthèse de solvabilité. */
type Prop = { id: string; candidat: string; logement: string; statut: string; raison: string | null; recue: string; decidee: string | null; date: string | null };
export type DonneesPropositions = { propositions: Prop[]; logements: { id: string; libelle: string; statut: string; loyer: number | null }[] };
const STATUTS: Record<string, [string, string]> = { proposee: ['Reçue par l’équipe', 'neutral'], verification: ['Vérifications en cours', 'info'], acceptee: ['Validée', 'ok'], refusee: ['Non retenue', 'todo'], retiree: ['Retirée', 'neutral'] };
const ETAPES = ['Vous proposez un candidat', 'L’équipe vérifie le dossier et les références', 'Le candidat consent à l’enquête de crédit (courriel LOC-14)', 'L’équipe décide et vous en donne la raison', 'Bail signé en ligne, puis invitation au portail locataire'];

export function Proposer({ donnees: D, choisie, logement, erreur }: { donnees: DonneesPropositions | null; choisie: string | null; logement: string | null; erreur: string | null }) {
  const router = useRouter();
  const [f, setF] = useState({ unit_id: logement ?? D?.logements[0]?.id ?? '', nom: '', courriel: '', telephone: '', date: '', note: '', consentement: false });
  const [envoi, setEnvoi] = useState(false), [bandeau, setBandeau] = useState<string | null>(erreur), [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t); }, [toast]);
  if (!D) return <div className="bandeau erreur" role="alert">{erreur ?? 'Les propositions n’ont pas pu être lues.'}</div>;
  const pret = f.unit_id && f.nom.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.courriel.trim()) && f.consentement;
  async function proposer() {
    setEnvoi(true); setBandeau(null);
    const { error } = await supabaseNavigateur().rpc('portail_proposer_locataire', { p: { ...f, date: f.date || undefined } });
    setEnvoi(false); if (error) return setBandeau(error.message);
    setToast(`${f.nom} est proposé : l’équipe vous tient au courant ici et dans la cloche.`); setF({ ...f, nom: '', courriel: '', telephone: '', date: '', note: '', consentement: false }); router.refresh();
  }

  return (
    <>
      <div><Link className="lien po-retour" href="/proprietaire/locataires"><Icone nom="arrow" taille={14} couleur="#2E5788" />Locataires</Link><h1 className="po-titre">Proposer un locataire</h1>
        <p className="po-sous" style={{ margin: '4px 0 0' }}>Vous proposez; l’équipe Lease Lane valide avant le bail</p></div>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      <div className="po-fiche inverse">
        <form className="carte-l18 e2" aria-label="Candidat" onSubmit={(e) => { e.preventDefault(); proposer(); }}>
          <h2 className="titre-carte">Candidat</h2>
          {!D.logements.length ? <p className="gris texte-13">Aucun logement libre ou bientôt libre : vous pourrez proposer un locataire dès qu’un logement se libère.</p> : <>
            <label className="fenetre-lib" htmlFor="pr-u">Logement</label>
            <select id="pr-u" className="e70-raison" value={f.unit_id} onChange={(e) => setF({ ...f, unit_id: e.target.value })}>{D.logements.map((l) =>
              <option key={l.id} value={l.id}>{l.libelle.replace(/, Québec(?= —)/, '')}{l.loyer ? ` · ${argent(l.loyer)}` : ''}{l.statut === 'soon_available' ? ' · bientôt libre' : ''}</option>)}</select>
            <div className="po-deux">
              <div><label className="fenetre-lib" htmlFor="pr-n">Nom du candidat</label><input id="pr-n" className="e70-raison" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} maxLength={120} /></div>
              <div><label className="fenetre-lib" htmlFor="pr-c">Courriel</label><input id="pr-c" type="email" className="e70-raison" value={f.courriel} onChange={(e) => setF({ ...f, courriel: e.target.value })} placeholder="Pour son consentement à l’enquête" /></div>
              <div><label className="fenetre-lib" htmlFor="pr-t">Téléphone <span>facultatif</span></label><input id="pr-t" type="tel" className="e70-raison" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} /></div>
              <div><label className="fenetre-lib" htmlFor="pr-d">Emménagement souhaité <span>facultatif</span></label><input id="pr-d" type="date" className="e70-raison" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            </div>
            <label className="fenetre-lib" htmlFor="pr-o">Note pour l’équipe <span>facultatif</span></label>
            <textarea id="pr-o" className="e70-raison po-note-champ" rows={3} maxLength={1000} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Ex. : référé par un locataire actuel, souhaite un bail de 12 mois" />
            <label className="case"><input type="checkbox" checked={f.consentement} onChange={(e) => setF({ ...f, consentement: e.target.checked })} />Le candidat accepte d’être contacté par Lease Lane. Il recevra lui-même la demande de consentement à l’enquête de crédit.</label>
            <div className="a-faire-actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="bouton bouton-principal po-bouton" disabled={!pret || envoi}><Icone nom="send" taille={16} couleur="#fff" />{envoi ? 'Envoi…' : 'Proposer ce candidat'}</button></div>
          </>}
        </form>
        <section className="carte-l18" aria-label="Comment ça marche"><h2 className="titre-carte">Comment ça marche</h2>
          <ol className="po-etapes-prop">{ETAPES.map((e, i) => <li key={e}><b>{i + 1}</b>{e}</li>)}</ol>
          <p className="po-note"><Icone nom="lock" taille={14} couleur="#3E4A59" />Le rapport de crédit reste confidentiel (Loi 25) : vous voyez la décision et sa raison, jamais le rapport.</p></section>
      </div>
      <section className="studio-liste" aria-label="Vos propositions">
        <h2 className="titre-carte" style={{ padding: '24px 24px 0', margin: 0 }}>Vos propositions</h2>
        <table className="tableau"><thead><tr><th>Candidat</th><th>Logement</th><th>Proposé le</th><th>État</th><th>Raison</th></tr></thead>
          <tbody>{D.propositions.map((p) => { const [l, ton] = STATUTS[p.statut] ?? [p.statut, 'neutral'];
            return <tr key={p.id} className={choisie === p.id ? 'sel' : ''}><td className="fort">{p.candidat}</td><td>{p.logement.replace(/, Québec(?= —)/, '')}</td><td>{dateCourte(p.recue, true)}</td>
              <td><span className={`puce ${ton}`}>{l}</span></td><td className="texte-13">{p.raison ?? (p.statut === 'proposee' || p.statut === 'verification' ? <span className="gris">Réponse habituelle sous 2 jours ouvrables</span> : '—')}</td></tr>; })}
            {!D.propositions.length && <tr><td colSpan={5} className="gris">Aucune proposition pour l’instant.</td></tr>}</tbody></table>
      </section>
      {toast && <div className="toast" role="status"><Icone nom="check" taille={18} couleur="#fff" />{toast}</div>}
    </>
  );
}
