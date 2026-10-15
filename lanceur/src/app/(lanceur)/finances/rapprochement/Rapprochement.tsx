'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/client';
import { Icone } from '@/composants/Icones';
import { BarresClassees } from '@/composants/Graphes';
import { argent, jour } from '../onglets';

/* e42 · Rapprochement : la banque à gauche, la proposition de Cléo au centre (confiance en chiffres), la décision à droite. Sous 95 % de confiance, une personne décide;
   aujourd'hui toutes les décisions passent par une personne. Le relevé arrive par la synchronisation bancaire (Plaid ou Flinks), à rebrancher. */
type Op = { id: string; date: string; montant: number; description: string | null; ref: string | null; proprietaire: string | null; statut: string; confiance: number | null; note: string | null;
  suggestion: { tenant_id: string; locataire: string; paiement: { id: string; montant: number; echeance: string; logement: string } | null } | null; anomalie: string | null };
export type DonneesRapprochement = { operations: Op[]; mois: { total: number; rapprochees: number; regles: number; personnes: number }; comptes: string[]; dernier_import: string | null; peut_ecrire: boolean };
const REGLES: [string, string, boolean][] = [['Prélèvements PAD', 'Montant et date exacts', true], ['Virements Interac', 'Montant exact et nom du payeur', true], ['Factures fournisseurs', 'Montant et numéro de facture', true],
  ['Dépôts de chèques', 'Toujours confirmés par une personne', false]];

export function Rapprochement({ donnees: D, erreurLecture }: { donnees: DonneesRapprochement | null; erreurLecture: string | null }) {
  const router = useRouter();
  const [bandeau, setBandeau] = useState<string | null>(erreurLecture), [ok, setOk] = useState<string | null>(null), [ignorer, setIgnorer] = useState<Op | null>(null), [note, setNote] = useState(''), [envoi, setEnvoi] = useState(false);
  if (!D) return <div className="bandeau erreur" role="alert">{bandeau}</div>;
  const M = D.mois, a = D.operations.length;
  async function rpc(p: object, msg: string) {
    setEnvoi(true); setBandeau(null); setOk(null);
    const { error } = await supabaseNavigateur().rpc('lanceur_rapprocher', { p });
    setEnvoi(false); if (error) return setBandeau(error.message); setOk(msg); setIgnorer(null); router.refresh();
  }
  return (
    <>
      {bandeau && <div className="bandeau erreur" role="alert">{bandeau}</div>}
      {ok && <div className="bandeau info" role="status">{ok}</div>}
      <div className="grille-2-1">
        <section className="carte-l18 e2" aria-label="Opérations à rapprocher">
          <div className="tete-action" style={{ alignItems: 'flex-start' }}><div><p className="surtitre" style={{ margin: 0 }}>{D.comptes.length ? `Comptes : ${D.comptes.join(', ')}` : 'Comptes bancaires des propriétaires'}</p>
            <h2 className="releve-titre" style={{ margin: '4px 0' }}>{a ? `${a} opération${a > 1 ? 's' : ''} à rapprocher` : 'Tout est rapproché.'}</h2>
            <p className="gris texte-13" style={{ margin: 0 }}>{D.dernier_import ? `Dernier relevé importé le ${jour(D.dernier_import)}` : 'Aucun relevé importé : la synchronisation bancaire est à rebrancher'}{a ? ' · Cléo propose une correspondance pour chacune' : ''}</p></div>
            <div style={{ width: 260 }}><p className="surtitre gris" style={{ margin: 0 }}>Rapprochées ce mois-ci</p><b style={{ fontSize: 24 }}>{M.rapprochees} sur {M.total}</b>
              <span className="jauge" style={{ display: 'block', margin: '8px 0 4px' }}><i style={{ width: `${M.total ? (100 * M.rapprochees) / M.total : 0}%` }} /></span>
              <span className="gris texte-12">{M.total ? `${String(Math.round((1000 * M.rapprochees) / M.total) / 10).replace('.', ',')} %` : '—'} · {a} attendent votre décision</span></div></div>
          <ul className="ops">{D.operations.map((o) => { const s = o.suggestion, p = s?.paiement;
            return <li key={o.id}><div><p className="surtitre gris" style={{ margin: 0 }}>{jour(o.date)} · opération bancaire</p><b className="montant">{o.montant > 0 ? '+' : '−'}{argent(Math.abs(o.montant), true)}</b>
              <span className="texte-13" style={{ color: '#3E4A59' }}>{o.description}</span><span className="gris texte-12">{o.ref ? `Réf. ${o.ref}` : o.proprietaire}</span>
              {o.anomalie && <Link className="lien texte-12" href="/finances/anomalies">Voir l’anomalie</Link>}</div>
              <Icone nom="arrow" taille={20} couleur="#A6B1BE" />
              <div><p className="surtitre" style={{ margin: 0 }}><Icone nom="spark" taille={14} couleur="#2E5788" /> Suggestion de Cléo</p>
                {p ? <><strong>Loyer · {s!.locataire}</strong><span className="gris texte-13">{p.logement} · {argent(p.montant, true)} attendus le {jour(p.echeance)}</span></>
                  : <><strong>{s ? s.locataire : 'Aucune correspondance trouvée'}</strong><span className="gris texte-13">{s ? 'Aucun loyer impayé pour ce locataire' : o.note ?? 'À rapprocher à la main'}</span></>}
                {o.confiance != null && <span className="texte-12"><b>{Math.round(o.confiance)} % de confiance</b>{o.note ? <span className="gris"> · {o.note}</span> : p && Math.abs(Number(p.montant) - o.montant) > 0.01 ? <span className="gris"> · écart de {argent(Math.abs(Number(p.montant) - o.montant), true)}</span> : null}</span>}</div>
              {D.peut_ecrire && <div className="ops-actions"><button className="bouton bouton-principal" disabled={envoi || !p} onClick={() => rpc({ id: o.id, payment_id: p!.id }, 'Opération rapprochée; le loyer est inscrit.')}>Rapprocher</button>
                <button className="bouton bouton-contour" onClick={() => { setNote(''); setIgnorer(o); }}>Ignorer</button>
                <Link className="lien texte-13" href="/finances/comptabilite">Créer une écriture</Link></div>}</li>; })}</ul>
        </section>
        <div className="po-colonne">
          <section className="carte-l18" aria-label="Règles de rapprochement"><h2 className="titre-carte" style={{ marginBottom: 2 }}>Règles de rapprochement automatique</h2><p className="gris texte-13" style={{ margin: '0 0 12px' }}>Appliquées à chaque import du relevé</p>
            <ul className="lo-docs">{REGLES.map(([t, s, on]) => <li key={t}><div><strong>{t}</strong><span className="gris texte-13">{s}</span></div><span className={`puce ${on ? 'info' : 'neutral'}`}>{on ? 'Active' : 'Personne'}</span></li>)}</ul>
            <p className="ligne-ic gris texte-13"><Icone nom="shieldc" taille={18} couleur="#58697F" />Sous 95 % de confiance, une personne décide.</p></section>
          <section className="carte-l18" aria-label="Qui rapproche"><h2 className="titre-carte" style={{ marginBottom: 2 }}>{M.rapprochees ? `Les règles font ${Math.round((100 * M.regles) / M.rapprochees)} % du travail` : 'Qui rapproche'}</h2>
            <p className="gris texte-13" style={{ margin: '0 0 16px' }}>Ce mois-ci · {M.rapprochees} opérations rapprochées</p>
            <BarresClassees lignes={[{ libelle: 'Règles automatiques', valeur: M.regles, texte: String(M.regles) }, { libelle: 'Décidées par une personne', valeur: M.personnes, texte: String(M.personnes) }]} />
            <p className="gris texte-12">Chaque proposition de Cléo est approuvée par une personne.</p></section>
        </div>
      </div>
      {ignorer && <div className="voile" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setIgnorer(null)}>
        <form className="fenetre" role="dialog" aria-modal="true" aria-labelledby="ig-t" style={{ width: 440 }} onSubmit={(e) => { e.preventDefault(); rpc({ id: ignorer.id, decision: 'ignorer', note }, 'Opération ignorée.'); }}>
          <h2 id="ig-t" style={{ marginTop: 0, fontSize: 20 }}>Ignorer {argent(Math.abs(ignorer.montant), true)} du {jour(ignorer.date)}?</h2>
          <label className="fenetre-lib" htmlFor="ig-n">Pourquoi (inscrit au journal)</label><input id="ig-n" className="e70-raison" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : virement entre comptes du propriétaire" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}><button type="button" className="bouton bouton-contour" style={{ width: 'auto', padding: '0 20px' }} onClick={() => setIgnorer(null)}>Annuler</button>
            <button className="bouton bouton-principal" style={{ width: 'auto', padding: '0 20px' }} disabled={envoi || note.trim().length < 3}>Ignorer</button></div>
        </form></div>}
    </>
  );
}
